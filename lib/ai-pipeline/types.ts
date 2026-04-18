import { z } from "zod";
import { LANGS, type Lang } from "@/lib/i18n";

/* ==========================================================================
 * AI Game of the day — deterministic game-spec schema.
 *
 * Claude produces a LocalizedSpec (one GameSpec per UI language), the
 * renderer picks the current user's lang (falling back to PL). Keeping the
 * shape strict means:
 *  - we validate (zod) before publishing, rejecting bad output
 *  - structure (correctIndex, truth, tolerancePct, xpPer*) is authoritative
 *    in the PL spec; translations copy these by construction
 * ========================================================================== */

export const QuizItemSchema = z.object({
  prompt: z.string().min(10).max(240),
  options: z.array(z.string().min(1).max(140)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(400),
});
export type QuizItem = z.infer<typeof QuizItemSchema>;

export const QuizSpecSchema = z.object({
  kind: z.literal("quiz"),
  items: z.array(QuizItemSchema).min(5).max(8),
  xpPerCorrect: z.number().int().min(5).max(40),
});

// Dropped the PL-only regex — words are UPPERCASE in whichever language
// the spec is for; each lang brings its own alphabet (CS has ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ,
// UK uses Cyrillic A-Я/Є/І/Ї/Ґ, etc.). Length + non-space-only is enforced.
export const ScrambleItemSchema = z.object({
  word: z.string().min(4).max(20),
  hint: z.string().min(6).max(200),
});

export const ScrambleSpecSchema = z.object({
  kind: z.literal("scramble"),
  words: z.array(ScrambleItemSchema).min(5).max(10),
  xpPerWord: z.number().int().min(5).max(30),
});

export const PriceGuessItemSchema = z.object({
  prompt: z.string().min(8).max(200),
  truth: z.number(),
  unit: z.string().min(1).max(20),
  tolerancePct: z.number().min(0.01).max(0.5),
});

export const PriceGuessSpecSchema = z.object({
  kind: z.literal("price-guess"),
  items: z.array(PriceGuessItemSchema).min(5).max(10),
  xpPerCorrect: z.number().int().min(5).max(30),
});

/* ---------- True / False sprint ---------- */

export const TrueFalseItemSchema = z.object({
  statement: z.string().min(8).max(200),
  isTrue: z.boolean(),
  explanation: z.string().min(10).max(300),
});

export const TrueFalseSpecSchema = z.object({
  kind: z.literal("true-false"),
  items: z.array(TrueFalseItemSchema).min(6).max(12),
  xpPerCorrect: z.number().int().min(5).max(20),
});

/* ---------- Match-pairs (concept ↔ definition / pair) ---------- */

export const MatchPairSchema = z.object({
  left: z.string().min(2).max(60),
  right: z.string().min(2).max(140),
});

export const MatchPairsSpecSchema = z.object({
  kind: z.literal("match-pairs"),
  pairs: z.array(MatchPairSchema).min(4).max(8),
  xpPerMatch: z.number().int().min(5).max(30),
  leftLabel: z.string().min(1).max(40), // e.g. "Pojęcie"
  rightLabel: z.string().min(1).max(40), // e.g. "Definicja"
});

/* ---------- Order / Timeline (sort items chronologically or by value) ---------- */

export const OrderItemSchema = z.object({
  label: z.string().min(2).max(80),
  rank: z.number().int().min(1).max(20), // 1 = first / smallest, N = last / largest
  hint: z.string().max(160).optional(),
});

export const OrderSpecSchema = z.object({
  kind: z.literal("order"),
  prompt: z.string().min(8).max(200), // e.g. "Sort PL macro events by date (oldest first)"
  direction: z.enum(["ascending", "descending"]),
  items: z.array(OrderItemSchema).min(4).max(7),
  xpPerCorrect: z.number().int().min(10).max(40), // bonus for full sequence
});

/* ---------- Memory (concept ↔ icon/definition pairs, 4×4 grid) ---------- */

export const MemoryPairSchema = z.object({
  concept: z.string().min(2).max(40),
  match: z.string().min(1).max(60),
});

export const MemorySpecSchema = z.object({
  kind: z.literal("memory"),
  pairs: z.array(MemoryPairSchema).min(6).max(8),
  xpPerMatch: z.number().int().min(5).max(20),
  hint: z.string().min(4).max(160), // overall theme hint
});

/* ---------- Fill-in-blank (sentence with one missing word) ---------- */

export const FillBlankItemSchema = z.object({
  sentence: z.string().min(10).max(200), // must contain "___" marker
  answer: z.string().min(2).max(30),
  alternatives: z.array(z.string().min(1).max(30)).max(3).optional(),
  hint: z.string().min(4).max(160),
});

export const FillBlankSpecSchema = z.object({
  kind: z.literal("fill-in-blank"),
  items: z.array(FillBlankItemSchema).min(5).max(8),
  xpPerCorrect: z.number().int().min(5).max(25),
});

/* ---------- Calc-sprint (60s mental math, finance-flavored) ---------- */

export const CalcItemSchema = z.object({
  expression: z.string().min(3).max(60), // e.g. "12 % × 5000 zł"
  answer: z.number(),
  unit: z.string().max(20).optional(), // "zł", "%", ""
  tolerancePct: z.number().min(0).max(0.2).default(0),
});

export const CalcSpecSchema = z.object({
  kind: z.literal("calc-sprint"),
  items: z.array(CalcItemSchema).min(8).max(14),
  durationSec: z.number().int().min(30).max(120).default(60),
  xpPerCorrect: z.number().int().min(4).max(12),
});

/* ---------- Budget-allocate (split 100% across categories) ---------- */

export const BudgetCategorySchema = z.object({
  label: z.string().min(2).max(40),
  targetPct: z.number().int().min(0).max(100),
  tolerancePct: z.number().int().min(1).max(30),
  explanation: z.string().min(10).max(240),
});

export const BudgetSpecSchema = z.object({
  kind: z.literal("budget-allocate"),
  scenario: z.string().min(10).max(200), // e.g. "Masz 4500 zł netto, Kraków, 22 lat, single"
  incomeLabel: z.string().min(3).max(40),
  categories: z.array(BudgetCategorySchema).min(3).max(5),
  xpPerOnTarget: z.number().int().min(10).max(40),
});

/* ---------- What-if (scenario-driven multi-step reasoning) ---------- */

export const WhatIfStepSchema = z.object({
  prompt: z.string().min(10).max(200),
  options: z.array(z.string().min(1).max(120)).length(3),
  correctIndex: z.number().int().min(0).max(2),
  explanation: z.string().min(10).max(300),
});

export const WhatIfSpecSchema = z.object({
  kind: z.literal("what-if"),
  scenario: z.string().min(20).max(400),
  steps: z.array(WhatIfStepSchema).min(3).max(5),
  xpPerCorrect: z.number().int().min(10).max(30),
});

/* ---------- Chart-read (SVG chart + one multiple-choice question) ---------- */

export const ChartPointSchema = z.object({
  x: z.union([z.number(), z.string().max(12)]),
  y: z.number(),
});

export const ChartReadSpecSchema = z.object({
  kind: z.literal("chart-read"),
  chartType: z.enum(["line", "bar"]),
  chartTitle: z.string().min(3).max(80),
  xLabel: z.string().max(40),
  yLabel: z.string().max(40),
  points: z.array(ChartPointSchema).min(4).max(12),
  question: z.string().min(8).max(200),
  options: z.array(z.string().min(1).max(120)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(300),
  xpPerCorrect: z.number().int().min(10).max(40),
});

export const GameSpecSchema = z.discriminatedUnion("kind", [
  QuizSpecSchema,
  ScrambleSpecSchema,
  PriceGuessSpecSchema,
  TrueFalseSpecSchema,
  MatchPairsSpecSchema,
  OrderSpecSchema,
  MemorySpecSchema,
  FillBlankSpecSchema,
  CalcSpecSchema,
  BudgetSpecSchema,
  WhatIfSpecSchema,
  ChartReadSpecSchema,
]);
export type GameSpec = z.infer<typeof GameSpecSchema>;

/* ---------- Localized spec ---------- */

export const LocalizedSpecSchema = z.object({
  pl: GameSpecSchema,
  uk: GameSpecSchema,
  cs: GameSpecSchema,
  en: GameSpecSchema,
});
export type LocalizedSpec = z.infer<typeof LocalizedSpecSchema>;

// Accept EITHER shape at read-time: old records (pre-multi-lang) stored a
// bare GameSpec; new records store LocalizedSpec. On publish we always
// write the new shape; the union here keeps already-live legacy games
// playable until their 48h TTL elapses.
export const SpecFieldSchema = z.union([
  LocalizedSpecSchema,
  GameSpecSchema,
]);
export type SpecField = z.infer<typeof SpecFieldSchema>;

export function isLocalizedSpec(s: SpecField): s is LocalizedSpec {
  return !("kind" in s);
}

export function resolveSpecForLang(s: SpecField, lang: Lang): GameSpec {
  if (!isLocalizedSpec(s)) return s;
  return s[lang] ?? s.pl;
}

/* ---------- Outer envelope stored in Redis ---------- */

export const AiGameSchema = z.object({
  id: z.string().regex(/^ai-[a-z0-9]+$/),
  title: z.string().min(3).max(60),
  tagline: z.string().max(140),
  description: z.string().max(600),
  theme: z.string().max(80),
  source: z.string().max(200).optional(),
  buildingName: z.string().max(60),
  buildingGlyph: z.string().max(4),
  buildingRoof: z.string().max(60),
  buildingBody: z.string().max(60),
  spec: SpecFieldSchema,
  generatedAt: z.number().int(),
  validUntil: z.number().int(),
  model: z.string().max(60),
  seed: z.number().int(),
  // Phase 5.2.6: deterministic sha256 over canonicalised spec. Optional so
  // pre-5.2 envelopes keep validating; new publishes always set it.
  contentHash: z.string().length(64).optional(),
});
export type AiGame = z.infer<typeof AiGameSchema>;

/* ---------- Helpers ---------- */

export function xpCapForSpec(spec: GameSpec): number {
  if (spec.kind === "quiz") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "scramble") return spec.words.length * spec.xpPerWord;
  if (spec.kind === "price-guess") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "true-false") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "match-pairs") return spec.pairs.length * spec.xpPerMatch;
  if (spec.kind === "order") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "memory") return spec.pairs.length * spec.xpPerMatch;
  if (spec.kind === "fill-in-blank") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "calc-sprint") return spec.items.length * spec.xpPerCorrect;
  if (spec.kind === "budget-allocate")
    return spec.categories.length * spec.xpPerOnTarget;
  if (spec.kind === "what-if") return spec.steps.length * spec.xpPerCorrect;
  if (spec.kind === "chart-read") return spec.xpPerCorrect; // single question
  return 100;
}

export type SpecKind = GameSpec["kind"];

// Primary "kind" — all four langs share it by construction. Use PL as canonical.
export function specKind(spec: SpecField): SpecKind {
  return isLocalizedSpec(spec) ? spec.pl.kind : spec.kind;
}

// Any-lang cap: XP thresholds are identical across langs by construction.
export function xpCapForAnyLang(spec: SpecField): number {
  return xpCapForSpec(isLocalizedSpec(spec) ? spec.pl : spec);
}

export { LANGS };
export type { Lang };

/* ---------- Rotation policy ---------- */

// Watt City: hourly rotation. Live games retire at `validUntil` (now + 1h on publish);
// after retirement the envelope is preserved forever so past AI games remain playable
// at /games/ai/<id>, and leaderboards/medals stick. MAX_ACTIVE_AI_GAMES caps the live
// index (see publish.ts step 6).
export const ROTATION_HOURS = 1;
export const MAX_ACTIVE_AI_GAMES = 3;
// Unused — envelopes persist without TTL (publish.ts step 6). Kept for backward compat
// with any external consumer that imports this constant.
export const AI_GAME_TTL_SECONDS = ROTATION_HOURS * 60 * 60 * 2;
