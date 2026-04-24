"use client";
/* V2 refactor R2.3 — cashflow HUD (BLOCKER-1 rescue CTA + HIGH-12 viewport matrix).
 *
 * Viewport matrix (HIGH-12 fix):
 *   mobile portrait  <640px   — fixed bottom strip above BottomTabs, with
 *                              iOS safe-area inset, swipe-dismissible
 *   mobile landscape         — falls into the same <640 path; collapsed
 *                              to "compact" mode by a CSS orientation query
 *   tablet portrait 640-1024 — fixed top-right dock under nav
 *   desktop        ≥1024     — fixed top-right dock under nav
 *   /miasto        (any)     — side-dock variant so the city canvas stays
 *                              visible (achieved via a data attribute on
 *                              <body> written by the page layout)
 *
 * Z-index: z-[35] — under modals (z-50) so full-screen dialogs occlude it,
 * above SiteNav (z-20) so balance is always visible on non-modal pages.
 *
 * Stale state: if lastTick > 5min, renders a clock icon + "aktualizuj"
 * action that re-triggers the lazy tick via a POST to /api/buildings/tick.
 *
 * Reduced motion: the pulse on the amber banner respects
 * `prefers-reduced-motion`.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import type { HudBundle } from "@/lib/hud-data";

type CopyKey =
  | "balance"
  | "perHour"
  | "brownoutTier2"
  | "brownoutSustained"
  | "rescueBuild"
  | "loanRisk"
  | "stale"
  | "refresh"
  | "dismiss"
  | "deficitTitle"
  | "nextMilestone50"
  | "nextMilestone25"
  | "nextMilestoneBankruptcy";

type Copy = Record<CopyKey, string>;

// Copy is intentionally parallel with COPY in components/watt-deficit-panel.tsx
// so a user reading both widgets in one viewport gets a single timeline
// narrative (e.g. "-50% in 23h") rather than two conflicting countdowns.
const COPY: Record<Lang, Copy> = {
  pl: {
    balance: "Saldo",
    perHour: "/h",
    brownoutTier2: "Niedobór mocy — produkcja -50%",
    brownoutSustained: "Trwały niedobór — produkcja -75%",
    rescueBuild: "Postaw Małą elektrownię",
    loanRisk: "Kredyt zagrożony — zaplanuj spłatę",
    stale: "Dane sprzed chwili",
    refresh: "Odśwież",
    dismiss: "Ukryj",
    deficitTitle: "Niedobór Watów",
    nextMilestone50: "Za {h}h produkcja spadnie do 50%",
    nextMilestone25: "Za {h}h produkcja spadnie do 25%",
    nextMilestoneBankruptcy: "Za {h}h restrukturyzacja",
  },
  uk: {
    balance: "Баланс",
    perHour: "/год",
    brownoutTier2: "Дефіцит енергії — виробництво -50%",
    brownoutSustained: "Сталий дефіцит — виробництво -75%",
    rescueBuild: "Збудувати Малу електростанцію",
    loanRisk: "Кредит під загрозою — сплануй виплату",
    stale: "Дані застарілі",
    refresh: "Оновити",
    dismiss: "Приховати",
    deficitTitle: "Дефіцит ват",
    nextMilestone50: "Через {h}г виробництво впаде до 50%",
    nextMilestone25: "Через {h}г виробництво впаде до 25%",
    nextMilestoneBankruptcy: "Через {h}г реструктуризація",
  },
  cs: {
    balance: "Zůstatek",
    perHour: "/h",
    brownoutTier2: "Nedostatek energie — výroba -50%",
    brownoutSustained: "Trvalý nedostatek — výroba -75%",
    rescueBuild: "Postavit Malou elektrárnu",
    loanRisk: "Úvěr v ohrožení — naplánuj splátku",
    stale: "Zastaralá data",
    refresh: "Obnovit",
    dismiss: "Skrýt",
    deficitTitle: "Nedostatek wattů",
    nextMilestone50: "Za {h}h výroba klesne na 50%",
    nextMilestone25: "Za {h}h výroba klesne na 25%",
    nextMilestoneBankruptcy: "Za {h}h restrukturalizace",
  },
  en: {
    balance: "Balance",
    perHour: "/h",
    brownoutTier2: "Watt deficit — output -50%",
    brownoutSustained: "Sustained deficit — output -75%",
    rescueBuild: "Build Small Power Plant",
    loanRisk: "Loan at risk — plan the payment",
    stale: "Data is a bit old",
    refresh: "Refresh",
    dismiss: "Hide",
    deficitTitle: "Watt shortfall",
    nextMilestone50: "Output drops to 50% in {h}h",
    nextMilestone25: "Output drops to 25% in {h}h",
    nextMilestoneBankruptcy: "Restructuring in {h}h",
  },
};

type Props = {
  hud: HudBundle;
  lang: Lang;
};

// localStorage key: dismissal is keyed on the alert reason string so
// the HUD auto-re-opens the moment the alert changes (e.g. "income +
// loan safe" → "watts going negative"). Same reason string ⇒ stays
// hidden across navigation + reload. Empty-string reason = no current
// alert, so dismissal just hides the ambient HUD.
const HUD_DISMISS_KEY = "wc_hud_dismiss_v1";

type HudDismiss = { reason: string; ts: number };

function readHudDismiss(): HudDismiss | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HUD_DISMISS_KEY);
    return raw ? (JSON.parse(raw) as HudDismiss) : null;
  } catch {
    return null;
  }
}

function writeHudDismiss(reason: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HUD_DISMISS_KEY,
      JSON.stringify({ reason, ts: Date.now() }),
    );
  } catch {
    /* best-effort */
  }
}

