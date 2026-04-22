# SKO — Full implementation backlog

Complete scope from current XP Arena state to a production-grade, multi-market, partner-ready SKO product. No time-boxing — every item exists somewhere on this list whether it's "do it day one" or "do it in year two".

> **Status banner 2026-04-22** — Live on https://watt-city.vercel.app.
> 635/635 vitest (80 files), 79 API routes, 76 static pages, 13 Playwright
> specs, 4 locales × 423 keys (zero drift). 1st place PKO Gaming track,
> ETHSilesia 2026. Main branch only since 2026-04-20; latest commit
> `69ee7c9`.
>
> **Phase 1 MVP**: DONE end-to-end. The "~95%" banner in the Phase 1
> section below is stale — most of the deferred items are now live.
>
> **Phase 2 AI kinds (2.1)**: 6 of 12 planned kinds shipped (memory,
> fill-in-blank, calc-sprint, budget-allocate, chart-read, what-if); the
> pivot-era 6 stay. Target reached. Outstanding: portfolio-pick, dialog,
> negotiate, timeline-build, invest-sim, tax-fill.
>
> **Phase 3 social/schools/parents**: parent observer flow (V4.6),
> teacher/class flow, friends, marketplace placeholder all live.
>
> **Phase 6 GDPR-K / security**: shipped (rate limits, CSRF, parent
> consent, soft-delete, age gating).
>
> **Phase 8 web3 (opt-in)**: W1–W7 done on Base Sepolia; mainnet +
> audit still outstanding.

Effort scale (rough engineering days, single dev):
- **XS** = ≤ 2 h
- **S** = ½ day
- **M** = 1 day
- **L** = 2–3 days
- **XL** = 4–7 days
- **XXL** = > 1 week

Status: **TODO** / **WIP** / **DONE** / **DEFERRED** / **BLOCKED**

Each item lists: ID · title · effort · acceptance criteria · dependencies · notes.

---

## Table of contents

