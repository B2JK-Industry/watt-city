"use client";

import { useCallback, useMemo, useState } from "react";
import type { BudgetScenario, BudgetTarget } from "@/lib/content/budget-balance";
import { XP_CAP } from "@/lib/content/budget-balance";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

const GAME_ID = "budget-balance";

type Allocation = Record<BudgetTarget["id"], number>;

function defaultAlloc(scenario: BudgetScenario): Allocation {
  const raw = Object.fromEntries(
    scenario.targets.map((t) => [t.id, Math.round((t.min + t.max) / 2)]),
  ) as Allocation;
  const sum = Object.values(raw).reduce((s, v) => s + v, 0);
  const diff = 100 - sum;
  raw[scenario.targets[0].id] += diff;
  return raw;
}

function fitScore(pct: number, target: BudgetTarget): number {
  if (pct >= target.min && pct <= target.max) return 1;
  const dist = pct < target.min ? target.min - pct : pct - target.max;
  return Math.max(0, 1 - dist / 20);
}

export function BudgetBalanceClient({
  scenario,
  dict,
}: {
  scenario: BudgetScenario;
  dict: Dict;
}) {
  const t = dict.budget;
  const [alloc, setAlloc] = useState<Allocation>(() => defaultAlloc(scenario));
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const total = useMemo(
    () => Object.values(alloc).reduce((s, v) => s + v, 0),
    [alloc],
  );
  const isValid = total === 100;

  const fits = useMemo(
    () =>
      scenario.targets.map((t) => ({
        target: t,
        pct: alloc[t.id],
        score: fitScore(alloc[t.id], t),
      })),
    [alloc, scenario.targets],
  );

  const projectedXp = useMemo(() => {
    if (!isValid) return 0;
    const avg = fits.reduce((s, f) => s + f.score, 0) / fits.length;
    return Math.round(avg * XP_CAP);
  }, [fits, isValid]);

  const submit = useCallback(async (xp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, xp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? dict.auth.errorGeneric);
    setSubmitting(false);
  }, [dict.auth.errorGeneric]);


  function change(id: BudgetTarget["id"], next: number) {
    if (locked) return;
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    setAlloc((cur) => {
      const others = scenario.targets.filter((t) => t.id !== id);
      const othersSum = others.reduce((s, t) => s + cur[t.id], 0);
      const remaining = 100 - clamped;
      const scaled: Allocation = { ...cur, [id]: clamped };
      if (othersSum === 0) {
        const share = Math.floor(remaining / others.length);
        others.forEach((t) => (scaled[t.id] = share));
        scaled[others[0].id] += remaining - share * others.length;
      } else {
        others.forEach((t) => {
          scaled[t.id] = Math.round((cur[t.id] / othersSum) * remaining);
        });
        const sum = Object.values(scaled).reduce((s, v) => s + v, 0);
        const diff = 100 - sum;
        if (diff !== 0) {
          const firstOther = others[0].id;
          scaled[firstOther] += diff;
        }
      }
      return scaled;
    });
  }

  const formatMoney = (n: number) =>
    `${n.toLocaleString(scenario.localeTag)} ${scenario.currency}`;

  if (locked && result) {
    const lines = scenario.targets.map((tgt) => ({
      label: tgt.label,
      value: `${alloc[tgt.id]}%`,
    }));
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-5 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]">
          <p className="text-sm text-[var(--ink-muted)] mb-1">{t.takeaway}</p>
          <p className="text-base">💡 {scenario.takeaway}</p>
        </div>
        <RoundResult
          dict={dict}
          state={{ submitting, error: submitError, result }}
          gameHref="/games/budget-balance"
          retryLabel={t.retry}
          lines={[...lines, { label: dict.finance.statsScore, value: String(projectedXp) }]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 flex flex-col gap-2">
        <span className="chip w-fit">{scenario.title}</span>
        <p className="text-sm text-[var(--ink-muted)]">{scenario.persona}</p>
        <p className="font-mono text-xl font-bold">
          {formatMoney(scenario.income)} {t.incomeMonthly}
        </p>
      </div>

      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--ink-muted)]">{t.distribution}</span>
          <span
            className={`chip ${
              isValid
                ? "border-[var(--success)] text-[var(--success)]"
                : "border-[var(--danger)] text-[var(--danger)]"
            }`}
          >
            {t.total} <strong>{total}%</strong>
          </span>
        </div>
        <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden flex">
          {scenario.targets.map((tgt, i) => {
            const colors = [
              "from-sky-400 to-sky-500",
              "from-emerald-400 to-emerald-500",
              "from-[var(--accent)] to-[var(--accent-2)]",
              "from-fuchsia-400 to-fuchsia-500",
            ];
            return (
              <div
                key={tgt.id}
                className={`h-full bg-gradient-to-r ${colors[i % colors.length]}`}
                style={{ width: `${alloc[tgt.id]}%` }}
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {scenario.targets.map((tgt) => {
            const pct = alloc[tgt.id];
            const amount = Math.round((scenario.income * pct) / 100);
            const inBand = pct >= tgt.min && pct <= tgt.max;
            return (
              <div key={tgt.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{tgt.emoji}</span>
                    <strong>{tgt.label}</strong>
                    <span className="text-[var(--ink-muted)] text-xs">· {tgt.hint}</span>
                  </span>
                  <span
                    className={`font-mono ${
                      inBand ? "text-[var(--success)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {pct}% · {formatMoney(amount)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct}
                    disabled={locked}
                    onChange={(e) => change(tgt.id, Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 pointer-events-none bg-[color-mix(in_oklab,var(--success)_12%,white)] rounded-full"
                    style={{
                      left: `${tgt.min}%`,
                      width: `${tgt.max - tgt.min}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  {t.recommendation
                    .replace("{min}", String(tgt.min))
                    .replace("{max}", String(tgt.max))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--ink-muted)]">
          {t.projection}{" "}
          <strong className="text-[var(--accent)] font-mono">
            {projectedXp}/{XP_CAP}
          </strong>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setLocked(true);
            void submit(projectedXp);
          }}
          disabled={!isValid || locked}
        >
          {locked ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}
