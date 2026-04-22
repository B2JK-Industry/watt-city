# Watt City — Vision & Mechanics

> **Public name: "Watt City".** SKO 2.0 is the pitch context only — used
> in conversations with PKO Bank Polski. The product name shipped to
> players is **Watt City**. See Risk #1 (PKO trademark).
>
> **Status 2026-04-22**: MVP live on https://watt-city.vercel.app,
> 1st place PKO Gaming track at ETHSilesia 2026. This document is the
> product-narrative source of truth — most of the "what ships first"
> scope in Section 11 is now actual. Delta vs vision is tracked in
> `docs/SKO-BACKLOG.md`.

## 1. Why this exists

PKO Bank Polski's existing **SKO** ("Szkolne Kasy Oszczędności") is a children's savings app where parents push pocket money to a child's account and the child watches educational videos. Real product reality:

- Videos sit unwatched.
- The kid's screen-time gravitates to TikTok/YT/Roblox/Brawl Stars — not a static "open and read" app.
- Financial behaviour learned: virtually none. The app is a passive ledger, not a teacher.

There is a clear gap: a **gamified financial literacy app** that earns the kid's attention through the same loops as the games they already play, while the parent stays in the loop as the actual money-bridge. The XP Arena engine — daily AI-generated challenges, progression building, leaderboards — is exactly the right base.

**Promise:** turn 10–15 minutes a day of compulsive play into the financial intuition a 10-year-old needs by 18.

## 2. Audience

| Cohort | Role | Hook |
|---|---|---|
| **Primary** — kids 8–14 | Player | Daily new game, building empire, unlock loans, beat friends on leaderboards |
| **Secondary** — parents 30–50 | Sponsor + monitor | Watch progress, see educational outcomes, choose to mirror in-game savings with real PKO Junior account top-ups |
| **Tertiary** — teachers, schools | Curriculum partner | Class leaderboards, Q-of-the-week, alignment with PL "podstawa programowa" basics economics |

Critical: **no real money inside the app**. Real money flows happen externally (parent → PKO Junior account). The app is a simulator + leaderboard for *behaviours*. This sidesteps GDPR-K, PSD2, and KNF licensing.

## 3. Core loop

```
[1] Daily AI challenge       (5 min, generates resources)
   ↓
[2] Spend resources to build / upgrade buildings
   ↓
[3] Buildings produce passive cashflow (in-game zł)
   ↓
[4] Take loans against cashflow → unlock bigger builds
   ↓
[5] Pay back loans on time → credit score → unlock new building tiers
   ↓
[6] Repeat tomorrow with a NEW challenge type
```

Every action teaches a financial concept by feel: scarcity (resources), prioritisation (where to build), opportunity cost (loan repayment vs new build), credit (interest), portfolio (multi-building cashflow).

## 4. Resources

Replace single XP/Watts with a **multi-resource economy**. Each game kind yields one or two specific resources, so kids who like quizzes and kids who like reflex games both progress, just toward different building specialisations.

### Primary (used to BUILD)
| Resource | Symbol | Yielded by | Educational concept |
|---|---|---|---|
| **Watts** ⚡ | yellow | reflex/timing games (energy-dash, power-flip) | energy basics |
| **Coins** 🪙 | gold | quiz, true-false (knowledge games) | passive income |
| **Bricks** 🧱 | brown | scramble, match-pairs (vocabulary) | construction stock |
| **Glass** 🪟 | cyan | order/timeline, price-guess (analytical) | refined goods (mid tier) |
| **Steel** 🔩 | grey | tier-3+ challenges (multi-step / hard difficulty) | advanced industry |
| **Code** 💾 | green | future kinds (logic, debug, math-sprint) | knowledge worker |

### Currency (used to OPERATE)
| Resource | Symbol | How it appears | Educational concept |
|---|---|---|---|
| **In-game zł** 💵 | green bill | Hourly cashflow from buildings | cash on hand |
| **Credit score** ⭐ | 0–100 | Earned via on-time loan repayment | reputation matters |

### Production rules
- Each game's max yield is bounded (cap × difficulty).
- Daily AI hra yields **2× resources** for the relevant kind (incentive to play the rotating challenge).
- Best-score rule from XP Arena stays — replays don't farm resources, only beating your record does.

## 5. Buildings

A **single static map** (1800×460 SVG, like the current CityScene panorama but extended) with **20 fixed slots**. Players choose what to build in each slot. No two players have identical city layouts.

### Categories

