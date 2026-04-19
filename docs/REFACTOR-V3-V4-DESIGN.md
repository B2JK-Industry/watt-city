# Watt City V3 + V4 — combined design doc

**Status**: handoff pre agenta, pokračuje V2 refactor  
**Base branch**: `watt-city` @ `9601ebf` (V2 + crit fixes + mechanics fixes)  
**Target branch**: `watt-city-v3v4` (vytvor z watt-city)  
**Scope**: ~3-4 dni focused work, ~60 commitov, ~30-40 súborov

## 0. Strategická rámec

**Čo robíme + prečo:**
- **V3 = mechanics/UX polish** — stabilizuje core game loop, opravuje CITY_TIERS identity split, nový-hráč cliff, loan pedagogy. Bez toho je hra "funkčná ale zabíja retention".
- **V4 = classroom-first pivot** — prepína Watt City z "solo kid game" na "school-ready engine pre PKO partnership". PKO má prístup ku stovkám škôl — Watt City musí byť to čo PKO salesperson ukáže riaditeľke. Toto je **zmena target persona**: z kid → teacher.

**Sequencing**: V3 ide prvé (mechanics baseline), V4 druhé (classroom elevation). Content Machine (new AI kinds, new themes, portfolio-pick, tax-fill) je **V5 = "Coming Soon"** podľa rozhodnutia používateľa.

**Scope out of session:**
- V5 content expansion — banner "Coming Soon" na landing + /games
- Real PKO Junior API integration — ostáva mock (V4.2 zo starého backlogu)
- GDPR-K re-consent flow (HIGH-10) — flag pre human legal review

---

# V3 — Mechanics & UX polish

## V3.1 CITY_TIERS replacement — "Pure City-First"

**Problém**: `lib/level.ts` obsahuje `CITY_TIERS` (jedna rastúca budova z XP Arena), kolíduje s V2 city-builder (20-slot mapa, 15 budov, `lib/city-level.ts`). Dve paralelné progression metafory.

**Design**:
- Dashboard hero = živé SVG skyline mesta (top-down 20 slotov) + `City Level X (Y/Z pts) → Next unlock: <building>`
- Nav badge = `⚡ Level 5 · Grid: +45/h` (dynamický emoji podľa grid state)
- Landing anonymous = "Top 3 największe miasta Silesia" (nie top-5 XP hráčov)
- `/o-platforme` = `LEVEL_UNLOCKS` ladder s edu-moment per level
- Vymazať: `CITY_TIERS`, `CityTier`, `tierForLevel`, `titleForLevel`
- Feature flag `v3_city_first` default `on`, fallback na V1 PlayerBuilding

**Files**: `lib/level.ts`, `lib/city-level.ts`, `components/dashboard.tsx`, `components/city-skyline-hero.tsx` (NEW), `components/city-level-card.tsx`, `app/layout.tsx`, `components/site-nav.tsx`, `app/page.tsx`, `app/o-platforme/page.tsx`, `app/games/page.tsx`, `app/api/me/route.ts`, `components/player-building.tsx` (delete/archive).

**Acceptance**:
- Dashboard rendered = skyline + city-level card, žiadna zmienka "Drewniana chata" na logged-in UI
- Nav badge = `Level X · Grid: ±Y/h`
- Landing anonymous = top-3 cities
- Test: fresh user → dashboard shows "Level 1 · Grid: +5/h" + skyline with only Domek

## V3.2 New-player onboarding — fix 2nd-building cliff

**Problém (F2 CRITICAL)**: Nový hráč dostane Domek (free). Po 1 hre (finance-quiz 80xp) má 80 coins, 0 bricks. Sklepik potrebuje 60 bricks, Mała elektrownia 80 bricks. Musí 2-3 slepé hry hľadať bricks. 2h grind pred 2. budovou.

**Design (dvojitá oprava)**:
1. **Signup starter kit**: pri register pridá `{ coins: 50, bricks: 50 }` cez `creditResources(state, "signup-gift", ...)`. Idempotent via SADD.
2. **Reorder catalog**: Sklepik na prvú non-Domek pozíciu (bricks-yielding bootstraps — postavená → produkuje coins+bricks).

