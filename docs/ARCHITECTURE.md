# Watt City — Architecture

System design at the level a senior engineer needs to start coding. Schemas, data flow, API contracts, state machines, idempotency, lifecycle hooks.

## 1. Stack overview

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (React 19, client islands)                          │
│   – LiveAiBuilding (SVG)                                     │
│   – CityMap (drag/click slot interactions)                   │
│   – BuildModal, MortgageModal, GameClient                    │
│   – SSE listener for new-game-opened                         │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP / SSE
┌──────────────▼──────────────────────────────────────────────┐
│ Next.js 16 (App Router, RSC + Turbopack)                     │
│   – Server components fetch state, render shell              │
│   – API routes for mutations                                 │
│   – Vercel cron for scheduled jobs                           │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────────────┐
       ▼                        ▼
┌──────────────┐         ┌─────────────────────┐
│ Upstash Redis│         │ Anthropic API       │
│  – KV        │         │  – Sonnet 4.6 (gen) │
│  – Sorted Set│         │  – Haiku 4.5 (i18n) │
│  – Pub/Sub   │         └─────────────────────┘
└──────────────┘
```

No SQL database. Redis is the only persistent store. Everything else is computed.

## 2. Data model — full schemas

### 2.1 Player state

`xp:player:<username>` (Redis JSON string)

```ts
type PlayerState = {
  username: string;            // immutable, lowercase, primary key
  createdAt: number;           // epoch ms
  
  resources: {
    watts: number;
    coins: number;
    bricks: number;
    glass: number;
    steel: number;
    code: number;
    cashZl: number;
  };
  
  buildings: BuildingInstance[];
  loans: Loan[];
  
  creditScore: number;         // 0..100, default 50
  tier: number;                // 1..9, derived (cached)
  
  unlocks: {
    catalog: string[];         // catalogIds player has unlocked (visible without lock)
    achievements: string[];
  };
  
  stats: {
    totalGamesPlayed: number;
    totalPlaytimeMs: number;
    streakDays: number;
    longestStreak: number;
    lastPlayedAt: number;
  };
  
  prefs: {
    notificationsPush: boolean;
    notificationsEmail: boolean;
    quietHoursStart: number;   // 0..23 hour
    quietHoursEnd: number;     // 0..23 hour
    avatarId: string;
    displayName: string;       // optional, separate from username
  };
  
  lastCashflowTickAt: number;  // for offline catch-up
  lastSeenAt: number;          // most recent successful auth
};
```

### 2.2 Building instance

```ts
type BuildingInstance = {
  id: string;                  // unique per player (e.g. nanoid)
  catalogId: string;           // ref into BUILDING_CATALOG
  slotId: number;              // 0..19, references slot on map
  level: number;               // 1..10
  builtAt: number;
  lastUpgradeAt: number;
  
  // Cached derived metrics for fast read; recompute on level change
  currentYieldPerHour: Resources;
  currentMaintenanceCost: number;  // cashZl per hour
  
  // Cumulative stats
  totalResourcesProduced: Resources;  // running tally
  upgradeHistory: { atLevel: number; upgradedAt: number }[];
};
```

### 2.3 Loan

```ts
type Loan = {
  id: string;                  // nanoid
  type: "mortgage" | "leasing" | "kredyt-obrotowy" | "konsumencki" | "inwestycyjny";
  
  // Terms
  principal: number;           // borrowed amount (cashZl)
  rateApr: number;             // 0.06 = 6%
  termMonths: number;
  monthlyPayment: number;      // computed via amortization
  
  // Derived RRSO display
  rrso: number;                // computed effective rate including fees
  
  // Lifecycle
  startedAt: number;
  monthsPaid: number;
  outstanding: number;         // updates as payments processed
  totalInterestPaidSoFar: number;
  
  status: "active" | "paid_off" | "defaulted";
  
  // Payment tracking
  nextPaymentDueAt: number;    // epoch ms
  consecutiveMissedPayments: number;
  paymentHistory: PaymentEvent[];
};

