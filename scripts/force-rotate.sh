#!/usr/bin/env bash
# Manually kick the AI rotation on prod (or any WATT_CITY_HOST).
# Useful right after a deploy when the Vercel Cron schedule hasn't
# fired yet for the new 3-slot layout, so medium + slow slots are
# still empty.
#
# Usage:
#   ./scripts/force-rotate.sh           # triggers all 3 slots in one call
#   ./scripts/force-rotate.sh --status  # reads current live games without publishing
#
# Requires ADMIN_SECRET in .env.local.

set -euo pipefail

MODE="rotate"
for arg in "$@"; do
  case "$arg" in
    --status) MODE="status" ;;
    *) echo "unknown arg: $arg" >&2; exit 1 ;;
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

if [[ "$MODE" == "status" ]]; then
  echo "→ Live AI games on $HOST (newest first):"
  curl -sS "$HOST/api/events/latest-game" | jq '.'
  echo ""
  echo "→ Full rotation status (admin):"
  curl -sS "$HOST/api/admin/rotation-status" \
    -H "Authorization: Bearer $SECRET" | jq '.'
  exit 0
fi

echo "→ Triggering rotate-if-due on $HOST (all 3 slots)"
curl -sS -X POST "$HOST/api/cron/rotate-if-due" \
  -H "Authorization: Bearer $SECRET" \
  | jq '.'
