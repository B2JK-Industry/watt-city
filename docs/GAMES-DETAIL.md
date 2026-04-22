# Watt City — Game kinds: full per-kind specification

Implementation-grade detail for every game kind. For each: zod schema, Sonnet prompt template, Haiku translator rules, React client contract, scoring algorithm, edge cases, fixture example.

**Status 2026-04-22** — verified against `lib/ai-pipeline/types.ts`, `lib/games.ts`, `lib/content/*.ts`:
- **Shipped AI kinds** (zod discriminator in `GameSpecSchema`): `quiz`, `scramble`, `price-guess`, `true-false`, `match-pairs`, `order`, `memory`, `fill-in-blank`, `calc-sprint`, `budget-allocate`, `what-if`, `chart-read` — 12 total.
- **Coming soon** (`lib/coming-soon.ts` advertises but no runtime yet): `portfolio-pick`, `tax-fill`, `scenario-dialog`, `timeline-build`, `negotiate`, `invest-sim`.
- **Evergreen (hand-authored) games** in `lib/content/`: `finance-quiz`, `word-scramble`, `memory-pairs`, `power-flip`, `budget-balance` (+ 4 more defined in `lib/games.ts`: `energy-dash`, `stock-tap`, `math-sprint`, `currency-rush` — their content lives inside their client components, not `lib/content/`). Total = 9 evergreen games, matching the landing-page hero copy.
- Sections 12-18 below are design sketches. §12 `what-if` and §14 `chart-read` both have shipped zod schemas (`lib/ai-pipeline/types.ts`) + React clients (`components/games/ai-whatif-client.tsx`, `components/games/ai-chartread-client.tsx`). §13 `dialog`, §15–§18 still design-only.

## Common contract — every kind

### Discriminated union member

```ts
{
  kind: "<kind-name>",     // discriminator
  xpPerCorrect: number,    // base yield per correct
  // …kind-specific fields
}
```

### Yield calculation (universal)

```
totalYieldPerPlay = correctCount × xpPerCorrect
                 × difficultyMultiplier
                 × cityMultipliers
                 × kindMultipliers
                 × liveBonus     (if LIVE AI hra)
                 × streakBonus   (1.0 to 1.25)
```

Always capped at `maxYieldPerKind` (configurable per kind, default = `itemCount × xpPerCorrect × 1.25`).

### React client interface

```ts
type AiClientProps<TSpec> = {
  gameId: string;       // e.g. "ai-tdpfmq"
  spec: TSpec;          // kind-specific
  dict: Dict;           // i18n bundle
};

// Called when player completes the game
function submitFinalScore(xp: number) {
  await submitScore(gameId, xp);
}
```

### Translator invariants (universal)

Every translator call locks these from PL:
- `kind` literal
- `xpPerCorrect`
- All numeric fields
- All boolean fields
- All structural array indices

Translator only changes:
- Free-text strings (prompt, options text, hint, label, etc.)
- Kind-specific natural-language fields

---

## 1. quiz — multiple choice

### Schema

```ts
const QuizItemSchema = z.object({
  prompt: z.string().min(10).max(240),
  options: z.array(z.string().min(1).max(140)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(400),
});

const QuizSpecSchema = z.object({
  kind: z.literal("quiz"),
  items: z.array(QuizItemSchema).min(5).max(8),
  xpPerCorrect: z.number().int().min(5).max(40),
});
```

### Sonnet prompt rules

```
You are producing a QUIZ spec — multiple-choice questions.
- 5–8 items, each with 4 options, exactly one correct (correctIndex 0..3).
- Options must be parallel in structure.
- No "all of the above" / "none of the above" / joke answers.
- correctIndex distribution: aim for roughly equal across 0..3.
- explanation: 20–60 words, one concrete teaching takeaway in Polish.
```

### Haiku translator rules

- Translate `prompt`, each `options[i]`, `explanation`
- Lock `correctIndex` (never reorder options)
- Keep PL terminology (BLIK, NBP, RRSO, IKE) untranslated

