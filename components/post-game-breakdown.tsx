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

  // Resource icon map: maps server-side resource ids to display glyphs.
  // Falls back to the raw key (which is already i18n-stable).
  const resourceIcon: Record<string, string> = {
    watts: "⚡",
    coins: "🪙",
    bricks: "🧱",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pgb-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] px-4 motion-safe:animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-md border border-[var(--line)] bg-[var(--surface)] flex flex-col elev-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — sits on a tinted surface so the modal reads as an
            artifact of the game flow, not a raw alert dialog. */}
        <header className="flex items-baseline justify-between gap-3 px-6 py-4 border-b border-[var(--line)] bg-[var(--surface-2)]">
          <h2 id="pgb-title" className="t-h4 text-[var(--accent)]">
            {t.title}
          </h2>
          <span className="t-caption text-[var(--ink-muted)] tabular-nums">
            {t.credited} {finalValue} W
          </span>
        </header>

        {/* Ladder body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            <li className="flex items-center justify-between text-sm">
              <span className="text-[var(--foreground)]">{t.basePoints}</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--foreground)]">
                {baseValue}
              </span>
            </li>
            {breakdown.factors.slice(1).map((f) => (
              <li
                key={f.source}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[var(--ink-muted)] flex items-center gap-2">
                  <span aria-hidden className="text-[var(--accent)] font-mono">
                    ×
                  </span>
                  {resolveFactorLabel(f, lang)}
                </span>
                <span className="font-mono font-semibold tabular-nums text-[var(--accent)]">
                  ×
                  {f.factor
                    .toFixed(2)
                    .replace(/0+$/, "")
                    .replace(/\.$/, "")}
                </span>
              </li>
            ))}
          </ol>

          {/* Result row — prominent navy band */}
          <div
            className="flex items-baseline justify-between gap-3 px-4 py-3 rounded-md"
            style={{
              background: "var(--accent)",
              color: "var(--accent-ink)",
            }}
          >
            <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
              {t.credited}
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {finalValue} W
            </span>
          </div>

          {breakdown.capped && (
            <p
              className="text-xs px-3 py-2 rounded-sm font-medium"
              style={{
                background:
                  "color-mix(in oklab, var(--danger) 12%, transparent)",
                color: "var(--danger)",
              }}
            >
              ⚠ {t.capNote}
            </p>
          )}

          {resourceDelta && Object.keys(resourceDelta).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {Object.entries(resourceDelta)
                .filter(([, v]) => v !== 0)
                .map(([k, v]) => (
                  <li
                    key={k}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs font-medium font-mono tabular-nums"
                  >
                    <span aria-hidden>{resourceIcon[k] ?? "•"}</span>
                    <span className="text-[var(--ink-muted)]">{k}</span>
                    <span
                      className={`font-semibold ${
                        v > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {v > 0 ? "+" : ""}
                      {v}
                    </span>
                  </li>
                ))}
            </ul>
          )}

          <p className="t-caption text-[var(--ink-muted)] leading-snug">
            {t.explainer}
          </p>
        </div>

        {/* Footer — full-width CTA so on mobile the tap target is obvious. */}
        <footer className="px-6 py-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full"
            autoFocus
          >
            {t.close}
          </button>
        </footer>
      </div>
    </div>
  );
}
