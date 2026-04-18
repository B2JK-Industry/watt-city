# XP Arena

Gamifikovaná edukačná platforma. Hráč sa zaregistruje, hrá minihry (financie,
matematika, vedomosti) a zbiera XP do globálneho + per-game rebríčka.

Tento projekt je vstup do kategórie **PKO XP: Gaming** (ETHSilesia 2026).

## Stack

- Next.js 16 (App Router, Turbopack default) + React 19.2
- TypeScript strict
- Tailwind CSS 4
- Upstash Redis pre persistent leaderboard + usery (s graceful in-memory fallbackom lokálne)
- Zod pre validáciu API payloadov
- HMAC-signed cookie sessions, scrypt password hashes (žiadne externé auth knižnice)

## Štruktúra

```
app/
  api/
    auth/{register,login,logout}/route.ts
    me/route.ts
    score/route.ts
    leaderboard/route.ts
  games/
    page.tsx               # hub
    finance-quiz/page.tsx
    math-sprint/page.tsx
  leaderboard/page.tsx
  login/page.tsx
  register/page.tsx
  page.tsx                 # landing
  layout.tsx, globals.css
components/
  site-nav.tsx, logout-button.tsx, auth-form.tsx
  games/
    finance-quiz-client.tsx
    math-sprint-client.tsx
lib/
  redis.ts                 # Upstash client + in-memory fallback
  session.ts               # HMAC-signed cookie sessions
  auth.ts                  # register/login + scrypt password hashing
  leaderboard.ts           # awardXP, top-N
  games.ts                 # game registry
  content/finance-quiz.ts  # otázky kvízu
```

## Dev

```bash
pnpm install
cp .env.example .env.local   # nepovinné — bez Upstash beží in-memory
pnpm dev
```

Otvor http://localhost:3000.

## Pridanie novej minihry

1. Zaregistruj hru v `lib/games.ts` (`id`, `title`, `xpCap`, ...).
2. Vytvor stránku `app/games/<id>/page.tsx` — server component, pull auth session,
   redirect na `/login` ak nie je prihlásený.
3. Logiku hry umiestni do klientskeho komponentu v `components/games/<id>-client.tsx`.
4. Na konci kola klient POST-ne `/api/score` s `{ gameId, xp }`. Backend skóre
   capne podľa `xpCap` a zapíše do `xp:leaderboard:global` + `xp:leaderboard:game:<id>`.

## Env

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — pre persistentný rebríček
- `SESSION_SECRET` — HMAC key pre cookie sessions (prod: povinné, >=16 znakov)
