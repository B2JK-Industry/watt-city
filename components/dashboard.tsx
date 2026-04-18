import Link from "next/link";
import { GAMES } from "@/lib/games";
import type { UserStats } from "@/lib/user-stats";
import type { LevelInfo } from "@/lib/level";
import type { LeaderboardEntry } from "@/lib/redis";

type Props = {
  username: string;
  xp: number;
  rank: number | null;
  level: LevelInfo;
  title: string;
  stats: UserStats;
  top: LeaderboardEntry[];
};

function timeAgo(ts: number): string {
  if (!ts) return "nikdy";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "práve teraz";
  if (mins < 60) return `pred ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `pred ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `pred ${days} d`;
}

export function Dashboard({
  username,
  xp,
  rank,
  level,
  title,
  stats,
  top,
}: Props) {
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

  return (
    <div className="flex flex-col gap-10 animate-slide-up">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-zinc-400">
                Vitaj späť
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold">{username}</h1>
              <p className="text-zinc-400 mt-1">
                {title} · Level {level.level}
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Level
                </span>
                <span className="text-3xl font-bold">{level.level}</span>
                <span className="text-[11px] text-zinc-400">{progressPct}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Celkové XP" value={String(xp)} accent />
            <Stat
              label="Pozícia"
              value={rank !== null ? `#${rank}` : "—"}
            />
            <Stat label="Odohraných kôl" value={String(stats.totalPlays)} />
            <Stat
              label="Do ďalšieho"
              value={level.xpToNext > 0 ? `${level.xpToNext} XP` : "max"}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${recommended.id}`}
              className="btn btn-primary"
            >
              {playedIds.length === 0 ? "Zahrať prvú hru" : "Vyskúšať novú hru"}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              Všetky hry
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost">
              Rebríček
            </Link>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider text-zinc-400">
            Top 5 globálne
          </h2>
          {top.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              Ešte tu nikto nie je. Začni a si prvý!
            </p>
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
                  <span className="font-mono font-semibold">{e.xp} XP</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Pokračovať v hre</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Všetky hry →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-zinc-400">
            Ešte si nehral. Spusti si{" "}
            <Link
              href={`/games/${recommended.id}`}
              className="text-[var(--accent)] underline"
            >
              {recommended.title}
            </Link>{" "}
            a zbieraj prvé XP.
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
                    <h3 className="font-semibold">{game.title}</h3>
                    <span className="text-xs text-zinc-400">
                      {timeAgo(gs.lastPlayedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Rekord</span>
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

      {unplayed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Ešte si nevyskúšal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unplayed.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="relative card game-tile stagger-item p-5 flex flex-col gap-3"
              >
                {g.isNew && <span className="new-badge">Nové</span>}
                {g.hot && <span className="hot-badge">🔥 Hot</span>}
                <div
                  className={`h-20 rounded-xl bg-gradient-to-br ${g.accent} flex items-center justify-center text-4xl`}
                >
                  {g.emoji}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{g.title}</h3>
                  <span className="chip text-xs">{g.durationLabel}</span>
                </div>
                <p className="text-sm text-zinc-400">{g.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
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
    <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface-2)]/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">
        {label}
      </div>
      <div
        className={`text-lg font-semibold font-mono ${
          accent ? "text-[var(--accent)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
