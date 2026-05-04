# ADR-001 — Monorepo with pnpm + Turborepo

Status: Accepted, 2026-05-04

## Context

Jobetes has three deployable apps (`web`, `api`, `operator-bot`) and several shared packages (`ui`, `ai-gemini`, `i18n`, `shared-schemas`). They share types via Zod schemas and need consistent lint/test/build tooling.

## Decision

Adopt **pnpm workspaces + Turborepo**.

## Consequences

- Single `pnpm install` provisions everything.
- Shared schemas (e.g., `PatientIntakeSchema`) compile-checked across FE and BE — change a field in one place, get errors on both sides.
- Turbo parallelizes lint/test/build with content-addressed caching.
- Trade-off: contributors must understand workspace protocol (`workspace:*`).
