import { describe, it, expect } from "vitest";
import { deficitState } from "./watts";
import type { PlayerState, BuildingInstance } from "./player";
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

function mk(
  buildings: BuildingInstance[],
  wattDeficitSince: number | null = null,
): PlayerState {
  return { ...emptyPlayerState("u"), buildings, wattDeficitSince };
}

const HOUR_MS = 60 * 60 * 1000;

describe("V3.3 deficitState", () => {
  it("no deficit → inDeficit=false, all milestones null", () => {
    const s = deficitState(mk([b("domek"), b("mala-elektrownia")]));
    expect(s.inDeficit).toBe(false);
    expect(s.nextMilestone).toBeNull();
    expect(s.hoursToNextMilestone).toBeNull();
    expect(s.brownout).toBe(1);
    expect(s.rescueAvailable).toBe(false);
  });

  it("1h deficit (grace) → nextMilestone=50-percent-yield in ~23h", () => {
    const now = 1_000_000_000_000;
    const s = deficitState(mk([b("huta-szkla")], now - 1 * HOUR_MS), now);
    expect(s.inDeficit).toBe(true);
    expect(s.hoursInDeficit).toBeCloseTo(1);
    expect(s.nextMilestone).toBe("50-percent-yield");
    expect(s.hoursToNextMilestone).toBeCloseTo(23);
    expect(s.brownout).toBe(1);
    expect(s.rescueAvailable).toBe(true);
  });

  it("25h deficit → nextMilestone=25-percent-yield in ~23h, brownout 0.5", () => {
    const now = 1_000_000_000_000;
    const s = deficitState(mk([b("huta-szkla")], now - 25 * HOUR_MS), now);
    expect(s.nextMilestone).toBe("25-percent-yield");
    expect(s.hoursToNextMilestone).toBeCloseTo(23);
    expect(s.brownout).toBe(0.5);
  });

  it("50h deficit → nextMilestone=bankruptcy-eligible in ~22h, brownout 0.25", () => {
    const now = 1_000_000_000_000;
    const s = deficitState(mk([b("huta-szkla")], now - 50 * HOUR_MS), now);
    expect(s.nextMilestone).toBe("bankruptcy-eligible");
    expect(s.hoursToNextMilestone).toBeCloseTo(22);
    expect(s.brownout).toBe(0.25);
  });

  it("75h deficit → nextMilestone=null, rescueAvailable=false", () => {
    const now = 1_000_000_000_000;
    const s = deficitState(mk([b("huta-szkla")], now - 75 * HOUR_MS), now);
    expect(s.inDeficit).toBe(true);
    expect(s.nextMilestone).toBeNull();
    expect(s.hoursToNextMilestone).toBeNull();
    expect(s.rescueAvailable).toBe(false);
  });

  it("nextMilestoneAt is absolute timestamp (deficitSince + milestone boundary)", () => {
    const now = 1_000_000_000_000;
    const since = now - 10 * HOUR_MS;
    const s = deficitState(mk([b("huta-szkla")], since), now);
    // nextMilestone at 24h boundary
    expect(s.nextMilestoneAt).toBe(since + 24 * HOUR_MS);
  });
});
