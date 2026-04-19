import { describe, it, expect } from "vitest";
import {
  ACTIVE_RESOURCE_KEYS,
  DEPRECATED_RESOURCE_KEYS,
  EVERGREEN_YIELDS,
  AI_KIND_YIELDS,
  RESOURCE_DEFS,
  RESOURCE_KEYS,
  type ResourceKey,
} from "./resources";

/* V2 R1.1 invariants — the refactor promises no new writes to
 * glass/steel/code. Stored legacy values are preserved in the shape
 * (for migration) but never minted going forward. */

describe("V2 resource surface", () => {
  it("ACTIVE + DEPRECATED partition covers RESOURCE_KEYS", () => {
    const partition = new Set<ResourceKey>([
      ...ACTIVE_RESOURCE_KEYS,
      ...DEPRECATED_RESOURCE_KEYS,
    ]);
    for (const k of RESOURCE_KEYS) {
      expect(partition.has(k)).toBe(true);
    }
  });

  it("ACTIVE = {watts, coins, bricks, cashZl} — no overlap with deprecated", () => {
    expect(ACTIVE_RESOURCE_KEYS).toEqual(["watts", "coins", "bricks", "cashZl"]);
    for (const d of DEPRECATED_RESOURCE_KEYS) {
      expect(ACTIVE_RESOURCE_KEYS).not.toContain(d);
    }
  });

  it("every deprecated key has deprecated=true and mvpActive=false on its Def", () => {
    for (const k of DEPRECATED_RESOURCE_KEYS) {
      expect(RESOURCE_DEFS[k].deprecated).toBe(true);
      expect(RESOURCE_DEFS[k].mvpActive).toBe(false);
    }
  });

  it("no active yield map ever produces a deprecated key", () => {
    for (const [gameId, rule] of Object.entries(EVERGREEN_YIELDS)) {
      expect(
        DEPRECATED_RESOURCE_KEYS.includes(rule.primary),
        `${gameId} primary=${rule.primary} is deprecated`,
      ).toBe(false);
      if (rule.secondary) {
        expect(
          DEPRECATED_RESOURCE_KEYS.includes(rule.secondary),
          `${gameId} secondary=${rule.secondary} is deprecated`,
        ).toBe(false);
      }
    }
    for (const [kind, rule] of Object.entries(AI_KIND_YIELDS)) {
      expect(
        DEPRECATED_RESOURCE_KEYS.includes(rule.primary),
        `AI kind ${kind} primary=${rule.primary} is deprecated`,
      ).toBe(false);
      if (rule.secondary) {
        expect(
          DEPRECATED_RESOURCE_KEYS.includes(rule.secondary),
          `AI kind ${kind} secondary=${rule.secondary} is deprecated`,
        ).toBe(false);
      }
    }
  });

  it("every AI kind still has a yield rule (no game becomes unrewarded)", () => {
    const kinds = [
      "quiz", "scramble", "price-guess", "true-false", "match-pairs",
      "order", "memory", "fill-in-blank", "calc-sprint", "portfolio-pick",
      "budget-allocate", "what-if", "dialog", "chart-read", "negotiate",
      "timeline-build", "invest-sim", "tax-fill",
    ];
    for (const k of kinds) {
      expect(AI_KIND_YIELDS[k], `kind ${k} has no yield rule`).toBeTruthy();
    }
  });
});
