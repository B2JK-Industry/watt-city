# Watt City — Refactor backlog

**Status**: DRAFT pre handoff vývojárovi / autonómnemu agentovi  
**Base branch**: `watt-city` @ `9a513b0` (po Phase 1-10)  
**Target branch**: `watt-city-refactor` (vytvor nový feature branch z `watt-city`)  
**Expected scope**: ~40 commitov, ~30 nových/upravených súborov, ~4-6 hodín autonómnej práce  
**Testy**: cieľ 260+ passing (zo súčasných 220)

---

## 0. Prečo tento refactor

Po Phase 1-10 audite (pozri `docs/progress/SESSION-SUMMARY-PHASE-6-10.md`) sa ukázalo že hra je mix dvoch produktov:
- **XP Arena** (skill-compete, leaderboard/XP/level/rank/duel — pôvodná hackathon submission)
- **Watt City** (finančná gramotnosť cez city-builder — SKO 2.0 pivot)

Súčasne máme:
- **3 paralelné progression čísla** (level, tier, credit score)
- **7 resources** (príliš veľa na kognitívne naloženie)
- **Double-bookkeeping**: pri dohraní hry dostaneš XP **aj** resources, ale UI ukazuje len XP
- **Duel** rozdáva len XP bez resources → feel like "playing doesn't progress my city"
- **Budovy len produkujú** (žiadne upkeep) → chýba cashflow mechanic ktorý je jadro finančnej pedagogiky
- **Dashboard vedie s XP/rank** namiesto "your city progress"

Tento refactor zjednodušuje produkt na **jedno** — financial literacy city-builder s minihrami ako zdrojom zdrojov a duelmi ako fast-decision mini-mode. Odstraňuje XP Arenu z jazyka, zachováva jej engine pod kapotou.

---

## 1. Design Principles (the north star)

1. **One game. One narrative.** Watt City je city-builder s finančnou pedagogikou. XP/level/rank sú pod-kapotové mechaniky, nie hrdinské čísla.
2. **Minihry = primárny dopamín + zdroje** (60-120s každá).
3. **Budovy = pasívny cashflow** (menší, ale kontinuálny — "prečo by som sa mal vracať").
4. **Cashflow HUD vždy viditeľný** na každej stránke — jadro finančnej pedagogiky.
5. **Duel = fast financial decision sprint** (nie math sprint) s reálnym payout-om v resources.
6. **Anti-frustration for kids** — žiadny permanent loss, vždy cesta späť, never-zero reward.
7. **Variable reward cadence** — 30s / 2min / 10min / 1h / 1d / 1w / 1mo (all covered).

---

## Phase R1 — Resource & progression collapse (foundational)

**Blokuje všetko ostatné. Ship prvé.**

### R1.1 Resource set 7 → 4

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R1.1.1 | `lib/resources.ts`: zredukovať `Resources` type na `{ coins, bricks, watts, cashZl, creditScore }` (creditScore presunuté zo state.creditScore). Odstrániť glass/steel/code | L | `Resources` type má 5 polí, existujúce kódy hádžu TypeScript errors ktoré sa fixnú v ostatných tickets |
| R1.1.2 | `lib/economy.ts` + `lib/resources.ts`: update EVERGREEN_YIELDS + AI_KIND_YIELDS aby mapovali len na 4 resources | M | Všetky hry kreditujú len zo zvereného setu; žiadna hra neyielduje glass/steel/code |
| R1.1.3 | Migration: one-shot endpoint `/api/admin/migrate-resources-v2` ktorý pre každého usera zkonvertuje glass/steel/code na coins (1:1) a vymaže tieto polia. Idempotentný cez sentinel | M | Po execute sa pre všetkých existujúcich userov zachová ich celkový "bohatstvo" (skonvertované do coins). Test: pred+po suma balances zhoduje ×1.0 |
| R1.1.4 | `components/resource-bar.tsx`: remove glass/steel/code chipy; pridať cashflow ticker (viď R2.3) | S | Nav bar ukazuje iba 4 chipy + net cashflow |
| R1.1.5 | 4-lang dict update: odstrániť `resources.glass.*`, `resources.steel.*`, `resources.code.*` stringy, doplniť `resources.cashZl.*` | S | `pnpm test` prejde, lint clean |

