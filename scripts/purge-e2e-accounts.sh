#!/usr/bin/env bash
# Wipe leaked E2E test accounts (gp_*, pr_*, rl_*, …) from the
# production leaderboard.
#
# Usage:
#   ./scripts/purge-e2e-accounts.sh               # dry-run (default)
#   ./scripts/purge-e2e-accounts.sh --commit      # actually delete
#   ./scripts/purge-e2e-accounts.sh --commit --include-single-letter
#
# Requires .env.local with ADMIN_SECRET. Hits the live deploy.

set -euo pipefail

DRY_RUN="true"
INCLUDE_SINGLE="false"
for arg in "$@"; do
  case "$arg" in
    --commit) DRY_RUN="false" ;;
    --include-single-letter) INCLUDE_SINGLE="true" ;;
    *)
      echo "unknown arg: $arg" >&2
      echo "usage: $0 [--commit] [--include-single-letter]" >&2
      exit 1
      ;;
  esac
done

SECRET_RAW="$(grep -E '^ADMIN_SECRET=' .env.local | head -1 | cut -d= -f2-)"
SECRET="${SECRET_RAW#\"}"; SECRET="${SECRET%\"}"
SECRET="${SECRET#\'}"; SECRET="${SECRET%\'}"
if [[ -z "$SECRET" ]]; then
  echo "ADMIN_SECRET not found in .env.local" >&2
  exit 1
fi

HOST="${WATT_CITY_HOST:-https://watt-city.vercel.app}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "→ DRY RUN — nothing will be deleted. Re-run with --commit."
else
  echo "→ COMMIT MODE — this will hardErase() every matching account."
fi

curl -sS -X POST "$HOST/api/admin/purge-e2e-accounts" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"dryRun\": $DRY_RUN, \"includeSingleLetter\": $INCLUDE_SINGLE}" \
  | jq '.'
