#!/usr/bin/env bash
# Pre-submission guard — fails if any `{{TOKEN}}` remains in the Web3
# submission-facing docs. Run as the final step of W7 before pushing.
#
# Usage:
#   bash scripts/check-placeholders.sh
#
# Exits 0 if clean, 1 if any placeholder still present.

set -e

TRACKED=(
  "docs/web3/SUBMISSION.md"
  "docs/web3/DEPLOYMENTS.md"
  "README.md"
)

FAIL=0

for f in "${TRACKED[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "skip: $f (not found)"
    continue
  fi
  # Find any `{{UPPER_CASE}}` token. Comments and code-blocks included —
  # the convention is that any `{{TOKEN}}` in a tracked submission file
  # is authoritative.
  HITS=$(grep -oE '\{\{[A-Z_]+\}\}' "$f" | sort -u || true)
  if [[ -n "$HITS" ]]; then
    echo "✗ $f has unfilled placeholders:"
    echo "$HITS" | sed 's/^/    /'
    FAIL=1
  fi
done

if [[ $FAIL -eq 0 ]]; then
  echo "✓ All web3 submission docs fully filled."
  exit 0
fi

echo ""
echo "Rerun 'pnpm tsx scripts/fill-web3-submission.ts --demo-url=... --video-url=... --contact=...'"
echo "or fill the tokens manually, then re-run this guard."
exit 1
