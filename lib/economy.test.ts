import { describe, it, expect } from "vitest";
import { DEFAULT_ECONOMY, dayBucket, dailyYieldKey } from "./economy";
import { capDailyYield, RESOURCE_DEFS } from "./resources";

describe("economy config", () => {
  it("defaults align with ECONOMY.md §11", () => {
    expect(DEFAULT_ECONOMY.resourceCapPerKindDaily).toBe(200);
    expect(DEFAULT_ECONOMY.baseAprStandard).toBe(0.08);
    expect(DEFAULT_ECONOMY.baseAprPreferred).toBe(0.05);
    expect(DEFAULT_ECONOMY.citywideBonusVarso).toBe(0.1);
    expect(DEFAULT_ECONOMY.offlineCatchupCapDays).toBe(30);
  });
});

describe("dayBucket + dailyYieldKey", () => {
  it("returns the same bucket within a UTC day", () => {
    const a = dayBucket(Date.UTC(2026, 3, 18, 1, 30));
    const b = dayBucket(Date.UTC(2026, 3, 18, 23, 59));
    expect(a).toBe(b);
  });
  it("rolls over at UTC midnight", () => {
    const a = dayBucket(Date.UTC(2026, 3, 18, 23, 59));
    const b = dayBucket(Date.UTC(2026, 3, 19, 0, 0));
    expect(a).not.toBe(b);
  });
  it("dailyYieldKey embeds username + day + resource", () => {
    const k = dailyYieldKey("alice", "coins", "2026-04-18");
    expect(k).toBe("xp:daily-yield:alice:2026-04-18:coins");
  });
});

describe("capDailyYield", () => {
  it("trims a delta when it would exceed the cap", () => {
    const trimmed = capDailyYield(
      { coins: 180 },
      { coins: 50 },
      200,
    );
    expect(trimmed.coins).toBe(150); // 200 - 50 remaining
  });
  it("lets a delta through when prior + delta < cap", () => {
    const trimmed = capDailyYield({ coins: 30 }, { coins: 50 }, 200);
    expect(trimmed.coins).toBe(30);
  });
  it("clips to 0 when cap already hit", () => {
    const trimmed = capDailyYield({ coins: 50 }, { coins: 200 }, 200);
    expect(trimmed.coins).toBe(0);
  });
  it("passes negatives through (debits unaffected by earn cap)", () => {
    const trimmed = capDailyYield({ coins: -80 }, { coins: 999 }, 200);
    expect(trimmed.coins).toBe(-80);
  });
});

// V2 refactor R1.1: glass/steel/code are now deprecated keys —
// preserved in storage for migration but never produced by the yield
// pipeline. The V1 "flipped to mvpActive" invariant is inverted.
describe("V2 resource refactor — glass/steel/code deprecated", () => {
  it("glass is deprecated + mvpActive=false", () => {
    expect(RESOURCE_DEFS.glass.mvpActive).toBe(false);
    expect(RESOURCE_DEFS.glass.deprecated).toBe(true);
  });
  it("steel is deprecated + mvpActive=false", () => {
    expect(RESOURCE_DEFS.steel.mvpActive).toBe(false);
    expect(RESOURCE_DEFS.steel.deprecated).toBe(true);
  });
  it("code is deprecated + mvpActive=false", () => {
    expect(RESOURCE_DEFS.code.mvpActive).toBe(false);
    expect(RESOURCE_DEFS.code.deprecated).toBe(true);
  });
});