- [Phase 0 — Foundation already shipped](#phase-0--foundation-already-shipped)
- [Phase 1 — MVP (hourly rotation + buildings + mortgage)](#phase-1--mvp)
- [Phase 2 — Game variety + economy depth](#phase-2--game-variety--economy-depth)
- [Phase 3 — Social, schools, parents](#phase-3--social-schools-parents)
- [Phase 4 — PKO partnership integration](#phase-4--pko-partnership-integration)
- [Phase 5 — Live ops, admin, content moderation](#phase-5--live-ops-admin-content-moderation)
- [Phase 6 — Quality, hardening, compliance](#phase-6--quality-hardening-compliance)
- [Phase 7 — Mobile, PWA, native shells](#phase-7--mobile-pwa-native-shells)
- [Phase 8 — Web3 layer (optional)](#phase-8--web3-layer-optional)
- [Phase 9 — International markets (CZ, UA, beyond)](#phase-9--international-markets)
- [Phase 10 — Long-term maintenance + research](#phase-10--long-term-maintenance--research)
- [Cross-cutting concerns](#cross-cutting-concerns)
- [Risk register](#risk-register)
- [Open decisions](#open-decisions)

---

## Phase 0 — Foundation already shipped

| ID | Item | Status | Notes |
|---|---|---|---|
| 0.1 | HMAC-signed sessions, scrypt password hashing | DONE | `lib/auth.ts`, `lib/session.ts` |
| 0.2 | Upstash Redis backend + in-memory dev fallback | DONE | `lib/redis.ts` |
| 0.3 | AI pipeline: Sonnet 4.6 PL gen + Haiku 4.5 ×3 translations | DONE | `lib/ai-pipeline/{generate,research,publish}.ts` |
| 0.4 | 6 game kinds: quiz / scramble / price-guess / true-false / match-pairs / order | DONE | shipped tonight |
| 0.5 | 19-theme rotation pool with daily bucket + angle + difficulty | DONE | `lib/ai-pipeline/research.ts` |
| 0.6 | Per-game leaderboards (best-score semantics) | DONE | `lib/leaderboard.ts` |
| 0.7 | Sin-slavy: LIVE + Archive + permanent medals + dedup | DONE | `app/sin-slavy/page.tsx` |
| 0.8 | i18n PL/UK/CS/EN | DONE | `lib/locales/*.ts` + cookie switcher |
| 0.9 | 9 evergreen mini-games | DONE | `app/games/<id>/page.tsx` |
| 0.10 | CityScene with one LIVE AI building per active game (multi-slot dynamic) | DONE | code, awaiting deploy |
| 0.11 | Admin endpoints: rotate-ai (with theme override), leaderboard award/remove, archive-cleanup | DONE | `app/api/admin/*` |
| 0.12 | Vercel cron daily | DONE | `vercel.json` |
| 0.13 | Multi-lang AI specs (LocalizedSpec pl/uk/cs/en) | DONE | `lib/ai-pipeline/types.ts` |
| 0.14 | Duel mode (2-player PvP) | REMOVED | rolled out in V3 redesign; see `lib/duel.legacy.ts` + `lib/v3-duel-removal.test.ts` |
| 0.15 | Account deletion (GDPR Art. 17) | DONE | `DELETE /api/me` + soft-delete grace (`lib/soft-delete.ts`); extended with web3 medal burn-on-revoke |

---

## Phase 1 — MVP

**Goal:** demoable end-to-end city builder with hourly AI rotation + buildings + mortgage.

> **STATUS 2026-04-22 — Phase 1 MVP: DONE, live on prod.**
> Every MVP slice below ships on https://watt-city.vercel.app. The
> "must earn everything" promise (D4) is enforced by
> `lib/building-catalog.ts` unlock gates. 635 vitest green; 13 Playwright
> specs covering the golden-path register → play → build → mortgage flow.

### 1.1 Hourly rotation cron + lazy fallback

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.1.1 | Switch `validUntil` from `now + 24h` to `now + 1h` in `runPipeline` | XS | grep returns 1h; existing test still passes | none |
| 1.1.2 | Switch `pickResearchSeed` bucket from `floor(ms/24h)` to `floor(ms/1h)` | XS | unit test asserts new theme every hour boundary | 1.1.1 |
| 1.1.3 | New endpoint `POST /api/cron/rotate-if-due` — checks index, archives expired, publishes new (idempotent via `kvSetNX` lock) | M | calling 5× in parallel produces only 1 new game; no duplicates | 1.1.1 |
| 1.1.4 | `vercel.json` cron schedule on Pro: `*/5 * * * *` | XS | next deploy schedule visible in dashboard | Vercel Pro upgrade |
| 1.1.5 | External cron pinger fallback (e.g. cron-job.org → our endpoint with Bearer) | S | endpoint receives ping every 5 min for 1 hour test window | CRON_SECRET set |
| 1.1.6 | Lazy fallback: on city-scene render, if any LIVE game past expiry → call rotate inline with single-flight lock | M | server load test: 100 concurrent renders → exactly 1 rotation triggered | 1.1.3 |
| 1.1.7 | Live countdown widget on each LIVE building (already partially there in `LiveAiBuilding`) | XS | widget shows `Xm Ys`, ticks every second client-side | none |
| 1.1.8 | Game-expiry archival: `archiveOnExpire(gameId)` extracts spec metadata, writes to permanent archive, removes from index | M | expired game still loads at `/games/ai/<id>` after retire | 1.1.3 |
| 1.1.9 | Admin endpoint `GET /api/admin/rotation-status` — what's live, what's expired, when next rotate due | XS | returns JSON with timeline | 1.1.3 |
| 1.1.10 | Telemetry: emit `rotation.fired` event with theme + duration | XS | events visible in Vercel logs | 1.1.3 |

### 1.2 Resource ledger

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.2.1 | `lib/resources.ts` — `Resources` type (watts/coins/bricks/glass/steel/code/cashZl) + `RESOURCE_DEFS` (icon, color, label) | S | TypeScript exports stable shape, all 4 langs labelled | none |
| 1.2.2 | Migrate `awardXP` → also writes resource entries to ledger (per game's `resourceYield`) | M | playing finance-quiz for 80 W gives 80 coins ledger entry | 1.2.1 |
| 1.2.3 | Resource yield mapping: each game kind declares which resource it produces (in `lib/games.ts` for evergreen + AI spec field for AI) | S | unit test: 9 evergreen + 6 AI kinds have non-null yield | 1.2.1 |
| 1.2.4 | Ledger storage: `xp:player:<u>:ledger` LPUSH `{ts, kind, delta:Resources, reason, sourceId}` | M | ledger entries readable in chronological order | 1.2.1 |
| 1.2.5 | Aggregate resource balance: `xp:player:<u>` JSON `{resources: Resources, lastTickAt}` | S | balance = sum of all ledger deltas | 1.2.4 |
| 1.2.6 | Idempotent ledger writes: dedupe key `{kind}:{sourceId}` so same score submission can't double-credit | M | unit test: submit 100W twice → balance shows 100 once | 1.2.4 |
| 1.2.7 | `GET /api/me/resources` returns current balance + recent ledger | XS | UI can poll | 1.2.5 |
| 1.2.8 | Resource bar in nav: 6 icons (3 active + 3 greyed) with current balance | M | tiny, fits mobile | 1.2.5 |
| 1.2.9 | "How earned" hover tooltip on each resource icon | XS | shows: which kinds yield this resource | 1.2.1 |
| 1.2.10 | Backfill: existing leaderboards convert prior W → coins for existing players (one-time migration script) | M | daniel_babjak's prior W converted into resources | 1.2.4 |

### 1.3 Building catalog + map placement

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.3.1 | `lib/building-catalog.ts` — types + **only Domek** as fully-active build + 8 coming-soon entries (Mała elektrownia, Sklepik, Huta szkła, Walcownia, Bank lokalny T3, etc.) | M | exported `BUILDING_CATALOG` array; player starts with **0 buildings**, unlocks Mała elektrownia after first 50 watts earned, Sklepik after first 50 coins, etc. | 1.2.1 |
| 1.3.1a | "Earn-to-unlock" gating: building catalog hides items behind resource thresholds; tooltip shows "Zagraj X razy by odblokować" | S | first-time UX teaches earning loop | 1.3.1 |
| 1.3.2 | New SVG static map: 20 fixed slots on a 1800×460 viewBox, each slot has `(x, y, w, h)` and an empty visual | L | renders without overlap; mobile usable | 0.10 |
| 1.3.3 | Slot interaction states: empty (clickable, dashed outline) vs occupied (shows building) vs locked (greyed, tier required) | M | hover state, click opens build modal | 1.3.2 |
| 1.3.4 | Build-place modal: shows catalog, filters by affordability, shows cost vs current resources, build CTA | L | clicking valid item deducts resources, places building on slot | 1.2.5, 1.3.1 |
| 1.3.5 | `BuildingInstance` storage in `xp:player:<u>` — array of `{slotId, catalogId, level, builtAt, lastTickAt}` | S | adding building updates JSON | 1.2.5 |
| 1.3.6 | Building visual on slot: hashed-recipe SVG (similar to LiveAiBuilding) per catalogId | L | each catalog item has distinct silhouette | 1.3.2 |
| 1.3.7 | Building detail panel: click occupied slot → name, level, current cashflow rate, upgrade button, demolish button | M | UI shows live numbers | 1.3.5 |
| 1.3.8 | Upgrade flow: cost = `baseCost × upgradeMultiplier^level`; yield = `baseYield × yieldMultiplier^level` | M | UI deducts cost, increments level, future ticks use new yield | 1.3.7, 1.4 |
| 1.3.9 | Demolish flow: returns 50% of `cumulative cost` as resources, frees slot | S | resources credited; slot empty | 1.3.7 |
| 1.3.10 | Validation: can't build when slot occupied, can't afford, locked by tier | S | server + client checks | 1.3.4 |
| 1.3.11 | Anti-griefing: rate-limit build/demolish to 5 per minute | XS | 429 if exceeded | 1.3.4 |

### 1.4 Cashflow tick engine

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.4.1 | `tick(player)` function: for each building compute `(now - lastTickAt) / 3600s × hourlyYield`, append to ledger, update lastTickAt | M | called twice in quick succession → 2nd is no-op | 1.3.5 |
| 1.4.2 | Offline catch-up: if player offline 7 days, tick credits 168 × yield (capped at 30 days max) | S | unit test for catch-up | 1.4.1 |
| 1.4.3 | Tick trigger: server-side on every authenticated route + cron `*/15 * * * *` | M | ledger entries appear without player visiting | 1.4.1, 1.1.4 |
| 1.4.4 | Ledger entry kind `"tick"` with `sourceId = "${building.slotId}:${tickHour}"` for idempotency | XS | re-running tick same hour = no double-credit | 1.2.6 |
| 1.4.5 | Visual: building shows "+N coins/h" trickle animation (CSS keyframes) | S | non-blocking, 60fps | 1.3.6 |
| 1.4.6 | Resources panel: show "next tick in X min" indicator | XS | live countdown | 1.4.3 |

### 1.5 Mortgage flow (the educational core)

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.5.1 | Loan engine: `Loan` type, monthly amortization formula `M = P·r / (1−(1+r)^−n)` | M | unit test against bank loan calculator | none |
| 1.5.2 | Mortgage dialog UI: principal slider (max = 12× monthly cashflow), term toggle (12/24/36 mo), live RRSO + monthly cost preview | L | educational tooltip on RRSO, RRSO computed correctly | 1.5.1, 1.4 |
| 1.5.3 | Mortgage acceptance: creates `Loan` record, credits `principal` to player resources | S | balance jumps by principal amount | 1.5.1 |
| 1.5.4 | Loan status panel: outstanding balance, next payment date, on-time streak, total interest paid so far | M | always visible in nav or dashboard | 1.5.3 |
| 1.5.5 | Auto-deduct payment: integrated into `tick`; if `cashZl ≥ monthlyPayment` deduct + score+1, else mark missed + score−5 | M | scheduled correctly | 1.5.1, 1.4.1 |
| 1.5.6 | Default handling: 3 consecutive missed → seize smallest building, sell for 50%, mark loan defaulted | M | UI shows clear "default" warning before seizure | 1.5.5 | ✅ state machine verified in `lib/mortgage-default.test.ts` (commit `5dd81e0`) |
| 1.5.7 | Early repayment ("nadpłata"): allow lump-sum payment that reduces principal; recompute schedule | M | educational: shows interest saved | 1.5.1 |
| 1.5.8 | Credit score: 0–100, visible on player profile; +1 each on-time, −5 missed, −20 default | S | UI shows current score + tier (poor/fair/good/excellent) | 1.5.5 |
| 1.5.9 | Loan history: list of all loans (active + paid_off + defaulted) | S | linked from profile | 1.5.3 |
| 1.5.10 | Other 4 loan types: cards in UI with educational teaser, locked badge | S | static, no logic | 1.6 |

### 1.6 "Coming soon" placeholders (UI only, MVP scope)

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| 1.6.1 | Resources glass/steel/code: visible icons, lock badge, tooltip "Wkrótce — odblokujesz w fazie 2" | XS | greyed icons in resource bar |
| 1.6.2 | Buildings tier 4+: shown in catalog with lock + 1-line teaser | XS | tier-4 building disabled until player tier 4 |
| 1.6.3 | Loans (leasing, kredyt obrotowy, konsumencki, inwestycyjny): cards w/ teaser | S | each shows what it teaches |
| 1.6.4 | Parent dashboard: link with "Wkrótce — rodzic widzi postęp dziecka" | XS | static page |
| 1.6.5 | School class mode: button on `/sin-slavy` with teaser | XS | static |
| 1.6.6 | Friend trade: T7+ building shows "wymaga T7" lock | XS | static |
| 1.6.7 | PKO Junior real-money mirror: button "Mirror to PKO Junior — Wkrótce" | XS | static, conversion funnel teaser |

### 1.7 New-game-opens reveal

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 1.7.1 | Server-Sent Events endpoint: `GET /api/events/stream` (SSE) — keepalive ping every 30s | M | client subscribes, receives `{type, ...}` events | 1.1.3 |
| 1.7.2 | Redis pub/sub for `new-game-opened` channel; SSE forwards | M | event arrives within 2s of rotation | 1.1.3 |
| 1.7.3 | Client toast: "🤖 Nowa wyzwanie: <theme>" | S | dismissible, auto-hide 10s | 1.7.1 |
| 1.7.4 | City building reveal animation: crane lifts new building into slot | M | reuses existing crane SVG; transitions in 1.5s | 1.3.6 |
| 1.7.5 | Old building fade-to-archive animation | S | old slot becomes "memory plaque" tile | 1.7.4 |
| 1.7.6 | Sound effect at reveal (optional, mute toggle in user settings) | DEFERRED | |

### 1.8 Branding pivot

| ID | Item | Effort | Status | Notes |
|---|---|---|---|---|
| 1.8.1 | Choose codename | DONE | Watt City (D1 resolved) |
| 1.8.2 | Update logo + favicon | M | DONE | commit `2964d71` final sweep of lingering "XP Arena" strings |
| 1.8.3 | Update meta description across all routes | XS | DONE | |
| 1.8.4 | Primary accent + optional PKO skin | M | DONE | neo-brutalist kept; PKO skin layered via `lib/theme.ts` + `/pko` route |
| 1.8.5 | Mascot integration | DECISION | DEFERRED — D7 still open |
| 1.8.6 | Legal disclaimer "GRA EDUKACYJNA — to nie są prawdziwe pieniądze" | XS | DONE | visible on every page footer |

### 1.9 MVP polish & test

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| 1.9.1 | Smoke-test full flow: register → play AI hra → buy 3 buildings → take mortgage → wait 1h → see cashflow + payment | M | runbook in `docs/SMOKE-TEST.md` |
| 1.9.2 | Mobile UX pass: build flow + map + mortgage dialog | L | works on iPhone SE width 320px |
| 1.9.3 | i18n: every new string in 4 langs | M | grep finds no hardcoded SK/PL leaks |
| 1.9.4 | Update README for SKO scope | S | reflects new features |
| 1.9.5 | One-pager pitch slide for PKO partnership | M | screenshots + numbers |
| 1.9.6 | Demo script for live presentation (3 min walkthrough) | S | written + rehearsed |
| 1.9.7 | Performance: city scene < 100ms render on mid-range Android | L | lighthouse audit |
| 1.9.8 | Accessibility: tab navigation works on map + build modal | M | screen reader announces building names |

**Phase 1 total:** ~70 items.

---

## Phase 2 — Game variety + economy depth

### 2.1 New game kinds (target 12+ total)

| ID | Item | Effort | Acceptance | Dependencies |
|---|---|---|---|---|
| 2.1.1 | **memory** kind: 4×4 card grid, concept↔icon pairs, AI-generated | L | full pipeline (schema + prompt + client + i18n) | 0.4 |
| 2.1.2 | **fill-in-blank** kind | L | sentence with one missing word, type to fill | 0.4 |
| 2.1.3 | **calc-sprint** kind: 60s mental math grounded in finance | M | kind-specific schema, evergreen-style timer | 0.4 |
| 2.1.4 | **portfolio-pick** kind: choose 3 of 6 instruments, see year-end result | XL | needs market simulator backend | 0.4 |
| 2.1.5 | **budget-allocate** kind (promote evergreen budget-balance into AI rotation) | M | re-purpose existing client | 0.4 |
| 2.1.6 | **what-if** kind: scenario chain reasoning | L | multi-step explanation | 0.4 |
| 2.1.7 | **dialog** kind: branching narrative | XL | needs dialog tree schema | 0.4 |
| 2.1.8 | **chart-read** kind: synthetic chart + 1 question | L | server-side SVG chart gen | 0.4 |
| 2.1.9 | **negotiate** kind: 2-round bargaining vs AI counterpart | XL | conversational sub-agent | 0.4 |
| 2.1.10 | **timeline-build** kind: like order + date precision | L | refines order kind | 0.4 |
| 2.1.11 | **invest-sim** kind: 60s auto-running market | XL | live updating chart | 0.4 |
| 2.1.12 | **tax-fill** kind: PIT-37 fields | XL | needs accurate PL tax form data | 0.4 |

### 2.2 Theme pool growth

| ID | Item | Effort |
|---|---|---|
| 2.2.1 | Add 10 more themes: pierwsze mieszkanie, Black Friday psychology, subskrypcje, dropshipping, kieszonkowe, pierwsza praca, studia ROI, OC samochodu, vacation budget, ESG | M |
| 2.2.2 | Add 10 more: real estate flip, crypto wallet security, Apple/Google Pay, charity, brutto/netto, premia, family loan, karta kredytowa, restauracja food cost, iPhone depreciation | M |
| 2.2.3 | Theme metadata: target age range, prerequisite knowledge, subject tag (savings/credit/investing/taxes/energy) | S |
| 2.2.4 | Themed weeks: e.g. "Tydzień Inwestowania" — 7 days of investment-themed games | M |

### 2.3 Resource economy depth

| ID | Item | Effort | Notes |
|---|---|---|---|
| 2.3.1 | Glass + steel resources go LIVE (yield from order/match/portfolio kinds) | S | flip flag in 1.6.1 |
| 2.3.2 | Code resource (yield from negotiate/tax-fill/dialog kinds) | S | flip flag |
| 2.3.3 | Per-resource sink: each resource needed for specific building tiers | M | balancing pass |
| 2.3.4 | Resource trade between players (Phase 3) — declare schema now | XS | placeholder |
| 2.3.5 | Daily resource cap: prevent farming by limiting daily yield per resource | M | configurable per kind |
| 2.3.6 | Resource decay (optional): unused stockpiles slowly decay, encourages spending | DECISION | controversial, may demotivate kids |

### 2.4 Building catalog expansion

| ID | Item | Effort |
|---|---|---|
| 2.4.1 | Huta szkła live (glass producer) | M |
| 2.4.2 | Walcownia stali live (steel producer) | M |
| 2.4.3 | Software house live (code producer, T6) | M |
| 2.4.4 | Biblioteka — knowledge multiplier for quiz/true-false (+20% coins) | L |
| 2.4.5 | Gimnazjum sportowe — multiplier for reflex games (+20% watts) | L |
| 2.4.6 | Centrum nauki — multiplier for analytical games (+20% glass) | L |
| 2.4.7 | Bank lokalny T3 live (unlocks first mortgage — wait, MVP needed this; revisit) | M |
| 2.4.8 | Skarbówka T5 — unlocks tax-fill mini-game | M |
| 2.4.9 | Stacja kolejowa T7 — unlocks player-to-player trade | M |
| 2.4.10 | Decorative buildings (no yield, cosmetic): kościół, park, fontanna | M |

### 2.5 Building leveling & progression curves

| ID | Item | Effort |
|---|---|---|
| 2.5.1 | All buildings level 1→10 implemented (cost ×1.6, yield ×1.4) | M |
| 2.5.2 | Build-time gating: T6+ buildings take real-time hours to construct (Hay Day style); shows progress bar | L |
| 2.5.3 | Speed-up tokens (rare resource, awarded for top-3 medal) | M |
| 2.5.4 | Player tier formula: tier = floor(sqrt(sum of building levels)) | XS |
| 2.5.5 | Tier-up celebration: confetti, new building unlocks visible | S |
| 2.5.6 | Building "lifetime stats": total resources produced, level achieved, age | S |

### 2.6 Loan types beyond mortgage

| ID | Item | Effort |
|---|---|---|
| 2.6.1 | **Leasing** — rent a high-tier building 6 mo, then keep or return | L |
| 2.6.2 | **Kredyt obrotowy** — short-term against pending game scores (7-day repayment) | L |
| 2.6.3 | **Kredyt konsumencki** — instant cash, RRSO 20% (cautionary tale) | L |
| 2.6.4 | **Kredyt inwestycyjny** — borrow to buy another player's building (T7+) | XL |
| 2.6.5 | Loan comparison tool: "Kredyt vs leasing dla Huta szkła" educational view | M |
| 2.6.6 | Bankructwo flow: if all loans default + buildings seized → reset to tier 1 + warning screen | M |
| 2.6.7 | KNF / financial advice disclaimer on every loan dialog | XS | required compliance |

### 2.7 Notifications

> **Status 2026-04-22**: in-app notification centre live (bell dropdown
> in `components/notification-bell.tsx` — tier-up + mortgage-missed
> events, unread badge). Quiet-hours push gate live. Mailer (Resend →
> SendGrid → log) shipped at `lib/mailer.ts` in commit `5dd81e0`. Push
> still server-side-only — Web Push subscription flow is wired in
> `lib/web-push.ts` but user-facing enable toggle is TODO.

| ID | Item | Effort | Status |
|---|---|---|---|
| 2.7.1 | PWA push notifications: T-5min before new AI hra | M | TODO — server infra ready, UI toggle missing |
| 2.7.2 | Push: cashflow tick (when resources increase by ≥ 10% since last visit) | M | TODO |
| 2.7.3 | Push: mortgage payment due in 24h | M | TODO |
| 2.7.4 | Push: friend invited you to duel | M | REMOVED — duel feature cut in V3 |
| 2.7.5 | Email weekly digest (parent-facing) | L | TODO — mailer unblocked |
| 2.7.6 | In-app notification center: history of all events | M | DONE (`notification-bell.tsx`) |
| 2.7.7 | Notification settings: per-channel opt-in (push/email/in-app) | M | WIP — in-app default on, push/email need toggles |
| 2.7.8 | "Quiet hours" (no notifs 21:00–08:00 by default) | S | DONE |

### 2.8 Achievements

| ID | Item | Effort | Status |
|---|---|---|---|
| 2.8.1 | Achievement system: definitions, claim mechanic, badge in profile | M | DONE (`lib/achievements.ts`, `/api/me/achievements`) |
| 2.8.2 | "First mortgage paid off" achievement | XS | DONE |
| 2.8.3 | "All 9 evergreen games top-3" | XS | DONE |
| 2.8.4 | "10 AI medals" / "100 AI medals" | XS | DONE |
| 2.8.5 | "Built T7 building" / "All 20 slots filled" | XS | DONE |
| 2.8.6 | "Credit score 100" achievement | XS | DONE |
| 2.8.7 | "1-month daily streak" | XS | DONE |
| 2.8.8 | Achievement gallery on profile + public share link | S | DONE (`/profile/[username]`) |

### 2.9 Onboarding

| ID | Item | Effort | Status |
|---|---|---|---|
| 2.9.1 | First-time user tour (welcome → resources → buildings → first game) | M | DONE (`components/onboarding-tour.tsx` + keepalive LS short-circuit from 2026-04-22 UX batch) |
| 2.9.2 | ~~Sample resources for new account~~ — REJECTED per D4 | — | — |
| 2.9.3 | Force-played first game = easiest quiz (no admin rotate needed for new joiners) | M | DONE |
| 2.9.4 | Tutorial mortgage walkthrough (skippable) | M | DONE |
| 2.9.5 | Profile setup: optional avatar (10 pre-made), display name (≠ username) | M | DONE (`lib/avatars.ts`) |
| 2.9.6 | Manual tour replay via `OpenTutorialButton` on `/o-platforme` | XS | DONE (2026-04-22) |

---

## Phase 3 — Social, schools, parents

### 3.1 Friend system

| ID | Item | Effort | Status |
|---|---|---|---|
| 3.1.1 | Add friend by username (no email), friend request accept/reject | M | DONE (`lib/friends.ts`, `/api/friends/*`) |
| 3.1.2 | Friend list page | S | DONE (`app/friends/page.tsx`) |
| 3.1.3 | Friend leaderboard (subset of global, just your friends) | S | DONE |
| 3.1.4 | "Visit friend's city" — read-only view of their map + buildings | M | DONE (`app/friends/[username]/page.tsx`) |
| 3.1.5 | Privacy controls: hide profile from non-friends, hide cashflow numbers | M | TODO — profile is currently public-by-default |

### 3.2 Player-to-player trade (T7+ feature)

| ID | Item | Effort | Status |
|---|---|---|---|
| 3.2.1 | Trade offer schema: `{seller, buyer?, building, price, expiresAt}` | M | DONE (`lib/marketplace.ts`) |
| 3.2.2 | Marketplace page: list active offers, filter by building type | L | DONE (`app/marketplace/page.tsx`, `/api/market/*`) |
| 3.2.3 | "Buy now" instant trade flow | M | WIP — placeholder UI, full trade logic gated on D10 |
| 3.2.4 | Counter-offer / negotiation thread (simple) | L | TODO |
| 3.2.5 | Transaction fee (5%) → goes to "skarb miasta" pot | S | TODO |
| 3.2.6 | Anti-abuse: rate limit, min-tier gating, market-rate sanity checks | M | TODO |
| 3.2.7 | Trade history per player | S | TODO |

### 3.3 Class / school mode

| ID | Item | Effort | Status |
|---|---|---|---|
| 3.3.1 | Teacher signup (separate role flag, requires admin approval initially) | L | DONE (`/nauczyciel/signup`, `lib/roles.ts`) |
| 3.3.2 | "Klasa" workspace: teacher creates class, gets N join codes | M | DONE (`lib/class.ts`, `/api/nauczyciel/class`, `/api/klasa/*`) |
| 3.3.3 | Class leaderboard (separate from global) | M | DONE (`lib/class-leaderboard.ts`) |
| 3.3.4 | Teacher dashboard: see each kid's progress | L | DONE (`/nauczyciel`) |
| 3.3.5 | Q-of-the-week: teacher picks one game theme that becomes class focus | M | TODO |
| 3.3.6 | Class export to PDF: weekly progress report | M | DONE (`lib/pdf-report.tsx`) |
| 3.3.7 | Curriculum alignment: tag games to PL "podstawa programowa" topics | L | DONE (`lib/curriculum.ts`) |
| 3.3.8 | Teacher onboarding tour | M | DONE (`components/teacher-onboarding-tour.tsx`) |
| 3.3.9 | Landing page for schools (`/dla-szkol`) + materials | M | DONE |
| 3.3.10 | Demo-school seeder (`/api/admin/seed-demo-school`) | XS | DONE |

### 3.4 Parent dashboard

| ID | Item | Effort | Status |
|---|---|---|---|
| 3.4.1 | Parent role: signup, link to child via shared code (V4.6 parent-link bridge) | M | DONE (`lib/parent-link.ts`, `/api/rodzic/*`, `/api/parent/*`) |
| 3.4.2 | Read-only kid progress view | M | DONE (`/rodzic`, `/parent/[username]`) |
| 3.4.3 | Weekly email digest: top games played, medals earned, what concepts covered | M | TODO — mailer infra ready |
| 3.4.4 | Privacy controls: kid can hide certain data from parent (per GDPR-K guidance) | M | TODO |
| 3.4.5 | "Mirror to PKO Junior" CTA | M | WIP — mock at `lib/pko-junior-mock.ts`, real API blocked on partnership |
| 3.4.6 | Optional weekly real-money allowance suggestion based on game performance | M | TODO |
| 3.4.7 | Invite-code + consent flow (GDPR-K under-16 gate) | M | DONE (`/consent`, `lib/gdpr-k.ts`) |

### 3.5 Community features

| ID | Item | Effort | Status |
|---|---|---|---|
| 3.5.1 | Profile page (public): username, avatar, achievements, top buildings, top games | M | DONE (`app/profile/[username]/page.tsx`) |
| 3.5.2 | Cheer/encourage button: send reactions to friends after their wins | S | DONE (`lib/community.ts`, `/api/community/*`) |
| 3.5.3 | Comments on archived AI games | L | TODO |
| 3.5.4 | Moderation tooling for comments (flag, hide, ban) | L | TODO — pipeline moderation exists (`lib/ai-pipeline/moderation.ts`), comment moderation TODO |
| 3.5.5 | Profile customization: pick city background, music | M | TODO |

---

## Phase 4 — PKO partnership integration

### 4.1 Brand white-label

| ID | Item | Effort |
|---|---|---|
| 4.1.1 | Theme system: "core" theme tokens vs "skin" theme tokens | M |
| 4.1.2 | PKO brand pack: PKO blue, PKO typography, PKO logo | M |
| 4.1.3 | Toggle skin via env var or per-deployment config | S |
| 4.1.4 | Mascot integration: load Żyrafa SVG/animation in PKO skin | M |
| 4.1.5 | PKO disclaimer + footer (replace XP Arena footer in PKO build) | S |

### 4.2 PKO API mocks (then real)

| ID | Item | Effort |
|---|---|---|
| 4.2.1 | Define PKO Junior API contract (mock): top-up, balance, transfer | L |
| 4.2.2 | Mock server matching that contract | M |
| 4.2.3 | "Mirror to Junior" UI flow → calls mock → shows confirmation | M |
| 4.2.4 | Real PKO API integration (BLOCKED until partnership signed) | XL |
| 4.2.5 | OAuth handshake for PKO account login | XL |
| 4.2.6 | Audit logging for all real-money triggers | M |

### 4.3 Compliance / legal review

| ID | Item | Effort |
|---|---|---|
| 4.3.1 | KNF review of in-game financial product depictions | L | external |
| 4.3.2 | Children's marketing law (Ustawa o ochronie konsumentów + GDPR-K) review | L | external lawyer |
| 4.3.3 | Real-money disclaimer copy review with PKO compliance team | M |
| 4.3.4 | Terms of Service draft for SKO 2.0 | L |
| 4.3.5 | Privacy policy update for PKO partnership | M |

### 4.4 Pilot program

| ID | Item | Effort |
|---|---|---|
| 4.4.1 | Pilot scope agreement with PKO (school count, kid count, duration, success metrics) | L | non-engineering |
| 4.4.2 | Onboarding video for pilot teachers (5 min) | M |
| 4.4.3 | Live ops support channel (Slack/email) for pilot teachers | M |
| 4.4.4 | Mid-pilot review report (D30 retention, engagement, qualitative) | L |
| 4.4.5 | End-pilot decision package (continue/expand/end) | L |

---

## Phase 5 — Live ops, admin, content moderation

### 5.1 Admin tooling

| ID | Item | Effort | Status |
|---|---|---|---|
| 5.1.1 | Admin dashboard at `/admin` (auth-gated, role flag on user) | M | DONE — bearer-secret gated |
| 5.1.2 | View any player's resource ledger / state | M | DONE (`/api/admin/player`) |
| 5.1.3 | Force-rotate AI game | XS | DONE (`/api/admin/rotate-ai`) |
| 5.1.4 | Edit theme pool, add/remove themes from rotation | M | DONE (`/api/admin/themes`, `/api/admin/rotate-themes`) |
| 5.1.5 | Review pending Sonnet outputs before publish (moderator queue) | L | DONE (`/api/admin/moderation`, `lib/ai-pipeline/moderation.ts`) |
| 5.1.6 | Manually grant resources to players (boost-user) | S | DONE (`scripts/boost-user.sh`) |
| 5.1.7 | Suspend/unsuspend account | S | TODO |
| 5.1.8 | View support tickets / user reports | L | TODO |
| 5.1.9 | Seed demo player + demo school (pitch / demo prep) | S | DONE (`/api/admin/seed-demo-player`, `/api/admin/seed-demo-school`) |
| 5.1.10 | Purge E2E-polluted accounts from prod leaderboard | S | DONE 2026-04-22 (`/api/admin/purge-e2e-accounts` + `scripts/purge-e2e-accounts.sh`) |
| 5.1.11 | Analytics endpoint | M | DONE (`/api/admin/analytics`) |
| 5.1.12 | Backfill resources migration | M | DONE (`/api/admin/backfill-resources`) |
| 5.1.13 | Backup + engine-check + rotation-status + health | M | DONE |
| 5.1.14 | Feature-flag toggles | M | DONE (`/api/admin/feature-flags`, `lib/feature-flags.ts`) |
| 5.1.15 | Market admin (multi-market migration) | M | DONE (`/api/admin/market`, `/api/admin/migrate-to-multimarket`, `/api/admin/migrate-v2`) |

### 5.2 Content moderation (AI generation safety)

| ID | Item | Effort |
|---|---|---|
| 5.2.1 | Pre-publish content filter: reject if Claude output mentions specific brands negatively, real people, violence | M |
| 5.2.2 | Post-publish report mechanism: kid can flag "this is wrong/inappropriate" | M |
| 5.2.3 | Reported games auto-suspend after 3 reports until reviewed | S |
| 5.2.4 | Content review queue UI for moderators | M |
| 5.2.5 | Per-theme auditing: schedule once-a-month review of theme accuracy | M |
| 5.2.6 | Versioning: each generated game has git-like content hash for traceability | S |

### 5.3 Analytics & telemetry

| ID | Item | Effort |
|---|---|---|
| 5.3.1 | Event tracking: game_started, game_completed, building_built, mortgage_taken, etc. | M |
| 5.3.2 | Privacy-first: no third-party (no GA, no Meta), stored in our Upstash | S |
| 5.3.3 | D1 / D7 / D30 retention dashboard | L |
| 5.3.4 | Game-kind popularity: which kinds get most plays | S |
| 5.3.5 | Mortgage funnel: % of eligible players who take mortgage, % who pay off | S |
| 5.3.6 | Cohort analysis tool | L |
| 5.3.7 | Export anonymized data for academic / partner research | M |

### 5.4 Operations

| ID | Item | Effort |
|---|---|---|
| 5.4.1 | Monitoring: uptime, response time, error rate (Sentry or similar) | M |
| 5.4.2 | Alerting: page on-call when AI pipeline errors > 5/hour | M |
| 5.4.3 | Backup: daily Upstash export to S3-compatible storage | M |
| 5.4.4 | Restore runbook | M |
| 5.4.5 | Incident response template | S |
| 5.4.6 | Cost monitoring: alert if Claude monthly cost > threshold | S |
| 5.4.7 | Status page (status.skowatts.pl or similar) | S |

### 5.5 Content tooling

| ID | Item | Effort |
|---|---|---|
| 5.5.1 | Theme proposal form: anyone can suggest theme via form | S |
| 5.5.2 | Theme voting: community votes on next themes to add | M |
| 5.5.3 | A/B test framework for game tweaks | L |
| 5.5.4 | "Editor's pick" — admin can pin one AI game as featured | S |

---

## Phase 6 — Quality, hardening, compliance

### 6.1 Security

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.1.1 | Penetration test (external) | L | TODO |
| 6.1.2 | OWASP top 10 audit | M | DONE — internal audit 2026-04-19 (`docs/SECURITY-AUDIT-2026-04-19.md`) |
| 6.1.3 | Rate limiting on all endpoints | M | DONE — `lib/rate-limit.ts`, per-user buckets + per-IP auth limits |
| 6.1.4 | CSRF tokens on state-changing forms | M | DONE — double-submit via `proxy.ts` + `CsrfBootstrap` (`lib/csrf.ts`) |
| 6.1.5 | Content Security Policy headers | S | DONE — verified in `e2e/security.spec.ts` |
| 6.1.6 | Subresource Integrity for any 3rd-party CDN | S | N/A — no 3rd-party CDN assets |
| 6.1.7 | Sensitive data encryption at rest | S | DONE — scrypt passwords, HMAC sessions |
| 6.1.8 | Bug bounty program | S | TODO |

### 6.2 Privacy & GDPR

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.2.1 | Cookie consent banner (only essential cookies for now) | M | DONE |
| 6.2.2 | Privacy policy page in 4 langs | M | DONE (`/ochrana-sukromia`) |
| 6.2.3 | Data export endpoint (GDPR Art. 20) — JSON dump of player data | M | DONE (`/api/me/export`) |
| 6.2.4 | Soft-delete 30-day grace | M | DONE (`lib/soft-delete.ts`, `/api/cron/sweep-deletions`) |
| 6.2.5 | Data retention policy doc | S | DONE (`docs/legal/`) |
| 6.2.6 | DPO contact info, breach notification plan | S | DONE |

### 6.3 GDPR-K (children's data protection)

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.3.1 | Age check at signup (PL: GDPR-K applies under 16) | S | DONE (`lib/gdpr-k.ts`) |
| 6.3.2 | Parental consent flow if under 16 (email confirmation) | L | DONE (`/consent`, parent-link bridge) |
| 6.3.3 | No real-name PII collection from kids | XS | DONE — username-only |
| 6.3.4 | Limit data retention for inactive kid accounts (auto-delete) | M | DONE (`/api/cron/sweep-inactive-kids`) |
| 6.3.5 | Audit trail of all parental consent grants | M | DONE |

### 6.4 Accessibility (WCAG 2.1 AA)

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.4.1 | Keyboard navigation throughout (no mouse-only interactions) | M | DONE (verified in `e2e/a11y-matrix.spec.ts`) |
| 6.4.2 | Screen reader labels on all interactive elements | M | DONE |
| 6.4.3 | Color contrast 4.5:1 minimum | M | DONE (see `docs/A11Y-AUDIT-2026-04-19.md`) |
| 6.4.4 | Focus indicators visible | S | DONE |
| 6.4.5 | Skip-to-content link | XS | DONE |
| 6.4.6 | Lighthouse a11y score 95+ on all pages | M | DONE — prod reports 0.95–0.96 |
| 6.4.7 | Tested with NVDA / VoiceOver (manual) | L | PARTIAL — automated matrix covers static flows; full manual pass outstanding |

### 6.5 Performance

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.5.1 | Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1 | M | DONE — Lighthouse prod perf 0.94–1.00 |
| 6.5.2 | Image optimization | XS | DONE — SVG-only |
| 6.5.3 | Code-splitting for heavy game clients | M | DONE |
| 6.5.4 | Lazy load city scene if below the fold | S | DONE |
| 6.5.5 | Edge caching for static assets | XS | DONE |
| 6.5.6 | Server response time < 200ms p95 for cached routes | M | DONE — `/api/score` parallelised 2026-04-22 |

### 6.6 i18n completeness

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.6.1 | Audit all 4 langs for missing/stale strings | M | DONE — 423 keys, zero drift (`scripts/audit-i18n.mjs`) |
| 6.6.2 | Native speaker review for UK / CS / EN | M | PARTIAL — UK calques flagged in `docs/progress/2026-04-22-docs-review.md` |
| 6.6.3 | RTL support framework (for Hebrew/Arabic future) | DEFERRED | |
| 6.6.4 | Pluralization rules (Polish has complex plurals) | M | DONE (`lib/i18n-format.ts`) |
| 6.6.5 | Date/number formatting per locale | S | DONE |

### 6.7 Test coverage

| ID | Item | Effort | Status |
|---|---|---|---|
| 6.7.1 | Unit tests: leaderboard, resource ledger, loan engine | L | DONE — 635/635 vitest across 80 files |
| 6.7.2 | Integration tests: register → play → score → resources | L | DONE (`lib/integration-flow.test.ts`) |
| 6.7.3 | E2E tests: Playwright covering critical flows | XL | DONE — 13 specs (~600 assertions): smoke, prod-smoke, api-contracts, security, data-integrity, a11y-matrix, golden-paths, perf, rate-limits, cross, pwa, mobile, production-ready, bot-protection |
| 6.7.4 | Visual regression tests for city scene | L | TODO |
| 6.7.5 | AI pipeline tests: mock Claude responses, verify schemas | M | DONE (`lib/ai-pipeline/*.test.ts`) |
| 6.7.6 | Load test: 1000 concurrent users on prod-like env | L | DONE — harness in `docs/LOAD-TEST.md` |

---

## Phase 7 — Mobile, PWA, native shells

### 7.1 PWA

| ID | Item | Effort | Status |
|---|---|---|---|
| 7.1.1 | PWA manifest (`manifest.json`) | XS | DONE |
| 7.1.2 | Service worker for offline shell | M | DONE (verified in `e2e/pwa.spec.ts`) |
| 7.1.3 | Install prompt (with parental consent for kids) | M | DONE |
| 7.1.4 | App icons all sizes | S | DONE |
| 7.1.5 | Splash screen | S | DONE |
| 7.1.6 | Push notifications via Web Push | M | PARTIAL — server-side `lib/web-push.ts` ready, user-enable UI TODO |
| 7.1.7 | iOS Safari quirks | M | DONE — mobile-safari coverage in `e2e/smoke.mobile.spec.ts` |

### 7.2 Native shells (optional)

| ID | Item | Effort |
|---|---|---|
| 7.2.1 | Capacitor wrapper for iOS app store | L |
| 7.2.2 | Capacitor wrapper for Android Play store | L |
| 7.2.3 | App store assets (screenshots, descriptions, age ratings) | M |
| 7.2.4 | Apple Family Sharing setup | M |
| 7.2.5 | Google Play Family policy compliance | M |

### 7.3 Mobile UX deep work

| ID | Item | Effort |
|---|---|---|
| 7.3.1 | Touch targets ≥ 44×44 px throughout | S | ✅ done in `5dd81e0` — `.tap-target` class |
| 7.3.2 | Build modal optimized for one-thumb operation | M |
| 7.3.3 | Map pinch-to-zoom + pan | M |
| 7.3.4 | Swipe-to-dismiss notifications | S |
| 7.3.5 | Bottom-tab navigation for mobile (alternative to top nav) | M |

---

## Phase 8 — Web3 layer (optional)

### 8.1 Soulbound medals

> **Status 2026-04-22 (commit `5dd81e0`)**: W1–W7 web3 scope delivered
> — `WattCityMedal` on Base Sepolia, mint flow end-to-end, parent-consent
> gate verified. ✅ items 8.1.1–8.1.6, 8.1.8 done; 8.1.7 (mainnet + audit)
> still pending. See `docs/web3/SUBMISSION.md`.

| ID | Item | Effort |
|---|---|---|
| 8.1.1 | Choose chain (Base / Polygon zkEVM / OP) | DECISION |
| 8.1.2 | SBT contract design (non-transferable ERC-5114 or similar) | L |
| 8.1.3 | Deploy contracts on testnet | M |
| 8.1.4 | Mint flow: top-3 medal awarded → optional opt-in mint to wallet | L |
| 8.1.5 | Wallet connect UI (RainbowKit or similar) | M |
| 8.1.6 | Gas sponsorship (player doesn't pay) | L |
| 8.1.7 | Mainnet deployment with audit | XL |
| 8.1.8 | Profile page shows minted medals | S |

### 8.2 Optional features (not roadmap-blocking)

| ID | Item | Effort |
|---|---|---|
| 8.2.1 | NFT cosmetic skins for buildings (purely aesthetic) | L |
| 8.2.2 | DAO-style theme voting via token | XL |
| 8.2.3 | Cross-chain bridge for medals | DEFERRED |

---

## Phase 9 — International markets

### 9.1 Czech market launch

| ID | Item | Effort |
|---|---|---|
| 9.1.1 | CZ themes pool: ČNB rates, ČSOB / KB / MONETA banks, Czech tax | L |
| 9.1.2 | CZ partnership target: Česká spořitelna or similar | L | non-engineering |
| 9.1.3 | CZ-specific buildings (Prague landmarks instead of Katowice) | M |
| 9.1.4 | CZ legal review | L |
| 9.1.5 | CZ marketing | XL |

### 9.2 Ukrainian market launch

Similar structure. UAH currency display, NBU as central bank reference.

### 9.3 Multi-tenancy architecture

| ID | Item | Effort |
|---|---|---|
| 9.3.1 | Per-market data partitioning | L |
| 9.3.2 | Per-market admin dashboards | M |
| 9.3.3 | Per-market theme pools | M |
| 9.3.4 | Per-market currency/locale defaults | S |

---

## Phase 10 — Long-term maintenance + research

### 10.1 Ongoing content

| ID | Item | Effort |
|---|---|---|
| 10.1.1 | Quarterly theme refresh: add 5 new themes, retire 5 stale ones | M each quarter |
| 10.1.2 | Monthly retro: review which kinds players love/skip, balance accordingly | S each month |
| 10.1.3 | Annual visual refresh | L each year |

### 10.2 Engine evolution

| ID | Item | Effort |
|---|---|---|
| 10.2.1 | Newer Claude models migration (every release) | M each |
| 10.2.2 | Anthropic SDK upgrades | S each |
| 10.2.3 | Next.js / React major upgrades | L each |
| 10.2.4 | Database scaling (Upstash → dedicated when scale hits) | XL |

### 10.3 Research collaborations

| ID | Item | Effort |
|---|---|---|
| 10.3.1 | Partner with PL university for D30 retention vs financial-knowledge gain study | XL | external |
| 10.3.2 | Publish anonymized research dataset | L |
| 10.3.3 | Conference talks (Mobile Trends Awards, Złoty Bankier) | M each |

---

## Cross-cutting concerns

These apply to *every* phase, not as one-time tasks:

### Documentation
- Every new feature gets a doc page in `/docs/features/<feature>.md`
- API contracts in `/docs/api/<endpoint>.md`
- Architecture decision records (ADR) in `/docs/adr/NNN-title.md`
- Update README on every shipped feature
- Demo script updated every release

### Quality gate (per PR)
- Build green
- Tests added for new functionality
- i18n strings extracted to all 4 langs
- Mobile + desktop manual smoke test
- A11y check (keyboard, contrast)
- No new SK string leaks
- Privacy review if collecting new data

### Engineering hygiene
- Conventional commits
- Linear issue tracker (or GitHub Issues)
- Weekly sync between AI-pipeline ops vs frontend ops
- Quarterly architecture review

---

## Risk register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R1** | "SKO" trademark owned by PKO Bank Polski | High | Use codename until partnership signed; pitch always says "SKO 2.0 prototype, PKO-partnership-ready" |
| **R2** | GDPR-K compliance for under-16 users | High | Parent consent flow (Phase 6.3); minimum data collection; legal review before launch |
| **R3** | Loan UI misleads kids about real debt | High | Permanent disclaimer; default consequences highly visible; no real money; KNF-aligned content |
| **R4** | Vercel Hobby cron limits hourly rotation | Medium | Lazy fallback covers gaps; plan Pro upgrade or external pinger |
| **R5** | Claude generation cost at hourly = ~$15/mo per app instance | Low | Acceptable; rate-limit if needed; Haiku is cheap |
| **R6** | AI hallucinates incorrect financial fact | High | Pre-publish filter + post-publish report mechanism + human-moderator queue (Phase 5.2) |
| **R7** | Cashflow tick double-credits if cron + lazy fire same hour | Medium | Idempotency: tick keyed by `tickHour:slotId` (1.4.4) |
| **R8** | Marketplace (Phase 3.2) opens speculation/manipulation | Medium | T7 gate, transaction fee, monitoring, max trades/day |
| **R9** | Push notifications spam kid → parent complaints | Medium | Quiet hours, default opt-out, granular settings (2.7.7-8) |
| **R10** | Admin endpoint security: anyone can hit `/api/admin/*` if ADMIN_SECRET unset | Medium | Always require secret in prod (already designed) |
| **R11** | Real PKO API integration delayed by partnership negotiations | High (timeline) | Mock layer (4.2.2) so all UI works pre-partnership |
| **R12** | Kid creates account, never shows it to parent → real PII (chosen username) leaks | Low | We don't collect PII beyond username; ToS warns kids |
| **R13** | Class teacher abuses moderation power | Low | Audit log; admin can revoke teacher role |
| **R14** | Single-region Upstash outage takes app down | Medium | Cross-region replication or multi-tenant cluster (Phase 10.2) |
| **R15** | Kid spends real time but no real money saved (parent disappointment) | Medium | Clear messaging "edu game, not bank account"; "Mirror to PKO Junior" CTA bridges |
| **R16** | Anti-fun: building leveling too slow → kid quits | High | Phase 2.5.5 telemetry; balance sheet review monthly |
| **R17** | Anti-fun: too easy → kid quits "no challenge" | Medium | Difficulty escalation tied to player tier |
| **R18** | Translation drift in localized AI specs (proven CS bug today) | Low | Translator prompt fixes (already done); regression tests |
| **R19** | Web3 layer adds complexity & gas costs | Medium | Optional opt-in only; wallet not required for core game |
| **R20** | Browser deprecation breaks PWA features | Low | Track Can-I-Use, fallbacks for older browsers |

---

## Open decisions

### Decisions RESOLVED (recorded for traceability)

| # | Question | **Decision** | Resolved | Rationale |
|---|---|---|---|---|
| **D1** | Public branding | **Rename now to "Watt City"** | tonight | Short, kid-friendly, retains continuity with the existing Watts currency; SKO 2.0 sub-title kept for pitch context only |
| **D2** | Cron infrastructure | **Lazy-only + free external pinger; no Vercel Pro yet** | tonight | Pay only when revenue justifies; lazy fallback + cron-job.org covers MVP |
| **D4** | Starter buildings | **Only Domek at signup; everything else must be earned by playing games** | tonight | Strongest possible "play to earn" loop from minute one; no free handouts |
| **D5** | Mortgage params | 6% APR, 12/24/36 mo, max principal = 12× monthly cashflow | tonight | Industry-standard amortization; affordability cap prevents over-borrowing |

### Decisions still open (blocking Phase 1)

| # | Question | Options | Default if no answer |
|---|---|---|---|
| D3 | In-game currency display | (a) "💵 zł" (matches educational realism); (b) "💰 W$" (clearer not-real); (c) "🪙 W-coin" | **(b)** to avoid real-money confusion with kids |
| D6 | Hourly cron during low-traffic hours (00:00–06:00) | (a) full rate; (b) pause; (c) reduce to /3h | **(b)** save Claude cost; lazy fallback handles morning resume |

### Decisions blocking Phase 2+

| # | Question | Options |
|---|---|---|
| D7 | Mascot strategy | (a) keep PKO's Żyrafa (continuity); (b) introduce Silesian dwarf builder; (c) no mascot |
| D8 | Visual brand pivot to PKO blue | (a) full pivot; (b) keep neo-brutalist as our identity, add PKO blue in white-label skin; (c) decide later |
| D9 | Resource decay (2.3.6) | (a) yes, encourages spending; (b) no, demotivates kids |
| D10 | Public marketplace (3.2) | (a) launch publicly with rate limits; (b) school-class internal only; (c) defer indefinitely |
| D11 | School class mode pricing | (a) free for schools; (b) freemium with class size caps; (c) PKO sponsors all |
| D12 | Web3 layer (Phase 8) | (a) ship; (b) skip — too speculative; (c) opt-in beta only |

### Decisions blocking partnership

| # | Question |
|---|---|
| D13 | Pilot scope to propose to PKO: how many schools, how many kids, how many months |
| D14 | Revenue split (if commercial later): PKO white-label fee vs revenue share |
| D15 | Ownership of game content generated by Claude (joint, ours, PKO's) |
| D16 | Termination clauses (data ownership when partnership ends) |

---

## Definition of "done" (per item)

A backlog item moves to **DONE** when:
1. Code merged on `main`
2. Deployed to production OR documented why deferred
3. Smoke tested manually on the deployed env
4. i18n strings shipped for all 4 langs (or labelled as English-only)
5. Mobile UX checked (if user-facing)
6. Documentation updated (changelog entry minimum)
7. Linked to acceptance criteria check-off

---

## How to use this backlog

- **For solo work:** start at Phase 1, top → bottom, don't skip ahead
- **For team work:** assign by phase + person; resolve dependencies first
- **For partner conversations:** Phase 4 is the pitch surface; Phase 1 is the demo
- **For investor conversations:** Phase 9 + Phase 10 are the multi-year story
- **For grant applications:** Phase 6.3 (GDPR-K) + Phase 3.3 (school mode) are the social-impact angle

This is a living document. Items get added/removed as we learn. Status updates go in the table directly. Major scope changes go through ADR (`docs/adr/`).

Last revised: 2026-04-22 — post-ETHSilesia status sweep.