**Files**: `lib/buildings.ts` (ensureSignupGift extend), `lib/building-catalog.ts` (order), `lib/player.ts` (`hasReceivedStarterKit` helper), `app/api/auth/register/route.ts` (trigger starter kit).

**Feature flag**: `v3_starter_kit` default `on`.

**Acceptance**:
- Fresh register → `resources.coins=50, bricks=50`, ledger `signup-gift` entry
- Po 1. hre → Sklepik affordable (alebo priamo postaviteľný ak starter kit dostatočný)

## V3.3 Brownout UI surface

**Problém (F4 HIGH)**: Watt deficit → po 24h 50% yield, po 48h 25%, po 72h bankruptcy grace. Hráč nemá countdown, nevie ako z toho von.

**Design**:
- `components/watt-deficit-panel.tsx` NEW — sticky banner, countdown milestones, CTAs: "Postaw Mała elektrownia" + "Vezmi rescue loan"
- `app/api/loans/rescue/route.ts` NEW — 0% APR 1-month, 150 coin, 1-per-30d dedupe
- One-time educational modal na 1st deficit enter
- 4-lang dict strings
- Feature flag `v3_brownout_panel` default `on`

**Files**: `lib/watts.ts` (expose `deficitState`), `components/watt-deficit-panel.tsx`, `app/api/loans/rescue/route.ts`, `app/layout.tsx` (conditional mount), `lib/notifications.ts` (deficit-warning type).

## V3.4 Score race condition lock

**Problém (F10 HIGH)**: POST /api/score vypočíta multBreakdown z buildings. Hráč medzi tým demolishne inú budovu → credit vs display mismatch.

**Design**: 2s exclusive lock na building mutations počas score compute.

**Files**: `lib/building-lock.ts` NEW (`acquireBuildingLock/release`), `app/api/buildings/{place,upgrade,demolish}/route.ts` (409 on lock held), `app/api/score/route.ts` (acquire + finally release).

**Client**: retry once after 500ms on 409.

**Feature flag**: `v3_score_lock` default `on`.

## V3.5 Loan payment calendar + auto-repay

**Problém (F14 HIGH)**: Player si vezme hypotéku, idle 3 dni, missed payment, credit score -5 — netuší prečo. Žiadny calendar, žiadne notifikácie, žiadny auto-repay toggle.

**Design**:
- Loan schema `autoRepay: boolean` default `true`
- `components/loan-schedule.tsx` NEW — widget: balance, next payment date/amount, progress bar, status badge, auto-repay toggle
- Notifikácie: `loan-payment-due` (T-48h), `loan-payment-missed`, `loan-paid-off`
- Feature flag `v3_loan_calendar` default `on`

**Files**: `lib/loans.ts` (autoRepay field + processLoanPayments respects flag), `components/loan-schedule.tsx` NEW, `app/api/loans/[id]/auto-repay/route.ts` NEW, `components/dashboard.tsx` (mount widget), `lib/notifications.ts` (new types).

## V3.6 Duel removal

**Problém (F8 LOW)**: `/duel` bez resources, bez city progression, bez achievement, bez season. Orphaned.

**Design**: Full removal. `git mv lib/duel.ts lib/duel.legacy.ts`. Delete routes. ADR o budúcom "Mądry Wybór" design.

**Files**: `app/duel/` delete, `app/api/duel/` delete, `components/site-nav.tsx` (remove link), `lib/locales/*.ts` (remove duel keys), `docs/decisions/NNN-duel-removal.md` NEW.

## V3.7 Loan comparison ladder

**Problém (F7 MEDIUM)**: Kredyt konsumencki 20% APR vs mortgage 8% ako "len čísla" — pedagogicky stratené.

**Design**: `/loans/compare?principal=X&term=Y` page — tabuľka všetkých eligibilných produktov sorted by totalInterest, cheapest green check, konsumencki red warning. Wire `/loans/take` prvý hit → /loans/compare force.

**Files**: `lib/loans.ts` (compareLoans), `components/loan-comparison.tsx` NEW, `app/loans/compare/page.tsx` NEW, `app/loans/take/page.tsx` (redirect).

**Feature flag**: `v3_loan_comparison` default `on`.

