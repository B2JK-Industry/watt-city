"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DuelSummary, DuelRound, DuelAnswer } from "@/lib/duel";
import { DUEL_ROUND_SECONDS, DUEL_GAMES } from "@/lib/duel";
import type { Dict } from "@/lib/i18n";
import plDict from "@/lib/locales/pl";

type Role = "A" | "B" | "spectator" | "full";

type Props = {
  code: string;
  self: string;
  role: Role;
  initial: DuelSummary;
  dict?: Dict;
};

type LocalPhase = "waiting" | "playing" | "submitted";

export function DuelRoom({
  code,
  self,
  role: initialRole,
  initial,
  dict = plDict,
}: Props) {
  const t = dict.duel;
  const [duel, setDuel] = useState<DuelSummary>(initial);
  const [role, setRole] = useState<Role>(initialRole);
  const [phase, setPhase] = useState<LocalPhase>(() => {
    if (initialRole === "spectator") return "submitted";
    if (initialRole === "A" && initial.finishedA) return "submitted";
    if (initialRole === "B" && initial.finishedB) return "submitted";
    return "waiting";
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return `/duel/${code}`;
    return `${window.location.origin}/duel/${code}`;
  }, [code]);

  const gameMeta =
    DUEL_GAMES.find((g) => g.id === duel.gameId) ?? DUEL_GAMES[0];

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/duel/${code}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.ok) setDuel(json.duel);
      } catch {
        /* swallow */
      }
    }
    const id = window.setInterval(tick, 3500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [code]);

  async function join() {
    setError(null);
    try {
      const res = await fetch(`/api/duel/${code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? t.full);
        return;
      }
      setRole(json.role);
      setDuel(json.duel);
    } catch {
      setError(dict.auth.errorNetwork);
    }
  }

  async function submit(answers: DuelAnswer[]) {
    setError(null);
    try {
      const res = await fetch(`/api/duel/${code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", answers }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? dict.auth.errorGeneric);
        return;
      }
      setDuel(json.duel);
      setPhase("submitted");
    } catch {
      setError(dict.auth.errorNetwork);
    }
  }

  const mineDone =
    (role === "A" && duel.finishedA) || (role === "B" && duel.finishedB);
  const bothDone = duel.finishedA && duel.finishedB;
  const hasOpponent = Boolean(duel.playerB);

  function shareCopy() {
    navigator.clipboard?.writeText(inviteUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/duel" className="text-sm text-zinc-400 hover:underline">
            {t.back}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="brutal-heading text-3xl sm:text-4xl">{t.title}</h1>
            <span
              className="brutal-tag"
              style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}
            >
              {t.codeTag.replace("{code}", code)}
            </span>
            <span
              className="brutal-tag"
              style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}
            >
              {gameMeta.emoji} {gameMeta.title}
            </span>
          </div>
        </div>
        {role === "A" && !hasOpponent && (
          <button type="button" onClick={shareCopy} className="btn btn-pink">
            {copied ? t.shareCopied : t.shareCopy}
          </button>
        )}
      </header>

      <PlayersBanner duel={duel} self={self} role={role} t={t} />

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {role === "full" && (
        <div className="card p-6 text-zinc-300">{t.full}</div>
      )}

      {role === "spectator" && (
        <div className="card p-6 flex flex-col gap-3">
          <p className="text-zinc-300">{t.notPart}</p>
          {!hasOpponent && (
            <button
              type="button"
              onClick={join}
              className="btn btn-primary w-fit"
            >
              {t.joinAsB}
            </button>
          )}
        </div>
      )}

      {(role === "A" || role === "B") && !mineDone && phase !== "submitted" && (
        <DuelPlay
          rounds={duel.rounds}
          onSubmit={(answers) => {
            setPhase("submitted");
            submit(answers);
          }}
          onStart={() => setPhase("playing")}
          phase={phase}
          t={t}
        />
      )}

      {mineDone && (
        <ResultPanel
          duel={duel}
          bothDone={bothDone}
          mySide={role === "A" ? "A" : role === "B" ? "B" : null}
          t={t}
        />
      )}
    </div>
  );
}

