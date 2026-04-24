import "server-only";
import { cookies } from "next/headers";
import { currentSkin, type SkinId } from "@/lib/theme";

/** Cookie name that persists a user's skin preference across requests.
 *  Prefixed `xp_` to match the existing session / CSRF cookies so ops
 *  grep + clear patterns work uniformly. */
export const SKIN_COOKIE_NAME = "xp_skin";

const SKIN_VALUES: readonly SkinId[] = ["core", "pko"];

/**
 * Request-aware skin resolver.
 *
 * Resolution order (strongest first):
 *   1. `xp_skin` cookie (set by `/api/skin` and persisted across requests)
 *   2. `SKIN` / `NEXT_PUBLIC_SKIN` env var (build-wide default)
 *   3. `"core"` fallback
 *
 * Used by `app/layout.tsx` so a stakeholder can visit
 * `watt-city.vercel.app/api/skin?value=pko` once and see the SKO skin
 * on every subsequent page load — without flipping the Vercel env var
 * for the whole production deployment.
 */
export async function getCurrentSkin(): Promise<SkinId> {
  const store = await cookies();
  const raw = store.get(SKIN_COOKIE_NAME)?.value;
  if (raw && (SKIN_VALUES as readonly string[]).includes(raw)) {
    return raw as SkinId;
  }
  return currentSkin();
}

export function isValidSkin(value: string): value is SkinId {
  return (SKIN_VALUES as readonly string[]).includes(value);
}
