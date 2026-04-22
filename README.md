# Watt City

Gamified financial education for kids (ages 9–14). Play minigames to earn
resources, build your city, take a mortgage, learn about RRSO/APR without
touching real money. Pitched to PKO BP as an SKO 2.0 partnership prototype.

**🏆 1st place — PKO Gaming track, ETHSilesia 2026.** Post-hackathon
development continues here on `main`; partnership path with PKO BP is
active.

> The original XP Arena prototype (9 evergreen games + AI rotation) is
> preserved at the `xp-arena-final-v1.0` tag. Pre-merge feature branches
> are preserved under `archive/*` tags — see "Repo history" below.

## Current state (2026-04-22)

Production on https://watt-city.vercel.app. 635 / 635 vitest across 80
files, 13 Playwright specs (~600 E2E assertions), 79 API routes,
76 static pages, 4 locales (423 keys each, zero drift).

**Shipped core loop**
- **Hourly AI rotation**: fresh Sonnet/Haiku game every hour, single-flight
  lock, idempotent `rotate-if-due` endpoint; three converging triggers
  (external pinger + Vercel Cron safety net + on-render lazy backstop).
  See ADR `docs/decisions/001-hourly-rotation-on-hobby.md`.
- **Resource ledger**: 7 resources (⚡ 🪙 🧱 🪟 🔩 💾 💵), append-only ledger
  with SADD-backed idempotency, backfill endpoint for legacy XP Arena
  users, nav ResourceBar honouring MVP-vs-coming-soon state.
- **20-slot city map** at `/miasto`: signup-gifted Domek, earn-to-unlock
  gating, place/upgrade/demolish (50% refund, Domek-protected), slot
  category restrictions, rate-limited 5 ops/min.
- **Hourly cashflow tick** with 30-day offline catch-up cap, citywide-
  landmark multiplier, fires on every authenticated render behind a
  30-second single-flight lock.
- **Mortgage engine**: amortized monthly payment (8% standard / 5%
  preferred), 12/24/36-month terms, cap = min(12 × monthly cashflow,
  50 000 W$), credit score 0–100 (+1 on-time / −5 miss / −20 default
  after 3 consecutive misses), early repayment bonus.
- **9 evergreen minigames** + **daily AI challenge** with a top-3 Hall-of-Fame.
- **Parent observer flow** (V4.6): parent-link bridge (invite code +
  consent), `/rodzic` dashboard, GDPR-K gating for under-16 accounts.
- **Teacher/classroom flow**: `/nauczyciel` class dashboard, invite
  codes, per-class leaderboard, teacher onboarding tour.
- **Notifications**: server ledger of tier-ups + mortgage-missed events,
  bell dropdown with unread badge, quiet-hours push gate.
- **Web3 opt-in** (default off): soulbound `WattCityMedal` ERC-721 on
  Base Sepolia, parent-gated mint, burn-on-revoke (GDPR Art. 17).
- **4 langs** (PL default · UK · CS · EN).

**Hardening since 2026-04-19 hackathon day**
- awardXP single-flight race fixed (`kvSetNX` lock + 5× exp-backoff).
- CSRF double-submit via `proxy.ts` (Next.js 16 middleware rename) +
  `CsrfBootstrap` monkey-patching `window.fetch` so every mutating call
  picks up `x-csrf-token` without per-component wiring.
- Cron-auth consolidated to `lib/cron-auth.ts` (4 duplicates collapsed),
  NODE_ENV-gated dev bypass.
- Per-IP rate-limit for `/api/auth/register` + `/login`; parental-consent
  mail via Resend → SendGrid → log-only fallback (`lib/mailer.ts`).