### Scoring

```
correctCount = items.filter(i => answeredIndex[i] === items[i].correctIndex).length
yield        = correctCount × xpPerCorrect
```

### Edge cases

- Player skips question → counted as wrong (correctCount excludes)
- Player runs out of time (no per-quiz timer in MVP, future) → submitted state shows what answered
- Translator returns 3 or 5 options → mergeStructure rejects, falls back to PL spec for that lang

### Fixture

```json
{
  "kind": "quiz",
  "xpPerCorrect": 15,
  "items": [
    {
      "prompt": "Ile wynosi RRSO przy oprocentowaniu nominalnym 8% i prowizji 5%?",
      "options": ["8%", "8.5%", "13%", "16%"],
      "correctIndex": 2,
      "explanation": "RRSO uwzględnia odsetki + opłaty rozłożone na okres kredytu. 8% odsetek + ~5% prowizji = ~13% RRSO."
    }
    // … 4–7 more
  ]
}
```

---

## 2. scramble — unscramble word

### Schema

```ts
const ScrambleItemSchema = z.object({
  word: z.string().min(4).max(20),     // UPPERCASE expected
  hint: z.string().min(6).max(200),
});

const ScrambleSpecSchema = z.object({
  kind: z.literal("scramble"),
  words: z.array(ScrambleItemSchema).min(5).max(10),
  xpPerWord: z.number().int().min(5).max(30),
});
```

### Sonnet prompt rules

```
Schema: {kind:'scramble', xpPerWord:int 5–30, words:[{word (UPPERCASE 4–20 letters), hint}] × 5–10}.
- Polish diacritics OK: ĄĆĘŁŃÓŚŹŻ.
- Avoid proper nouns whose scrambled form could accidentally have only one solution.
- Hint: 6–200 chars, a short Polish clue pointing at the concept.
- All words UPPERCASE. No spaces in word.
```

### Haiku translator rules (CRITICAL — different from other kinds)

- The `word` field IS translated to a target-language equivalent
- Maintains UPPERCASE + 4–20 letters constraint
- E.g. PL `INFLACJA` → CS `INFLACE` / EN `INFLATION` / UK `ІНФЛЯЦІЯ`
- The HINT translates normally (preserves concept)

### Client behaviour

- Client `useMemo` shuffles `word` at game start (so display = scrambled, target = original)
- Player types answer; on submit, `normalize(answer) === word.toUpperCase()` checks
- Skip allowed (counted as wrong)

### Scoring

```
correctCount = round.filter(r => r.solved).length
yield        = correctCount × xpPerWord
```

### Edge cases

- Translator returns lowercase or mixed case → `mergeStructure` UPPERCASEs
- Translator returns < 4 letters → fall back to PL word
- Polish diacritics in input vs target → `normalize()` strips diacritics for comparison? **Decision: NO — keep strict** to teach correct spelling

### Fixture

```json
{
  "kind": "scramble",
  "xpPerWord": 12,
  "words": [
    { "word": "BLIK", "hint": "6-cyfrowy jednorazowy kod do płatności" },
    { "word": "PRZELEW", "hint": "Operacja przesyłania pieniędzy między kontami" }
  ]
}
```

---

## 3. price-guess — numeric estimation

### Schema

```ts
const PriceGuessItemSchema = z.object({
  prompt: z.string().min(8).max(200),
  truth: z.number(),
  unit: z.string().min(1).max(20),
  tolerancePct: z.number().min(0.01).max(0.5),
});

const PriceGuessSpecSchema = z.object({
  kind: z.literal("price-guess"),
  items: z.array(PriceGuessItemSchema).min(5).max(10),
  xpPerCorrect: z.number().int().min(5).max(30),
});
```

### Sonnet prompt rules

