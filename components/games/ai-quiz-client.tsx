"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import type { QuizSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type QuizSpec = z.infer<typeof QuizSpecSchema>;
type Phase = "playing" | "reveal" | "done";

export function AiQuizClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: QuizSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const items = spec.items;
  const total = items.length;
  const current = items[index];
  const xpPer = spec.xpPerCorrect;

  const submit = useCallback(
    async (xp: number) => {
      setSubmitting(true);
      setSubmitError(null);
      const res = await submitScore(gameId, xp);
      if (res.ok) setResult(res);
      else setSubmitError(res.error ?? dict.auth.errorGeneric);
      setSubmitting(false);
    },
    [gameId, dict.auth.errorGeneric],
  );

  function choose(i: number) {
    if (phase !== "playing") return;
    setChosen(i);
    setPhase("reveal");
    if (i === current.correctIndex) setCorrectCount((c) => c + 1);
  }

  function nextStep() {
    if (index + 1 >= total) {
      // correctCount already reflects the latest choose() because reveal has rendered.
      setPhase("done");
      void submit(correctCount * xpPer);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setPhase("playing");
  }

  if (phase === "done") {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref={`/games/ai/${gameId}`}
        retryLabel={t.retry}
        lines={[
          { label: t.correct, value: `${correctCount}/${total}` },
          { label: t.wrong, value: String(total - correctCount) },
          { label: t.score, value: String(correctCount * xpPer) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-[var(--ink-muted)]">
        <span>
          {t.progress
            .replace("{i}", String(index + 1))
            .replace("{n}", String(total))}
        </span>
        <span>
          {t.correct}:{" "}
          <strong className="text-[var(--accent)]">{correctCount}</strong>
        </span>
      </div>

      <div className="card p-5 flex flex-col gap-4">
        <p className="text-lg font-semibold">{current.prompt}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((option, i) => {
            const isChosen = chosen === i;
            const isAnswer = i === current.correctIndex;
            const revealed = phase === "reveal";
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
                type="button"
                onClick={() => choose(i)}
                disabled={revealed}
                className={`rounded-2xl border border-[var(--ink)] bg-[var(--surface-2)] p-4 text-left transition ${tone}`}
              >
                <span className="text-sm">{option}</span>
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
                {chosen === current.correctIndex
                  ? t.correctMark
                  : t.wrongMark}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">{current.explanation}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary self-end"
              onClick={nextStep}
            >
              {index + 1 < total ? t.next : t.finish}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
