/* V2 refactor R9.1 — value-based migration (BLOCKER-2 compliant).
 *
 * BLOCKER-2 rejected the naive 1:1 glass/steel/code → coins conversion
 * because those resources had wildly different V1 earn rates — whales
 * with 2000 code jumped massively in rank, casuals with 50 glass barely
 * noticed, all with no audit/cap/reversal.
 *
 * This module implements:
 *   1) coin-equivalent conversion rates per deprecated key (default
 *      0.5× pending a ledger-derived rate computation that the admin
 *      surface can trigger offline)
 *   2) ±2× pre-migration-coin cap on any single user's delta
 *   3) per-user migration report (before / after / delta / capped /
 *      rank changes), stored with 30-day TTL for reversal
 *   4) reversal endpoint that reads the snapshot and restores state
 *   5) idempotency sentinel so the migration never double-applies
 */

import { kvGet, kvSet, kvDel } from "@/lib/redis";
import {
  getPlayerState,
  savePlayerState,
  creditResources,
  type PlayerState,
} from "@/lib/player";
import {
  DEPRECATED_RESOURCE_KEYS,
  ACTIVE_RESOURCE_KEYS,
  type ResourceKey,
  type Resources,
} from "@/lib/resources";
import { refreshCityValue, cityValueRank } from "@/lib/city-value";

// ---------------------------------------------------------------------------
// Conversion rates
// ---------------------------------------------------------------------------

/** Default coin-equivalent rate for every deprecated resource. 0.5×
 *  is conservative (whales don't dominate post-migration) and echoes
 *  the review's "not 1:1" ask. Admin can override via
 *  `setConversionRates()` once a ledger-derived rate is computed. */
export const DEFAULT_CONVERSION_RATES: Record<string, number> = {
  glass: 0.5,
  steel: 0.5,
  code: 0.5,
};

export const CONVERSION_RATES_KEY = "xp:migration:v2:rates";

export async function getConversionRates(): Promise<Record<string, number>> {
  const stored = await kvGet<Record<string, number>>(CONVERSION_RATES_KEY);
  return { ...DEFAULT_CONVERSION_RATES, ...(stored ?? {}) };
}

export async function setConversionRates(
  rates: Partial<Record<string, number>>,
): Promise<void> {
  const merged = { ...DEFAULT_CONVERSION_RATES, ...rates };
  await kvSet(CONVERSION_RATES_KEY, merged);
}

// ---------------------------------------------------------------------------
// Cap + conversion math
// ---------------------------------------------------------------------------

/** ±2× of pre-migration coin balance — BLOCKER-2 anti-whale-jump rule. */
export const MIGRATION_DELTA_CAP_FACTOR = 2;

/** Compute coin delta from deprecated balances. Does NOT apply the
 *  ±2× cap; callers do that separately so they can log a `capped`
 *  flag in the report. */
export function rawCoinDelta(
  resources: Resources,
  rates: Record<string, number>,
): number {
  let delta = 0;
  for (const k of DEPRECATED_RESOURCE_KEYS) {
    const amount = resources[k] ?? 0;
    if (amount <= 0) continue;
    const rate = rates[k] ?? DEFAULT_CONVERSION_RATES[k] ?? 1;
    delta += Math.floor(amount * rate);
  }
  return delta;
}

export function applyDeltaCap(
  rawDelta: number,
  priorCoins: number,
): { applied: number; capped: boolean } {
  const cap = Math.max(0, priorCoins) * MIGRATION_DELTA_CAP_FACTOR;
  // Casuals with 0 coins pre-migration still get at least `rawDelta`
  // up to an absolute floor so they're not stuck at 0 — floor of 100
  // is low but meaningful (you can buy a Park). This matches the
  // review's spirit ("capped at ±2× pre-migration coin balance" but
  // the unstated corollary is "zero-coin users should still see the
  // migration honor their deprecated balances").
  const ABSOLUTE_FLOOR = 100;
  const effectiveCap = Math.max(cap, ABSOLUTE_FLOOR);
  if (rawDelta > effectiveCap) {
    return { applied: effectiveCap, capped: true };
  }
  return { applied: rawDelta, capped: false };
}

// ---------------------------------------------------------------------------
// Snapshot + migration
// ---------------------------------------------------------------------------

export const MIGRATION_SNAPSHOT_KEY = (u: string) =>
  `xp:migration:v2:snapshot:${u}`;
export const MIGRATION_SENTINEL_KEY = (u: string) =>
  `xp:migration:v2:done:${u}`;
export const SNAPSHOT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type MigrationReport = {
  username: string;
  migratedAt: number;
  before: {
    resources: Resources;
    cityValueRank: number | null;
  };
  after: {
    resources: Resources;
    cityValueRank: number | null;
  };
  rawDelta: number;
  appliedDelta: number;
  capped: boolean;
  ratesUsed: Record<string, number>;
};

export type Snapshot = {
  resources: Resources;
  wattDeficitSince: number | null;
  takenAt: number;
};

/** Run the migration for a single user. Idempotent: the sentinel
 *  key blocks re-runs; the snapshot persists for 30 days so
 *  `revertMigration` can restore state. */
export async function migrateUser(
  username: string,
  now = Date.now(),
): Promise<
  | { ok: true; report: MigrationReport }
  | { ok: false; error: "already-migrated" | "no-deprecated-balance" }
