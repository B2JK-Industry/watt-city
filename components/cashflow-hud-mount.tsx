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
 * resource-bar + WattDeficitPanel + NotificationBell.
 *
 * Final home: /loans/compare only. A first pass also kept it on
 * /miasto but the per-building slot cards already surface each
 * building's yield inline, so the aggregate HUD turned out to be
 * redundant there. The loan-compare surface is the one place where
 * "projected hourly yield vs monthly payment" is the actual
 * decision the user is making.
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
