"use client";

import Link from "next/link";
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
  return deck.sort(() => Math.random() - 0.5);
}

function scoreFor(seconds: number, mismatches: number): number {
  const timePenalty = Math.max(0, Math.round((seconds - 30) * 1));
  const mistakePenalty = mismatches * 3;
  const raw = XP_CAP - timePenalty - mistakePenalty;
  return Math.max(20, Math.min(XP_CAP, Math.round(raw)));
}

export function MemoryMatchClient({ pairs }: { pairs: MemoryPair[] }) {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairs));
  const [selected, setSelected] = useState<string[]>([]);
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

  // auto-finish when all matched
  useEffect(() => {
    if (!completed && matchedCount === deck.length && deck.length > 0) {
      setCompleted(true);
    }
  }, [matchedCount, deck.length, completed]);

  // submit once completed
  useEffect(() => {
    if (!completed || submittedRef.current) return;
    submittedRef.current = true;
    const finalSeconds = Math.floor((Date.now() - startedAt) / 1000);
    setElapsed(finalSeconds);
    const xp = scoreFor(finalSeconds, mismatches);
    setSubmitting(true);
    submitScore(GAME_ID, xp)
      .then((res) => {
        if (res.ok) setResult(res);
        else setSubmitError(res.error ?? "Nepodarilo sa zapísať skóre.");
      })
      .catch(() => setSubmitError("Sieťová chyba. XP sa nezapísali."))
      .finally(() => setSubmitting(false));
  }, [completed, startedAt, mismatches]);

  const flip = useCallback(
    (id: string) => {
      if (completed) return;
      setDeck((cur) => {
        const card = cur.find((c) => c.id === id);
        if (!card || card.matched || card.revealed) return cur;

        if (selected.length === 0) {
          setSelected([id]);
          return cur.map((c) => (c.id === id ? { ...c, revealed: true } : c));
        }
        if (selected.length === 1) {
          const firstId = selected[0];
          const first = cur.find((c) => c.id === firstId);
          if (!first) return cur;
          const isMatch =
            first.pairId === card.pairId && first.side !== card.side;
          const next = cur.map((c) =>
            c.id === id ? { ...c, revealed: true } : c,
          );
          if (isMatch) {
            setSelected([]);
            return next.map((c) =>
              c.pairId === card.pairId
                ? { ...c, matched: true, revealed: true }
                : c,
            );
          }
          // mismatch — reveal briefly then hide
          setSelected([firstId, id]);
          setMismatches((m) => m + 1);
          window.setTimeout(() => {
            setDeck((later) =>
              later.map((c) =>
                c.id === firstId || c.id === id
                  ? { ...c, revealed: false }
                  : c,
              ),
            );
            setSelected([]);
          }, 900);
          return next;
        }
        return cur;
      });
    },
    [completed, selected],
  );

  if (completed) {
    return (
      <RoundResult
        state={{ submitting, error: submitError, result }}
        gameHref="/games/memory-match"
        retryLabel="Nové párovanie"
        lines={[
          { label: "Čas", value: `${elapsed}s` },
          { label: "Chyby", value: String(mismatches) },
          { label: "Páry", value: `${totalPairs}/${totalPairs}` },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          <span className="opacity-70">Čas</span>
          <strong>{elapsed}s</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">Chyby</span>
          <strong>{mismatches}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">Spárované</span>
          <strong>
            {matchedCount / 2}/{totalPairs}
          </strong>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {deck.map((card) => (
          <MemoryCard key={card.id} card={card} onClick={() => flip(card.id)} />
        ))}
      </div>
    </div>
  );
}

function MemoryCard({ card, onClick }: { card: Card; onClick: () => void }) {
  const faceUp = card.revealed || card.matched;
  const isDefinition = card.side === "definition";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={card.matched || card.revealed}
      className={`relative aspect-[5/4] rounded-2xl text-left transition-all duration-300 [transform-style:preserve-3d] ${
        faceUp ? "[transform:rotateY(180deg)]" : ""
      } ${card.matched ? "opacity-80 ring-2 ring-emerald-400/60" : ""}`}
    >
      <span
        className="absolute inset-0 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface-2)] flex items-center justify-center [backface-visibility:hidden]"
        aria-hidden="true"
      >
        <span className="text-3xl opacity-60">🎴</span>
      </span>
      <span
        className={`absolute inset-0 rounded-2xl border p-3 flex items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
          isDefinition
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 text-sm"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-100 font-semibold"
        }`}
      >
        {card.text}
      </span>
    </button>
  );
}
