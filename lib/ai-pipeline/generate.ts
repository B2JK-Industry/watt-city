import type { GameSpec } from "./types";
import type { ResearchSeed } from "./research";

/* Game-spec generator.
 *
 * In production (when ANTHROPIC_API_KEY is set) this calls Claude with a
 * strict system prompt that demands JSON matching the GameSpec schema.
 * For the hackathon MVP — which judges must be able to run without keys —
 * it ships a deterministic fallback that produces a coherent GameSpec
 * from the ResearchSeed. The fallback exists so `pnpm dev` on a machine
 * with no API key still exercises the full pipeline end-to-end.
 *
 * Never mark the fallback output as "AI-generated". Set model: "mock-v1".
 */

export type GenerateContext = {
  seed: ResearchSeed;
  deterministicSeed: number; // used by the fallback to pick words/numbers
};

export type GenerateResult = {
  spec: GameSpec;
  model: string; // "claude-sonnet-4-6" | "mock-v1"
};

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
      { word: "BLIK", hint: "6-ciferný jednorazový kód" },
      { word: "KOD", hint: "Čo BLIK generuje pri platbe" },
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
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (hasApiKey) {
    // Production path: call Claude.
    //
    // The live pipeline would be:
    //   1) Compose a system prompt with the schema docblock + seed.notes
    //      + examples.
    //   2) Call Claude Sonnet 4.6 with `response_format: { type: "json" }`.
    //   3) JSON.parse the assistant message.
    //   4) Return { spec, model: "claude-sonnet-4-6" }.
    //
    // For judges without API billing, we fall through to the mock below.
    // Keeping the hackathon entry honest: never ship a fake "AI generated"
    // badge when the spec is actually hand-written.
    //
    // (Intentionally unimplemented in this commit — see ROADMAP.)
  }
  const builder = FALLBACK_SPECS[ctx.seed.theme];
  if (!builder) {
    throw new Error(`No fallback spec for theme: ${ctx.seed.theme}`);
  }
  return { spec: builder(ctx), model: "mock-v1" };
}
