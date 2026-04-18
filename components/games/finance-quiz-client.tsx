"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { QuizQuestion } from "@/lib/content/finance-quiz";
import { XP_PER_CORRECT } from "@/lib/content/finance-quiz";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Props = { questions: QuizQuestion[] };
type Phase = "playing" | "reveal" | "done";

const GAME_ID = "finance-quiz";

export function FinanceQuizClient({ questions }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const total = questions.length;
  const current = questions[index];
  const progress = useMemo(
    () => ((index + (phase === "reveal" ? 1 : 0)) / total) * 100,
    [index, phase, total],
  );

  const submit = useCallback(async (xp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, xp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? "Nepodarilo sa zapísať skóre.");
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (phase === "done") submit(correctCount * XP_PER_CORRECT);
  }, [phase, correctCount, submit]);

  function choose(optionIdx: number) {
    if (phase !== "playing") return;
    setChosen(optionIdx);
    if (optionIdx === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
    setPhase("reveal");
  }

  function nextStep() {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setChosen(null);
      setPhase("playing");
    } else {
      setPhase("done");
    }
  }

  if (phase === "done") {
    return (
      <RoundResult
        state={{ submitting, error: submitError, result }}
        gameHref="/games/finance-quiz"
        retryLabel="Nové kolo"
        lines={[
          { label: "Správne", value: `${correctCount}/${total}` },
          { label: "Chyby", value: String(total - correctCount) },
          {
            label: "Skóre",
            value: String(correctCount * XP_PER_CORRECT),
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          Otázka {index + 1} / {total}
        </span>
        <span>
          Správne:{" "}
          <strong className="text-[var(--accent)]">{correctCount}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="card p-6 flex flex-col gap-5">
        <h2 className="text-xl font-semibold">{current.prompt}</h2>
        <div className="flex flex-col gap-2">
          {current.options.map((opt, i) => {
            const isCorrect = i === current.correctIndex;
            const isChosen = i === chosen;
            let variant =
              "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]";
            if (phase === "reveal") {
              if (isCorrect) {
                variant = "bg-emerald-900/30 border-emerald-500/60";
              } else if (isChosen) {
                variant = "bg-rose-900/30 border-rose-500/60";
              } else {
                variant =
                  "bg-[var(--surface-2)] border-[var(--border)] opacity-70";
              }
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={phase === "reveal"}
                className={`text-left border rounded-xl px-4 py-3 transition-colors ${variant}`}
              >
                <span className="font-mono opacity-60 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {phase === "reveal" && (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl px-4 py-3 border ${
                chosen === current.correctIndex
                  ? "bg-emerald-900/30 border-emerald-700/60"
                  : "bg-rose-900/30 border-rose-800/60"
              }`}
            >
              <p className="font-semibold mb-1">
                {chosen === current.correctIndex ? "Správne ✓" : "Nesprávne ✗"}
              </p>
              <p className="text-sm text-zinc-300">{current.explanation}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary self-end"
              onClick={nextStep}
            >
              {index + 1 < total ? "Ďalej" : "Ukončiť a uložiť Watty"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