### R1.2 Progression — dve čísla namiesto troch

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R1.2.1 | Zmazať `lib/level.ts` export `titleForLevel` + `tierForLevel` (XP Arena artifact). Zachovať iba `levelFromXP` ale rename na `cityLevelFromBuildings` a prepočítať na základe **súčtu level-points budov / 3** (nie XP) | L | Level je funkcia budov, nie XP |
| R1.2.2 | `lib/city-level.ts` new: `cityLevelFromBuildings(buildings)` → `{level: 1-10, progressToNext: 0-1, unlocks: string[]}` | M | 1 budova L1 = 1 point, L5 = 5 points. Level = floor(sqrt(sumPoints / 3)). Max L10 pri ~300 points. |
| R1.2.3 | `lib/level.ts`: odstrániť `CITY_TIERS` array (tier names). Nahradiť `LEVEL_UNLOCKS` ktoré per-level vypisuje čo sa otvára (new building tier, new loan type, new AI game category) | M | Level up pošle notifikáciu "New buildings unlocked: Kamienica, Galeria" — pedagogický moment |
| R1.2.4 | `lib/player.ts` PlayerState: zachovať creditScore (0-100), odstrániť level (už je derived). Score ostáva persistované v leaderboarde pre "biggest city" ranking ale nie je primárny | M | PlayerState má iba: username, resources, buildings, loans, creditScore, timestamps, settings |
| R1.2.5 | `components/dashboard.tsx`: prepísať hero card na "your city" layout (viď R3.2); pôvodný "Waty łącznie" / rank nahradiť "City Level X → Y. Next unlock: Z" | L | Dashboard hero ukazuje city progress, nie XP |

### R1.3 Leaderboard premenovať

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R1.3.1 | `lib/leaderboard.ts`: ZSET `xp:leaderboard:global` sa premenuje na `xp:leaderboard:city-value` a hodnota = total building value (sum of baseCost × level per budova). Migration script | L | Leaderboard je po refactor-e "najbohatšie mestá", nie "najviac XP" |
| R1.3.2 | `app/leaderboard/page.tsx`: prepísať UI texty: "Liga miast" namiesto "Liga graczy", stĺpec "Wartość miasta" namiesto "Watty" | S | 4-lang dict aktualizovaný |
| R1.3.3 | Per-game leaderboards zachovať (už je v admin), ale teraz sú sekundárne ("best score na danú hru"), nie hero | S | Visible iba v game detail view |

---

## Phase R2 — Cashflow mechanic (the pedagogical core)

### R2.1 Building watt upkeep

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R2.1.1 | `lib/buildings.ts` BuildingCatalogEntry: pridať `wattUpkeepPerHour: number` polje. Energy budovy záporné (=produkujú), ostatné kladné | M | Domek 0, Sklepik 3, Huta 12, Mała elektrownia -20, Farma wiatrowa -80 |
| R2.1.2 | `lib/tick.ts`: cashflow tick cap energy-aware — ak **totalWattProduction < totalWattConsumption** pre viac ako 24h, non-energy budovy idú offline (stop produkovať coins/bricks). Budúcu hour-bucket zobrazia warning badge "offline — watt deficit" | L | Test: postavím 3 Huty bez elektrárne → po 24h prestávajú produkovať coins |
| R2.1.3 | UI building detail: ukázať "Watt upkeep: -5/h" vo farbe podľa znaku. Aggregate ukázať v HUD (viď R2.3) | M | Hráč vidí na každej budove čo spotrebúva |

### R2.2 Loan repayments in watts/coins

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R2.2.1 | `lib/loans.ts`: loan repayment priorita: najprv z cashZl, potom z coins (1:1 prevod). Ak ani jedno → missed payment | M | Loan engine má fallback path |
| R2.2.2 | Warning state: ak `cashflow next 7 days < nextPayment` → show amber banner "Kredit v ohrození — mesto nevyprodukuje X zł do splátky" | M | Pedagogický: "plánuj vopred" |
| R2.2.3 | Missed payment consequence: -5 credit score (existuje), ale navyše flag `latePayments:[]` aby bol historický pattern viditeľný | S | Profile page môže ukázať payment history |