---

# V4 — Classroom-first pivot

**Strategický cieľ**: Watt City ako engine ktorý PKO predá školám. Target persona = **učiteľ**. Pitch demo = PKO salesperson ukáže watt-city.vercel.app riaditeľke → do 60s musí vidieť hodnotu.

## V4.1 Teacher onboarding UX — hero feature

**Problém**: Phase 3.3 teacher mode existuje ale UI-bokovka, flag-gated, žiadny narrative.

**Design**:
- **Dedicated landing** `/dla-szkol` — marketing page: "Watt City dla klas V-VIII. Gamifikowana edukacja finansowa zgodna z podstawą programową. Teacher dashboard · weekly PDF · parent digest. PKO partner-ready."
- **Teacher signup wizard** — 1-screen flow:
  - Nazwa nauczyciela + email (opcjonalne)
  - Nazwa szkoły (pre-populated list z ministry data + manual)
  - Role verify: "Jesteś nauczycielem aktywnym?" (anti-bot)
  - Output: dashboard + 30 class codes pre-generated
- **Class creation wizard** (2-step):
  - Step 1: Class name + grade (V-VIII dropdown) + subject (opcjonalne: WOS/EDB/Matematyka)
  - Step 2: Auto-gen 30 codes + preview leaderboard layout + "Got it" CTA
- **Teacher tour** (skippable, 4 steps): "Dashboard · Weekly theme · Class progress · Download report"

**Files**: `app/dla-szkol/page.tsx` NEW, `app/nauczyciel/signup/page.tsx` NEW, `app/klasa/[id]/page.tsx` (exists, polish), `components/teacher-onboarding-tour.tsx` NEW.

**Feature flag**: `v4_teacher_hero` default `on`.

## V4.2 Class dashboard hero panel

**Design**:
- Class leaderboard = top 10 kids by `cityLevel × cityValue` (weighted sort)
- Weekly theme picker = curated list z AI theme pool filtered by `podstawa programowa` tags
- Student roster table: username, cityLevel, lastActive, totalPlayed, flag icons per achievement
- Quick actions: "Download PDF report", "Mute student", "Add private note", "Invite parent"
- "Q-of-the-Week" display = current theme + "7 dní zostáva" countdown

**Files**: `components/class-dashboard.tsx` NEW, `app/klasa/[id]/page.tsx` (refactor), `lib/class.ts` (expose leaderboard + roster helpers).

## V4.3 Weekly PDF export

**Problém**: Phase 3.3.6 bolo "JSON coming" stub.

**Design**:
- `/api/klasa/[id]/report?week=YYYY-WW&format=pdf`
- Server-side render PDF (react-pdf alebo puppeteer-lite — prefer react-pdf for edge-runtime compatibility)
- PDF content:
  - Header: PKO/Watt City brand (SKIN-aware)
  - Class name + week dates
  - Student roster + XP gained this week
  - Topics covered (AI themes + evergreen games)
  - Curriculum alignment chart: which podstawa programowa codes covered
  - Top 3 performers + "Most improved"
  - Top 3 topics (by time spent)
  - 1-line summary for principal ("Class averaged 45 min/kid this week, covered Ekonomia + Oszczędzanie")
- Footer: generated date + teacher signature line

**Files**: `app/api/klasa/[id]/report/route.ts` NEW, `lib/pdf-report.ts` NEW (pdf generation), `lib/curriculum.ts` (podstawa programowa map).

**Feature flag**: `v4_pdf_export` default `on`.

## V4.4 Demo class seed endpoint

**Problém**: PKO salesperson nemôže register 30 fake students live.

**Design**:
- `POST /api/admin/seed-demo-school` (ADMIN_SECRET bearer)
- Creates:
  - 1 demo teacher account `demo-teacher-pl` (if not exists)
  - 1 demo school "Szkoła Podstawowa nr 12 — Katowice"
  - 1 demo class "V.B — Matematyka finansowa"
  - 30 demo students with realistic usernames (`Anna_K`, `Kuba_M`, etc — non-PII)
  - 4 weeks of simulated activity: score submissions, builds, loan takes/payments, distribute across players
  - Realistic distribution: 3 top (tier 5+), 10 mid (tier 3-4), 15 casual (tier 1-2), 2 inactive
  - Pre-filled Q-of-Week history (4 themes picked)
