import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GameSpecSchema, type GameSpec } from "./types";
import type { ResearchSeed } from "./research";

/* Game-spec generator.
 *
 * Production path: calls Claude (sonnet-4-6) with a strict JSON schema derived
 * from GameSpecSchema (zod) via client.messages.parse(). Unsupported schema
 * constraints (string min/max, regex) are stripped for the API request but
 * validated client-side by the SDK when the response is parsed back.
 *
 * Mock path: when ANTHROPIC_API_KEY is unset we fall back to deterministic
 * fixtures per seed theme, so `pnpm dev` and hackathon judges without API
 * billing still exercise the full pipeline end-to-end. model: "mock-v1".
 */

export type GenerateContext = {
  seed: ResearchSeed;
  deterministicSeed: number;
};

export type GenerateResult = {
  spec: GameSpec;
  model: string;
};

const MODEL = "claude-sonnet-4-6";

// System prompt is stable across calls (schema + rules + examples). Cache it
// so repeated cron runs within the 5-minute TTL amortize the prefix.
function buildSystemPrompt(): string {
  return [
    "You are the content designer for XP Arena, a Polish financial + energy literacy game aimed at Gen Z in Katowice (Silesia region).",
    "",
    "Your job: produce ONE game spec matching the requested theme. The spec will be auto-rendered into a 24-hour rotating challenge.",
    "",
    "OUTPUT DISCRIMINATED UNION — pick exactly one kind:",
    "• kind='quiz' — 5–8 multiple-choice questions, 4 options each, one correct, each with a short teaching explanation. xpPerCorrect 5–40.",
    "• kind='scramble' — 5–10 words (uppercase, Polish letters allowed: A-Z plus ĄĆĘŁŃÓŚŹŻ, length 4–20), each with a hint. xpPerWord 5–30.",
    "• kind='price-guess' — 5–10 numeric-estimation items (prompt, true value, unit string, tolerancePct 0.01–0.5). xpPerCorrect 5–30.",
    "",
    "CONTENT RULES:",
    "- Write ALL user-facing strings in Polish (prompts, options, explanations, hints, units).",
    "- Keep the Polish authentic: zł, NBP, KNF, BLIK, WIBOR/WIRON, IKE/IKZE — use real local terms, not translated equivalents.",
    "- Questions must be verifiable and teach something specific. No opinions, no vague claims.",
    "- Explanations should deepen the lesson (why this is right, what the rule is), not just restate the answer.",
    "- Scramble words: economy/finance/energy vocabulary. NO proper nouns that have only one correct unscrambling accidentally.",
    "- Price-guess: pick values with an unambiguous 'truth' grounded in 2025–2026 PL reality. tolerancePct should be wide enough to reward ballpark reasoning (0.10–0.25 typical).",
    "",
    "STYLE:",
    "- Prompts: concrete and short (8–30 words).",
    "- Options: parallel structure, no 'all of the above', no joke answers.",
    "- Explanations: 20–60 words, plain Polish, one takeaway per item.",
    "",
    "EXAMPLES (format only — DO NOT copy content):",
    '• quiz item: {"prompt":"Ile wynosi RRSO?","options":["roczna stopa bez opłat","roczna rzeczywista stopa oprocentowania","prowizja za spłatę","minimalna rata"],"correctIndex":1,"explanation":"RRSO zawiera odsetki i wszystkie opłaty — to prawdziwy koszt kredytu."}',
    '• scramble item: {"word":"INFLACJA","hint":"Wzrost cen w czasie"}',
    '• price-guess item: {"prompt":"Cena 1 kWh w taryfie G11 (2026)","truth":0.92,"unit":"zł","tolerancePct":0.15}',
  ].join("\n");
}

function buildUserPrompt(seed: ResearchSeed, deterministicSeed: number): string {
  return [
    `THEME: ${seed.theme}`,
    `RESEARCH NOTES: ${seed.notes}`,
    `SOURCE HINT: ${seed.source}`,
    `DETERMINISTIC SEED: ${deterministicSeed} (use this to keep variation stable across retries within the same 24h window — same seed = same spec).`,
    "",
    "Pick the kind (quiz / scramble / price-guess) that best fits this theme and produce the spec.",
  ].join("\n");
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

async function generateWithClaude(
  ctx: GenerateContext,
): Promise<GenerateResult> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserPrompt(ctx.seed, ctx.deterministicSeed),
      },
    ],
    output_config: {
      format: zodOutputFormat(GameSpecSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error(
      `Claude returned no parseable spec (stop_reason=${response.stop_reason})`,
    );
  }
  return { spec: response.parsed_output, model: MODEL };
}

/* ------------------------ fallback (mock-v1) ------------------------ */