type PaymentEvent = {
  ts: number;
  amount: number;
  status: "paid_on_time" | "paid_late" | "missed";
  remainingPrincipal: number;
};
```

### 2.4 AI game (envelope)

`xp:ai-games:<id>` (existing, unchanged from XP Arena)

```ts
type AiGame = {
  id: string;                  // ai-<base36 timestamp>
  title: string;
  tagline: string;
  description: string;
  theme: string;
  source?: string;
  
  // Visual recipe (existing)
  buildingName: string;
  buildingGlyph: string;
  buildingRoof: string;        // tailwind bg-* class (legacy)
  buildingBody: string;
  
  // The play spec (4 langs)
  spec: LocalizedSpec;         // pl/uk/cs/en × kind-specific shape
  
  // Lifecycle
  generatedAt: number;
  validUntil: number;          // epoch ms when game retires
  
  model: string;               // "claude-sonnet-4-6+claude-haiku-4-5" or "mock-v1"
  seed: number;
  
  // NEW (Watt City): which resource this game produces
  resourceYield: {
    primary: keyof Resources;
    primaryAmount: number;     // total max yield
    secondary?: keyof Resources;
    secondaryAmount?: number;
  };
  difficulty: "easy" | "medium" | "hard";
  angle: string;               // human-readable angle text
};
```

### 2.5 Resource ledger

`xp:player:<username>:ledger` (Redis LIST, LPUSH new entries)

```ts
type LedgerEntry = {
  id: string;                  // nanoid for idempotency lookups
  ts: number;                  // epoch ms
  kind: "score" | "tick" | "build" | "demolish" | "upgrade" | "loan_disburse" | "loan_payment" | "loan_default" | "marketplace_sell" | "marketplace_buy" | "admin_grant" | "achievement" | "decay";
  delta: Partial<Resources>;   // signed deltas (negative = spent)
  reason: string;              // human-readable; surface in UI
  sourceId?: string;           // for idempotency keying (e.g. "tick:slot-3:hour-12345")
  meta?: Record<string, unknown>;  // extension point
};
```

Idempotency keys live in a dedup set: `xp:player:<username>:ledger-dedup` (Redis SET) holding `${kind}:${sourceId}`. Insertion to ledger is wrapped:

```
1. SADD dedup-set "${kind}:${sourceId}" → returns 1 if new, 0 if dup
2. If new → LPUSH ledger entry, apply delta to balance
3. If dup → no-op
```

### 2.6 Marketplace listing (Phase 3)

```ts
type Listing = {
  id: string;
  sellerId: string;
  buildingSnapshot: BuildingInstance;  // frozen at listing time
  askPrice: number;
  listingFee: number;
  expiresAt: number;
  status: "active" | "sold" | "expired" | "cancelled";
  buyerId?: string;
  soldAt?: number;
};
```

`xp:marketplace:listings` is a sorted set keyed by `listingId`, scored by `expiresAt` for efficient sweep.

## 3. Redis key map

| Key pattern | Type | TTL | Purpose |
|---|---|---|---|
| `xp:user:<username>` | string (JSON) | none | Auth record (username + scrypt hash + salt + createdAt) |
| `xp:player:<username>` | string (JSON) | none | Game state (resources, buildings, loans, prefs) |
| `xp:player:<username>:ledger` | list | none | Append-only resource log |
| `xp:player:<username>:ledger-dedup` | set | none | Idempotency keys |
| `xp:stats:<username>` | string (JSON) | none | Plays / score per game (legacy XP Arena, kept for compat) |
| `xp:leaderboard:global` | sorted set | none | Sum-of-bests global XP, scored by W |
| `xp:leaderboard:game:<gameId>` | sorted set | none | Per-game best score per user |
| `xp:leaderboard:networth` | sorted set | none | NEW: city net worth (sum of building values + cash − loans) |
| `xp:ai-games:<id>` | string (JSON) | none | Live AI game envelope |
| `xp:ai-games:index` | string (JSON array) | none | Active LIVE game IDs (cap 3) |
| `xp:ai-games:archive:<id>` | string (JSON) | none | Slim archive record (no gameplay spec) |
| `xp:ai-games:archive-index` | string (JSON array) | none | Newest-first list of archived IDs |
| `xp:rotation-lock` | string | 60s | Single-flight guard for rotation |
| `xp:duel:<code>` | string (JSON) | 6h | Duel state |
| `xp:config:economy` | string (JSON) | none | Live-tunable economy constants (admin can edit) |
| `xp:notifications:<username>` | list | none | In-app notification feed |
| `xp:marketplace:listings` | sorted set | none | Active listings, scored by expiresAt |
| `xp:marketplace:listing:<id>` | string (JSON) | none | Full listing |

## 4. API surface

### 4.1 Authentication

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{username, password}` | `{ok, username}` + cookie | none |
| POST | `/api/auth/login` | `{username, password}` | `{ok, username}` + cookie | none |
| POST | `/api/auth/logout` | — | `{ok}` | session |
| GET | `/api/me` | — | full PlayerState + level info | session |
| DELETE | `/api/me` | — | `{ok, erased: keys[]}` (GDPR Art. 17) | session |

