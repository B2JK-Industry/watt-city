#!/usr/bin/env bash
# Boost an existing Watt City user to demo-ready state.
#
# Usage:
#   ./scripts/boost-user.sh <username>
#
# Requires .env.local with ADMIN_SECRET. Hits the live deploy.
# Grants: 99_999 of every resource (watts / coins / bricks / glass /
# steel / code / cashZl). Repeatable — each run adds again, so don't
# panic if you hit it twice.

set -euo pipefail

USER="${1:-}"
if [[ -z "$USER" ]]; then
  echo "usage: $0 <username>"
  exit 1
fi

# Load ADMIN_SECRET from .env.local. Keeps it out of shell history.
# Dotenv convention allows the value to be wrapped in "..." or '...';
# we strip those before sending the bearer header so the production
# secret (which is NOT wrapped) matches.
SECRET_RAW="$(grep -E '^ADMIN_SECRET=' .env.local | head -1 | cut -d= -f2-)"
SECRET="${SECRET_RAW#\"}"; SECRET="${SECRET%\"}"
SECRET="${SECRET#\'}"; SECRET="${SECRET%\'}"
if [[ -z "$SECRET" ]]; then
  echo "ADMIN_SECRET not found in .env.local"
  exit 1
fi

HOST="${WATT_CITY_HOST:-https://watt-city.vercel.app}"

# One-shot seed: resources + 17 buildings + paid-off mortgage + all
# 8 achievements. Fills /profile, /miasto, /games leaderboards.
echo "→ Seeding $USER on $HOST with full-progression demo state"
SEED_RESPONSE="$(curl -sS -X POST "$HOST/api/admin/seed-demo-player/$USER" \
  -H "Authorization: Bearer $SECRET")"
echo "$SEED_RESPONSE" | jq -r '. | if .ok then
    "  ✓ buildings: " + (.buildingsPlaced | tostring) +
    " · loans: " + (.loansCount | tostring) +
    " · credit: " + (.creditScore | tostring) +
    " · achievements: " + (.achievementsGranted | length | tostring)
  else
    "  ✗ " + (.error // "failed") + " — has the new endpoint deployed yet?"
  end'

# Fallback to plain resource grant if the seed endpoint isn't live yet
# (Vercel deploy lag). Keeps the script useful during rollouts.
if ! echo "$SEED_RESPONSE" | jq -e '.ok' > /dev/null; then
  echo "  ↪ falling back to resource-only grant…"
  curl -sS -X POST "$HOST/api/admin/player/$USER" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "grant",
      "grant": {
        "watts": 99999, "coins": 99999, "bricks": 99999,
        "glass": 99999, "steel": 99999, "code":  99999,
        "cashZl": 99999
      },
      "reason": "jury demo — fallback resource grant"
    }' | jq -r '. | if .ok then
        "  ✓ resources → " + (.resources | tostring)
      else
        "  ✗ " + (.error // "failed")
      end'
fi

echo ""
echo "→ Current state"
curl -sS "$HOST/api/admin/player/$USER" \
  -H "Authorization: Bearer $SECRET" | jq '{
    username,
    resources: .state.resources,
    creditScore: .state.creditScore,
    buildings: (.state.buildings | length),
    loans: (.state.loans | length)
  }'

echo ""
echo "→ Log into $HOST as $USER:"
echo "  /miasto       — city grid with all 17 buildings placed"
echo "  /profile      — achievement gallery filled + paid mortgage"
echo "  /loans/compare — loan comparison ladder to demo product catalog"
echo "  /games         — play one round → post-game breakdown modal"
echo ""
echo "  Re-run this script anytime to top up resources."
