"use client";

import Link from "next/link";
import type { ScoreResponse } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/confetti";
import { CountUp } from "@/components/count-up";
import type { Dict, Lang } from "@/lib/i18n";
import plDict from "@/lib/locales/pl";
import { PostGameBreakdown } from "@/components/post-game-breakdown";

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
  dict?: Dict;
  /** Cleanup issue 3 — explicit locale for the PostGameBreakdown modal
   *  (which has its own 4-lang copy). Optional; falls back to "pl". */
  lang?: Lang;
};

export function RoundResult({
  state,
  gameHref,
  retryLabel,
  lines,
  dict = plDict,
  lang = "pl",
}: Props) {
  const t = dict.roundResult;
  const retry = retryLabel ?? t.retry;
  const router = useRouter();
  const awarded =
    state.result && state.result.ok ? state.result.awarded : null;
  const isNewBest =
    state.result && state.result.ok ? state.result.isNewBest : false;
  const level = state.result && state.result.ok ? state.result.level : null;
  const rank =
    state.result && state.result.ok ? state.result.globalRank : null;

  // Cleanup issue 3 — mount PostGameBreakdown modal when the server
  // returned a non-null `multBreakdown`. Flag gating happens server-side
  // in /api/score (flag v2_post_game_modal); null = modal off.
  const multBreakdown =
    state.result && state.result.ok ? state.result.multBreakdown : null;
  const resources =
    state.result && state.result.ok ? state.result.resources : null;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  useEffect(() => {
    if (multBreakdown && awarded !== null) {
      // Defer one tick so Confetti gets to paint first
      const id = setTimeout(() => setBreakdownOpen(true), 120);
      return () => clearTimeout(id);
    }
  }, [multBreakdown, awarded]);

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
        <h2 className="text-3xl font-bold">{t.endTitle}</h2>
        {isNewBest && (
          <span className="self-start chip border-[var(--accent)] text-[var(--accent)] animate-xp-pop">
            {t.newRecord}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {lines.map((l) => (
          <div key={l.label} className="card p-3 flex flex-col items-center">
            <span className="text-xs text-zinc-400">
              {l.label}
            </span>
            <span className="text-xl font-mono font-bold">{l.value}</span>
          </div>
        ))}
      </div>

      {state.submitting && (
        <p className="text-zinc-400 text-sm">{t.writing}</p>
      )}
      {state.error && <p className="text-rose-400 text-sm">{state.error}</p>}

      {awarded !== null && state.result?.ok && (
        <div
          className={`relative border border-[var(--ink)] rounded-2xl p-5 flex flex-col gap-3 ${
            isNewBest
              ? "bg-[var(--accent)] text-[var(--foreground)]"
              : "bg-[var(--surface-2)] text-[var(--foreground)]"
          }`}
        >
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span
                className={`text-xs font-bold ${
                  isNewBest ? "opacity-70" : "text-zinc-400"
                }`}
              >
                {isNewBest ? t.newRecordHeader : t.currentScoreHeader}
              </span>
              <span
                className={`text-5xl font-semibold tracking-tight ${
                  !isNewBest ? "text-zinc-300" : ""
                }`}
              >
                <CountUp value={awarded} durationMs={850} /> W
              </span>
              {isNewBest && state.result.delta > 0 && (
                <span className="text-sm font-bold">
                  {t.plusOver.replace(
                    "{delta}",
                    String(state.result.delta),
                  )}
                  {state.result.previousBest > 0
                    ? ` ${t.prevParen.replace(
                        "{prev}",
                        String(state.result.previousBest),
                      )}`
                    : ""}
                </span>
              )}
              {!isNewBest &&
                (() => {
                  const parts = t.recordStays
                    .replace("{score}", "§SCORE§")
                    .replace("{beat}", "§BEAT§")
                    .split(/(§SCORE§|§BEAT§)/g);
                  return (
                    <span className="text-sm font-semibold text-zinc-400">
                      {parts.map((p, i) => {
                        if (p === "§SCORE§")
                          return (
                            <strong
                              key={i}
                              className="text-[var(--accent)]"
                            >
                              {state.result?.ok ? state.result.gameXP : 0} W
                            </strong>
                          );
                        if (p === "§BEAT§")
                          return <strong key={i}>{t.beat}</strong>;
                        return <span key={i}>{p}</span>;
                      })}
                    </span>
                  );
                })()}
            </div>
            {level && (
              <div
                className={`text-right border rounded-xl px-3 py-1.5 ${
                  isNewBest
                    ? "bg-[#0a0a0f] text-[var(--accent)] border-[#0a0a0f]"
                    : "bg-[#0a0a0f] text-[var(--accent)] border-[var(--ink)]"
                }`}
              >
                <span className="text-[10px] block opacity-70 text-zinc-300">
                  {t.tierLabel}
                </span>
                <span className="text-2xl font-semibold">{level.level}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <span>
              {t.yourCity}:{" "}
              <strong className="font-semibold">
                {state.result.globalXP.toLocaleString("pl-PL")}
              </strong>{" "}
              W
            </span>
            {rank !== null && (
              <span>
                {t.leagueRank}:{" "}
                <strong className="font-semibold">#{rank}</strong>
              </span>
            )}
            {level && level.xpToNext > 0 && (
              <span>
                {t.toNextTier}:{" "}
                <strong className="font-semibold">{level.xpToNext}</strong> W
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            // Hard reload: gameHref equals current URL so a Next <Link>
            // wouldn't trigger navigation — reload re-runs the server page
            // and generates a fresh seeded round / question set.
            if (typeof window !== "undefined") {
              window.location.href = gameHref;
            }
          }}
          className="btn btn-primary"
        >
          {retry}
        </button>
        <Link href="/leaderboard" className="btn btn-ghost">
          {t.leaderboard}
        </Link>
        <Link href="/games" className="btn btn-ghost">
          {t.otherGame}
        </Link>
      </div>

      {/* Cleanup issue 3 — PostGameBreakdown modal. Shown iff the server
          emitted a non-null multBreakdown (flag-gated) and we have a
          credited amount to show. */}
      {multBreakdown && awarded !== null && breakdownOpen && (
        <PostGameBreakdown
          lang={lang}
          baseValue={
            state.result?.ok ? state.result.delta || state.result.awarded : 0
          }
          finalValue={awarded}
          breakdown={multBreakdown}
          resourceDelta={
            resources
              ? (Object.fromEntries(
                  Object.entries(resources).filter(([, v]) => v !== 0),
                ) as Record<string, number>)
              : undefined
          }
          onClose={() => setBreakdownOpen(false)}
        />
      )}
    </div>
  );
}
