# Watt City

Gamified financial education for kids (ages 9–14). Play minigames to earn
resources, build your city, take a mortgage, learn about RRSO/APR without
touching real money. Pitched to PKO BP as an SKO 2.0 partnership prototype.

ETHSilesia 2026 entry. Watt City lives on the `watt-city` branch; the
original XP Arena demo (9 evergreen games + AI rotation) lives on `main`
and is frozen. See `docs/BRANCHING.md` for the rationale.

## Phase-1 MVP — what's in (2026-04-18)

- **Hourly AI rotation**: fresh Sonnet/Haiku game every hour, single-flight
  lock, idempotent `rotate-if-due` endpoint; three converging triggers
  (external pinger + Vercel Cron safety net + on-render lazy backstop).
  See ADR `docs/decisions/001-hourly-rotation-on-hobby.md`.
- **Resource ledger**: 7 resources (⚡ 🪙 🧱 🪟 🔩 💾 💵), append-only ledger
  with SADD-backed idempotency, backfill endpoint for legacy XP Arena
  users, nav ResourceBar honouring MVP-vs-coming-soon state.
- **20-slot city map** at `/miasto`: signup-gifted Domek, earn-to-unlock
  gating (50 ⚡ for Mała elektrownia, 50 🪙 for Sklepik), place/upgrade/
  demolish (50% refund, Domek-protected), slot category restrictions,
  rate-limited 5 ops/min.
- **Hourly cashflow tick** with 30-day offline catch-up cap, citywide-
  landmark multiplier, fires on every authenticated render behind a
  30-second single-flight lock.
- **Mortgage engine**: amortized monthly payment (8% standard / 5%
  preferred), 12/24/36-month terms, cap = min(12 × monthly cashflow,
  50 000 W$), credit score 0–100 (+1 on-time / −5 miss / −20 default
  after 3 consecutive misses), early repayment bonus.
- **Coming-soon tiles** for leasing / kredyt obrotowy / kredyt konsumencki
  / kredyt inwestycyjny / parent dashboard / class mode / p2p trade /
  PKO Junior mirror.
- **New-game toast**: 30s client polling + `router.refresh` on new id.
- **4 langs** (PL default · UK · CS · EN).

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

## Smoke test

`docs/SMOKE-TEST.md` is the end-to-end runbook. Takes ≤ 10 min covering
auth, game → resource, build/upgrade/demolish, cashflow tick, mortgage,
rotation, language switch, mobile.

## Tests

`pnpm test` runs the vitest suite (49+ unit tests as of this writing
covering research bucket, rotation idempotency, resource yield math,
ledger dedupe, building place/upgrade/demolish, tick catch-up with 30-day
cap, amortization formula, default after 3 misses).

## Docs

`docs/README.md` is the index. Highlights:
- `docs/SKO-BACKLOG.md` — 11-phase backlog, ~300 items
- `docs/ECONOMY.md` — every number, every formula
- `docs/ARCHITECTURE.md` — schemas, API contracts, Redis keys
- `docs/OPERATIONS.md` — deploy, monitor, recover
- `docs/decisions/` — ADRs
- `docs/progress/<date>.md` — agent session logs
