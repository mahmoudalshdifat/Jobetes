# Supabase Edge Functions

Free-tier API alternative to Fly.io. Each function lives at:

```
https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1/<name>
```

## Deployed (live)

| Function | Method | Auth | Purpose |
|---|---|---|---|
| `health` | GET | none | Liveness — `{status,service,timestamp}` |
| `doctor-profile` | GET | none | Static doctor profile JSON, 5-min cache |
| `intake` | POST | none (validates flags inline) | Patient upsert + Consent + Intake + AuditLog + notify-patient |
| `triage` | POST | none | Non-diagnostic AI urgency (Gemini or mock) |
| `admin-summary` | GET | Bearer JWT + DOCTOR_EMAILS allowlist | Intake/appointment counts + last 10 intakes for admin dashboard |
| `notify-patient` | POST | service-role (internal only) | Sends locale-aware confirmation email via Resend |

## Smoke tests

```bash
BASE=https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1

curl -sS $BASE/health
curl -sS $BASE/doctor-profile

curl -sS -X POST $BASE/intake \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName":"Layla","lastName":"Haddad","dateOfBirth":"1971-05-12",
    "gender":"female","preferredLocale":"ar","phone":"+962799123456",
    "primarySymptoms":["abdominal_pain"],"severity":6,
    "consent":{
      "termsOfService":true,"privacyPolicy":true,
      "processingHealthData":true,"crossBorderTransfer":true
    }
  }'
```

## Re-deploy

The functions are version-controlled in this folder. To re-deploy after editing:

```bash
# Option A (preferred): use the Supabase MCP tool from this Claude session
# Option B (manual): supabase CLI
supabase functions deploy health doctor-profile intake triage admin-summary notify-patient \
  --project-ref kzzihkwkhnnoixgogxzj
```

## Required Supabase secrets (set once)

```bash
supabase secrets set --project-ref kzzihkwkhnnoixgogxzj \
  GEMINI_API_KEY="<your-key>" \
  DOCTOR_EMAILS="wanderwellcare@gmail.com" \
  RESEND_API_KEY="<your-resend-key>" \
  FROM_EMAIL="noreply@jobetes.health"
```

## Why edge functions over Fly.io?

| Criterion | Edge Functions | Fly.io |
|---|---|---|
| Cost | **Free** up to 500K invocations/month | Free tier capped, account needed |
| Cold start | ~150 ms | None (always running) |
| Deploy automation | **MCP, no account click** | flyctl + auth token |
| Region | EU (Frankfurt) via Supabase routing | `fra` explicit |
| Runtime | Deno | Node 20 |

For Phase 0 we use edge functions. The full Fastify API in `apps/api/` is kept
as the reference implementation and for users who want a Node-based API.