```
Schema: {kind:'price-guess', xpPerCorrect, items:[{prompt, truth:number, unit:string, tolerancePct}] × 5–10}.
- truth must be unambiguous and grounded in 2025–2026 PL reality.
- tolerancePct rewards ballpark reasoning (0.10–0.25 typical).
- unit: short symbol (zł, kWh, %, zł/kWh, zł/mies).
```

### Haiku translator rules

- Translate `prompt` only
- LOCK from PL: `truth`, `unit`, `tolerancePct`
- DO NOT change "polskie" → "czeskie" (country reference stays Polish)

### Client behaviour

- Number input field; Enter to submit
- After submit, show truth value + delta
- 5–10 items rendered serially

### Scoring

```
isCorrect(item) = abs(answer - item.truth) <= item.truth × item.tolerancePct
correctCount   = items.filter(isCorrect).length
yield          = correctCount × xpPerCorrect
```

### Edge cases

- Player enters 0 or negative → counted as wrong
- Player enters non-numeric → input rejected client-side
- truth is 0 (rare): tolerance becomes 0 absolute → strict equality required

### Fixture

```json
{
  "kind": "price-guess",
  "xpPerCorrect": 18,
  "items": [
    {
      "prompt": "Ile kWh zużywa przeciętne polskie gospodarstwo domowe w ciągu jednej godziny?",
      "truth": 0.4,
      "unit": "kWh",
      "tolerancePct": 0.30
    }
  ]
}
```

---

## 4. true-false — sprint of yes/no statements

### Schema

```ts
const TrueFalseItemSchema = z.object({
  statement: z.string().min(8).max(200),
  isTrue: z.boolean(),
  explanation: z.string().min(10).max(300),
});

const TrueFalseSpecSchema = z.object({
  kind: z.literal("true-false"),
  items: z.array(TrueFalseItemSchema).min(6).max(12),
  xpPerCorrect: z.number().int().min(5).max(20),
});
```

### Sonnet prompt rules

```
- 6–12 statements, each declarative (8–25 words).
- Roughly half TRUE, half FALSE; mix in random order.
- A claim is TRUE only if a Polish regulator/source (NBP, KNF, GUS, MF, Tauron, PKO) would confirm in 2025–2026.
- explanation: 1 short sentence in Polish, citing the rule that decides truth.
```

### Haiku translator rules

- Translate `statement`, `explanation`
- LOCK `isTrue` (boolean truth, never invert)
- LOCK structural order (item[i] in PL ↔ item[i] in target lang)

### Client behaviour

- Show statement; PRAVDA/FALSZ buttons
- After click, reveal correctness + explanation
- Next button to advance

### Scoring

```
correctCount = items.filter(i => answeredBool[i] === items[i].isTrue).length
yield        = correctCount × xpPerCorrect
```

### Edge cases

- Translator drops a punctuation that changes meaning → mergeStructure can't catch this; rely on Sonnet's own truth-checking
- isTrue translates to wrong language ("PRAVDA" vs "TRUE" string) — N/A, isTrue is boolean

### Fixture

```json
{
  "kind": "true-false",
  "xpPerCorrect": 7,
  "items": [
    {
      "statement": "Lokata terminowa w polskim banku jest zawsze objęta gwarancją BFG do 100 000 euro.",
      "isTrue": true,
      "explanation": "BFG (Bankowy Fundusz Gwarancyjny) gwarantuje wkłady do 100 tys. EUR per bank per deponent."
    }
  ]
}
```

---

## 5. match-pairs — concept ↔ definition

### Schema

```ts
const MatchPairSchema = z.object({
  left: z.string().min(2).max(60),
  right: z.string().min(2).max(140),
});

const MatchPairsSpecSchema = z.object({
  kind: z.literal("match-pairs"),
  pairs: z.array(MatchPairSchema).min(4).max(8),
  xpPerMatch: z.number().int().min(5).max(30),
  leftLabel: z.string().min(1).max(40),
  rightLabel: z.string().min(1).max(40),
});
```

### Sonnet prompt rules