**Resource producers** (give passive cashflow / resource trickle):
- 🏠 Domek mieszkalny (house) — coins/h
- 🏪 Sklepik osiedlowy (corner shop) — coins + bricks
- ⚡ Mała elektrownia (mini power plant) — watts/h
- 🪟 Huta szkła (glassworks) — glass/h
- 🔩 Walcownia (steel mill) — steel/h
- 💻 Software house (later tier) — code/h

**Knowledge multipliers** (boost yield of certain game kinds):
- 🏛️ Biblioteka (library) — +20% coins from quiz games
- 🎮 Gimnazjum sportowe (sports school) — +20% watts from reflex games
- 📚 Centrum nauki (science centre) — +20% from order/match games

**Civic** (unlock features):
- 🏦 Bank lokalny (local bank, **TIER 3**) — unlocks first mortgage
- 🏛️ Skarbówka (tax office, TIER 5) — unlocks tax-optimization mini-game
- 🚉 Stacja kolejowa (train station, TIER 7) — unlocks trade with other players (PvP)

### Building economy

Each building has:
```ts
{
  id: "glassworks",
  name: "Huta szkła",
  category: "producer",
  baseCost: { bricks: 50, coins: 200 },
  level: 1..10,
  upgradeMultiplier: 1.6,         // each level costs 1.6× the prior
  yield: { glass: 2 /*per hour*/ }, // base, scales with level
  yieldMultiplier: 1.4,            // each level produces 1.4× more
  unlockTier: 4,                   // requires player tier 4
  buildTime: 0,                    // instant (or wait time for higher tiers)
  prerequisites: ["coal-mine"],    // optional dependency on other buildings
}
```

### Long-progression math

Borrowing from Age of Empires II and Clash of Clans:

- **Cost growth**: 1.6× per level → level 10 costs ~110× the level-1 cost
- **Yield growth**: 1.4× per level → level 10 yields ~29× the base
- **Net effect**: ROI gets *worse* per level (cost grows faster than yield), so players have to think about where to put marginal investment
- **Prestige**: max-level buildings give cosmetic glow + leaderboard boost

A casual player (3 plays/day) reaches mid-tier (5) buildings in ~2 weeks. Hardcore reaches max in ~6 weeks. Both can play forever — endgame = own all 20 slots at max + perfect credit score.

## 6. Loans / credit (the financial-education core)

This is the differentiating educational layer. The loan system mirrors real-world consumer finance, simplified.

### Visibility vs eligibility

The mortgage button is **always visible** in the UI from day one — kid sees the path forward — but **not always usable**. Clicking shows a "wymagania" panel with a progress bar of what's missing:

```
🏦 Hipoteka — wymagania
━━━━━━━━━━━━━━━━━━━━━━
✓ Aktywne konto                          ✓
✗ 2 budynki produkcyjne (masz: 1)        ░░ 50%
✗ Cashflow ≥ 30 coins/godz (masz: 5)     ░░ 17%
✗ Bank lokalny (opcjonalne, lepsze RRSO) — niedostępne
```

This teaches the real-world lesson: *banks don't lend to people without income or collateral*.

### Two paths to mortgage

| Path | Prerequisites | APR | Reasoning |
|---|---|---|---|
| **Standard** | ≥ 2 producer buildings + cashflow ≥ 30/h | **8 % APR** | Bank takes risk on unestablished borrower |
| **Preferred** | Standard + Bank lokalny T3 already built | **5 % APR** | Built relationship with bank — better terms |

Educational moment: kid sees concrete benefit of Bank lokalny — not just a building, but a way to borrow cheaper. Mirrors real life ("banks reward existing customers").

### Mortgage params

```
Available loan = 12 × monthly cashflow (1 year of income)
Interest rate    = 8 % APR (standard) | 5 % APR (preferred)
Term            = 12 / 24 / 36 months
Repayment        = monthly auto-deduct from cashflow
```

**On-time repayment** → credit score +1 each month
**Missed payment** → cashflow auto-paused on smallest building until cleared, score −5
**Default (3 missed)** → smallest building seized & sold for 50% of build cost; score −20

### Educational moments

- "RRSO calculation" tooltip when taking the loan — shows true cost incl. opening fee
- "Wcześniejsza spłata" option (early repayment) — saves on interest, +score
- "Nadpłata" option (overpayment) — kid can throw extra coins at principal

### Future loans (coming-soon UI from day 1)