### 4.2 Game / scoring

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| POST | `/api/score` | `{gameId, xp}` | `{ok, awarded, ...}` | session |
| GET | `/api/leaderboard?game=<id>&n=20` | — | `{entries:[{username, xp, rank}]}` | none |

### 4.3 Resources & buildings

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| GET | `/api/me/resources` | — | `{resources, ledgerSummary[20]}` | session |
| POST | `/api/buildings/place` | `{slotId, catalogId}` | `{ok, building, resourcesAfter}` | session |
| POST | `/api/buildings/upgrade` | `{instanceId}` | `{ok, level, yieldNew, resourcesAfter}` | session |
| POST | `/api/buildings/demolish` | `{instanceId}` | `{ok, refund, resourcesAfter}` | session |
| POST | `/api/buildings/tick` | — | `{ok, ledgerEntries[], resourcesAfter}` (idempotent) | session |

### 4.4 Loans

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| GET | `/api/loans/quote?type=mortgage&principal=5000&termMonths=24` | — | `{monthlyPayment, totalInterest, rrso, eligibility:{ok, missing[]}}` | session |
| POST | `/api/loans/take` | `{type, principal, termMonths}` | `{ok, loan}` | session |
| POST | `/api/loans/repay-extra` | `{loanId, amount}` | `{ok, newOutstanding, newSchedule}` | session |
| GET | `/api/loans` | — | `[{loan with status}]` | session |

### 4.5 AI game lifecycle

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| GET | `/api/cron/daily-game` | — | `{ok, publishedId}` | cron secret OR open in dev |
| POST | `/api/cron/rotate-if-due` | — | `{ok, rotated[], skipped[]}` (idempotent) | cron secret |
| POST | `/api/admin/rotate-ai` | `{theme?}` | full game | admin secret |
| POST | `/api/admin/leaderboard` | `{action, gameId, username, xp?}` | top entries | admin secret |
| POST | `/api/admin/archive-cleanup` | — | `{purgedCount, keptCount, purged, kept}` | admin secret |

### 4.6 SSE / events

| Method | Path | Returns |
|---|---|---|
| GET | `/api/events/stream` | text/event-stream — emits `{type:"new-game", gameId, theme}`, `{type:"keepalive"}`, `{type:"medal-locked", username, gameId}` |

### 4.7 Marketplace (Phase 3)

| Method | Path | Body | Returns | Auth |
|---|---|---|---|---|
| GET | `/api/market/listings?building=<catalogId>` | — | `[{listing}]` | session |
| POST | `/api/market/list` | `{instanceId, askPrice, days}` | `{ok, listing}` | session, T7+ |
| POST | `/api/market/buy/:listingId` | — | `{ok, building (transferred)}` | session, T7+ |
| POST | `/api/market/cancel/:listingId` | — | `{ok}` | seller only |

## 5. Critical state machines

### 5.1 AI game lifecycle

```
[generated]   → publish() succeeds (zod validation passed)
     ↓
[live]        → in xp:ai-games:index, plays accepted, T-30m teaser shown
     ↓        T+0..1h
[expiring]    → countdown < 5min (UI shows "Wkrótce zamknięcie")
     ↓        T = validUntil
[archived]    → removed from index, archive record written, leaderboard ZSET preserved
     ↓        (envelope persists indefinitely now)
[playable-archived] → still loadable at /games/ai/<id>, scoring still works
```

