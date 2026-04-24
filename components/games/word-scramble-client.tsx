"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ScrambleWord } from "@/lib/content/word-scramble";
import { XP_PER_WORD } from "@/lib/content/word-scramble";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

const GAME_ID = "word-scramble";
const XP_CAP = 120;

function scramble(word: string): string {
  const chars = [...word];
  // ensure the scrambled form isn't identical to the original
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

export function WordScrambleClient({ words, dict }: { words: ScrambleWord[]; dict: Dict }) {
  const t = dict.word;
  const rounds = useMemo(
    () =>
      words.map((w) => ({
        ...w,
        scrambled: scramble(w.word),
      })),
    [words],
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

  const submit = useCallback(
    async (score: number) => {
      setSubmitting(true);
      setSubmitError(null);
      const res = await submitScore(GAME_ID, score);
      if (res.ok) setResult(res);
      else setSubmitError(res.error ?? dict.auth.errorGeneric);
      setSubmitting(false);
    },
    [dict.auth.errorGeneric],
  );

  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [index, done]);

  function finishWith(finalCorrect: number) {
    setDone(true);
    void submit(Math.min(finalCorrect * XP_PER_WORD, XP_CAP));
  }

  function next(finalCorrect = correct) {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setAnswer("");
      setFlash(null);
    } else {
      finishWith(finalCorrect);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (done) return;
    const trimmed = normalize(answer);
    if (!trimmed) return;
    if (trimmed === current.word) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setFlash("ok");
      setTimeout(() => next(nextCorrect), 400);
    } else {
      setFlash("bad");
    }
  }

  function skip() {
    if (done) return;
    setSkipped((s) => s + 1);
    setFlash(null);
    next();
  }

  if (done) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref="/games/word-scramble"
        retryLabel={t.retry}
        lines={[
          { label: t.correct, value: `${correct}/${total}` },
          { label: t.skipped, value: String(skipped) },
          {
            label: t.score,
            value: String(Math.min(correct * XP_PER_WORD, XP_CAP)),
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          {t.word} {index + 1} / {total}
        </span>
        <span className="chip">
          <span className="opacity-70">{t.correct}</span>
          <strong className="text-[var(--accent)]">{correct}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${((index + (flash === "ok" ? 1 : 0)) / total) * 100}%` }}
        />
      </div>
      <form onSubmit={onSubmit} className="card p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-1.5">
            {[...current.scrambled].map((ch, i) => (
              <span
                key={`${index}-${i}`}
                className="inline-flex items-center justify-center w-10 h-12 sm:w-12 sm:h-14 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] font-mono text-2xl sm:text-3xl font-bold"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="text-sm text-zinc-400 italic">💡 {current.hint}</p>
        </div>
        <input
          ref={inputRef}
          className={`input text-center text-xl font-mono ${
            flash === "bad"
              ? "border-rose-500 animate-[shake_0.35s]"
              : flash === "ok"
              ? "border-emerald-500"
              : ""
          }`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" className="btn btn-ghost" onClick={skip}>
            {t.skip}
          </button>
          <button type="submit" className="btn btn-primary">
            {t.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}