### R2.3 Cashflow HUD — nová hero komponenta

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R2.3.1 | `components/cashflow-hud.tsx` nová komponenta: sticky top-right (desktop) / bottom (mobile). Ukazuje:<br/>- 💵 Balance: `X zł`<br/>- 📈 `+Y/h` (buildings income)<br/>- 📉 `-Z/h` (upkeep + loan payments)<br/>- 🟢/🟡/🔴 Net: `±W/h`<br/>- mini-sparkline 24h history | L | Vždy viditeľné keď je prihlásený user. Auto-refresh každú minútu. |
| R2.3.2 | HUD klik → open CashflowPanel modal s detailom per-building income + outflow table | M | Edukačný drill-down |
| R2.3.3 | HUD chipy (balance, net) klikateľné — otvoria príslušné sekcie (coins chip → /miasto scroll-to buildings, net chip → cashflow modal) | S | — |
| R2.3.4 | Mobile variant: kompaktný (len 2 čísla: balance + net ikona). Full panel na tap | M | Responsive pass |

---

## Phase R3 — UX city-first (frontend redesign)

### R3.1 Landing page

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R3.1.1 | `app/page.tsx`: hero sekcia prerobiť — hlavný text "Zbuduj swoje Watt City cez finančné minihry". Tagline. CTA "Graj → Zarób → Buduj". | M | Design: veľký SVG city mockup (interactive preview) vľavo, CTA blok vpravo |
| R3.1.2 | Remove "Top 5 graczy" leaderboard z landing pre anonymných. Nahradiť "Trzy największe miasta Silesia" (city-based leaderboard, top 3 cities with building preview) | M | Sociálny proof ale city-first |
| R3.1.3 | Přidať "Ako to funguje" tri-krokový vizuál: 1. Graj minihry → 2. Zbieraj zdroje → 3. Buduj mesto. Každý krok s GIF/SVG | M | Education before signup |
| R3.1.4 | Section "Finančné koncepty ktoré naučíš": credit score, mortgage, cashflow, emergency fund, compound growth — každý s 1-line explainer | M | PKO pitch value-add visible na landing |

### R3.2 Dashboard (logged-in home)

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R3.2.1 | `components/dashboard.tsx`: hero = vizuál tvojho mesta (embed CityScene interactive). Pod ním "City Level X → Y%". Credit Score ako secondary chip | L | Vizuálne: 60% stránky = mesto. 40% = stats + quick actions |
| R3.2.2 | Remove "Waty łącznie / Pozycja" a "Do następnego tieru" stats — neduplikuj city-level info | S | Menej chaos |
| R3.2.3 | Quick actions row: "Zahraj hru" (primary, purple), "Postav budovu" (cyan), "Pozdrav priateľa" (pink) | M | Tri najčastejšie akcie 1-click |
| R3.2.4 | "Co sa stalo kým si bol preč?" panel: posledných 10 ledger entries v prehľadnej forme. "+50 coins z finance-quiz, +30 coins passive, -20 coins loan payment" | M | "Retention hook" — hráč vidí že mesto žije aj keď hrá |
| R3.2.5 | Achievement lišta: progress bar "Unlock 'First mortgage' — 2/3 conditions met" | S | Cielený dopamín |

### R3.3 Navigation

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R3.3.1 | `components/site-nav.tsx`: prepísať linky. Zostávajú: `Miasto | Gry | Pojedynek | Liga | Profil`. Odstrániť: "Sala sławy" (→ zlúčiť s Liga). Premenovať: "Liga" → "Ranking" | S | Menej linkov, jasnejšie významy |
| R3.3.2 | Mobile bottom-tab nav: `🏙️ Miasto | 🎮 Gry | ⚔️ Duel | 🏆 Ranking | 👤` | M | 5 tabs = optimal mobile |
| R3.3.3 | Active tab indikátor: bottom border + accent color + haptic feedback (iOS) | S | Polished mobile feel |

