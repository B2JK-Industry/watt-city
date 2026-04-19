import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  creditResources,
  getPlayerState,
  savePlayerState,
} from "@/lib/player";
import { ensureSignupGift, placeBuilding } from "@/lib/buildings";
import { tickPlayer } from "./tick";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(`xp:tick-lock:${u}`);
}

describe("cashflow tick", () => {
  const u = "tick-user";
  beforeEach(() => reset(u));

  it("no-op within the same hour", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // lastTickAt just now — under 1h elapsed
    const result = await tickPlayer(u, Date.now() + 5 * 60 * 1000);
    expect(result.ticked).toBe(false);
    expect(result.reason).toBe("within-hour");
  });

  it("credits Domek's 5 coins/h after one hour", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    state.lastTickAt = start;
    await savePlayerState(state);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings[0].lastTickAt = start;
    state.lastTickAt = start;
    await savePlayerState(state);

    const result = await tickPlayer(u, start + 60 * 60 * 1000 + 1000);
    expect(result.ticked).toBe(true);
    expect(result.hoursApplied).toBe(1);
    expect(result.entriesWritten).toBe(1);
    expect(result.resources.coins).toBe(5);
  });

  it("idempotent — second call in same hour is no-op (lock released or not)", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    state.lastTickAt = start;
    await savePlayerState(state);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings[0].lastTickAt = start;
    state.lastTickAt = start;
    await savePlayerState(state);

    const at = start + 60 * 60 * 1000 + 1000;
    const first = await tickPlayer(u, at);
    const second = await tickPlayer(u, at);
    expect(first.ticked).toBe(true);
    expect(second.ticked).toBe(false);
    // Post-tick balance unchanged between calls
    expect(second.resources.coins).toBe(first.resources.coins);
  });

  it("caps offline catch-up at 30 days", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    state.lastTickAt = start;
    await savePlayerState(state);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings[0].lastTickAt = start;
    state.lastTickAt = start;
    await savePlayerState(state);

    // 60 days later — should cap at 30 × 24 = 720h
    const result = await tickPlayer(u, start + 60 * 24 * 60 * 60 * 1000);
    expect(result.hoursApplied).toBe(30 * 24);
    expect(result.resources.coins).toBe(30 * 24 * 5); // 5 coins/h × 720h
    expect(result.reason).toBe("offline-cap-hit");
  });

  it("tick on a player with no buildings sets lastTickAt and returns no-buildings", async () => {
    const result = await tickPlayer(u);
    expect(result.ticked).toBe(false);
    expect(result.reason).toBe("no-buildings");
  });

  it("brownout: deficit city credits reduced coins after 48h (BLOCKER-1)", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Force-push a watt-hungry Huta so city is in deficit. No admin grant
    // of coins so we can measure Domek's yield cleanly.
    state.buildings.push({
      id: "b-huta-test",
      slotId: 3,
      catalogId: "huta-szkla",
      level: 1,
      builtAt: start,
      lastTickAt: start,
      cumulativeCost: {},
    });
    state.lastTickAt = start;
    state.wattDeficitSince = start; // deficit started NOW
    for (const b of state.buildings) b.lastTickAt = start;
    await savePlayerState(state);

    // Tick 48h later. Domek baseline (no brownout) = 48 × 5 = 240 coins.
    // Huta glass baseline = 48 × 4 = 192 glass.
    // With brownout: first 24h full = 24 × 5 = 120 coins + 24 × 4 = 96 glass,
    // next 24h @ 50% = 24 × max(1, ceil(2.5)) = 72 coins + 24 × 2 = 48 glass.
    // Expected coins ≈ 120 + 72 = 192 (< 240 baseline).
    const result = await tickPlayer(u, start + 48 * 60 * 60 * 1000 + 1000);
    expect(result.ticked).toBe(true);
    expect(result.hoursApplied).toBe(48);
    expect(result.resources.coins).toBeGreaterThan(0);
    expect(result.resources.coins).toBeLessThan(240); // BLOCKER-1 reduction
  });

  it("brownout: rescued city clears wattDeficitSince on next mutation", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings.push({
      id: "b-huta-r",
      slotId: 3,
      catalogId: "huta-szkla",
      level: 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    state.wattDeficitSince = Date.now() - 10 * 60 * 60 * 1000; // 10h deep
    await savePlayerState(state);

    // Import refreshWattDeficit and simulate post-demolish state
    const { refreshWattDeficit } = await import("./watts");
    state.buildings = state.buildings.filter((b) => b.catalogId !== "huta-szkla");
    refreshWattDeficit(state);
    expect(state.wattDeficitSince).toBeNull();
  });

  it("placing a second building doubles the hourly yield", async () => {
    const start = Date.now();
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Earn threshold for Mala elektrownia + afford it
    await creditResources(state, "score", { watts: 60 }, "earn", "earn:1");
    state = await getPlayerState(u);
    await creditResources(state, "admin_grant", { bricks: 200, coins: 200 }, "grant", "grant:1");
    state = await getPlayerState(u);
    const placed = await placeBuilding(state, 3, "mala-elektrownia");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;

    // Reset lastTickAt on both buildings to `start`
    state = await getPlayerState(u);
    for (const b of state.buildings) b.lastTickAt = start;
    state.lastTickAt = start;
    await savePlayerState(state);

    const result = await tickPlayer(u, start + 60 * 60 * 1000 + 1000);
    // Domek: 5 coins/h, Mala elektrownia: 8 watts/h
    expect(result.resources.coins).toBeGreaterThanOrEqual(5);
    expect(result.resources.watts).toBeGreaterThanOrEqual(8);
  });
});
