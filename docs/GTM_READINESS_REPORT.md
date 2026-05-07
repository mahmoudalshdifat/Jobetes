# Jobetes — Go-To-Market Readiness Report

**Date:** 2026-05-06
**Scope:** Full-stack audit across frontend, backend, database, compliance, infrastructure, and testing.
**Verdict:** Strong Phase-0 foundation. **11 hard blockers** must be resolved before public launch.

---

## Executive Summary

| Area | Status | Blockers |
|------|--------|----------|
| **Frontend (Patient)** | 🟡 6 pages, solid design system | 5 hard blockers |
| **Frontend (Doctor/Admin)** | 🟡 Basic dashboards, no detail views | 4 hard blockers |
| **Backend API** | 🟡 Well-structured, secure headers | 3 critical security/data issues |
| **Database** | 🔴 Phase 0 — in-memory only | 4 hard blockers |
| **Compliance/Legal** | 🟡 Excellent documentation framework | 11 critical legal gaps |
| **Infrastructure/CI-CD** | 🟡 GitHub Actions + Fly.io + Pages | 3 operational gaps |
| **Testing** | 🟢 69 test files, E2E suite | Some E2E flakiness on mobile |

**Overall Assessment:** This is a well-architected Phase-0 prototype with unusually strong compliance documentation for a pre-launch product. However, it is still a **prototype** — patient data lives in memory (lost on restart), legal documents are placeholders, and several GDPR/Jordan PDPL requirements are unimplemented.

---

## 🔴 Hard Blockers — Must Fix Before Launch

### 1. Legal Documents Are Placeholders
| Issue | Location | Fix |
|-------|----------|-----|
| Privacy Policy & Terms show preview disclaimer | `LegalPage.tsx` | Replace placeholder text with final legal copy |
| No standalone Terms of Service markdown | `docs/legal/` | Create `en/terms.md`, `de/terms.md`, `ar/terms.md` |
| No Imprint/Impressum standalone document | `docs/legal/` | Create standalone imprint markdown |
| Retention period mismatch | Privacy policy says 10 years, Records of Processing says 24 months | Align and document the final retention policy |

### 2. Testimonials Are Fictional
| Issue | Location | Fix |
|-------|----------|-----|
| Placeholder patient quotes | `Testimonials.tsx` | Replace with real, consented quotes OR remove entirely for launch |

### 3. No Persistent Database (Phase 0)
| Issue | Impact | Fix |
|-------|--------|-----|
| All intakes stored in-memory unless `DATABASE_URL` is set | Data lost on every deploy/restart | **Phase 1: Deploy Postgres, run Prisma migrate, set `DATABASE_URL`** |
| Appointments stored in module-level `Map` | All appointment requests lost on restart | Migrate `appointments` to Prisma + Postgres |
| No Prisma migration baseline | Cannot reproduce schema on fresh DB | Generate `prisma migrate dev --name init` |
| No `CREATE TABLE` statements in migrations | `supabase/migrations/jobetes_rls_policies.sql` assumes tables exist | Add baseline migration or use Prisma for schema creation |

### 4. Row Level Security (RLS) Unapplied
| Issue | Impact | Fix |
|-------|--------|-----|
| RLS policies exist in SQL but are NOT applied to Supabase | Anonymous Supabase key can read patient data | Apply `jobetes_rls_policies.sql` to production Supabase project |
| Missing `INSERT/UPDATE/DELETE` policies | Patients can't update own profile via authenticated client | Add write policies for authenticated role |
| `AuditLog` has NO RLS policies | Service-role compromise = full audit exposure | Add service-role-only policy or restrict at application layer |

### 5. No Patient Portal
| Issue | Impact | Fix |
|-------|--------|-----|
| Login exists but leads nowhere | Auth flow is functionally useless | Build `/me` dashboard: view intakes, appointments, profile |
| `JobetesApiClient` has `me()`, `myIntakes()`, `claimByPhone()` — unused | Dead code / unrealized feature | Wire up patient portal to existing backend routes |

### 6. No Doctor Patient Detail View
| Issue | Impact | Fix |
|-------|--------|-----|
| Doctor sees only ID + severity + locale in queue | Cannot diagnose without symptoms, medications, contact info | Build patient detail modal/page: full intake payload, triage results, contact |

### 7. No Appointment Management Flow
| Issue | Impact | Fix |
|-------|--------|-----|
| Appointments are fire-and-forget | Patients can't track status; doctors can't confirm | Add status tracking: `requested` → `confirmed` → `completed` |
| No doctor appointment UI | Doctor sees count only | Build appointment list with confirm/reschedule/cancel actions |

