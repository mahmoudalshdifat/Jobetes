# Changelog

All notable changes to Jobetes / Jordan-Health-App. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); semver since 0.2.0.

## [0.2.0] — 2026-05-04

Phase-0 hardening + Phase-1 readiness, in 19 iterations across one agent day.

### Added

- **Patient self-service auth**: Supabase magic-link OTP, `AuthContext` + `useAuth`, `LoginPage`.
- **Patient↔user linking**: `Patient.supabaseUserId @unique` column + idempotent `POST /me/claim`.
- **Patient-scoped self-service**: `GET /me`, `GET /me/intakes` (Prisma joins via `supabaseUserId`).
- **Doctor admin scaffold**: `GET /admin/intakes/summary` (DOCTOR_SUPABASE_USER_IDS allowlist).
- **Appointment booking**: `AppointmentRequestSchema` (Zod), `POST/GET /appointments`, FE wizard.
- **OpenAPI 3.1**: `@fastify/swagger` with `/documentation/json` + Swagger UI at `/docs` (non-prod).
- **Typed API client** (web): `JobetesApiClient` over native fetch; `ApiError` with status+body.
- **Persistence abstraction**: `IntakeRepo` interface with in-memory + Prisma adapters keyed on `DATABASE_URL`.
- **Prisma schema**: `Patient`, `Intake`, `Consent`, `Triage`, `Appointment`, `Message`, `AuditLog` with `onDelete: Cascade` for GDPR Art. 17.
- **Observability**: Sentry (web + api), Pino PII-redacted logger, `X-Request-Id` middleware, web-vitals RUM.
- **Security headers**: HSTS preload (2y), COEP, CSP with `base-uri 'self'`, Referrer-Policy, X-Forwarded-For-aware rate-limit.
- **Deploy automation**: `deploy-web.yml` (Netlify), `deploy-api.yml` (Fly), Lighthouse-CI workflow, audit job.
- **Performance budget**: 130 KB initial gzip ceiling enforced in CI (currently 104.74).
- **Compliance pack**: GDPR Records of Processing, DPIA skeleton, DPA template, Jordan PDPL 2023 checklist, ISO 27001 Annex A mapping, EU AI Act risk assessment, §203 StGB risk matrix.
- **Tri-lingual privacy**: Privacy/Terms/Imprint stubs in AR, DE, EN — programmatically parity-tested in i18n.
- **Telegram operator bot**: voice/text → STT → prompt-enhancer → CLI-Anything; allowlist-only, codespace wakeup.

### Changed

- Bumped all workspace packages to **0.2.0**.
- Coverage thresholds raised: operator-bot 70 % → **80 %** (now at 99 %); api 70 % → **75 %**.
- CSP tightened: `base-uri 'self'`, `form-action 'self'`, COEP `require-corp`.
- Rate-limit window: 60 → 120 req/min with X-Forwarded-For-aware key generator.

### Fixed

- Fastify v5 logger types (`loggerInstance` → `logger: options`) for `module: NodeNext` build.
- Vite `build.target: 'es2022'` for top-level await in i18n init.
- pnpm workspace binary hoisting via `pnpm exec` in subpackage scripts.
- ESLint `consistent-type-imports` blocking `import('react').ReactElement` ambient declarations.

### Quality gates (final)

- **159/159 tests** across 7 packages
- **Coverage**: shared-schemas / i18n / ai-gemini at 100 %; operator-bot 99 %; api 95 %; ui 79 %; web 49 %
- **Bundle**: 104.74 KB initial gzip (budget 130)
- **Endpoints**: 12 (was 7 at start)
- **Workflows**: 4 (ci, e2e/lighthouse via web-changes, deploy-web, deploy-api)
- **ADRs**: 6
- **Security headers**: 9
- **Run logs**: 12 in `memory/runs/`

## [0.1.0] — 2026-05-04 (initial bootstrap)

- Monorepo bootstrap (pnpm + Turborepo + 8 workspaces)
- Vite + React + i18n RTL + intake wizard
- Fastify API with health, doctor, intake, ai/triage routes
- Compliance pack + tri-lingual privacy
- Netlify + Fly + GH Actions CI scaffolding
- OPUS_4_7_HANDOFF + Obsidian draft + run-log discipline
