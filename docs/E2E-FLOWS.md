# End-to-end critical flows — Phase 6.7.3

Phase 6.7.3 originally called for 10 Playwright flows. As of 2026-04-22
(commit `5dd81e0`) the suite has grown to **13 spec files, ~600+
assertions** — the original per-flow file layout was superseded by
thematic specs during the 2026-04-21 deep-audit (Phases 2–8).

| Spec file | Scope |
|---|---|
| `e2e/smoke.spec.ts` | Landing axe-clean + register → /games + logged-in /miasto |
| `e2e/smoke.cross.spec.ts` | Cross-browser smoke |
| `e2e/smoke.mobile.spec.ts` | Mobile viewport smoke |
| `e2e/prod-smoke.spec.ts` | Non-mutating prod-env smoke (17 assertions; runs vs any `PLAYWRIGHT_BASE_URL`) |
| `e2e/api-contracts.spec.ts` | 451 assertions — auth/CSRF/method/Zod across 79 routes |
| `e2e/security.spec.ts` | 30 assertions — session tamper, IDOR, admin bearer, PII, age gate, headers |
| `e2e/data-integrity.spec.ts` | 5 assertions — score idempotency, concurrency, rotation single-flight, LB order |
| `e2e/a11y-matrix.spec.ts` | 39 assertions — 9 public pages × 4 locales + reduced-motion + keyboard |
| `e2e/golden-paths.spec.ts` | 10 mutating flows — onboarding, buildings, mortgage, parent, class, AI cron, i18n, logout, soft-delete, daily cap |
| `e2e/perf.spec.ts` | 8 assertions — Chromium Performance API TTFB/DCL/LCP/CLS |
| `e2e/rate-limits.spec.ts` | Per-user bucket coverage |
| `e2e/bot-protection.spec.ts` | Per-IP register/login limits — opt-in via `BOT_PROTECTION_E2E=1` |
| `e2e/pwa.spec.ts` | PWA manifest + SW behaviour |
| `e2e/production-ready.spec.ts` | Final production-readiness suite (commit `5dd81e0`) |

Helpers live in `e2e/_helpers.ts` (excluded from Playwright's default
`*.spec.ts` glob via the `_` prefix).

## Running locally

```bash
# One-time: install browser binaries
pnpm test:e2e:install

# Run the suite against a freshly-started dev server
pnpm test:e2e

# Run against a deployed preview URL
PLAYWRIGHT_BASE_URL=https://preview-abc.watt-city.vercel.app \
  PLAYWRIGHT_WEBSERVER=0 pnpm test:e2e
```

## Visual regression (6.7.4)

Each E2E flow can attach a screenshot via
`await expect(page).toHaveScreenshot("name.png", { maxDiffPixelRatio: 0.02 });`.
We'll enable visual regressions once the UI stabilises in Phase 7 — while
we're actively rebasing styles, every visual assertion becomes a flaky
merge-blocker.

## CI wiring (future)

- `.github/workflows/e2e.yml` (Phase 10.2 follow-up) spins up the dev
  server, runs `pnpm test:e2e`, uploads the HTML report as an artifact.
- Current constraints: Playwright browsers add ~300 MB to the agent
  cache; slow on free CI runners but fine on GitHub's standard.

## Troubleshooting

- "Browser binaries missing": run `pnpm test:e2e:install`.
- "net::ERR_CONNECTION_REFUSED": the `webServer` block in
  `playwright.config.ts` expects port 3000 free. Kill any other
  `next dev` first.
- Test flakes on first run: set `retries: 2` in the config (CI default
  already does this).
