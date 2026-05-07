#!/usr/bin/env bash
set -euo pipefail

# Jobetes — PostgreSQL backup script
# Usage: ./scripts/backup.sh [staging|production]
# Requires: pg_dump (PostgreSQL client), flyctl (for production/staging tunnel)
# Env:    DATABASE_URL or FLY_APP_NAME

ENVIRONMENT="${1:-production}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

if [[ "$ENVIRONMENT" == "local" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL not set for local backup."
    exit 1
  fi
  echo "Backing up local database..."
  pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_DIR/jobetes_local_${TIMESTAMP}.dump"
  echo "Local backup saved to $BACKUP_DIR/jobetes_local_${TIMESTAMP}.dump"
  exit 0
fi

# Staging / Production via Fly.io proxy
FLY_APP="${FLY_APP_NAME:-jobetes-api}"
if [[ "$ENVIRONMENT" == "staging" ]]; then
  FLY_APP="${FLY_STAGING_APP_NAME:-jobetes-api-staging}"
fi

echo "Connecting to $FLY_APP via Fly.io proxy..."

# Create a temporary proxy and capture the local port
PROXY_PID=""
cleanup() {
  if [[ -n "$PROXY_PID" ]]; then
    echo "Closing Fly proxy..."
    kill "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Start proxy in background, connect to port 54322 locally
flyctl proxy 54322:5432 -a "$FLY_APP" &
PROXY_PID=$!

# Wait for proxy to be ready
for i in {1..30}; do
  if nc -z localhost 54322 2>/dev/null; then
    break
  fi
  sleep 1
done

if ! nc -z localhost 54322 2>/dev/null; then
  echo "ERROR: Fly proxy did not start within 30s."
  exit 1
fi

# Build connection string from components or use DATABASE_URL directly
if [[ -n "${DATABASE_URL:-}" ]]; then
  # Replace host/port with local proxy
  LOCAL_URL=$(echo "$DATABASE_URL" | sed 's|@[^/]*|@localhost:54322|')
else
  echo "ERROR: DATABASE_URL not set. Cannot build backup connection string."
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/jobetes_${ENVIRONMENT}_${TIMESTAMP}.dump"
echo "Running pg_dump to $BACKUP_FILE ..."
pg_dump "$LOCAL_URL" --format=custom --file="$BACKUP_FILE"

echo "Backup complete: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Optional: upload to S3 / R2 if configured
if [[ -n "${R2_BUCKET:-}" && -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
  echo "Uploading to R2..."
  aws s3 cp "$BACKUP_FILE" "s3://$R2_BUCKET/backups/jobetes_${ENVIRONMENT}_${TIMESTAMP}.dump" --endpoint-url "${R2_ENDPOINT:-}" || true
fi
