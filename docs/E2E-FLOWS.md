# End-to-end critical flows — Phase 6.7.3

The backlog calls for 10 Playwright flows. `e2e/smoke.spec.ts` covers the
first three. The remaining seven live as stubbed specs with a TODO — one
per flow so PRs can tick them off individually.

| # | Flow | Status | Spec file |
|---|---|---|---|
| 1 | Landing loads + axe clean | ✅ done | `e2e/smoke.spec.ts` |
| 2 | Register → redirect to /games | ✅ done | `e2e/smoke.spec.ts` |
| 3 | Logged-in can open /miasto | ✅ done | `e2e/smoke.spec.ts` |
| 4 | Play finance-quiz → resources credit | ⏳ pending | `e2e/flow-play-score.spec.ts` (TODO) |
| 5 | Place Mała elektrownia after earning 50 ⚡ | ⏳ pending | `e2e/flow-build.spec.ts` (TODO) |
| 6 | Upgrade Domek → yield grows | ⏳ pending | `e2e/flow-upgrade.spec.ts` (TODO) |
| 7 | Take mortgage + see loan in list | ⏳ pending | `e2e/flow-mortgage.spec.ts` (TODO) |
| 8 | Tier-up toast fires when tier crosses | ⏳ pending | `e2e/flow-tier-up.spec.ts` (TODO) |
| 9 | Friend request + accept + visit city | ⏳ pending | `e2e/flow-friends.spec.ts` (TODO) |
| 10 | Marketplace list + buy flow (two accounts) | ⏳ pending | `e2e/flow-marketplace.spec.ts` (TODO) |

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
