# SKO — Backlog

Phased work plan from current XP Arena state to the SKO vision in `SKO-VISION.md`.

Effort scale:
- **S** = ≤ 4 h
- **M** = ½ – 1 day
- **L** = 1 – 3 days
- **XL** = ≥ 3 days

Status: **TODO** / **WIP** / **DONE** / **DEFERRED**

---

## Phase 0 — Already in XP Arena (DONE)

| ID | Item | Status |
|---|---|---|
| 0.1 | HMAC-signed sessions, scrypt password hashing | DONE |
| 0.2 | Upstash Redis backend + in-memory dev fallback | DONE |
| 0.3 | AI pipeline: Sonnet 4.6 PL gen + Haiku 4.5 ×3 translations | DONE |
| 0.4 | 6 game kinds: quiz / scramble / price-guess / true-false / match-pairs / order | DONE |
| 0.5 | 19-theme rotation pool with daily bucket | DONE (in code, deploy pending) |
| 0.6 | Per-game leaderboards (best-score semantics) | DONE |
| 0.7 | Sin-slavy with LIVE + Archive + permanent medals | DONE |
| 0.8 | i18n PL/UK/CS/EN | DONE |
| 0.9 | 9 evergreen mini-games | DONE |
| 0.10 | CityScene with one LIVE AI building per active game | DONE (in code) |
| 0.11 | Admin endpoints: rotate-ai, leaderboard, archive-cleanup | DONE |

---

## Phase 1 — MVP for SKO (the hour-rotated city builder)

**Goal:** demoable end-to-end:
1. AI hra rotates every hour (verifiable on the city scene countdown)
2. Player builds 1–3 basic buildings on the map
3. Buildings produce passive resources every hour
4. Player takes a mortgage to unlock a tier-3 building
5. Mortgage repays from cashflow; UI shows balance + interest
6. Coming-soon placeholders for everything else

**Estimated total:** ~5–7 focused days.

### 1.1 Hourly rotation cron + lazy fallback

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.1.1 | Bump rotation cadence in code: validUntil = now + 1h (was 24h) | S | `lib/ai-pipeline/publish.ts` line ~85 |
| 1.1.2 | Add `pickResearchSeed` hourly bucket variant | S | `Math.floor(now / 3600_000)` |
| 1.1.3 | New endpoint `POST /api/cron/rotate-if-due` — checks index, archives expired, publishes new | M | reuses runPipeline; idempotent |
| 1.1.4 | Update `vercel.json` cron to `*/5 * * * *` (Vercel Pro only) OR document external pinger setup | S | Hobby tier blocks this — fallback below |
| 1.1.5 | Lazy fallback: on city render, if any expired game in index → call rotate inline (single-flight via `kvSetNX(xp:rotation-lock)`) | M | survives cron downtime |
| 1.1.6 | Player-facing countdown widget on each LIVE building | S | already exists from XP Arena, reuse |
| 1.1.7 | T-5min PWA notification (deferred, see 2.x) | DEFERRED |

### 1.2 Resource ledger

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.2.1 | `lib/resources.ts` — types (Resources type, RESOURCE_DEFS) | S | watts / coins / bricks live; glass / steel / code declared but not generated |
| 1.2.2 | Migrate XP submission: `/api/score` adds resources to ledger instead of (or in addition to) bare XP | M | backwards-compat: keep awardXP, also write to ledger |
| 1.2.3 | Per-kind resource yield mapping in `BUILDING_CATALOG` & game spec | S | quiz → coins, true-false → coins, scramble → bricks, price-guess → glass, etc. |
| 1.2.4 | Ledger storage: `xp:player:<u>:ledger` LPUSH log + `xp:player:<u>` aggregate balance | M | ledger entries: `{ts, kind:"score"\|"build"\|"loan"\|"tick", delta, reason}` |
| 1.2.5 | Resources display in nav-bar (3 visible icons + 3 greyed coming-soon) | S | replaces single "W" XP chip |

### 1.3 Building catalog + map placement

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.3.1 | `lib/building-catalog.ts` — 3 active building types + ~6 coming-soon | M | id, name, cost, level cap, yield, prerequisites |
| 1.3.2 | Static map with 20 build slots (SVG, sized to current CityScene viewBox) | M | replaces evergreen BUILDING_PLAN with empty plots |
| 1.3.3 | Build-place UI: click empty slot → catalog modal → confirm cost deduction | M | resource check + slot occupancy guard |
| 1.3.4 | Building detail panel: click owned building → name, level, cashflow rate, upgrade button (1.4× yield, 1.6× cost) | M | upgrade stays in MVP for at least 1 building |
| 1.3.5 | Demolish (with 50% refund) — coming-soon button | S | UI only |

