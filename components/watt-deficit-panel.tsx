"use client";
/* V3.3 — sticky watt-deficit banner + rescue CTAs.
 *
 * Mounted from `app/layout.tsx` only when `deficitState(player).inDeficit`
 * is true AND the `v3_brownout_panel` feature flag is on. Shows:
 *  - hours-in-deficit counter
 *  - countdown to the next brownout milestone (24h/48h/72h)
 *  - one-tap "Build Mała elektrownia" CTA that links to /miasto?build=...
 *  - secondary "Vziať rescue loan" CTA that POSTs /api/loans/rescue
 *
 * Uses the same amber severity grammar as the cashflow HUD so the
 * system speaks one visual language under stress.
 */

import { useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import type { DeficitState } from "@/lib/watts";

type Copy = Record<
  | "title"
  | "elapsed"
  | "nextMilestone50"
  | "nextMilestone25"
  | "nextMilestoneBankruptcy"
  | "buildCta"
  | "rescueCta"
  | "rescueTaking"
  | "rescueDone"
  | "rescueAlreadyUsed"
  | "dismiss",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    title: "⚠️ Niedobór energii w mieście",
    elapsed: "Trwa od {h}h",
    nextMilestone50: "Za {h}h produkcja spadnie do 50%",
    nextMilestone25: "Za {h}h produkcja spadnie do 25%",
    nextMilestoneBankruptcy: "Za {h}h restrukturyzacja będzie możliwa",
    buildCta: "⚡ Postaw Małą elektrownię",
    rescueCta: "💰 Weź awaryjny kredyt 0% (150 monet)",
    rescueTaking: "Przyjmuję kredyt…",
    rescueDone: "Kredyt wzięty. Zbuduj elektrownię szybko.",
    rescueAlreadyUsed: "Już użyłeś awaryjnego kredytu w tym miesiącu.",
    dismiss: "Ukryj",
  },
  uk: {
    title: "⚠️ Дефіцит енергії в місті",
    elapsed: "Триває {h}г",
    nextMilestone50: "Через {h}г виробництво впаде до 50%",
    nextMilestone25: "Через {h}г виробництво впаде до 25%",
    nextMilestoneBankruptcy: "Через {h}г буде можлива реструктуризація",
    buildCta: "⚡ Збудувати Малу електростанцію",
    rescueCta: "💰 Взяти аварійний кредит 0% (150 монет)",
    rescueTaking: "Беру кредит…",
    rescueDone: "Кредит взятий. Швидко збудуй електростанцію.",
    rescueAlreadyUsed: "Ти вже брав аварійний кредит цього місяця.",
    dismiss: "Приховати",
  },
  cs: {
    title: "⚠️ Nedostatek energie ve městě",
    elapsed: "Trvá {h}h",
    nextMilestone50: "Za {h}h výroba klesne na 50%",
    nextMilestone25: "Za {h}h výroba klesne na 25%",
    nextMilestoneBankruptcy: "Za {h}h bude možná restrukturalizace",
    buildCta: "⚡ Postavit Malou elektrárnu",
    rescueCta: "💰 Vzít nouzovou půjčku 0% (150 mincí)",
    rescueTaking: "Beru půjčku…",
    rescueDone: "Půjčka vzata. Rychle postav elektrárnu.",
    rescueAlreadyUsed: "Už jsi vzal nouzovou půjčku tento měsíc.",
    dismiss: "Skrýt",
  },
  en: {
    title: "⚠️ City power deficit",
    elapsed: "Running for {h}h",
    nextMilestone50: "Production drops to 50% in {h}h",
    nextMilestone25: "Production drops to 25% in {h}h",
    nextMilestoneBankruptcy: "Restructuring available in {h}h",
    buildCta: "⚡ Build Small Power Plant",
    rescueCta: "💰 Take rescue loan (0% APR, 150 coins)",
    rescueTaking: "Taking loan…",
    rescueDone: "Loan issued. Build the power plant ASAP.",
    rescueAlreadyUsed: "You already used the rescue loan this month.",
    dismiss: "Hide",
  },
};

type Props = {
  deficit: DeficitState;
  lang: Lang;
};

export function WattDeficitPanel({ deficit, lang }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [rescueState, setRescueState] = useState<
    "idle" | "taking" | "done" | "already-used"
  >("idle");
  const t = COPY[lang];

  if (!deficit.inDeficit) return null;
  if (dismissed) return null;

  const hoursInDeficit = Math.floor(deficit.hoursInDeficit);
  const hoursToNext =
    deficit.hoursToNextMilestone == null
      ? null
      : Math.max(1, Math.ceil(deficit.hoursToNextMilestone));

  const nextMilestoneLabel = (() => {
    if (hoursToNext == null) return null;
    const h = String(hoursToNext);
    switch (deficit.nextMilestone) {
      case "50-percent-yield":
        return t.nextMilestone50.replace("{h}", h);
      case "25-percent-yield":
        return t.nextMilestone25.replace("{h}", h);
      case "bankruptcy-eligible":
        return t.nextMilestoneBankruptcy.replace("{h}", h);
      default:
        return null;
    }
  })();

  async function takeRescue() {
    if (rescueState !== "idle") return;
    setRescueState("taking");
    try {
      const res = await fetch("/api/loans/rescue", { method: "POST" });
      const j = await res.json();
      if (j.ok) {
        setRescueState("done");
        // Soft reload so /miasto + HUD reflect the +150 coins.
        setTimeout(() => window.location.reload(), 800);
      } else if (j.error === "already-used-this-month") {
        setRescueState("already-used");
      } else {
        setRescueState("idle");
      }
    } catch {
      setRescueState("idle");
    }
  }

  return (
    <aside
      role="alert"
      aria-labelledby="wdp-title"
      /* sticky offset: desktop = 64 px (h-16 main nav row only).
         Mobile = 144 px because SiteNav stacks main row 64 + secondary
         nav ~40 + resource-bar ~40 (all rendered inside the sticky
         <header>). Before this fix the panel pinned at 64 px and let
         the secondary nav + resource-bar scroll past over it, hiding
         the critical-state banner under the nav stack.
         The panel is only rendered for authenticated users who are
         in deficit, so resource-bar is always present → 144 is safe. */
      className="sticky top-[144px] sm:top-16 z-[30] border-b border-[var(--danger)] bg-[var(--surface-2)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <p id="wdp-title" className="font-semibold text-[var(--foreground)]">
            {t.title}
          </p>
          <p className="t-body-sm text-[var(--ink-muted)]">
            {t.elapsed.replace("{h}", String(hoursInDeficit))}
            {nextMilestoneLabel ? ` · ${nextMilestoneLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/miasto?build=mala-elektrownia"
            className="btn btn-primary text-xs"
          >
            {t.buildCta}
          </Link>
          <button
            type="button"
            onClick={takeRescue}
            disabled={rescueState === "taking" || rescueState === "done"}
            className="btn btn-ghost text-xs disabled:opacity-50"
          >
            {rescueState === "taking"
              ? t.rescueTaking
              : rescueState === "done"
                ? t.rescueDone
                : rescueState === "already-used"
                  ? t.rescueAlreadyUsed
                  : t.rescueCta}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t.dismiss}
            className="text-xs opacity-50 hover:opacity-100 w-6 h-6 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
