import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
} from "@/lib/player";
import {
  sweepAchievements,
  achievementStatus,
  ACHIEVEMENT_DEFS,
} from "./achievements";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(`xp:player:${u}:achievements`);
  await kvDel(`xp:player:${u}:achievements-list`);
  await kvDel(`xp:notifications:${u}`);
}

describe("achievements sweep", () => {
  const u = "ach-user";
  beforeEach(() => reset(u));

  it("fresh account owns nothing", async () => {
    const list = await sweepAchievements(u);
    expect(list).toEqual([]);
    const status = await achievementStatus(u);
    expect(status.every((s) => !s.owned)).toBe(true);
  });

  it("grants first-mortgage-paid when mortgage is paid_off", async () => {
    const state = await getPlayerState(u);
    state.loans.push({
      id: "L-1",
      type: "mortgage",
      principal: 1000,
      outstanding: 0,
      monthlyPayment: 100,
      rrso: 0.08,
      apr: 0.08,
      termMonths: 12,
      takenAt: 0,
      nextPaymentDueAt: 0,
      monthsPaid: 12,
      missedConsecutive: 0,
      status: "paid_off",
    });
    await savePlayerState(state);
    const granted = await sweepAchievements(u);
    expect(granted).toContain("first-mortgage-paid");
    // idempotent: running again shouldn't re-grant
    const second = await sweepAchievements(u);
    expect(second).toEqual([]);
  });

  it("grants credit-score-100 at exactly 100", async () => {
    const state = await getPlayerState(u);
    state.creditScore = 100;
    await savePlayerState(state);
    const granted = await sweepAchievements(u);
    expect(granted).toContain("credit-score-100");
  });

  it("grants built-t7 when any T7+ building exists", async () => {
    const state = await getPlayerState(u);
    state.buildings.push({
      id: "b-spodek",
      slotId: 0,
      catalogId: "spodek", // T8
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    });
    await savePlayerState(state);
    const granted = await sweepAchievements(u);
    expect(granted).toContain("built-t7");
  });

  it("grants all-slots-filled at 20 buildings", async () => {
    const state = await getPlayerState(u);
    state.buildings = Array.from({ length: 20 }, (_, i) => ({
      id: `b-${i}`,
      slotId: i,
      catalogId: "domek",
      level: 1,
      builtAt: 0,
      lastTickAt: 0,
      cumulativeCost: {},
    }));
    await savePlayerState(state);
    const granted = await sweepAchievements(u);
    expect(granted).toContain("all-slots-filled");
  });

  it("catalog has 8 achievements", () => {
    expect(Object.keys(ACHIEVEMENT_DEFS).length).toBe(8);
  });
});