```
- 4–8 pairs of (concept, definition).
- left: 2–4 words (often Polish-specific term).
- right: 8–20 words, definition.
- leftLabel/rightLabel: Polish category names (e.g. "Pojęcie" / "Definicja", "Skrót" / "Pełna nazwa").
- Every left ↔ right is unique; no two terms share the same definition.
```

### Haiku translator rules

- Translate left, right, leftLabel, rightLabel
- LOCK pair INDEX mapping: pairs[i] in PL ↔ pairs[i] in target lang

### Client behaviour

- Two columns; left items in fixed order, right items shuffled
- Click a left → highlights; click a right → matches
- Wrong match: brief red flash, both selections clear
- Correct match: both items lock with green check

### Scoring

```
matchedCount = pairs.filter(matched).length
wrongs       = totalTries - matchedCount
yield        = max(0, matchedCount × xpPerMatch - floor(wrongs × xpPerMatch / 4))
```

### Edge cases

- Player tries every combination by guess → wrongs penalty caps yield to ~0
- Translator collapses two distinct definitions to same string → mergeStructure can't catch; rely on Sonnet uniqueness rule
- Player abandons mid-game → no submission, no yield

### Fixture

```json
{
  "kind": "match-pairs",
  "xpPerMatch": 18,
  "leftLabel": "Pojęcie",
  "rightLabel": "Definicja",
  "pairs": [
    { "left": "RRSO", "right": "Rzeczywista roczna stopa oprocentowania — koszt kredytu z opłatami." },
    { "left": "BLIK", "right": "6-cyfrowy jednorazowy kod do płatności i wypłat." },
    { "left": "IKE", "right": "Indywidualne konto emerytalne — wpłaty bez podatku Belki po 60. roku życia." },
    { "left": "WIBOR", "right": "Stawka, po której polskie banki pożyczają sobie nawzajem; bazowa dla kredytów hipotecznych." }
  ]
}
```

---

## 6. order — sort items in sequence

### Schema

```ts
const OrderItemSchema = z.object({
  label: z.string().min(2).max(80),
  rank: z.number().int().min(1).max(20),     // 1..N, unique per item
  hint: z.string().max(160).optional(),
});

const OrderSpecSchema = z.object({
  kind: z.literal("order"),
  prompt: z.string().min(8).max(200),
  direction: z.enum(["ascending", "descending"]),
  items: z.array(OrderItemSchema).min(4).max(7),
  xpPerCorrect: z.number().int().min(10).max(40),
});
```

### Sonnet prompt rules

```
- 4–7 items to sort.
- prompt: instruction (e.g. "Uporządkuj wydarzenia chronologicznie, najstarsze pierwsze").
- rank: integer 1..N, unique per item (1 = first per direction).
- direction: 'ascending' = lower rank shown first; 'descending' = higher rank first.
- label: 2–8 words; hint: optional clue (year, value).
```

### Haiku translator rules

- Translate `prompt`, `label`, `hint`
- LOCK `rank` (integer ordering)
- LOCK `direction`

### Client behaviour

- Items rendered as a vertical list; each has ▲/▼ buttons to move
- Initial order: shuffled
- "Submit" button checks final order against truth
- After submit, show correct positions

### Scoring (per-position)

```
correctPositions = sequence.filter((item, i) => item.label === sortedTruth[i].label).length
yield            = min(maxYield, correctPositions × xpPerCorrect)
```

### Edge cases

- Player submits unchanged shuffled order → likely 0 or 1 correct (random)
- Translator changes label that breaks ordering equality → mergeStructure compares by label, so label translation must be deterministic per index

### Fixture

```json
{
  "kind": "order",
  "xpPerCorrect": 20,
  "prompt": "Uporządkuj wydarzenia w polskiej gospodarce chronologicznie, najstarsze pierwsze.",
  "direction": "ascending",
  "items": [
    { "label": "Wprowadzenie złotego po denominacji", "rank": 1, "hint": "1995" },
    { "label": "Wstąpienie Polski do UE", "rank": 2, "hint": "2004" },
    { "label": "Globalny kryzys finansowy", "rank": 3, "hint": "2008" },
    { "label": "Wprowadzenie BLIK-a", "rank": 4, "hint": "2015" },
    { "label": "Pandemia COVID-19", "rank": 5, "hint": "2020" }
  ]
}
```