- Idempotent via SADD sentinel
- `DELETE /api/admin/seed-demo-school` teardown

**Files**: `app/api/admin/seed-demo-school/route.ts` NEW, `lib/demo-seed.ts` NEW (simulation helpers).

## V4.5 Podstawa programowa alignment

**Problém**: Phase 3.3.7 tags draft-quality. Pre školský pitch treba mapping.

**Design**:
- `lib/curriculum.ts` with `PODSTAWA_PROGRAMOWA` array — real mappings per PL school year (V-VIII):
  ```
  { code: "wos.7.3.2", area: "Ekonomia", subarea: "Kredyt", grade: 7,
    themes: ["mortgage-intro", "RRSO-basics"], games: ["budget-balance"] }
  ```
- Teacher weekly theme picker = filter by curriculum area + grade
- PDF report shows coverage chart: "Class covered: 8/12 Ekonomia codes · 4/10 Oszczędzanie codes · ..."
- Landing `/dla-szkol` includes "Zgodne z podstawą programową V-VIII MEN" badge

**Files**: `lib/curriculum.ts` NEW (mapping), `components/curriculum-chart.tsx` NEW, `app/dla-szkol/page.tsx` reference, PDF report integration.

**Initial PP coverage**: 20-30 curriculum codes covered. Scope permitting, more in V5.

## V4.6 Parent observer polish

**Problém**: Phase 3.4 parent dashboard existuje, ale UX zanedbaný.

**Design (observer-only per user decision)**:
- Parent link flow: dieťa generates 24h code v /profile → rodič enters na /rodzic/dolacz
- Parent dashboard `/rodzic`:
  - Header: "Obserwujesz: {kid username}" + "Link wygasa za {hh}h" (renewable)
  - Tiles: cityLevel, topBuildings (top 3), activeLoans count, lastWeekActivity (hours)
  - "Co się uczył w tym tygodniu" card: top 3 AI themes kid played + 1-line edu summary per
  - No actions (observer only per user decision) — just visibility
  - Privacy: kid can toggle per-item sharing (cashflow hidden, ledger hidden etc. — already in Phase 3.4.4)
- In-app "weekly digest" card (not email — SMTP deferred): "Anna_K dokončyła 12 hier, zbudowała 2 nowe budynki, nauczyła się o hipotece."

**Files**: `app/rodzic/page.tsx` polish, `app/rodzic/dolacz/page.tsx` NEW, `components/parent-digest-card.tsx` NEW.

## V4.7 School-pitch brožúra (PDF template)

**Problém**: PKO salesperson potrebuje 1-page tlačiť-to-riaditeľke.

**Design**:
- Static asset `/public/watt-city-school-pitch.pdf` (A4, PL + EN)
- Content:
  - Hero: "Watt City dla szkół — SKO 2.0 by PKO"
  - Value prop 3 boxes: engagement · learning · compliance
  - Screenshots: teacher dashboard · PDF report · student experience
  - Compliance facts: GDPR-K · UODO · KNF disclaimers · EU hosting
  - Podstawa programowa coverage stats
  - Pricing / billing: "Free during pilot · Podzielone ze sponzorem PKO"
  - CTA: email kontakt + calendly link
- Also HTML landing `/dla-szkol/materialy` downloadable
- Generated via react-pdf or manual InDesign export (for real production agent does HTML + react-pdf)

**Files**: `public/watt-city-school-pitch.pdf` (static), `app/dla-szkol/materialy/page.tsx` NEW.

## V4.8 "Content Machine" coming-soon banner

**Problém**: User explicitly said V5 content expansion = "coming soon" z komunikácie.

**Design**:
- Banner na landing `/` a na `/games`: "🚀 Content Machine — 60+ nových tém + 18 game kinds · Phase 2 Q3 2026"
- `/games` strana má "Coming Soon" tile grid s teasermi:
  - "Portfolio Pick — vyber 3 z 6 akcií, sleduj výsledok za rok"
  - "Tax Fill — vyplň PIT-37, dostať rebate"
  - "Scenario Dialog — rozhodni sa za svojho avatara"
