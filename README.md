# XP Arena

Gamified financial + energy-literacy platform for Gen Z in Katowice. Play
minigames, earn Watts (XP), and gradually electrify your personal building —
from a miner's shed in Nikiszowiec to Varso Tower (tallest in the EU).

ETHSilesia 2026 entry — **PKO XP: Gaming** track.

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
- `CRON_SECRET` — shared secret Vercel Cron sends in `Authorization: Bearer`;
  omit during dev to allow any caller