### 1.4 Cashflow tick

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.4.1 | `tick` function: for each building of player, compute hourly yield × hours since last tick, append to ledger | M | offline catch-up: works whether player visited or not |
| 1.4.2 | Hourly cron OR lazy on-render call | S | bundles with rotation cron from 1.1 |
| 1.4.3 | "Last tick" timestamp on PlayerState; ledger entries with `kind:"tick"` | S | |
| 1.4.4 | Visual: building shows "+N coins/h" trickle animation | S | optional polish |

### 1.5 Mortgage flow

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.5.1 | Loan engine: take loan, monthly payment calc (M = P·r / (1−(1+r)^−n)), schedule entries | M | classic amortization |
| 1.5.2 | Mortgage dialog UI: shows principal, rate (6% APR), term (12/24/36 mo), monthly payment, total cost, RRSO label | M | educational tooltips — explains RRSO |
| 1.5.3 | Loan status panel: outstanding, next payment date, on-time streak (credit score) | S | |
| 1.5.4 | Auto-deduct payment from cashflow on tick — if insufficient, mark missed (−5 score), if 3 missed → default | M | |
| 1.5.5 | Demo: player takes 5000 zł mortgage to unlock Huta szkła; sees monthly deduction; building produces glass | M | wire 1.3 → 1.5 connectivity |
| 1.5.6 | Other loan types: card UI, lock badge, "Wkrótce" copy, 1-line educational teaser per type | S | static, no logic |

### 1.6 "Coming soon" placeholders (UI only)

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.6.1 | Resources: glass, steel, code — greyed icons + lock badge | S | |
| 1.6.2 | Buildings tier 4+: tax office, train station, software house, etc. — visible in catalog with lock | S | |
| 1.6.3 | Loans: leasing, kredyt obrotowy, kredyt konsumencki, inwestycyjny — cards with educational teaser | S | |
| 1.6.4 | Parent dashboard link — "Coming soon: rodzic widzi postęp dziecka" | S | |
| 1.6.5 | School class mode — coming soon button on /sin-slavy | S | |
| 1.6.6 | Friend trade (PvP T7+) — locked building shows "wymaga T7" | S | |

### 1.7 New-game-opens reveal

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.7.1 | Server-Sent Events endpoint: `GET /api/events/new-game` — long-poll or SSE | M | client subscribes; Redis publishes channel |
| 1.7.2 | Client toast/animation: "🤖 Nowa wyzwanie · <theme>" appears at T=0 with city building animating in | M | use existing crane SVG transform |
| 1.7.3 | Sound effect (optional polish) | DEFERRED | |

### 1.8 Branding pivot

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.8.1 | Choose codename — "Watt City" / "XP City" / keep "XP Arena" with SKO subtitle? | S | DECISION NEEDED |
| 1.8.2 | Update logo + nav title | S | |
| 1.8.3 | Update meta description across pages | S | |
| 1.8.4 | Add "kid-mode" font scaling option (larger text, more icons) | DEFERRED | for later |

### 1.9 MVP polish & test

| ID | Item | Effort | Notes |
|---|---|---|---|
| 1.9.1 | Smoke-test full flow: register → play game → buy building → take mortgage → wait 1h → see cashflow + payment | M | |
| 1.9.2 | Mobile UX pass on the new map / build flow | M | the most tap-heavy area |
| 1.9.3 | i18n: any new strings get pl/uk/cs/en entries | S | mechanical |
| 1.9.4 | README rewrite for SKO scope | S | |
| 1.9.5 | Pitch slide / one-pager | M | for PKO — explains the SKO repositioning |

**Phase 1 total:** ~38 task points. Aggressive ~5 day estimate, comfortable ~7 days.

---

## Phase 2 — Engagement loop (post-MVP)

