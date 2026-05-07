# Backup & Restore Runbook

## Overview

Jobetes uses PostgreSQL (Supabase/Postgres on Fly.io). Backups are taken via `pg_dump` in custom format for compression and flexibility.

---

## Automated Backups (Recommended)

### GitHub Actions Scheduled Backup

Add to `.github/workflows/backup.yml`:

```yaml
name: nightly-backup
on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Install PostgreSQL client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client
      - name: Run backup
        run: ./scripts/backup.sh production
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
```

### Retention Policy

| Environment | Frequency | Retention |
|-------------|-----------|-----------|
| Production  | Daily     | 30 days   |
| Staging     | On-demand | 7 days    |

---

## Manual Backup

### Prerequisites

```bash
# macOS
brew install libpq flyctl

# Ubuntu/Debian
sudo apt-get install -y postgresql-client flyctl
```

### Production

```bash
export DATABASE_URL="postgresql://..."
./scripts/backup.sh production
```

### Local Development

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
./scripts/backup.sh local
```

---

## Restore

### From Custom-Format Dump

```bash
# 1. Verify backup integrity
pg_restore --list jobetes_production_20260506_020000.dump | head

# 2. Restore to a fresh database (drops & recreates objects)
pg_restore --clean --if-exists --dbname="$DATABASE_URL" jobetes_production_20260506_020000.dump

# 3. Or restore to a new DB for verification
createdb jobetes_verify
pg_restore --dbname="postgresql://localhost/jobetes_verify" jobetes_production_20260506_020000.dump
```

### Point-in-Time Recovery (PITR)

Supabase provides PITR via the dashboard:
1. Go to Supabase Dashboard → Database → Backups
2. Select "Point in Time Recovery"
3. Choose a restore point (up to 7 days on Pro plan)

---

## Disaster Recovery Checklist

- [ ] Confirm latest backup is within 24h: `ls -la backups/`
- [ ] Verify backup integrity: `pg_restore --list <file>`
- [ ] Spin up new Fly app or restore Supabase project
- [ ] Run migrations if restoring to empty schema: `npx prisma migrate deploy`
- [ ] Verify health endpoint: `curl https://<app>.fly.dev/health`
- [ ] Verify data consistency (spot-check patient/intake counts)
- [ ] Update DNS / CDN if primary region changed
- [ ] Notify team via Telegram operator bot
- [ ] Document incident in `memory/runs/`
