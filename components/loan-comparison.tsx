"use client";
/* V3.7 — Loan comparison ladder.
 *
 * Given a principal + term, shows every eligible product side-by-side
 * sorted by total interest cost ascending. Cheapest row flagged with
 * a green check; kredyt_konsumencki gets the red warning tooltip
 * about hidden fees. "Take this" button per row → /api/loans/take
 * (TODO post-V3: direct route), fallback to existing flow on /miasto.
 */

import { useState } from "react";
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
  | "termLabel",
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
  },
};

type Props = {
  rows: LoanComparisonRow[];
  lang: Lang;
  principal: number;
  termMonths: number;
};

export function LoanComparison({ rows, lang, principal, termMonths }: Props) {
  const t = COPY[lang];
  const [taking, setTaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string | null>(null);

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

  return (
    <section className="card p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="section-heading text-xl sm:text-2xl">{t.heading}</h2>
        <p className="text-xs opacity-70">
          {t.principalLabel}: <strong>{principal.toLocaleString("pl-PL")} W$</strong> ·{" "}
          {t.termLabel}: <strong>{termMonths}</strong>
        </p>
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
                <td className="px-2 py-2 font-bold">
                  <span className="block">{row.type.replace(/_/g, " ")}</span>
                  {row.cheapest && (
                    <span className="text-[10px] font-semibold text-[var(--success)] block">
                      {t.cheapestBadge}
                    </span>
                  )}
                  {row.warning && (
                    <span
                      title={t.warningTooltip}
                      className="text-[10px] font-semibold text-[var(--danger)] block cursor-help"
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
    </section>
  );
}
