"use client";

import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import type { OrderSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type OrderSpec = z.infer<typeof OrderSpecSchema>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiOrderClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: OrderSpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const total = spec.items.length;
  const xpPer = spec.xpPerCorrect;
  const xpCap = total * xpPer;

  // Sequence holds the user's currently-arranged ordering (top → bottom).
  // Items can be moved up/down. Shuffle initially so the user actually has
  // to do work.
  const [sequence, setSequence] = useState(() =>
    shuffle(spec.items.map((it) => ({ ...it, key: it.label }))),
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const sortedTruth = useMemo(
    () =>
      [...spec.items].sort((a, b) =>
        spec.direction === "ascending" ? a.rank - b.rank : b.rank - a.rank,
      ),
    [spec],
  );

  function moveUp(idx: number) {
    if (idx <= 0 || submitted) return;
    setSequence((s) => {
      const n = [...s];
      [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
      return n;
    });
  }
  function moveDown(idx: number) {
    if (idx >= sequence.length - 1 || submitted) return;
    setSequence((s) => {
      const n = [...s];
      [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
      return n;
    });
  }

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

  // Score: count of items in correct position (Spearman-light).
  const correctCount = sequence.filter(
    (it, i) => it.label === sortedTruth[i].label,
  ).length;

  function check() {
    setSubmitted(true);
    void submit(Math.min(xpCap, correctCount * xpPer));
  }

  if (submitted) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref={`/games/ai/${gameId}`}
        retryLabel={t.retry}
        lines={[
          { label: t.correctPosition, value: `${correctCount}/${total}` },
          { label: t.score, value: String(Math.min(xpCap, correctCount * xpPer)) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-base font-semibold leading-snug">{spec.prompt}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {spec.direction === "ascending" ? t.orderAscHint : t.orderDescHint}
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {sequence.map((it, i) => (
          <li
            key={it.key}
            className="card p-3 flex items-center gap-3"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 bg-[var(--accent)] text-[var(--accent-ink)] border border-[var(--line)] font-semibold text-sm">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{it.label}</p>
              {it.hint && (
                <p className="text-[11px] text-[var(--ink-muted)] truncate">{it.hint}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--surface-2)] disabled:opacity-30 hover:bg-[var(--accent)]/20 text-xs"
                aria-label="up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === sequence.length - 1}
                className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--surface-2)] disabled:opacity-30 hover:bg-[var(--accent)]/20 text-xs"
                aria-label="down"
              >
                ▼
              </button>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={check}
        className="btn btn-primary self-end"
      >
        {t.submit}
      </button>
    </div>
  );
}
