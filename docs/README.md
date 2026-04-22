# Watt City — documentation

> Watt City = the Phase-1+ pivot from XP Arena. SKO 2.0 = pitch context for PKO partnership.
> **1st place, PKO Gaming track, ETHSilesia 2026** (2026-04-19).
> Single-branch workflow (`main` only) since 2026-04-20. Pre-merge state lives at `xp-arena-final-v1.0` and `archive/*` tags — see the README "Repo history" section.

## Read in this order

| # | Doc | Audience | What's inside |
|---|---|---|---|
| 1 | [`SKO-VISION.md`](./SKO-VISION.md) | Everyone | Why this exists, audience, core loop, MVP scope |
| 2 | [`SKO-BACKLOG.md`](./SKO-BACKLOG.md) | Tech lead, PM | All work items across 11 phases (~300 items) |
| 3 | [`SKO-GAMES.md`](./SKO-GAMES.md) | Game designer | Per-kind catalog, 30-theme target, resource matrix |
| 4 | [`ECONOMY.md`](./ECONOMY.md) | Engineer, balance designer | Every formula, every number, balance sheets |
| 5 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Engineer | Schemas, API contracts, data flows, Redis keys, state machines |
| 6 | [`GAMES-DETAIL.md`](./GAMES-DETAIL.md) | Engineer adding a new kind | Full per-kind spec: zod, prompts, scoring, edge cases |
| 7 | [`SECURITY-AND-COMPLIANCE.md`](./SECURITY-AND-COMPLIANCE.md) | Engineer, lawyer | Threat model, GDPR, GDPR-K, KNF, content moderation |
| 8 | [`OPERATIONS.md`](./OPERATIONS.md) | DevOps, on-call | Deploy, monitor, incident playbooks, cost |
| 9 | [`TARGET-BOUNTIES.md`](./TARGET-BOUNTIES.md) | PM, founder | ETHSilesia 2026 hackathon prize tracks we target |

## Decisions resolved (so far)

| # | Question | Decision |
|---|---|---|
| **D1** | Public branding | Watt City (rename now); SKO 2.0 = pitch context only |
| **D2** | Cron infrastructure | Lazy-only + free external pinger; no Vercel Pro yet |
| **D4** | Starter buildings | Only Domek; everything else earned by playing games |
| **D5** | Mortgage params | 6% APR std / 5% preferred, 12/24/36 mo, 12× monthly cashflow cap |

## Decisions still open

| # | Question |
|---|---|
| D3 | Currency display: 💵 zł / 💰 W$ / 🪙 W-coin |
| D6 | Cron at night (00:00–06:00): full / pause / /3h |
| D7 | Mascot: keep Żyrafa / new Silesian dwarf / none |
| D8 | Visual brand: full PKO blue pivot / keep neo-brutalist + skin |
| D9 | Resource decay |
| D10 | Marketplace launch policy |
| D11 | School pricing |
| D12 | Web3 layer (yes/no/opt-in) |

## Open questions for technical decision

See `ARCHITECTURE.md` § 17 for architecture-level open questions.

## How to contribute (if team grows)

1. Read this file
2. Pick a backlog item
3. Read relevant detail doc
4. Branch from `main`
5. Implement
6. Test (unit + manual smoke)
7. PR to `main`
8. After merge, update CHANGELOG + relevant doc if behaviour changed

## Recent sessions

- [`progress/2026-04-22-bug-hunt.md`](./progress/2026-04-22-bug-hunt.md) — two-agent audit of the repo after the UX-fix batch surfaced 4 regressions + 7 pre-existing bugs. All 11 fixed: `/api/score` switched to Next.js `after()`; notification-bell dropped `role=dialog`; purge endpoint narrowed defaults + added confirm token; new `lib/player-lock.ts` wraps every RMW mutator (buildings/loans/market/profile/notifications) to close a class of data-integrity races; admin + cron bearers use `timingSafeEqual`; web-vitals gets route allowlist + per-IP rate limit + quantised histogram; login gains a per-username ceiling for school NAT tolerance; rate-limit swaps GET-then-SET for atomic `INCR`; notifications POST gets Zod validation.
- [`progress/2026-04-22-ux-fixes-batch.md`](./progress/2026-04-22-ux-fixes-batch.md) — user-testing pass on prod surfaced 5 issues; commit `f124349` ships: unlit-buildings silhouette, `/api/score` parallelisation, notification-bell popover repositioning, onboarding tour `keepalive` + LS cache + manual replay button, E2E leaderboard pollution fix (playwright webServer Upstash blanking + `/api/admin/purge-e2e-accounts` cleanup endpoint + `scripts/purge-e2e-accounts.sh`). One item (home-card empty centre) deferred pending design.
- [`progress/2026-04-22-docs-review.md`](./progress/2026-04-22-docs-review.md) — cross-locale documentation sweep (4 agents in parallel across 83 markdown files + 4 locales + lib docblocks). CS/UK translation fixes applied; UK flagged for native-speaker polish pass.
- [`progress/2026-04-21-review-fix.md`](./progress/2026-04-21-review-fix.md) — post-merge convergence pass: fixed 3/3 E2E failures (footer a11y, register button regex, PII-regex-hostile test username), 5 genuine lint errors, relaxed two React 19.2 strict rules that produced false positives.
- [`progress/2026-04-21-prod-smoke.md`](./progress/2026-04-21-prod-smoke.md) — read-only prod smoke suite (`e2e/prod-smoke.spec.ts`) caught three classes of real a11y regressions on https://watt-city.vercel.app: sub-AA `text-zinc-500` on card surfaces (64 occurrences swept), opacity-keyframed slide-up/stagger-in that flagged transient mid-frame low contrast, and `<svg role="img">` with focusable children. Plus an inline-link-in-text contrast rule. End state: 17/17 prod-smoke green.
- [`progress/2026-04-21-deep-audit.md`](./progress/2026-04-21-deep-audit.md) — full 12-phase audit: API-contract + security + data-integrity + i18n + a11y-matrix sweeps. 525 dev e2e assertions + 56 prod assertions all green. Real bugs fixed: admin rotate-ai theme leak, web-vitals 500-on-bad-body, cron auth-bypass in 4 routes (consolidated to `lib/cron-auth.ts`). Prompt: [`progress/2026-04-21-deep-audit-prompt.md`](./progress/2026-04-21-deep-audit-prompt.md).
- Post-audit backlog sweep (commits `91139f3` + `5dd81e0`, 2026-04-21): 13-item production-readiness backlog closed (per-IP rate-limiter for register/login, `lib/mailer.ts` Resend/SendGrid/log-only adapter for parental-consent email, `proxy.ts` rename, awardXP single-flight lock, parent-link bridge). New E2E specs: `production-ready`, `rate-limits`, `bot-protection` (opt-in), `pwa`, `smoke.mobile`, `smoke.cross`. End state 2026-04-22: **635/635 vitest (80 files) · 81 API routes · 76 static pages · 14 Playwright specs**.
