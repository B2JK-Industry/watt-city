"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import type { CalcSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Spec = z.infer<typeof CalcSpecSchema>;

function isClose(user: number, truth: number, tolPct: number): boolean {
  if (tolPct <= 0) return Math.abs(user - truth) < 0.0001;
  const slack = Math.abs(truth) * tolPct;
  return Math.abs(user - truth) <= slack;
}

export function AiCalcSprintClient({
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
  const [input, setInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(spec.durationSec);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Keep latest correctCount available to the timer without re-creating the interval.
  const correctRef = useRef(0);
  useEffect(() => {
    correctRef.current = correctCount;
  }, [correctCount]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setDone(true);
          void submit(correctRef.current * spec.xpPerCorrect);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [done, submit, spec.xpPerCorrect]);

  const current = spec.items[index % spec.items.length];

  function check() {
    const n = Number(input.replace(",", "."));
    if (!isNaN(n) && isClose(n, current.answer, current.tolerancePct ?? 0)) {
      setCorrectCount((c) => c + 1);
    }
    setInput("");
    setIndex((i) => i + 1);
    inputRef.current?.focus();
  }

  if (done) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error, result }}
        gameHref={`/games/ai/${gameId}`}
        lines={[
          { label: t.correct, value: String(correctCount) },
          { label: t.score, value: String(correctCount * spec.xpPerCorrect) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          {t.timeLeft}: <strong className="text-[var(--accent)] font-mono">{secondsLeft}s</strong>
        </span>
        <span>
          {t.correct}: <strong className="text-[var(--accent)]">{correctCount}</strong>
        </span>
      </div>
      <div className="card p-6 flex flex-col gap-4 items-center">
        <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wide">
          {current.expression} {current.unit ? `= ? ${current.unit}` : "= ?"}
        </p>
        <input
          ref={inputRef}
          autoFocus
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) check();
          }}
          className="text-center text-2xl font-mono w-40 px-3 py-2 border border-[var(--ink)] bg-[var(--surface-2)] rounded-xl"
        />
        <button className="btn btn-primary" onClick={check} disabled={!input.trim()}>
          {t.check}
        </button>
      </div>
    </div>
  );
}