- 🏪 **Kredyt obrotowy** — short-term against pending game scores
- 💎 **Leasing** — rent a high-tier building for 6 months, then keep or return
- 🚗 **Kredyt konsumencki** — instant cash, sky-high RRSO (cautionary tale)
- 📈 **Kredyt inwestycyjny** — borrow to BUY another player's building (T7+)

Each "coming soon" lock screen shows the educational concept the loan teaches.

## 7. Game lifecycle (the "everyone watches a new challenge open")

**Cadence: every hour** a new challenge spawns and the previous one retires. This is more aggressive than the original XP Arena daily rotation — hourly creates the "always-fresh" hook a kid expects from games like Brawl Stars (which has hourly chests).

### Timeline of a game

```
T-30m    Teaser appears in city: "Otwiera się: <theme> · <kind> za 30 min"
         ↓                       countdown ticks down on the LIVE building
T-5m     PWA push notification: "Nowa wyzwanie za 5 min"
         ↓
T=0      Reveal: city scene animates — crane lifts the new building into
         place, sign flips. Old game retires — envelope fades to archive,
         final medal locks in (top-3 forever).
         ↓
T+0..1h  LIVE. Resource yield 2× while live. Banner above building.
         ↓
T+1h     Game closes. Old building tile becomes "memory plaque" (hoverable,
         shows medal winner + when game ran).
```

**Why hourly works:**
- Quick wins for short attention spans (kid plays for 5 min, gets resources, closes)
- 24 challenges per day means every kid hits multiple "new" moments
- 24h archive of medal-bearing games means weekly Hall of Fame is rich

### Job that drives this

Two layers — a scheduler PLUS a lazy fallback so the rotation never silently dies:

**Layer 1 — scheduled cron (every 5 min):**
```
– read xp:ai-games:index
– for each game: compute time-to-expiry
– at T-5m: emit PWA push notification
– at T<=0:
    • mark expired game as archived
    • call runPipeline() to generate next
    • broadcast "new-game-opened" event (server-sent event for connected clients)
```

**Layer 2 — lazy on-request check** (every page load):
```
– on each render of /games or /:
    • if any LIVE game is past expiry, call rotation pipeline inline
      (with single-flight lock in Redis to avoid double-rotate)
```

This belt-and-braces protects against cron downtime. Vercel Hobby's 1×/day cron limit is the constraint — for hourly we either upgrade to Pro (allows /5-min schedules) OR use an external pinger (cron-job.org → POST /api/cron/rotate every 60 min). Lazy layer fills the gaps either way.

### Notification surface

| Surface | What |
|---|---|
| In-app banner | "Otwiera się: Mity finansowe za 47 min" |
| PWA push | When notifications enabled |
| Email digest | Weekly summary for parents |
| Discord/Slack webhook | (optional, for class teachers) |

## 8. Architecture — what changes vs current XP Arena

### Reuse as-is
- Auth (HMAC sessions, scrypt)
- Upstash Redis backend
- AI pipeline (Sonnet PL + Haiku ×3 translations)
- Game render clients (quiz / scramble / price-guess / true-false / match-pairs / order)
- Per-game leaderboards
- Sin-slavy archive
- i18n (PL/UK/CS/EN)
- Vercel hosting

### Extend
- **Data model** for users: add `resources`, `buildings[]`, `loans[]`, `creditScore`, `lastCashflowTickAt`
- **City scene** → grid map editor (20 placeholder slots, click to build)
- **AI game spec** → add `resourceYield` field (which resources this game type produces)

### Net new
- **Resource ledger** — append-only log of resource ins/outs (audit trail)
- **Building catalog** — static config, then per-user instances
- **Cashflow tick worker** — every hour, credit each player's buildings into their resource ledger (with offline catch-up)
- **Loan engine** — repayment scheduler, interest calc, default handling
- **Challenge ticker** — countdown / new-game-opens broadcast
- **Parent dashboard** — separate route, see kid's progress without playing
- **Build place UI** — drag/click building from catalog onto map slot
- **Building detail panel** — upgrade, demolish, see lifetime yield

### Schema sketch

