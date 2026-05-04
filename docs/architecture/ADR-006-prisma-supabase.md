# ADR-006 — Prisma + Supabase Postgres (eu-central-1) for Phase 1 persistence

Status: Accepted (Phase-1 design), 2026-05-04

## Context

Phase 0 uses an in-memory intake store. Phase 1 needs persistent storage that:

- keeps health data in the EU (GDPR Art. 5 data residency)
- supports application-layer encryption (defence-in-depth on top of cloud encryption-at-rest)
- offers row-level security (Supabase RLS) so a patient can only read their own records
- has a managed `pgvector` extension for future patient-history embedding search
- supports authenticated access (Supabase Auth integrates natively)

## Decision

- **ORM:** Prisma — the schema is the source of truth, type-safe across FE/BE thanks to TS types generated alongside Zod schemas.
- **Database:** Supabase Postgres in `eu-central-1` (Frankfurt) — same region as the Fly.io API (ADR-003) → minimal latency + GDPR alignment.
- **Schema:** see [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma).
- **Phase boundary:** the schema is committed and validated in CI; migrations only run when `DATABASE_URL` is set in production env. Phase 0 dev/CI continues to use the in-memory adapter.

## Consequences

- Single source of truth for the data model; types flow into the API automatically.
- Supabase Auth integration becomes trivial (Q1 in the original plan resolved in favor of Supabase).
- Trade-off: Prisma's schema language is its own DSL — contributors need to learn it. The schema is small enough that this is fine.
- Trade-off: Supabase lock-in is mitigated by Postgres being standard SQL. Migration to self-hosted PG is mechanical if needed.

## Rejected alternatives

- **Drizzle ORM:** more typesafe-by-default but smaller community + tooling for healthcare-grade migrations.
- **Self-hosted Postgres on Fly.io:** more ops burden than this size of project warrants.
- **MongoDB:** unstructured fit poorly for a regulated health record where every field is documented in `compliance/RECORDS_OF_PROCESSING.md`.