- Informacyjná — nie funkcionálna. Manage expectations.

**Files**: `app/page.tsx` (banner), `app/games/page.tsx` (coming-soon grid), `lib/locales/*.ts` (strings).

## V4.9 (OPTIONAL) Multi-class principal view

**Problém**: Schools have 10+ classes. Principal/headmaster potrebuje aggregate view.

**Design**:
- `/dyrektor` role (new)
- Shows all classes in school, aggregate stats, top performers across classes, curriculum coverage summary
- Principal can view (not edit) any class dashboard
- Principal onboarding: "Dyrektor signup" wizard (email verify + school)

**Files**: `app/dyrektor/page.tsx` NEW, `lib/principal.ts` NEW, role flag extension.

**Scope note**: OPTIONAL — if time permits. Otherwise V5.

## V4.10 PKO skin polish for demos

**Problém**: `SKIN=pko` toggle v Phase 4.1 existuje, ale fully-branded experience je rough.

**Design**:
- Ensure PKO navy + red palette applied consistently
- Żyrafa mascot (PKO icon) appears in specific contexts:
  - Tour guide for kid onboarding
  - Weekly digest accent icon
  - Teacher dashboard corner badge
- "Powered by PKO" footer in PKO skin
- Deploy toggle: `SKIN=pko` env var → Watt City renders as SKO 2.0 branded
- Documentation in `docs/pko-demo-mode.md`

**Files**: `lib/theme.ts` (PKO_THEME polish), `components/pko-mascot.tsx` NEW, `public/pko-mascot.svg` NEW (placeholder), env var documentation.

---

# Feature flags matrix

**V3 flags** (default `on`, flip to off for emergency rollback):
- `v3_city_first` — CityLevelCard + skyline hero
- `v3_starter_kit` — signup starter 50c+50b
- `v3_brownout_panel` — deficit UI
- `v3_score_lock` — race condition fix
- `v3_loan_calendar` — loan schedule widget
- `v3_loan_comparison` — comparison ladder

**V4 flags** (default `on`, except `v4_principal` defaults `off`):
- `v4_teacher_hero` — classroom landing + wizard
- `v4_pdf_export` — weekly PDF
- `v4_demo_seed` — admin demo endpoint (always on, it's admin-gated anyway)
- `v4_parent_observer` — parent dashboard polish
- `v4_coming_soon_banner` — content machine teaser
- `v4_principal` — multi-class view (default off, enable for pilots)

---

# Sequencing

Agent shipuje v poradí:
1. **V3.1 → V3.2 → V3.3 → V3.4 → V3.5 → V3.6 → V3.7** (mechanics baseline)
2. **V4.1 → V4.2 → V4.5 → V4.3 → V4.4 → V4.6 → V4.10 → V4.8 → V4.7** (classroom ship + demos + pitch materials)
3. **V4.9** only if all above green + time remaining

---

# Acceptance gates (before human review)

1. `pnpm build` + `pnpm test` green (target 450+ tests from 368 baseline)
2. Playwright E2E full-flow green
3. Smoke test on localhost: teacher signup → class create → student register with code → play game → teacher dashboard shows progress → PDF download works
4. Demo seed endpoint: `POST /api/admin/seed-demo-school` → verify demo-teacher-pl account + class + 30 students + 4w history
5. PKO skin toggle: `SKIN=pko pnpm dev` → check WC renders as PKO-branded
6. V3 mechanics: new user → starter kit → build Sklepik in <5min → take mortgage → see calendar widget → auto-repay works

---

# Deferred to V5 (user decision: "coming soon")

- Content expansion: +20 AI themes (taxes, insurance, scam awareness, compound interest, brutto/netto, ZUS, Black Friday etc.)
- New game kinds: portfolio-pick, tax-fill, scenario-dialog, chart-read (some exist in V2 R2.1 already deferred)
- Real PKO Junior API integration (mock stays active)
- Investment deep mechanics
- Crypto/alternative asset awareness games
- Multi-market CZ/UA localization for classroom features
- Email digest for parents (SMTP infra)
- Insurance, taxes as separate game kinds
