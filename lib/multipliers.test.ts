import { describe, it, expect } from "vitest";
import {
  scoreMultiplier,
  scoreMultiplierBreakdown,
  citywideScoreMultiplier,
  ladderSummary,
  SCORE_MULT_CAP,
} from "./multipliers";
import type { BuildingInstance } from "@/lib/player";

function b(catalogId: string, level = 1, slotId = 0): BuildingInstance {
  return {
    id: `${catalogId}-${slotId}`,
    slotId,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

describe("score-time multipliers", () => {
  it("no buildings → 1×", () => {
    expect(scoreMultiplier([], "quiz")).toBe(1);
  });

  it("biblioteka gives +20% on quiz/true-false", () => {
    const m = scoreMultiplier([b("biblioteka")], "quiz");
    expect(m).toBeCloseTo(1.2, 5);
  });

  it("biblioteka doesn't boost an unrelated kind", () => {
    const m = scoreMultiplier([b("biblioteka")], "scramble");
    expect(m).toBe(1);
  });

  it("gimnazjum boosts reflex games (math-sprint)", () => {
    const m = scoreMultiplier([b("gimnazjum-sportowe")], "math-sprint");
    expect(m).toBeCloseTo(1.2, 5);
  });

  it("centrum boosts analytical games (chart-read)", () => {
    const m = scoreMultiplier([b("centrum-nauki")], "chart-read");
    expect(m).toBeCloseTo(1.2, 5);
  });

  it("stacks biblioteka + spodek on a quiz game", () => {
    const m = scoreMultiplier([b("biblioteka"), b("spodek")], "quiz");
    // 1 * 1.2 * 1.05 = 1.26
    expect(m).toBeCloseTo(1.26, 2);
  });

  it("citywideScoreMultiplier returns only landmark product", () => {
    const m = citywideScoreMultiplier([b("biblioteka"), b("spodek")]);
    expect(m).toBeCloseTo(1.05, 5);
  });

  it("caps at ×3 per HIGH-4 (tightened from V1 5×)", () => {
    // 100 spodeks would otherwise explode
    const buildings = Array.from({ length: 100 }, (_, i) =>
      b("spodek", 1, i),
    );
    expect(scoreMultiplier(buildings, "quiz")).toBe(3);
    expect(SCORE_MULT_CAP).toBe(3);
  });
});

describe("V2 R3.4 — scoreMultiplierBreakdown (HIGH-4 post-game transparency)", () => {
  it("empty city → only base factor, finalMultiplier=1, capped=false", () => {
    const r = scoreMultiplierBreakdown([], "quiz");
    expect(r.factors).toHaveLength(1);
    expect(r.factors[0].source).toBe("base");
    expect(r.rawMultiplier).toBe(1);
    expect(r.finalMultiplier).toBe(1);
    expect(r.capped).toBe(false);
  });

  it("Biblioteka + quiz → one +20% factor tagged with biblioteka source", () => {
    const r = scoreMultiplierBreakdown([b("biblioteka")], "quiz");
    expect(r.factors).toHaveLength(2);
    expect(r.factors[1].source).toBe("biblioteka");
    expect(r.factors[1].factor).toBeCloseTo(1.2);
    expect(r.finalMultiplier).toBeCloseTo(1.2);
  });

  it("Biblioteka irrelevant to reflex games (no factor added)", () => {
    const r = scoreMultiplierBreakdown([b("biblioteka")], "power-flip");
    expect(r.factors).toHaveLength(1);
    expect(r.finalMultiplier).toBe(1);
  });

  it("Spodek citywide applies to every game as +5%", () => {
    const r = scoreMultiplierBreakdown([b("spodek")], "power-flip");
    expect(r.factors).toHaveLength(2);
    expect(r.factors[1].factor).toBeCloseTo(1.05);
  });

  it("stack under cap → not capped, raw equals final", () => {
    // 4 libraries on quiz: 1.2^4 = 2.0736 → under 3
    const multi = Array.from({ length: 4 }, (_, i) => b("biblioteka", 1, i));
    const r = scoreMultiplierBreakdown(multi, "quiz");
    expect(r.rawMultiplier).toBeCloseTo(1.2 ** 4);
    expect(r.finalMultiplier).toBeCloseTo(1.2 ** 4);
    expect(r.capped).toBe(false);
  });

  it("stack over cap → capped=true, finalMultiplier=3", () => {
    // 8 libraries: 1.2^8 ≈ 4.3 → capped
    const multi = Array.from({ length: 8 }, (_, i) => b("biblioteka", 1, i));
    const r = scoreMultiplierBreakdown(multi, "quiz");
    expect(r.rawMultiplier).toBeGreaterThan(SCORE_MULT_CAP);
    expect(r.finalMultiplier).toBe(SCORE_MULT_CAP);
    expect(r.capped).toBe(true);
  });

  it("HIGH-4 invariant: scoreMultiplier() always equals breakdown.finalMultiplier", () => {
    // The exact regression called out in the review:
    // "displayed breakdown sums to credited amount".
    const scenarios: [BuildingInstance[], string][] = [
      [[], "quiz"],
      [[b("biblioteka")], "quiz"],
      [[b("biblioteka"), b("spodek")], "quiz"],
      [[b("gimnazjum-sportowe")], "math-sprint"],
      [Array.from({ length: 10 }, (_, i) => b("biblioteka", 1, i)), "quiz"],
    ];
    for (const [buildings, kind] of scenarios) {
      const direct = scoreMultiplier(buildings, kind);
      const viaBreakdown =
        scoreMultiplierBreakdown(buildings, kind).finalMultiplier;
      expect(direct).toBe(viaBreakdown);
    }
  });
});

describe("ladderSummary", () => {
  it("no factors → 'base = final' with no chain", () => {
    const r = scoreMultiplierBreakdown([], "quiz");
    expect(ladderSummary(50, r)).toBe("50 = 50");
  });

  it("with factors shows the chain + final", () => {
    const r = scoreMultiplierBreakdown([b("biblioteka")], "quiz");
    const s = ladderSummary(50, r);
    expect(s).toContain("50");
    expect(s).toContain("×");
    expect(s).toContain("1.2");
    expect(s).toContain("= 60");
  });

  it("appends cap note when cap hit", () => {
    const buildings = Array.from({ length: 10 }, (_, i) =>
      b("biblioteka", 1, i),
    );
    const r = scoreMultiplierBreakdown(buildings, "quiz");
    expect(r.capped).toBe(true);
    expect(ladderSummary(50, r)).toContain("cap ×3");
  });
});