const FALLBACK_SPECS: Record<string, (ctx: GenerateContext) => GameSpec> = {
  "Inflácia v Poľsku — aký je reálny úrok": () => ({
    kind: "quiz",
    xpPerCorrect: 20,
    items: [
      {
        prompt:
          "Banka ponúka 5 % p. a., inflácia je 6 %. Aký je reálny výnos?",
        options: ["+5 %", "+1 %", "−1 %", "−11 %"],
        correctIndex: 2,
        explanation:
          "Reálna sadzba = nominálna − inflácia. 5 − 6 = −1 %. Kúpna sila klesá aj na lokate.",
      },
      {
        prompt: "Čo nezabezpečuje ochranu proti inflácii?",
        options: ["Akcie", "Nehnuteľnosti", "Hotovosť v trezore", "TIPS/inflačné dlhopisy"],
        correctIndex: 2,
        explanation: "Hotovosť pod matracom znehodnocuje presne podľa CPI.",
      },
      {
        prompt: "NBP reaguje na vysokú infláciu tým, že…",
        options: [
          "zníži sadzbu",
          "zvýši sadzbu",
          "tlačí viac peňazí",
          "vypne burzu",
        ],
        correctIndex: 1,
        explanation:
          "Zvýšenie sadzby zdraží úver → spomalí spotrebu → spomalí rast cien.",
      },
      {
        prompt: "IKE limit 2026 je cca…",
        options: ["1 500 zł", "~15 000 zł", "bez limitu", "50 000 zł"],
        correctIndex: 1,
        explanation:
          "3× priemerná mzda, pre 2026 ~15 000 zł. Výhoda: žiadna kap. daň po 60.",
      },
      {
        prompt: "WIBOR od 2025 nahrádza…",
        options: ["WIRON", "LIBOR", "ESTR", "SOFR"],
        correctIndex: 0,
        explanation:
          "PL trh prechádza na WIRON (overnight). Pre hypotéky to znamená nové nastavenia sadzby.",
      },
    ],
  }),
  "Earth Hour — energia vypnutá na hodinu": () => ({
    kind: "price-guess",
    xpPerCorrect: 20,
    items: [
      {
        prompt: "Koľko % spotreby sa v PL ušetrí za Earth Hour (1 hodina)?",
        truth: 0.2,
        unit: "%",
        tolerancePct: 0.5,
      },
      {
        prompt: "Ušetrená energia pri vypnutí 60 W žiarovky na 1 hodinu (v Wh)",
        truth: 60,
        unit: "Wh",
        tolerancePct: 0.1,
      },
      {
        prompt: "Pri sadzbe 0.90 zł/kWh stojí 1 h rozsvietenej 60 W žiarovky:",
        truth: 0.054,
        unit: "zł",
        tolerancePct: 0.15,
      },
      {
        prompt:
          "Úspora ročne, ak každý deň vypneš 4 klasické 60 W žiarovky o 1 hodinu skôr (kWh/rok):",
        truth: 87.6,
        unit: "kWh",
        tolerancePct: 0.15,
      },
      {
        prompt:
          "Rovnaké 4 žiarovky nahradené za LED 9 W, hodinová úspora pri 4 hodinách svietenia (Wh):",
        truth: 816,
        unit: "Wh",
        tolerancePct: 0.1,
      },
    ],
  }),
  "Pay-day Friday — 50/30/20": () => ({
    kind: "price-guess",
    xpPerCorrect: 20,
    items: [
      {
        prompt: `Z platu 4500 zł: maximum pre kategóriu „potreby" (50 %):`,
        truth: 2250,
        unit: "zł",
        tolerancePct: 0.05,
      },
      {
        prompt: `Z platu 4500 zł: odporúčané pre úspory + dlh (20 %):`,
        truth: 900,
        unit: "zł",
        tolerancePct: 0.05,
      },
      {
        prompt: `Z platu 4500 zł: maximum pre zábavu (30 %):`,
        truth: 1350,
        unit: "zł",
        tolerancePct: 0.05,
      },
      {
        prompt:
          "Ak dáš do IKE 500 zł každý mesiac 30 rokov pri 6 % p. a. reálne, koľko máš v dôchodku?",
        truth: 500_000,
        unit: "zł",
        tolerancePct: 0.25,
      },
      {
        prompt: "Kam patrí nájomné: potreby (P), zábava (Z), úspory (U)?",
        truth: 1,
        unit: "P=1",
        tolerancePct: 0.01,
      },
    ],
  }),
  "BLIK minutovka": () => ({
    kind: "scramble",
    xpPerWord: 18,
    words: [
      { word: "BLIK", hint: "6-ciferný jednorazový kód na platby mobilom" },
      { word: "KODY", hint: "Čo BLIK generuje — krátkodobé jednorazové…" },
      { word: "PRZELEW", hint: "Prevod peňazí (PL)" },
      { word: "KONTO", hint: "Bankový účet (PL)" },
      { word: "BANKOMAT", hint: "Výber hotovosti" },
      { word: "PRZECHOWANIE", hint: "Uchovávanie hodnoty, rola banky" },
    ],
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
  return { spec: builder(ctx), model: "mock-v1" };
}