State transitions atomic via single Redis MULTI/EXEC where possible.

### 5.2 Loan lifecycle

```
[quote]       → user requests, no commitment
     ↓ POST /loans/take
[active]      ← schedule loaded; nextPaymentDueAt = now + 30d
     ↓ tick processes payment
[active]      ← payment paid, monthsPaid++
     ↓ … months pass …
[paid_off]    ← outstanding == 0; +10 credit score bonus
     OR
     ↓ tick can't deduct (cashZl < monthlyPayment)
[active w/ missed=1]   → −5 score
     ↓ next month, still can't pay
[active w/ missed=2]   → −10 score; UI warning "DEFAULT IMMINENT"
     ↓ next month, still can't pay
[default]     → seize buildings, mark loan defaulted, −20 score
```

### 5.3 Building lifecycle

```
[empty slot]
     ↓ POST /buildings/place (resources sufficient, slot category matches)
[active level 1]
     ↓ POST /buildings/upgrade
[active level 2..10]
     ↓ POST /buildings/demolish (50% refund)
[empty slot]
     OR
     ↓ defaulted on loan (smallest building seized)
[empty slot]   ← 50% of build cost goes to outstanding loan principal
     OR
     ↓ marketplace_sell
[transferred]  ← building moves to buyer's slot inventory; seller's slot becomes empty
```

## 6. Cashflow tick algorithm

Pseudocode, idempotent, single-flight per (player, hour):

```
function tickPlayer(username):
    state = readPlayer(username)
    now = Date.now()
    sinceLastTick = now - state.lastCashflowTickAt
    if sinceLastTick < 1 hour:
        return { skipped: true }
    
    elapsedHours = floor(sinceLastTick / 3600s)
    cappedHours = min(elapsedHours, 30 days * 24)  // offline catch-up cap
    
    cityMult = computeCitywideMultipliers(state.buildings)
    
    for building in state.buildings:
        kindMult = computeKindMultipliersFor(building, state.buildings)
        for h in 0..cappedHours-1:
            tickHour = floor((state.lastCashflowTickAt + h*3600s) / 3600s)
            sourceId = `tick:${building.id}:${tickHour}`
            if alreadyDeduped(username, sourceId):
                continue
            grossYield = building.yield(level)
            netYield = applyMults(grossYield, cityMult, kindMult)
            appendLedger({
                kind: "tick",
                sourceId,
                delta: netYield,
                reason: `cashflow ${building.catalogId} L${building.level}`,
            })
            applyDeltaToBalance(state, netYield)
    
    state.lastCashflowTickAt = now
    
    // Process loan payments due in this window
    for loan in state.loans:
        if loan.status == "active" && loan.nextPaymentDueAt <= now:
            processLoanPayment(state, loan, now)
    
    writePlayer(state)
    return { ok: true, ledgerAdditions: …, balanceAfter: state.resources }
```

Concurrency: locked behind `xp:tick-lock:<username>` (Redis SET NX with 30s TTL). If lock held, skip tick (will be retried on next cron or page render).

## 7. Single-flight rotation

Multiple Vercel functions could try to rotate the AI game simultaneously (cron + lazy + manual admin). To prevent dupes:

```
LOCK_KEY = "xp:rotation-lock"

function rotateIfDue():
    locked = redis.set(LOCK_KEY, processId, { nx: true, ex: 60 })
    if not locked:
        return { skipped: true, reason: "another rotation in flight" }
    try:
        index = readIndex()
        for id in index:
            game = getAiGame(id)
            if game.validUntil <= now:
                archiveAndRemove(id)
        if shouldGenerateNew(index, now):
            runPipeline()
        return { ok: true, ... }
    finally:
        redis.del(LOCK_KEY)
```

60s TTL on lock prevents permanent block on crash. Lock value = `processId` so we can detect "lock held by us" vs "we crashed and now own a stale lock".

## 8. SSE pub/sub

