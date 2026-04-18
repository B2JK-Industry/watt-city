# Watt City — Economy & balance sheet

The math behind every progression decision. Anyone implementing buildings, loans, scoring, or content needs to read this.

## 1. Resources — definition

| Resource | Symbol | Color (hex) | Where it comes from | Where it goes |
|---|---|---|---|---|
| **Watts** | ⚡ | `#fde047` (yellow) | Reflex / time-pressure games (energy-dash, power-flip, calc-sprint, invest-sim) | Mała elektrownia, EV stacja, fotowoltaika |
| **Coins** | 🪙 | `#f59e0b` (amber) | Knowledge games (quiz, true-false, dialog, budget-allocate) | Most base buildings, daily upkeep |
| **Bricks** | 🧱 | `#a16207` (brown) | Vocabulary games (scramble, match-pairs, fill-in-blank, memory) | Build cost for almost every building (raw material) |
| **Glass** | 🪟 | `#22d3ee` (cyan) | Analytical games (price-guess, order, chart-read, portfolio-pick) | Tier-3+ buildings (windows, panels) |
| **Steel** | 🔩 | `#94a3b8` (slate) | Multi-step / hard difficulty (what-if, timeline-build, hard quizzes) | Tier-5+ buildings (industry, infrastructure) |
| **Code** | 💾 | `#22c55e` (green) | Most-advanced kinds (negotiate, tax-fill) | Tier-6+ buildings (software house, modern industry) |
| **In-game zł** | 💵 | `#16a34a` (green bill) | Cashflow tick from buildings | Loan repayment, building upkeep, marketplace trades |

> **Note**: For internal naming we use `cashZl` to avoid collision with currency code; UI displays as `💵 W$` per resolved decision D3 (assumed default).

### Resource invariants

- Every resource amount is a **non-negative integer**. We round at every operation to avoid float drift.
- Maximum balance per resource: `1_000_000` (UI displays "MAX" if hit; nothing further accumulates).
- Cash zł can go to zero but cannot go negative (mortgage payment failure → "missed" event, not negative balance).

## 2. Game → Resource yield matrix

| Kind | Items | Yield/correct | Max/play | Primary | Secondary (50%) |
|---|---:|---:|---:|---|---|
| quiz | 6 | 15 | 90 | 🪙 coins | — |
| scramble | 6 | 12 | 72 | 🧱 bricks | — |
| price-guess | 5 | 18 | 90 | 🪟 glass | 🪙 coins (45) |
| true-false | 8 | 7 | 56 | 🪙 coins | — |
| match-pairs | 5 | 18 | 90 | 🧱 bricks | 🪟 glass (45) |
| order | 5 | 20 | 100 | 🪟 glass | — |
| memory | 8 | 10 | 80 | 🧱 bricks | — |
| fill-in-blank | 6 | 14 | 84 | 🧱 bricks | 🪙 coins (42) |
| calc-sprint | ~10 in 60s | 6 | 60 | ⚡ watts | — |
| portfolio-pick | 1 | 100 | 100 | 🪟 glass | 🪙 coins (50) |
| budget-allocate | 1 | 80 | 80 | 🪙 coins | 💵 W$ (40) |
| what-if | 5 | 18 | 90 | 🔩 steel | — |
| dialog | 3 | 25 | 75 | 🪙 coins | — |
| chart-read | 5 | 16 | 80 | 🪟 glass | — |
| negotiate | 1 | 100 | 100 | 💾 code | — |
| timeline-build | 6 | 14 | 84 | 🔩 steel | — |
| invest-sim | 1 | 90 | 90 | ⚡ watts | 🪙 coins (45) |
| tax-fill | 8 | 10 | 80 | 💾 code | — |

### Multipliers stacking

Yield can be multiplied by:
1. **Difficulty multiplier**: easy = 1.0×, medium = 1.0×, hard = 1.25×
2. **Knowledge-multiplier building**: e.g. Biblioteka grants +20% on quiz/true-false coins
3. **AI hra LIVE bonus**: 2× on the rotating challenge
4. **Daily streak bonus**: +5% per consecutive day, max +25%

Stacking order: `base × difficulty × buildingMult × liveBonus × streak`. Cap at 5× of base to prevent runaway.

### Anti-grind

- **Best-score rule** (inherited from XP Arena): replays don't add resources unless score beats prior personal best.
- **Daily resource cap per kind**: 200 of primary resource per kind per day. Anything beyond → 0 yield ledger entry, UI shows "Dziś już max — wróć jutro".
- **Cooldown on identical theme**: same theme can't be played by same user more than 1× per UTC day.

