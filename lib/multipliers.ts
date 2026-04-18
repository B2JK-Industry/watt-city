/* Score-time multipliers — Phase 2.4.
 *
 * Buildings with a `multiplier` field boost the resource yield of specific
 * game kinds when the player owns them. Effects stack multiplicatively,
 * capped at 5× per ECONOMY.md §2 stacking rule to avoid runaway combos.
 *
 * Target mapping:
 *   "citywide-all"      → applies to every score + tick (handled in tick.ts)
 *   "quiz-true-false"   → quiz, true-false, finance-quiz (evergreen)
 *   "order-match"       → order, match-pairs, chart-read, portfolio-pick
 *   "reflex"            → power-flip, energy-dash, math-sprint, calc-sprint
 */

import type { BuildingInstance } from "@/lib/player";
import { getCatalogEntry } from "@/lib/building-catalog";

export const SCORE_MULT_CAP = 5;

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

/** Compute the score-time multiplier for a given gameId/aiKind. */
export function scoreMultiplier(
  buildings: BuildingInstance[],
  gameIdOrKind: string,
): number {
  let mult = 1;
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry?.multiplier) continue;
    const target = entry.multiplier.target;
    if (target === "citywide-all") {
      mult *= 1 + entry.multiplier.percent / 100;
      continue;
    }
    const group = KIND_GROUPS[target];
    if (group?.has(gameIdOrKind)) {
      mult *= 1 + entry.multiplier.percent / 100;
    }
  }
  return Math.min(SCORE_MULT_CAP, mult);
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
