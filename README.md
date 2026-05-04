# Jobetes — Jordan-Health-App

[![ci](https://github.com/mahmoudalshdifat/Jobetes/actions/workflows/ci.yml/badge.svg)](https://github.com/mahmoudalshdifat/Jobetes/actions/workflows/ci.yml)
[![tests](https://img.shields.io/badge/tests-159%2F159-brightgreen)](#)
[![coverage-shared-schemas](https://img.shields.io/badge/shared--schemas-100%25-brightgreen)](#)
[![coverage-i18n](https://img.shields.io/badge/i18n-100%25-brightgreen)](#)
[![coverage-ai-gemini](https://img.shields.io/badge/ai--gemini-100%25-brightgreen)](#)
[![coverage-operator-bot](https://img.shields.io/badge/operator--bot-99%25-brightgreen)](#)
[![bundle-gzip](https://img.shields.io/badge/bundle%20gzip-104.74%20KB-brightgreen)](#)
[![version](https://img.shields.io/badge/version-0.2.0-blue)](#)

Cross-border telemedicine portal so **Dr. Mahmoud Al-Shdaifat** (Oberarzt für Innere Medizin & Gastroenterologie, [St. Anna Hospital Herne](https://www.annahospital.de/klinik-fuer-gastroenterologie/team.html)) can serve Arabic-speaking patients in Jordan with the same quality he offers in Germany.

> ⚠️ Phase 0 is intentionally **non-diagnostic**. Jobetes does not replace medical diagnosis. In emergencies dial **112** (Germany) or **911** (Jordan).

Reference upstream: <https://github.com/DiggAiHH/Jordan-Health-App.git>

---

## What's in this repo

```
Jobetes/
├── apps/
│   ├── web/               # Vite + React + TS + Tailwind — patient frontend (Netlify)
│   ├── api/               # Fastify + TS — backend API (Fly.io fra)
│   └── operator-bot/      # Telegram → Codespace → STT → Prompt-Enhancer → CLI-Anything
├── packages/
│   ├── ui/                # RTL-aware design system
│   ├── ai-gemini/         # Gemini provider abstraction with mock-fallback
│   ├── i18n/              # AR (RTL) / DE / EN translation strings
│   ├── shared-schemas/    # Zod schemas shared FE/BE
│   └── eslint-config/     # Shared lint rules
├── compliance/            # GDPR, Jordan PDPL 2023, ISO 27001, AI Act
├── docs/
│   ├── DEPLOY.md          # 5-step doctor-facing deploy guide
│   ├── agent/             # OPUS_4_7_HANDOFF, OBSIDIAN_DRAFT, run-log template
│   ├── architecture/      # ADRs (6)
│   └── legal/             # Privacy, ToS, Impressum (DE/EN/AR)
├── e2e/                   # Playwright (chromium + mobile-arabic)
├── memory/runs/           # 5-line run logs (Hauptregel)
└── tokens/                # Design tokens
```

## Quickstart

```bash
# 1. Install
corepack enable && pnpm install

# 2. Copy env (Phase 0 works without secrets via mock providers)
cp .env.example .env

# 3. Dev (web + api in parallel)
pnpm dev

# 4. Single-command quality gate
pnpm doctor    # typecheck + lint + test + build
pnpm coverage  # per-package coverage with thresholds
pnpm e2e       # Playwright (after pnpm e2e:install)
```

## Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Vite + React 18 + TypeScript + TailwindCSS + react-i18next (RTL) |
| Forms / Validation | React Hook Form + Zod |
| Auth (web) | Supabase magic-link OTP |
| Backend | Node 20 + Fastify + TypeScript + Zod |
| Auth (api) | `@fastify/jwt` + Supabase JWKS verification |
| Database (Phase 1) | Postgres (Supabase, eu-central-1) + Prisma + pgvector |
| AI | Google Gemini API (with mock-fallback for offline dev) |
| Observability | Sentry (web + api) + Web-Vitals RUM + Pino (PII-redacted) |
| Tests | Vitest + Testing-Library + Playwright + axe-core |
| OpenAPI | `@fastify/swagger` 3.1 + Swagger UI at `/docs` (non-prod) |
| Web deploy | Netlify |
| API deploy | Fly.io (region `fra` — GDPR data residency) |
| Operator bot | Node 20 + grammy + CLI-Anything (Python subprocess) |

## Compliance

- **GDPR/DSGVO** (extraterritorial — provider in Germany)
- **§203 StGB** — criminal medical confidentiality
- **Jordan PDPL 2023** (Personal Data Protection Law)
- **WCAG 2.2 AA** — axe-core gate (jsdom + Playwright)
- **EU AI Act** — Phase-0 features classified as limited-risk (`compliance/AI_ACT_RISK_ASSESSMENT.md`)
- **ISO/IEC 27001** — Annex A controls mapping in `compliance/`

See [`compliance/README.md`](compliance/README.md), [`docs/legal/`](docs/legal/), and [`docs/DEPLOY.md`](docs/DEPLOY.md).

## CI gates (all green on `main`)

| Gate | Tool | Threshold |
|---|---|---|
| Typecheck | `tsc --noEmit` | 0 errors |
| Lint | ESLint flat-config | 0 errors, 0 warnings |
| Tests | Vitest | 159/159 passing |
| Coverage | `@vitest/coverage-v8` | 75-100 % per package |
| Bundle size | custom budget script | < 130 KB initial gzip (currently 104.74) |
| Lighthouse | `@lhci/cli` | a11y ≥ 0.95 (error), perf ≥ 0.85 (warn) |
| A11y | axe-core (jsdom + Playwright) | 0 critical/serious |
| Secrets | gitleaks | 0 findings |
| Audit | `pnpm audit --prod` | 0 high/critical |
| E2E | Playwright (chromium + mobile-arabic) | all green |

## Agent operating rules (Hauptregel)

> **Maximum subagents · Maximum parallelism · Zero interference**

See [`docs/agent/OPUS_4_7_HANDOFF.md`](docs/agent/OPUS_4_7_HANDOFF.md) for the full operating manual.

## Contact

Dr. Mahmoud Al-Shdaifat · St. Anna Hospital Herne · `wanderwellcare@gmail.com`