---

## 7. memory — concentration (Phase 2)

### Schema (proposed)

```ts
const MemoryPairSchema = z.object({
  concept: z.string().min(2).max(40),
  pair: z.string().min(2).max(40),     // could be icon emoji or short text
});

const MemorySpecSchema = z.object({
  kind: z.literal("memory"),
  pairs: z.array(MemoryPairSchema).min(6).max(8),
  xpPerCorrect: z.number().int().min(8).max(15),
  timeBonus: z.boolean().default(true), // award extra for fast finish
});
```

### Sonnet prompt rules

```
- 6–8 concept ↔ pair items.
- "pair" can be an emoji icon OR a 1-word identifier.
- concept: 2–4 words, finance/energy term.
```

### Haiku translator rules

- Translate `concept`
- Keep `pair` if emoji; if text, translate

### Client behaviour

- 4×4 grid (8 pairs, 16 cards) or 4×3 (6 pairs, 12 cards)
- Click card → flips
- Click second → if match, both stay flipped + green; if not, flip back after 800ms

### Scoring

```
yield = pairs.length × xpPerCorrect
       + (timeBonus ? floor((300_000 - elapsedMs) / 1000) × 0.1 : 0)
```

### Edge cases

- Player gives up mid-game → no submission, no yield
- Multi-tap rapid clicks → debounce client-side

---

## 8. fill-in-blank (Phase 2)

### Schema (proposed)

```ts
const FillItemSchema = z.object({
  sentence: z.string().min(10).max(200),     // contains "{{}}" placeholder
  answer: z.string().min(2).max(40),
  acceptable: z.array(z.string()).max(5),    // alternative correct spellings
  hint: z.string().max(120).optional(),
});

const FillInBlankSpecSchema = z.object({
  kind: z.literal("fill-in-blank"),
  items: z.array(FillItemSchema).min(5).max(8),
  xpPerCorrect: z.number().int().min(10).max(20),
});
```

### Sonnet prompt rules

```
- 5–8 sentences each with one missing word, marked by "{{}}" placeholder.
- answer: the canonical missing word.
- acceptable: 0–5 alternative spellings/forms (e.g. plural variants).
- hint: optional clue.
```

### Haiku translator rules

- Translate sentence (preserving "{{}}" placeholder)
- Translate answer + acceptable list
- Translate hint

### Scoring

```
isCorrect(item, input) = normalize(input) ∈ {item.answer, ...item.acceptable}.map(normalize)
correctCount         = items.filter(isCorrect).length
yield                = correctCount × xpPerCorrect
```

normalize = lowercase, strip diacritics, trim.

### Edge cases

- Player types correct word with extra spaces → normalize handles
- Player types in wrong case → normalize handles
- Player types similar word ("inflację" vs "inflacja") → must be in `acceptable` list

---

## 9. calc-sprint (Phase 2)

### Schema (proposed)

```ts
const CalcSpecSchema = z.object({
  kind: z.literal("calc-sprint"),
  durationSeconds: z.number().int().min(30).max(120),
  // problems generated dynamically client-side from a generator config:
  generatorConfig: z.object({
    operations: z.array(z.enum(["add", "sub", "mul", "div", "percent"])),
    range: z.tuple([z.number(), z.number()]),
    decimalPlaces: z.number().int().max(2),
  }),
  context: z.string().max(120),  // theme: "kalkulator finansowy", "podstawy procentów"
  xpPerCorrect: z.number().int().min(3).max(10),
});
```

### Sonnet prompt rules

```
- Configures a calc generator, doesn't list specific problems (those are runtime-generated).
- generatorConfig: which operations to use, value range, decimals.
- context: short theme line shown above the calculator.
```

