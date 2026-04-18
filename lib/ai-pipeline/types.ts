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

export const GameSpecSchema = z.discriminatedUnion("kind", [
  QuizSpecSchema,
  ScrambleSpecSchema,
  PriceGuessSpecSchema,
  TrueFalseSpecSchema,
  MatchPairsSpecSchema,
  OrderSpecSchema,
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

export const ROTATION_HOURS = 24;
export const MAX_ACTIVE_AI_GAMES = 3;
export const AI_GAME_TTL_SECONDS = ROTATION_HOURS * 60 * 60 * 2;
