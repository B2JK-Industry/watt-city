import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";
import {
  flagForDeletion,
  clearDeletionFlag,
  deletionStatus,
  hardErase,
  SOFT_DELETE_GRACE_MS,
} from "./soft-delete";
import { savePlayerState, getPlayerState } from "@/lib/player";

async function reset(u: string) {
  await kvSet(`xp:user:${u}`, { username: u });
  await kvDel(`xp:user:${u}:deleted-at`);
}

describe("soft-delete flag lifecycle", () => {
  beforeEach(async () => {
    await reset("alice");
  });

  it("fresh account is not flagged", async () => {
    const s = await deletionStatus("alice");
    expect(s.flagged).toBe(false);
  });

  it("flagForDeletion sets the grace ts", async () => {
    await flagForDeletion("alice");
    const s = await deletionStatus("alice");
    expect(s.flagged).toBe(true);
    if (!s.flagged) return;
    expect(s.remainingMs).toBeGreaterThan(0);
    expect(s.remainingMs).toBeLessThanOrEqual(SOFT_DELETE_GRACE_MS);
  });

  it("clearDeletionFlag undoes it", async () => {
    await flagForDeletion("alice");
    await clearDeletionFlag("alice");
    const s = await deletionStatus("alice");
    expect(s.flagged).toBe(false);
  });
});

describe("hardErase", () => {
  const u = "alice-hard-erase";
  beforeEach(async () => {
    await reset(u);
    // Seed a player state so erase has something to wipe
    const state = await getPlayerState(u);
    state.resources.coins = 100;
    await savePlayerState(state);
  });

  it("wipes every per-user key we know about", async () => {
    const keys = await hardErase(u);
    expect(keys.length).toBeGreaterThan(5);
    expect(keys).toContain(`xp:user:${u}`);
    expect(keys).toContain(`xp:player:${u}`);
    // After erase, reading the player state returns a fresh empty state
    const reread = await getPlayerState(u);
    expect(reread.resources.coins).toBe(0);
  });
});
