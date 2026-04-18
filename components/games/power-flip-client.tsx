"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PowerRound } from "@/lib/content/power-flip";
import {
  DURATION_SECONDS,
  XP_CAP,
  XP_CORRECT,
  XP_WRONG,
} from "@/lib/content/power-flip";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import {
  ComboBadge,
  FloatingFxLayer,
  comboMultiplier,
  useFloatingFx,
} from "@/components/games/fx";

const GAME_ID = "power-flip";

type Phase = "idle" | "running" | "done";

export function PowerFlipClient({ rounds }: { rounds: PowerRound[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [index, setIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flash, setFlash] = useState<"left" | "right" | null>(null);
  const [lastFact, setLastFact] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const { items: fxItems, spawn: spawnFx } = useFloatingFx();
  const boardRef = useRef<HTMLDivElement | null>(null);

  const current = rounds[index % rounds.length];

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const submit = useCallback(async (finalXp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, finalXp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? "Nepodarilo sa zapísať skóre.");
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (phase === "done") submit(Math.min(xp, XP_CAP));
  }, [phase, xp, submit]);

  function pct(e: React.MouseEvent<HTMLElement>): { x: number; y: number } {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function tap(
    side: "left" | "right",
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (phase !== "running") return;
    const p = pct(e);
    if (side === current.correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      const mult = comboMultiplier(newCombo);
      const gained = Math.round(XP_CORRECT * mult);
      setXp((v) => Math.min(v + gained, XP_CAP));
      setCorrect((c) => c + 1);
      setFlash(side);
      spawnFx({ x: p.x, y: p.y, text: `+${gained}`, tone: mult > 1 ? "combo" : "ok" });
    } else {
      setCombo(0);
      setXp((v) => Math.max(0, v - XP_WRONG));
      setWrong((w) => w + 1);
      setFlash(side);
      spawnFx({ x: p.x, y: p.y, text: `−${XP_WRONG}`, tone: "bad" });
    }
    setLastFact(current.fact);
    window.setTimeout(() => {
      setIndex((i) => i + 1);
      setFlash(null);
    }, 380);
  }

  function start() {
    setPhase("running");
    setSecondsLeft(DURATION_SECONDS);
    setIndex(0);
    setXp(0);
    setCorrect(0);
    setWrong(0);
    setCombo(0);
    setBestCombo(0);
    setLastFact(null);
    setResult(null);
    setSubmitError(null);
  }

  if (phase === "idle") {
    return (
      <div className="card p-8 flex flex-col gap-4 items-start">
        <h2 className="text-xl font-semibold">Pripravený?</h2>
        <p className="text-zinc-400">
          Dve možnosti vedľa seba. Ktorá ušetrí viac energie alebo peňazí? Kliknite
          vľavo alebo vpravo. Správne klik za sebou = combo ×2, ×3.
        </p>
        <button type="button" className="btn btn-primary" onClick={start}>
          Spustiť Power Flip
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <RoundResult
        state={{ submitting, error: submitError, result }}
        gameHref="/games/power-flip"
        retryLabel="Znova"
        lines={[
          { label: "Správne", value: String(correct) },
          { label: "Zlé", value: String(wrong) },
          { label: "Best combo", value: String(bestCombo) },
          { label: "Skóre", value: String(Math.min(xp, XP_CAP)) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
        <span className="chip">
          <span className="opacity-70">Čas</span>
          <strong>{secondsLeft}s</strong>
        </span>
        <ComboBadge combo={combo} multiplier={comboMultiplier(combo)} />
        <span className="chip">
          <span className="opacity-70">XP</span>
          <strong className="text-[var(--accent)]">{Math.min(xp, XP_CAP)}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${(secondsLeft / DURATION_SECONDS) * 100}%` }}
        />
      </div>
      <div className="card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="text-center text-lg sm:text-xl font-semibold">
          {current.question}
        </h2>
        <div ref={boardRef} className="relative grid grid-cols-2 gap-3 sm:gap-4">
          <Choice
            side="left"
            flash={flash}
            round={current}
            onClick={(e) => tap("left", e)}
          />
          <Choice
            side="right"
            flash={flash}
            round={current}
            onClick={(e) => tap("right", e)}
          />
          <FloatingFxLayer items={fxItems} />
        </div>
        <p className="text-xs text-zinc-400 italic min-h-[1.5em] text-center">
          {lastFact ? `💡 ${lastFact}` : "Tap rýchlo — čas beží."}
        </p>
      </div>
    </div>
  );
}

function Choice({
  side,
  flash,
  round,
  onClick,
}: {
  side: "left" | "right";
  flash: "left" | "right" | null;
  round: PowerRound;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const choice = side === "left" ? round.left : round.right;
  const isCorrect = flash === side && round.correct === side;
  const isWrong = flash === side && round.correct !== side;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-5 sm:p-6 flex flex-col gap-2 items-start text-left transition-all border ${
        isCorrect
          ? "border-emerald-400 bg-emerald-500/20 animate-[tile-flash-ok_320ms]"
          : isWrong
          ? "border-rose-500 bg-rose-500/20 animate-[tile-flash-bad_320ms]"
          : "border-[var(--border)] bg-[var(--surface-2)]/70 hover:border-[var(--accent)] hover:-translate-y-0.5"
      }`}
    >
      <span className="text-2xl sm:text-3xl font-bold">{choice.label}</span>
      <span className="text-xs sm:text-sm text-zinc-400">{choice.detail}</span>
    </button>
  );
}
