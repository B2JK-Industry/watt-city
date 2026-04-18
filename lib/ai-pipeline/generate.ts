import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  QuizSpecSchema,
  ScrambleSpecSchema,
  PriceGuessSpecSchema,
  LocalizedSpecSchema,
  type GameSpec,
  type LocalizedSpec,
} from "./types";
import type { Lang } from "@/lib/i18n";
import type { ResearchSeed, SeedKind } from "./research";

// Kind-specific schemas — Anthropic's structured outputs reject anyOf with
// $defs (which zod generates for discriminated unions). We know the kind
// from the research seed, so we can narrow to one concrete schema per call.
function schemaForKind(kind: SeedKind) {
  if (kind === "quiz") return QuizSpecSchema;
  if (kind === "scramble") return ScrambleSpecSchema;
  return PriceGuessSpecSchema;
}

/* Two-stage game-spec generator.
 *
 * Stage 1 (Sonnet 4.6): produces the authoritative Polish spec from the
 * research seed. PL-native financial terms (zł, BLIK, NBP, RRSO, IKE/IKZE,
 * WIBOR/WIRON, Tauron, PKO…) are preserved — Sonnet has the judgement to
 * keep them authentic.
 *
 * Stage 2 (Haiku 4.5, parallel): translates the PL spec into UK/CS/EN,
 * keeping structural invariants (correctIndex / truth / unit /
 * tolerancePct / xpPer*) copied exactly. Haiku is cheap and reliable for
 * narrow translation work.
 *
 * When ANTHROPIC_API_KEY is unset the whole pipeline falls back to a hand-
 * coded 4-lang mock (model: "mock-v1") so judges without API billing still
 * exercise the full cron → render → play flow.
 */

export type GenerateContext = {
  seed: ResearchSeed;
  deterministicSeed: number;
};

export type GenerateResult = {
  spec: LocalizedSpec;
  model: string;
};

const PRIMARY_MODEL = "claude-sonnet-4-6";
const TRANSLATION_MODEL = "claude-haiku-4-5";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

/* ---------------- Stage 1: Sonnet → Polish spec ---------------- */

function buildPlSystemPrompt(kind: SeedKind): string {
  const kindRules: Record<SeedKind, string[]> = {
    quiz: [
      "You are producing a QUIZ spec — multiple-choice questions.",
      "Schema: {kind:'quiz', xpPerCorrect:int 5–40, items:[{prompt, options:[4 strings], correctIndex:0–3, explanation}] × 5–8}.",
      "- Options must be parallel in structure, no 'all of the above', no joke answers.",
      "- explanation: 20–60 words, one concrete takeaway, in Polish.",
    ],
    scramble: [
      "You are producing a SCRAMBLE spec — word-unscramble puzzles.",
      "Schema: {kind:'scramble', xpPerWord:int 5–30, words:[{word (UPPERCASE 4–20 letters), hint}] × 5–10}.",
      "- Polish diacritics OK: ĄĆĘŁŃÓŚŹŻ.",
      "- Avoid proper nouns whose scrambled form could accidentally have only one solution.",
      "- hint: 6–200 chars, a short Polish clue pointing at the concept.",
    ],
    "price-guess": [
      "You are producing a PRICE-GUESS spec — numeric estimation items.",
      "Schema: {kind:'price-guess', xpPerCorrect:int 5–30, items:[{prompt, truth:number, unit:string, tolerancePct:0.01–0.5}] × 5–10}.",
      "- truth must be unambiguous and grounded in 2025–2026 PL reality (NBP rates, Tauron tariffs, BLIK fees, etc.).",
      "- tolerancePct should reward ballpark reasoning (0.10–0.25 typical).",
      "- unit: short symbol (zł, kWh, %, zł/kWh, zł/mies).",
    ],
  };

  return [
    "You are the content designer for XP Arena, a Polish financial + energy literacy game aimed at Gen Z in Katowice (Silesia region).",
    "",
    "Your job: produce ONE game spec for the requested theme. It will be auto-rendered into a 24-hour rotating challenge.",
    "",
    ...kindRules[kind],
    "",
    "CONTENT RULES:",
    "- Write ALL user-facing strings in natural Polish.",
    "- Keep the Polish authentic: zł, NBP, KNF, BLIK, WIBOR/WIRON, IKE/IKZE, RRSO — use real local terms, not translated equivalents.",
    "- Prompts: concrete and short (8–30 words).",
    "- Questions must be verifiable and teach something specific. No opinions, no vague claims.",
  ].join("\n");
}