### R3.4 Post-game modal

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R3.4.1 | `components/post-game-modal.tsx`: nahradiť existujúci score modal. Layout:<br/>1. **Veľký confetti + score hero** (1s animation)<br/>2. **Resource credits**: "+50 coins 🪙", "+25 bricks 🧱" (jednotlivo counter-animated, 500ms each)<br/>3. **Unlock triggers**: "🎉 New best! +bonus", "🏆 Achievement unlocked!"<br/>4. **Replay / Back buttons** | L | Hráč presne vidí čo zarobil |
| R3.4.2 | Diminishing return UI: ak to nie je prvá hra dňa, ukáž "2./3. hra dnes — 50%/25% reward". Ak prvá → "Plný reward 🔥" | M | Transparentnosť anti-grind |
| R3.4.3 | Share button: "Zdielaj svoj výsledok" → kopíruje URL + text "Práve som postavil +X v Watt City. Skús to!" | S | Viral hook |

---

## Phase R4 — Diminishing returns + daily streak

### R4.1 Per-game daily cap

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R4.1.1 | `lib/economy.ts` `capDailyYield(user, gameId, amount)`: 1. hra = ×1.0, 2. = ×0.5, 3.+ = ×0.25. Počítadlo resetne o polnoci Europe/Warsaw | M | Redis ZSET `daily:plays:<user>:<date>` tracker |
| R4.1.2 | `/api/me/daily-status` endpoint: GET vráti `{gameId: {playsToday, nextMultiplier}}` pre HUD | S | UI môže ukázať tento info v hre pred štartom |
| R4.1.3 | Visualizácia v Games list: vedľa každej hry "Dnes: 0/∞ (×1.0)" | S | Informovaný výber |

### R4.2 Streak system

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R4.2.1 | `lib/streak.ts`: daily streak counter. Hra za posledných 24h = streak++. Vynechaný deň = streak reset | M | Max 30-day streak |
| R4.2.2 | Streak milestones: 3 dní (+10% bonus), 7 dní (+20%), 14 (+30%), 30 (+50%) — applied na všetky resource credits | M | Long-tail retention |
| R4.2.3 | Streak UI: flame icon + count v nav, klik → panel s progression + "dni do dalšieho milestone" | S | Visible identity of "powrotu" |

### R4.3 AI game daily special

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R4.3.1 | `lib/ai-pipeline/publish.ts`: každá nová AI hra má flag `dailySpecial: true` prvých 60 min po reveale. Resource yield × 2 počas tohto okna | M | Reward pre early players |
| R4.3.2 | Push notification + in-app toast: "🔥 Nová AI hra! 2× zdroje kým platí" | S | Re-engagement |

---

## Phase R5 — Duel reframe (financial decisions)

### R5.1 New duel mechanic

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R5.1.1 | `lib/duel.ts`: nahradiť súčasnú skill-sprint logiku. Nové duel = 6 kôl × 10s. Každé kolo = scenár a 2 voľby. Winner = najviac správnych volieb v najrýchlejšom čase | XL | Sample scenár: "Kúpiš nový telefón za 2000 zł. Máš 500 zł na účte. Možnosti: A) Kredyt konsumencki 20% APR, B) Počkaj 2 mesiace a ušetri. Spravné: B (v lesson mode) ale A je občas správne (napr. ak telefón potrebný na prácu)." |
| R5.1.2 | `/api/duel/scenarios` generátor: Claude Sonnet generuje pool ~50 scenárov, každý s 2 voľbami a "educational rationale". Schváliť cez moderation queue (Phase 5.2) | L | Obsahová kvalita pre deti |
| R5.1.3 | Duel scoring: správna voľba = 10 pts, rýchlosť bonus max +5 pts. Winner = vyšší total | S | Transparent scoring |
| R5.1.4 | Duel payout: winner 50 coins + 50 bricks + 20 rank pts. Loser 10 coins + 10 bricks + 0 rank pts | S | Podľa R1 resource set |

### R5.2 Rank / season

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R5.2.1 | `lib/duel-rank.ts`: 4 tiers (Bronze 0-100, Silver 101-300, Gold 301-700, Platinum 701+). Reset prvým dňom mesiaca. Top Platinum v mesiaci dostane unikátnu dekoratívnu budovu | M | Monthly engagement event |
| R5.2.2 | Duel-rank view: separátny leaderboard `/duel/ranking`, nie zmiešaný s city-value ranking | M | Dve parallel kompetície — jasne oddelené |

