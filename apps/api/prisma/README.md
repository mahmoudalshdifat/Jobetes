# Prisma — Phase 1 persistence

Phase 0 uses an in-memory intake store (`apps/api/src/routes/intake.ts`). This folder is the Phase-1 contract — schema is defined and shipped in the repo but **not** migrated until `DATABASE_URL` is set.

## Setup (Phase 1, when ready)

```bash
# 1. Provision a Supabase project (region: eu-central-1)
# 2. Copy the connection string into apps/api/.env:
#    DATABASE_URL="postgresql://...@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

cd apps/api
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

## Compliance touchpoints

- **Region:** EU only (Supabase `eu-central-1`).
- **Encryption-at-rest:** AES-256 (Supabase default).
- **Patient identity (Patient.firstName/lastName/dateOfBirth/phone):** application-layer encryption via Supabase Vault or a separate envelope-encryption service before write. The DB columns store ciphertext.
- **AuditLog:** never write PII into `metadata` — store IDs and event types only. Reviewed by `compliance/RECORDS_OF_PROCESSING.md` row #3.
- **Cascades:** `onDelete: Cascade` on `Intake`, `Appointment`, `Message`, `Triage` so a GDPR Art. 17 erasure of a `Patient` removes all derived records in one transaction.

## Data model overview

```
Patient ─┬─< Intake ─── Triage
         │       └── Consent
         ├─< Appointment
         └─< Message

AuditLog (independent, no FKs)
```

## Migration workflow

1. Edit `schema.prisma`.
2. `pnpm dlx prisma migrate dev --name <change>` — generates SQL in `migrations/`.
3. Commit the generated migration.
4. CI re-runs `prisma validate` to ensure the schema parses without a DB.
5. `pnpm dlx prisma migrate deploy` runs in production CD.
