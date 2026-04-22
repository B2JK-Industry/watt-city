"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { z } from "zod";
import type { ScrambleSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type ScrambleSpec = z.infer<typeof ScrambleSpecSchema>;

function scramble(word: string): string {
  const chars = [...word];
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const joined = chars.join("");
    if (joined !== word) return joined;
  }
  return chars.join("");
}

function normalize(s: string): string {
  return s.trim().toUpperCase();
}

export function AiScrambleClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: ScrambleSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const rounds = useMemo(
    () =>
      spec.words.map((w) => ({
        ...w,
        scrambled: scramble(w.word),
      })),
    [spec],
  );

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const current = rounds[index];
  const total = rounds.length;
  const xpPer = spec.xpPerWord;
  const xpCap = total * xpPer;

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
    inputRef.current?.focus();
  }, [index]);

  function advance(ok: boolean) {
    if (ok) setCorrect((c) => c + 1);
    else setSkipped((s) => s + 1);
    setAnswer("");
    if (index + 1 >= total) {
      setDone(true);
      // Include the current round's result in the final submission.
      const finalCorrect = correct + (ok ? 1 : 0);
      void submit(Math.min(finalCorrect * xpPer, xpCap));
    } else {
      setIndex((i) => i + 1);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!current) return;
    if (normalize(answer) === current.word) {
      setFlash("ok");
      window.setTimeout(() => setFlash(null), 180);
      advance(true);
    } else {
      setFlash("bad");
      window.setTimeout(() => setFlash(null), 200);
    }
  }

  function skip() {
    advance(false);
  }

  if (done) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref={`/games/ai/${gameId}`}
        retryLabel={t.retry}
        lines={[
          { label: t.correct, value: `${correct}/${total}` },
          { label: t.skip, value: String(skipped) },
          { label: t.score, value: String(Math.min(correct * xpPer, xpCap)) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          {t.progress
            .replace("{i}", String(index + 1))
            .replace("{n}", String(total))}
        </span>
        <span className="chip">
          <span className="opacity-70">{t.correct}</span>
          <strong className="text-[var(--accent)]">{correct}</strong>
        </span>
      </div>

      <div className="card p-6 flex flex-col gap-5 items-center">
        <p className="text-sm text-zinc-400 text-center max-w-md">
          {current.hint}
        </p>
        <p
          className={`text-4xl sm:text-5xl font-black tracking-[0.25em] font-mono transition ${
            flash === "ok"
              ? "text-emerald-300"
              : flash === "bad"
                ? "text-rose-300"
                : ""
          }`}
        >
          {current.scrambled}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="input text-center text-xl font-mono tracking-widest"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" className="btn btn-ghost" onClick={skip}>
            {t.skip}
          </button>
          <button type="submit" className="btn btn-primary">
            {t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
