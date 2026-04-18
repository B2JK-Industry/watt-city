"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/content/finance-quiz";
import { XP_PER_CORRECT } from "@/lib/content/finance-quiz";

type Props = { questions: QuizQuestion[] };

type Phase = "playing" | "reveal" | "done";

export function FinanceQuizClient({ questions }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    awarded: number;
    globalXP: number;
    globalRank: number | null;
  } | null>(null);

  const total = questions.length;
  const current = questions[index];
  const progress = useMemo(() => ((index + (phase === "reveal" ? 1 : 0)) / total) * 100, [index, phase, total]);

  function choose(optionIdx: number) {
    if (phase !== "playing") return;
    setChosen(optionIdx);
    if (optionIdx === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
    setPhase("reveal");
  }

  async function nextStep() {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setChosen(null);
      setPhase("playing");
      return;
    }
    setPhase("done");
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gameId: "finance-quiz",
          xp: correctCount * XP_PER_CORRECT,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSubmitError(json.error ?? "Nepodarilo sa zapísať skóre.");
        return;
      }
      setSubmitted({
        awarded: json.awarded,
        globalXP: json.globalXP,
        globalRank: json.globalRank,
      });
    } catch {
      setSubmitError("Sieťová chyba. XP sa nezapísali.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "done") {
    return (
      <div className="card p-8 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Koniec kola</h2>
        <p className="text-zinc-300">
          Správne odpovede: <strong>{correctCount}</strong> / {total}
        </p>
        {submitting && <p className="text-zinc-400">Zapisujem XP…</p>}
        {submitError && (
          <p className="text-rose-400">Chyba: {submitError}</p>
        )}
        {submitted && (
          <div className="flex flex-col gap-2">
            <p className="text-lg">
              Získal si <strong className="text-[var(--accent)]">
                +{submitted.awarded} XP
              </strong>
            </p>
            <p className="text-sm text-zinc-400">
              Celkovo máš {submitted.globalXP} XP
              {submitted.globalRank !== null
                ? ` · pozícia #${submitted.globalRank} globálne`
                : ""}
              .
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href="/games/finance-quiz" className="btn btn-primary">
            Hrať znova
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost">
            Rebríček
          </Link>
          <Link href="/games" className="btn btn-ghost">
            Iná hra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          Otázka {index + 1} / {total}
        </span>
        <span>
          Správne: <strong className="text-[var(--accent)]">{correctCount}</strong>
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
            let variant = "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]";
            if (phase === "reveal") {
              if (isCorrect) {
                variant = "bg-emerald-900/30 border-emerald-500/60";
              } else if (isChosen) {
                variant = "bg-rose-900/30 border-rose-500/60";
              } else {
                variant = "bg-[var(--surface-2)] border-[var(--border)] opacity-70";
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
              {index + 1 < total ? "Ďalej" : "Ukončiť a zapísať XP"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
