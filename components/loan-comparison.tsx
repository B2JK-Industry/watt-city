"use client";
/* V3.7 — Loan comparison ladder.
 *
 * Given a principal + term, shows every eligible product side-by-side
 * sorted by total interest cost ascending. Cheapest row flagged with
 * a green check; kredyt_konsumencki gets the red warning tooltip
 * about hidden fees. "Take this" button per row → /api/loans/take
 * (TODO post-V3: direct route), fallback to existing flow on /miasto.
 *
 * G-04 (F-NEW-09) — interactive controls. Principal slider +
 * segmented term selector live above the table. Every change
 * pushes the new params into the URL via `router.replace` so the
 * server re-renders `compareLoans(principal, termMonths)`. We
 * don't keep a parallel client-side state — single source of
 * truth stays the URL params, the table redraws on RSC re-fetch.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import type { LoanComparisonRow } from "@/lib/loans";

type Copy = Record<
  | "heading"
  | "colProduct"
  | "colMonthly"
  | "colTotalInterest"
  | "colRrso"
  | "colAction"
  | "cheapestBadge"
  | "warningBadge"
  | "warningTooltip"
  | "takeCta"
  | "ineligible"
  | "noRows"
  | "principalLabel"
  | "termLabel"
  | "principalAria"
  | "termAria",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    heading: "Porównaj kredyty",
    colProduct: "Produkt",
    colMonthly: "Miesięcznie",
    colTotalInterest: "Odsetki łącznie",
    colRrso: "RRSO",
    colAction: "",
    cheapestBadge: "✅ Najtańszy",
    warningBadge: "⚠️ Uwaga",
    warningTooltip:
      "Kredyty konsumenckie często mają ukryte opłaty. Zawsze porównaj alternatywy.",
    takeCta: "Weź",
    ineligible: "niedostępny",
    noRows: "Żaden produkt nie pasuje do tego terminu. Zmień długość spłaty.",
    principalLabel: "Kwota",
    termLabel: "Okres (msc)",
    principalAria: "Kwota kredytu w W$",
    termAria: "Okres spłaty w miesiącach",
  },
  uk: {
    heading: "Порівняй кредити",
    colProduct: "Продукт",
    colMonthly: "Щомісяця",
    colTotalInterest: "Відсотки разом",
    colRrso: "RRSO",
    colAction: "",
    cheapestBadge: "✅ Найдешевший",
    warningBadge: "⚠️ Увага",
    warningTooltip:
      "Споживчі кредити часто мають приховані збори. Завжди порівнюй альтернативи.",
    takeCta: "Взяти",
    ineligible: "недоступний",
    noRows: "Жоден продукт не підходить для цього терміну.",
    principalLabel: "Сума",
    termLabel: "Період (міс)",
    principalAria: "Сума кредиту в W$",
    termAria: "Період погашення (міс)",
  },
  cs: {
    heading: "Porovnej půjčky",
    colProduct: "Produkt",
    colMonthly: "Měsíčně",
    colTotalInterest: "Úroky celkem",
    colRrso: "RRSO",
    colAction: "",
    cheapestBadge: "✅ Nejlevnější",
    warningBadge: "⚠️ Pozor",
    warningTooltip:
      "Spotřebitelské úvěry často mají skryté poplatky. Vždy srovnej alternativy.",
    takeCta: "Vzít",
    ineligible: "nedostupný",
    noRows: "Žádný produkt nepasuje na tento termín.",
    principalLabel: "Částka",
    termLabel: "Období (měs)",
    principalAria: "Částka úvěru v W$",
    termAria: "Doba splácení v měsících",
  },
  en: {
    heading: "Compare loans",
    colProduct: "Product",
    colMonthly: "Monthly",
    colTotalInterest: "Total interest",
    colRrso: "APR",
    colAction: "",
    cheapestBadge: "✅ Cheapest",
    warningBadge: "⚠️ Caution",
    warningTooltip:
      "Consumer credit often has hidden fees. Always compare alternatives.",
    takeCta: "Take",
    ineligible: "ineligible",
    noRows: "No product matches this term — change the repayment length.",
    principalLabel: "Principal",
    termLabel: "Term (mo)",
    principalAria: "Loan principal in W$",
    termAria: "Term in months",
  },
};

/* G-04 — fixed term presets (per spec). Allowing arbitrary values
 * would let the URL encode unsupported terms; the segmented control
 * matches what `compareLoans` validates against. */
const TERM_OPTIONS = [6, 12, 24, 36] as const;
const PRINCIPAL_MIN = 1000;
const PRINCIPAL_MAX = 10000;
const PRINCIPAL_STEP = 500;

type Props = {
  rows: LoanComparisonRow[];
  lang: Lang;
  principal: number;
  termMonths: number;
  /** R-03 — `inline` strips the outer `card` + `<h2>` so the
   *  comparison can be embedded inside another card (e.g. the
   *  MortgageCard collapse on /miasto). The default keeps the
   *  full-page layout `/loans/compare` ships today. */
  variant?: "page" | "inline";
  /** F-01 — fired after the user successfully takes a loan via
   *  `/api/loans/take-generic`. Inline hosts (MortgageCard) need this
   *  to refresh their parent state so the active-loans list and
   *  resource bar update without a full page reload. */
  onLoanTaken?: () => void | Promise<void>;
};

