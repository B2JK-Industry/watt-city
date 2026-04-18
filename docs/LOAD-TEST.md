# Load-test runbook — Phase 6.7.6

Script: `load/k6-smoke.js`. Use [k6](https://k6.io) (single binary, no
install dance). Never run against production — spin up a staging preview
first.

## Prerequisites

```bash
# macOS
brew install k6

# Linux
sudo gpg -k && sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
  https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running the smoke test

```bash
# against a local dev server
pnpm dev &
sleep 5
k6 run load/k6-smoke.js

# against a staging preview URL
k6 run -e BASE_URL=https://preview-abc123.watt-city.vercel.app load/k6-smoke.js
```

## Expected envelope (Phase 6.5.6 targets)

| Metric | Target | Why |
|---|---|---|
| p95 landing latency | < 200 ms | Cacheable GET; CDN + edge should dominate |
| p95 register latency | < 800 ms | Redis writes + scrypt hash |
| p95 score POST latency | < 800 ms | Ledger append + leaderboard ZINCRBY |
| http_req_failed | < 1 % | Any rate-limit error counts as failure — design the test to stay under buckets |

## Interpreting results

- If landing p95 > 200 ms: check if Vercel's CDN is actually caching (see
  `cache-control` response headers).
- If score p95 > 800 ms: likely Upstash round-trip; consider a regional
  Upstash instance or pipelining ledger + leaderboard writes.
- `http_req_failed` spikes: grep the dev-server logs for `rate-limited` —
  the load test intentionally respects buckets (5/min on loan-take, 30/min
  cheer), so failures there are EXPECTED. Subtract them from the error
  rate calculation.

## Cost guardrails

One 10-minute run at 500 VUs generates ≈ 60k Anthropic-API-free requests
(we bypass the AI pipeline in the test). Upstash command volume: ≈ 200k.
Free tier allows 10k commands/day — use a Pro account for load tests or
risk burning the budget.

## Scheduled runs

NOT automated. Running on a cron against staging would incur cost and
Upstash-limit risk with no clear signal. Instead:

- Run manually before each major release.
- Run after any perf-touching commit (CSP headers, dynamic-import refactor).
- Run quarterly as a regression check.
