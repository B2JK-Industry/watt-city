import { describe, it, expect } from "vitest";
import { buildHudBundle } from "./hud-data";
import type { PlayerState, BuildingInstance } from "./player";
import { emptyPlayerState } from "./player";

function b(catalogId: string, level = 1): BuildingInstance {
  return {
    id: `b-${catalogId}`,
    slotId: 0,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

function withBuildings(
  buildings: BuildingInstance[],
  overrides: Partial<PlayerState> = {},
): PlayerState {
  return { ...emptyPlayerState("u"), buildings, ...overrides };
}

describe("buildHudBundle", () => {
  const now = 1_000_000_000_000;

  it("balanced city → no alert, full brownout=1, zero loan risk", () => {
    const state = withBuildings([b("domek"), b("mala-elektrownia")], {
      lastTickAt: now,
      resources: { coins: 50, bricks: 0, watts: 0, cashZl: 20, glass: 0, steel: 0, code: 0 },
    });
    const hud = buildHudBundle(state, now);
    expect(hud.alertLevel).toBe("none");
    expect(hud.watts.inDeficit).toBe(false);
    expect(hud.watts.brownout).toBe(1);
    expect(hud.cashBalance).toBe(70);
    expect(hud.loanRisk).toHaveLength(0);
  });

  it("deficit city (Huta alone, fresh) → info/warn alert, brownout=1 during grace", () => {
    const state = withBuildings([b("huta-szkla")], {
      wattDeficitSince: now - 60 * 60 * 1000, // 1h ago
      lastTickAt: now,
      resources: {
        coins: 100,
        bricks: 0,
        watts: 0,
        cashZl: 0,
        glass: 0,
        steel: 0,
        code: 0,
      },
    });
    const hud = buildHudBundle(state, now);
    expect(hud.watts.inDeficit).toBe(true);
    expect(hud.watts.deficitHours).toBeCloseTo(1);
    expect(hud.watts.brownout).toBe(1); // still grace
    expect(hud.alertLevel).toBe("info");
    expect(hud.alertReason).toMatch(/^watt-deficit-\d+h$/);
    expect(hud.watts.inRescueGrace).toBe(true);
  });

  it("deficit 48h+ → critical alert at 25% brownout", () => {
    const state = withBuildings([b("huta-szkla")], {
      wattDeficitSince: now - 50 * 60 * 60 * 1000,
      lastTickAt: now,
    });
    const hud = buildHudBundle(state, now);
    expect(hud.watts.brownout).toBe(0.25);
    expect(hud.alertLevel).toBe("critical");
  });

  it("stale tick > 5min → info alert", () => {
    const state = withBuildings([b("domek")], {
      lastTickAt: now - 10 * 60 * 1000,
    });
    const hud = buildHudBundle(state, now);
    expect(hud.alertLevel).toBe("info");
    expect(hud.alertReason).toBe("stale-tick");
  });

  it("projectedHourly scales by brownout during deficit", () => {
    // Huta alone: produces 4 glass/h. Full brownout at 48h+ = 0.25
    // → 4 × 0.25 = 1 (ceil)
    const deep = withBuildings([b("huta-szkla")], {
      wattDeficitSince: now - 50 * 60 * 60 * 1000,
    });
    const fresh = withBuildings([b("huta-szkla")], {});
    const dh = buildHudBundle(deep, now);
    const fh = buildHudBundle(fresh, now);
    expect(dh.projectedHourly).toBeLessThan(fh.projectedHourly);
    expect(dh.projectedHourly).toBeGreaterThan(0); // BLOCKER-1: never zero
  });

  it("empty city → zero balance, zero hourly, no alert", () => {
    const state = withBuildings([], { lastTickAt: now });
    const hud = buildHudBundle(state, now);
    expect(hud.cashBalance).toBe(0);
    expect(hud.projectedHourly).toBe(0);
    expect(hud.alertLevel).toBe("none");
  });
});
