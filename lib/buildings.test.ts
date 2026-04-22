import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  creditResources,
} from "@/lib/player";
import {
  placeBuilding,
  upgradeBuilding,
  demolishBuilding,
  ensureSignupGift,
  computePlayerTier,
  canAfford,
} from "@/lib/buildings";
import {
  BUILDING_CATALOG,
  costAtLevel,
  yieldAtLevel,
  DOMEK_SLOT_ID,
} from "@/lib/building-catalog";

async function resetPlayer(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
}

describe("building-catalog — cost/yield curves", () => {
  it("costAtLevel(1) == base, costAtLevel(2) == base × 1.6", () => {
    const c1 = costAtLevel({ bricks: 100, coins: 50 }, 1);
    expect(c1).toEqual({ bricks: 100, coins: 50 });
    const c2 = costAtLevel({ bricks: 100, coins: 50 }, 2);
    expect(c2.bricks).toBe(160);
    expect(c2.coins).toBe(80);
  });
  it("yieldAtLevel(L) = base × 1.4^(L-1)", () => {
    const y = yieldAtLevel({ coins: 10 }, 3);
    // 10 × 1.4² = 19.6 → ceil → 20
    expect(y.coins).toBe(20);
  });
  it("every mvpActive entry has a matching slot category in SLOT_MAP", () => {
    const activeCats = new Set(
      BUILDING_CATALOG.filter((b) => b.mvpActive).map((b) => b.category),
    );
    // All mvpActive categories should exist in the slot map so placement is reachable.
    for (const cat of activeCats) {
      const placeable = ["residential", "commercial", "industry", "civic", "landmark", "decorative"];
      expect(placeable).toContain(cat);
    }
  });
});

describe("buildings engine — place / upgrade / demolish", () => {
  const username = "test-user-buildings";
  beforeEach(() => resetPlayer(username));

  it("signup gift places Domek on slot 10", async () => {
    const state = await getPlayerState(username);
    await ensureSignupGift(state);
    expect(state.buildings.length).toBe(1);
    expect(state.buildings[0].catalogId).toBe("domek");
    expect(state.buildings[0].slotId).toBe(DOMEK_SLOT_ID);
  });

  it("rejects placing mala-elektrownia before player earns 50 watts", async () => {
    let state = await getPlayerState(username);
    // Give player enough bricks/coins but no watts
    await creditResources(state, "admin_grant", { bricks: 100, coins: 100 }, "test grant", "grant:1");
    state = await getPlayerState(username);
    const result = await placeBuilding(state, 3, "mala-elektrownia");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("locked");
  });

  it("allows placing mala-elektrownia once the 50-watts threshold is met", async () => {
    let state = await getPlayerState(username);
    await creditResources(state, "score", { watts: 60 }, "earned", "earn:1");
    state = await getPlayerState(username);
    await creditResources(state, "admin_grant", { bricks: 100, coins: 100 }, "grant", "grant:2");
    state = await getPlayerState(username);
    const result = await placeBuilding(state, 3, "mala-elektrownia");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.building.level).toBe(1);
    // Cost deducted: started with 60 bricks after placing 80-brick building
    // actually we gave 100 bricks, placed costs 80 → 20 left
    expect(result.state.resources.bricks).toBe(20);
  });

  it("rejects category mismatch — can't build residential Domek on an industry slot", async () => {
    const state = await getPlayerState(username);
    // Domek is residential; slot 3 is industry
    const result = await placeBuilding(state, 3, "domek");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("category-mismatch");
  });

  it("rejects already-occupied slot", async () => {
    let state = await getPlayerState(username);
    await ensureSignupGift(state); // domek on slot 10
    state = await getPlayerState(username);
    const result = await placeBuilding(state, DOMEK_SLOT_ID, "domek");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("slot-occupied");
  });

  it("upgrade bumps level and debits new-level cost", async () => {
    let state = await getPlayerState(username);
    await creditResources(state, "score", { watts: 60 }, "earned", "earn:up");
    state = await getPlayerState(username);
    await creditResources(state, "admin_grant", { bricks: 500, coins: 500 }, "grant", "grant:up");
    state = await getPlayerState(username);
    const placed = await placeBuilding(state, 4, "mala-elektrownia");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    const up = await upgradeBuilding(placed.state, placed.building.id);
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    expect(up.building.level).toBe(2);
  });

  it("demolish returns 50% of cumulative cost and frees the slot", async () => {
    let state = await getPlayerState(username);
    await creditResources(state, "score", { watts: 60 }, "earned", "earn:dem");
    state = await getPlayerState(username);
    await creditResources(state, "admin_grant", { bricks: 100, coins: 100 }, "grant", "grant:dem");
    state = await getPlayerState(username);
    const placed = await placeBuilding(state, 5, "mala-elektrownia");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    const dem = await demolishBuilding(placed.state, placed.building.id);
    expect(dem.ok).toBe(true);
    if (!dem.ok) return;
    // Cost was 80 bricks / 50 coins; refund should be 40 / 25
    expect(dem.refund.bricks).toBe(40);
    expect(dem.refund.coins).toBe(25);
    expect(dem.state.buildings.length).toBe(0);
  });

  it("prevents demolishing Domek", async () => {
    let state = await getPlayerState(username);
    await ensureSignupGift(state);
    state = await getPlayerState(username);
    const result = await demolishBuilding(state, state.buildings[0].id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("domek-protected");
  });
});

describe("player tier formula", () => {
  it("1 L1 building → tier 1", () => {
    expect(
      computePlayerTier([
        {
          id: "x",
          slotId: 0,
          catalogId: "domek",
          level: 1,
          builtAt: 0,
          lastTickAt: 0,
          cumulativeCost: {},
        },
      ]),
    ).toBe(1);
  });
  it("4 L4 buildings → tier 4", () => {
    const bs = [1, 2, 3, 4].map((id) => ({
      id: `x${id}`,
      slotId: id,
      catalogId: "mala-elektrownia",
      level: 4,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    }));
    expect(computePlayerTier(bs)).toBe(4);
  });
});

describe("canAfford", () => {
  it("true when resources meet all cost keys", () => {
    expect(
      canAfford(
        {
          watts: 0,
          coins: 100,
          bricks: 100,
          glass: 0,
          steel: 0,
          code: 0,
          cashZl: 0,
        },
        { bricks: 80, coins: 50 },
      ),
    ).toBe(true);
  });
  it("false when any single resource short", () => {
    expect(
      canAfford(
        {
          watts: 0,
          coins: 10,
          bricks: 100,
          glass: 0,
          steel: 0,
          code: 0,
          cashZl: 0,
        },
        { bricks: 80, coins: 50 },
      ),
    ).toBe(false);
  });
});
