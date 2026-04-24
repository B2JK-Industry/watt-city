"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import type { WhatIfSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Spec = z.infer<typeof WhatIfSpecSchema>;
type Phase = "playing" | "reveal" | "done";

export function AiWhatIfClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: Spec;
  dict: Dict;
}) {
  const t = dict.ai;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const total = spec.steps.length;
  const current = spec.steps[index];

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

  function pick(i: number) {
    if (phase !== "playing") return;
    setChosen(i);
    setPhase("reveal");
    if (i === current.correctIndex) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (index + 1 >= total) {
      setPhase("done");
      void submit(correctCount * spec.xpPerCorrect);
    } else {
      setIndex((i) => i + 1);
      setChosen(null);
      setPhase("playing");
    }
  }

  if (phase === "done") {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error, result }}
        gameHref={`/games/ai/${gameId}`}
        lines={[
          { label: t.correct, value: `${correctCount}/${total}` },
          { label: t.score, value: String(correctCount * spec.xpPerCorrect) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4 flex flex-col gap-1">
        <p className="text-xs text-[var(--ink-muted)]">{t.scenario}</p>
        <p className="text-sm">{spec.scenario}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
        <span>{t.progress.replace("{i}", String(index + 1)).replace("{n}", String(total))}</span>
      </div>
      <div className="card p-5 flex flex-col gap-4">
        <p className="font-semibold">{current.prompt}</p>
        <div className="flex flex-col gap-2">
          {current.options.map((opt, i) => {
            const revealed = phase === "reveal";
            const isAnswer = i === current.correctIndex;
            const isChosen = chosen === i;
            const tone = !revealed
              ? "hover:border-[var(--accent)]"
              : isAnswer
                ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,white)]"
                : isChosen
                  ? "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,white)]"
                  : "opacity-50";
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={`rounded-2xl border border-[var(--ink)] bg-[var(--surface-2)] p-3 text-left text-sm transition ${tone}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {phase === "reveal" && (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl p-3 border ${
                chosen === current.correctIndex
                  ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,white)]"
                  : "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,white)]"
              }`}
            >
              <p className="font-semibold mb-1">
                {chosen === current.correctIndex ? t.correctMark : t.wrongMark}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">{current.explanation}</p>
            </div>
            <button className="btn btn-primary self-end" onClick={next}>
              {index + 1 < total ? t.next : t.finish}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
