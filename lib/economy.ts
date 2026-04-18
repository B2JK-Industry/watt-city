/* Live-tunable economy constants — ECONOMY.md §11.
 *
 * Keep this file free of logic: data only. Any knob that the balance
 * designer might want to tweak lives here. Later (Phase 5), admins will
 * be able to override these at runtime via `xp:config:economy` in Redis;
 * `readEconomy()` reads through that overlay before falling back to the
 * hardcoded defaults.
 */

import { kvGet } from "@/lib/redis";
import type { ResourceKey } from "@/lib/resources";

export type EconomyConfig = {
  /** Daily cap per primary resource earned from scoring (not tick). */
  resourceCapPerKindDaily: number;
  /** Global resource-balance ceiling — already enforced by resources.ts MAX_BALANCE. */
  maxBalance: number;
  costMultiplier: number;
  yieldMultiplier: number;
  baseAprStandard: number;
  baseAprPreferred: number;
  liveBonusMultiplier: number;
  streakBonusPerDay: number;
  streakBonusCap: number;
  difficultyMultipliers: Record<"easy" | "medium" | "hard", number>;
  citywideBonusSpodek: number;
  citywideBonusVarso: number;
  marketplaceFeeRate: number;
  marketplaceListingFeeRate: number;
  offlineCatchupCapDays: number;
  initialCreditScore: number;
  defaultCreditScoreFloor: number;
};

export const DEFAULT_ECONOMY: EconomyConfig = {
  resourceCapPerKindDaily: 200,
  maxBalance: 1_000_000,
  costMultiplier: 1.6,
  yieldMultiplier: 1.4,
  baseAprStandard: 0.08,
  baseAprPreferred: 0.05,
  liveBonusMultiplier: 2.0,
  streakBonusPerDay: 0.05,
  streakBonusCap: 0.25,
  difficultyMultipliers: { easy: 1.0, medium: 1.0, hard: 1.25 },
  citywideBonusSpodek: 0.05,
  citywideBonusVarso: 0.1,
  marketplaceFeeRate: 0.05,
  marketplaceListingFeeRate: 0.01,
  offlineCatchupCapDays: 30,
  initialCreditScore: 50,
  defaultCreditScoreFloor: 0,
};

const ECONOMY_KEY = "xp:config:economy";

// Admins may override any subset of fields via the admin dashboard (Phase 5.1).
// We shallow-merge on top of DEFAULT_ECONOMY so a partial override is safe.
export async function readEconomy(): Promise<EconomyConfig> {
  const override = await kvGet<Partial<EconomyConfig>>(ECONOMY_KEY);
  if (!override) return DEFAULT_ECONOMY;
  return { ...DEFAULT_ECONOMY, ...override };
}

// ---------------------------------------------------------------------------
// Daily earned-counter helpers (backlog 2.3.5)
// ---------------------------------------------------------------------------

export function dayBucket(ms = Date.now()): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function dailyYieldKey(
  username: string,
  resource: ResourceKey,
  day: string = dayBucket(),
): string {
  return `xp:daily-yield:${username}:${day}:${resource}`;
}
