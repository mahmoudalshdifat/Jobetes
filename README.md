# Jobetes — Jordan-Health-App

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
│   └── operator-bot/      # Telegram → Codespace → STT → Prompt-Enhancer → CLI-Anything (one-button operator for Dr. Mahmoud)
├── packages/
│   ├── ui/                # Design system (RTL-aware)
│   ├── ai-gemini/         # Gemini provider abstraction with mock-fallback
│   ├── i18n/              # AR (RTL) / DE / EN translation strings
│   ├── shared-schemas/    # Zod schemas shared FE/BE
│   └── eslint-config/     # Shared lint rules
├── compliance/            # GDPR, Jordan PDPL 2023, ISO 27001 mapping
├── docs/
│   ├── agent/             # OPUS_4_7_HANDOFF, OBSIDIAN_DRAFT, run-log template
│   ├── architecture/      # ADRs
│   └── legal/             # Privacy, ToS, Impressum (DE/EN/AR)
├── e2e/                   # Playwright
├── memory/runs/           # 5-line run logs (one per prompt — Hauptregel)
└── tokens/                # Design tokens (JSON)
```

## Quickstart

```bash
# 1. Install dependencies
corepack enable
pnpm install

# 2. Copy env
cp .env.example .env
# (edit .env — Phase 0 works without secrets via mock providers)

# 3. Run dev (web + api in parallel)
pnpm dev

# 4. Quality gates
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Vite + React 18 + TypeScript + TailwindCSS + react-i18next (RTL) |
| Routing | TanStack Router |
| Forms / Validation | React Hook Form + Zod |
| Backend | Node 20 + Fastify + TypeScript + Zod |
| Database (Phase 1) | Postgres (Supabase) + Prisma + pgvector |
| AI | Google Gemini API (with mock-fallback for offline dev) |
| Tests | Vitest + Testing-Library + Playwright + axe-core |
| Web deploy | Netlify |
| API deploy | Fly.io (region `fra` — GDPR data residency) |
| Operator bot | Node 20 + grammy + CLI-Anything (Python subprocess) |

## Compliance

- **GDPR/DSGVO** (extraterritorial — provider in Germany)
- **§203 StGB** — criminal medical confidentiality
- **Jordan PDPL 2023** (Personal Data Protection Law)
- **WCAG 2.2 AA** — accessibility CI gate
- **EU AI Act** — Phase-0 features classified as limited-risk
- **ISO/IEC 27001** — Annex A controls mapping in `compliance/`

See [`compliance/README.md`](compliance/README.md) and [`docs/legal/`](docs/legal/).

## Agent operating rules (Hauptregel)

> **Maximum subagents · Maximum parallelism · Zero interference**

See [`docs/agent/OPUS_4_7_HANDOFF.md`](docs/agent/OPUS_4_7_HANDOFF.md).

## Contact

Dr. Mahmoud Al-Shdaifat · St. Anna Hospital Herne · `wanderwellcare@gmail.com`
