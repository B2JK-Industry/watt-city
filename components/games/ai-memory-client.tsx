"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import type { MemorySpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type MemorySpec = z.infer<typeof MemorySpecSchema>;

type Card = {
  id: string;
  pairId: number;
  text: string;
  isConcept: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiMemoryClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: MemorySpec;
  dict: Dict;
}) {
  const t = dict.ai;
  const deck = useMemo<Card[]>(() => {
    const cards: Card[] = [];
    spec.pairs.forEach((p, idx) => {
      cards.push({ id: `c-${idx}`, pairId: idx, text: p.concept, isConcept: true });
      cards.push({ id: `m-${idx}`, pairId: idx, text: p.match, isConcept: false });
    });
    return shuffle(cards);
  }, [spec]);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [firstPick, setFirstPick] = useState<Card | null>(null);
  const [lock, setLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [done, setDone] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const onPick = (card: Card) => {
    if (lock) return;
    if (matched[card.id] || revealed[card.id]) return;
    setRevealed((r) => ({ ...r, [card.id]: true }));
    if (!firstPick) {
      setFirstPick(card);
      return;
    }
    if (firstPick.id === card.id) return;
    if (firstPick.pairId === card.pairId) {
      // match
      setMatched((m) => ({ ...m, [firstPick.id]: true, [card.id]: true }));
      setMatchCount((c) => c + 1);
      setFirstPick(null);
    } else {
      setLock(true);
      setTimeout(() => {
        setRevealed((r) => ({ ...r, [firstPick.id]: false, [card.id]: false }));
        setFirstPick(null);
        setLock(false);
      }, 900);
    }
  };

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

  useEffect(() => {
    if (matchCount === spec.pairs.length && !done) {
      setDone(true);
      submit(matchCount * spec.xpPerMatch);
    }
  }, [matchCount, spec.pairs.length, spec.xpPerMatch, done, submit]);

  if (done) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error, result }}
        gameHref={`/games/ai/${gameId}`}
        lines={[
          { label: t.correct, value: `${matchCount}/${spec.pairs.length}` },
          { label: t.score, value: String(matchCount * spec.xpPerMatch) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-400">{spec.hint}</p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {deck.map((card) => {
          const isShown = revealed[card.id] || matched[card.id];
          return (
            <button
              key={card.id}
              type="button"
              disabled={isShown || lock}
              onClick={() => onPick(card)}
              className={
                "aspect-square rounded-xl border-[3px] border-[var(--ink)] p-2 text-xs sm:text-sm font-semibold transition " +
                (matched[card.id]
                  ? "bg-emerald-500/20 border-emerald-400"
                  : isShown
                    ? "bg-[var(--surface-2)]"
                    : "bg-[var(--accent)] text-[#0a0a0f] hover:opacity-80")
              }
            >
              {isShown ? card.text : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
