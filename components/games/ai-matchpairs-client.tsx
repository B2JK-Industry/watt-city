"use client";

import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import type { MatchPairsSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type MatchPairsSpec = z.infer<typeof MatchPairsSpecSchema>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiMatchPairsClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: MatchPairsSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const total = spec.pairs.length;

  const leftItems = useMemo(
    () => spec.pairs.map((p, i) => ({ id: `L${i}`, text: p.left, key: i })),
    [spec],
  );
  const rightItems = useMemo(
    () => shuffle(spec.pairs.map((p, i) => ({ id: `R${i}`, text: p.right, key: i }))),
    [spec],
  );

  const [matched, setMatched] = useState<Record<number, boolean>>({});
  const [pickedLeft, setPickedLeft] = useState<number | null>(null);
  const [pickedRight, setPickedRight] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ l: number; r: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [tries, setTries] = useState(0);

  const matchedCount = Object.values(matched).filter(Boolean).length;
  const done = matchedCount === total;
  const xpPer = spec.xpPerMatch;
  const xpCap = total * xpPer;

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

  function tryMatch(leftKey: number, rightKey: number) {
    const nextTries = tries + 1;
    setTries(nextTries);
    if (leftKey === rightKey) {
      const nextMatched = { ...matched, [leftKey]: true };
      setMatched(nextMatched);
      setPickedLeft(null);
      setPickedRight(null);
      const nextMatchedCount = Object.values(nextMatched).filter(Boolean).length;
      if (nextMatchedCount === total) {
        // Score: every match gives xpPer, but penalize for wrong tries:
        //   (matched × xpPer) − (wrongTries × xpPer/4), floor 0
        const wrongs = Math.max(0, nextTries - total);
        const raw = nextMatchedCount * xpPer - Math.floor((wrongs * xpPer) / 4);
        void submit(Math.max(0, Math.min(xpCap, raw)));
      }
    } else {
      setWrongFlash({ l: leftKey, r: rightKey });
      window.setTimeout(() => {
        setWrongFlash(null);
        setPickedLeft(null);
        setPickedRight(null);
      }, 500);
    }
  }

  function clickLeft(key: number) {
    if (matched[key]) return;
    setPickedLeft(key);
    if (pickedRight !== null) tryMatch(key, pickedRight);
  }
  function clickRight(key: number) {
    if (matched[key]) return;
    setPickedRight(key);
    if (pickedLeft !== null) tryMatch(pickedLeft, key);
  }

  if (done) {
    const wrongs = Math.max(0, tries - total);
    const score = Math.max(0, Math.min(xpCap, matchedCount * xpPer - Math.floor((wrongs * xpPer) / 4)));
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref={`/games/ai/${gameId}`}
        retryLabel={t.retry}
        lines={[
          { label: t.matchPairs, value: `${matchedCount}/${total}` },
          { label: t.tries, value: String(tries) },
          { label: t.score, value: String(score) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          <span className="opacity-70">{t.matchPairs}</span>
          <strong>{matchedCount}/{total}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">{t.tries}</span>
          <strong>{tries}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-zinc-400">{spec.leftLabel}</p>
          {leftItems.map((it) => {
            const m = matched[it.key];
            const sel = pickedLeft === it.key;
            const wrong = wrongFlash?.l === it.key;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => clickLeft(it.key)}
                disabled={m}
                className={`text-left rounded-xl border border-[var(--ink)] px-3 py-2 transition font-semibold text-sm ${
                  m
                    ? "bg-emerald-400/30 text-emerald-200 line-through opacity-60"
                    : wrong
                      ? "bg-rose-500/30"
                      : sel
                        ? "bg-[var(--accent)]/20 border-[var(--accent)]"
                        : "bg-[var(--surface-2)] hover:border-[var(--accent)]/50"
                }`}
              >
                {it.text}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-zinc-400">{spec.rightLabel}</p>
          {rightItems.map((it) => {
            const m = matched[it.key];
            const sel = pickedRight === it.key;
            const wrong = wrongFlash?.r === it.key;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => clickRight(it.key)}
                disabled={m}
                className={`text-left rounded-xl border border-[var(--ink)] px-3 py-2 transition text-xs ${
                  m
                    ? "bg-emerald-400/30 text-emerald-200 line-through opacity-60"
                    : wrong
                      ? "bg-rose-500/30"
                      : sel
                        ? "bg-[var(--accent)]/20 border-[var(--accent)]"
                        : "bg-[var(--surface-2)] hover:border-[var(--accent)]/50"
                }`}
              >
                {it.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
