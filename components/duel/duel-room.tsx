"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DuelSummary, DuelRound, DuelAnswer } from "@/lib/duel";
import { DUEL_ROUND_SECONDS } from "@/lib/duel";

type Role = "A" | "B" | "spectator" | "full";

type Props = {
  code: string;
  self: string;
  role: Role;
  initial: DuelSummary;
};

type LocalPhase = "waiting" | "playing" | "submitted";

export function DuelRoom({ code, self, role: initialRole, initial }: Props) {
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

  // Poll duel state while waiting / playing so we see opponent submit
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/duel/${code}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.ok) {
          setDuel(json.duel);
        }
      } catch {
        /* swallow transient errors */
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
        setError(json.error ?? "Pripojenie zlyhalo.");
        return;
      }
      setRole(json.role);
      setDuel(json.duel);
    } catch {
      setError("Sieťová chyba.");
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
        setError(json.error ?? "Odovzdanie zlyhalo.");
        return;
      }
      setDuel(json.duel);
      setPhase("submitted");
    } catch {
      setError("Sieťová chyba.");
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
            ← Späť na lobby
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="brutal-heading text-3xl sm:text-4xl">Duel</h1>
            <span className="brutal-tag" style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}>
              kód: {code}
            </span>
            <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>
              Kurzový šprint · 6 kôl
            </span>
          </div>
        </div>
        {role === "A" && !hasOpponent && (
          <button
            type="button"
            onClick={shareCopy}
            className="btn btn-pink"
          >
            {copied ? "Skopírované ✓" : "Skopírovať link"}
          </button>
        )}
      </header>

      <PlayersBanner duel={duel} self={self} role={role} />

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {role === "full" && (
        <div className="card p-6 text-zinc-300">
          Duel je plný. Môžeš ho sledovať v reálnom čase, ale nehráš.
        </div>
      )}

      {role === "spectator" && (
        <div className="card p-6 flex flex-col gap-3">
          <p className="text-zinc-300">
            Nie si súčasťou duelu. Ak máš pozvánku, pripoj sa ako hráč B.
          </p>
          {!hasOpponent && (
            <button type="button" onClick={join} className="btn btn-primary w-fit">
              Pripojiť sa ako hráč B
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
        />
      )}

      {mineDone && (
        <ResultPanel
          duel={duel}
          bothDone={bothDone}
          self={self}
          mySide={role === "A" ? "A" : role === "B" ? "B" : null}
        />
      )}
    </div>
  );
}

