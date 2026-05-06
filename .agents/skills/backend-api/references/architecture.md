# Backend Architecture

## Phase 0 vs Phase 1

| Phase | Persistence | Deployment |
|-------|-------------|------------|
| Phase 0 | In-memory (`InMemoryIntakeRepo`) | Supabase Edge Functions (live) |
| Phase 1 | Postgres via Prisma (`PrismaIntakeRepo`) | Fly.io (Node + Fastify) |

The app boots into Phase 0 when `DATABASE_URL` is empty. When set, it uses Prisma. The API routes never know which repo backs them.

## Fastify App Structure

```
server.ts          → bootstraps buildApp() and listens
app.ts             → registers plugins, auth, routes
auth.ts            → Supabase JWT verification + requireAuth()
config.ts          → Zod-validated env loader
openapi.ts         → Swagger / OpenAPI 3.1 setup
logger.ts          → Pino configuration
observability.ts   → Sentry + error handler
request-id.ts      → Request ID attachment
```

### Plugin registration order (in `app.ts`)
1. Helmet (CSP, HSTS, referrer policy)
2. CORS
3. Rate limit (120 req/min, IP-based)
4. Sensible (http-errors)
5. Request ID
6. OpenAPI
7. Auth (JWT preHandler hook)
8. Routes

## Repository Pattern

All persistence goes through the `IntakeRepo` interface:

```ts
interface IntakeRepo {
  readonly kind: 'memory' | 'prisma';
  create(data: PatientIntake): Promise<IntakeRecord>;
  findById(id: string): Promise<IntakeRecord | null>;
  count(): Promise<number>;
  findByUser(supabaseUserId: string): Promise<IntakeRecord[]>;
  claimByPhone(supabaseUserId: string, phone: string): Promise<string | null>;
  close(): Promise<void>;
}
```

Add new repo methods to `types.ts`, then implement in both:
- `in-memory-repo.ts` — Map-based, ephemeral
- `prisma-repo.ts` — Prisma Client queries

## Auth

Supabase access tokens verified against JWKS at:
```
${SUPABASE_URL}/auth/v1/.well-known/jwks.json
```

In mock mode (`SUPABASE_URL` empty), auth no-ops and protected routes return `401`.

Use the guard helper in route handlers:
```ts
const user = await requireAuth(request);
```

The `request.user` object contains `supabaseUserId` and optional `email`.

### Doctor allowlist

Admin routes (`/admin/*`) check `process.env.DOCTOR_SUPABASE_USER_IDS` (comma-separated UUIDs). Non-doctors receive `404` (not `403`) to avoid leaking route existence.

```ts
function requireDoctor(supabaseUserId: string): boolean {
  const ids = new Set(
    (process.env.DOCTOR_SUPABASE_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return ids.has(supabaseUserId);
}
```

## Edge Functions (Deno)

Each function is a standalone Deno script using `Deno.serve()`.

Required CORS headers for all responses:
```ts
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Service-role key is used for database writes past RLS:
```ts
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
```

Deploy via Supabase MCP tool or CLI:
```bash
supabase functions deploy <names> --project-ref kzzihkwkhnnoixgogxzj
```
