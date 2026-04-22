import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
} from "@/lib/player";
import {
  migrateUser,
  revertMigration,
  getMigrationStatus,
  rawCoinDelta,
  applyDeltaCap,
  setConversionRates,
  getConversionRates,
  DEFAULT_CONVERSION_RATES,
  MIGRATION_DELTA_CAP_FACTOR,
  MIGRATION_SENTINEL_KEY,
  MIGRATION_SNAPSHOT_KEY,
  CONVERSION_RATES_KEY,
} from "./migration-v2";
import { ZERO_RESOURCES } from "./resources";

async function reset(u: string) {
  await kvDel(`xp:player:${u}`);
  await kvDel(`xp:player:${u}:ledger`);
  await kvDel(`xp:player:${u}:ledger-dedup`);
  await kvDel(MIGRATION_SENTINEL_KEY(u));
  await kvDel(MIGRATION_SNAPSHOT_KEY(u));
  await kvDel(CONVERSION_RATES_KEY);
}

describe("R9.1 rawCoinDelta (BLOCKER-2 per-key conversion)", () => {
  it("zero deprecated balances → 0", () => {
    const r = { ...ZERO_RESOURCES };
    expect(rawCoinDelta(r, DEFAULT_CONVERSION_RATES)).toBe(0);
  });

  it("100 glass + 0.5 rate → 50 coins", () => {
    const r = { ...ZERO_RESOURCES, glass: 100 };
    expect(rawCoinDelta(r, DEFAULT_CONVERSION_RATES)).toBe(50);
  });

  it("1000 code + 0.5 rate → 500 coins", () => {
    const r = { ...ZERO_RESOURCES, code: 1000 };
    expect(rawCoinDelta(r, DEFAULT_CONVERSION_RATES)).toBe(500);
  });

  it("sums all deprecated keys", () => {
    const r = { ...ZERO_RESOURCES, glass: 100, steel: 200, code: 300 };
    // 50 + 100 + 150 = 300
    expect(rawCoinDelta(r, DEFAULT_CONVERSION_RATES)).toBe(300);
  });

  it("respects custom rates", () => {
    const r = { ...ZERO_RESOURCES, glass: 100 };
    expect(rawCoinDelta(r, { glass: 1.5 })).toBe(150);
  });
});

describe("R9.1 applyDeltaCap (±2× anti-whale rule)", () => {
  it("under-cap raw delta returns unchanged, capped=false", () => {
    expect(applyDeltaCap(100, 200)).toEqual({ applied: 100, capped: false });
  });

  it("exactly at cap returns unchanged, capped=false", () => {
    expect(applyDeltaCap(400, 200)).toEqual({ applied: 400, capped: false });
  });

  it("over cap clamped to 2× prior, capped=true", () => {
    expect(applyDeltaCap(1000, 200)).toEqual({ applied: 400, capped: true });
  });

  it("zero prior coins → absolute floor of 100 (not stuck at 0)", () => {
    expect(applyDeltaCap(500, 0)).toEqual({ applied: 100, capped: true });
  });

  it("cap factor matches exported constant", () => {
    expect(MIGRATION_DELTA_CAP_FACTOR).toBe(2);
  });
});

describe("R9.1 migrateUser + snapshot + sentinel", () => {
  const u = "mig-user-a";
  beforeEach(() => reset(u));

  it("migrates a user's glass → coins with snapshot + report", async () => {
    const state = await getPlayerState(u);
    state.resources.coins = 50;
    state.resources.glass = 200; // 200 × 0.5 = 100
    state.resources.steel = 100; // 100 × 0.5 = 50, total raw 150
    await savePlayerState(state);

    const r = await migrateUser(u, 1_000_000_000_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.report.rawDelta).toBe(150);
    // priorCoins=50 → cap=100, but raw=150>100 → applied=100, capped=true
    expect(r.report.appliedDelta).toBe(100);
    expect(r.report.capped).toBe(true);

    const after = await getPlayerState(u);
    expect(after.resources.coins).toBe(150); // 50 + 100
    expect(after.resources.glass).toBe(0);
    expect(after.resources.steel).toBe(0);
  });

  it("sentinel blocks re-run (idempotent)", async () => {
    const state = await getPlayerState(u);
    state.resources.glass = 100;
    await savePlayerState(state);
    await migrateUser(u);
    const r2 = await migrateUser(u);
    expect(r2.ok).toBe(false);
    if (r2.ok) return;
    expect(r2.error).toBe("already-migrated");
  });

  it("returns no-deprecated-balance when nothing to convert", async () => {
    const state = await getPlayerState(u);
    state.resources.coins = 500;
    await savePlayerState(state);
    const r = await migrateUser(u);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("no-deprecated-balance");
  });

  it("getMigrationStatus reports migrated + snapshot available", async () => {
    const state = await getPlayerState(u);
    state.resources.glass = 50;
    await savePlayerState(state);
    const before = await getMigrationStatus(u);
    expect(before.migrated).toBe(false);
    await migrateUser(u);
    const after = await getMigrationStatus(u);
    expect(after.migrated).toBe(true);
    expect(after.snapshotAvailable).toBe(true);
  });
});

describe("R9.1 revertMigration", () => {
  const u = "mig-user-revert";
  beforeEach(() => reset(u));

  it("restores pre-migration resources", async () => {
    const state = await getPlayerState(u);
    state.resources.coins = 50;
    state.resources.glass = 200;
    state.resources.steel = 100;
    await savePlayerState(state);
    await migrateUser(u);

    const post = await getPlayerState(u);
    expect(post.resources.glass).toBe(0);

    const rev = await revertMigration(u);
    expect(rev.ok).toBe(true);

    const restored = await getPlayerState(u);
    expect(restored.resources.coins).toBe(50);
    expect(restored.resources.glass).toBe(200);
    expect(restored.resources.steel).toBe(100);
  });

  it("clears sentinel so re-migration is allowed", async () => {
    const state = await getPlayerState(u);
    state.resources.glass = 100;
    await savePlayerState(state);
    await migrateUser(u);
    await revertMigration(u);
    const status = await getMigrationStatus(u);
    expect(status.migrated).toBe(false);

    // Re-migrate works
    const r2 = await migrateUser(u);
    expect(r2.ok).toBe(true);
  });

  it("fails gracefully when not migrated", async () => {
    const r = await revertMigration(u);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("not-migrated");
  });
});

describe("R9.1 conversion rates persistence", () => {
  beforeEach(async () => {
    await kvDel(CONVERSION_RATES_KEY);
  });

  it("getConversionRates returns DEFAULT when none stored", async () => {
    const r = await getConversionRates();
    expect(r.glass).toBe(DEFAULT_CONVERSION_RATES.glass);
  });

  it("setConversionRates persists, getConversionRates reads back", async () => {
    await setConversionRates({ glass: 1.5 });
    const r = await getConversionRates();
    expect(r.glass).toBe(1.5);
    expect(r.steel).toBe(DEFAULT_CONVERSION_RATES.steel); // defaults merged
  });
});