function PlayersBanner({
  duel,
  self,
  role,
}: {
  duel: DuelSummary;
  self: string;
  role: Role;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PlayerCard
        label="Hráč A"
        name={duel.playerA}
        isSelf={duel.playerA === self}
        finished={duel.finishedA}
        wins={duel.winsA}
        color="var(--neo-yellow)"
      />
      <PlayerCard
        label="Hráč B"
        name={duel.playerB}
        isSelf={duel.playerB === self}
        finished={duel.finishedB}
        wins={duel.winsB}
        color="var(--neo-pink)"
        placeholderHint={role === "A" ? "Čakáš na pripojenie…" : null}
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
}: {
  label: string;
  name: string | null;
  isSelf: boolean;
  finished: boolean;
  wins: number;
  color: string;
  placeholderHint?: string | null;
}) {
  return (
    <div
      className="rounded-2xl border-[3px] border-[var(--ink)] p-4 shadow-[4px_4px_0_0_var(--ink)] flex items-center justify-between"
      style={{ background: color, color: "#0a0a0f" }}
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">
          {label} {isSelf ? "· ty" : ""}
        </p>
        <p className="text-2xl font-black truncate max-w-[10ch]">
          {name ?? "—"}
        </p>
        <p className="text-xs font-semibold opacity-80">
          {finished ? "odohrané" : placeholderHint ?? "ešte nehral"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">
          Výhry
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
}: {
  rounds: DuelRound[];
  onSubmit: (a: DuelAnswer[]) => void;
  onStart: () => void;
  phase: LocalPhase;
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DUEL_ROUND_SECONDS);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roundStartedAtRef = useRef<number>(Date.now());
  const valueRef = useRef(value);
  valueRef.current = value;

  // Refs keep the tick closure stable regardless of re-renders so a keystroke
  // no longer remounts the interval (prev bug: timer slowed / stalled while
  // the user was typing because the effect re-ran on every value change).
  const submitAll = useRef(onSubmit);
  submitAll.current = onSubmit;

  const advance = useCallback(
    (raw: string, auto: boolean) => {
      const parsed = Number(raw.trim().replace(",", "."));
      const elapsed = Date.now() - roundStartedAtRef.current;
      const answer: DuelAnswer = {
        value: Number.isFinite(parsed) ? parsed : Number.NaN,
        elapsedMs: auto ? DUEL_ROUND_SECONDS * 1000 : elapsed,
      };
      setIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        // Use functional state capture so we always append to the latest list.
        // Snapshot current answers via the functional setter trick:
        answersStateRef.current = [...answersStateRef.current, answer];
        if (answersStateRef.current.length >= rounds.length) {
          submitAll.current(answersStateRef.current);
          return prevIdx; // stay; parent will switch phase
        }
        setValue("");
        setSecondsLeft(DUEL_ROUND_SECONDS);
        roundStartedAtRef.current = Date.now();
        return nextIdx;
      });
    },
    [rounds.length],
  );

  // Backing store for answers kept outside of React state so a rapid auto-
  // submit from the timer can't lose entries in an async state batch.
  const answersStateRef = useRef<DuelAnswer[]>([]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Tick timer while playing — stable deps, no remount on keystroke.
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

  // focus after round advances
  useEffect(() => {
    if (phase === "playing") {
      inputRef.current?.focus();
    }
  }, [index, phase]);

  if (phase === "waiting") {
    return (
      <div className="card p-6 flex flex-col items-start gap-3">
        <h2 className="text-xl font-black uppercase">Pripravený?</h2>
        <p className="text-zinc-300 max-w-prose">
          6 kôl. Každé má {DUEL_ROUND_SECONDS} sekúnd. Odpoveď Enter.
          Desatinné miesta bodkou alebo čiarkou. Nemusíš trafiť presne — vyhráva
          kto je bližšie k správnemu výsledku.
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
          Štart ⚔️
        </button>
      </div>
    );
  }

  const round = rounds[index];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="chip">
          Kolo <strong>{index + 1}/{rounds.length}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">Čas</span>
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
              : "Matematika"}
          </span>
          <div className="text-center text-4xl sm:text-5xl font-mono font-black">
            {round.problem.kind === "currency"
              ? `${round.problem.amount} ${round.problem.from} → ? ${round.problem.to}`
              : `${round.problem.a} ${round.problem.op} ${round.problem.b} = ?`}
          </div>
          <span className="text-xs text-zinc-500">
            vyhráva kto má menší rozdiel od presnej hodnoty
          </span>
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
          Potvrdiť (Enter)
        </button>
      </form>
    </div>
  );
}

function ResultPanel({
  duel,
  bothDone,
  self,
  mySide,
}: {
  duel: DuelSummary;
  bothDone: boolean;
  self: string;
  mySide: "A" | "B" | null;
}) {
  const myWins = mySide === "A" ? duel.winsA : duel.winsB;
  const oppWins = mySide === "A" ? duel.winsB : duel.winsA;

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 flex flex-col gap-3">
        <h2 className="brutal-heading text-2xl">
          {bothDone
            ? myWins > oppWins
              ? "Vyhral si 🏆"
              : myWins < oppWins
              ? "Kamoš vyhral 😅"
              : "Remíza"
            : "Odovzdané, čaká sa na súpera"}
        </h2>
        {!bothDone && (
          <p className="text-sm text-zinc-400">
            Stránka sa sama obnoví každé 3,5 sekundy. Pošli kamarátovi kód{" "}
            <strong className="text-[var(--accent)]">{duel.code}</strong>, ak
            ešte nevie.
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
                  Kolo {i + 1}
                </span>
                <span
                  className={`brutal-tag ${
                    winner === "tie"
                      ? ""
                      : winner === mySide
                      ? ""
                      : ""
                  }`}
                  style={{
                    background:
                      winner === "A"
                        ? "var(--neo-yellow)"
                        : winner === "B"
                        ? "var(--neo-pink)"
                        : "var(--surface-2)",
                    color:
                      winner === "tie" ? "var(--foreground)" : "#0a0a0f",
                  }}
                >
                  {winner === "A" ? duel.playerA : winner === "B" ? duel.playerB ?? "B" : "remíza"}
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