```ts
type Resources = {
  watts: number; coins: number; bricks: number;
  glass: number; steel: number; code: number;
  cashZl: number;           // in-game zł
};

type BuildingInstance = {
  id: string;               // unique per slot
  catalogId: string;        // ref into BUILDING_CATALOG
  slotId: number;           // 0..19
  level: number;            // 1..10
  builtAt: number;          // epoch ms
  lastTickAt: number;       // last cashflow credit
};

type Loan = {
  id: string;
  type: "mortgage";
  principal: number;        // borrowed amount (in-game zł)
  rateApr: number;          // 0.06 = 6 %
  termMonths: number;
  startedAt: number;        // epoch ms
  monthsPaid: number;
  monthlyPayment: number;
  outstanding: number;      // current balance
  status: "active" | "paid_off" | "defaulted";
};

type PlayerState = {
  username: string;
  resources: Resources;
  buildings: BuildingInstance[];
  loans: Loan[];
  creditScore: number;      // 0..100
  tier: number;             // overall tier, derived from buildings
  lastCashflowTickAt: number;
};
```

### Redis keys
```
xp:player:<username>          → PlayerState JSON
xp:player:<username>:ledger   → list (LPUSH) of {ts, kind, delta:Resources, reason}
xp:building-catalog           → static cached, server-side
xp:loan-rates                 → admin-tunable rate sheet
```

### XP Arena → SKO migration

Existing XP Arena leaderboards stay (used as **historical data**) but:
- **Watts** keep meaning, become one of 6 resources
- Per-game leaderboards stay (still drive AI medal system)
- Add a **second** leaderboard: net worth (sum of building values + cash − outstanding loans). This is the "rich list", separate from skill leaderboard.

## 8.5 What current PKO SKO actually does (research, 2026-04)