function PlayersBanner({
  duel,
  self,
  role,
  t,
}: {
  duel: DuelSummary;
  self: string;
  role: Role;
  t: Dict["duel"];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PlayerCard
        label={t.playerA}
        name={duel.playerA}
        isSelf={duel.playerA === self}
        finished={duel.finishedA}
        wins={duel.winsA}
        color="var(--neo-yellow)"
        t={t}
      />
      <PlayerCard
        label={t.playerB}
        name={duel.playerB}
        isSelf={duel.playerB === self}
        finished={duel.finishedB}
        wins={duel.winsB}
        color="var(--neo-pink)"
        placeholderHint={role === "A" ? t.waitingJoin : null}
        t={t}
      />
    </div>
  );
}

function PlayerCard({
  label,
  name,
  isSelf,
  finished,
  wins,
  color,
  placeholderHint,
  t,
}: {
  label: string;
  name: string | null;
  isSelf: boolean;
  finished: boolean;
  wins: number;
  color: string;
  placeholderHint?: string | null;
  t: Dict["duel"];
}) {
  return (
    <div
      className="rounded-2xl border-[3px] border-[var(--ink)] p-4 shadow-[4px_4px_0_0_var(--ink)] flex items-center justify-between"
      style={{ background: color, color: "#0a0a0f" }}
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">
          {label} {isSelf ? t.youSuffix : ""}
        </p>
        <p className="text-2xl font-black truncate max-w-[10ch]">
          {name ?? "—"}
        </p>
        <p className="text-xs font-semibold opacity-80">
          {finished ? t.finished : placeholderHint ?? t.notPlayed}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">
          {t.wins}
        </p>
        <p className="text-4xl font-mono font-black">{wins}</p>
      </div>
    </div>
  );
}

