"use client";
/* V2 refactor R3.4 — Post-game breakdown modal (HIGH-4 pedagogy).
 *
 * Opens after a score submit when `multBreakdown` is present in the API
 * response. Shows the ladder: Base × factor1 × factor2 ... = final.
 *
 * By construction the final number equals the credited amount, because
 * scoreMultiplier delegates to scoreMultiplierBreakdown on the server.
 * The HIGH-4 regression test (lib/multipliers.test.ts) enforces the
 * "displayed ladder sums to credited amount" invariant.
 */

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { MultBreakdown } from "@/lib/multipliers";
import { resolveFactorLabel } from "@/lib/multipliers";

type Props = {
  lang: Lang;
  baseValue: number;
  /** Credited amount after cap. Shown as the = right-hand side. */
  finalValue: number;
  breakdown: MultBreakdown;
  /** Per-resource credited delta as rendered chips. Optional. */
  resourceDelta?: Record<string, number>;
  onClose: () => void;
};

const COPY: Record<Lang, Record<string, string>> = {
  pl: {
    title: "Wynik gry",
    basePoints: "Punkty bazowe",
    capNote: "Mnożnik ograniczony do ×3",
    close: "OK",
    credited: "Zarobiono",
    explainer:
      "Każdy kafelek to budynek, który zwiększa Twój wynik. Dzięki nim zdobywasz więcej zasobów z tej kategorii gry.",
  },
  uk: {
    title: "Результат гри",
    basePoints: "Базові бали",
    capNote: "Множник обмежено ×3",
    close: "OK",
    credited: "Отримано",
    explainer:
      "Кожна плитка — це будівля, яка збільшує твій результат у цій категорії ігор.",
  },
  cs: {
    title: "Výsledek hry",
    basePoints: "Základní body",
    capNote: "Násobitel omezen na ×3",
    close: "OK",
    credited: "Získáno",
    explainer:
      "Každá dlaždice je budova, která zvyšuje tvůj výsledek v této kategorii her.",
  },
  en: {
    title: "Game result",
    basePoints: "Base points",
    capNote: "Multiplier capped at ×3",
    close: "OK",
    credited: "Earned",
    explainer:
      "Each tile is a building that boosts your result. With them you earn more from this game category.",
  },
};

export function PostGameBreakdown({
  lang,
  baseValue,
  finalValue,
  breakdown,
  resourceDelta,
  onClose,
}: Props) {
  const t = COPY[lang];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape — keyboard accessibility (MEDIUM-16 baseline).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return (
    // No backdrop-click dismiss. Kids routinely fat-fingered the dialog
    // away before reading the multiplier ladder; the explicit OK button
    // (autoFocused below) + Escape handler above are the only dismiss
    // paths. Matches OnboardingTour's interaction pattern.
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pgb-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 motion-safe:animate-in motion-safe:fade-in"
    >
      <div
        className="relative w-full max-w-md border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] bg-[var(--surface)] p-5 flex flex-col gap-4"
      >
        <h2
          id="pgb-title"
          className="text-lg font-black uppercase tracking-tight"
        >
          {t.title}
        </h2>

        {/* Ladder */}
        <ol className="flex flex-col gap-1 text-sm">
          <li className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-1">
            <span>{t.basePoints}</span>
            <span className="font-mono font-bold">{baseValue}</span>
          </li>
          {breakdown.factors.slice(1).map((f) => (
            <li key={f.source} className="flex items-center justify-between">
              <span>{resolveFactorLabel(f, lang)}</span>
              <span className="font-mono text-[var(--accent)] font-bold">
                ×{f.factor.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between border-t-2 border-[var(--ink)] pt-1 mt-1">
            <span className="font-bold">{t.credited}</span>
            <span className="font-mono text-lg font-black">= {finalValue}</span>
          </li>
        </ol>

        {breakdown.capped && (
          <p
            className="text-xs px-2 py-1 border-2 border-[var(--ink)]"
            style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}
          >
            {t.capNote}
          </p>
        )}

        {resourceDelta && Object.keys(resourceDelta).length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs">
            {Object.entries(resourceDelta)
              .filter(([, v]) => v !== 0)
              .map(([k, v]) => (
                <li
                  key={k}
                  className="px-2 py-0.5 border-2 border-[var(--ink)] bg-[var(--surface-2)] font-mono"
                >
                  {k} {v > 0 ? "+" : ""}
                  {v}
                </li>
              ))}
          </ul>
        )}

        <p className="text-[11px] text-zinc-400 leading-snug">{t.explainer}</p>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary self-end"
          autoFocus
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
