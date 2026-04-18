"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DURATION_SECONDS = 60;
const XP_CORRECT = 10;
const XP_WRONG_PENALTY = 5;
const XP_CAP = 200;

type Op = "+" | "-" | "×";

type Problem = {
  a: number;
  b: number;
  op: Op;
  answer: number;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextProblem(): Problem {
  const ops: Op[] = ["+", "-", "×"];
  const op = ops[randInt(0, ops.length - 1)];
  if (op === "×") {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    return { a, b, op, answer: a * b };
  }
  if (op === "-") {
    const a = randInt(10, 99);
    const b = randInt(1, a);
    return { a, b, op, answer: a - b };
  }
  const a = randInt(10, 99);
  const b = randInt(1, 99);
  return { a, b, op, answer: a + b };
}

type Phase = "idle" | "running" | "done";

export function MathSprintClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [problem, setProblem] = useState<Problem>(() => nextProblem());
  const [answer, setAnswer] = useState("");
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lastResult, setLastResult] = useState<"ok" | "bad" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    awarded: number;
    globalXP: number;
    globalRank: number | null;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cappedXp = useMemo(() => Math.min(xp, XP_CAP), [xp]);

  const submitScore = useCallback(async (finalXp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: "math-sprint", xp: finalXp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSubmitError(json.error ?? "Nepodarilo sa zapísať skóre.");
        return;
      }
      setSubmitted({
        awarded: json.awarded,
        globalXP: json.globalXP,
        globalRank: json.globalRank,
      });
    } catch {
      setSubmitError("Sieťová chyba. XP sa nezapísali.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      submitScore(Math.min(xp, XP_CAP));
    }
  }, [phase, submitScore, xp]);

  function start() {
    setPhase("running");
    setSecondsLeft(DURATION_SECONDS);
    setProblem(nextProblem());
    setAnswer("");
    setXp(0);
    setCorrect(0);
    setWrong(0);
    setLastResult(null);
    setSubmitted(null);
    setSubmitError(null);
    setTimeout(() => inputRef.current?.focus(), 20);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase !== "running") return;
    const trimmed = answer.trim();
    if (trimmed === "") return;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setAnswer("");
      return;
    }
    if (parsed === problem.answer) {
      setXp((x) => Math.min(x + XP_CORRECT, XP_CAP));
      setCorrect((c) => c + 1);
      setLastResult("ok");
    } else {
      setXp((x) => Math.max(0, x - XP_WRONG_PENALTY));
      setWrong((w) => w + 1);
      setLastResult("bad");
    }
    setProblem(nextProblem());
    setAnswer("");
  }

  if (phase === "idle") {
    return (
      <div className="card p-8 flex flex-col gap-4 items-start">
        <h2 className="text-xl font-semibold">Pripravený?</h2>
        <p className="text-zinc-400">
          Po spustení máš 60 sekúnd. Odpoveď zadaj a stlač Enter.
        </p>
        <button type="button" className="btn btn-primary" onClick={start}>
          Spustiť šprint
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="card p-8 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Čas vypršal</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="Správne" value={correct} tone="ok" />
          <Stat label="Zlé" value={wrong} tone="bad" />
          <Stat label="Skóre" value={cappedXp} tone="accent" />
        </div>
        {submitting && <p className="text-zinc-400">Zapisujem XP…</p>}
        {submitError && <p className="text-rose-400">Chyba: {submitError}</p>}
        {submitted && (
          <div className="flex flex-col gap-1">
            <p className="text-lg">
              Získal si{" "}
              <strong className="text-[var(--accent)]">
                +{submitted.awarded} XP
              </strong>
            </p>
            <p className="text-sm text-zinc-400">
              Celkovo máš {submitted.globalXP} XP
              {submitted.globalRank !== null
                ? ` · pozícia #${submitted.globalRank} globálne`
                : ""}
              .
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          <button type="button" className="btn btn-primary" onClick={start}>
            Znova
          </button>
          <Link href="/leaderboard" className="btn btn-ghost">
            Rebríček
          </Link>
          <Link href="/games" className="btn btn-ghost">
            Iná hra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="chip">
          <span className="opacity-70">Čas</span>
          <strong>{secondsLeft}s</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">XP</span>
          <strong className="text-[var(--accent)]">{cappedXp}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">✓</span>
          <strong>{correct}</strong>
          <span className="opacity-70">✗</span>
          <strong>{wrong}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${(secondsLeft / DURATION_SECONDS) * 100}%` }}
        />
      </div>
      <form onSubmit={onSubmit} className="card p-8 flex flex-col gap-4">
        <div
          className={`text-center text-5xl sm:text-6xl font-mono font-bold tracking-wide transition-colors ${
            lastResult === "ok"
              ? "text-emerald-400"
              : lastResult === "bad"
              ? "text-rose-400"
              : ""
          }`}
        >
          {problem.a} {problem.op} {problem.b} = ?
        </div>
        <input
          ref={inputRef}
          className="input text-center text-2xl font-mono"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          Odoslať (Enter)
        </button>
      </form>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "bad" | "accent";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "bad"
      ? "text-rose-400"
      : "text-[var(--accent)]";
  return (
    <div className="card p-3 flex flex-col items-center">
      <span className="text-xs text-zinc-400 uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
