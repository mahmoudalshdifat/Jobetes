---
name: backend-api
description: Handle backend API, database, auth, Prisma schema, route changes, and server logic changes for the Jobetes project. Use when the user asks to add or modify API endpoints or routes, change database schemas, update auth logic, modify server-side business logic, add Supabase edge functions, update validation schemas, modify data persistence, or any backend data/API changes. Covers apps/api, supabase/functions, supabase/migrations, and packages/shared-schemas. This skill is backend-only; if frontend UI components, styling, or React code changes are needed, delegate to the frontend-styling skill after completing backend work.
---

# Backend API

## Scope

This skill handles backend changes across the Jobetes project:
- `apps/api` — Fastify Node.js API (reference implementation)
- `supabase/functions` — Deno edge functions (Phase 0 live backend)
- `supabase/migrations` — Database migrations and RLS policies
- `packages/shared-schemas` — Zod validation schemas shared across frontend and backend

**Boundary**: Backend-only. Do NOT modify React components, Tailwind classes, CSS, or frontend routing.

## Tech Stack

- **API**: Fastify 5 + TypeScript + Node 20
- **Edge functions**: Deno + Supabase Functions
- **Database**: PostgreSQL via Prisma ORM (Phase 1) / In-memory (Phase 0)
- **Auth**: Supabase Auth with JWT verification via JWKS
- **Validation**: Zod (shared in `packages/shared-schemas`)
- **Observability**: Pino logging, Sentry, request IDs
- **Docs**: OpenAPI 3.1 + Swagger UI

## References

- **Architecture & deployment**: [references/architecture.md](references/architecture.md)
- **Database schema**: [references/database-schema.md](references/database-schema.md)
- **API patterns & testing**: [references/api-patterns.md](references/api-patterns.md)

## Workflow

1. **Identify the change type**:
   - **New endpoint**: Add route handler in `apps/api/src/routes/`, register in `apps/api/src/app.ts`, and add Zod schema in `packages/shared-schemas/src/` if the payload is shared with frontend.
   - **Schema change**: Update `apps/api/prisma/schema.prisma`, run `pnpm db:migrate:dev`, update Prisma client with `pnpm prisma:generate`.
   - **Edge function**: Add/modify `supabase/functions/<name>/index.ts`. Keep the contract identical to the Fastify route when both exist.
   - **Validation change**: Update Zod schemas in `packages/shared-schemas/src/` first; both frontend and backend consume them.
   - **Path naming**: Fastify routes use nested paths (`/doctor/profile`, `/ai/triage`, `/me/intakes`). Edge functions use flat paths (`/doctor-profile`, `/triage`, `/me-intakes`). When adding endpoints consumed by the frontend, update both path styles in `apps/web/src/lib/api-client.ts`.
2. **Maintain dual backends**: If modifying an API route that has a Supabase edge function equivalent, update both to keep contracts identical.
3. **Auth**: Use `requireAuth(request)` for protected routes. Public routes skip auth. Admin routes (`/admin/*`) additionally check `DOCTOR_SUPABASE_USER_IDS` env allowlist and return `404` for non-doctors.
4. **Validation**: Use `.safeParse()` on request bodies and return `400` with structured error details.
5. **Persistence**: Use the `IntakeRepo` interface pattern. Add repo methods in `apps/api/src/persistence/types.ts` and implement in both `in-memory-repo.ts` and `prisma-repo.ts`.
6. **Logging**: Use `request.log.info|warn|error()` or the Pino logger. Never log PII.
7. **Security headers**: Helmet enforces strict CSP, HSTS, referrer policy, and framing rules. Do not weaken these without checking `apps/api/src/security.test.ts`.
8. **Tests**: Add co-located `.test.ts` files. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` in `apps/api`.
9. **Frontend needed?** If the change requires UI updates, invoke the `frontend-styling` skill after backend work is complete. See **Cross-skill delegation** below.

## Cross-skill delegation

This skill is **backend-only**. If you encounter any of the following during a task, you must delegate to the `frontend-styling` skill:
- React components need new props or rendering logic
- Tailwind CSS classes or design tokens need changes
- New UI components need to be created
- Frontend routing or page structure needs updates
- Responsive design or accessibility needs adjustment

**How to delegate**: After completing all possible backend work, explicitly state: *"This change also requires frontend UI work. I am now loading the `frontend-styling` skill to handle the visual changes."* Then proceed using the frontend-styling skill's workflow and references.

## Quick Reference

### File locations
- API entry: `apps/api/src/server.ts`
- App builder: `apps/api/src/app.ts`
- Routes: `apps/api/src/routes/` — includes `health`, `doctor`, `intake`, `appointment`, `me`, `admin`, `triage`
- Auth: `apps/api/src/auth.ts`
- Config: `apps/api/src/config.ts`
- Persistence: `apps/api/src/persistence/`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Shared schemas: `packages/shared-schemas/src/`
- Edge functions: `supabase/functions/`

### Environment variables (see `apps/api/src/config.ts`)
Key vars: `DATABASE_URL`, `SUPABASE_URL`, `GEMINI_API_KEY`, `NOTIFY_WEBHOOK_URL`, `CORS_ORIGIN`, `SENTRY_DSN`

### Scripts
- `pnpm dev` — tsx watch
- `pnpm prisma:generate` — regenerate Prisma client
- `pnpm db:migrate:dev` — create/apply migrations
- `pnpm db:reset` — reset database
- `pnpm test` — vitest
