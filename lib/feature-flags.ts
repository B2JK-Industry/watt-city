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

  // R3.4 post-game modal: the score endpoint returns `multBreakdown`
  // (see app/api/score/route.ts) and the RoundResult mounts the modal
  // via cleanup issue 3. D7 demo-polish ramp — flipped from 50%→on so
  // every PKO-demo audience sees the same modal.
  v2_post_game_modal: { mode: "on" },

  // R7.3 restructuring vs V1 bankructwo: kid-friendly soft-landing
  // path for over-leverage. D7 demo-polish ramp — flipped from 50%→on
  // so no demo visitor hits the hard-bankruptcy V1 path.
  v2_restructuring: { mode: "on" },

  // R9.1 migration gate: the value-based migration runs only for users
  // whose percentile bucket is below this. Defaults OFF — flipping
  // requires an explicit admin action.
  v2_migration_eligible: { mode: "off" },

  // ---------------------------------------------------------------------------
  // V3 refactor toggles. All default ON — the V3 surface is the one we want
  // in prod. Kept as flags so ops can flip off per-user if a regression is
  // reported without blocking the whole deploy.
  // ---------------------------------------------------------------------------
  v3_city_first: { mode: "on" }, // CITY_TIERS → city-first badge + dashboard
  v3_starter_kit: { mode: "on" }, // 50 coins + 50 bricks at signup
  v3_brownout_panel: { mode: "on" }, // watt-deficit banner + rescue CTA
  v3_score_lock: { mode: "on" }, // building-mutation lock during /api/score
  v3_loan_calendar: { mode: "on" }, // loan-schedule widget + auto-repay toggle
  v3_loan_comparison: { mode: "on" }, // /loans/compare ladder

  // ---------------------------------------------------------------------------
  // V4 — classroom pivot. Teacher surface + PDF export + demo seed + parent
  // observer + coming-soon banner. All default on; principal view defaults
  // off (pilots enable explicitly via setFlags).
  // ---------------------------------------------------------------------------
  v4_teacher_hero: { mode: "on" }, // /dla-szkol + /nauczyciel/signup + wizard
  v4_pdf_export: { mode: "on" }, // weekly PDF report for classes
  v4_demo_seed: { mode: "on" }, // admin-gated anyway, flag is belt-and-suspenders
  v4_parent_observer: { mode: "on" }, // /rodzic dashboard polish
  v4_coming_soon_banner: { mode: "on" }, // V5 content teaser on / + /games
  v4_principal: { mode: "off" }, // multi-class view — off until pilots
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