function DuelPlay({
  rounds,
  onSubmit,
  onStart,
  phase,
  t,
}: {
  rounds: DuelRound[];
  onSubmit: (a: DuelAnswer[]) => void;
  onStart: () => void;
  phase: LocalPhase;
  t: Dict["duel"];
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DUEL_ROUND_SECONDS);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roundStartedAtRef = useRef<number>(Date.now());
  const valueRef = useRef(value);
  valueRef.current = value;
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const answersStateRef = useRef<DuelAnswer[]>([]);

  const advance = useCallback(
    (raw: string, auto: boolean) => {
      const parsed = Number(raw.trim().replace(",", "."));
      const elapsed = Date.now() - roundStartedAtRef.current;
      const answer: DuelAnswer = {
        value: Number.isFinite(parsed) ? parsed : Number.NaN,
        elapsedMs: auto ? DUEL_ROUND_SECONDS * 1000 : elapsed,
      };
      answersStateRef.current = [...answersStateRef.current, answer];
      if (answersStateRef.current.length >= rounds.length) {
        submitRef.current(answersStateRef.current);
      } else {
        setIndex((i) => i + 1);
        setValue("");
        setSecondsLeft(DUEL_ROUND_SECONDS);
        roundStartedAtRef.current = Date.now();
      }
    },
    [rounds.length],
  );

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          advanceRef.current(valueRef.current, true);
          return DUEL_ROUND_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [index, phase]);

  if (phase === "waiting") {
    return (
      <div className="card p-6 flex flex-col items-start gap-3">
        <h2 className="text-xl font-black uppercase">{t.ready}</h2>
        <p className="text-zinc-300 max-w-prose">
          {t.rules.replace("{secs}", String(DUEL_ROUND_SECONDS))}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            roundStartedAtRef.current = Date.now();
            setSecondsLeft(DUEL_ROUND_SECONDS);
            answersStateRef.current = [];
            onStart();
          }}
        >
          {t.start}
        </button>
      </div>
    );
  }

  const round = rounds[index];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="chip">
          {t.round}{" "}
          <strong>
            {index + 1}/{rounds.length}
          </strong>
        </span>
        <span className="chip">
          <span className="opacity-70">{t.time}</span>
          <strong>{secondsLeft}s</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${(secondsLeft / DUEL_ROUND_SECONDS) * 100}%` }}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          advance(value, false);
        }}
        className="card p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-zinc-400">
            {round.problem.kind === "currency"
              ? `${round.problem.from} → ${round.problem.to}`
              : "Math"}
          </span>
          <div className="text-center text-4xl sm:text-5xl font-mono font-black">
            {round.problem.kind === "currency"
              ? `${round.problem.amount} ${round.problem.from} → ? ${round.problem.to}`
              : `${round.problem.a} ${round.problem.op} ${round.problem.b} = ?`}
          </div>
          <span className="text-xs text-zinc-500">{t.closer}</span>
        </div>
        <input
          ref={inputRef}
          className="input text-center text-2xl font-mono"
          inputMode="decimal"
          placeholder={
            round.problem.kind === "currency" ? round.problem.to : "?"
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          {t.confirm}
        </button>
      </form>
    </div>
  );
}

function ResultPanel({
  duel,
  bothDone,
  mySide,
  t,
}: {
  duel: DuelSummary;
  bothDone: boolean;
  mySide: "A" | "B" | null;
  t: Dict["duel"];
}) {
  const myWins = mySide === "A" ? duel.winsA : duel.winsB;
  const oppWins = mySide === "A" ? duel.winsB : duel.winsA;

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 flex flex-col gap-3">
        <h2 className="brutal-heading text-2xl">
          {bothDone
            ? myWins > oppWins
              ? t.resultWin
              : myWins < oppWins
              ? t.resultLose
              : t.resultTie
            : t.resultSubmitted}
        </h2>
        {!bothDone && (
          <p className="text-sm text-zinc-400">
            {t.waitingOpponent.replace("{code}", duel.code)}
          </p>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {duel.rounds.map((r, i) => {
          const winner = duel.roundWinners[i];
          const a = duel.answersA[i];
          const b = duel.answersB[i];
          const correct = r.problem.answer;
          return (
            <li
              key={i}
              className="rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--surface)] shadow-[4px_4px_0_0_var(--ink)] p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  {t.round} {i + 1}
                </span>
                <span
                  className="brutal-tag"
                  style={{
                    background:
                      winner === "A"
                        ? "var(--neo-yellow)"
                        : winner === "B"
                        ? "var(--neo-pink)"
                        : "var(--surface-2)",
                    color: winner === "tie" ? "var(--foreground)" : "#0a0a0f",
                  }}
                >
                  {winner === "A"
                    ? duel.playerA
                    : winner === "B"
                    ? duel.playerB ?? "B"
                    : t.resultTie}
                </span>
              </div>
              <p className="text-sm">
                {r.problem.kind === "currency" ? (
                  <>
                    <span className="text-zinc-400">
                      {r.problem.amount} {r.problem.from} →{" "}
                    </span>
                    <strong>
                      {correct.toFixed(2)} {r.problem.to}
                    </strong>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-400">
                      {r.problem.a} {r.problem.op} {r.problem.b} ={" "}
                    </span>
                    <strong>{correct}</strong>
                  </>
                )}
              </p>
              <AnswerRow label="A" name={duel.playerA} ans={a} truth={correct} />
              <AnswerRow
                label="B"
                name={duel.playerB ?? "—"}
                ans={b}
                truth={correct}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AnswerRow({
  label,
  name,
  ans,
  truth,
}: {
  label: "A" | "B";
  name: string;
  ans: DuelAnswer | undefined;
  truth: number;
}) {
  if (!ans) {
    return (
      <p className="text-xs text-zinc-500">
        {label} · {name} · —
      </p>
    );
  }
  const diff = Math.abs(ans.value - truth);
  return (
    <p className="text-xs text-zinc-300 flex items-center justify-between">
      <span>
        <strong>{label}</strong>{" "}
        <span className="text-zinc-400">{name}:</span>{" "}
        <span className="font-mono">
          {Number.isFinite(ans.value) ? ans.value.toFixed(2) : "—"}
        </span>
      </span>
      <span className="font-mono text-zinc-500">
        Δ {diff.toFixed(2)} · {(ans.elapsedMs / 1000).toFixed(1)}s
      </span>
    </p>
  );
}