| ID | Item | Effort | Notes |
|---|---|---|---|
| 2.1 | Glass + Steel resources live (yield from order/match games) | M | activates the "advanced industry" tier |
| 2.2 | 5 more building types live (huta + walcownia + biblioteka + bank lokalny + skarbówka) | L | |
| 2.3 | Building level upgrade across all tiers (1→10) | M | math already in catalog |
| 2.4 | Knowledge multipliers (library boosts quiz coins yield, etc.) | M | |
| 2.5 | More loan types live: leasing, kredyt obrotowy | L | each its own flow + math |
| 2.6 | Player tier system (overall progression): tier = sum of buildings ≥ N | S | |
| 2.7 | Notifications: PWA push at T-5min for new game | M | requires PWA scaffold |
| 2.8 | Email digest weekly (parents + kid summary) | M | |
| 2.9 | Achievement system: built first elektrownia, paid off first mortgage, all buildings level 5, etc. | M | |
| 2.10 | Onboarding flow: 3-step tour for first-time kid | M | |

---

## Phase 3 — Social & ecosystem

| ID | Item | Effort | Notes |
|---|---|---|---|
| 3.1 | Friend trade (sell building to another player, T7+) | XL | needs offer-acceptance mechanic |
| 3.2 | School class mode (teacher creates class, sees kid leaderboard) | XL | |
| 3.3 | Parent dashboard (read-only, shareable link) | L | |
| 3.4 | Real PKO Junior account API mock + later real integration | XL | requires PKO partnership |
| 3.5 | Achievement → SBT medal mint on Base/Polygon (optional Web3) | L | |
| 3.6 | Seasonal events (Earth Hour weekend = 4× watts; Black Friday = mortgage rate ↓) | M | |
| 3.7 | Cosmetic shop (skins for buildings, no gameplay effect) | L | |
| 3.8 | Localized content for CZ / UA market (different banks, different currencies) | XL | post-PKO |

---

## Phase 4 — Scale + monetisation hooks (PKO-specific)

| ID | Item | Effort | Notes |
|---|---|---|---|
| 4.1 | White-label SDK so SKO can drop the engine into existing PKO app shell | XL | |
| 4.2 | PKO Junior account deep-link: when kid completes 100 in-game savings, prompt parent to mirror with real top-up | L | conversion funnel for sponsor |
| 4.3 | KNF-aligned content review pipeline | L | financial advice disclaimer per item |
| 4.4 | A/B testing harness for game design tweaks | L | |
| 4.5 | Analytics: D1/D7/D30 retention, time-in-game, building-level distribution | M | |

---

## Risk register (must address before public launch)

| # | Risk | Mitigation |
|---|---|---|
| **R1** | "SKO" trademark is owned by PKO Bank Polski | Use codename until partnership signed; pitch always says "SKO 2.0 prototype" |
| **R2** | Kid app needs GDPR-K (children's data) compliance | Parent-confirmed registration; no real-name; no PII other than chosen username; minimum age check |
| **R3** | Loan UI could mislead kids that real debt is fun | Always-on label "GRA EDUKACYJNA — to nie są prawdziwe pieniądze"; mortgage default has VERY visible negative consequences |
| **R4** | Vercel Hobby cron limits hourly rotation | Use external pinger (cron-job.org) OR upgrade to Pro; lazy fallback covers gaps |
| **R5** | AI generation cost at hourly = 24× current ($0.02/run × 24 = $0.50/day = $15/mo) | Acceptable; Haiku translations are cheap; can rate-limit if abuse |
| **R6** | Static map fits 20 buildings; if we add more later, have to redesign | Reserve viewBox space (1800×460 already extended); plan grid expansion to 30 in v2 |
| **R7** | Cashflow tick could double-credit if cron + lazy both fire same hour | Idempotency: ledger entries keyed by `tickHour:${building.id}` — UPSERT, not append |
| **R8** | Trade between players (Phase 3) opens speculation / market manipulation | T7 gating + transaction fee to dampen; monitoring for unusual patterns |

---

## Open decisions blocking Phase 1

These need an answer from you before I can start coding:

1. **Branding** — keep "XP Arena" name with SKO as ambition target? Or rename in-product?
2. **Hourly cron infrastructure** — Vercel Pro upgrade ($20/mo) OR external cron pinger (free, less reliable)?
3. **In-game zł symbol** — show as "💵 zł" or new symbol like "🪙XP" to avoid confusion with real money?
4. **3 starter buildings** confirm: Domek + Mała elektrownia + Sklepik. OK or different choice?
5. **Mortgage flow** confirm: 6% APR, 12/24/36 month terms, 5000 zł starting principal limit. OK?

Once these 5 are answered, I can produce a day-by-day Phase 1 plan with concrete commits.