### R5.3 Anti-grind

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R5.3.1 | Cap 3 duels/day. 4. a viac = 0 resources, iba rank pts (aby ste mohli hrať duely pre fun bez ekonomického dopadu) | S | Flexibility bez grindu |
| R5.3.2 | 1h cooldown medzi duelmi | S | — |
| R5.3.3 | AFK penalty: opustenie duela pred skončením = -20 rank pts + 1h ban na duel | M | Sportsmanship |

---

## Phase R6 — Building catalog expansion

### R6.1 Catalog redesign na 25+ budov

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R6.1.1 | `lib/buildings.ts` BUILDING_CATALOG: rozšíriť podľa matrix z design docu — 6 kategórií × 3-4 tier-spany = 25 položiek. Každá má: id, category, tier, baseCost, baseYieldPerHour, wattUpkeepPerHour, unlock, glyph, 4-lang name | XL | Full catalog file ~500 riadkov |
| R6.1.2 | Residential: Domek (T1) → Kamienica (T3) → Willa (T5) → Wieżowiec (T7) → Varso Residence (T10 landmark) | M | 5 budov |
| R6.1.3 | Industrial: Wytwórnia (T2) → Huta szkła (T3) → Fabryka (T5) → Rafineria (T7) → Katowice Industry Hub (T10) | M | 5 budov |
| R6.1.4 | Commercial: Sklepik (T1) → Galeria (T3) → Centrum (T5) → Biurowiec (T7) → Spodek Events (T10) | M | 5 budov |
| R6.1.5 | Energy: Mała elektrownia (T1) → Panele słoneczne (T2) → Farma wiatrowa (T4) → Elektrownia gazowa (T6) → Tauron Plant (T10) | M | 5 budov — všetky záporný wattUpkeep |
| R6.1.6 | Civic: Szkoła (T2) → Bank lokalny (T3) → Biblioteka (T3) → Skarbówka (T5) → Ratusz (T8) | M | 5 budov + každá unlocks niečo |
| R6.1.7 | Decorative: park, ławka, fontanna, pomnik, most | S | 5 budov, 0 yield, +city happiness (nová metric, viď R6.3) |

### R6.2 Civic unlocks (pedagogical mechanics)

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R6.2.1 | `lib/civic-unlocks.ts`: budova → feature mapping. `bank-lokalny` → preferred mortgage APR 5%. `biblioteka` → +20% yield na quiz-type hry. `szkoła` → +5% na všetky hry (base edu bonus) | M | Per-player computed ONCE keď má budovu L3+ |
| R6.2.2 | `skarbówka` → unlocks tax-fill mini-game (jedna zvláštna hra raz za mesiac). Tax refund = +500 coins ak vyplníš správne | L | Pedagogical: taxes — neobvyklý finančný koncept pre deti |
| R6.2.3 | `ratusz` (town hall, T8) → unlocks "miestna politika" — môžeš navrhnúť temu pre komunitné hlasovanie (Phase 5.5) | S | Reward pre top-tier players |
| R6.2.4 | Civic unlock UI: v building detail "Ta budowa odblokowuje: preferred mortgage, +20% quiz yield" | S | Transparent benefit |

### R6.3 City happiness (new metric)

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R6.3.1 | `lib/happiness.ts`: happiness = f(decorative buildings / total buildings, civic buildings presence, cashflow non-negative for 7 days). 0-100 scale | M | Sekundárna metrika |
| R6.3.2 | Happiness 80+ → +10% yield bonus na všetky budovy. Happiness <30 → –20% yield (kids frustration signal, cancel-able tým že postavia park) | M | Soft pressure ale fixable |
| R6.3.3 | HUD pridať happiness smajlík vedľa cashflow net | S | — |

---

## Phase R7 — Loan products + pedagogy

