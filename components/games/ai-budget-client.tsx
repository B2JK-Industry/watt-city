"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import type { BudgetSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Spec = z.infer<typeof BudgetSpecSchema>;

export function AiBudgetClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: Spec;
  dict: Dict;
}) {
  const t = dict.ai;
  const initial = useMemo(() => {
    const even = Math.floor(100 / spec.categories.length);
    return spec.categories.map(() => even);
  }, [spec.categories.length]);
  const [values, setValues] = useState<number[]>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const total = values.reduce((a, b) => a + b, 0);
  const onTarget = values.map((v, i) => {
    const cat = spec.categories[i];
    return Math.abs(v - cat.targetPct) <= cat.tolerancePct;
  });
  const score = onTarget.filter(Boolean).length * spec.xpPerOnTarget;

  const submit = useCallback(
    async (xp: number) => {
      setSubmitting(true);
      setError(null);
      const res = await submitScore(gameId, xp);
      if (res.ok) setResult(res);
      else setError(res.error ?? dict.auth.errorGeneric);
      setSubmitting(false);
    },
    [gameId, dict.auth.errorGeneric],
  );

  useEffect(() => {
    if (submitted) submit(score);
  }, [submitted, score, submit]);

  if (submitted) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error, result }}
        gameHref={`/games/ai/${gameId}`}
        lines={[
          {
            label: t.correct,
            value: `${onTarget.filter(Boolean).length}/${spec.categories.length}`,
          },
          { label: t.score, value: String(score) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-zinc-400">{t.scenario}</p>
        <p className="text-sm">{spec.scenario}</p>
        <p className="text-xs text-[var(--accent)] font-mono">{spec.incomeLabel}</p>
      </div>
      <div className="flex flex-col gap-3">
        {spec.categories.map((cat, i) => (
          <div key={i} className="card p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <strong className="text-sm">{cat.label}</strong>
              <span
                className={
                  "text-sm font-mono " +
                  (onTarget[i] ? "text-emerald-400" : "text-zinc-400")
                }
              >
                {values[i]}% {onTarget[i] ? "✓" : ""}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={values[i]}
              onChange={(e) => {
                const next = values.slice();
                next[i] = Number(e.target.value);
                setValues(next);
              }}
            />
            <p className="text-[11px] text-zinc-400">{cat.explanation}</p>
          </div>
        ))}
      </div>
      <div
        className={
          "card p-3 text-sm font-mono " +
          (total === 100
            ? "border-emerald-400"
            : total > 100
              ? "border-rose-400"
              : "")
        }
      >
        {t.budgetTotal}: <strong>{total}%</strong>{" "}
        {total === 100 ? t.budgetOnTarget : total > 100 ? `— ${t.budgetOver}` : `— ${t.budgetUnder}`}
      </div>
      <button
        className="btn btn-primary self-start"
        disabled={total !== 100}
        onClick={() => setSubmitted(true)}
      >
        {t.finish}
      </button>
    </div>
  );
}
