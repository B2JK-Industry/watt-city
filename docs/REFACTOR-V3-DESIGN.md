# Watt City V3 — design doc

**Status**: handoff pre agenta, pokračuje V2 refactor  
**Base branch**: `watt-city` @ `1d2c498` (V2 + critical fixes)  
**Target branch**: `watt-city-v3` (vytvor z watt-city)  
**Scope**: ~2 dni focused work, ~40 commitov, ~15-20 súborov

## 0. Kontext

V2 refactor (pre-audit) zjednotil resources 7→4, cashflow HUD, post-game breakdown, restructuring. Audit ODHALIL:

**Part A — identity split**: CITY_TIERS (jedna rastúca vlastná budova — XP Arena reliktov) koliduje s V2 city-builder (20-slot mapa, 15 budov). Dva naratívy naraz. Treba **zmazať CITY_TIERS a prejsť na "pure city-first"**.

**Part B — 15 game mechanic findings**. CRITICAL + HIGH sú v V3 scope. MEDIUM+LOW odložené do V4 backlog-u.

V3 ship set:
1. CITY_TIERS replacement (Option A "Pure City-First")
2. New-player onboarding fix (F2 — 2h grind pre 2. budovu)
3. Brownout UI surface (F4 — nejasný penalty)
4. Score race condition lock (F10)
5. Loan payment calendar + auto-repay (F14)
6. Duel removal (F8)
7. Loan comparison ladder (F7 — pedagogicky kľúčové)

---

## V3.1 CITY_TIERS replacement — "Pure City-First"

### Problém
`lib/level.ts` obsahuje `CITY_TIERS` — 9 tiers od "Drewniana chata" po "Varso Tower", consumed v 7 súboroch (dashboard, layout, nav, landing, games, o-platforme, player-building). Koliduje s city-builder logikou (lib/city-level.ts už existuje s cityLevelFromBuildings).

### Design (Option A)

**Dashboard hero**: 
- Namiesto `PlayerBuilding` SVG + tier emoji + story → živý SVG **skyline** ich mesta (top-down view 20 slotov, occupied budovy rendred ako mini-budovy)
- Pod skyline: `City Level X (Y/Z pts) → Next unlock: <building-name>`
- Vedľa: cashflow summary (už v HUD, ale duplikovaný ako primary focus)

**Nav badge**:
- Namiesto `🛖 Drewniana chata` → `⚡ Level 5 · Grid: +45/h` (dynamický emoji podľa grid state: ⚡ surplus, ⚠️ deficit, 🔌 balanced)

**Landing (anonymous)**:
- Namiesto top-5 XP hráčov → **Top 3 největšie mestá**, každé s mini skyline + City Level + count buildings

**/o-platforme**:
- Zmazať CITY_TIERS gallery
- Nahradiť `LEVEL_UNLOCKS` ladder: "Level 3 → odomyká Bank lokalny (preferred 5% APR) · Level 5 → odomyká Fotowoltaika · Level 8 → odomyká Varso Tower ..."
- Per level ukázať jedno-vetový educational moment ("Bank lokalny = lokálna banka ti dá lepšie podmienky. V realite platí pre malé mestá to isté.")

**Files to change:**
- `lib/level.ts` — DELETE `CITY_TIERS`, `tierForLevel`, `titleForLevel`. Keep `levelFromXP` + `formatWatts` (leaderboard displays still use).
- `lib/city-level.ts` — expand to expose `cityLevelFromState(state) → {level, pointsEarned, pointsForNext, unlocks}`, add `LEVEL_UNLOCKS` table (what unlocks at each level 1-10).
- `components/dashboard.tsx` — replace `PlayerBuilding` + tier card with `CityLevelCard` + new `CitySkylineHero` component.
- `components/city-skyline-hero.tsx` NEW — top-down SVG of 20 slots, filled per current state.
- `app/layout.tsx` — nav title computed from buildings (no more `tierForLevel`).
- `components/site-nav.tsx` — title now `"Level {n} · {gridState}"`.
- `app/page.tsx` — anonymous leaderboard = top 3 cities from `xp:leaderboard:city-value`.
- `app/games/page.tsx` — drop tier header.
- `app/api/me/route.ts` — return `cityLevel` + `unlocks` instead of `title`.
- `app/o-platforme/page.tsx` — replace `CITY_TIERS.map(...)` with `LEVEL_UNLOCKS.map(...)` with edu-moments.
- `components/player-building.tsx` — delete (OR: keep as avatar-ish for /profile only).

