# Database Schema

Defined in `apps/api/prisma/schema.prisma`.

## Enums

| Enum | Values |
|------|--------|
| `Locale` | `ar`, `de`, `en` |
| `Gender` | `female`, `male`, `other`, `prefer_not_to_say` |
| `TriageUrgency` | `emergency`, `soon`, `routine`, `self_care_likely` |
| `AppointmentStatus` | `requested`, `confirmed`, `rescheduled`, `cancelled`, `completed` |

## Models

### Patient
- `id` (UUID, PK)
- `firstName`, `lastName`, `dateOfBirth` (Date), `gender`, `preferredLocale`
- `phone` (unique), `email` (optional)
- `supabaseUserId` (UUID, unique, nullable — set when patient claims account)
- Relations: `intakes`, `appointments`, `messages`

### Intake
- `id` (UUID, PK)
- `patientId` → Patient
- `payload` (JSONB — symptom data, forward-compatible)
- `severity` (Int 0-10)
- `symptomDurationDays` (optional Int)
- `ramadanContext`, `isFasting` (Boolean, default false)
- `prefersDoctorGender` (optional Gender)
- `consentId` → Consent (unique, 1:1)
- Relation: `triage` (1:1)

### Consent
- `id` (UUID, PK)
- `acceptedAt`, `privacyPolicyVersion`, `presentedLocale`
- `termsOfService`, `privacyPolicy`, `processingHealthData`, `crossBorderTransfer` (Boolean)
- `marketingOptIn`, `familyAccessOptIn` (Boolean, default false)
- Relation: `intake` (1:1)

### Triage
- `id` (UUID, PK)
- `intakeId` → Intake (unique, 1:1)
- `urgency` (TriageUrgency)
- `redFlags` (String[])
- `topicsForConsultation` (String[])
- `patientFriendlySummary`, `disclaimer`
- Provider metadata: `provider`, `model`, `promptVersion`, `latencyMs`, `tokensIn`, `tokensOut`

### Appointment
- `id` (UUID, PK)
- `patientId` → Patient
- `status` (AppointmentStatus, default `requested`)
- `requestedAt`, `scheduledAt` (optional)
- `notes` (String, optional — doctor-only)

### Message
- `id` (UUID, PK)
- `patientId` → Patient
- `fromRole` ("patient" | "doctor")
- `body`, `locale`

### AuditLog
- **NO PII** — store IDs and event types only
- `id` (UUID, PK)
- `actorRole`, `actorId`, `event`, `resourceId`, `metadata` (JSON)

## Indexing
- Patient: `phone`, `email`, `supabaseUserId`
- Intake: `patientId + createdAt`
- Appointment: `patientId + status`
- Message: `patientId + createdAt`
- AuditLog: `event + createdAt`

## Data Residency & Security
- Region: EU (Frankfurt) — GDPR
- Encryption-at-rest: AES-256 (Supabase default)
- Backups: daily, 30-day retention
- RLS policies defined in `supabase/migrations/jobetes_rls_policies.sql`
