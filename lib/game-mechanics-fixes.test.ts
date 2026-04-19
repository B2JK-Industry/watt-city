/* Regression tests for V2 game-mechanic fixes that landed after the main
 * refactor merge. Every describe() block names the bug it protects.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
} from "@/lib/player";
import {
  ensureSignupGift,
  upgradeBuilding,
  canAfford,
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

  it("upgradeBuilding on signup-gift domek REJECTS with not-affordable when wallet is empty", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Wallet is empty (signup gift doesn't grant coins).
    const domek = state.buildings.find((b) => b.catalogId === "domek")!;
    const result = await upgradeBuilding(state, domek.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("not-affordable");
  });

  it("upgradeBuilding on domek succeeds only after the player earns enough coins", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    const domek = getCatalogEntry("domek")!;
    const nextCost = costAtLevel(domek.baseCost, 2);
    // Grant exactly the required amount.
    await creditResources(
      state,
      "admin_grant",
      nextCost,
      "fix-domek-test",
      `grant:${u}`,
    );
    state = await getPlayerState(u);
    const instance = state.buildings.find((b) => b.catalogId === "domek")!;
    expect(canAfford(state.resources, nextCost)).toBe(true);
    const result = await upgradeBuilding(state, instance.id);
    expect(result.ok).toBe(true);
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