### R7.1 Loan catalog expansion

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R7.1.1 | `lib/loans.ts` LOAN_CONFIGS: doplniť `kredyt-konsumencki`, `kredyt-obrotowy`, `leasing`, `mortgage`, `kredyt-inwestycyjny`. Každý s max suma, APR, termín, requirements | L | 5 produktov funkčných |
| R7.1.2 | Eligibility: `kredyt-inwestycyjny` vyžaduje credit score 90+ AND civic building `bank-lokalny` L5+. Mortgage preferred rate vyžaduje bank-lokalny. Leasing vyžaduje cashflow net ≥ 10/h | M | Gated unlock pripomína IRL banking |
| R7.1.3 | Loan comparison tool `/loans/compare`: hráč zadá sumu + účel, vidí tabuľku všetkých kvalifikovaných produktov s total cost / monthly payment / breakeven | L | **Kľúčový pedagogický moment**: "konsumencki stojí 2× viac než mortgage, nejede si do zemi" |

### R7.2 KNF disclaimer v každom loan dialogu

| ID | Item | Effort |
|---|---|---|
| R7.2.1 | Každý loan modal má bottom banner: "⚠️ Ta hra pokazuje działanie kredytów. To nie jest prawdziwe doradztwo finansowe. W świecie rzeczywistym sprawdź warunki w swoim banku." | S |
| R7.2.2 | Pri kredyt-konsumencki (20% APR): special tooltip "Takýto vysoký APR sa v realite objavuje pri chwilowkach. Takéto pôžičky môžu viesť do špirály dlhov — vždy porovnávaj alternatívy" | M |

### R7.3 Bankructwo flow

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R7.3.1 | `lib/bankruptcy.ts`: 3 missed payments na ľubovoľnom aktívnom lone = bankructwo. Efekt: všetky non-Domek budovy seized, loans zrušené, credit score reset na 30 (nie 0 — aj v IRL je to fresh start) | M | Kids-friendly recovery path |
| R7.3.2 | Bankruptcy screen: "Prehral si toto mesto. Ale v reálnom svete sa dá začať znova. Tvoj Domek ostáva, credit score je 30, potrebuješ 30 dní clean platieb aby si znova mohol pôžičku" | L | Pedagogical — failure is recoverable |
| R7.3.3 | "Wykup" option: do 7 dní od seizure-u môžeš za 2× cenu budovu vrátiť. Daj na to coins + bricks bonus z posledných 5 hier | M | Escape hatch |

---

## Phase R8 — Design system & visual polish

### R8.1 Cashflow HUD visual

| ID | Item | Effort |
|---|---|---|
| R8.1.1 | Design: HUD glass-morphism karta, 320×180 desktop / 100% bottom-sheet mobile. Font: Geist Mono pre čísla, Geist Sans pre labels | M |
| R8.1.2 | Animation: číslo incrementa počítadlovo (like odometer) keď sa mení. Color flash green/red na zmene | M |
| R8.1.3 | Sparkline: 24h history sparkline v pozadí, opacity 30%, farba matching net state | S |

### R8.2 Building construction animation

| ID | Item | Effort |
|---|---|---|
| R8.2.1 | Keď postavíš budovu: crane animation 2s → "poof" particles → budova sa objaví s scale-in tweenom | M |
| R8.2.2 | Upgrade animation: budova "zatrasie" + glow + +N confetti burst | S |
| R8.2.3 | Demolish: sad "aww" sound + building fade-out + 50% refund counter tween | S |

### R8.3 Resource credit animation

| ID | Item | Effort |
|---|---|---|
| R8.3.1 | Keď dohráš hru, pri credite resources: každý chip má sequenced count-up (500ms per chip). Icon shake na novú hodnotu | M |
| R8.3.2 | Na dashboard-e ked sa zmení balance passive (cashflow tick): small "+5" floating up from coin chip | S |

### R8.4 Dopamine moments

| ID | Item | Effort |
|---|---|---|
| R8.4.1 | City Level up: full-screen takeover 3s — confetti + "LEVEL X UNLOCKED" + zoznam nových vecí. Sound. Haptic mobile | L |
| R8.4.2 | First mortgage paid off: unique animation + achievement "Zdravý cashflow manažér" + 500 coin bonus | M |
| R8.4.3 | Duel Platinum tier reached: unique building unlock + email ak je opted-in | M |
| R8.4.4 | Streak milestone (3/7/14/30): flame animation + bonus reveal | S |