### Client behaviour

- Server returns config; client generates 1 problem at a time
- 60s timer; player types answer + Enter
- Streak combo bonus

### Scoring

```
yield = correctAnswers × xpPerCorrect
       + (longestStreak ≥ 5 ? 10 : 0)
       + (longestStreak ≥ 10 ? 30 : 0)
```

---

## 10. portfolio-pick (Phase 2)

### Schema (proposed)

```ts
const PortfolioOptionSchema = z.object({
  name: z.string().min(2).max(40),       // "ETF S&P 500", "Lokata 5Y", "Mieszkanie"
  type: z.string().min(2).max(40),
  expectedReturn: z.number(),            // realistic annual % (signed; allows negative for cash inflation)
  riskScore: z.number().min(0).max(10),
  description: z.string().max(140),
});

const PortfolioPickSpecSchema = z.object({
  kind: z.literal("portfolio-pick"),
  prompt: z.string().min(8).max(200),    // "Masz 1000 zł i 5 lat. Wybierz 3 z 6 instrumentów."
  options: z.array(PortfolioOptionSchema).min(5).max(8),
  pickCount: z.number().int().min(2).max(4),  // how many to pick
  initialCapital: z.number().positive(),
  horizonYears: z.number().int().min(1).max(20),
  xpPerCorrect: z.number().int().min(20).max(100),
});
```

### Sonnet prompt rules

```
- 5–8 options, each with realistic 2025 PL return + risk.
- pickCount = how many user must pick (typically 3 of 6).
- After user picks, evaluate using a simple Monte-Carlo (server) or expected-value calc (client).
- "Best" pick = highest expected return weighted by risk preference (assume balanced portfolio = 0.5).
```

### Client behaviour

- Show grid of options with risk/return chart
- User picks N
- Reveal "performance" summary: hypothetical year-N value
- Score = how close to optimal pick (Spearman correlation)

### Scoring

```
optimalSet  = top-N by expected return × (1 + riskTolerance × normalizedRisk)
overlapCount = userPicks ∩ optimalSet
yield       = overlapCount * (xpPerCorrect / pickCount)
```

---

## 11. budget-allocate (Phase 2)

### Schema (proposed; promotes existing evergreen game)

```ts
const BudgetCategorySchema = z.object({
  id: z.string().min(2).max(20),       // "needs", "wants", "savings", "debt"
  label: z.string().min(2).max(40),    // "Potrzeby"
  hint: z.string().max(140),
  recommendedMin: z.number().min(0).max(100),
  recommendedMax: z.number().min(0).max(100),
  emoji: z.string().max(4),
});

const BudgetAllocateSpecSchema = z.object({
  kind: z.literal("budget-allocate"),
  scenario: z.object({
    persona: z.string().min(8).max(200),
    monthlyIncome: z.number().positive(),
    currency: z.string().max(8),
    localeTag: z.string().max(10),
  }),
  categories: z.array(BudgetCategorySchema).length(4),
  xpPerCorrect: z.number().int().min(60).max(160),  // total max yield
});
```

### Scoring

Uses the same fitScore curve as existing evergreen budget-balance: how close to recommended band each category is. Average × xpPerCorrect.

---

## 12–18. Other Phase 3 kinds (sketches)

Include schemas, prompt outlines, scoring formulas in the same template.

### 12. what-if (scenario chain reasoning)
- Schema: `prompt`, `chain` of {step, expectedAnswer, explanation} × 3–5
- Player walks through a scenario step by step

### 13. dialog (branching narrative)
- Schema: `branches` (tree structure), `outcomes` per leaf
- Player makes choices; outcome determines yield

### 14. chart-read (visual literacy)
- Schema: `chartConfig` + `questions` × 3–5
- Server generates SVG chart; player answers

### 15. negotiate (bargain mini-game)
- Schema: `target`, `aiCounterOffer` config
- 2-round bargaining with an AI counterpart (server-side state)

