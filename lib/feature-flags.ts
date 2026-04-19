/* V2 refactor R9.3.1 — percentile-based feature flags (MEDIUM-18).
 *
 * Replaces the v1 design where each user would have a per-user Redis
 * key `ff:${flag}:${user}`. At 100k users that's 100k keys read on
 * every request × 2 (one read to check flag) — death by request count
 * on Upstash.
 *
 * V2 model: one global config per flag. Percentage + allowlist +
 * denylist. Resolution is deterministic:
 *
 *   denied  → deny (denylist always wins)
 *   allow   → allow
 *   sha1(userId) % 100 < percent → allow
 *   else    → deny
 *
 * New users auto-resolve (no per-user write on signup). Toggling the
 * percent value shifts EVERYONE consistently — no migration needed.
 *
 * Config shape stored at `xp:feature-flags`:
 *   { [flagName]: { mode: "percentage" | "off" | "on",
 *                   value: 0..100,
 *                   allowlist: string[],
 *                   denylist: string[] } }
 */

import { createHash } from "crypto";
import { kvGet, kvSet } from "@/lib/redis";

export const FLAGS_KEY = "xp:feature-flags";

export type FlagMode = "off" | "on" | "percentage";

export type FlagConfig = {
  mode: FlagMode;
  /** Used only when mode === "percentage". Integer 0..100. */
  value?: number;
  allowlist?: string[];
  denylist?: string[];
};

export type FlagsBundle = Record<string, FlagConfig>;

/** Default flags for the V2 refactor. Shipped as the baseline; admin
 *  can override any of these by writing to xp:feature-flags. */
export const DEFAULT_FLAGS: FlagsBundle = {
  // R1.2 dashboard: show the CityLevelCard above the V1 hero. On by
  // default because the card is additive and doesn't remove V1 surface.
  v2_city_level_card: { mode: "on" },

  // R2.3 cashflow HUD: global kill-switch in case a bug surfaces after
  // rollout. "on" initially — we can flip to "off" without a deploy.
  v2_cashflow_hud: { mode: "on" },

  // R3.4 post-game modal: the score endpoint already returns
  // `multBreakdown` (see app/api/score/route.ts) so clients with the
  // modal wired receive it. Ramp percentage so we observe rendering
  // behaviour on real traffic before flipping everyone.
  v2_post_game_modal: { mode: "percentage", value: 50 },

  // R7.3 restructuring vs V1 bankructwo: percentage ramp so we observe
  // real restructure events before full rollout. Flipped from 0→50 as
  // part of the kid-friendly safety rollout; remaining 50% stay on V1
  // hard-bankruptcy for the measurement window.
  v2_restructuring: { mode: "percentage", value: 50 },

  // R9.1 migration gate: the value-based migration runs only for users
  // whose percentile bucket is below this. Defaults OFF — flipping
  // requires an explicit admin action.
  v2_migration_eligible: { mode: "off" },
};

/** Compute the 0..99 percentile bucket for a stable userId hash. */
export function userPercentile(userId: string): number {
  // sha1 is fine here — this is distribution, not security. First 4
  // bytes interpreted as unsigned int, modulo 100.
  const h = createHash("sha1").update(userId).digest();
  const n = h.readUInt32BE(0);
  return n % 100;
}

/** Resolve a flag for a user. Returns true if enabled. */
export function resolveFlag(
  cfg: FlagConfig | undefined,
  userId: string,
): boolean {
  if (!cfg) return false;
  if (cfg.denylist?.includes(userId)) return false;
  if (cfg.allowlist?.includes(userId)) return true;
  switch (cfg.mode) {
    case "off":
      return false;
    case "on":
      return true;
    case "percentage": {
      const v = Math.max(0, Math.min(100, cfg.value ?? 0));
      return userPercentile(userId) < v;
    }
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

let _cache: { value: FlagsBundle; ts: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

/** Load the config, falling back to DEFAULT_FLAGS if none stored. */
export async function getFlags(
  now = Date.now(),
): Promise<FlagsBundle> {
  if (_cache && now - _cache.ts < CACHE_TTL_MS) return _cache.value;
  const stored = await kvGet<FlagsBundle>(FLAGS_KEY);
  const merged = { ...DEFAULT_FLAGS, ...(stored ?? {}) };
  _cache = { value: merged, ts: now };
  return merged;
}

/** Admin override — replace the stored config wholesale. */
export async function setFlags(next: FlagsBundle): Promise<void> {
  await kvSet(FLAGS_KEY, next);
  _cache = null;
}

/** Clear in-memory cache — useful in tests + after setFlags. */
export function invalidateFlagsCache(): void {
  _cache = null;
}

/** Resolve a named flag for a user, reading config from Redis with
 *  the 30s in-memory cache. */
export async function isFlagEnabled(
  flag: string,
  userId: string,
): Promise<boolean> {
  const all = await getFlags();
  return resolveFlag(all[flag], userId);
}
