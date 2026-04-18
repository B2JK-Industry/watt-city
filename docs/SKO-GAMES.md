# SKO — Game catalog

Inventory of every AI game **kind** + theme bucket + which resource it produces.

A "kind" is a gameplay shape (quiz, scramble, match-pairs…). A "theme" is the topical content (Earth Hour, BLIK, RRSO…). Each AI hra is a **(kind, theme, angle, difficulty)** tuple, generated daily-or-hourly. To keep the catalog rich enough that a 10-year-old plays for months without seeing the same shape twice in a week, we aim for **12+ kinds** by Phase 2.

Resource yield mapping is the educational signal: kids who like reflex games naturally build energy infrastructure; kids who like quizzes naturally build civic/cashflow buildings.

---

## 1. Kinds shipped today (Phase 0)

| Kind | Loop | Resource yield | Difficulty curve | Status |
|---|---|---|---|---|
| **quiz** | 5 multi-choice Q's, instant explanation | 🪙 coins | 5 easy → 8 hard | DONE |
| **scramble** | unscramble UPPERCASE word from hint | 🧱 bricks | 4 letters easy → 12 letters hard | DONE |
| **price-guess** | numeric estimate within tolerance | 🪟 glass | wider tolerance easy → tighter hard | DONE |
| **true-false** ⭐ | 6–12 statement sprint, isTrue + explanation | 🪙 coins (½ rate of quiz) | quick reflex bonus | DONE |
| **match-pairs** ⭐ | 4–8 concept ↔ definition pairs, click both sides | 🧱 bricks + 🪟 glass | small set easy → 8 pairs hard | DONE |
| **order** ⭐ | 4–7 items, drag ▲▼ into sequence | 🪟 glass | 4 items easy → 7 hard | DONE |

⭐ = added in tonight's session.

---

## 2. Kinds proposed for Phase 2 (~6 more, target = 12)

### kind: **memory** (concentration)
- 4×4 grid of cards, flip 2, find pairs.
- Pairs are concept ↔ icon (e.g. "Lokata" ↔ 🏦 icon).
- Resource: 🧱 bricks
- Educational: vocabulary anchoring through visual pairing.

### kind: **fill-in-blank**
- Sentence with one word missing, type it in.
- "RRSO to ____ koszt kredytu." → expect "całkowity"
- Resource: 🧱 bricks + 🪙 coins
- Educational: active recall of terminology.

### kind: **calc-sprint**
- 60s of arithmetic relevant to finance: "5% z 4500 zł = ?", "Rata kredytu 200 zł × 60 mies = ?"
- Resource: ⚡ watts (rewards reflex)
- Educational: mental math grounded in personal finance.

### kind: **portfolio-pick**
- "Masz 1000 zł i 5 lat. Wybierz 3 z 6 instrumentów."
- After choice, spec evaluates risk/return based on real PL benchmarks (NBP rates, WIG20 history).
- Resource: 🪟 glass + 🪙 coins
- Educational: portfolio theory via experience.

### kind: **budget-allocate**
- Given monthly income, drag percentages into 4 buckets (potrzeby/rozrywka/oszczędności/dług).
- Game shows month-end consequence of allocation.
- Resource: 🪙 coins + 💵 in-game zł
- Educational: 50/30/20 rule by feel. (We have this as evergreen `budget-balance` already — promote into AI rotation.)

### kind: **what-if** (scenario)
- "WIBOR rośnie o 2 pp. Twoja rata 1500 zł zmieni się o ile?"
- Numeric answer with tolerance, but with multi-step reasoning shown after.
- Resource: 🔩 steel (advanced kind)
- Educational: cause→effect chains in macro.

---

## 3. Kinds proposed for Phase 3 (long-term)

### kind: **dialog** (narrative branch)
- "Sąsiad pyta o pożyczkę 500 zł. Co odpowiesz?" → 3 branches, each with consequence.
- Resource: 🪙 coins (reputation as side effect)
- Educational: real-world money psychology (saying no to friends, family loans).