function buildPlUserPrompt(seed: ResearchSeed, deterministicSeed: number): string {
  return [
    `THEME: ${seed.theme}`,
    `KIND: ${seed.kind}`,
    `RESEARCH NOTES: ${seed.notes}`,
    `SOURCE HINT: ${seed.source}`,
    `DETERMINISTIC SEED: ${deterministicSeed} (pick variations stable across retries in the same 24h window).`,
    "",
    `Produce a ${seed.kind} spec in Polish.`,
  ].join("\n");
}

async function generatePolishSpec(ctx: GenerateContext): Promise<GameSpec> {
  const schema = schemaForKind(ctx.seed.kind);
  const response = await client().messages.parse({
    model: PRIMARY_MODEL,
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: buildPlSystemPrompt(ctx.seed.kind),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildPlUserPrompt(ctx.seed, ctx.deterministicSeed),
      },
    ],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (!response.parsed_output) {
    throw new Error(
      `Sonnet returned no parseable PL spec (stop_reason=${response.stop_reason})`,
    );
  }
  return response.parsed_output as GameSpec;
}

/* ---------------- Stage 2: Haiku → translations ---------------- */

const TARGET_LANG_LABEL: Record<Exclude<Lang, "pl">, string> = {
  uk: "Ukrainian (українська)",
  cs: "Czech (čeština)",
  en: "English",
};

function buildTranslationSystemPrompt(targetLang: Exclude<Lang, "pl">): string {
  const label = TARGET_LANG_LABEL[targetLang];
  return [
    `You are a financial / energy literacy translator. Translate a Polish game spec into ${label}.`,
    "",
    "HARD RULES:",
    "- Preserve JSON structure EXACTLY: same `kind`, same item count, identical numeric fields (correctIndex, truth, tolerancePct, xpPerCorrect, xpPerWord).",
    "- The game is about the POLISH financial + energy context. DO NOT localize currencies or convert prices. Keep zł / PLN in prompts AND in the `unit` field, even for EN/UK/CS speakers — users are told they're playing a Polish-context game.",
    "- Keep these Polish proper nouns untranslated: BLIK, PKO, NBP, Tauron, IKE, IKZE, RRSO, WIBOR, WIRON, Katowice, Warszawa, Śląsk, Nikiszowiec, Varso Tower.",
    "- Translate only user-facing text (prompts, options, explanations, hints). Units (zł, kWh, %, Wh, zł/kWh…) stay as written.",
    "- Scramble words: produce a natural UPPERCASE target-language word that matches the concept in the hint. The word must be 4–20 letters. It is OK for the target word to differ from Polish (e.g. PL 'INFLACJA' → CS 'INFLACE' / EN 'INFLATION' / UK 'ІНФЛЯЦІЯ').",
    "- Options for quiz: keep the same order. correctIndex must not change.",
    "- Tone: same register as source (neutral, educational, Gen Z friendly).",
    "- Do NOT add, remove, or reorder items.",
    "",
    "Return the same JSON schema as input, with translated strings.",
  ].join("\n");
}

async function translateSpec(
  plSpec: GameSpec,
  targetLang: Exclude<Lang, "pl">,
): Promise<GameSpec> {
  const schema = schemaForKind(plSpec.kind);
  const response = await client().messages.parse({
    model: TRANSLATION_MODEL,
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: buildTranslationSystemPrompt(targetLang),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          "SOURCE (Polish):",
          "```json",
          JSON.stringify(plSpec, null, 2),
          "```",
          "",
          `Translate to ${TARGET_LANG_LABEL[targetLang]}. Return the same schema (kind='${plSpec.kind}').`,
        ].join("\n"),
      },
    ],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (!response.parsed_output) {
    throw new Error(
      `Haiku returned no parseable ${targetLang} spec (stop_reason=${response.stop_reason})`,
    );
  }
  return mergeStructure(plSpec, response.parsed_output as GameSpec);
}

