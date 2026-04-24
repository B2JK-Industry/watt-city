"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MemoryPair } from "@/lib/content/memory-pairs";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";
import { shuffle } from "@/lib/shuffle";

type Card = {
  id: string;
  pairId: number;
  side: "concept" | "definition";
  text: string;
  matched: boolean;
  revealed: boolean;
};

const GAME_ID = "memory-match";
const XP_CAP = 160;

function buildDeck(pairs: MemoryPair[]): Card[] {
  const deck: Card[] = [];
  pairs.forEach((p, i) => {
    deck.push({
      id: `${i}-c`,
      pairId: i,
      side: "concept",
      text: p.concept,
      matched: false,
      revealed: false,
    });
    deck.push({
      id: `${i}-d`,
      pairId: i,
      side: "definition",
      text: p.definition,
      matched: false,
      revealed: false,
    });
  });
  return shuffle(deck);
}

function scoreFor(seconds: number, mismatches: number): number {
  const timePenalty = Math.max(0, Math.round((seconds - 30) * 1));
  const mistakePenalty = mismatches * 3;
  const raw = XP_CAP - timePenalty - mistakePenalty;
  return Math.max(20, Math.min(XP_CAP, Math.round(raw)));
}

export function MemoryMatchClient({ pairs, dict }: { pairs: MemoryPair[]; dict: Dict }) {
  const t = dict.memory;
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairs));
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mismatches, setMismatches] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const matchedCount = useMemo(
    () => deck.filter((c) => c.matched).length,
    [deck],
  );
  const totalPairs = deck.length / 2;

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [completed, startedAt]);

  const finishRound = useCallback(
    (finalMismatches: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setCompleted(true);
      const finalSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(finalSeconds);
      const xp = scoreFor(finalSeconds, finalMismatches);
      setSubmitting(true);
      submitScore(GAME_ID, xp)
        .then((res) => {
          if (res.ok) setResult(res);
          else setSubmitError(res.error ?? dict.auth.errorGeneric);
        })
        .catch(() => setSubmitError(dict.auth.errorNetwork))
        .finally(() => setSubmitting(false));
    },
    [startedAt, dict.auth.errorGeneric, dict.auth.errorNetwork],
  );

  const flip = useCallback(
    (id: string) => {
      if (completed || busy) return;
      const card = deck.find((c) => c.id === id);
      if (!card || card.matched || card.revealed) return;

      // First pick: just reveal it.
      if (selected === null) {
        setSelected(id);
        setDeck((cur) =>
          cur.map((c) => (c.id === id ? { ...c, revealed: true } : c)),
        );
        return;
      }

      // Second pick — same card tapped twice, ignore.
      if (selected === id) return;

      const first = deck.find((c) => c.id === selected);
      if (!first) {
        setSelected(null);
        return;
      }
      const isMatch = first.pairId === card.pairId && first.side !== card.side;

      if (isMatch) {
        const nextDeck = deck.map((c) =>
          c.pairId === card.pairId ? { ...c, matched: true, revealed: true } : c,
        );
        setDeck(nextDeck);
        setSelected(null);
        if (nextDeck.every((c) => c.matched)) {
          finishRound(mismatches);
        }
        return;
      }

      // Mismatch: reveal the second card, lock further flips, then hide both.
      setDeck((cur) =>
        cur.map((c) => (c.id === id ? { ...c, revealed: true } : c)),
      );
      setMismatches((m) => m + 1);
      setBusy(true);
      const firstId = first.id;
      window.setTimeout(() => {
        setDeck((cur) =>
          cur.map((c) =>
            c.id === firstId || c.id === id
              ? { ...c, revealed: false }
              : c,
          ),
        );
        setSelected(null);
        setBusy(false);
      }, 900);
    },
    [busy, completed, deck, selected, finishRound, mismatches],
  );

  if (completed) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref="/games/memory-match"
        retryLabel={t.retry}
        lines={[
          { label: t.time, value: `${elapsed}s` },
          { label: t.mistakes, value: String(mismatches) },
          { label: t.pairs, value: `${totalPairs}/${totalPairs}` },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          <span className="opacity-70">{t.time}</span>
          <strong>{elapsed}s</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">{t.mistakes}</span>
          <strong>{mismatches}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">{t.matched}</span>
          <strong>
            {matchedCount / 2}/{totalPairs}
          </strong>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {deck.map((card) => (
          <MemoryCard key={card.id} card={card} onClick={() => flip(card.id)} hiddenLabel={t.hidden} />
        ))}
      </div>
    </div>
  );
}

function MemoryCard({ card, onClick, hiddenLabel }: { card: Card; onClick: () => void; hiddenLabel: string }) {
  const faceUp = card.revealed || card.matched;
  const isDefinition = card.side === "definition";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={card.matched || card.revealed}
      aria-label={faceUp ? card.text : hiddenLabel}
      className={`relative aspect-[5/4] rounded-2xl border border-[var(--ink)] transition-all overflow-hidden ${
        card.matched
          ? "opacity-95 ring-4 ring-emerald-400"
          : !faceUp
          ? "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:"
          : ""
      }`}
    >
      {faceUp ? (
        <span
          className={`absolute inset-0 flex items-center justify-center text-center p-3 ${
            isDefinition
              ? "bg-[var(--success)] text-[var(--foreground)] text-xs sm:text-sm font-semibold leading-snug"
              : "bg-[var(--surface-2)] text-[var(--foreground)] text-base sm:text-lg font-semibold tracking-tight"
          }`}
        >
          {card.text}
        </span>
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "repeating-linear-gradient(45deg, var(--surface-2) 0 10px, var(--surface) 10px 20px)",
          }}
          aria-hidden="true"
        >
          <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-md border border-[var(--ink)] bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xl">
            ?
          </span>
        </span>
      )}
    </button>
  );
}