## 3. Building catalog — full balance sheet

All numbers are MVP starting points. Live-ops will tune.

### Notation

```
Cost(level)  = baseCost × 1.6^(level-1)   # rounded up
Yield(level) = baseYield × 1.4^(level-1)  # rounded up
Total cost to L10 from L1 = Σ Cost(2..10) (you don't pay for L1 build, that's the build cost)
ROI(level)   = Yield(level) / Cost(level)
```

### Tier 1 — Starter

| Building | Slot category | baseCost | baseYield/h | Tier req | Notes |
|---|---|---|---|---|---|
| **Domek** | residential | (free at signup) | 5 🪙 | 1 | One-time gift, slot 0 |

### Tier 2 — Earn-to-unlock

Unlock condition shown as resource thresholds.

| Building | Unlock when player has ever earned | baseCost | baseYield/h | Tier req |
|---|---|---|---|---|
| **Mała elektrownia** | ≥ 50 ⚡ | 80 🧱 + 50 🪙 | 8 ⚡/h | 1 |
| **Sklepik osiedlowy** | ≥ 50 🪙 | 60 🧱 + 80 🪙 | 6 🪙 + 2 🧱/h | 1 |

### Tier 3 — Mid game

| Building | Cost | Yield | Tier req | Notes |
|---|---|---|---|---|
| **Bank lokalny** | 200 🧱 + 1500 🪙 | 0 (civic) | 3 | Unlocks Preferred mortgage (5% APR vs 8%) |
| **Huta szkła** | 250 🧱 + 1200 🪙 + 100 ⚡ | 4 🪟/h | 3 | First glass producer |
| **Biblioteka** | 300 🧱 + 800 🪙 | 0 (multiplier: +20% on quiz/true-false yields) | 3 | |

### Tier 4 — Industry

| Building | Cost | Yield | Tier req |
|---|---|---|---|
| **Walcownia stali** | 400 🧱 + 200 🪟 + 2000 🪙 | 3 🔩/h | 4 |
| **Centrum nauki** | 500 🧱 + 100 🪟 + 1500 🪙 | +20% on order/match yields | 4 |
| **Gimnazjum sportowe** | 350 🧱 + 1000 🪙 + 200 ⚡ | +20% on reflex yields | 4 |

### Tier 5 — Civic

| Building | Cost | Yield | Tier req |
|---|---|---|---|
| **Skarbówka** | 500 🧱 + 200 🪟 + 50 🔩 + 3000 🪙 | unlocks tax-fill mini-game | 5 |
| **Fotowoltaika z magazynem** | 200 🧱 + 100 🪟 + 50 🔩 + 100 ⚡ | 12 ⚡/h + 1 💵/h | 5 |
| **Pompa ciepła** | 300 🧱 + 200 🪟 + 80 🔩 | 8 ⚡/h + 5 🪙/h | 5 |

### Tier 6 — Software economy

| Building | Cost | Yield | Tier req |
|---|---|---|---|
| **Software house** | 200 🧱 + 300 🪟 + 200 🔩 + 5000 🪙 | 4 💾/h + 8 💵/h | 6 |
| **Coworking** | 150 🧱 + 200 🪟 + 100 🔩 + 3000 🪙 | 2 💾/h + 5 💵/h | 6 |

### Tier 7 — Trade & infrastructure

| Building | Cost | Yield | Tier req |
|---|---|---|---|
| **Stacja kolejowa** | 800 🧱 + 400 🪟 + 300 🔩 + 50 💾 | unlocks player-to-player marketplace | 7 |
| **EV stacja** | 300 🧱 + 200 🪟 + 200 🔩 + 80 ⚡ | 15 ⚡/h + 10 💵/h | 7 |

### Tier 8 — Landmarks (one-of-a-kind, prestige)

| Building | Cost | Yield | Tier req | Notes |
|---|---|---|---|---|
| **Spodek** | 1500 🧱 + 1000 🪟 + 500 🔩 + 200 💾 + 20000 🪙 | +5% on ALL yields, citywide | 8 | Katowice landmark; 1 per city |
| **Varso Tower** | 3000 🧱 + 2000 🪟 + 1500 🔩 + 800 💾 + 50000 🪙 | +10% on ALL yields, citywide | 9 | Endgame; 1 per city |

### Cumulative cost to fully build (L10) for each building