function mergeStructure(pl: GameSpec, translated: GameSpec): GameSpec {
  if (pl.kind !== translated.kind) return pl; // last-ditch fallback
  if (pl.kind === "quiz" && translated.kind === "quiz") {
    return {
      kind: "quiz",
      xpPerCorrect: pl.xpPerCorrect,
      items: pl.items.map((plItem, i) => {
        const t = translated.items[i] ?? plItem;
        return {
          prompt: t.prompt ?? plItem.prompt,
          options:
            Array.isArray(t.options) && t.options.length === 4
              ? t.options
              : plItem.options,
          correctIndex: plItem.correctIndex,
          explanation: t.explanation ?? plItem.explanation,
        };
      }),
    };
  }
  if (pl.kind === "scramble" && translated.kind === "scramble") {
    return {
      kind: "scramble",
      xpPerWord: pl.xpPerWord,
      words: pl.words.map((plWord, i) => {
        const t = translated.words[i] ?? plWord;
        return {
          word:
            typeof t.word === "string" && t.word.length >= 4 && t.word.length <= 20
              ? t.word.toUpperCase()
              : plWord.word,
          hint: t.hint ?? plWord.hint,
        };
      }),
    };
  }
  if (pl.kind === "price-guess" && translated.kind === "price-guess") {
    return {
      kind: "price-guess",
      xpPerCorrect: pl.xpPerCorrect,
      items: pl.items.map((plItem, i) => {
        const t = translated.items[i] ?? plItem;
        return {
          prompt: t.prompt ?? plItem.prompt,
          truth: plItem.truth,
          unit: plItem.unit, // lock unit — translator isn't allowed to re-denominate
          tolerancePct: plItem.tolerancePct,
        };
      }),
    };
  }
  return pl;
}

/* ---------------- Orchestrator ---------------- */

async function generateWithClaude(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const plSpec = await generatePolishSpec(ctx);
  const [ukSpec, csSpec, enSpec] = await Promise.all([
    translateSpec(plSpec, "uk").catch(() => plSpec),
    translateSpec(plSpec, "cs").catch(() => plSpec),
    translateSpec(plSpec, "en").catch(() => plSpec),
  ]);
  const localized: LocalizedSpec = {
    pl: plSpec,
    uk: ukSpec,
    cs: csSpec,
    en: enSpec,
  };
  const parsed = LocalizedSpecSchema.safeParse(localized);
  if (!parsed.success) {
    throw new Error(
      `localized-spec validation failed: ${parsed.error.message}`,
    );
  }
  return {
    spec: parsed.data,
    model: `${PRIMARY_MODEL}+${TRANSLATION_MODEL}`,
  };
}

/* ---------------- Mock fallback (mock-v1) ---------------- */