### kind: **chart-read**
- AI generates a small synthetic chart (line/bar) and asks 1 question about it: trend, peak, average.
- Resource: 🪟 glass (analytical)
- Educational: visual literacy, basic data reading.

### kind: **negotiate**
- 2-round bargaining game vs an AI counterpart over salary, used car price, rent.
- Resource: 💾 code (rare)
- Educational: anchoring, BATNA, walk-away point.

### kind: **timeline-build**
- Like `order` but with date-input precision and consequence chains.
- Resource: 🔩 steel
- Educational: history of PL macro events with cause/effect.

### kind: **invest-sim** (mini)
- 60-second auto-running market simulator: "Sell now or hold?" decision per second.
- Resource: ⚡ watts + 🪙 coins
- Educational: discipline, fear of missing out.

### kind: **tax-fill**
- Fill in PIT-37 fields based on a synthetic salary scenario.
- Resource: 💾 code (highest)
- Educational: actual tax form practice.

---

## 4. Theme buckets (orthogonal to kind)

A theme defines the content topic; the same theme can be expressed as multiple kinds. This is how we stay fresh: today Earth Hour as price-guess, next week Earth Hour as true-false, week after as order.

### Already in pool (Phase 0/1)
1. Inflacja — realna stopa procentowa
2. Earth Hour — energia
3. Pay-day Friday — 50/30/20
4. BLIK — kody, przelewy
5. IKE vs IKZE — emerytury
6. RRSO — koszt kredytu
7. ETF / akcje / obligacje — dywersyfikacja
8. Pompa ciepła vs gaz — ogrzewanie
9. Fotowoltaika + magazyn
10. Podatki — Belka, PIT
11. Hipoteka — WIBOR vs WIRON
12. Słownik giełdowy
13. Słownik krypto
14. Fundusz awaryjny
15. Ubezpieczenie zdrowotne
16. Auta elektryczne
17. Mity finansowe (Phase 1)
18. Pojęcie ↔ definicja bankowa (Phase 1)
19. Chronologia PL gospodarki (Phase 1)
20. Ranking kosztów codziennych (Phase 1)

### To add in Phase 2 (target 30 themes)
- Kupowanie pierwszego mieszkania (krok po kroku)
- Czarny piątek vs Black Friday — psychologia zakupów
- Subskrypcje — łączny miesięczny koszt (Spotify, Netflix, …)
- Dropshipping i e-commerce dla nastolatka
- Kieszonkowe — ile, jak, kiedy
- Pierwsza praca — umowa o pracę vs zlecenie vs B2B
- Studia — koszt vs alternatywy (kursy, mentor)
- Ubezpieczenie OC samochodu
- Vacation budget — wczasy w PL vs Wakacje za granicą
- ESG inwestowanie
- Real estate flip dla młodych
- Kryptowaluty — bezpieczeństwo wallet
- Apple Pay / Google Pay — jak działa
- Zbiórki charytatywne — Siepomaga, WOŚP, GoFundMe
- Pensja brutto vs netto — co zostaje
- Premia świąteczna — jak inwestować
- Pożyczka u rodziny — psychologia + ryzyko
- Karta kredytowa — limit, oprocentowanie
- Restauracja — ile to kosztuje (food cost, marża)
- Apple iPhone — ile lat zwracać się przez używanie

### Theme generation idea (Phase 3)
Have Claude itself **propose new theme candidates** weekly based on PL news (NBP rate changes, KNF guidance, market events). Reviewer (admin) approves into the pool.

---

## 5. Resource × Kind matrix (production rates)

This is the core balance sheet. Per AI hra, max yield = items × per-correct-yield.