### 16. timeline-build (date precision)
- Like order, but date input precision required

### 17. invest-sim (live market sim)
- 60s auto-running mock market with sell/hold buttons

### 18. tax-fill (form practice)
- Renders simplified PIT-37 form; user fills fields; auto-graded

Each requires its own full spec (~150 lines). Stub here, fully-fleshed when actually shipping.

---

## Per-kind difficulty escalation table

| Kind | Easy | Medium | Hard |
|---|---|---|---|
| quiz | 4 options w/ obvious distractors | subtle traps | near-equivalent traps + 2-step reasoning |
| scramble | 4–6 letter words | 7–10 letters, common vocab | 10–15 letters, technical jargon |
| price-guess | tolerance ±25% | ±15% | ±10% |
| true-false | obvious facts | needs basic knowledge | edge cases / common misconceptions |
| match-pairs | 4 pairs | 6 pairs | 8 pairs |
| order | 4 items, 1 obvious anchor | 5 items, balanced | 7 items, no anchors |
| memory | 6 pairs, 4×3 grid | 7 pairs, 4×4 grid | 8 pairs, 4×4 grid + flipped icons |
| fill-in-blank | 5 items, common words | 6, technical jargon | 8, including spelling traps |
| calc-sprint | add/sub only, range 1-100 | + mul/div, range 1-1000 | + percent, range 1-10000, decimals |
| portfolio-pick | 5 options, pick 3 | 6 options, pick 3 | 8 options, pick 4 |

Higher difficulty = +25% xpPer*. Compensates the kid for the harder game.

---

## Adding a new kind — checklist

When implementing a new game kind, the following must all be done:

1. [ ] Add zod schema in `lib/ai-pipeline/types.ts`
2. [ ] Export from `GameSpecSchema` discriminated union
3. [ ] Add `xpCapForSpec` switch case
4. [ ] Add `mergeStructure` handler that locks numeric/boolean invariants from PL
5. [ ] Add Sonnet prompt rule block in `generate.ts` `kindRules` map
6. [ ] Add Haiku translator rule (preserve invariants)
7. [ ] Add `schemaForKind` switch case
8. [ ] Create React client at `components/games/ai-<kind>-client.tsx`
9. [ ] Wire client into renderer `app/games/ai/[id]/page.tsx`
10. [ ] Add new dict keys for any UI labels (4 langs)
11. [ ] Add 1+ themes using this kind to `lib/ai-pipeline/research.ts`
12. [ ] Add fixture spec in `FALLBACK_SPECS` of `generate.ts`
13. [ ] Document in this file (full template)
14. [ ] Add unit test for `mergeStructure` invariants
15. [ ] Add E2E test playing through one round end-to-end
16. [ ] Update `docs/SKO-GAMES.md` matrix table
17. [ ] Update README "kinds" list
18. [ ] Smoke test on prod after deploy

Estimated effort: **2–4 hours per kind** once the template is internalized.

---

## Quality bar (every kind must pass)

- ✅ Generates valid spec on first try in 80%+ runs (Claude eval)
- ✅ Numbers/booleans never drift in translation (mergeStructure enforced)
- ✅ Polish proper nouns preserved (BLIK, NBP, RRSO, etc.)
- ✅ Country reference stays "polski" — never localized to "czeski"/"english" household
- ✅ Mobile playable (touch targets ≥ 44px)
- ✅ Keyboard playable (Tab, Enter, arrow keys)
- ✅ Screen-reader announces game state changes
- ✅ < 50ms client-side response to user input

Anything below the bar gets reverted; better to have 6 great kinds than 12 mediocre ones.

---

## Test fixtures location

All fixture specs (one per kind) live at `tests/fixtures/ai-game-<kind>.json`. Used by:
- Unit tests for `mergeStructure`
- Mock Claude responses in E2E tests
- Local dev when no `ANTHROPIC_API_KEY` (mock-v1 path)