### 8. Compliance: Missing Core Legal Infrastructure
| Issue | Regulation | Fix |
|-------|------------|-----|
| No Cookie Policy + Cookie Consent Banner | GDPR ePrivacy Directive | Add cookie banner; create `docs/legal/cookie-policy.md` |
| No Consent Withdrawal mechanism | GDPR Art. 7(3) + Jordan PDPL | Add UI checkbox + API endpoint `POST /me/withdraw-consent` |
| No Data Subject Rights API routes | GDPR Arts. 15–22 | Implement: access export, rectification, erasure (Art. 17), portability (Art. 20) |
| Signed DPAs with sub-processors | GDPR Art. 28 | Execute DPAs with Netlify/Fly.io/Google; file in `compliance/executed/` |
| §203 StGB confidentiality undertakings | German criminal law | Get signed sub-processor NDAs; hospital staff NDAs; document in compliance folder |
| Jordanian local counsel PDPL review | Jordan PDPL 2023 | Commission Jordanian lawyer; file review memo |
| Formal DPO appointment | GDPR Art. 37 | Appoint DPO; document in `compliance/DPO_APPOINTMENT.md` |
| Finalized and signed DPIA | GDPR Art. 35 | Complete `DPIA_SKELETON.md`; get controller + counsel + DPO signatures |

