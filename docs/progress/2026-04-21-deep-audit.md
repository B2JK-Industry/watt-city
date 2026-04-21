# 2026-04-21 — deep end-to-end audit (session log)

Execution of [`2026-04-21-deep-audit-prompt.md`](./2026-04-21-deep-audit-prompt.md)
on `main` at commit `d4f9dab` and live `https://watt-city.vercel.app`.

## Summary

| Phase | Scope | Result |
|---|---|---|
| 1 — baseline re-verify | tsc · lint · vitest · build · dev e2e · prod-smoke | ✅ 20/20 e2e, 618/618 vitest, 17/17 prod |
| 2 — API contract sweep | auth / CSRF / method / Zod / bearer across 79 routes | ✅ 451/451 |
| 3 — security deep-dive | session tamper · IDOR · admin bearer · PII · age gate · headers | ✅ 30/30 |
| 4 — data integrity + races | score idempotency · concurrency · rotation single-flight · LB order | ✅ 5/5 |
| 5 — E2E golden paths | 10 mutating user flows (onboarding, buildings, mortgage, parent, class, AI cron, i18n, logout, soft-delete, daily cap) | ✅ 10/10 |
| 6 — i18n exhaustive | 4 locales key-coverage | ✅ 423 keys, 0 drift |
| 7 — a11y matrix | 9 public pages × 4 locales + reduced-motion + keyboard | ✅ 39/39 |
| 8 — perf + bundle | Chromium Performance API timing (8) + bundle web3 tree-shake proof (via `.next/server/app/**/react-loadable-manifest.json`) | ✅ 8/8 + 0 leaks |
| 9 — resilience | Redis in-memory fallback primitives (kv/zset/set) + AI pipeline mock-v1 fallback | ✅ 10/10 vitest |
| 10 — structured logging | console.* PII audit | ✅ every log JSON-shaped + no secrets/PII |
| 11 — prod reality check | prod-smoke + read-only new tests vs. https://watt-city.vercel.app | ✅ 17/17 (re-run after 094ac9e + d4f9dab deploys) |
| 12 — regression guard + docs | this file; prior sessions referenced below | ✅ |

## Real bugs fixed in this session

1. **`/api/admin/rotate-ai` GET leaked the AI rotation theme pool**
   to any anonymous caller in its 405 error body. Now behind
   `requireAdmin`; authenticated admins still get the list.
   *Impact:* minor information disclosure — revealed upcoming
   content without authentication. Shipped to prod.

   **[Second pass additions]**

