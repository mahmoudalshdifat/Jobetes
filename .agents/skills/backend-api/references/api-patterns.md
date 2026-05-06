# API Patterns

## Route Registration

Routes are registered as async functions that receive `FastifyInstance`:

```ts
export async function registerMyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/my-route', async (request, reply) => {
    return { ok: true };
  });
}
```

Then imported and called in `apps/api/src/app.ts`.

### Dual path system

The frontend `JobetesApiClient` supports two transports with different path conventions:

| Endpoint | Fastify path | Edge function path |
|----------|-------------|-------------------|
| Health | `/health` | `/health` |
| Doctor profile | `/doctor/profile` | `/doctor-profile` |
| Intake | `/intake` | `/intake` |
| Triage | `/ai/triage` | `/triage` |
| Me | `/me` | `/me` |
| My intakes | `/me/intakes` | `/me-intakes` |
| Claim | `/me/claim` | `/me-claim` |

When adding a new endpoint consumed by the frontend, update both path styles in `apps/web/src/lib/api-client.ts`.

## Request Validation

Always use Zod `.safeParse()` and return structured errors:

```ts
const parsed = MySchema.safeParse(request.body);
if (!parsed.success) {
  return reply.status(400).send({
    error: 'invalid_request',
    issues: parsed.error.issues,
  });
}
```

Shared schemas live in `packages/shared-schemas/src/`. Update them when the contract changes — both frontend and backend consume them.

## Error Handling

- Use `request.log.error({ err }, 'message')` for server errors
- Return generic `500` messages to clients: `{ error: 'persistence_unavailable' }`
- Never leak stack traces or internal details to clients
- The observability layer in `observability.ts` attaches a global error handler

## Fire-and-Forget Webhooks

Notification webhooks must never block the client response:

```ts
async function notifyWebhook(url: string, event: string, payload: object, log): Promise<void> {
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) log.warn({ webhookStatus: res.status }, 'webhook non-ok');
  } catch (err) {
    log.warn({ err }, 'webhook failed (swallowed)');
  }
}

// In handler:
void notifyWebhook(webhookUrl, 'my.event', data, request.log);
return reply.status(201).send(record);
```

## Testing

Tests use `buildApp()` with overridden config:

```ts
import { buildApp } from './app.js';

const app = await buildApp({
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  SUPABASE_URL: '', // mock auth mode
});

// Use app.inject() for HTTP-level tests
const res = await app.inject({ method: 'GET', url: '/health' });
expect(res.statusCode).toBe(200);

await app.close();
```

### Bypassing auth in tests

Inject a pre-verified user directly via a hook:
```ts
app.addHook('preHandler', async (request) => {
  request.user = { supabaseUserId: 'test-user-id', email: 'test@example.com' };
});
```

### Stubbing env vars in tests

Use `vi.stubEnv()` for env-dependent behavior like doctor allowlists:
```ts
vi.stubEnv('DOCTOR_SUPABASE_USER_IDS', 'test-doctor-id');
// ... tests ...
vi.unstubAllEnvs();
```

## Edge Function Pattern

Keep edge functions minimal and mirror the Fastify route contract:

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  // ... handler
});
```

## OpenAPI Tagging

Tag routes for documentation grouping:
- `public` — Unauthenticated
- `intake` — Patient intake
- `ai` — Triage / AI
- `me` — Authenticated patient self-service
