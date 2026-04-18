import Link from "next/link";
import { GAMES, localizedTitle } from "@/lib/games";
import type { UserStats } from "@/lib/user-stats";
import type { LevelInfo } from "@/lib/level";
import { CITY_TIERS, tierForLevel } from "@/lib/level";
import type { LeaderboardEntry } from "@/lib/redis";
import { CityScene, type CityGameState, type CityAiGame } from "@/components/city-scene";
import { PlayerBuilding } from "@/components/player-building";
import { DeleteAccountButton } from "@/components/delete-account-button";
import type { Dict, Lang } from "@/lib/i18n";

type Props = {
  username: string;
  xp: number;
  rank: number | null;
  level: LevelInfo;
  title: string;
  stats: UserStats;
  top: LeaderboardEntry[];
  dict: Dict;
  lang: Lang;
  aiGames?: CityAiGame[];
};

function timeAgo(ts: number, d: Dict["dashboard"]): string {
  if (!ts) return d.timeNever;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return d.timeJustNow;
  if (mins < 60) return d.timeMinutesAgo.replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return d.timeHoursAgo.replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  return d.timeDaysAgo.replace("{n}", String(days));
}

export function Dashboard({
  username,
  xp,
  rank,
  level,
  stats,
  top,
  dict,
  lang,
  aiGames,
}: Props) {
  const d = dict.dashboard;
  const locale = lang === "pl" ? "pl-PL" : lang === "cs" ? "cs-CZ" : lang === "uk" ? "uk-UA" : "en-US";
  const playedIds = Object.keys(stats.games);
  const unplayed = GAMES.filter((g) => !playedIds.includes(g.id));
  const recent = [...playedIds]
    .map((id) => ({
      game: GAMES.find((g) => g.id === id),
      stats: stats.games[id],
    }))
    .filter((r) => r.game)
    .sort((a, b) => b.stats.lastPlayedAt - a.stats.lastPlayedAt)
    .slice(0, 3);
  const recommended = unplayed[0] ?? GAMES[0];
  const progressPct = Math.round(level.progress * 100);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - level.progress);
  const currentTier = tierForLevel(level.level);
  const nextTier =
    level.level < CITY_TIERS.length ? tierForLevel(level.level + 1) : null;
  const cityGames: CityGameState[] = GAMES.map((g) => ({
    meta: g,
    plays: stats.games[g.id]?.plays ?? 0,
    bestScore: stats.games[g.id]?.bestScore ?? 0,
  }));

  return (
    <div className="flex flex-col gap-10 animate-slide-up">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-zinc-400">
                {d.welcome}
              </p>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                {username}
              </h1>
              <p className="text-zinc-300 mt-1 text-sm">
                <span className="text-xl">{currentTier.emoji}</span>{" "}
                <strong className="text-[var(--accent)]">{currentTier.full}</strong>{" "}
                <span className="opacity-70">· {d.level} {level.level}</span>
              </p>
            </div>
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#ring)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                />
                <defs>
                  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl">{currentTier.emoji}</span>
                <span className="text-2xl font-black leading-none">{level.level}</span>
                <span className="text-[10px] text-zinc-400">{progressPct}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label={d.totalWatts} value={`${xp.toLocaleString(locale)} W`} accent />
            <Stat
              label={d.rank}
              value={rank !== null ? `#${rank}` : "—"}
            />
            <Stat label={d.plays} value={String(stats.totalPlays)} />
            <Stat
              label={d.toNext}
              value={level.xpToNext > 0 ? `${level.xpToNext} W` : d.max}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${recommended.id}`}
              className="btn btn-primary"
            >
              {playedIds.length === 0 ? d.ctaFirstGame : d.ctaTryNew}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              {d.ctaAllGames}
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost">
              {d.ctaLeague}
            </Link>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-widest font-black text-[var(--accent)]">
            {d.topSilesia}
          </h2>
          {top.length === 0 ? (
            <p className="text-zinc-400 text-sm">{d.topEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {top.map((e) => (
                <li
                  key={e.username}
                  className={`flex items-center justify-between py-2 border-b border-[var(--border)]/60 last:border-b-0 ${
                    e.username === username ? "text-[var(--accent)]" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold opacity-70">
                      #{e.rank}
                    </span>
                    <span>{e.username}</span>
                  </span>
                  <span className="font-mono font-semibold">{e.xp.toLocaleString(locale)} W</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-xl sm:text-2xl">{d.yourBuildingTitle}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
          <PlayerBuilding level={level.level} progress={level.progress} />
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentTier.emoji}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--accent)]">
                  {d.level} {level.level}
                </p>
                <p className="text-xl font-black uppercase tracking-tight">
                  {currentTier.full}
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {currentTier.story}
            </p>
            {nextTier && (
              <div className="flex flex-col gap-1 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--surface-2)] p-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  {d.nextLabel}
                </p>
                <p className="font-semibold">
                  {nextTier.emoji} {nextTier.full}
                </p>
                <p className="text-xs text-zinc-400">
                  {d.unlocksLabel}{" "}
                  <strong className="text-zinc-200">{nextTier.unlocks}</strong>
                </p>
                {level.xpToNext > 0 && (
                  <p className="text-xs">
                    {d.stillLabel}{" "}
                    <strong className="text-[var(--accent)]">
                      {level.xpToNext} W
                    </strong>
                    .
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-9 gap-1">
              {CITY_TIERS.map((t) => {
                const unlocked = level.level >= t.level;
                const current = level.level === t.level;
                return (
                  <div
                    key={t.level}
                    title={`Tier ${t.level}: ${t.full}`}
                    className={`aspect-square rounded-md border-2 border-[var(--ink)] flex items-center justify-center text-xs ${
                      unlocked ? `${t.accent}` : "bg-[var(--surface-2)] opacity-40"
                    } ${current ? "ring-2 ring-[var(--neo-pink)]" : ""}`}
                  >
                    {unlocked ? t.emoji : "🔒"}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">
              {d.pathCaption}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">{d.continueTitle}</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {d.ctaAllGames} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-zinc-400">
            {d.continueEmpty.split("{game}")[0]}
            <Link
              href={`/games/${recommended.id}`}
              className="text-[var(--accent)] underline"
            >
              {localizedTitle(recommended, dict)}
            </Link>
            {d.continueEmpty.split("{game}")[1] ?? ""}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recent.map(({ game, stats: gs }) =>
              game ? (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="relative card game-tile stagger-item p-5 flex flex-col gap-3"
                >
                  <div
                    className={`h-16 rounded-xl bg-gradient-to-br ${game.accent} flex items-center justify-center text-3xl`}
                  >
                    {game.emoji}
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{localizedTitle(game, dict)}</h3>
                    <span className="text-xs text-zinc-400">
                      {timeAgo(gs.lastPlayedAt, d)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{d.record}</span>
                    <span className="font-mono text-[var(--accent)] font-semibold">
                      {gs.bestScore}/{game.xpCap}
                    </span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="brutal-heading text-2xl">{d.cityNightTitle}</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {d.cityNightOpen} →
          </Link>
        </div>
        <CityScene games={cityGames} loggedIn compact aiGames={aiGames} />
      </section>

      <section className="flex flex-col gap-3 card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="brutal-heading text-lg">{d.dataRightsTitle}</h2>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}
          >
            GDPR
          </span>
        </div>
        <p className="text-sm text-zinc-400">{d.dataRightsBody}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/ochrana-sukromia" className="btn btn-ghost text-xs">
            {d.privacyReceipt}
          </Link>
          <DeleteAccountButton t={d} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-[3px] border-[var(--ink)] px-3 py-2 shadow-[3px_3px_0_0_var(--ink)] ${
        accent
          ? "bg-[var(--accent)] text-[#0a0a0f]"
          : "bg-[var(--surface-2)]"
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-widest font-bold ${
          accent ? "opacity-70" : "text-zinc-400"
        }`}
      >
        {label}
      </div>
      <div className="text-xl font-black font-mono">{value}</div>
    </div>
  );
}