- 2026-04-22 UX/E2E sweep: unlit buildings render true silhouettes
  (hero-copy parity), `/api/score` parallelises Redis hops, notification
  popover repositioned so it stops bleeding through the resource-bar,
  onboarding tour uses `keepalive` + localStorage so the modal never
  resurrects after the user completes it, Playwright webServer blanked
  Upstash env so `gp_*`/`pr_*`/… test accounts no longer leak into the
  production leaderboard (+ new `/api/admin/purge-e2e-accounts` cleans
  up historical leakage). See
  [`docs/progress/2026-04-22-ux-fixes-batch.md`](docs/progress/2026-04-22-ux-fixes-batch.md).

## Future roadmap

Near-term, no specific date — tracked in `docs/SKO-BACKLOG.md`:

- **PKO partnership path**: audit closure for the web3 layer, handoff
  docs for SKO 2.0 product team. Precondition for mainnet.
- **City widget iteration** (home page): the "Tvé město" card's empty
  centre needs content — candidates are a mini-skyline preview, XP-today /
  streak / to-next-level stat trio, or a "today's challenge" CTA. Design
  still open, flagged from the 2026-04-22 user-testing pass.
- **Real-device mobile matrix**: the Playwright mobile-safari / mobile-
  chrome specs pass against bundled webkit/chromium, but full real-device
  coverage (actual iOS Safari class-rule parser, Android Chrome PWA
  install flow) is pending.
- **Content expansion**: more per-kind evergreen questions to stretch
  the 9-game pool, native-speaker polish pass on the UK locale (calques
  flagged in `docs/progress/2026-04-22-docs-review.md`).
- **Observability**: structured JSON logs already in place; external
  sink (Grafana / Datadog) + alerting is the next step.
- **School pricing**: per-class feature flag + stripe-backed plan —
  scope still being sized; partnership conversations are upstream.

Longer-term, subject to product direction:

- **Marketplace** for resource trading between kids (ADR pending — see
  D10).
- **PKO Junior mirror**: read-only parental mirror of the kid's city
  into the real PKO Junior app surface.
- **Resource decay** / seasonal events to sustain engagement past the
  initial build-out phase.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19.2
- TypeScript strict
- Tailwind CSS 4
- Upstash Redis for persistent leaderboards, user stats, AI-game storage, duel rooms (in-memory fallback for local dev)
- Zod for API-payload and AI-pipeline validation
- HMAC-signed cookie sessions + scrypt password hashes (no auth library)
- Anthropic SDK (`@anthropic-ai/sdk`) for the daily AI-generated challenge
- i18n across PL (default), UK, CS, EN — cookie-driven, server-rendered

## Features

- **9 evergreen minigames**: Finance Quiz, Math Sprint, Memory Match, Word
  Scramble, Budget Balance, Currency Rush, Power Flip, Energy Dash, Stock Tap
- **Daily AI challenge**: `claude-sonnet-4-6` generates a fresh quiz /
  scramble / price-guess every 24 h (Vercel Cron). Up to 3 live AI games at
  once; top-3 players get a permanent medal in Hall of Fame.
- **Duel mode**: create a 6-char code, 2 players race the same seeded round,
  winner gets a global-leaderboard bonus.
- **Level system**: 9 tiers, each unlocking new building upgrades in the
  Katowice cityscape SVG.

## Structure

```
app/
  api/
    auth/{register,login,logout}/route.ts
    score/route.ts               # accepts both canonical + ai-<id> game IDs
    leaderboard/route.ts
    duel/{create,[code]}/route.ts
    cron/daily-game/route.ts     # Vercel Cron entrypoint for AI pipeline
    lang/route.ts                # cookie-based locale switcher
  games/
    page.tsx                     # hub + CityScene
    <9 evergreen games>/page.tsx
    ai/[id]/page.tsx             # renders an active AI game by ID
  duel/, leaderboard/, sin-slavy/, o-platforme/, ochrana-sukromia/
  page.tsx                       # landing / dashboard
components/
  games/                         # per-game client components + ai-*-client.tsx
  city-scene.tsx                 # SVG panorama, wires construction site to live AI game
  site-nav.tsx, dashboard.tsx, ...
lib/
  ai-pipeline/
    types.ts                     # zod schemas (GameSpec discriminated union)
    research.ts                  # deterministic theme rotation
    generate.ts                  # Claude call w/ prompt caching + mock fallback
    publish.ts                   # Redis persist, TTL, portfolio dedup, eviction
  redis.ts, session.ts, auth.ts, leaderboard.ts, duel.ts,
  games.ts, user-stats.ts, level.ts, i18n.ts, i18n-server.ts
  content/                       # per-game PL/UK/CS/EN question + scenario pools
  locales/                       # 4-language dict
```

