import { CashflowHud } from "@/components/cashflow-hud";
import { buildHudBundle } from "@/lib/hud-data";
import { deficitState } from "@/lib/watts";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { isFlagEnabled } from "@/lib/feature-flags";
import { getLang } from "@/lib/i18n-server";

/* Per-page CashflowHud mount.
 *
 * Moved out of `app/layout.tsx` 2026-04-23 — a global HUD on every
 * authenticated page duplicated info already exposed via SiteNav's
 * resource-bar + WattDeficitPanel + NotificationBell. Most pages got
 * no unique value from it, and three UI-overlap bugs (HUD vs
 * BottomTabs / NewGameToast / WattDeficitPanel on /miasto) tracked
 * back to the global mount.
 *
 * The HUD earns its keep on two surfaces only:
 *   - /miasto — active decisions about building, yields matter here
 *   - /loans/compare — "can I afford this loan's monthly payment?"
 * On both pages the projected hourly yield + watt balance feed the
 * decision the user is making RIGHT NOW. Other pages use the nav's
 * resource-bar for passive state.
 *
 * Server component by design: reads session + feature flag + player
 * state with zero hydration overhead, then mounts the client HUD
 * component only when needed. */
export async function CashflowHudMount() {
  const session = await getSession();
  if (!session) return null;
  const [hudEnabled, brownoutPanelEnabled, player, lang] = await Promise.all([
    isFlagEnabled("v2_cashflow_hud", session.username),
    isFlagEnabled("v3_brownout_panel", session.username),
    getPlayerState(session.username),
    getLang(),
  ]);
  if (!hudEnabled || !player) return null;
  return (
    <CashflowHud
      hud={buildHudBundle(player, Date.now(), {
        brownoutBannerActive:
          brownoutPanelEnabled && deficitState(player).inDeficit,
      })}
      lang={lang}
    />
  );
}
