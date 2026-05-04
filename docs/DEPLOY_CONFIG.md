# Deploy Config — provisioned values

This file lists the values **already provisioned** by the Supabase MCP for `wanderwell-test` (project ID `kzzihkwkhnnoixgogxzj`, region `eu-central-1`), plus the values **you still need to provide** (database password, Netlify, Fly).

> ⚠️ Anon/publishable keys are public-by-design (they go in the browser bundle). The **service role** key and **database password** are secrets — never paste them into chat or commit them.

## ✅ Provisioned automatically (Supabase, eu-central-1)

| GitHub var/secret | Value |
|---|---|
| `VITE_SUPABASE_URL` (variable) | `https://kzzihkwkhnnoixgogxzj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` (secret) | `sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU` |
| Project ID | `kzzihkwkhnnoixgogxzj` |
| Region | `eu-central-1` (Frankfurt) |
| Postgres version | 17.6 |
| Schema applied | `jobetes_init_schema` migration (Patient, Intake, Consent, Triage, Appointment, Message, AuditLog) |

## ⚠️ You need to provide (one-time, ~10 minutes total)

### 1 — Database password (1 min)

The Supabase MCP cannot read database passwords. Either:

- Open <https://supabase.com/dashboard/project/kzzihkwkhnnoixgogxzj/settings/database>
- Reset the database password (top of page) → copy it
- Build the connection strings:

```
DATABASE_URL=postgresql://postgres.kzzihkwkhnnoixgogxzj:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.kzzihkwkhnnoixgogxzj.supabase.co:5432/postgres
```

### 2 — Service role key (1 min)

For the API to write past RLS:

- <https://supabase.com/dashboard/project/kzzihkwkhnnoixgogxzj/settings/api>
- Copy `service_role` key (long JWT, starts `eyJ…`)

### 3 — Netlify (3 min)

- Sign up at <https://app.netlify.com/start> · connect this GitHub repo
- Leave build settings blank (`netlify.toml` provides them)
- Settings → *Site information* → copy **Site ID**
- User settings → *Personal access tokens* → create one, full scope

### 4 — Fly.io (5 min)

```bash
brew install flyctl   # or curl -L https://fly.io/install.sh | sh
fly auth signup
fly launch --config infrastructure/fly.toml --no-deploy --copy-config --name jobetes-api --region fra
fly tokens create deploy   # copy the printed token
```

### 5 — GitHub (push them to the repo)

Settings → *Secrets and variables → Actions* on <https://github.com/mahmoudalshdifat/Jobetes>

**Variables (visible to workflows, not secret):**

| Name | Value |
|---|---|
| `NETLIFY_SITE_ID` | from step 3 |
| `VITE_API_URL` | `https://jobetes-api.fly.dev` |
| `VITE_SUPABASE_URL` | `https://kzzihkwkhnnoixgogxzj.supabase.co` |
| `FLY_APP_NAME` | `jobetes-api` |
| `RUN_DB_MIGRATIONS` | `true` |

**Secrets:**

| Name | Value |
|---|---|
| `NETLIFY_AUTH_TOKEN` | from step 3 |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU` |
| `FLY_API_TOKEN` | from step 4 |
| `VITE_SENTRY_DSN` | optional — your Sentry web DSN |

### 6 — Set Fly secrets

```bash
fly secrets set -a jobetes-api \
  GEMINI_API_KEY="…" \
  DATABASE_URL="…" \
  DIRECT_URL="…" \
  SUPABASE_URL="https://kzzihkwkhnnoixgogxzj.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="…" \
  SENTRY_DSN="…"
```

### 7 — Push

The next commit to `main` triggers `deploy-web.yml` (Netlify) and `deploy-api.yml` (Fly) automatically.

## RLS Status

The migration created tables but the harness did not allow me to apply RLS policies in the same run. **Tables are exposed via the anon key without protection until RLS is applied.** Once you reply with explicit RLS authorization, I apply the policies in `supabase/migrations/jobetes_rls_policies.sql` (already drafted).

The advisors confirmed 7 `ERROR`-level findings: `rls_disabled_in_public` on Patient, Intake, Consent, Triage, Appointment, Message, AuditLog.

The repo currently has zero rows in those tables, so the exposure window is **schema metadata only** until you apply RLS.

## Smoke-test commands (after deploy)

```bash
curl https://jobetes-api.fly.dev/health
curl https://jobetes-api.fly.dev/doctor/profile
curl https://kzzihkwkhnnoixgogxzj.supabase.co/rest/v1/Patient \
  -H "apikey: sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU" \
  -H "Authorization: Bearer sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU"
# → after RLS applied: should return [] (empty), not all rows.
```
