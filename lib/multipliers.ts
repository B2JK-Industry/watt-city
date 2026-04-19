/* Score-time multipliers — Phase 2.4 / V2 refactor R3.4 (HIGH-4).
 *
 * Buildings with a `multiplier` field boost the resource yield of specific
 * game kinds when the player owns them. Effects stack multiplicatively,
 * **capped at ×3 per HIGH-4** (tightened down from the V1 ×5 cap because
 * stacked multipliers were producing 0.24× to 3.96× variance on the same
 * game — broke the post-game transparency goal).
 *
 * Target mapping:
 *   "citywide-all"      → applies to every score + tick (handled in tick.ts)
 *   "quiz-true-false"   → quiz, true-false, finance-quiz (evergreen)
 *   "order-match"       → order, match-pairs, chart-read, portfolio-pick
 *   "reflex"            → power-flip, energy-dash, math-sprint, calc-sprint
 */

import type { BuildingInstance } from "@/lib/player";
import { getCatalogEntry } from "@/lib/building-catalog";
import type { Lang } from "@/lib/i18n";

export const SCORE_MULT_CAP = 3; // HIGH-4: tightened from V1's 5×

const KIND_GROUPS: Record<string, Set<string>> = {
  "quiz-true-false": new Set([
    "quiz",
    "true-false",
    "finance-quiz",
  ]),
  "order-match": new Set([
    "order",
    "match-pairs",
    "chart-read",
    "portfolio-pick",
    "memory",
  ]),
  reflex: new Set([
    "power-flip",
    "energy-dash",
    "math-sprint",
    "calc-sprint",
    "currency-rush",
    "stock-tap",
  ]),
};

/** Compute the score-time multiplier for a given gameId/aiKind. Thin
 *  wrapper over scoreMultiplierBreakdown — the breakdown is the source
 *  of truth so the HIGH-4 regression (displayed ladder matches credited
 *  amount) holds by construction. */
export function scoreMultiplier(
  buildings: BuildingInstance[],
  gameIdOrKind: string,
): number {
  return scoreMultiplierBreakdown(buildings, gameIdOrKind).finalMultiplier;
}

/** Citywide-only multiplier (for tick engine). */
export function citywideScoreMultiplier(buildings: BuildingInstance[]): number {
  let mult = 1;
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry?.multiplier) continue;
    if (entry.multiplier.target === "citywide-all") {
      mult *= 1 + entry.multiplier.percent / 100;
    }
  }
  return Math.min(SCORE_MULT_CAP, mult);
}

// ---------------------------------------------------------------------------
// V2 R3.4 — multiplier breakdown (HIGH-4 post-game transparency)
// ---------------------------------------------------------------------------

/** One contributing factor in the multiplier ladder. Human-facing label is
 *  pulled from dict by `labelKey`; `percent` is the delta above 1.0 (so a
 *  +20% building bonus = factor 1.2 with percent 20). */
export type MultFactor = {
  /** Dict key under `dashboard.multFactors.*` so UI resolves localized copy. */
  labelKey: string;
  /** Falls back to this if dict misses the key. */
  labelFallback: string;
  /** The multiplier value (1.2 for +20%, etc). */
  factor: number;
  /** Source identifier (building id, multiplier-target, etc) for analytics. */
  source: string;
};

export type MultBreakdown = {
  /** Factors in the order they multiply. Always includes the base 1.0 at [0]. */
  factors: MultFactor[];
  /** Product of every factor, before the HIGH-4 cap. */
  rawMultiplier: number;
  /** True if the ×3 cap clipped the final multiplier. */
  capped: boolean;
  /** Final multiplier actually applied — `min(rawMultiplier, SCORE_MULT_CAP)`. */
  finalMultiplier: number;
};

/** Pedagogical breakdown for the post-game modal. Each contributing
 *  building surfaces as its own factor with a label the UI can render as
 *  part of the ladder: "Base × Biblioteka +20% × Spodek +5% = final".
 *
 *  ladderSummary(breakdown) returns a single-line "50 × 1.2 × 1.05 = 63"
 *  string for inline display when a full modal is overkill. */
export function scoreMultiplierBreakdown(
  buildings: BuildingInstance[],
  gameIdOrKind: string,
): MultBreakdown {
  const factors: MultFactor[] = [
    { labelKey: "base", labelFallback: "Base", factor: 1, source: "base" },
  ];
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry?.multiplier) continue;
    const target = entry.multiplier.target;
    const matches =
      target === "citywide-all" ||
      KIND_GROUPS[target]?.has(gameIdOrKind) === true;
    if (!matches) continue;
    const factor = 1 + entry.multiplier.percent / 100;
    factors.push({
      labelKey: `building.${entry.id}`,
      labelFallback: `${entry.glyph} +${entry.multiplier.percent}%`,
      factor,
      source: entry.id,
    });
  }
  const rawMultiplier = factors.reduce((p, f) => p * f.factor, 1);
  const finalMultiplier = Math.min(SCORE_MULT_CAP, rawMultiplier);
  return {
    factors,
    rawMultiplier,
    capped: rawMultiplier > SCORE_MULT_CAP,
    finalMultiplier,
  };
}

/** One-line "50 × 1.2 × 1.05 = 63" ladder. `baseValue` is the pre-
 *  multiplier yield (e.g. xp awarded before building bonuses). */
export function ladderSummary(
  baseValue: number,
  breakdown: MultBreakdown,
): string {
  const chain = breakdown.factors
    .slice(1)
    .map((f) => f.factor.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""))
    .join(" × ");
  const final = Math.ceil(baseValue * breakdown.finalMultiplier);
  if (!chain) return `${baseValue} = ${final}`;
  return `${baseValue} × ${chain} = ${final}` + (breakdown.capped ? " (cap ×3)" : "");
}

/** Resolve a localized label for a factor from the dict. Falls back to
 *  the factor's own labelFallback if the dict entry is missing — this
 *  keeps new buildings renderable without requiring a same-PR dict bump. */
export function resolveFactorLabel(
  factor: MultFactor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lang: Lang,
  dict: Record<string, unknown> = {},
): string {
  const keys = factor.labelKey.split(".");
  let node: unknown = dict;
  for (const k of keys) {
    if (node && typeof node === "object" && k in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[k];
    } else {
      return factor.labelFallback;
    }
  }
  return typeof node === "string" ? node : factor.labelFallback;
}
