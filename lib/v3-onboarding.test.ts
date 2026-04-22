import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
} from "@/lib/player";
import {
  ensureSignupGift,
  hasReceivedStarterKit,
  lifetimeEarned,
} from "@/lib/buildings";
import {
  BUILDING_CATALOG,
  getCatalogEntry,
  isUnlocked,
  type UnlockCondition,
} from "@/lib/building-catalog";
import { ZERO_RESOURCES } from "@/lib/resources";

async function reset(u: string) {
  await Promise.all([
    kvDel(`xp:player:${u}`),
    kvDel(`xp:player:${u}:ledger`),
    kvDel(`xp:player:${u}:ledger-dedup`),
  ]);
}

describe("V3.2 catalog order — Sklepik before Mała elektrownia", () => {
  it("Sklepik appears before Mała elektrownia in BUILDING_CATALOG", () => {
    const sklepikIdx = BUILDING_CATALOG.findIndex((e) => e.id === "sklepik");
    const elIdx = BUILDING_CATALOG.findIndex((e) => e.id === "mala-elektrownia");
    expect(sklepikIdx).toBeGreaterThanOrEqual(0);
    expect(elIdx).toBeGreaterThanOrEqual(0);
    expect(sklepikIdx).toBeLessThan(elIdx);
  });

  it("Sklepik unlock is still 50 coins earned lifetime", () => {
    const entry = getCatalogEntry("sklepik")!;
    expect(entry.unlock.kind).toBe("lifetime-resource");
    if (entry.unlock.kind === "lifetime-resource") {
      expect(entry.unlock.resource).toBe("coins");
      expect(entry.unlock.amount).toBe(50);
    }
  });

  it("Mała elektrownia unlocks EITHER via 50 watts OR has-sklepik", () => {
    const entry = getCatalogEntry("mala-elektrownia")!;
    expect(entry.unlock.kind).toBe("any-of");
    if (entry.unlock.kind !== "any-of") return;
    const kinds = entry.unlock.conditions.map((c) => c.kind);
    expect(kinds).toContain("lifetime-resource");
    expect(kinds).toContain("has-building");
  });
});

describe("V3.2 isUnlocked — has-building + any-of", () => {
  const domekInst = { catalogId: "domek" };
  const sklepikInst = { catalogId: "sklepik" };

  it("has-building unlocks iff building exists", () => {
    const cond: UnlockCondition = { kind: "has-building", catalogId: "sklepik" };
    const entry = { ...getCatalogEntry("mala-elektrownia")!, unlock: cond };
    expect(isUnlocked(entry, ZERO_RESOURCES, 1, [])).toBe(false);
    expect(isUnlocked(entry, ZERO_RESOURCES, 1, [domekInst])).toBe(false);
    expect(isUnlocked(entry, ZERO_RESOURCES, 1, [sklepikInst])).toBe(true);
  });

  it("any-of: either sub-condition unlocks", () => {
    const entry = getCatalogEntry("mala-elektrownia")!;
    // 50 watts earned satisfies the first branch
    expect(
      isUnlocked(entry, { ...ZERO_RESOURCES, watts: 50 }, 1, []),
    ).toBe(true);
    // Sklepik built satisfies the second branch
    expect(isUnlocked(entry, ZERO_RESOURCES, 1, [sklepikInst])).toBe(true);
    // Neither → still locked
    expect(isUnlocked(entry, ZERO_RESOURCES, 1, [])).toBe(false);
    expect(isUnlocked(entry, { ...ZERO_RESOURCES, watts: 49 }, 1, [])).toBe(false);
  });
});

describe("V3.2 starter kit (signup gift)", () => {
  const u = "v3-starter-user";
  beforeEach(() => reset(u));

  it("fresh register → 50 coins + 50 bricks after ensureSignupGift", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    expect(state.resources.coins).toBe(50);
    expect(state.resources.bricks).toBe(50);
    expect(state.buildings.find((b) => b.catalogId === "domek")).toBeTruthy();
  });

  it("idempotent — second ensureSignupGift does NOT re-credit", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    const coinsAfter1 = state.resources.coins;
    const bricksAfter1 = state.resources.bricks;
    // Re-run. Starter-kit ledger SADD blocks duplicate.
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    expect(state.resources.coins).toBe(coinsAfter1);
    expect(state.resources.bricks).toBe(bricksAfter1);
  });

  it("hasReceivedStarterKit: false before, true after", async () => {
    expect(await hasReceivedStarterKit(u)).toBe(false);
    const state = await getPlayerState(u);
    await ensureSignupGift(state);
    expect(await hasReceivedStarterKit(u)).toBe(true);
  });

  it("lifetimeEarned aggregates starter kit into earned totals", async () => {
    const state = await getPlayerState(u);
    await ensureSignupGift(state);
    const fresh = await getPlayerState(u);
    const earned = await lifetimeEarned(fresh);
    expect(earned.coins).toBeGreaterThanOrEqual(50);
    expect(earned.bricks).toBeGreaterThanOrEqual(50);
  });

  it("Sklepik is affordable+unlocked with just the starter kit + 1 game win", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Starter kit alone: 50 coins → already at the 50-coin Sklepik unlock
    // threshold (lifetime, not current balance). Sklepik baseCost is
    // 60 bricks + 80 coins — starter kit has 50c/50b, one game must
    // bring both balances up. Simulate a small game-yield credit.
    const { creditResources } = await import("@/lib/player");
    await creditResources(
      state,
      "score",
      { coins: 40, bricks: 20 },
      "1st game",
      "score:stub:1",
    );
    state = await getPlayerState(u);
    const sklepik = getCatalogEntry("sklepik")!;
    const earned = await lifetimeEarned(state);
    const unlocked = isUnlocked(sklepik, earned, 1, state.buildings);
    expect(unlocked).toBe(true);
    const affordable =
      (state.resources.coins ?? 0) >= (sklepik.baseCost.coins ?? 0) &&
      (state.resources.bricks ?? 0) >= (sklepik.baseCost.bricks ?? 0);
    expect(affordable).toBe(true);
  });
});