Server uses Upstash pub/sub OR a simple polling mechanism (Upstash free tier doesn't have native pub/sub):

```
// Simple polling fallback
GET /api/events/stream
- Every 5s, scan for "events to push" set:
  - newGameSinceLastPoll(lastSeenTs)
  - medalLockedSinceLastPoll(lastSeenTs)
  - cashflowTickSummary(username, lastSeenTs)
- Emit SSE events for any
- Send keepalive comment every 30s
```

Client reconnects on disconnect with `Last-Event-ID` header. Server uses ID = epoch ms.

## 9. Translation pipeline (Sonnet + Haiku)

Already shipped. Key invariants:

```
1. Sonnet generates kind-specific PL spec (no anyOf/$defs)
2. Haiku ×3 in parallel translates to UK/CS/EN, given:
   - SOURCE = full PL spec as JSON
   - System prompt enforces locked invariants (correctIndex, truth, isTrue, rank, unit, ...)
3. mergeStructure(pl, translated) re-asserts all locked fields from PL
4. zod validates each variant before commit
5. LocalizedSpec assembled and persisted
```

Failure modes & fallbacks:
- Sonnet returns invalid JSON → error, runPipeline returns ok:false, no Redis write
- Haiku translation fails → fall back to PL spec for that lang (rare; logged)
- Haiku produces wrong unit → mergeStructure overrides from PL (silent; fine)
- Total time budget: 60s (Vercel function maxDuration on cron route)

## 10. Frontend architecture

### Server vs client components

- **Server**: page-level shells, data fetches, SSR of read-only views (city scene, leaderboards, sin-slavy)
- **Client**: interactive game clients, build/upgrade modals, SSE listeners, animations

### Component tree (Watt City `/games` page)

```
GamesPage (RSC)
├── Header (Wars: stats, tier, level)
├── ResourceBar (RSC, polls every 30s server-side)
│   └── ResourceTooltip[6]
├── CityMap (client island, hosts SVG)
│   ├── BuildingSlot[20] (each is an island for click handling)
│   │   └── BuildingVisual(catalogId, level)  // hashed visual
│   └── LiveAiBuildingSlot (the rotating challenge slot)
├── AchievementToast (client, listens to SSE)
└── BuildModal (client, lazy-loaded)
```

### State management

- **Server-truth**: PlayerState, Resources, Buildings live in Redis only
- **Client cache**: SWR or TanStack Query for read endpoints; revalidate on focus + every 60s
- **Mutations**: optimistic UI with server-confirmation rollback on failure
- **Local state**: only ephemeral UI (which modal open, which game playing)

No Zustand/Redux store — too much state for a hackathon project. SWR + URL state covers it.

## 11. Cron strategy

| Job | Schedule | Endpoint | Purpose |
|---|---|---|---|
| AI rotation | `*/5 * * * *` (Vercel Pro) OR external pinger | `POST /api/cron/rotate-if-due` | Archive expired, generate next |
| Cashflow batch | `*/15 * * * *` | `POST /api/cron/tick-batch` | Tick all active players |
| Marketplace sweep | `0 * * * *` | `POST /api/cron/market-expire` | Mark expired listings, refund fees |
| Daily quest reset | `0 4 * * *` | `POST /api/cron/quests-reset` | Roll new daily quest for each active player |
| Backup | `0 2 * * *` | external (cron-job.org) | Trigger Upstash backup → S3 |

For Hobby tier: only daily cron available natively. Strategies:
1. External pinger (cron-job.org free) hits endpoints on schedule
2. Lazy fallback: every authenticated request triggers a "due check" if not run in last 5min

## 12. Deployment topology

Single-branch workflow since 2026-04-20. `watt-city` was fast-forward-merged into `main`; both branches are gone. Pre-merge XP Arena state is preserved at tag `xp-arena-final-v1.0`; pre-merge feature branches are preserved under `archive/*` tags (see README "Repo history").

- Branch: `main` (only)
- Project: `xp-arena-ethsilesia2026` on Vercel (pending rename per operator)
- Domain: `xp-arena-ethsilesia2026.vercel.app` (custom domain migration TBD — e.g. `watt-city.vercel.app`)
- Redis: existing Upstash
- Status: active development (PKO Gaming track 1st place, ETHSilesia 2026 — partnership path live)

## 13. Observability

Minimum viable telemetry, no third-party trackers:

```ts
// lib/telemetry.ts
function track(event: string, payload: object) {
  // append to xp:telemetry:<YYYY-MM-DD> list
  // sampled (e.g. 1 in 10 for high-volume events)
}
```

Events:
- `game_started` (gameId, kind, theme)
- `game_completed` (gameId, kind, score, durationMs)
- `building_placed` (catalogId, slotId)
- `building_upgraded` (catalogId, fromLevel, toLevel)
- `loan_taken` (type, principal, termMonths)
- `loan_payment` (loanId, amount, status)
- `loan_default` (loanId)
- `marketplace_listed`, `marketplace_sold`, `marketplace_expired`
- `tick_run` (durationMs, playersTouched)
- `rotation_run` (newGameId, durationMs)
- `error` (where, message)

Daily aggregation cron writes summary to `xp:telemetry:summary:<YYYY-MM-DD>`, drops raw after 30 days.

Manual admin dashboard surfaces summaries.

## 14. Migration path from XP Arena

When cutting over, transform existing XP Arena player data:

```
For each xp:user:<username> in legacy Redis:
    create xp:player:<username> with:
        resources.coins   = (sum of legacy XP across knowledge games) / 2
        resources.bricks  = (sum across vocabulary games) / 2
        resources.glass   = (sum across analytical games) / 2
        resources.watts   = (sum across reflex games) / 2
        creditScore = 50 (default)
        buildings = [{ catalogId: "domek", slotId: 0, level: 1, builtAt: now }]
        unlocks.catalog = derived from resources earned
    leave legacy xp:leaderboard:* in place (kept for posterity / sin-slavy)
```

Run migration script once, idempotent (skip if `xp:player:<username>` already exists).

## 15. Failure modes & recovery

| Failure | Symptom | Recovery |
|---|---|---|
| Anthropic API down | rotation fails, lazy fallback kicks in but also fails | Mock-v1 fallback path (already exists) — serve fixture content; alert ops |
| Upstash Redis down | all reads/writes fail | Vercel cache stale data for ~30s; alert ops; degrade to in-memory if local fallback configured |
| Vercel function timeout | rotation hits 60s (Pro) or 10s (Hobby) cap | Split work: Sonnet first, Haiku translations in next cron tick; mark "translating" status |
| Cron pinger down | rotation stops happening | Lazy fallback covers gaps; monitor xp:rotation-lock age; alert if > 90 min stale |
| Player creates building loop in tick | infinite ledger entries | Per-tick ledger entry cap (e.g. max 50 entries per tick run); circuit breaker |
| Marketplace bot abuse | sybil farm | Rate limits, IP fingerprint, manual review queue, throttle below T7 |
| Translation drift on numbers | wrong scores credited | mergeStructure locks numerics from PL; client validates result before applying |

## 16. Testing strategy

### Unit
- Resource ledger idempotency
- Loan amortization math
- Tier formula
- Building cost/yield curves
- mergeStructure invariants per kind

### Integration
- Register → score → resources balance
- Build → tick → loan → repay → credit score
- Cron rotation creates LIVE game
- Lazy fallback rotates expired

### E2E (Playwright)
- Full flow: register, play game, build, mortgage, wait, see cashflow
- Mobile flows on iPhone SE viewport
- 4-language smoke test

### Fixture strategy
- Seed Redis with known-state players for deterministic tests
- Mock Claude with deterministic JSON responses
- Time-travel in tick tests via `Date.now` mocking

## 17. Open architecture questions

1. **Multiple Watt City instances** (per market) — single Redis sharded by tenant, or separate Redis per tenant?
2. **PWA offline support** — offline-only mode (resources don't tick) or fully offline-capable?
3. **Web3 layer** — same Next.js app or separate microservice?
4. **Real PKO integration** — direct API call from server (kid never sees PKO secret) or signed redirect to PKO with parental consent?
5. **GDPR data export** — JSON dump from `/api/me` (current) or separate "request your data" form with email confirmation?

These need decisions before respective phases start.

---

This document is the technical north star. Any code change that affects schemas, data flow, or system topology must update this doc.