### R8.5 Sound design

| ID | Item | Effort |
|---|---|---|
| R8.5.1 | Pridať subtle sounds: coin drop (credit), building click, tick, achievement. Implementácia cez Web Audio API, default MUTED, opt-in toggle v settings | M |
| R8.5.2 | Background ambient city hum pre /miasto page, very subtle, opt-out | S |

---

## Phase R9 — Migration + testing + rollout

### R9.1 Data migration

| ID | Item | Effort | Acceptance |
|---|---|---|---|
| R9.1.1 | `app/api/admin/migrate-v2/route.ts`: one-shot endpoint. Orchestruje R1.1.3 (resource collapse), R1.3.1 (leaderboard rename), wallet ledger formatting. Idempotentný cez `xp:migration:v2:sentinel` | L | Run once, verify, commit |
| R9.1.2 | Pre-migration snapshot: `/api/admin/backup-v1` ktorá zabalí celý Upstash do JSON súboru a odošle na S3/file. Dokumentovať restore path | M | Rollback safety |
| R9.1.3 | Migration test suite: setup fake user s v1 shape → run migration → assert v2 shape. 5+ edge cases | L | Not deployed without this |

### R9.2 Regression suite expansion

| ID | Item | Effort |
|---|---|---|
| R9.2.1 | E2E Playwright: register → hra → resource credit → build → watt-upkeep visible → take loan → pay loan → city level up. Full flow 1 test | L |
| R9.2.2 | Cashflow math unit tests: various building portfolios, verify net/h computation | M |
| R9.2.3 | Duel scenario unit tests: given 6 rounds + choices, verify winner determination | M |

### R9.3 Feature flags & rollout

| ID | Item | Effort |
|---|---|---|
| R9.3.1 | `lib/feature-flags.ts`: per-user flag `refactor_v2_enabled`. Default false. Admin endpoint `/api/admin/feature-flags` na flip | M |
| R9.3.2 | Dual rendering: dashboard hero má if-else V1 vs V2 počas rollout-u. Rovnaký pattern pre HUD | L |
| R9.3.3 | Rollout plan: 1. týždeň = iba admin account, 2. týždeň = test userov (marek, kasia, alicja), 3. týždeň = 50% nových userov, 4. týždeň = 100% | S | Docs only |
| R9.3.4 | Sunset V1: po 4 týždňoch feature flag zmaž, V1 kód odstrániť | M |

---

## Acceptance gates (before merge to watt-city)

1. `pnpm build` + `pnpm test` (cieľ 260+ passing) green
2. Playwright E2E full flow green
3. Manuálny smoke test `docs/SMOKE-TEST-V2.md` (nutné vytvoriť) green na 3 zariadeniach (desktop, mobile chrome, mobile safari)
4. Migration test na snapshot-ovaný production dataset (anonymizovaný) green
5. Review docu `docs/decisions/NNN-refactor-v2.md` — rozhodnutia architektonické
6. Vizuálne review — minimálne 10 screenshotov pre Figma / dizajnový preview (dashboard, landing, miasto s HUD, post-game modal, duel, loan compare)

---

## Nový súbor do repa na committnutie

Keď schválim tento backlog, treba:
1. Skopírovať ho do `docs/REFACTOR-V2-BACKLOG.md`
2. Commit na `watt-city` branch ako `docs(refactor): V2 refactor backlog — consistent game narrative + cashflow pedagogika`
3. Vytvoriť `watt-city-refactor` branch z tipu a začať prácu

## Prompt pre agenta (handoff)

Po schválení napíšem samostatný `AGENT-PROMPT-REFACTOR-V2.txt` ktorý:
- Hard constraint: NEVER break Phase 1-10 surface na `watt-city`
- Hard constraint: kadidá zmena cez feature flag, nie direct replacement
- Commit format: `feat(refactor): R{phase}.{item} — short`
- Phase R1 → R2 → R3 → R4 → R5 → R6 → R7 → R8 → R9 in order
- Stop condition: všetky phases ≥80% DONE + acceptance gates passed
