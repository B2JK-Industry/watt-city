"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";

const GAME_ID = "currency-rush";
const DURATION_SECONDS = 45;
const XP_CORRECT = 12;
const XP_WRONG = 4;
const XP_CAP = 180;
// Single-player je odpúšťajúci: stačí trafiť celočíselnú odpoveď na ±3 %
// alebo 3 jednotky od správneho výsledku (čo je viac). Presnosť na dve
// desatinné miesta potom slúži iba pre duel režim, kde rozhoduje delta.
const TOLERANCE = 0.03;
const FLAT_TOLERANCE = 3;

type Pair = { from: Currency; to: Currency; rate: number; label: string };
type Currency = "EUR" | "PLN" | "USD";

const RATES: Pair[] = [
  { from: "EUR", to: "PLN", rate: 4.3, label: "1 EUR = 4.30 PLN" },
  { from: "PLN", to: "EUR", rate: 1 / 4.3, label: "1 PLN = 0.233 EUR" },
  { from: "USD", to: "PLN", rate: 3.95, label: "1 USD = 3.95 PLN" },
  { from: "PLN", to: "USD", rate: 1 / 3.95, label: "1 PLN = 0.253 USD" },
  { from: "EUR", to: "USD", rate: 1.08, label: "1 EUR = 1.08 USD" },
  { from: "USD", to: "EUR", rate: 1 / 1.08, label: "1 USD = 0.926 EUR" },
];

type Problem = {
  pair: Pair;
  amount: number;
  answer: number;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextProblem(): Problem {
  const pair = RATES[randInt(0, RATES.length - 1)];
  // pick round-ish amounts so mental math is reasonable
  const amount = [5, 10, 20, 25, 50, 80, 100, 150, 200][randInt(0, 8)];
  const answer = amount * pair.rate;
  return { pair, amount, answer };
}

type Phase = "idle" | "running" | "done";

export function CurrencyRushClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [problem, setProblem] = useState<Problem>(() => nextProblem());
  const [answer, setAnswer] = useState("");
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lastResult, setLastResult] = useState<"ok" | "bad" | null>(null);
  const [lastAnswerShown, setLastAnswerShown] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    if (phase === "done") submit(Math.min(xp, XP_CAP));
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
    setLastAnswerShown(null);
    setResult(null);
    setSubmitError(null);
    setTimeout(() => inputRef.current?.focus(), 20);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase !== "running") return;
    const trimmed = answer.trim().replace(",", ".");
    if (trimmed === "") return;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setAnswer("");
      return;
    }
    const diff = Math.abs(parsed - problem.answer);
    const allowed = Math.max(
      FLAT_TOLERANCE,
      Math.abs(problem.answer) * TOLERANCE,
    );
    if (diff <= allowed) {
      setXp((x) => Math.min(x + XP_CORRECT, XP_CAP));
      setCorrect((c) => c + 1);
      setLastResult("ok");
    } else {
      setXp((x) => Math.max(0, x - XP_WRONG));
      setWrong((w) => w + 1);
      setLastResult("bad");
      setLastAnswerShown(
        `${problem.amount} ${problem.pair.from} ≈ ${problem.answer.toFixed(2)} ${problem.pair.to}`,
      );
    }
    setProblem(nextProblem());
    setAnswer("");
  }

  if (phase === "idle") {
    return (
      <div className="card p-8 flex flex-col items-start gap-4">
        <h2 className="text-xl font-semibold">Pripravený?</h2>
        <p className="text-zinc-400">
          Výsledok píš v cieľovej mene (desatinné miesta oddeľuj bodkou alebo
          čiarkou). Kurzy nájdeš vľavo počas hry.
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
        gameHref="/games/currency-rush"
        retryLabel="Nový šprint"
        lines={[
          { label: "Správne", value: String(correct) },
          { label: "Zlé", value: String(wrong) },
          { label: "Skóre", value: String(Math.min(xp, XP_CAP)) },
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
          <strong className="text-[var(--accent)]">{Math.min(xp, XP_CAP)}</strong>
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
      <form onSubmit={onSubmit} className="card p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-xs uppercase tracking-wider text-zinc-400">
            {problem.pair.label} · tolerancia ±2 %
          </span>
          <div
            className={`text-center text-4xl sm:text-5xl font-mono font-bold transition-colors ${
              lastResult === "ok"
                ? "text-emerald-400"
                : lastResult === "bad"
                ? "text-rose-400"
                : ""
            }`}
          >
            {problem.amount} {problem.pair.from} → ? {problem.pair.to}
          </div>
          {lastResult === "bad" && lastAnswerShown && (
            <span className="text-xs text-rose-300">
              Správne: {lastAnswerShown}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          className="input text-center text-2xl font-mono"
          inputMode="decimal"
          placeholder={problem.pair.to}
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