// Each theme produces a complete LocalizedSpec — same items, translated.
// This keeps the judge experience (no API key) honest: the structure is
// identical to what real Claude would produce, only the content is frozen.
const FALLBACK_SPECS: Record<string, () => LocalizedSpec> = {
  "Inflácia v Poľsku — aký je reálny úrok": () => ({
    pl: {
      kind: "quiz",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Bank oferuje 5 % w skali roku, inflacja wynosi 6 %. Jaki jest realny zwrot?",
          options: ["+5 %", "+1 %", "−1 %", "−11 %"],
          correctIndex: 2,
          explanation:
            "Realna stopa = nominalna − inflacja. 5 − 6 = −1 %. Siła nabywcza spada nawet na lokacie.",
        },
        {
          prompt: "Co NIE chroni przed inflacją?",
          options: ["Akcje", "Nieruchomości", "Gotówka w skrytce", "TIPS / obligacje indeksowane"],
          correctIndex: 2,
          explanation:
            "Gotówka pod materacem traci wartość dokładnie według CPI — najgorsza obrona przed inflacją.",
        },
        {
          prompt: "NBP reaguje na wysoką inflację tym, że…",
          options: [
            "obniża stopy procentowe",
            "podnosi stopy procentowe",
            "drukuje więcej pieniędzy",
            "zamyka giełdę",
          ],
          correctIndex: 1,
          explanation:
            "Podniesienie stopy zdraża kredyt → spowalnia konsumpcję → spowalnia wzrost cen.",
        },
        {
          prompt: "Limit wpłat na IKE w 2026 to około…",
          options: ["1 500 zł", "~27 000 zł", "bez limitu", "50 000 zł"],
          correctIndex: 1,
          explanation:
            "Limit IKE 2026 to 3× prognozowane przeciętne wynagrodzenie — około 27 000 zł. Zaleta: brak podatku Belki po 60. roku życia.",
        },
        {
          prompt: "WIBOR od 2025 zastępuje…",
          options: ["WIRON", "LIBOR", "ESTR", "SOFR"],
          correctIndex: 0,
          explanation:
            "Polski rynek przechodzi na WIRON (overnight). Dla kredytów hipotecznych oznacza to nowe zasady ustalania oprocentowania.",
        },
      ],
    },
    uk: {
      kind: "quiz",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Банк пропонує 5 % річних, інфляція — 6 %. Яка реальна дохідність?",
          options: ["+5 %", "+1 %", "−1 %", "−11 %"],
          correctIndex: 2,
          explanation:
            "Реальна ставка = номінальна − інфляція. 5 − 6 = −1 %. Купівельна спроможність падає навіть на депозиті.",
        },
        {
          prompt: "Що НЕ захищає від інфляції?",
          options: ["Акції", "Нерухомість", "Готівка в сейфі", "TIPS / індексовані облігації"],
          correctIndex: 2,
          explanation:
            "Готівка під матрацом втрачає вартість точно за CPI — найгірший захист від інфляції.",
        },
        {
          prompt: "NBP реагує на високу інфляцію тим, що…",
          options: [
            "знижує ставки",
            "підвищує ставки",
            "друкує більше грошей",
            "закриває біржу",
          ],
          correctIndex: 1,
          explanation:
            "Підвищення ставки робить кредит дорожчим → сповільнює споживання → сповільнює зростання цін.",
        },
        {
          prompt: "Ліміт внесків на IKE в 2026 — приблизно…",
          options: ["1 500 zł", "~27 000 zł", "без ліміту", "50 000 zł"],
          correctIndex: 1,
          explanation:
            "Ліміт IKE 2026 — 3× прогнозована середня зарплата, приблизно 27 000 zł. Перевага: відсутність податку Belki після 60 років.",
        },
        {
          prompt: "WIBOR з 2025 замінюється на…",
          options: ["WIRON", "LIBOR", "ESTR", "SOFR"],
          correctIndex: 0,
          explanation:
            "Польський ринок переходить на WIRON (овернайт). Для іпотек це означає нові правила визначення ставки.",
        },
      ],
    },
    cs: {
      kind: "quiz",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Banka nabízí 5 % p. a., inflace je 6 %. Jaký je reálný výnos?",
          options: ["+5 %", "+1 %", "−1 %", "−11 %"],
          correctIndex: 2,
          explanation:
            "Reálná sazba = nominální − inflace. 5 − 6 = −1 %. Kupní síla klesá i na termínovaném vkladu.",
        },
        {
          prompt: "Co NECHRÁNÍ před inflací?",
          options: ["Akcie", "Nemovitosti", "Hotovost v trezoru", "TIPS / indexované dluhopisy"],
          correctIndex: 2,
          explanation:
            "Hotovost pod polštářem ztrácí hodnotu přesně podle CPI — nejhorší obrana proti inflaci.",
        },
        {
          prompt: "NBP reaguje na vysokou inflaci tím, že…",
          options: [
            "snižuje sazby",
            "zvyšuje sazby",
            "tiskne více peněz",
            "zavírá burzu",
          ],
          correctIndex: 1,
          explanation:
            "Zvýšení sazby zdraží úvěr → zpomalí spotřebu → zpomalí růst cen.",
        },
        {
          prompt: "Limit vkladů na IKE v 2026 je zhruba…",
          options: ["1 500 zł", "~27 000 zł", "bez limitu", "50 000 zł"],
          correctIndex: 1,
          explanation:
            "Limit IKE 2026 je 3× prognózovaná průměrná mzda, zhruba 27 000 zł. Výhoda: žádná daň Belki po 60. roce života.",
        },
        {
          prompt: "WIBOR od 2025 nahrazuje…",
          options: ["WIRON", "LIBOR", "ESTR", "SOFR"],
          correctIndex: 0,
          explanation:
            "Polský trh přechází na WIRON (overnight). Pro hypotéky to znamená nová pravidla nastavení úroku.",
        },
      ],
    },
    en: {
      kind: "quiz",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "A bank offers 5 % per year; inflation is 6 %. What is the real return?",
          options: ["+5 %", "+1 %", "−1 %", "−11 %"],
          correctIndex: 2,
          explanation:
            "Real rate = nominal − inflation. 5 − 6 = −1 %. Purchasing power falls even on a savings deposit.",
        },
        {
          prompt: "Which does NOT protect against inflation?",
          options: ["Stocks", "Real estate", "Cash in a safe", "TIPS / inflation-linked bonds"],
          correctIndex: 2,
          explanation:
            "Cash under the mattress loses value exactly at CPI — the worst defense against inflation.",
        },
        {
          prompt: "NBP responds to high inflation by…",
          options: [
            "cutting rates",
            "raising rates",
            "printing more money",
            "closing the stock exchange",
          ],
          correctIndex: 1,
          explanation:
            "A higher policy rate raises credit costs → slows consumption → slows price growth.",
        },
        {
          prompt: "The IKE contribution limit in 2026 is roughly…",
          options: ["1 500 zł", "~27 000 zł", "no limit", "50 000 zł"],
          correctIndex: 1,
          explanation:
            "2026 IKE limit = 3× projected average wage, roughly 27 000 zł. Perk: no Belka tax on withdrawals after age 60.",
        },
        {
          prompt: "WIBOR is being replaced from 2025 by…",
          options: ["WIRON", "LIBOR", "ESTR", "SOFR"],
          correctIndex: 0,
          explanation:
            "The Polish market is transitioning to WIRON (overnight). For mortgages, this means new rules for setting the interest rate.",
        },
      ],
    },
  }),

  "Earth Hour — energia vypnutá na hodinu": () => ({
    pl: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Ile % zużycia energii oszczędza Polska podczas Earth Hour (1 h)?",
          truth: 0.2,
          unit: "%",
          tolerancePct: 0.5,
        },
        {
          prompt: "Oszczędność energii przy wyłączeniu żarówki 60 W na 1 godzinę (Wh)",
          truth: 60,
          unit: "Wh",
          tolerancePct: 0.1,
        },
        {
          prompt: "Przy taryfie 0,90 zł/kWh koszt 1 h świecenia żarówki 60 W:",
          truth: 0.054,
          unit: "zł",
          tolerancePct: 0.15,
        },
        {
          prompt: "Oszczędność rocznie, jeśli codziennie wyłączasz 4 żarówki 60 W o 1 h wcześniej (kWh/rok):",
          truth: 87.6,
          unit: "kWh",
          tolerancePct: 0.15,
        },
        {
          prompt: "Te same 4 żarówki wymienione na LED 9 W, godzinowa oszczędność przy 4 h świecenia (Wh):",
          truth: 816,
          unit: "Wh",
          tolerancePct: 0.1,
        },
      ],
    },
    uk: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Який % споживання електроенергії економить Польща під час Earth Hour (1 год)?",
          truth: 0.2,
          unit: "%",
          tolerancePct: 0.5,
        },
        {
          prompt: "Економія енергії при вимкненні лампочки 60 Вт на 1 годину (Вт·год)",
          truth: 60,
          unit: "Wh",
          tolerancePct: 0.1,
        },
        {
          prompt: "При тарифі 0,90 zł/кВт·год — вартість 1 години роботи лампочки 60 Вт:",
          truth: 0.054,
          unit: "zł",
          tolerancePct: 0.15,
        },
        {
          prompt: "Річна економія, якщо щодня вимикаєш 4 лампочки 60 Вт на 1 год раніше (кВт·год/рік):",
          truth: 87.6,
          unit: "kWh",
          tolerancePct: 0.15,
        },
        {
          prompt: "Ті ж 4 лампочки замінено на LED 9 Вт — погодинна економія при 4 год роботи (Вт·год):",
          truth: 816,
          unit: "Wh",
          tolerancePct: 0.1,
        },
      ],
    },
    cs: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "Kolik % spotřeby elektřiny Polsko ušetří během Earth Hour (1 h)?",
          truth: 0.2,
          unit: "%",
          tolerancePct: 0.5,
        },
        {
          prompt: "Úspora energie při vypnutí 60 W žárovky na 1 hodinu (Wh)",
          truth: 60,
          unit: "Wh",
          tolerancePct: 0.1,
        },
        {
          prompt: "Při sazbě 0,90 zł/kWh stojí 1 h svícení 60 W žárovky:",
          truth: 0.054,
          unit: "zł",
          tolerancePct: 0.15,
        },
        {
          prompt: "Roční úspora, když denně vypneš 4 žárovky 60 W o 1 hodinu dřív (kWh/rok):",
          truth: 87.6,
          unit: "kWh",
          tolerancePct: 0.15,
        },
        {
          prompt: "Stejné 4 žárovky nahrazené LED 9 W — hodinová úspora při 4 h svícení (Wh):",
          truth: 816,
          unit: "Wh",
          tolerancePct: 0.1,
        },
      ],
    },
    en: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: "What % of electricity does Poland save during Earth Hour (1 h)?",
          truth: 0.2,
          unit: "%",
          tolerancePct: 0.5,
        },
        {
          prompt: "Energy saved by turning off one 60 W bulb for 1 hour (Wh)",
          truth: 60,
          unit: "Wh",
          tolerancePct: 0.1,
        },
        {
          prompt: "At 0.90 zł/kWh, cost of running a 60 W bulb for 1 hour:",
          truth: 0.054,
          unit: "zł",
          tolerancePct: 0.15,
        },
        {
          prompt: "Yearly savings if you switch off 4 × 60 W bulbs 1 hour earlier each day (kWh/year):",
          truth: 87.6,
          unit: "kWh",
          tolerancePct: 0.15,
        },
        {
          prompt: "Same 4 bulbs replaced with 9 W LEDs — hourly savings during 4 h of lighting (Wh):",
          truth: 816,
          unit: "Wh",
          tolerancePct: 0.1,
        },
      ],
    },
  }),

  "Pay-day Friday — 50/30/20": () => ({
    pl: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: 'Z pensji 4500 zł: maksimum na kategorię „potrzeby" (50 %):',
          truth: 2250,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Z pensji 4500 zł: zalecane na oszczędności + spłatę długu (20 %):",
          truth: 900,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Z pensji 4500 zł: maksimum na rozrywkę (30 %):",
          truth: 1350,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Jeśli wpłacasz 500 zł miesięcznie na IKE przez 30 lat przy 6 % realnie rocznie — ile masz na emeryturę?",
          truth: 500_000,
          unit: "zł",
          tolerancePct: 0.25,
        },
        {
          prompt: "Do której kategorii trafia czynsz: potrzeby (P), rozrywka (Z), oszczędności (U)? Podaj 1=P, 2=Z, 3=U.",
          truth: 1,
          unit: "1=P",
          tolerancePct: 0.01,
        },
      ],
    },
    uk: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: 'Із зарплати 4500 zł: максимум на категорію „потреби" (50 %):',
          truth: 2250,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Із зарплати 4500 zł: рекомендовано на заощадження + борг (20 %):",
          truth: 900,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Із зарплати 4500 zł: максимум на розваги (30 %):",
          truth: 1350,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Якщо відкладаєш 500 zł щомісяця на IKE протягом 30 років при 6 % реальних річних — скільки матимеш на пенсію?",
          truth: 500_000,
          unit: "zł",
          tolerancePct: 0.25,
        },
        {
          prompt: "До якої категорії належить квартплата: потреби (P), розваги (Z), заощадження (U)? Дай 1=P, 2=Z, 3=U.",
          truth: 1,
          unit: "1=P",
          tolerancePct: 0.01,
        },
      ],
    },
    cs: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: 'Z platu 4500 zł: maximum pro kategorii „potřeby" (50 %):',
          truth: 2250,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Z platu 4500 zł: doporučené na spoření + splácení dluhu (20 %):",
          truth: 900,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Z platu 4500 zł: maximum pro zábavu (30 %):",
          truth: 1350,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Pokud si odkládáš 500 zł měsíčně na IKE po 30 let při 6 % reálných ročně — kolik máš na důchod?",
          truth: 500_000,
          unit: "zł",
          tolerancePct: 0.25,
        },
        {
          prompt: "Do které kategorie patří nájem: potřeby (P), zábava (Z), spoření (U)? Zadej 1=P, 2=Z, 3=U.",
          truth: 1,
          unit: "1=P",
          tolerancePct: 0.01,
        },
      ],
    },
    en: {
      kind: "price-guess",
      xpPerCorrect: 20,
      items: [
        {
          prompt: 'Out of a 4500 zł salary: maximum for the "needs" bucket (50 %):',
          truth: 2250,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Out of a 4500 zł salary: recommended for savings + debt payoff (20 %):",
          truth: 900,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "Out of a 4500 zł salary: maximum for fun (30 %):",
          truth: 1350,
          unit: "zł",
          tolerancePct: 0.05,
        },
        {
          prompt: "If you contribute 500 zł monthly to IKE for 30 years at 6 % real yearly — how much will you have at retirement?",
          truth: 500_000,
          unit: "zł",
          tolerancePct: 0.25,
        },
        {
          prompt: "Which bucket does rent go into: needs (P), fun (Z), savings (U)? Enter 1=P, 2=Z, 3=U.",
          truth: 1,
          unit: "1=P",
          tolerancePct: 0.01,
        },
      ],
    },
  }),

  "BLIK minutovka": () => ({
    pl: {
      kind: "scramble",
      xpPerWord: 18,
      words: [
        { word: "BLIK", hint: "6-cyfrowy jednorazowy kod" },
        { word: "KODY", hint: "Co BLIK generuje — krótkie jednorazowe…" },
        { word: "PRZELEW", hint: "Przeniesienie pieniędzy między kontami" },
        { word: "KONTO", hint: "Rachunek bankowy (PL)" },
        { word: "BANKOMAT", hint: "Tam wypłacasz gotówkę kodem BLIK" },
        { word: "OSZCZEDZANIE", hint: "Odkładanie pieniędzy na przyszłość" },
      ],
    },
    uk: {
      kind: "scramble",
      xpPerWord: 18,
      words: [
        { word: "БЛІК", hint: "6-значний одноразовий код (PL)" },
        { word: "КОДИ", hint: "Що BLIK генерує — короткі одноразові…" },
        { word: "ПЕРЕКАЗ", hint: "Переказ грошей між рахунками" },
        { word: "РАХУНОК", hint: "Банківський рахунок" },
        { word: "БАНКОМАТ", hint: "Там знімаєш готівку кодом BLIK" },
        { word: "ЗАОЩАДЖЕННЯ", hint: "Відкладання грошей на майбутнє" },
      ],
    },
    cs: {
      kind: "scramble",
      xpPerWord: 18,
      words: [
        { word: "BLIK", hint: "6ciferný jednorázový kód (PL)" },
        { word: "KODY", hint: "Co BLIK generuje — krátké jednorázové…" },
        { word: "PREVOD", hint: "Přesun peněz mezi účty" },
        { word: "UCET", hint: "Bankovní účet" },
        { word: "BANKOMAT", hint: "Tam vybíráš hotovost kódem BLIK" },
        { word: "SPORENI", hint: "Odkládání peněz do budoucna" },
      ],
    },
    en: {
      kind: "scramble",
      xpPerWord: 18,
      words: [
        { word: "BLIK", hint: "Polish 6-digit one-time payment code" },
        { word: "CODES", hint: "What BLIK generates — short one-time…" },
        { word: "TRANSFER", hint: "Moving money between accounts" },
        { word: "ACCOUNT", hint: "A bank account" },
        { word: "ATM", hint: "Where you withdraw cash with a BLIK code" },
        { word: "SAVINGS", hint: "Money set aside for the future" },
      ],
    },
  }),
};

export async function generateGameSpec(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    return generateWithClaude(ctx);
  }
  const builder = FALLBACK_SPECS[ctx.seed.theme];
  if (!builder) {
    throw new Error(`No fallback spec for theme: ${ctx.seed.theme}`);
  }
  return { spec: builder(), model: "mock-v1" };
}
