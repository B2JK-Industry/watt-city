import { describe, it, expect } from "vitest";
import {
  LEVEL_UNLOCK_LADDER,
  cityLevelFromState,
  CITY_MAX_LEVEL,
} from "./city-level";
import type { BuildingInstance, PlayerState } from "./player";
import { emptyPlayerState } from "./player";

function b(catalogId: string, level = 1): BuildingInstance {
  return {
    id: `b-${catalogId}-${Math.random().toString(36).slice(2, 5)}`,
    slotId: 0,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

describe("V3.1 LEVEL_UNLOCK_LADDER", () => {
  it("has exactly CITY_MAX_LEVEL rows, one per level", () => {
    expect(LEVEL_UNLOCK_LADDER.length).toBe(CITY_MAX_LEVEL);
    for (let i = 0; i < LEVEL_UNLOCK_LADDER.length; i++) {
      expect(LEVEL_UNLOCK_LADDER[i].level).toBe(i + 1);
    }
  });

  it("every row has a non-empty title, unlock, and eduMoment", () => {
    for (const row of LEVEL_UNLOCK_LADDER) {
      expect(row.title.length).toBeGreaterThan(0);
      expect(row.unlock.length).toBeGreaterThan(0);
      expect(row.eduMoment.length).toBeGreaterThan(10);
    }
  });
});

describe("V3.1 cityLevelFromState", () => {
  function mk(buildings: BuildingInstance[]): PlayerState {
    return { ...emptyPlayerState("u"), buildings };
  }

  it("fresh signup — 0 buildings → level 1, balanced grid", () => {
    const snap = cityLevelFromState(mk([]));
    expect(snap.level).toBe(1);
    expect(snap.grid.state).toBe("balanced");
    expect(snap.grid.net).toBe(0);
    expect(snap.badgeLabel).toContain("Level 1");
    expect(snap.badgeLabel).toContain("🔌");
  });

  it("Domek + Mała elektrownia → surplus grid, ⚡ badge", () => {
    const snap = cityLevelFromState(mk([b("domek"), b("mala-elektrownia")]));
    expect(snap.grid.state).toBe("surplus");
    expect(snap.grid.net).toBeGreaterThan(0);
    expect(snap.badgeLabel).toContain("⚡");
    expect(snap.badgeLabel).toMatch(/\+\d+\/h$/);
  });

  it("Huta alone → deficit grid, ⚠️ badge, negative net", () => {
    const snap = cityLevelFromState(mk([b("huta-szkla")]));
    expect(snap.grid.state).toBe("deficit");
    expect(snap.grid.net).toBeLessThan(0);
    expect(snap.badgeLabel).toContain("⚠️");
  });

  it("every snapshot carries nextUnlocks when under max", () => {
    const snap = cityLevelFromState(mk([b("domek")]));
    expect(snap.level).toBeLessThan(CITY_MAX_LEVEL);
    expect(snap.nextUnlocks.length).toBeGreaterThan(0);
  });
});
