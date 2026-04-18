"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { z } from "zod";
import type { PriceGuessSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type PriceGuessSpec = z.infer<typeof PriceGuessSpecSchema>;
type Phase = "playing" | "reveal" | "done";

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function AiPriceGuessClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: PriceGuessSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const items = spec.items;
  const total = items.length;
  const xpPer = spec.xpPerCorrect;
  const xpCap = total * xpPer;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [input, setInput] = useState("");
  const [lastGuess, setLastGuess] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const current = items[index];

  const submit = useCallback(
    async (score: number) => {
      setSubmitting(true);
      setSubmitError(null);
      const res = await submitScore(gameId, score);
      if (res.ok) setResult(res);
      else setSubmitError(res.error ?? dict.auth.errorGeneric);
      setSubmitting(false);
    },
    [gameId, dict.auth.errorGeneric],
  );

  useEffect(() => {
    if (phase === "done") submit(Math.min(correct * xpPer, xpCap));
  }, [phase, correct, xpPer, xpCap, submit]);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [index, phase]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const guess = parseNumber(input);
    if (guess === null) return;
    setLastGuess(guess);
    const tolerance = Math.abs(current.truth) * current.tolerancePct;
    const within = Math.abs(guess - current.truth) <= tolerance;
    if (within) setCorrect((c) => c + 1);
    setPhase("reveal");
  }

  function nextStep() {
    if (index + 1 >= total) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setLastGuess(null);
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
          { label: t.score, value: String(Math.min(correct * xpPer, xpCap)) },
        ]}
      />
    );
  }

  const isWithin =
    lastGuess !== null &&
    Math.abs(lastGuess - current.truth) <=
      Math.abs(current.truth) * current.tolerancePct;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          {t.progress
            .replace("{i}", String(index + 1))
            .replace("{n}", String(total))}
        </span>
        <span>
          {t.correct}:{" "}
          <strong className="text-[var(--accent)]">{correct}</strong>
        </span>
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <p className="text-lg font-semibold">{current.prompt}</p>
        <p className="text-xs text-zinc-500">
          {t.guessHint.replace(
            "{pct}",
            String(Math.round(current.tolerancePct * 100)),
          )}
        </p>

        {phase === "playing" && (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="text-sm text-zinc-400">
              {t.guessLabel.replace("{unit}", current.unit)}
            </label>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="input flex-1 text-xl font-mono"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary">
                {t.submit}
              </button>
            </div>
          </form>
        )}

        {phase === "reveal" && (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl p-3 border ${
                isWithin
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-rose-500/40 bg-rose-500/5"
              }`}
            >
              <p className="font-semibold mb-1">
                {isWithin ? t.correctMark : t.wrongMark}
              </p>
              <p className="text-sm text-zinc-300">
                {t.truthLabel}:{" "}
                <strong className="font-mono">
                  {current.truth} {current.unit}
                </strong>
                {lastGuess !== null && (
                  <>
                    {" · "}
                    <span className="text-zinc-400">
                      Δ {(lastGuess - current.truth).toFixed(2)} {current.unit}
                    </span>
                  </>
                )}
              </p>
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