export function LoanComparison({
  rows,
  lang,
  principal,
  termMonths,
  variant = "page",
  onLoanTaken,
}: Props) {
  const t = COPY[lang];
  const router = useRouter();
  const pathname = usePathname();
  const [taking, setTaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string | null>(null);
  // Mirror props in local state so the slider feels responsive even
  // before the RSC re-fetch returns; props win on the next render.
  const [draftPrincipal, setDraftPrincipal] = useState(principal);
  useEffect(() => setDraftPrincipal(principal), [principal]);

  // Debounce URL push during slider drag — avoid burning a
  // server-render per pixel of `<input type=range>` movement.
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pushParams(p: number, term: number) {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      const usp = new URLSearchParams();
      usp.set("principal", String(p));
      usp.set("term", String(term));
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    }, 200);
  }
  useEffect(() => () => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
  }, []);

  async function takeLoan(type: string) {
    setTaking(type);
    setError(null);
    try {
      // V3.7: comparison routes through the generic take endpoint which
      // handles every Phase-2 product type (mortgage, kredyt_obrotowy,
      // kredyt_konsumencki, leasing) through one POST.
      const res = await fetch("/api/loans/take-generic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, principal, termMonths }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? "unknown");
      } else {
        setTaken(type);
        if (onLoanTaken) await onLoanTaken();
      }
    } finally {
      setTaking(null);
    }
  }

  if (rows.length === 0) {
    return (
      <section className="card p-4">
        <p className="text-sm text-[var(--ink-muted)]">{t.noRows}</p>
      </section>
    );
  }

  // R-03 — `variant="inline"` skips the `.card` wrapper + `<h2>`. The
  // host already owns its surface (e.g. MortgageCard's `.card`), so a
  // double-card would visibly stack two outlines. The controls + table
  // still render with their normal spacing.
  const Wrapper = variant === "inline" ? "div" : "section";
  return (
    <Wrapper
      className={
        variant === "inline"
          ? "flex flex-col gap-3"
          : "card p-4 sm:p-6 flex flex-col gap-4"
      }
    >
      {variant !== "inline" && (
        <h2 className="section-heading text-xl sm:text-2xl">{t.heading}</h2>
      )}

      {/* G-04 — Interactive controls. Principal is a range slider
          (1k–10k W$, step 500). Term is a 4-option segmented row.
          Each change pushes to URL (debounced) → server re-renders
          the comparison. The visible value mirrors the dragged
          number so the slider feels live; props win on next render. */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between t-body-sm text-[var(--ink-muted)]">
            <span>{t.principalLabel}</span>
            <span className="tabular-nums font-semibold text-[var(--accent)]">
              {draftPrincipal.toLocaleString("pl-PL")} W$
            </span>
          </span>
          <input
            type="range"
            aria-label={t.principalAria}
            min={PRINCIPAL_MIN}
            max={PRINCIPAL_MAX}
            step={PRINCIPAL_STEP}
            value={draftPrincipal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDraftPrincipal(v);
              pushParams(v, termMonths);
            }}
            className="w-full accent-[var(--accent)]"
          />
        </label>
        <div
          role="radiogroup"
          aria-label={t.termAria}
          className="flex flex-wrap gap-1.5"
        >
          {TERM_OPTIONS.map((m) => {
            const active = m === termMonths;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pushParams(draftPrincipal, m)}
                className={`tap-target inline-flex items-center justify-center px-4 rounded-md transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-ink)] font-semibold"
                    : "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--line)] hover:border-[var(--accent)]"
                }`}
              >
                <span className="tabular-nums">
                  {m} <span className="opacity-60">{t.termLabel.replace(/^.*\(/, "(")}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] opacity-60 border-b border-[var(--line)]">
              <th className="text-left px-2 py-1">{t.colProduct}</th>
              <th className="text-right px-2 py-1">{t.colMonthly}</th>
              <th className="text-right px-2 py-1">{t.colTotalInterest}</th>
              <th className="text-right px-2 py-1">{t.colRrso}</th>
              <th className="text-right px-2 py-1">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.type}
                className={`border-b border-[var(--line)] ${
                  !row.ok ? "opacity-50" : ""
                } ${row.warning ? "bg-[color:color-mix(in_srgb,var(--danger),transparent_85%)]" : ""} ${
                  row.cheapest ? "bg-[color:color-mix(in_srgb,var(--success),transparent_85%)]" : ""
                }`}
              >
                <td className="px-2 py-2 font-semibold">
                  <span className="block">{row.type.replace(/_/g, " ")}</span>
                  {row.cheapest && (
                    // The row already carries a green-tinted background
                    // for the "cheapest" semantic. Inline text uses the
                    // accent (navy 10:1 on white) so it stays legible
                    // both on the surface and on the green tint —
                    // `var(--success)` falls just under WCAG AA on the
                    // tinted surface (axe-core color-contrast finding).
                    <span className="text-[10px] font-semibold text-[var(--accent)] block">
                      {t.cheapestBadge}
                    </span>
                  )}
                  {row.warning && (
                    // Same rationale as the cheapest badge: the row
                    // already carries a danger-tinted bg; navy text
                    // keeps WCAG AA on the pink-ish surface where the
                    // raw `--danger` red falls under 4.5:1.
                    <span
                      title={t.warningTooltip}
                      className="text-[10px] font-semibold text-[var(--accent)] block cursor-help"
                    >
                      {t.warningBadge}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">
                  {row.monthlyPayment.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">
                  {row.totalInterest.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">
                  {(row.rrso * 100).toFixed(1)}%
                </td>
                <td className="px-2 py-2 text-right">
                  {row.ok ? (
                    <button
                      type="button"
                      onClick={() => takeLoan(row.type)}
                      disabled={taking !== null || taken !== null}
                      className="btn btn-primary text-xs disabled:opacity-50"
                    >
                      {taken === row.type
                        ? "✓"
                        : taking === row.type
                          ? "…"
                          : t.takeCta}
                    </button>
                  ) : (
                    <span className="text-[10px] opacity-50">{t.ineligible}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">Error: {error}</p>}
    </Wrapper>
  );
}