export function CashflowHud({ hud, lang }: Props) {
  const pathname = usePathname();
  const copy = COPY[lang];
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch (and re-tick) on demand. Triggered from stale-state banner.
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetch("/api/buildings/tick", { method: "POST" });
      // Soft reload — preserves scroll, re-renders with fresh HUD data.
      if (typeof window !== "undefined") window.location.reload();
    } catch {
      setRefreshing(false);
    }
  }

  // Re-evaluate dismissal against localStorage whenever the alert
  // reason changes. Same reason string ⇒ stay hidden; different ⇒ pop
  // back. This replaces the old in-memory-only reset that made the HUD
  // reappear after every navigation.
  useEffect(() => {
    const prev = readHudDismiss();
    setDismissed(prev !== null && prev.reason === hud.alertReason);
  }, [hud.alertReason]);

  function dismiss() {
    writeHudDismiss(hud.alertReason ?? "");
    setDismissed(true);
  }

  if (dismissed && hud.alertLevel !== "critical") return null;

  const onCityPage = pathname?.startsWith("/miasto") ?? false;
  const inDeficit = hud.watts.inDeficit;
  const stale = hud.msSinceTick > 5 * 60 * 1000;

  const severityColor =
    hud.alertLevel === "critical"
      ? "var(--danger)"
      : hud.alertLevel === "warn"
        ? "#f97316" // amber
        : hud.alertLevel === "info"
          ? "var(--accent)"
          : "var(--surface)";

  return (
    <div
      data-hud-mode={onCityPage ? "side" : "corner"}
      className={[
        "cashflow-hud fixed z-[35] font-mono tabular-nums text-xs",
        // Mobile portrait & landscape: bottom strip above BottomTabs (h-14).
        "inset-x-2 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0))]",
        // Tablet+: top-right dock, one size up.
        "sm:inset-x-auto sm:right-3 sm:top-20 sm:bottom-auto sm:w-72",
        // /miasto on tablet+: shift to LEFT dock so the canvas (right of
        // the map catalog) stays unobstructed.
        onCityPage
          ? "sm:right-auto sm:left-3 sm:top-[7.5rem]"
          : "",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-label={copy.balance}
    >
      <div
        className="border border-[var(--line)] bg-[var(--surface)]"
        style={{ borderColor: severityColor }}
      >
        {/* Core row: balance + per-hour + watt chip */}
        <div className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] opacity-60">
              {copy.balance}
            </span>
            <span className="font-bold text-sm sm:text-base truncate">
              {hud.cashBalance.toLocaleString("pl-PL")}
            </span>
            <span className="text-[11px] opacity-70">
              +{hud.projectedHourly.toLocaleString("pl-PL")}
              {copy.perHour}
            </span>
          </div>
          <WattChip net={hud.watts.net} inDeficit={inDeficit} />
          {!inDeficit && hud.alertLevel !== "critical" && (
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex w-7 h-7 sm:w-6 sm:h-6 items-center justify-center text-xs sm:text-[10px] opacity-60 hover:opacity-100 active:opacity-100"
              aria-label={copy.dismiss}
            >
              ✕
            </button>
          )}
        </div>

        {/* Deficit banner + rescue CTA. Hidden when the dedicated
            WattDeficitPanel is already rendering at the top of the
            viewport — two widgets showing two different countdowns for
            the same deficit state confused users (banner said "-50%
            in 23h", HUD said "rescue window 71h"; both technically true
            but narrative-incompatible). Single source of truth. */}
        {inDeficit && !hud.brownoutBannerActive && (
          <div
            className="px-2 py-2 sm:px-3 border-t border-[var(--line)]"
            style={{ background: severityColor + "30" }}
          >
            <div className="font-bold text-[11px]">
              {hud.watts.brownout <= 0.25
                ? copy.brownoutSustained
                : hud.watts.brownout <= 0.5
                  ? copy.brownoutTier2
                  : copy.deficitTitle}
            </div>
            {hud.watts.hoursToNextMilestone != null &&
              hud.watts.nextMilestone != null && (
                <div className="text-[10px] opacity-70 mt-0.5">
                  {(() => {
                    const h = String(hud.watts.hoursToNextMilestone);
                    switch (hud.watts.nextMilestone) {
                      case "50-percent-yield":
                        return copy.nextMilestone50.replace("{h}", h);
                      case "25-percent-yield":
                        return copy.nextMilestone25.replace("{h}", h);
                      case "bankruptcy-eligible":
                        return copy.nextMilestoneBankruptcy.replace("{h}", h);
                      default:
                        return null;
                    }
                  })()}
                </div>
              )}
            <Link
              href="/miasto?build=mala-elektrownia"
              className="mt-1 inline-flex items-center gap-1 px-2 py-1 border border-[var(--line)] bg-[var(--sales)] font-bold text-[11px] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
            >
              ⚡ {copy.rescueBuild}
            </Link>
          </div>
        )}

        {/* Loan-risk banner (secondary — only when no watt deficit) */}
        {!inDeficit && hud.loanRisk.length > 0 && (
          <div
            className="px-2 py-1.5 sm:px-3 border-t border-[var(--line)] text-[11px]"
            style={{ background: "#f97316" + "30" }}
          >
            {copy.loanRisk}
          </div>
        )}

        {/* Stale-state pill */}
        {stale && !inDeficit && hud.loanRisk.length === 0 && (
          <div className="px-2 py-1 sm:px-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] opacity-80">
            <span>🕓 {copy.stale}</span>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="underline font-bold disabled:opacity-50"
            >
              {copy.refresh}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WattChip({
  net,
  inDeficit,
}: {
  net: number;
  inDeficit: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5 font-bold text-[11px] border border-[var(--line)] px-1.5 py-0.5"
      style={{
        background: inDeficit ? "var(--danger)" : "var(--success)",
        color: "var(--accent-ink)",
      }}
    >
      ⚡ {net > 0 ? "+" : ""}
      {net}
    </span>
  );
}
