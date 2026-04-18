"use client";

import Link from "next/link";
import type { ScoreResponse } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Confetti } from "@/components/confetti";

export type RoundResultState = {
  submitting: boolean;
  error: string | null;
  result: ScoreResponse | null;
};

export type StatLine = { label: string; value: string };

type Props = {
  state: RoundResultState;
  gameHref: string;
  retryLabel?: string;
  lines: StatLine[];
};

export function RoundResult({
  state,
  gameHref,
  retryLabel = "Hrať znova",
  lines,
}: Props) {
  const router = useRouter();
  const awarded =
    state.result && state.result.ok ? state.result.awarded : null;
  const isNewBest =
    state.result && state.result.ok ? state.result.isNewBest : false;
  const level = state.result && state.result.ok ? state.result.level : null;
  const rank =
    state.result && state.result.ok ? state.result.globalRank : null;

  // refresh navbar stats (level ring in server layout) after score is applied
  useEffect(() => {
    if (state.result && state.result.ok) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.result?.ok]);

  return (
    <div className="relative card p-8 flex flex-col gap-6 overflow-hidden">
      {isNewBest && <Confetti count={36} />}
      <div className="relative flex flex-col gap-2">
        <h2 className="text-3xl font-bold">Koniec kola</h2>
        {isNewBest && (
          <span className="self-start chip border-[var(--accent)] text-[var(--accent)] animate-xp-pop">
            Nový osobný rekord ✨
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {lines.map((l) => (
          <div key={l.label} className="card p-3 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {l.label}
            </span>
            <span className="text-xl font-mono font-bold">{l.value}</span>
          </div>
        ))}
      </div>

      {state.submitting && (
        <p className="text-zinc-400 text-sm">Zapisujem XP…</p>
      )}
      {state.error && <p className="text-rose-400 text-sm">{state.error}</p>}

      {awarded !== null && state.result?.ok && (
        <div className="relative bg-[var(--accent)] text-[#0a0a0f] border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest font-bold opacity-70">
                Získané XP
              </span>
              <span className="text-5xl font-black tracking-tight">
                +{awarded}
              </span>
            </div>
            {level && (
              <div className="text-right bg-[#0a0a0f] text-[var(--accent)] border-[3px] border-[#0a0a0f] rounded-xl px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-widest block opacity-70 text-zinc-300">
                  Level
                </span>
                <span className="text-2xl font-black">{level.level}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <span>
              Celkovo: <strong className="font-black">{state.result.globalXP}</strong> XP
            </span>
            {rank !== null && (
              <span>
                Rebríček: <strong className="font-black">#{rank}</strong>
              </span>
            )}
            {level && level.xpToNext > 0 && (
              <span>
                Do ďalšieho: <strong className="font-black">{level.xpToNext}</strong> XP
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={gameHref} className="btn btn-primary">
          {retryLabel}
        </Link>
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
