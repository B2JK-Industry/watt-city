"use client";

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import type { TrueFalseSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type TrueFalseSpec = z.infer<typeof TrueFalseSpecSchema>;
type Phase = "playing" | "reveal" | "done";

export function AiTrueFalseClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: TrueFalseSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
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

  useEffect(() => {
    if (phase === "done") submit(correct * xpPer);
  }, [phase, correct, xpPer, submit]);

  function choose(value: boolean) {
    if (phase !== "playing") return;
    setChosen(value);
    setPhase("reveal");
    if (value === current.isTrue) setCorrect((c) => c + 1);
  }

  function nextStep() {
    if (index + 1 >= total) {
      setPhase("done");
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
          { label: t.correct, value: `${correct}/${total}` },
          { label: t.wrong, value: String(total - correct) },
          { label: t.score, value: String(correct * xpPer) },
        ]}
      />
    );
  }

  const wasCorrect = chosen === current.isTrue;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          {t.progress.replace("{i}", String(index + 1)).replace("{n}", String(total))}
        </span>
        <span>
          {t.correct}: <strong className="text-[var(--accent)]">{correct}</strong>
        </span>
      </div>

      <div className="card p-6 flex flex-col gap-5">
        <p className="text-lg font-semibold leading-snug">{current.statement}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => choose(true)}
            disabled={phase !== "playing"}
            className={`rounded-2xl border-[3px] border-[var(--ink)] p-5 text-lg font-black transition ${
              phase === "reveal"
                ? current.isTrue
                  ? "bg-emerald-400 text-[#0a0a0f]"
                  : chosen === true
                    ? "bg-rose-400/30 opacity-70"
                    : "opacity-40"
                : "bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-200"
            }`}
          >
            ✓ {t.tFTrueLabel}
          </button>
          <button
            type="button"
            onClick={() => choose(false)}
            disabled={phase !== "playing"}
            className={`rounded-2xl border-[3px] border-[var(--ink)] p-5 text-lg font-black transition ${
              phase === "reveal"
                ? !current.isTrue
                  ? "bg-emerald-400 text-[#0a0a0f]"
                  : chosen === false
                    ? "bg-rose-400/30 opacity-70"
                    : "opacity-40"
                : "bg-rose-500/15 hover:bg-rose-500/30 text-rose-200"
            }`}
          >
            ✗ {t.tFFalseLabel}
          </button>
        </div>

        {phase === "reveal" && (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl p-3 border ${
                wasCorrect
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-rose-500/40 bg-rose-500/5"
              }`}
            >
              <p className="font-semibold mb-1">
                {wasCorrect ? t.correctMark : t.wrongMark}
              </p>
              <p className="text-sm text-zinc-300">{current.explanation}</p>
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
