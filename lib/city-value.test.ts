import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";
import {
  computeBuildingValue,
  seedCityValue,
  setCityValue,
  getCityValue,
  topCities,
  refreshCityValue,
  CITY_VALUE_KEY,
} from "./city-value";
import type { BuildingInstance } from "@/lib/player";
import { BUILDING_CATALOG } from "@/lib/building-catalog";

function pickCatalogId(): string {
  // Pick any entry with a non-empty baseCost so computeBuildingValue
  // returns > 0. `sklepik` is a safe commercial L1-able choice.
  const e = BUILDING_CATALOG.find((x) => x.id === "sklepik");
  return e?.id ?? BUILDING_CATALOG[0].id;
}

function bld(
  id: string,
  level: number,
  catalogId = pickCatalogId(),
): BuildingInstance {
  return {
    id,
    slotId: 0,
    catalogId,
    level,
    builtAt: 0,
    lastTickAt: 0,
    cumulativeCost: {},
  };
}

describe("computeBuildingValue", () => {
  it("empty list → 0", () => {
    expect(computeBuildingValue([])).toBe(0);
  });

  it("one L1 sklepik has positive value", () => {
    const v = computeBuildingValue([bld("a", 1, "sklepik")]);
    expect(v).toBeGreaterThan(0);
  });

  it("L5 > L1 for same catalog id", () => {
    const low = computeBuildingValue([bld("a", 1, "sklepik")]);
    const hi = computeBuildingValue([bld("b", 5, "sklepik")]);
    expect(hi).toBeGreaterThan(low);
  });

  it("unknown catalog id contributes 0", () => {
    const v = computeBuildingValue([bld("a", 3, "not-a-real-catalog-id")]);
    expect(v).toBe(0);
  });
});

describe("seedCityValue — BLOCKER-3 floor", () => {
  it("takes max(XP×0.5, buildingValue)", () => {
    expect(seedCityValue(10_000, 2_000)).toBe(5_000);
    expect(seedCityValue(1_000, 5_000)).toBe(5_000);
    expect(seedCityValue(0, 0)).toBe(0);
  });

  it("floors both inputs, never returns non-integer", () => {
    expect(Number.isInteger(seedCityValue(10_001, 0))).toBe(true);
  });
});

describe("city-value ZSET ops", () => {
  beforeEach(async () => {
    await kvDel(CITY_VALUE_KEY);
  });

  it("setCityValue + getCityValue round-trips", async () => {
    await setCityValue("alice", 1234);
    expect(await getCityValue("alice")).toBe(1234);
  });

  it("setCityValue to a lower value reduces score", async () => {
    await setCityValue("alice", 1000);
    await setCityValue("alice", 400);
    expect(await getCityValue("alice")).toBe(400);
  });

  it("topCities returns highest first", async () => {
    await setCityValue("a", 500);
    await setCityValue("b", 1500);
    await setCityValue("c", 800);
    const rows = await topCities(3);
    expect(rows[0].username).toBe("b");
    expect(rows[0].xp).toBe(1500);
    expect(rows[1].username).toBe("c");
    expect(rows[2].username).toBe("a");
  });

  it("refreshCityValue without seedFromXp writes computeBuildingValue", async () => {
    const score = await refreshCityValue("alice", [bld("a", 3, "sklepik")]);
    expect(score).toBeGreaterThan(0);
    const direct = computeBuildingValue([bld("a", 3, "sklepik")]);
    expect(score).toBe(direct);
  });

  it("refreshCityValue with seedFromXp=10000 uses max(XP×0.5, value)", async () => {
    const score = await refreshCityValue("alice", [bld("a", 1, "sklepik")], {
      seedFromXp: 10_000,
    });
    // XP×0.5 = 5000 > single sklepik value → score should be 5000
    expect(score).toBe(5_000);
  });
});

describe("V1 key preservation — BLOCKER-3", () => {
  beforeEach(async () => {
    await kvDel("xp:leaderboard:global");
  });

  it("V1 xp:leaderboard:global is never written by R1.3 code — stays untouched", async () => {
    // We seed the V1 key then touch city-value; V1 must not change.
    await kvSet("xp:leaderboard:global", { sentinel: "v1-only-data" });
    await setCityValue("alice", 500);
    const { kvGet } = await import("@/lib/redis");
    const v1 = await kvGet("xp:leaderboard:global");
    expect(v1).toEqual({ sentinel: "v1-only-data" });
  });
});
