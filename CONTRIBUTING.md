# Contributing to Jobetes

## Hauptregel (project-wide)

**Maximum subagents · Maximum parallelism · Zero interference.**

This applies to AI agents working on the codebase: decompose tasks into packages with disjoint write authorities, launch parallel work in a single message, never let two agents touch the same file at the same time. See [`docs/agent/OPUS_4_7_HANDOFF.md`](docs/agent/OPUS_4_7_HANDOFF.md).

## Quality bar

Every change must satisfy the same Definition of Done:

- ✅ TypeScript strict — `pnpm typecheck` green
- ✅ Lint clean — `pnpm lint` zero errors
- ✅ Tests — `pnpm test` 100% pass, coverage ≥ 85% in `packages/*` and backend routes
- ✅ A11y — `pnpm a11y` zero critical/serious axe violations
- ✅ Build — `pnpm build` succeeds
- ✅ Docs — public APIs have JSDoc / TSDoc; user-facing changes update `README.md`
- ✅ Compliance — no new patient-data flow without an entry in `compliance/RECORDS_OF_PROCESSING.md`
- ✅ i18n — every user-facing string lives in `packages/i18n/locales/` and has AR/DE/EN

## Branching

- `main` — protected, requires PR + CI green
- Feature branches: `feat/<short-name>`
- Fix branches: `fix/<short-name>`
- Compliance: `compliance/<topic>`

## Commits

Conventional Commits:
- `feat: …`
- `fix: …`
- `chore: …`
- `docs: …`
- `test: …`
- `refactor: …`

## Run-log discipline

Every substantive prompt produces a 5-line log in `memory/runs/YYYY-MM-DD_<model>-NN.md`. See [`docs/agent/RUN_LOG_TEMPLATE.md`](docs/agent/RUN_LOG_TEMPLATE.md).
