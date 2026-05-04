# Deploy Guide — Jobetes

Phase-1 production deployment. Two targets: Netlify (web) + Fly.io (api). Database: Supabase Postgres `eu-central-1`.

## TL;DR — what Dr. Mahmoud must do (one-time, ~30 minutes)

1. **Create Supabase project** → copy 3 values into GitHub.
2. **Create Netlify site** (no build settings — they're in `netlify.toml`) → copy 1 value into GitHub.
3. **Create Fly app** → copy 1 value into GitHub.
4. **Push** → CI deploys on every push to `main`.

After this, every commit to `main` deploys automatically. No further manual steps.

---

## Step 1 · Supabase

1. Sign up at <https://supabase.com> · choose region **`eu-central-1` (Frankfurt)** — same as Fly.
2. Note these from *Project Settings → API*:
   - `Project URL` → e.g. `https://abcdef.supabase.co`
   - `anon public key` (long JWT)
   - `service_role secret` (long JWT)
3. Note from *Project Settings → Database → Connection string → URI*:
   - `Connection pooling` → **DATABASE_URL**
   - `Session` → **DIRECT_URL**

## Step 2 · Netlify

1. <https://app.netlify.com/start> → connect this GitHub repo.
2. Build settings: leave everything blank — `netlify.toml` provides them.
3. Note: *Site settings → Site information → Site ID*.
4. *User settings → Applications → Personal access tokens* → create token, scope: site read/write.

## Step 3 · Fly.io

```bash
brew install flyctl   # or curl -L https://fly.io/install.sh | sh
fly auth signup       # or login
fly launch --config infrastructure/fly.toml --no-deploy --copy-config --name jobetes-api --region fra
fly tokens create deploy   # copy the token
fly secrets set -a jobetes-api \
  GEMINI_API_KEY="…" \
  DATABASE_URL="…" \
  DIRECT_URL="…" \
  SUPABASE_URL="…" \
  SUPABASE_SERVICE_ROLE_KEY="…" \
  SENTRY_DSN="…"
```

## Step 4 · GitHub

In **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
|---|---|---|
| Variable | `NETLIFY_SITE_ID` | from Step 2 |
| Variable | `VITE_API_URL` | `https://jobetes-api.fly.dev` |
| Variable | `VITE_SUPABASE_URL` | from Step 1 |
| Variable | `FLY_APP_NAME` | `jobetes-api` |
| Variable | `RUN_DB_MIGRATIONS` | `true` |
| Secret | `NETLIFY_AUTH_TOKEN` | from Step 2 |
| Secret | `VITE_SUPABASE_ANON_KEY` | from Step 1 |
| Secret | `VITE_SENTRY_DSN` | optional — your Sentry web DSN |
| Secret | `FLY_API_TOKEN` | from Step 3 |

## Step 5 · Push and watch

```bash
git push origin main
```

Watch the deploy:
- Netlify: <https://app.netlify.com/sites/SITE_NAME/deploys>
- Fly: <https://fly.io/apps/jobetes-api/monitoring>

Both `deploy-web.yml` and `deploy-api.yml` skip silently if the relevant variable is empty, so they're safe to merge before configuration.

## Smoke tests

```bash
curl https://jobetes-api.fly.dev/health
curl https://jobetes-api.fly.dev/doctor/profile
```

If either fails, check `flyctl logs -a jobetes-api`.

## Rollback

- **Web**: Netlify → Deploys → previous green → "Publish".
- **API**: `fly releases -a jobetes-api && fly releases rollback <version>`.
- **DB**: every Prisma migration is reversible via `prisma migrate resolve --rolled-back <name>` + manual SQL.

## Compliance handoff

Before the first patient hits the live site:
- [ ] `compliance/RECORDS_OF_PROCESSING.md` reviewed by Med-IT counsel
- [ ] DPA signed with Supabase, Netlify, Fly, Google
- [ ] DSFA finalized
- [ ] Jordan PDPL local-counsel sign-off
- [ ] Native AR lectorate sign-off
