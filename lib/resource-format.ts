/* Canonical resource bundle formatting + affordability math.
 *
 * One module, two jobs:
 *
 *   1. `computeMissing(have, need)` — pure subtraction returning ONLY the
 *      positive shortfalls. Shared by server (`upgradeBuilding`, `placeBuilding`
 *      use it to include `missing` in their error responses) and by any
 *      client code that needs a "how short am I?" breakdown without a round
 *      trip.
 *
 *   2. `formatResourceBundle(amounts, lang, opts)` — single entry point for
 *      rendering a `Partial<Resources>` into a human-readable string
 *      ("80 🧱 · 50 🪙", "+12 ⚡ · -4 🪙", or "80 Cegły · 50 Monety"). Replaces
 *      the previous ad-hoc `formatResourceDelta` that lived inline in the
 *      city-client. Convenience wrappers (`formatResourceCost`,
 *      `formatResourceYieldPerHour`, `formatResourceDelta`,
 *      `formatResourceMissing`) exist for readability at call sites but all
 *      delegate here so the separator, ordering, and pluralisation rules
 *      stay in one place.
 *
 * Design rules:
 *
 * - **Never hardcode resource ordering** — we iterate `RESOURCE_KEYS` so a
 *   future addition (e.g. a new active resource) picks up the canonical
 *   layout automatically.
 * - **Skip deprecated + zero entries** — a cost of `{ coins: 80 }` must not
 *   render `80 🪙 · 0 🧱 · 0 🪟 …`. Zero is "not part of this bundle".
 * - **Deterministic separator** — mid-dot (` · `) matches existing UI.
 *   Change once here and every HUD, modal, toast updates together.
 * - **No locale-specific plural grammar in v1.** The existing `RESOURCE_DEFS`
 *   labels are plural forms ("Cegły", "Monety") that read acceptably with
 *   any cardinal. Proper `Intl.PluralRules` can slot in later without
 *   changing call sites.
 */

import { RESOURCE_KEYS, RESOURCE_DEFS, type Resources, type ResourceKey } from "@/lib/resources";
import type { Lang } from "@/lib/i18n";

/** Mid-dot separator. Centralised so every bundle renders identically. */
export const RESOURCE_BUNDLE_SEPARATOR = " · ";
/** Placeholder shown when a bundle is empty (fully paid, nothing missing,
 *  civic building with zero yield, etc.). Callers can override if context
 *  benefits — e.g. a yield chip might prefer "0/h". */
export const RESOURCE_BUNDLE_EMPTY = "—";

export type ResourceBundleMode =
  /** Icons only (⚡ 🪙 🧱). Default — matches existing ResourceBar + HUD. */
  | "icon"
  /** Icon + localised label ("80 🧱 Cegły"). For verbose tooltips. */
  | "icon-label"
  /** Label only ("80 Cegły"). For screen-reader text or printed PDFs. */
  | "label";

export type FormatResourceBundleOptions = {
  mode?: ResourceBundleMode;
  /** When true, non-negative values get a `+` prefix. Negatives always
   *  show the `-`. Use for signed deltas (yield, ledger entries). Default
   *  false (cost / missing / bundle render unsigned). */
  signed?: boolean;
  /** Override the empty placeholder. Pass `""` to render nothing at all. */
  emptyPlaceholder?: string;
};

/**
 * Format a partial-resource bundle into a display string.
 *
 * Iterates `RESOURCE_KEYS` for stable order. Skips keys that are absent,
 * `undefined`, or exactly `0`. Negative entries render with a leading `-`
 * regardless of `signed` (the sign is intrinsic to the value).
 */
export function formatResourceBundle(
  amounts: Partial<Resources>,
  lang: Lang,
  opts: FormatResourceBundleOptions = {},
): string {
  const { mode = "icon", signed = false, emptyPlaceholder = RESOURCE_BUNDLE_EMPTY } = opts;
  const parts: string[] = [];
  for (const key of RESOURCE_KEYS) {
    const value = amounts[key];
    if (value === undefined || value === null || value === 0) continue;
    parts.push(renderOne(key, value, lang, mode, signed));
  }
  return parts.length ? parts.join(RESOURCE_BUNDLE_SEPARATOR) : emptyPlaceholder;
}

function renderOne(
  key: ResourceKey,
  value: number,
  lang: Lang,
  mode: ResourceBundleMode,
  signed: boolean,
): string {
  const def = RESOURCE_DEFS[key];
  const sign = value > 0 && signed ? "+" : "";
  const magnitude = `${sign}${value}`;
  switch (mode) {
    case "icon":
      return `${magnitude} ${def.icon}`;
    case "icon-label":
      return `${magnitude} ${def.icon} ${def.labels[lang]}`;
    case "label":
      return `${magnitude} ${def.labels[lang]}`;
  }
}

/** Cost bundle (always unsigned, always icon-only by default). */
export function formatResourceCost(cost: Partial<Resources>, lang: Lang): string {
  return formatResourceBundle(cost, lang);
}

/** Yield bundle with `/h` suffix appended by caller (we don't add it here —
 *  the string is rendered into a larger template that owns the unit). */
export function formatResourceYield(yieldPerHour: Partial<Resources>, lang: Lang): string {
  return formatResourceBundle(yieldPerHour, lang);
}

/** Signed delta for ledger rows / tier-up toasts. */
export function formatResourceDelta(delta: Partial<Resources>, lang: Lang): string {
  return formatResourceBundle(delta, lang, { signed: true });
}

/** What's missing bundle. Rendered identically to cost, but the empty case
 *  returns an empty string instead of `—` — an empty missing breakdown
 *  means "nothing missing" and the UI shouldn't show a placeholder dash. */
export function formatResourceMissing(missing: Partial<Resources>, lang: Lang): string {
  return formatResourceBundle(missing, lang, { emptyPlaceholder: "" });
}

/**
 * Pure affordability subtraction.
 *
 * Given a player's current `have` balances and a required `need` bundle,
 * return a `Partial<Resources>` containing only the positive shortfalls.
 * Returns `{}` if the player can afford the cost (equivalent to
 * `canAfford(have, need) === true`).
 *
 * Invariants:
 * - Result is always non-negative (we return shortfall, not signed delta).
 * - Deprecated resource keys are processed like any other — if a legacy
 *   building asks for steel and the player has 0 steel, it shows up.
 * - `need` entries of 0 or undefined produce no output (no spurious
 *   "missing 0 🪟" noise).
 *
 * Used by server-side mutation handlers (`upgradeBuilding`, `placeBuilding`)
 * to attach an actionable breakdown to `{ ok: false, error: "not-affordable" }`
 * responses so the UI can render "Brakuje: 48 🧱, 30 🪙" without a second
 * round trip.
 */
export function computeMissing(
  have: Resources,
  need: Partial<Resources>,
): Partial<Resources> {
  const missing: Partial<Resources> = {};
  for (const key of RESOURCE_KEYS) {
    const required = need[key];
    if (!required || required <= 0) continue;
    const held = have[key] ?? 0;
    if (held < required) {
      missing[key] = required - held;
    }
  }
  return missing;
}

/** True iff `missing` contains any positive shortfall. Convenience so callers
 *  don't re-iterate keys to check emptiness. */
export function hasMissing(missing: Partial<Resources>): boolean {
  for (const key of RESOURCE_KEYS) {
    const v = missing[key];
    if (v && v > 0) return true;
  }
  return false;
}
