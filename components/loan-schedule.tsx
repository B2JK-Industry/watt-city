"use client";
/* V3.5 — Loan schedule dashboard widget.
 *
 * Shows every active loan with next payment amount + date, progress bar
 * (monthsPaid/termMonths), status badge, and a per-loan auto-repay
 * toggle that PATCHes /api/loans/{id}/auto-repay. Renders nothing when
 * the player has no active loans.
 */

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import type { Loan } from "@/lib/player";

type Copy = Record<
  | "heading"
  | "noLoans"
  | "nextPayment"
  | "progress"
  | "autoRepayOn"
  | "autoRepayOff"
  | "statusOnTrack"
  | "statusAtRisk"
  | "statusOverdue"
  | "toggleUpdating",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    heading: "📅 Twoje kredyty",
    noLoans: "Brak aktywnych kredytów.",
    nextPayment: "Następna rata",
    progress: "Spłacono",
    autoRepayOn: "Auto-spłata ON",
    autoRepayOff: "Auto-spłata OFF",
    statusOnTrack: "Na czas",
    statusAtRisk: "Ryzyko",
    statusOverdue: "Zaległość",
    toggleUpdating: "…",
  },
  uk: {
    heading: "📅 Твої кредити",
    noLoans: "Немає активних кредитів.",
    nextPayment: "Наступний платіж",
    progress: "Сплачено",
    autoRepayOn: "Авто-погашення ON",
    autoRepayOff: "Авто-погашення OFF",
    statusOnTrack: "У строк",
    statusAtRisk: "Ризик",
    statusOverdue: "Прострочення",
    toggleUpdating: "…",
  },
  cs: {
    heading: "📅 Tvé úvěry",
    noLoans: "Žádné aktivní úvěry.",
    nextPayment: "Další splátka",
    progress: "Splaceno",
    autoRepayOn: "Auto-splácení ON",
    autoRepayOff: "Auto-splácení OFF",
    statusOnTrack: "Včas",
    statusAtRisk: "Riziko",
    statusOverdue: "Po splatnosti",
    toggleUpdating: "…",
  },
  en: {
    heading: "📅 Your loans",
    noLoans: "No active loans.",
    nextPayment: "Next payment",
    progress: "Paid",
    autoRepayOn: "Auto-pay ON",
    autoRepayOff: "Auto-pay OFF",
    statusOnTrack: "On track",
    statusAtRisk: "At risk",
    statusOverdue: "Overdue",
    toggleUpdating: "…",
  },
};

type Props = {
  loans: Loan[];
  lang: Lang;
};

export function LoanSchedule({ loans, lang }: Props) {
  const t = COPY[lang];
  const active = loans.filter((l) => l.status === "active");
  if (active.length === 0) return null;

  return (
    <section
      className="card p-5 flex flex-col gap-4"
      aria-labelledby="loan-schedule-heading"
    >
      <h2
        id="loan-schedule-heading"
        className="brutal-heading text-lg sm:text-xl"
      >
        {t.heading}
      </h2>
      <ul className="flex flex-col gap-3">
        {active.map((loan) => (
          <LoanRow key={loan.id} loan={loan} lang={lang} copy={t} />
        ))}
      </ul>
    </section>
  );
}

function LoanRow({
  loan,
  lang,
  copy,
}: {
  loan: Loan;
  lang: Lang;
  copy: Copy;
}) {
  const [autoRepay, setAutoRepay] = useState(loan.autoRepay !== false);
  const [pending, startTransition] = useTransition();
  // Snapshot "now" once per render; the widget re-renders on any state change anyway.
  const [nowMs] = useState(() => Date.now());
  const daysUntilDue = Math.max(
    0,
    Math.ceil((loan.nextPaymentDueAt - nowMs) / (24 * 60 * 60 * 1000)),
  );
  const overdue = loan.nextPaymentDueAt < nowMs;
  const missedInARow = loan.missedConsecutive ?? 0;
  const statusLabel = overdue
    ? copy.statusOverdue
    : missedInARow > 0
      ? copy.statusAtRisk
      : copy.statusOnTrack;
  const statusColor = overdue
    ? "var(--neo-pink)"
    : missedInARow > 0
      ? "#f97316"
      : "var(--neo-lime)";

  const progressPct = Math.round(
    ((loan.monthsPaid ?? 0) / Math.max(1, loan.termMonths)) * 100,
  );

  const dueLabel = new Date(loan.nextPaymentDueAt).toLocaleDateString(
    lang === "pl"
      ? "pl-PL"
      : lang === "uk"
        ? "uk-UA"
        : lang === "cs"
          ? "cs-CZ"
          : "en-US",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  async function toggle() {
    const next = !autoRepay;
    setAutoRepay(next);
    startTransition(async () => {
      try {
        await fetch(`/api/loans/${loan.id}/auto-repay`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        });
      } catch {
        // Revert on failure
        setAutoRepay(!next);
      }
    });
  }

  return (
    <li className="border-2 border-[var(--ink)] p-3 rounded flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="font-bold text-sm">
          {loan.type.replace(/_/g, " ")} · {loan.id.slice(0, 10)}
        </span>
        <span
          className="text-[10px] uppercase px-2 py-0.5 border-2 border-[var(--ink)] font-black"
          style={{ background: statusColor, color: "#0a0a0f" }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="opacity-70">
          {copy.nextPayment}: <strong>{dueLabel}</strong> · {daysUntilDue}d
        </span>
        <span className="font-mono font-bold">
          {Math.ceil(loan.monthlyPayment)} W$
        </span>
      </div>
      <div className="h-1.5 border-2 border-[var(--ink)] bg-[var(--surface-2)] relative overflow-hidden">
        <div
          className="h-full bg-[var(--accent)]"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] opacity-70">
        <span>
          {copy.progress}: {loan.monthsPaid ?? 0}/{loan.termMonths}
        </span>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="px-2 py-0.5 border-2 border-[var(--ink)] font-bold tabular-nums hover:shadow-[2px_2px_0_0_var(--ink)] transition-shadow disabled:opacity-50"
          style={{
            background: autoRepay ? "var(--neo-lime)" : "var(--surface-2)",
            color: autoRepay ? "#0a0a0f" : "inherit",
          }}
          aria-pressed={autoRepay}
        >
          {pending
            ? copy.toggleUpdating
            : autoRepay
              ? copy.autoRepayOn
              : copy.autoRepayOff}
        </button>
      </div>
    </li>
  );
}
