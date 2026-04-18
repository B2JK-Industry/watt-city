import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  creditResources,
  savePlayerState,
} from "@/lib/player";
import {
  ensureSignupGift,
  lifetimeStatsFor,
  computePlayerTier,
} from "@/lib/buildings";
import { tickPlayer } from "@/lib/tick";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(`xp:tick-lock:${u}`);
}

describe("lifetimeStatsFor", () => {
  const u = "stats-user";
  beforeEach(() => reset(u));

  it("returns null for an unknown instance", async () => {
    const state = await getPlayerState(u);
    const s = await lifetimeStatsFor(state, "does-not-exist");
    expect(s).toBeNull();
  });

  it("sums tick-kind deltas into totalProduced for the domek", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    state.lastTickAt = start;
    await savePlayerState(state);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings[0].lastTickAt = start;
    state.lastTickAt = start;
    await savePlayerState(state);
    // Advance 2 hours → 2 tick credits of 5 coins each
    await tickPlayer(u, start + 2 * 60 * 60 * 1000 + 1000);
    const after = await getPlayerState(u);
    const stats = await lifetimeStatsFor(after, after.buildings[0].id);
    expect(stats).not.toBeNull();
    expect(stats!.totalProduced.coins).toBeGreaterThanOrEqual(10);
    expect(stats!.ageHours).toBeGreaterThanOrEqual(0);
  });
});

describe("computePlayerTier formula", () => {
  it("4 L4 buildings → tier 4 (sqrt(16))", () => {
    const tier = computePlayerTier(
      [1, 2, 3, 4].map((slotId) => ({
        id: `x-${slotId}`,
        slotId,
        catalogId: "mala-elektrownia",
        level: 4,
        builtAt: 0,
        lastTickAt: 0,
        cumulativeCost: {},
      })),
    );
    expect(tier).toBe(4);
  });
  it("no buildings → tier 1 floor", () => {
    expect(computePlayerTier([])).toBe(1);
  });
});
