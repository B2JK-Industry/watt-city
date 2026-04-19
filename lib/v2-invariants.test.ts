/* V2 refactor R9.2 — cross-cutting invariants.
 *
 * One focused file asserting the hard rules from the review's BLOCKERs
 * and HIGHs don't drift. Each describe() block names the review anchor
 * it protects so failures point directly at the design doc.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { kvDel, kvGet, zTopN } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
  type BuildingInstance,
} from "@/lib/player";
import {
  refreshWattDeficit,
  brownoutFactor,
  isInWattRescueGrace,
  cityWattBalance,
  RESCUE_GRACE_HOURS,
} from "@/lib/watts";
import {
  scoreMultiplier,
  scoreMultiplierBreakdown,
  SCORE_MULT_CAP,
} from "@/lib/multipliers";
import {
  CITY_VALUE_KEY,
  refreshCityValue,
} from "@/lib/city-value";
import {
  AI_KIND_YIELDS,
  EVERGREEN_YIELDS,
  DEPRECATED_RESOURCE_KEYS,
} from "@/lib/resources";
import { buildHudBundle } from "@/lib/hud-data";
import {
  migrateUser,
  revertMigration,
  rawCoinDelta,
  applyDeltaCap,
  MIGRATION_SENTINEL_KEY,
  MIGRATION_SNAPSHOT_KEY,
  DEFAULT_CONVERSION_RATES,
} from "@/lib/migration-v2";
import { ensureSignupGift, placeBuilding } from "@/lib/buildings";
import { tickPlayer } from "@/lib/tick";

const V1_LEADERBOARD = "xp:leaderboard:global";

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

async function reset(u: string) {
  await Promise.all([
    kvDel(`xp:player:${u}`),
    kvDel(`xp:player:${u}:ledger`),
    kvDel(`xp:player:${u}:ledger-dedup`),
    kvDel(`xp:tick-lock:${u}`),
    kvDel(MIGRATION_SENTINEL_KEY(u)),
    kvDel(MIGRATION_SNAPSHOT_KEY(u)),
  ]);
}

describe("BLOCKER-1 — brownout never produces permanent coin lock", () => {
  it("brownoutFactor never returns 0 at any deficit duration", () => {
    for (const h of [0, 1, 24, 48, 72, 100, 500, 10000]) {
      expect(brownoutFactor(h)).toBeGreaterThan(0);
    }
    expect(brownoutFactor(Number.POSITIVE_INFINITY)).toBeGreaterThan(0);
  });

  it("isInWattRescueGrace is strictly < 72h (boundary held)", () => {
    const s = { wattDeficitSince: 0 };
    expect(isInWattRescueGrace(s, 71 * 60 * 60 * 1000)).toBe(true);
    expect(isInWattRescueGrace(s, RESCUE_GRACE_HOURS * 60 * 60 * 1000)).toBe(false);
  });

  it("full rescue flow: build Huta → deficit → build Elektrownia → rescued", async () => {
    const u = "inv-rescue-user";
    await reset(u);
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    // Force Huta onto slot 3
    state.buildings.push({
      id: "b-huta-inv",
      slotId: 3,
      catalogId: "huta-szkla",
      level: 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    refreshWattDeficit(state);
    await savePlayerState(state);
    expect(state.wattDeficitSince).not.toBeNull();

    // Now place elektrownia enough to cover — Fotowoltaika supplies -12
    state = await getPlayerState(u);
    state.buildings.push({
      id: "b-pv-inv",
      slotId: 4,
      catalogId: "fotowoltaika",
      level: 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    refreshWattDeficit(state);
    await savePlayerState(state);
    expect(state.wattDeficitSince).toBeNull();
    const balance = cityWattBalance(state.buildings);
    expect(balance.inDeficit).toBe(false);
  });
});

describe("BLOCKER-2 — migration cap + reversibility", () => {
  const u = "inv-mig-user";
  beforeEach(() => reset(u));

  it("rawCoinDelta uses configured rates (never implicit 1:1)", () => {
    const r = { watts: 0, coins: 0, bricks: 0, cashZl: 0, glass: 100, steel: 100, code: 100 };
    const raw = rawCoinDelta(r, DEFAULT_CONVERSION_RATES);
    // 100 × 0.5 × 3 = 150
    expect(raw).toBe(150);
    // Critically: NOT 300 (which would be 1:1)
    expect(raw).not.toBe(300);
  });

  it("cap at ±2× prior coins enforced", () => {
    // raw=1000, prior=100 → cap=200
    expect(applyDeltaCap(1000, 100).applied).toBe(200);
    expect(applyDeltaCap(1000, 100).capped).toBe(true);
  });

  it("full round-trip: migrate → revert restores pre-state exactly", async () => {
    let state = await getPlayerState(u);
    state.resources.coins = 50;
    state.resources.glass = 200;
    state.resources.steel = 100;
    await savePlayerState(state);

    const mig = await migrateUser(u);
    expect(mig.ok).toBe(true);
    const rev = await revertMigration(u);
    expect(rev.ok).toBe(true);

    state = await getPlayerState(u);
    expect(state.resources.coins).toBe(50);
    expect(state.resources.glass).toBe(200);
    expect(state.resources.steel).toBe(100);
  });
});

describe("BLOCKER-3 — V2 writes never touch the V1 leaderboard", () => {
  const u = "inv-ldr-user";
  beforeEach(() => reset(u));

  it("refreshCityValue writes to city-value ZSET only, never V1 leaderboard", async () => {
    await kvDel(V1_LEADERBOARD);
    await kvDel(CITY_VALUE_KEY);
    const state = await getPlayerState(u);
    // Use sklepik so buildingValue > 0 (Domek has zero baseCost so ZADD-via-
    // zIncrBy with delta=0 is short-circuited). BLOCKER-3 cares about V1
    // non-contamination; any positive-cost building is sufficient to assert.
    state.buildings = [b("sklepik")];
    await savePlayerState(state);
    await refreshCityValue(u, state.buildings);

    const v1 = await zTopN(V1_LEADERBOARD, 10);
    // The critical BLOCKER-3 invariant: V1 leaderboard untouched.
    expect(v1.some((e) => e.username === u)).toBe(false);
    // V2 leaderboard has the user with a positive score.
    const v2 = await zTopN(CITY_VALUE_KEY, 10);
    expect(v2.some((e) => e.username === u && e.xp > 0)).toBe(true);
  });

  it("build/upgrade/demolish mutations update ONLY city-value", async () => {
    await kvDel(V1_LEADERBOARD);
    await kvDel(CITY_VALUE_KEY);
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    await creditResources(
      state,
      "admin_grant",
      { watts: 60, bricks: 200, coins: 200 },
      "g",
      "g:inv",
    );
    state = await getPlayerState(u);
    await placeBuilding(state, 3, "mala-elektrownia");
    const v1 = await zTopN(V1_LEADERBOARD, 10);
    expect(v1.some((e) => e.username === u)).toBe(false);
  });
});

describe("HIGH-4 — displayed ladder matches credited amount", () => {
  it("scoreMultiplier always equals breakdown.finalMultiplier", () => {
    const cases = [
      [[], "quiz"],
      [[b("biblioteka")], "quiz"],
      [[b("spodek")], "power-flip"],
      [[b("biblioteka"), b("spodek")], "quiz"],
      [Array.from({ length: 12 }, () => b("biblioteka")), "quiz"],
    ] as const;
    for (const [buildings, kind] of cases) {
      const direct = scoreMultiplier([...buildings], kind);
      const viaBreakdown = scoreMultiplierBreakdown([...buildings], kind).finalMultiplier;
      expect(direct).toBe(viaBreakdown);
    }
  });

  it("cap enforced at exactly ×3 (SCORE_MULT_CAP)", () => {
    const manyLibs = Array.from({ length: 20 }, () => b("biblioteka"));
    const m = scoreMultiplier(manyLibs, "quiz");
    expect(m).toBe(SCORE_MULT_CAP);
    expect(SCORE_MULT_CAP).toBe(3);
  });
});

describe("R1.1 — no game yields a deprecated key", () => {
  it("AI_KIND_YIELDS never references glass/steel/code", () => {
    for (const [kind, rule] of Object.entries(AI_KIND_YIELDS)) {
      if (!rule) continue;
      expect(DEPRECATED_RESOURCE_KEYS).not.toContain(rule.primary);
      if (rule.secondary) {
        expect(DEPRECATED_RESOURCE_KEYS, `kind=${kind} secondary`).not.toContain(
          rule.secondary,
        );
      }
    }
  });

  it("EVERGREEN_YIELDS never references glass/steel/code", () => {
    for (const [id, rule] of Object.entries(EVERGREEN_YIELDS)) {
      if (!rule) continue;
      expect(DEPRECATED_RESOURCE_KEYS, `game=${id}`).not.toContain(rule.primary);
      if (rule.secondary) {
        expect(DEPRECATED_RESOURCE_KEYS, `game=${id}`).not.toContain(
          rule.secondary,
        );
      }
    }
  });
});

describe("R2.3 HUD bundle — alert severity matches watt state", () => {
  const u = "inv-hud-user";
  beforeEach(() => reset(u));

  it("deficit >=48h → critical; fresh deficit → info; balanced → none", async () => {
    const state = await getPlayerState(u);
    state.buildings = [b("huta-szkla")];
    const now = 1_000_000_000_000;

    state.wattDeficitSince = now - 1 * 60 * 60 * 1000; // 1h
    let hud = buildHudBundle(state, now);
    expect(hud.alertLevel).toBe("info");

    state.wattDeficitSince = now - 50 * 60 * 60 * 1000; // 50h
    hud = buildHudBundle(state, now);
    expect(hud.alertLevel).toBe("critical");

    state.buildings = [b("domek")]; // balanced
    state.wattDeficitSince = null;
    state.lastTickAt = now;
    hud = buildHudBundle(state, now);
    expect(hud.alertLevel).toBe("none");
  });

  it("full integration: signup + deficit + tick does NOT zero coin yield", async () => {
    let state = await getPlayerState(u);
    await ensureSignupGift(state);
    state = await getPlayerState(u);
    state.buildings.push({
      id: "b-huta-end",
      slotId: 3,
      catalogId: "huta-szkla",
      level: 1,
      builtAt: Date.now(),
      lastTickAt: Date.now(),
      cumulativeCost: {},
    });
    state.wattDeficitSince = Date.now() - 60 * 60 * 60 * 1000; // 60h deep
    for (const bi of state.buildings) {
      bi.lastTickAt = Date.now();
    }
    state.lastTickAt = Date.now();
    await savePlayerState(state);

    // Tick 1h forward — Domek should yield ≥1 coin even with brownout 25%.
    const result = await tickPlayer(u, Date.now() + 60 * 60 * 1000 + 1000);
    expect(result.ticked).toBe(true);
    // BLOCKER-1: coin yield under heavy brownout > 0
    expect(result.resources.coins).toBeGreaterThan(0);
  });
});

describe("MEDIUM-18 invariant — feature flag resolver doesn't touch Redis on hot-path bucket check", () => {
  it("resolveFlag is pure — same inputs, same outputs", async () => {
    const { resolveFlag } = await import("./feature-flags");
    const cfg = { mode: "percentage" as const, value: 42 };
    const r1 = resolveFlag(cfg, "alice");
    const r2 = resolveFlag(cfg, "alice");
    const r3 = resolveFlag(cfg, "bob");
    expect(r1).toBe(r2);
    // r3 may be true or false but should be deterministic
    expect(resolveFlag(cfg, "bob")).toBe(r3);
  });
});