Source: [sko.pkobp.pl](https://sko.pkobp.pl/) + [pkobp.pl](https://pkobp.pl/) — fetched and summarised.

### Current SKO product

- **School-mediated entry**: child logs in with a teacher-issued code, not a direct sign-up. Onboarding "Twój login" + "Hasło", parental consent required for social.
- **Mascot**: animated giraffe (`Żyrafa`) guides the child.
- **Engagement surfaces**:
  - "Test SKO" — single quiz; on completion you get a "Mistrz wiedzy SKO" certificate.
  - "Demo serwisu" — service walk-through.
  - "Bezpieczeństwo" — security education module.
  - Related sites: SKO.edu.pl, SzkolneBlogi.pl.
- **Brand tone**: warm + child-friendly. Hello: "Witaj, w serwisie SKO!". CTA: "Wejdź do SKO".
- **Greater PKO context**: the bank's main site (pkobp.pl) markets "Konta dla dzieci", "PKO Junior" app, and "Szkolnych Kas Oszczędności PKO Banku Polskiego" with the Economic Knowledge Test framed as building "kompetencji finansowych i cyfrowych dzieci oraz młodzieży".

### Honest gap analysis

| Current SKO has | Current SKO is missing | We bring |
|---|---|---|
| Teacher gateway, mascot, single quiz | Daily fresh content, retention loops, mechanical depth | 24× hourly AI challenges, 6+ kinds, multi-resource economy, building empire, loans |
| Static education videos | Active gameplay | Best-score replays, leaderboards, medal permanence |
| One certificate ("Mistrz wiedzy") | Long-term progression | 9-tier player levels, building level 1→10, credit score reputation |
| Quiz-only | Variety | Quiz / scramble / price-guess / true-false / match-pairs / order (and growing) |

### Compatibility with PKO brand

- **Color shift required**: PKO uses primary blue; XP Arena is neo-brutalist yellow/black. For the pitch we either (a) re-skin demo to PKO blue, (b) keep our identity as the "sub-brand" (like Roblox keeps its identity inside school programs), or (c) propose dual-mode skin.
- **Mascot question**: keep PKO's giraffe (Żyrafa) for continuity, OR introduce a complementary character (e.g. a Silesian builder dwarf — local cultural anchor).
- **School-mediated onboarding**: easy to add — class teacher creates a "klasa" workspace, hands out join codes; we have user system, just need a many-to-one wrapper. Maps to Phase 3 in backlog.

### What we'd ask PKO

We're not asking for the prize money. We're proposing a **6-month pilot**:
- White-label our engine into a "SKO 2.0" PWA inside the existing PKO app shell.
- Keep PKO's blue + giraffe for visual continuity with parents.
- PKO supplies: Junior-account top-up API, school class import, brand QA.
- We supply: daily content engine, mechanics, leaderboards, telemetry, live ops.

If the engine proves D1/D7 retention beats current SKO numbers (publicly claimed numbers low — expectation: any active loop will 5×), we extend to a multi-year contract. If not, PKO keeps the prototype.

---

## 9. Pitch for PKO

The pitch to the actual sponsor (PKO XP: Gaming category):

1. **PKO already owns kids' financial education positioning** (SKO brand, Konto dla Młodych). The static-video model loses to TikTok every day.
2. **We propose a re-skin of SKO** as a daily-game habit-builder, where the game IS the lesson — RRSO, credit score, cashflow, mortgage, taxes — all taught by *playing*.
3. **The XP Arena hackathon prototype** demonstrates the engine: AI generates fresh content daily, multi-resource economy, leaderboards drive retention.
4. **Path forward**: white-label the engine into the existing SKO app shell. PKO supplies brand + parent-account API; we supply daily content engine + game mechanics.

This re-positions XP Arena from "another educational website" to "the engine that makes SKO finally watched". That's a much better ask than "give us the prize".

## 10. Open questions (need decisions before phase 2 starts)

| # | Question | Default if no answer |
|---|---|---|
| 1 | Use "SKO" name publicly, or codename until PKO partnership? | **Codename** — call it "XP City" or "Watt City" externally; "SKO" only in pitch |
| 2 | Real PWA install for kids, or web-only? | PWA with parent-approved install |
| 3 | Online-only or offline-first? | Online — Redis is required for resource tick |
| 4 | Parent oversight model? | Parent reads-only dashboard via shared link, no separate parent app yet |
| 5 | Friend-vs-friend trade (T7+)? | Yes, but post-MVP |
| 6 | Real PKO API integration eventually? | Yes — design APIs to be PKO-mockable from day one |

See `docs/SKO-BACKLOG.md` for the phased work plan.

---

## 11. MVP definition — as shipped (2026-04-22)

The scope below is live on https://watt-city.vercel.app. The "COMING-SOON"
set below was drafted pre-ship; most of it is now live — verify individual
items against `docs/SKO-BACKLOG.md` Phase 1.

### SHIPPED (live, real)
1. **Hourly AI game rotation** — cron + lazy-render fallback + external
   pinger. Rotation triple-redundant (see ADR
   `docs/decisions/001-hourly-rotation-on-hobby.md`).
2. **Single starter building: Domek.** Every other building must be
   earned. Earn-to-unlock thresholds enforced in `lib/building-catalog.ts`.
3. **0 starter resources** — player accumulates via gameplay only.
4. **Resource ledger** — all 7 resources (⚡ 🪙 🧱 🪟 🔩 💾 💵) live with
   append-only SADD-backed idempotent ledger.
5. **Mortgage flow** — amortized 8% / 5%-preferred, 12/24/36 mo, credit
   score 0–100 with on-time / missed / default transitions.
6. **Cashflow tick** — hourly; 30-day offline catch-up cap; citywide-
   landmark multiplier; single-flight 30s lock.
7. **20-slot city map** at `/miasto` — place / upgrade / demolish (50%
   refund, Domek-protected), rate-limited 5 ops/min.
8. **LIVE countdown** for current AI hra.
9. **12 AI kinds shipped** (quiz / scramble / price-guess / true-false /
   match-pairs / order / memory / fill-in-blank / calc-sprint / budget /
   chart-read / what-if) vs original 6 at pivot time.
10. **9 evergreen mini-games** (finance-quiz, stock-tap, memory-match,
    math-sprint, energy-dash, power-flip, currency-rush, budget-balance,
    word-scramble) as the "training ground".
11. **Parent observer flow** (V4.6) — invite code, GDPR-K consent,
    `/rodzic` read-only dashboard.
12. **Teacher / classroom flow** — `/nauczyciel`, invite codes, per-class
    leaderboard, onboarding tour.
13. **Notifications** — bell dropdown with unread badge, tier-up + missed-
    mortgage events, quiet-hours push gate.
14. **Web3 opt-in** — soulbound `WattCityMedal` ERC-721 on Base Sepolia,
    parent-gated mint, burn-on-revoke.
15. **4 languages** (PL / UK / CS / EN), cookie-driven SSR, 423 keys,
    zero drift.
16. **Auth / security** — per-IP rate limits, CSRF double-submit via
    `proxy.ts` + `CsrfBootstrap`, awardXP single-flight lock,
    Resend→SendGrid→log mailer fallback.

### STILL COMING-SOON (placeholders only)
- Marketplace / friend trade (schema exists; launch gated on D10).
- PKO Junior real-money mirror — blocked on partnership signing.
- Tier 5+ Skarbówka / Stacja kolejowa full logic.
- Other loan types beyond mortgage (kredyt obrotowy / leasing / konsumencki / inwestycyjny).
- Native-app shells (PWA is live; Capacitor iOS/Android not yet).