| Building | Total cost L1→L10 (in primary resource) | Real-time @ moderate play |
|---|---|---|
| Mała elektrownia | ~5500 🧱 + ~3500 🪙 | ~3 weeks |
| Bank lokalny | ~14000 🧱 + ~100000 🪙 | ~2 months |
| Software house | ~14000 🧱 + ~21000 🪟 + ~14000 🔩 + ~340000 🪙 | ~6 months |
| Varso Tower | massive — endgame | ~12 months |

### Slot map (20 fixed positions)

```
    ┌────────────────────────────────────────────┐
    │   landmark    public        public         │ Tier 8+
    │ [ slot 0 ] [ slot 1 ] [ slot 2 ]           │
    │                                            │
    │   industry  industry   industry  industry  │ Tier 5–7
    │ [ slot 3 ] [ slot 4 ] [ slot 5 ] [ slot 6 ]│
    │                                            │
    │  commercial commercial commercial          │ Tier 3–5
    │ [ slot 7 ] [ slot 8 ] [ slot 9 ]           │
    │                                            │
    │  residential residential residential resid │ Tier 1–4
    │ [ slot 10] [ slot 11] [ slot 12] [ slot 13]│
    │                                            │
    │  decorative decorative decorative decor    │ any tier
    │ [ slot 14] [ slot 15] [ slot 16] [ slot 17]│
    │                                            │
    │   civic     civic                          │ Tier 3–7
    │ [ slot 18] [ slot 19]                      │
    └────────────────────────────────────────────┘
```

