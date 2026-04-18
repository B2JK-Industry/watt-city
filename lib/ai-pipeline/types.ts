import { z } from "zod";

/* ==========================================================================
 * AI Game of the 6-hour — deterministic game-spec schema.
 *
 * Claude produces a JSON matching GameSpec, which the renderer (not in this
 * file) turns into a playable round. Keeping the shape strict means:
 *  - we can validate (zod) before publishing, rejecting bad output
 *  - we can version the schema and migrate
 *  - the same spec can be re-rendered offline for audit / reporting
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

export const ScrambleItemSchema = z.object({
  word: z.string().regex(/^[A-ZĄĆĘŁŃÓŚŹŻ]{4,20}$/),
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

export const GameSpecSchema = z.discriminatedUnion("kind", [
  QuizSpecSchema,
  ScrambleSpecSchema,
  PriceGuessSpecSchema,
]);
export type GameSpec = z.infer<typeof GameSpecSchema>;

/* ---------- Outer envelope stored in Redis ---------- */

export const AiGameSchema = z.object({
  id: z.string().regex(/^ai-[a-z0-9]+$/),
  title: z.string().min(3).max(60),
  tagline: z.string().max(140),
  description: z.string().max(600),
  theme: z.string().max(80),          // e.g. "Earth Hour · úspora energie"
  source: z.string().max(200).optional(), // URL or "research: <topic>"
  buildingName: z.string().max(60),   // rendered on the city slot sign
  buildingGlyph: z.string().max(4),   // single emoji
  buildingRoof: z.string().max(60),   // tailwind bg-*
  buildingBody: z.string().max(60),   // tailwind bg-*
  spec: GameSpecSchema,
  generatedAt: z.number().int(),      // epoch ms
  validUntil: z.number().int(),       // epoch ms — when the game retires
  model: z.string().max(60),          // e.g. "claude-sonnet-4-6"
  seed: z.number().int(),             // for deterministic duel variants
});
export type AiGame = z.infer<typeof AiGameSchema>;

/* ---------- Rotation policy ---------- */

export const ROTATION_HOURS = 6;
export const MAX_ACTIVE_AI_GAMES = 3; // construction site + 2 live
export const AI_GAME_TTL_SECONDS = ROTATION_HOURS * 60 * 60 * 2; // 12h Redis TTL; logic evicts at 6h