| Kind | Items typical | Yield per correct | Max yield | Primary resource | Secondary (50%) |
|---|---:|---:|---:|---|---|
| quiz | 6 | 15 | 90 | 🪙 coins | — |
| scramble | 6 | 12 | 72 | 🧱 bricks | — |
| price-guess | 5 | 18 | 90 | 🪟 glass | 🪙 coins |
| true-false | 8 | 7 | 56 | 🪙 coins | — |
| match-pairs | 5 | 18 | 90 | 🧱 bricks | 🪟 glass |
| order | 5 | 20 | 100 | 🪟 glass | — |
| memory | 8 | 10 | 80 | 🧱 bricks | — |
| fill-in-blank | 6 | 14 | 84 | 🧱 bricks | 🪙 coins |
| calc-sprint | ~10 in 60s | 6 | 60 | ⚡ watts | — |
| portfolio-pick | 1 | 100 | 100 | 🪟 glass | 🪙 coins |
| budget-allocate | 1 | 80 | 80 | 🪙 coins | 💵 in-game zł |
| what-if | 5 | 18 | 90 | 🔩 steel | — |
| dialog | 3 | 25 | 75 | 🪙 coins | — |
| chart-read | 5 | 16 | 80 | 🪟 glass | — |
| negotiate | 1 | 100 | 100 | 💾 code | — |
| timeline-build | 6 | 14 | 84 | 🔩 steel | — |
| invest-sim | 1 | 90 | 90 | ⚡ watts | 🪙 coins |
| tax-fill | 8 | 10 | 80 | 💾 code | — |

A daily player who hits 4–5 challenges across mixed kinds gets ~300 mixed resources/day. That fuels building pace from the [SKO-VISION mechanics math](#6-loans--credit) — a tier-3 building (~500 bricks + 1500 coins) takes ~3 days of casual play to afford organically, or ~1 day if mortgage-leveraged.

---

## 6. Difficulty escalation

Every kind has 3 difficulty levels (easy / medium / hard) selected by the (theme + day-of-week) hash. This prevents grinding the same easy variant.

| Kind | Easy | Medium | Hard |
|---|---|---|---|
| quiz | 4 options w/ obvious distractors | 4 options w/ subtle traps | 4 options w/ near-equivalent traps + 2-step reasoning |
| scramble | 4–6 letter words | 7–10 letters, common vocab | 10–15 letters, technical jargon |
| price-guess | tolerance ±25% | ±15% | ±10% |
| true-false | obvious facts | needs basic finance knowledge | edge cases / common misconceptions |
| match-pairs | 4 pairs | 6 pairs | 8 pairs |
| order | 4 items, 1 obvious anchor | 5 items, balanced | 7 items, no anchors |

Higher difficulty = higher xpPer* by 25%. Compensates the kid for the harder game.

---

## 7. Implementation note: schemas

Each new kind needs:
1. Zod schema in `lib/ai-pipeline/types.ts`
2. Export from GameSpec discriminated union → `xpCapForSpec` switch case → `mergeStructure` handler
3. Sonnet prompt rule block in `generate.ts` `kindRules` map
4. Haiku translator rule (preserve numeric / boolean invariants)
5. React client in `components/games/ai-<kind>-client.tsx`
6. Branch in `app/games/ai/[id]/page.tsx`
7. New i18n keys in 4 locales for any new UI labels

Roughly 2–3 hours per kind once you've done one. The pattern is templated.

---

## 8. Live ops: what new kind unlocks WHEN

Phase 2 sequence (suggest order based on impact):

1. **memory** — broadest age appeal, easy to ship, big yield 🧱
2. **calc-sprint** — gives ⚡ watts via knowledge (currently only via reflex), fills gap
3. **fill-in-blank** — strong educational signal
4. **portfolio-pick** — first "advanced" kind, justifies 🔩 steel resource
5. **budget-allocate** — promotes the existing evergreen game into AI rotation
6. **what-if** — long-form thinking, balances quick games

Then Phase 3 in any order.

---

## 9. Quality bar

Every kind must:
- Pass real Polish player smoke test (ask kid 8–14, do they understand?)
- Have at least 5 themes already mapped (otherwise pool has too few combinations)
- Survive 100 rotations without identical content (Claude variation + angle dimension)
- Produce 4-language localized output without translator drift on numbers/booleans/PL terms

Anything below the bar gets reverted; this is more important than catalog size.