### 9. Admin-Summary Edge Function Bug
| Issue | Impact | Fix |
|-------|--------|-----|
| Selects `preferredLocale` from `Intake` table (column doesn't exist) | Locale always `null` in dashboard | Join `Patient` table: `Intake.patient.preferredLocale` |

### 10. CORS Wildcard on Edge Functions
| Issue | Impact | Fix |
|-------|--------|-----|
| Edge functions allow `*` origin | Bypasses API CORS restrictions | Restrict to `jobetes.diggai.de` and `localhost` in Supabase Function settings |

### 11. Security: Gemini API Key in Query Parameter
| Issue | Impact | Fix |
|-------|--------|-----|
| `triage` edge function sends `?key=...` in URL | API key leaks in server logs, HTTP proxies | Move to `Authorization` header or use provider abstraction |

---

## 🟡 High Priority — Strongly Recommended Before Launch

### Frontend
| # | Issue | Fix |
|---|-------|-----|
| 1 | Admin & Doctor portals have no routing (single-view state machine) | Add hash-based routing for login → dashboard → patient-detail |
| 2 | Admin console is English-only | Add i18n (ar/de/en) to admin |
| 3 | Doctor portal is English/German mixed, no Arabic | Add Arabic translations for Jordanian staff |
| 4 | No Modal/Dialog component | Build reusable `Dialog` in `@jobetes/ui` |
| 5 | No reusable DataTable component | Extract table from admin/doctor into `@jobetes/ui/DataTable` |
| 6 | Appointment form uses raw `<input>` instead of design-system components | Refactor to use `@jobetes/ui` `Input`, `Textarea`, `Field` |
| 7 | No DatePicker/Calendar for appointment booking | Build or integrate a calendar component |
| 8 | No patient voice memo upload (translations exist) | Build `VoiceRecorder` component or remove translations |
| 9 | `nav.learn` translation exists but no route/page | Either build education page or remove nav item |

### Backend
| # | Issue | Fix |
|---|-------|-----|
| 1 | No API versioning (`/v1/...`) | Prefix routes or accept versioning in `Accept` header |
| 2 | Doctor allowlist in env var (`DOCTOR_SUPABASE_USER_IDS`) | Move to database table for runtime updates without redeploy |
| 3 | No file upload security (needed for future medical attachments) | Plan virus scanning, size limits, encryption at rest |
| 4 | Intake edge function is not atomic | Wrap Patient→Consent→Intake→AuditLog in Supabase RPC transaction |
| 5 | No audit log for data reads/exports/deletions | Add `intake.read`, `patient.read`, `patient.deleted` events |

### Database
| # | Issue | Fix |
|---|-------|-----|
| 1 | No `updatedAt` on Intake, Consent, Triage, Message, AuditLog | Add `@updatedAt` columns |
| 2 | No soft deletes (`deletedAt`) | Add for GDPR recovery scenarios |
| 3 | No DB-level `CHECK` constraints | e.g., `severity BETWEEN 0 AND 10` |
| 4 | No composite index on `Triage(urgency, createdAt)` | Add for dashboard filtering |
| 5 | No backup/restore runbooks | Document in `docs/ops/` |
| 6 | Minimal seed data | Create realistic dev seeds for testing |

### Infrastructure
| # | Issue | Fix |
|---|-------|-----|
| 1 | No staging environment | Create `staging` Fly app + separate Supabase project |
| 2 | No monitoring/alerting beyond Sentry | Add UptimeRobot or Pingdom for `jobetes.diggai.de` and API |
| 3 | No backup automation scripts | Add `scripts/backup.sh` using `pg_dump` |
| 4 | `deploy-web.yml` (Netlify) exists but unused | Remove or repurpose; Pages is the active path |

---

## 🟢 What's Working Well

### Architecture & Code Quality
- **Clean monorepo** with pnpm workspaces, shared packages, and consistent tooling
- **Prisma schema** is well-designed with GDPR data residency (EU), encryption-at-rest notes, and proper indexes
- **Security headers** via `@fastify/helmet` with strict CSP, HSTS, referrer policy
- **Tiered rate limiting** (120/min global, 10/min for AI triage)
- **PII-redacted logging** — names, DOB, phone, email, auth headers are redacted
- **Zod validation** on all API inputs and shared schemas
- **Structured logging** with request timing and status codes
- **Health checks** (`/health`, `/ready`) with DB ping
- **Compression** (Brotli + Gzip) enabled
- **OpenAPI** documentation generated automatically

### Frontend Design System
- **18 shared UI components** with dark mode, RTL Arabic support, and accessibility
- **Theme toggle** (light/dark/system) with `localStorage` persistence
- **Mobile-responsive** navigation with hamburger menu
- **Toast notification system** integrated across all apps
- **Skeleton loading** with shimmer animation
- **Complete i18n** (200 keys × 3 languages) with lint enforcement

### Compliance Documentation
- **8 compliance documents** covering GDPR Art. 30, DPIA skeleton, DPA template, Jordan PDPL, ISO 27001, AI Act, §203 StGB
- **Privacy policy** in all 3 languages (EN/DE/AR)
- **Consent schema** with granularity, locale tracking, version tracking
- **Security.md** with breach notification procedures
- **Non-diagnostic boundary** clearly documented (keeps project outside MDR territory)

### CI/CD
- **GitHub Actions** for Pages (web+doctor+admin), API (Fly.io), and Supabase Edge Functions
- **Lighthouse CI** for performance monitoring
- **Dependabot** configured

### Testing
- **69 test files** across unit, integration, and E2E
- **Playwright E2E** with chromium + mobile-arabic (Pixel 5) projects
- **a11y tests** via axe-core

---

## Recommended Launch Sequence

### Phase 0.5 — Soft Launch (Friends & Family)
**Goal:** Validate core intake flow with real patients, no public marketing.

1. ✅ Fix `admin-summary` edge function column bug
2. ✅ Apply RLS policies to Supabase
3. ✅ Deploy Postgres + run Prisma migrations
4. ✅ Replace fictional testimonials with real quotes OR remove them
5. ✅ Write final Terms of Service (EN/DE/AR)
6. ✅ Update LegalPage with final legal copy
7. ✅ Add cookie consent banner + cookie policy
8. ✅ Fix CORS wildcard on edge functions
9. ✅ Move Gemini API key to header

### Phase 1 — Public Launch (Jordan Primary)
**Goal:** Full patient acquisition in Jordan.

10. ✅ Build Patient Portal (`/me` dashboard)
11. ✅ Build Doctor Patient Detail View
12. ✅ Build Appointment Confirmation Flow
13. ✅ Add consent withdrawal mechanism
14. ✅ Add Data Subject Rights API (export, rectification, erasure)
15. ✅ Execute signed DPAs with sub-processors
16. ✅ Get §203 StGB confidentiality undertakings signed
17. ✅ Commission Jordanian PDPL legal review
18. ✅ Appoint DPO
19. ✅ Finalize and sign DPIA
20. ✅ Add staging environment
21. ✅ Add backup automation + runbooks

### Phase 2 — Scale & Certification
**Goal:** ISO 27001 certification, multi-doctor support, payment integration.

22. ISO 27001 certification process
23. Multi-doctor support (beyond single allowlist)
24. Payment/invoicing flow
25. Video consultation integration
26. Full audit trail read endpoint for compliance officers

---

## Quick Reference: Test Counts

| Layer | Count |
|-------|-------|
| API unit tests | 12 |
| Web app unit tests | 14 |
| Admin unit tests | 2 |
| Doctor unit tests | 2 |
| Package tests | 31 |
| E2E tests | 6 |
| **Total** | **69** |

---

## Quick Reference: API Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /health` | None | Liveness probe |
| `GET /ready` | None | Readiness (DB ping) |
| `GET /doctor/profile` | None | Static doctor profile |
| `POST /intake` | None | Submit patient intake |
| `GET /intake/:id` | None | Retrieve intake by ID |
| `POST /appointments` | None | Request appointment |
| `GET /appointments/:id` | None | Get appointment status |
| `POST /ai/triage` | None | AI triage (rate-limited) |
| `GET /me` | Bearer JWT | Get authenticated user |
| `GET /me/intakes` | Bearer JWT | List patient intakes (paginated) |
| `POST /me/claim` | Bearer JWT | Link auth user to patient by phone |
| `GET /admin/intakes` | Bearer JWT + doctor allowlist | Admin intake list (paginated) |
| `GET /admin/intakes/summary` | Bearer JWT + doctor allowlist | Aggregate counts |

---

*Report generated by automated codebase audit. Last updated: 2026-05-06.*