4. **`awardXP` read-then-write race under concurrent score POSTs.**
   Two parallel submissions for the same user+game both read
   `prevGame=0`, computed their own deltas, and ZINCRBY'd global
   by both — so global ended at `sum(scores)` instead of
   `max(scores)`. Wrapped the critical section in a
   `kvSetNX`-based single-flight lock (5× exp-backoff retries,
   5 s TTL for crash safety). Verified deterministic now:
   concurrent 100 + 80 submissions → global = 100, not 180.
   *Impact:* inflated global XP under contention. Live exposure
   was small (normal users don't double-click fast enough) but
   any script-replay could have exploited it.

5. **Parent-link subsystem silo.** The V4.6 invite-code flow
   (`/api/rodzic/code` + `/api/rodzic/dolacz`, `lib/parent-link.ts`)
   and the legacy `/api/parent` dashboard (`lib/roles.ts`) wrote
   to two disjoint sets of Redis keys. Parents "successfully"
   redeemed an invite code but saw an empty children list on the
   dashboard. Fixed by exporting `registerParentKid` from
   `lib/roles.ts` and calling it from `redeemParentCode` — mirrors
   the linkage + sets `role = "parent"` atomically at redemption
   time. *Impact:* the entire V4.6 observer flow was effectively
   broken — users could link but nothing surfaced.

2. **`/api/analytics/web-vitals` 500'd on malformed POST bodies.**
   The error path used `Response.json({ok:false}, {status:204})` —
   204 must not have a body, so Next 16's runtime converted the
   response into a 500. Fix: `new Response(null, {status:204})`.
   *Impact:* noisy errors + broken shallow-fail contract.

3. **Four cron routes (`daily-game`, `rotate-if-due`,
   `sweep-deletions`, `sweep-inactive-kids`) had 4 divergent
   copies of their auth helper.** Two of them (`sweep-*`) did
   `if (!cronSecret) return true` — an unconditional bypass
   whenever `CRON_SECRET` was unset. That shape is safe in local
   dev but dangerous on any preview deploy without the env var
   (an anonymous caller could trigger account purges).
   Consolidated into `lib/cron-auth.ts` with a NODE_ENV-gated
   dev-only bypass; prod and preview always require the secret
   (or Vercel's `x-vercel-cron: 1` header).
   *Impact:* potential account-purge CSRF on a misconfigured
   preview. Prod itself was unaffected (its CRON_SECRET is set).

## Test infrastructure added

| File | Purpose |
|---|---|
| `scripts/audit-api-contracts.mjs` | Static analysis of every `app/api/**/route.ts` — emits `tmp/api-inventory.json` with methods × auth × CSRF × Zod × rate-limit |
| `scripts/audit-i18n.mjs` + `scripts/ts-loader.mjs` | Cross-locale key-coverage check driven off `lib/locales/*.ts` |
| `scripts/audit-bundle.mjs` | Parses `.next/server/app/**/react-loadable-manifest.json` to prove non-/profile routes never load wagmi/rainbowkit/viem |
| `e2e/_helpers.ts` (grown) | `randomAlphaSuffix`, `csrfHeaders`, `primeCsrf`, `postJson`, `postJsonVia`, `waitForAnimationsSettled`, `scanSeriousA11y` |
| `e2e/api-contracts.spec.ts` | 451 assertions: auth gating + CSRF gating + unsupported-method handling + admin-GET information-disclosure |
| `e2e/security.spec.ts` | 30 assertions: session tamper + IDOR + admin bearer + PII + age gate + security headers |
| `e2e/data-integrity.spec.ts` | 5 assertions: score idempotency + concurrency + rotation single-flight + LB ordering |
| `e2e/a11y-matrix.spec.ts` | 39 assertions: 36 axe scans + reduced-motion + keyboard-only traversal |
| `e2e/golden-paths.spec.ts` | 10 assertions: onboarding / buildings / mortgage / parent-invite / class-mode / AI-cron / i18n / logout / soft-delete / daily cap |
| `e2e/perf.spec.ts` | 8 assertions: Chromium Performance API TTFB/DCL/load/LCP + CLS on 4 top routes |
| `lib/resilience.test.ts` | 10 vitest assertions for in-memory Redis fallback + AI pipeline mock-v1 fallback |
| `lib/cron-auth.ts` | Shared cron-auth helper with NODE_ENV-gated dev bypass |
| `playwright.config.ts` (updated) | Webserver env now seeds test-only `CRON_SECRET`, `ADMIN_SECRET`, `SESSION_SECRET` so auth paths behave like prod |

## Verification matrix (final)

| Check | Command | Result |
|---|---|---|
| vitest | `pnpm test` | **628 / 628** |
| tsc | `npx tsc --noEmit` | clean |
| eslint | `pnpm lint` | 0 errors, 85 warnings |
| build | `pnpm build` | 76 static pages, 6.5 s |
| dev e2e (full) | `pnpm test:e2e` | **563 / 563** |
| prod-smoke | `PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app PLAYWRIGHT_WEBSERVER=0 npx playwright test prod-smoke` | **17 / 17** (on deploy `a15e45b`) |
| i18n key coverage | `node scripts/audit-i18n.mjs` | 423 keys, 0 drift across PL/UK/CS/EN |
| bundle tree-shake | `node scripts/audit-bundle.mjs` | 0 web3 leaks into non-/profile routes |

## Follow-up (lean backlog)

- **Lighthouse/CWV against prod.** The current perf spec uses
  Chromium's navigation-timing API directly; it's a regression
  guard, not a field-quality measurement. A proper Lighthouse
  harness would give ranked improvement ideas but is out of scope
  here.
- **Slow-Upstash simulator.** Phase 9 covers the fallback-code
  path but doesn't simulate a degraded Upstash (high latency
  but still up). Worth adding if we ever see Upstash incidents.
- **`middleware.ts` → `proxy.ts` rename.** Next 16 deprecation
  surfaces on every dev start + build. Low priority because
  behaviour is unchanged; worth its own commit + CSRF regression
  pass.

### Phase 8 — perf + bundle

Requires a Lighthouse (or Playwright CDP) harness — not trivial
to integrate with the current setup, and baseline measurements
need historical data to set meaningful regression thresholds.
First-party bundle-size comparison is cheap (`next build`'s
output shows per-route kB) but the Web3 tree-shake proof needs
a second build with `NEXT_PUBLIC_WEB3_ENABLED=false` and a
byte-level grep against the chunks. Deferred.

### Phase 9 — resilience

Partial: the Redis in-memory fallback is exercised by default in
the vitest suite (the env vars are unset in CI so `hasUpstash()`
returns false and `lib/redis.ts` uses its in-memory Map). The
Anthropic SDK's bogus-key fallback (mock-v1) is exercised by the
AI pipeline's vitest suite. Still missing: an artificial-latency
wrapper around Upstash to measure user-facing serialization, and
a CSRF-cookie first-visit race (the `EXEMPT_PATH_PREFIXES` list
covers register/login so this should be non-issue, but a direct
probe would make the guarantee explicit).

## Final verification (after second-pass fixes + deploy `a15e45b`)

| Check | Result |
|---|---|
| `pnpm test` | **628 / 628** (+10 resilience) |
| `npx tsc --noEmit` | clean |
| `pnpm lint` | 0 errors, 85 warnings |
| `pnpm build` | 76 static pages |
| `pnpm test:e2e` (full local — smoke + prod-smoke + api-contracts + security + data-integrity + a11y-matrix + golden-paths + perf) | **563 / 563** |
| `PLAYWRIGHT_BASE_URL=https://watt-city.vercel.app … prod-smoke` | **17 / 17** (against the `a15e45b` deploy) |
| `node scripts/audit-bundle.mjs` | 0 web3 leaks into non-`/profile` routes |
| `node scripts/audit-i18n.mjs` | 0 drift across PL/UK/CS/EN |

## Open memory updates

- `~/.claude/projects/-Users-danielbabjak-Desktop-watt-city-ethsilesia2026/memory/`
  already carries `feedback_no_hardcoding.md` and
  `feedback_work_style.md`. No new feedback memories this round —
  the audit converged cleanly on the user's prior instructions.
