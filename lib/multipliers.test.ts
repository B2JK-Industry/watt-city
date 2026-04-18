import { describe, it, expect } from "vitest";
import { scoreMultiplier, citywideScoreMultiplier } from "./multipliers";
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

  it("caps at 5× to prevent runaway stacks", () => {
    // 100 spodeks would otherwise explode
    const buildings = Array.from({ length: 100 }, (_, i) =>
      b("spodek", 1, i),
    );
    expect(scoreMultiplier(buildings, "quiz")).toBe(5);
  });
});
