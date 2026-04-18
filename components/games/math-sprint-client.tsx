"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";

const GAME_ID = "math-sprint";
const DURATION_SECONDS = 60;
const XP_CORRECT = 10;
const XP_WRONG_PENALTY = 5;
const XP_CAP = 200;

type Op = "+" | "-" | "×";
type Problem = { a: number; b: number; op: Op; answer: number };

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
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cappedXp = useMemo(() => Math.min(xp, XP_CAP), [xp]);

  const submit = useCallback(async (finalXp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, finalXp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? "Nepodarilo sa zapísať skóre.");
    setSubmitting(false);
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
      submit(Math.min(xp, XP_CAP));
    }
  }, [phase, submit, xp]);

  function start() {
    setPhase("running");
    setSecondsLeft(DURATION_SECONDS);
    setProblem(nextProblem());
    setAnswer("");
    setXp(0);
    setCorrect(0);
    setWrong(0);
    setLastResult(null);
    setResult(null);
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
      <RoundResult
        state={{ submitting, error: submitError, result }}
        gameHref="/games/math-sprint"
        retryLabel="Znova"
        lines={[
          { label: "Správne", value: String(correct) },
          { label: "Zlé", value: String(wrong) },
          { label: "Skóre", value: String(cappedXp) },
        ]}
      />
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
          <span className="opacity-70">W</span>
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
