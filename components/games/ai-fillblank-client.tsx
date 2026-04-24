"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import type { FillBlankSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Spec = z.infer<typeof FillBlankSpecSchema>;
type Phase = "playing" | "reveal" | "done";

function isAcceptable(user: string, answer: string, alternatives?: string[]): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  if (norm(user) === norm(answer)) return true;
  return (alternatives ?? []).some((a) => norm(a) === norm(user));
}

export function AiFillBlankClient({
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
  const [input, setInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const total = spec.items.length;
  const current = spec.items[index];

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

  function check() {
    if (isAcceptable(input, current.answer, current.alternatives)) {
      setCorrectCount((c) => c + 1);
    }
    setPhase("reveal");
  }

  function next() {
    if (index + 1 >= total) {
      // correctCount already reflects the previous check() because the reveal-phase render has committed.
      setPhase("done");
      void submit(correctCount * spec.xpPerCorrect);
    } else {
      setIndex((i) => i + 1);
      setInput("");
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

  const parts = current.sentence.split("___");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>{t.progress.replace("{i}", String(index + 1)).replace("{n}", String(total))}</span>
        <span>
          {t.correct}: <strong className="text-[var(--accent)]">{correctCount}</strong>
        </span>
      </div>
      <div className="card p-5 flex flex-col gap-4">
        <p className="text-lg">
          {parts[0]}
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && phase === "playing" && input.trim()) check();
            }}
            disabled={phase !== "playing"}
            className="inline-block mx-1 px-2 py-0.5 border-b border-[var(--accent)] bg-transparent focus:outline-none font-mono"
            style={{ minWidth: "8ch" }}
          />
          {parts[1] ?? ""}
        </p>
        <p className="text-xs text-zinc-400">💡 {current.hint}</p>
        {phase === "reveal" && (
          <div
            className={`rounded-xl p-3 border ${
              isAcceptable(input, current.answer, current.alternatives)
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-rose-500/40 bg-rose-500/5"
            }`}
          >
            <p className="font-semibold mb-1">
              {isAcceptable(input, current.answer, current.alternatives)
                ? t.correctMark
                : t.wrongMark}
            </p>
            <p className="text-sm">
              {t.correct}: <strong>{current.answer}</strong>
            </p>
          </div>
        )}
        <div className="flex gap-2">
          {phase === "playing" ? (
            <button className="btn btn-primary" onClick={check} disabled={!input.trim()}>
              {t.check}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={next}>
              {index + 1 < total ? t.next : t.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
