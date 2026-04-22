/* Regression tests for V2 game-mechanic fixes that landed after the main
 * refactor merge. Every describe() block names the bug it protects.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
} from "@/lib/player";
import {
  ensureSignupGift,
  upgradeBuilding,
} from "@/lib/buildings";
import {
  getCatalogEntry,
  costAtLevel,
} from "@/lib/building-catalog";
import {
  computeBuildingValue,
  cityValueRank,
  CITY_VALUE_KEY,
} from "@/lib/city-value";

async function reset(u: string) {
  await Promise.all([
    kvDel(`xp:player:${u}`),
    kvDel(`xp:player:${u}:ledger`),
    kvDel(`xp:player:${u}:ledger-dedup`),
    kvDel(CITY_VALUE_KEY),
  ]);
}

describe("fix: Domek is no longer free to upgrade (exploit closed)", () => {
  const u = "fix-domek-user";
  beforeEach(() => reset(u));

  it("domek.baseCost is not the empty object", () => {
    const domek = getCatalogEntry("domek");
    expect(domek).not.toBeNull();
    expect(Object.keys(domek!.baseCost).length).toBeGreaterThan(0);
  });

  it("costAtLevel(domek.baseCost, 2) produces a non-empty cost", () => {
    const domek = getCatalogEntry("domek")!;
    const cost = costAtLevel(domek.baseCost, 2);
    expect(Object.keys(cost).length).toBeGreaterThan(0);
    expect(cost.coins!).toBeGreaterThan(0);
  });

  it("upgradeBuilding on domek DOES deduct cost (exploit closed — upgrade is no longer free)", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // V3.2: signup now grants 50 coins + 50 bricks — enough to cover
    // Domek L1→L2 (32 coins). The "exploit closed" invariant is that
    // the upgrade COSTS coins (not that it's blocked), so assert the
    // balance drops by the expected amount after upgrading.
    const before = state.resources.coins;
    const domek = getCatalogEntry("domek")!;
    const nextCost = costAtLevel(domek.baseCost, 2);
    expect((nextCost.coins ?? 0) > 0).toBe(true);
    const instance = state.buildings.find((b) => b.catalogId === "domek")!;
    const result = await upgradeBuilding(state, instance.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = await getPlayerState(u);
    expect(after.resources.coins).toBe(before - (nextCost.coins ?? 0));
  });

  it("upgradeBuilding on domek REJECTS when coins drop below next-level cost", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Drain coins so the upgrade can't afford itself.
    state.resources.coins = 0;
    await (await import("@/lib/player")).savePlayerState(state);
    state = await getPlayerState(u);
    const instance = state.buildings.find((b) => b.catalogId === "domek")!;
    const result = await upgradeBuilding(state, instance.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not-affordable");
  });
});

describe("fix: Domek now contributes to city-value leaderboard", () => {
  it("computeBuildingValue reports positive value for a signup-gift Domek", () => {
    const domek = getCatalogEntry("domek")!;
    const instance = {
      id: "b",
      slotId: 10,
      catalogId: "domek",
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    };
    const v = computeBuildingValue([instance]);
    expect(v).toBeGreaterThan(0);
    // Matches baseCost.coins × level (20 × 1 at L1)
    expect(v).toBe(domek.baseCost.coins);
  });

  it("fresh signup player appears on the city-value leaderboard (non-null rank)", async () => {
    const u = "fix-rank-user";
    await reset(u);
    const state = await getPlayerState(u);
    await ensureSignupGift(state);
    // ensureSignupGift calls refreshCityValue internally.
    const rank = await cityValueRank(u);
    expect(rank).not.toBeNull();
  });
});

describe("fix: AI-seed pool has no duplicate building glyphs", () => {
  it("every rotation seed has a distinct buildingGlyph", async () => {
    const { listResearchSeeds } = await import("@/lib/ai-pipeline/research");
    const seeds = listResearchSeeds();
    const glyphs = seeds.map((s) => s.buildingGlyph);
    const unique = new Set(glyphs);
    // Every theme must have its own visual identity so two live AI games
    // never look identical on the city scene.
    expect(unique.size).toBe(glyphs.length);
  });
});
