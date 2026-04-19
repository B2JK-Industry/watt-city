import { describe, it, expect } from "vitest";
import {
  cityLevelFromBuildings,
  crossedLevelUp,
  CITY_MAX_LEVEL,
  LEVEL_UNLOCKS,
} from "./city-level";

function b(level: number) {
  return { level } as const;
}

describe("cityLevelFromBuildings", () => {
  it("empty city → level 1, 0 progress", () => {
    const r = cityLevelFromBuildings([]);
    expect(r.level).toBe(1);
    expect(r.totalPoints).toBe(0);
  });

  it("single L1 building → level 1 with partial progress toward L2", () => {
    const r = cityLevelFromBuildings([b(1)]);
    expect(r.level).toBe(1);
    expect(r.totalPoints).toBe(1);
    expect(r.progressToNext).toBeGreaterThan(0);
    expect(r.progressToNext).toBeLessThan(1);
  });

  it("3 L1 buildings = 3 points → right at L2 threshold", () => {
    const r = cityLevelFromBuildings([b(1), b(1), b(1)]);
    // 3/3 = 1, sqrt(1)=1, floor=1. But points hit the floor of L2 (3*(2-1)²=3)
    // so the floor check stays at 1; next building upgrades to L2.
    expect(r.level).toBe(1);
  });

  it("4 L1 = 4 points → L2 (sqrt(4/3)≈1.15, floor=1 — still L1)", () => {
    const r = cityLevelFromBuildings([b(1), b(1), b(1), b(1)]);
    expect(r.level).toBe(1);
  });

  it("12 points = L2 exactly (sqrt(12/3)=2)", () => {
    const r = cityLevelFromBuildings(Array.from({ length: 12 }, () => b(1)));
    expect(r.level).toBe(2);
  });

  it("300 points → capped at CITY_MAX_LEVEL", () => {
    const r = cityLevelFromBuildings(
      Array.from({ length: 300 }, () => b(1)),
    );
    expect(r.level).toBe(CITY_MAX_LEVEL);
    expect(r.progressToNext).toBe(1);
    expect(r.nextUnlocks).toEqual([]);
  });

  it("next unlocks point at LEVEL_UNLOCKS[level+1]", () => {
    const r = cityLevelFromBuildings([b(1)]);
    expect(r.level).toBe(1);
    expect(r.nextUnlocks).toEqual(LEVEL_UNLOCKS[2]);
  });

  it("negative / NaN levels are coerced to 0 toward totalPoints", () => {
    const r = cityLevelFromBuildings([b(-5), b(NaN)]);
    expect(r.totalPoints).toBe(0);
    expect(r.level).toBe(1);
  });
});

describe("crossedLevelUp", () => {
  it("3 → 4 is true", () => {
    expect(crossedLevelUp(3, 4)).toBe(true);
  });
  it("same level is false", () => {
    expect(crossedLevelUp(4, 4)).toBe(false);
  });
  it("regression (higher to lower) is false", () => {
    expect(crossedLevelUp(4, 3)).toBe(false);
  });
  it("non-finite inputs are false", () => {
    expect(crossedLevelUp(NaN, 4)).toBe(false);
    // Infinity fails the isFinite guard too — defensive.
    expect(crossedLevelUp(3, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("LEVEL_UNLOCKS", () => {
  it("has an entry for every level 1..MAX", () => {
    for (let L = 1; L <= CITY_MAX_LEVEL; L++) {
      expect(LEVEL_UNLOCKS[L], `level ${L}`).toBeTruthy();
      expect(LEVEL_UNLOCKS[L].length).toBeGreaterThan(0);
    }
  });
});