## Dev

```bash
pnpm install
cp .env.example .env.local       # optional; without Upstash the app runs in-memory
pnpm dev                         # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` the AI pipeline serves deterministic mock specs
(`model: "mock-v1"`) — judges can still hit `/api/cron/daily-game` to mint
one, then play it at `/games/ai/<id>`.

## Adding a new evergreen game

1. Register in `lib/games.ts` (`id`, `title`, `xpCap`, building glyph, …).
2. Create `app/games/<id>/page.tsx` — server component, pull session,
   redirect to `/login` if unauthenticated, pass `dict` to the client.
3. Put the game loop in `components/games/<id>-client.tsx`.
4. On round end, POST `/api/score` with `{ gameId, xp }`. The backend caps
   XP by `xpCap` and writes to `xp:leaderboard:global` + `xp:leaderboard:game:<id>`.
5. Add per-lang content if needed (e.g. `lib/content/<id>.ts` with
   `PL_ / UK_ / CS_ / EN_` pools + `*For(lang)` accessor).

## Env

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — persistent storage
- `SESSION_SECRET` — HMAC key for cookie sessions (production: required, ≥16 chars)
- `ANTHROPIC_API_KEY` — enables the real AI-game generator (omit to stay on mocks)
- `CRON_SECRET` — shared secret Vercel Cron / external pinger send in
  `Authorization: Bearer`; omit during dev to allow any caller
