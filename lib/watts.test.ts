import { describe, it, expect } from "vitest";
import {
  brownoutFactor,
  cityWattBalance,
  deficitHoursAt,
  isInWattRescueGrace,
  refreshWattDeficit,
  upkeepAtLevel,
  DEFICIT_GRACE_HOURS,
  DEFICIT_TIER2_HOURS,
  RESCUE_GRACE_HOURS,
} from "./watts";
import type { BuildingInstance, PlayerState } from "./player";
import { emptyPlayerState } from "./player";

function inst(catalogId: string, level = 1): BuildingInstance {
  return {
    id: `b-${catalogId}-${Math.random().toString(36).slice(2, 6)}`,
    slotId: 0,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

describe("brownoutFactor (BLOCKER-1 ladder — never returns 0)", () => {
  it("0h deficit → full 100%", () => {
    expect(brownoutFactor(0)).toBe(1);
  });
  it("23.9h → still grace 100%", () => {
    expect(brownoutFactor(DEFICIT_GRACE_HOURS - 0.1)).toBe(1);
  });
  it("exactly 24h → tier 2 at 50%", () => {
    expect(brownoutFactor(DEFICIT_GRACE_HOURS)).toBe(0.5);
  });
  it("47.9h → still 50%", () => {
    expect(brownoutFactor(DEFICIT_TIER2_HOURS - 0.1)).toBe(0.5);
  });
  it("exactly 48h → sustained brownout 25%", () => {
    expect(brownoutFactor(DEFICIT_TIER2_HOURS)).toBe(0.25);
  });
  it("100h → still 25% (never drops to 0)", () => {
    expect(brownoutFactor(100)).toBe(0.25);
  });
  it("1000h → still 25% (BLOCKER-1 hard floor)", () => {
    expect(brownoutFactor(1000)).toBe(0.25);
  });
  it("negative / NaN / Infinity defensively full (same isFinite guard as city-level)", () => {
    expect(brownoutFactor(-5)).toBe(1);
    expect(brownoutFactor(NaN)).toBe(1);
    expect(brownoutFactor(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("upkeepAtLevel (1.4× curve)", () => {
  it("0 base → 0 at any level", () => {
    expect(upkeepAtLevel(0, 5)).toBe(0);
  });
  it("level 1 = base", () => {
    expect(upkeepAtLevel(10, 1)).toBe(10);
    expect(upkeepAtLevel(-8, 1)).toBe(-8);
  });
  it("level 2 = ceil(base × 1.4)", () => {
    expect(upkeepAtLevel(10, 2)).toBe(14);
    expect(upkeepAtLevel(-8, 2)).toBe(-12); // -ceil(8*1.4)=-ceil(11.2)=-12
  });
  it("level 3 = ceil(base × 1.96)", () => {
    expect(upkeepAtLevel(10, 3)).toBe(20); // ceil(19.6)=20
  });
  it("level 0 → 0 (never negative levels)", () => {
    expect(upkeepAtLevel(10, 0)).toBe(0);
  });
});

describe("cityWattBalance", () => {
  it("empty city → zero balance, not in deficit", () => {
    const r = cityWattBalance([]);
    expect(r.consumed).toBe(0);
    expect(r.produced).toBe(0);
    expect(r.net).toBe(0);
    expect(r.inDeficit).toBe(false);
  });

  it("Domek only (0 upkeep) → not in deficit", () => {
    const r = cityWattBalance([inst("domek")]);
    expect(r.inDeficit).toBe(false);
    expect(r.consumed).toBe(0);
    expect(r.produced).toBe(0);
  });

  it("Domek + Mała elektrownia → surplus", () => {
    const r = cityWattBalance([inst("domek"), inst("mala-elektrownia")]);
    expect(r.produced).toBe(8);
    expect(r.consumed).toBe(0);
    expect(r.net).toBe(8);
    expect(r.inDeficit).toBe(false);
  });

  it("Huta (12) alone → in deficit", () => {
    const r = cityWattBalance([inst("huta-szkla")]);
    expect(r.consumed).toBe(12);
    expect(r.produced).toBe(0);
    expect(r.inDeficit).toBe(true);
  });

  it("Huta + Mała elektrownia → 12 vs 8 still in deficit", () => {
    const r = cityWattBalance([inst("huta-szkla"), inst("mala-elektrownia")]);
    expect(r.consumed).toBe(12);
    expect(r.produced).toBe(8);
    expect(r.inDeficit).toBe(true);
  });

  it("Huta + Fotowoltaika (L1) → 12 vs 12 BALANCED (not in deficit)", () => {
    const r = cityWattBalance([inst("huta-szkla"), inst("fotowoltaika")]);
    expect(r.consumed).toBe(12);
    expect(r.produced).toBe(12);
    // exactly balanced — not a deficit (strictly > check)
    expect(r.inDeficit).toBe(false);
  });

  it("Unknown catalog id is skipped", () => {
    const r = cityWattBalance([inst("no-such-id"), inst("domek")]);
    expect(r.consumed).toBe(0);
    expect(r.produced).toBe(0);
  });

  it("Scales with level", () => {
    // Huta L2 → 17 (ceil(12*1.4)), Mała elektrownia L1 supplies 8
    const r = cityWattBalance([inst("huta-szkla", 2), inst("mala-elektrownia")]);
    expect(r.consumed).toBe(17);
    expect(r.produced).toBe(8);
    expect(r.inDeficit).toBe(true);
  });
});

describe("refreshWattDeficit", () => {
  it("balanced state → wattDeficitSince stays null", () => {
    const s: PlayerState = emptyPlayerState("u");
    s.buildings = [inst("domek")];
    const changed = refreshWattDeficit(s, 1000);
    expect(changed).toBe(false);
    expect(s.wattDeficitSince).toBeNull();
  });

  it("enters deficit → stamps wattDeficitSince", () => {
    const s: PlayerState = emptyPlayerState("u");
    s.buildings = [inst("huta-szkla")];
    const changed = refreshWattDeficit(s, 1000);
    expect(changed).toBe(true);
    expect(s.wattDeficitSince).toBe(1000);
  });

  it("already in deficit → no change", () => {
    const s: PlayerState = emptyPlayerState("u");
    s.buildings = [inst("huta-szkla")];
    s.wattDeficitSince = 500;
    const changed = refreshWattDeficit(s, 1000);
    expect(changed).toBe(false);
    expect(s.wattDeficitSince).toBe(500);
  });

  it("rescued (deficit → balanced) → clears wattDeficitSince", () => {
    const s: PlayerState = emptyPlayerState("u");
    s.buildings = [inst("huta-szkla"), inst("fotowoltaika")];
    s.wattDeficitSince = 500;
    const changed = refreshWattDeficit(s, 1000);
    expect(changed).toBe(true);
    expect(s.wattDeficitSince).toBeNull();
  });

  it("undefined wattDeficitSince on legacy state is treated as null", () => {
    const s = emptyPlayerState("u") as PlayerState;
    delete (s as Partial<PlayerState>).wattDeficitSince;
    s.buildings = [inst("domek")];
    const changed = refreshWattDeficit(s, 1000);
    expect(changed).toBe(false);
    expect(s.wattDeficitSince ?? null).toBeNull();
  });
});

describe("deficitHoursAt + isInWattRescueGrace", () => {
  const HOUR = 60 * 60 * 1000;

  it("no deficit → 0h, not in grace", () => {
    const s = emptyPlayerState("u");
    expect(deficitHoursAt(s, 123)).toBe(0);
    expect(isInWattRescueGrace(s, 123)).toBe(false);
  });

  it("1h into deficit → in grace", () => {
    const s = emptyPlayerState("u");
    s.wattDeficitSince = 0;
    expect(deficitHoursAt(s, HOUR)).toBeCloseTo(1);
    expect(isInWattRescueGrace(s, HOUR)).toBe(true);
  });

  it("71h → still in grace (< 72h)", () => {
    const s = emptyPlayerState("u");
    s.wattDeficitSince = 0;
    expect(isInWattRescueGrace(s, 71 * HOUR)).toBe(true);
  });

  it("72h → grace OVER (bankruptcy gate releases)", () => {
    const s = emptyPlayerState("u");
    s.wattDeficitSince = 0;
    expect(deficitHoursAt(s, RESCUE_GRACE_HOURS * HOUR)).toBeCloseTo(72);
    expect(isInWattRescueGrace(s, RESCUE_GRACE_HOURS * HOUR)).toBe(false);
  });

  it("negative time delta floors to 0", () => {
    const s = emptyPlayerState("u");
    s.wattDeficitSince = 1000;
    expect(deficitHoursAt(s, 500)).toBe(0);
  });
});