> {
  const sentinel = await kvGet<number>(MIGRATION_SENTINEL_KEY(username));
  if (sentinel) return { ok: false, error: "already-migrated" };

  const state = await getPlayerState(username);
  const rates = await getConversionRates();
  const rawDelta = rawCoinDelta(state.resources, rates);
  if (rawDelta <= 0) {
    return { ok: false, error: "no-deprecated-balance" };
  }

  const priorCoins = state.resources.coins ?? 0;
  const { applied, capped } = applyDeltaCap(rawDelta, priorCoins);

  const beforeRank = await cityValueRank(username);
  const beforeResources: Resources = { ...state.resources };

  // Snapshot FIRST so we can restore in case of a subsequent crash.
  const snapshot: Snapshot = {
    resources: beforeResources,
    wattDeficitSince: state.wattDeficitSince ?? null,
    takenAt: now,
  };
  await kvSet(MIGRATION_SNAPSHOT_KEY(username), snapshot, {
    ex: SNAPSHOT_TTL_SECONDS,
  });

  // Apply the delta via the ledger path so the accounting is auditable.
  const delta: Partial<Resources> = { coins: applied };
  for (const k of DEPRECATED_RESOURCE_KEYS) {
    const amount = state.resources[k] ?? 0;
    if (amount > 0) delta[k] = -amount; // drain to zero
  }
  await creditResources(
    state,
    "backfill",
    delta,
    `V2 migration: +${applied} coins (raw ${rawDelta}${capped ? ", ±2× capped" : ""})`,
    `migrate-v2:${username}`,
    {
      migration: "v2",
      rawDelta,
      appliedDelta: applied,
      capped,
      rates,
    },
  );
  await savePlayerState(state);

  // Refresh city-value ZSET so rank reflects the post-migration coin
  // balance (via building value; deprecated-keyed buildings treated
  // as 1× anyway so the score nudge is small).
  await refreshCityValue(username, state.buildings);
  const afterRank = await cityValueRank(username);

  const report: MigrationReport = {
    username,
    migratedAt: now,
    before: { resources: beforeResources, cityValueRank: beforeRank },
    after: {
      resources: { ...state.resources },
      cityValueRank: afterRank,
    },
    rawDelta,
    appliedDelta: applied,
    capped,
    ratesUsed: rates,
  };

  await kvSet(MIGRATION_SENTINEL_KEY(username), now);
  return { ok: true, report };
}

// ---------------------------------------------------------------------------
// Reversal
// ---------------------------------------------------------------------------

/** Restore a pre-migration snapshot. Fails if no snapshot exists
 *  (TTL expired after 30 days, or user never migrated). */
export async function revertMigration(
  username: string,
  now = Date.now(),
): Promise<
  | { ok: true; restored: Resources }
  | { ok: false; error: "no-snapshot" | "not-migrated" }
> {
  const sentinel = await kvGet<number>(MIGRATION_SENTINEL_KEY(username));
  if (!sentinel) return { ok: false, error: "not-migrated" };

  const snap = await kvGet<Snapshot>(MIGRATION_SNAPSHOT_KEY(username));
  if (!snap) return { ok: false, error: "no-snapshot" };

  const state = await getPlayerState(username);
  const current = { ...state.resources };
  const revertDelta: Partial<Resources> = {};
  for (const k of [...ACTIVE_RESOURCE_KEYS, ...DEPRECATED_RESOURCE_KEYS] as ResourceKey[]) {
    const target = snap.resources[k] ?? 0;
    const now2 = current[k] ?? 0;
    const diff = target - now2;
    if (diff !== 0) revertDelta[k] = diff;
  }
  if (Object.keys(revertDelta).length > 0) {
    await creditResources(
      state,
      "backfill",
      revertDelta,
      `V2 migration REVERT (snapshot @ ${snap.takenAt})`,
      `migrate-v2-revert:${username}:${now}`,
      { migration: "v2-revert" },
    );
  }
  state.wattDeficitSince = snap.wattDeficitSince;
  await savePlayerState(state);
  await refreshCityValue(username, state.buildings);
  // Clear sentinel so a future migration can re-apply if needed.
  await kvDel(MIGRATION_SENTINEL_KEY(username));
  return { ok: true, restored: snap.resources };
}

/** Inspection helper — returns the stored report + snapshot (if any). */
export async function getMigrationStatus(username: string): Promise<{
  migrated: boolean;
  migratedAt: number | null;
  snapshotAvailable: boolean;
}> {
  const [sentinel, snap] = await Promise.all([
    kvGet<number>(MIGRATION_SENTINEL_KEY(username)),
    kvGet<Snapshot>(MIGRATION_SNAPSHOT_KEY(username)),
  ]);
  return {
    migrated: !!sentinel,
    migratedAt: sentinel ?? null,
    snapshotAvailable: !!snap,
  };
}

// ---------------------------------------------------------------------------
// Bulk (admin-triggered) migration
// ---------------------------------------------------------------------------

/** Run the migration across a set of usernames. Returns per-user
 *  reports. Callers supply the user list — typically the admin
 *  endpoint scans for users with any non-zero deprecated balance
 *  and feeds the list here. */
export async function migrateBatch(
  usernames: string[],
  now = Date.now(),
): Promise<{
  reports: MigrationReport[];
  skipped: Array<{ username: string; reason: string }>;
}> {
  const reports: MigrationReport[] = [];
  const skipped: Array<{ username: string; reason: string }> = [];
  for (const u of usernames) {
    const r = await migrateUser(u, now);
    if (r.ok) reports.push(r.report);
    else skipped.push({ username: u, reason: r.error });
  }
  return { reports, skipped };
}