Each slot has a **category** that restricts what can be built there. Industrial slots can only host industrial buildings, etc. This forces interesting layout decisions (you can't put 8 elektrownie in a row).

Decorative slots accept any building category but show a 25% cosmetic penalty (less prominent visual).

## 4. Cashflow mechanics

### Tick formula

```
For each building owned by player p:
    elapsedHours = (now - building.lastTickAt) / 3_600_000
    grossYield   = building.yield(level) * elapsedHours
    
    # Apply citywide multipliers (Spodek, Varso Tower)
    cityMult     = product of all "citywide bonus" buildings
    
    # Apply per-kind multipliers from knowledge buildings
    kindMult     = if building.outputResource matches a multiplier building's target, apply
    
    netYield     = grossYield * cityMult * kindMult
    
    Append ledger entry { kind:"tick", sourceId:`${building.slotId}:${tickHour}`, delta:{...} }
    Update building.lastTickAt = now
```

### Frequency

- **Server cron**: `*/15 * * * *` (every 15 minutes) — checks all buildings, ticks if elapsed ≥ 1h since lastTickAt
- **Lazy on-render**: when player loads any authenticated page, force-tick their buildings (catches up after offline period)
- **Cap on offline catch-up**: maximum 30 days of yield credited at once (prevents accumulating year-long absences)

### Idempotency

The ledger entry's `sourceId` is `${slotId}:${tickHour}` where `tickHour = floor(now / 3_600_000)`. If two processes try to tick the same building in the same hour, the second is a no-op (Redis ZSET dedupe by sourceId).

### Visualization

UI shows live ticker per building: "+5 🪙/h · last tick: 23 min ago · next: 37 min". Numbers update every second client-side via simple time math.

## 5. Loan engine — full math

### Available principal

```
maxPrincipal = floor(monthlyCashflow * 12)
  where monthlyCashflow = sum(building.yield(level)) per cashflow building
                        × 730 (hours/month average)
```

Cap at 50000 W$ for MVP. Beyond requires "kredyt inwestycyjny" (Phase 2).

### Monthly payment (amortization)

Standard formula:

```
M = P · r / (1 - (1 + r)^(-n))

where
  P = principal
  r = monthly interest rate = APR / 12
  n = term in months
  M = monthly payment
```

Worked example:
- Principal `P = 5000`, APR = 8% → r = 0.00667
- Term `n = 24` months
- M = `5000 × 0.00667 / (1 − 1.00667^−24)` = **226.27**
- Total paid = 24 × 226.27 = **5430.48**
- Total interest = **430.48**
- Effective RRSO ≈ 8.30% (slightly higher than APR due to compounding)

### RRSO display

Show the player both APR and RRSO, with a tooltip explaining the difference. Calculate RRSO using the standard PL "Rzeczywista Roczna Stopa Oprocentowania" formula (essentially the IRR of the cashflow stream).

### Credit score

Starting score: **50** (medium-trust new borrower).

| Event | Delta | Notes |
|---|---|---|
| On-time monthly payment | +1 | Capped at 100 |
| Missed payment (1) | −5 | Player gets 24h to pay before counting |
| Missed payment (2 consec) | −10 (cumulative −15) | Warning UI |
| Missed payment (3 consec) → default | −20 (cumulative −35) | Smallest building seized + sold for 50% |
| Loan fully paid off (no defaults during) | +10 | One-time bonus per loan |
| Early repayment (lump sum) | +3 | Per principal-reducing payment |
| Demolish a building (panic move) | −2 | |

Score → APR adjustment for next loan:
| Score | APR delta vs base |
|---|---|
| 0–20 | +5 pp (effectively unable to borrow) |
| 21–40 | +3 pp |
| 41–60 | 0 (base) |
| 61–80 | −1 pp |
| 81–100 | −2 pp |

### Default handling

When a player misses 3 consecutive payments:

1. UI shows "DEFAULT IMMINENT" warning 24h before
2. At the moment of 3rd miss:
   - Smallest player-owned building (lowest cumulative cost) is **seized**
   - Building sold immediately for 50% of cumulative invest cost; proceeds applied to loan
   - If proceeds cover loan → loan marked `paid_off_via_seizure`, slot freed
   - If still outstanding → next-smallest also seized
   - If player has only Domek left → Domek can't be seized (kid keeps "home"); loan marked `defaulted` with ongoing penalty (cashflow halved until paid)
3. Credit score takes massive hit
4. Educational popup: "Co się stało? Masz dług większy niż twoje budynki mogą spłacić. To się zdarza w prawdziwym życiu — dlatego ważne jest pożyczać tylko tyle, ile potrafisz spłacić."

### Early repayment ("nadpłata")

Player can throw extra coins at the principal anytime:
- Reduces outstanding balance immediately
- Schedule recomputed (M stays same, n shortens — preferred for educational clarity, OR M shrinks if user prefers)
- Saves total interest
- +3 credit score per nadpłata event

## 6. Player progression curve

### Tier formula

```
tier = clamp(1, 9, floor(sqrt(sum of building.level for all owned buildings)))
```

Example:
- 1 building level 1 → sqrt(1) = 1 → Tier 1
- 4 buildings each level 4 → sqrt(16) = 4 → Tier 4
- 9 buildings each level 9 → sqrt(81) = 9 → Tier 9 (max)

### Tier unlocks

| Tier | Unlocks | Name | Visual |
|---|---|---|---|
| 1 | Mała elektrownia, Sklepik | Drewniana chata | 🛖 |
| 2 | (nothing new — economy depth instead) | Rodzinny dom | 🏠 |
| 3 | Bank lokalny, Huta szkła, Biblioteka | Kamienica | 🏘️ |
| 4 | Walcownia, Centrum nauki, Gimnazjum sportowe | Solarna kamienica | 🏘️☀️ |
| 5 | Skarbówka, Fotowoltaika, Pompa ciepła | Biurowiec | 🏢 |
| 6 | Software house, Coworking | Mrakodrap | 🏙️ |
| 7 | Stacja kolejowa, EV stacja, marketplace | Altus Tower (125 m) | 🏗️ |
| 8 | Spodek (city landmark) | Varso candidate | 🌃 |
| 9 | Varso Tower | **Endgame** | 🌆 |

### Time-to-tier expectations

| Player profile | Plays/day | Watts/h avg | Time to Tier 5 |
|---|---|---|---|
| Casual | 2 | 80 | ~6 weeks |
| Engaged | 4 | 200 | ~3 weeks |
| Hardcore | 8 | 400 | ~10 days |

These are tunable knobs. Live-ops will adjust resource yields and building costs to hit target curves. Initial values target the **engaged** profile reaching Tier 5 in 3 weeks.

### Anti-frustration design

- **Daily quest**: every day a new "celują" mini-objective (e.g. "Get 3 medals today" → reward: 50 🪙). Predictable progress even on bad days.
- **Catch-up bonus**: if player offline > 3 days, first day back gets 1.5× yields (welcomes them back).
- **No real penalty for skipping a day**: cashflow keeps ticking offline (capped 30 days).

## 7. Daily player budget — sample week

A casual player profile (2 games/day, 1 mortgage, 4 buildings):

| Day | Resources earned (game) | Cashflow earned (tick) | Spent (build/upkeep) | Mortgage payment | Net 💵 W$ delta |
|---|---|---|---|---|---|
| Mon | 80 🪙 + 60 🧱 | 250 🪙 + 60 🧱 + 80 ⚡ | 0 (no build) | 226 W$ | −226 |
| Tue | 80 🪙 + 60 🧱 | 250 🪙 + 60 🧱 + 80 ⚡ | 0 | 0 (only first of month) | 0 |
| Wed | 100 ⚡ | 250 🪙 + 60 🧱 + 80 ⚡ | 200 🪙 (small upgrade) | 0 | 0 |
| Thu | 90 🪟 | … | … | … | … |
| ... | | | | | |

This is sustainable — cashflow > mortgage payment with margin. Even if player skips a day, cashflow keeps accruing.

## 8. Marketplace economics (Phase 2/3)

When player-to-player trade unlocks (T7+):

### Listing
- Player lists building for sale at price P (in W$)
- Listing fee: 1% of P (paid upfront, refunded if listing expires unsold)
- Listings expire after 7 days

### Transaction
- Buyer pays P; seller receives P × 0.95 (5% transaction fee → goes to "skarb miasta" pot, used for future events)
- Building moves to buyer's city; level + lifetime stats preserved
- Both parties +1 credit score (good faith trade)

### Anti-manipulation
- **Min-tier gate**: only T7+ players can list/buy
- **Daily limit**: max 3 trades per player per day
- **Price sanity**: listing rejected if price > 5× market median for that building × level
- **Sybil prevention**: trade between accounts that share IP / created within 1h of each other → flagged for review
- **Wash-trade detection**: A→B→A within 24h → both transactions reverted, accounts warned

## 9. Cost of running the platform

Estimated monthly cost for a 1000-DAU MVP:

| Item | Monthly cost | Notes |
|---|---|---|
| Vercel Hobby | $0 | If lazy-cron + free pinger |
| Vercel Pro (if upgraded) | $20 | Allows /5min cron, better limits |
| Upstash Redis Free | $0 | < 10k commands/day; need Pro at scale |
| Upstash Redis Pro | $10 | At 1000 DAU, plausibly needed |
| Anthropic API (Claude) | $15 | 24 hourly games × 30 days × ~$0.02/run |
| Domain | $1 | .pl annual ÷ 12 |
| **Total** | **~$46/mo** | At 1000 DAU |

At 10k DAU, scale is dominated by Redis (~$50) and API (~$50) → ~$120/mo. Still tiny.

## 10. Inflation prevention

Risk: late-game players accumulate so much W$ that prices feel meaningless.

Sinks (mandatory consumption):
- **Building upkeep** (Phase 2): each building costs 5% of its yield/h in W$ for maintenance — a small drag
- **Mortgage payments** (already designed)
- **Marketplace transaction fees** (5%)
- **Demolition cost** (instead of refund) for tier-7+ buildings — they cost 100 W$ to demolish
- **Citywide event tax**: occasional "Earth Hour Tax" event drains 10% of W$ from richest 10% (flavor text: "Tauron renovation fee")

Without sinks, every economy spirals.

## 11. Knobs to tune (live ops)

These constants should be admin-editable without code deploy:

```ts
// lib/economy-config.ts
export const ECONOMY = {
  resourceCapPerKindDaily: 200,
  costMultiplier: 1.6,
  yieldMultiplier: 1.4,
  baseAprStandard: 0.08,
  baseAprPreferred: 0.05,
  liveBonusMultiplier: 2.0,
  streakBonusPerDay: 0.05,
  streakBonusCap: 0.25,
  difficultyMultipliers: { easy: 1.0, medium: 1.0, hard: 1.25 },
  citywideBonusSpodek: 0.05,
  citywideBonusVarso: 0.10,
  marketplaceFeeRate: 0.05,
  marketplaceListingFeeRate: 0.01,
  offlineCatchupCapDays: 30,
  initialCreditScore: 50,
  defaultCreditScoreFloor: 0,
  ...
};
```

Storing these in Redis under `xp:config:economy` allows live tweaks via admin endpoint.

## 12. Open balance questions

- **Should glass/steel/code yield from games be increased?** Currently fewer game kinds yield them than yield coins/bricks. Could create scarcity bottleneck. Plan: monitor in beta, adjust.
- **Should mortgage allow for partial payments?** Current design = pay in full or miss. Real life allows partial. Design choice: keep simple for MVP.
- **What happens at Tier 9?** Endgame — currently no further progression. Plan: prestige system (reset for cosmetic boost) in Phase 3.
- **Should there be PvP tax?** Wealthy players paying into a pot that funds events? Adds Robin Hood dynamic. Maybe Phase 3.

---

This document is the source of truth for all numeric constants and formulas in the game. Any code change that affects economy must update this doc.