- `ADMIN_SECRET` — required by `/api/admin/*` in production
- `REGISTER_IP_LIMIT` / `LOGIN_IP_LIMIT` — per-IP rate-limit ceilings for
  `/api/auth/register` and `/api/auth/login` (defaults 5/h and 20/min;
  Playwright bumps both to `1000` so test runs aren't self-throttled)
- Mail adapter (`lib/mailer.ts`; parental-consent invites, falls back to
  log-only if nothing is configured):
  - `RESEND_API_KEY` — preferred provider
  - `SENDGRID_API_KEY` — fallback provider
  - `MAIL_FROM` — default `From` address (e.g. `Watt City <no-reply@watt-city.vercel.app>`)
- `APP_BASE_URL` — absolute base for parent-consent links emitted from
  server code that has no request context (default `https://watt-city.vercel.app`)
- Web3 (opt-in, default off — see "Web3 surface" below):
  - `NEXT_PUBLIC_WEB3_ENABLED=true` activates the `/profile` on-chain gallery
  - `NEXT_PUBLIC_WEB3_CHAIN_ID=84532` (Base Sepolia testnet)
  - `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect / Reown cloud project id
  - `WEB3_CONTRACT_ADDRESS` — deployed `WattCityMedal` address
  - `WEB3_RELAYER_PRIVATE_KEY` — EOA funded with testnet ETH (never committed)
  - `NFT_STORAGE_API_KEY` — IPFS pin service for medal metadata

## Web3 surface (opt-in)

Watt City ships an **optional** soulbound-NFT layer for ETHSilesia 2026's
Web3/Base track. Kids' off-chain achievements mirror to on-chain
`WattCityMedal` tokens **only with parent consent** (V4.6 observer flow)
and **burn on consent revocation** (GDPR Art. 17). Every under-16 account
without `web3OptIn === true` is hard-gated server-side (HTTP 403) — the
client cannot bypass it. Default path of the app has zero web3 imports
(tree-shaken behind `NEXT_PUBLIC_WEB3_ENABLED`); 99% of users never see
a wallet button.

| Field | Value |
|---|---|
| Chain | {{CHAIN_NAME}} (chainId `{{CHAIN_ID}}`) |
| Contract | `WattCityMedal` — soulbound ERC-721, ~200 LOC, invariant-tested |
| Address | `{{CONTRACT_ADDRESS}}` |
| BaseScan | [{{CONTRACT_ADDRESS}}]({{BASESCAN_URL}}) |
| Source | `contracts/WattCityMedal.sol` |
| Tests | `contracts/test/WattCityMedal.test.ts` (source-level invariants) |
| Audit | Post-pilot. Mainnet gated on external audit per `docs/web3/DEPLOY.md §5` |
| Submission one-pager | [`docs/web3/SUBMISSION.md`](docs/web3/SUBMISSION.md) |
| Architecture | [`docs/web3/PLAN.md`](docs/web3/PLAN.md) |
| Runbook | [`docs/web3/DEPLOY.md`](docs/web3/DEPLOY.md) |
| Demo video (2 min) | {{VIDEO_URL}} |

Running the Web3 surface locally requires Hardhat 2.x on Node 22 LTS (or
Foundry); see `docs/web3/DEPLOY.md §1–§3` for the toolchain. Do **not**
deploy to Base mainnet before the audit closes.

## Smoke test

`docs/SMOKE-TEST.md` is the end-to-end runbook. Takes ≤ 10 min covering
auth, game → resource, build/upgrade/demolish, cashflow tick, mortgage,
rotation, language switch, mobile.

## Tests

`pnpm test` runs the vitest suite (635/635 across 80 files as of
2026-04-22 — research bucket, rotation idempotency, resource yield math,
ledger dedupe, building place/upgrade/demolish, tick catch-up with 30-day
cap, amortization formula, default after 3 misses, cron auth matrix,
rate-limit keying, mailer fallback, awardXP lock, parent-link redeem).

Playwright E2E (13 specs): `pnpm test:e2e` covers smoke, prod-smoke,
api-contracts, security, data-integrity, a11y-matrix, golden-paths,
perf, production-ready, rate-limits, bot-protection (opt-in), pwa,
smoke.mobile, smoke.cross.

> E2E test accounts never reach the production Upstash — `playwright.config.ts`
> blanks `UPSTASH_REDIS_REST_URL` + `_TOKEN` for its webServer so
> `lib/redis.ts` falls back to its in-memory store. If you accidentally
> ran an older commit against prod, `scripts/purge-e2e-accounts.sh`
> cleans historical `gp_*`, `pr_*`, `rl_*`, … leftovers via
> `/api/admin/purge-e2e-accounts` (admin-bearer, `--commit` to actually
> delete; dry-run by default).

## Docs

`docs/README.md` is the index. Highlights:
- `docs/SKO-BACKLOG.md` — 11-phase backlog, ~300 items
- `docs/ECONOMY.md` — every number, every formula
- `docs/ARCHITECTURE.md` — schemas, API contracts, Redis keys
- `docs/OPERATIONS.md` — deploy, monitor, recover
- `docs/decisions/` — ADRs
- `docs/progress/<date>.md` — agent session logs

## Repo history

Single-branch workflow (`main` only) since 2026-04-20. Pre-merge state is
preserved in git tags:

| Tag | What |
|---|---|
| `xp-arena-final-v1.0` | XP Arena prototype final commit (`f1b294a`) before Watt City merge |
| `archive/watt-city-v3` | 21 commits of V3.1..V3.7 development trail |
| `archive/watt-city-cleanup` | 7 commits of UX-audit cleanup |
| `archive/watt-city-refactor` | V2 critical polish + feature-flag admin |
| `archive/ux-fixes-2026-04-19` | 12 commits of UX fixes (cashflow-hud, onboarding-tour, toasts, cookie-consent) |
| `archive/ux-audit-2026-04-19` | UX audit gap matrix + 6 personas |

Recover any archive: `git checkout archive/<name>`.