**Feature flag**: `v3_city_first`, default `on` (additive — doesn't break existing). If someone reports bug, flip off for them.

**Migration**: no data migration needed — CITY_TIERS was pure UI, no persisted references.

**Acceptance**:
- 41+ test files pass (no regressions from V2)
- New test: dashboard renders city skyline for player with 3+ buildings
- New test: nav badge shows correct `Level X · Grid: ±Y/h` format
- Smoke: register new user → dashboard shows "Level 1 · 1/3 pts" + skyline with only Domek + "Next: Build Sklepik for Level 2"

---

## V3.2 New-player onboarding — fix the hard wall

### Problém (F2 CRITICAL)
Po registrácii: player dostane Domek (free, 5 coins/h yield). Prvá hra (e.g. energy-dash) = max 150W + 70 coins. Mała elektrownia stojí **50 coins + 80 bricks**. Kde zoberie bricks? Len z niektorých skill hier (memory-match, word-scramble). Musí zahrať 5-10 špecifických hier → 2h grind pred 2. budovou.

### Design

**Dvojitá oprava** (ship both, measure které funguje lepšie):

1. **Reorder unlocks**: Sklepik má byť prvá non-Domek budova (nie Mała elektrownia). Stojí 60 bricks + 80 coins — stále bricks-gated, ale Sklepik yielduje coins+bricks (viac po postavení, bootstrap loop). Mała elektrownia stays as step 2 (teraz ľahšie po Sklepiku).

2. **Signup starter kit**: new player pri registrácii dostane `{ coins: 50, bricks: 50 }` cez ledger entry `kind: "signup-gift"`. Stále musí zahrať aspoň 1 hru na unlock threshold (50 earned), ale nemusí hrať špecifické bricks-hry.

Oba fixes ship; 2 je safety net ak 1 nestačí.

**Files:**
- `lib/building-catalog.ts` — reorder Sklepik before Mała elektrownia, verify unlock conditions make sense
- `lib/buildings.ts` ensureSignupGift — extend to also credit `{ coins: 50, bricks: 50 }` cez `creditResources` s sourceId `signup:starter-kit` (idempotent via SADD)
- `lib/player.ts` — expose `hasReceivedStarterKit(username)` check
- `app/api/auth/register/route.ts` — pre-flight: if new user, trigger starter kit credit

**Feature flag**: `v3_starter_kit`, default `on`. Observable via `/api/admin/analytics/retention` (measure: D1 retention after flip, expect +15%).

**Acceptance**:
- Test: fresh register → `lifetimeEarned.bricks === 50`, `lifetimeEarned.coins === 50`
- Test: play finance-quiz 80xp → can build Sklepik (not blocked)
- Smoke: new user → register → play 1 game → can afford Sklepik within 5 min

---

## V3.3 Brownout UI surface (F4 HIGH)

### Problém
Watt deficit po 24h = -50% yield non-energy. Po 48h = -25%. Po 72h = bankruptcy grace window. Hráč nikde nevidí countdown, nejasne vie že môže restructureovať, nevie ako sa dostat von.

### Design

**Nová komponenta** `components/watt-deficit-panel.tsx`:
- Mounts iba keď je deficit aktívny (podmienečný render v layout)
- Sticky banner pod nav, akcent amber
- Shows:
  - "⚠️ Grid deficit — X hours elapsed"
  - Countdown: "Full yield in 24h → 50% yield in {24-X}h → 25% yield in {48-X}h → rescue loan available after {72-X}h"
  - **One-tap rescue CTA**: "Postav Mała elektrownia (-150 coins)" button → link to /miasto?focus=mala-elektrownia
  - Secondary: "Vziať rescue loan (0% APR, 1 month)" — emergency loan per HIGH-8

**Educational moment** on first deficit enter:
- Modal (skippable): "V reálnom svete ak nemáš dost energie, infrastruktúra prestáva fungovať. V našej hre: najprv yield klesne na 50%, potom 25%. Urob si energetický plán skôr ako dosiahneš deficit."

**Files:**
- `components/watt-deficit-panel.tsx` NEW
- `components/cashflow-hud.tsx` — add rescue CTA chip in compact mobile view
- `app/layout.tsx` — conditional render watt-deficit-panel based on `deficitState(player)`
- `lib/watts.ts` — expose `deficitState(player) → {inDeficit, hoursInDeficit, nextMilestone, rescueAvailable}`
- `lib/notifications.ts` — add `deficit-warning` notification type, fire once per deficit event
- `app/api/loans/rescue/route.ts` NEW — 0% APR 1-month loan for `150 coins`, one-per-30d per account
- i18n strings (4 langs) for all deficit messages

**Acceptance**:
- Test: player with 1 Huta szkła (consumes 12/h) + 0 energy buildings → after 25h simulated → `deficitState.hoursInDeficit === 25`, `nextMilestone === "50-percent-yield"`
- Test: rescue loan creates 150 coin credit + 1-month repayment plan
- Smoke: induce deficit → panel appears → click rescue CTA → loan taken

---

## V3.4 Score multiplier race condition (F10 HIGH)

### Problém
`/api/score` POST vypočíta multBreakdown z current `state.buildings`. Ak player medzitým demolish-ne budovu (iná karta), credited amount používa staré buildings, breakdown UI používa nové. Race.

### Design

Zamkni mutácie buildings pre 1s počas POST /api/score:
- `lib/building-lock.ts` NEW — `kvSetNX("xp:building-lock:<user>", "locked", { ex: 2 })` call
- `app/api/buildings/{place,upgrade,demolish}/route.ts` — early return `{ok:false, error:"score-in-progress"}` ak lock held
- `app/api/score/route.ts` — acquire lock before state read, release in finally
- Client: retry demolish/place request once after 500ms if gets `score-in-progress`

**Acceptance**:
- Test: concurrent POST /api/score + POST /api/buildings/demolish → demolish returns `score-in-progress` first time, succeeds second
- Test: score multBreakdown always reflects same building set as credited resources (snapshot invariant)

---

## V3.5 Loan payment calendar + auto-repay (F14 HIGH)

### Problém
Player vezme hypotéku, idle-uje 3 dni, missed payment, credit score -15, **netuší prečo**. UI nikde nemá "ďalšia splátka X zl za Y dní". Žiadny auto-repay toggle. Pedagogicky zlé.

### Design

**Dashboard widget** `components/loan-schedule.tsx`:
- Ukáže active loans s:
  - Názov produktu + balance
  - "Next payment: {dd.mm} · {amount} zł"
  - Progress bar: `{monthsPaid}/{termMonths}` mesiacov
  - Status badge: On track / At risk / Overdue
  - Auto-repay toggle (per-loan): Cashflow automaticky odvedie splátku

**Notifications**:
- 48h pred splátkou → in-app notification + (optional) push
- Missed payment → immediate notification "Missed payment on {loan}. Credit score -5. Pay {amount} from available cashflow?"

**Auto-repay logic**:
- Default: ON pre nové loans (pedagogicky — kids learn automation is helpful)
- Pri tick: ak auto-repay a balance ≥ payment → deduct automatic. Dedupe ledger key `auto-repay:{loanId}:{month}`.
- Ak balance < payment → fallback ako teraz (miss counter)

**Files:**
- `components/loan-schedule.tsx` NEW
- `lib/loans.ts` — add `autoRepay: boolean` to Loan schema, default true for new loans
- `lib/tick.ts` — processLoanPayments respects autoRepay flag
- `app/api/loans/[id]/auto-repay/route.ts` NEW — PATCH endpoint to toggle
- `lib/notifications.ts` — add `loan-payment-due`, `loan-payment-missed`, `loan-paid-off` types
- Dashboard integration: show LoanSchedule widget when active loans exist

**Acceptance**:
- Test: new mortgage → autoRepay=true by default
- Test: tick with sufficient coins + auto-repay on → payment deducted automatically + notification
- Test: 48h countdown fires notification exactly once per payment cycle
- Smoke: take mortgage, wait 1 month → see auto-payment entry in ledger, notification in bell

---

## V3.6 Duel removal (F8 LOW)

### Problém
`/duel` feature je orphaned — 6-round math sprint, žiadny ledger credit, žiadny achievement, žiadna navigácia na city progression. Player click `/duel`, zistí že to nič nedáva, vypne to.

### Design

**Full removal:**
- Delete `app/duel/*`, `app/api/duel/*`
- Archive `lib/duel.ts` → rename to `lib/duel.legacy.ts` + add top comment "removed from nav, retained for git history". Delete all its tests.
- Remove from `components/site-nav.tsx` (desktop + mobile bottom-tabs)
- Remove `duel*` strings from `lib/locales/*`
- Remove from `/api/admin/rotation-status` health check if referenced

**Phase 2+ plan**: future "duel" (ak vôbec) by bol "Mądry Wybór" — async financial decision sprint. Design ADR to `docs/decisions/NNN-duel-removal-and-future.md`.

**Acceptance**:
- `grep -r "duel" app/ components/ lib/ | grep -v legacy | grep -v test` returns only comments/ADRs
- Nav menu visually has no "Pojedynek" link
- /duel returns 404 cleanly
- No test failures

---

## V3.7 Loan comparison ladder (F7 MEDIUM → bonus)

### Problém
Player vidí kredyt konsumencki 20% APR vs mortgage 8% APR ako "len čísla". Necíti 4× bolestnejší interest cost. Pedagogická strata.

### Design

**Loan quote comparison modal** `components/loan-comparison.tsx`:
- Triggernutý cez `/loans/compare?principal=X&term=Y`
- Zobrazí ladder — všetky EligibLE produkty pre tú sumu + termín:
  - Mortgage 8% → 226 zl/mesiac → total interest 627 zl
  - Leasing 10% → 230 zl/mesiac → total interest 660 zl (ale +20% upfront)
  - Kredyt obrotowy 12% → (if eligible) 232 zl/mesiac → total interest 693 zl
  - Kredyt konsumencki 20% → 250 zl/mesiac → total interest 1200 zl ⚠️ **red**, 4× more expensive
- Each row klickteľný → take-loan flow

**Highlight cheapest**: green check vedľa najlacnejšej option.

**Educational tooltip** na konsumencki: "V realite kredyty konsumenckie často majú skryté poplatky. Vždy porovnaj všetky alternatívy skôr."

**Wire from loan take flow**: on loan-take page, default view = comparison (not direct "take mortgage"). Forces comparison moment.

**Files:**
- `components/loan-comparison.tsx` NEW
- `app/loans/compare/page.tsx` NEW
- `lib/loans.ts` — expose `compareLoans(principal, term, state)` → all eligible quotes sorted by total cost
- Nav: add "Porovnaj kredyty" chip in Miasto when loans section visible

**Acceptance**:
- Test: `compareLoans(3000, 12, state)` returns mortgage first (cheapest), konsumencki last (most expensive), konsumencki marked `warning: true`
- Smoke: user on /loans/compare vidí tabuľku s 4+ produktami, cheapest má zelený check, konsumencki má červený warning badge

---

## Summary — V3 deliverables

| Item | Effort | Priority | Breaking |
|---|---|---|---|
| V3.1 CITY_TIERS replacement | L | CRITICAL narrative | UI-only, no data migration |
| V3.2 New-player onboarding | M | CRITICAL retention | Additive (starter kit) + unlock order |
| V3.3 Brownout UI | M | HIGH pedagogy | Additive (new panel) |
| V3.4 Score race condition | S | HIGH correctness | Additive (lock) |
| V3.5 Loan calendar + auto-repay | L | HIGH pedagogy | Adds autoRepay field to Loan (default=true) |
| V3.6 Duel removal | S | POLISH | Removes /duel routes — 404 after deploy |
| V3.7 Loan comparison ladder | M | MEDIUM pedagogy (bonus) | Additive (new page) |

**Total effort**: ~2 focused days (L+M+M+S+L+S+M ≈ 30-40 hours). Tests: target 400+ (from 368 baseline).

**Migration concerns**:
- V3.1: none (pure UI)
- V3.2: starter kit idempotent via SADD
- V3.3: none (new component)
- V3.4: none (new lock key)
- V3.5: Loan schema gets `autoRepay` field, default true. Back-compat via optional field. Migration: PATCH existing loans to autoRepay=false (preserve user choice of "I manage it manually") OR leave as default-true (opinionated default for pedagogy).
- V3.6: API /api/duel/* returns 404 after deploy — any inflight duels are dropped. Minor impact, document.
- V3.7: none (new page)

**Feature flags** (all default-on, safety switches):
- `v3_city_first` — CITY_TIERS → City Level dashboard
- `v3_starter_kit` — signup starter 50c + 50b
- `v3_brownout_panel` — deficit UI
- `v3_score_lock` — race condition fix
- `v3_loan_calendar` — calendar widget
- `v3_loan_comparison` — comparison ladder

**Deferred to V4** (not in this session):
- F1 unlock gate alignment
- F3 deprecated resource buildings removal
- F5 daily cap per-game-kind
- F9 achievement rebalance
- F12 watt rescue window doc
- F13 unlock reason clarity
- F15 slot categorization
