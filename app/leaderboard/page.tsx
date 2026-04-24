import Link from "next/link";
import { gameLeaderboard, globalLeaderboard } from "@/lib/leaderboard";
import { GAMES, getGame } from "@/lib/games";
import { LeaderboardEntry } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ game?: string }>;
};

function rankBadge(rank: number): { icon: string; tone: string } | null {
  if (rank === 1) return { icon: "🥇", tone: "text-amber-300" };
  if (rank === 2) return { icon: "🥈", tone: "text-zinc-200" };
  if (rank === 3) return { icon: "🥉", tone: "text-amber-700" };
  return null;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const gameId = sp.game;
  const game = gameId ? getGame(gameId) : undefined;
  const session = await getSession();
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.leaderboard;
  const locale = lang === "pl" ? "pl-PL" : lang === "cs" ? "cs-CZ" : lang === "uk" ? "uk-UA" : "en-US";

  const entries: LeaderboardEntry[] = game
    ? await gameLeaderboard(game.id, 50)
    : await globalLeaderboard(50);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--accent)", color: "#0a0a0f" }}
          >
            {t.tag}
          </span>
        </div>
        <p className="text-zinc-400">
          {game
            ? t.gameBody.replace("{title}", game.title)
            : t.globalBody}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/leaderboard"
          className={`chip ${!game ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
        >
          {t.global}
        </Link>
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/leaderboard?game=${g.id}`}
            className={`chip ${game?.id === g.id ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
          >
            {g.emoji} {g.title}
          </Link>
        ))}
      </div>

      {podium.length === 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
          <PodiumCard
            entry={podium[1]}
            height="h-28"
            badge="🥈"
            bg="bg-zinc-300"
            isMe={podium[1].username === session?.username}
          />
          <PodiumCard
            entry={podium[0]}
            height="h-36"
            badge="🥇"
            bg="bg-[var(--sales)]"
            isMe={podium[0].username === session?.username}
            crown
          />
          <PodiumCard
            entry={podium[2]}
            height="h-24"
            badge="🥉"
            bg="bg-[var(--sales)]"
            isMe={podium[2].username === session?.username}
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card p-10 text-center text-zinc-400">
          {game
            ? t.emptyGame.replace("{title}", game.title)
            : t.empty}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface-2)]/60 text-xs text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 w-16">{t.position}</th>
                <th className="text-left px-4 py-3">{t.player}</th>
                <th className="text-right px-4 py-3">{t.watts}</th>
              </tr>
            </thead>
            <tbody>
              {(podium.length === 3 ? rest : entries).map((e) => {
                const isMe = e.username === session?.username;
                const badge = rankBadge(e.rank);
                return (
                  <tr
                    key={e.username}
                    className={`leaderboard-row ${isMe ? "leaderboard-row-me" : ""}`}
                  >
                    <td className="px-4 py-3 font-bold">
                      <span className="flex items-center gap-1.5">
                        {badge ? (
                          <span className={`text-lg ${badge.tone}`}>
                            {badge.icon}
                          </span>
                        ) : (
                          <span className="opacity-60">#{e.rank}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {e.username}
                        {isMe && (
                          <span className="chip text-[10px] border-[var(--accent)] text-[var(--accent)]">
                            {t.meTag}
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        isMe ? "text-[var(--accent)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {e.xp.toLocaleString(locale)} W
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  height,
  badge,
  bg,
  isMe,
  crown,
}: {
  entry: LeaderboardEntry;
  height: string;
  badge: string;
  bg: string;
  isMe: boolean;
  crown?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-full ${height} ${bg} podium-tile flex items-end justify-center p-3 text-3xl sm:text-4xl ${
          crown ? "animate-[glow-ring_2.4s_ease-in-out_infinite]" : ""
        } ${isMe ? "ring-4 ring-[var(--danger)] ring-offset-4 ring-offset-[var(--background)]" : ""}`}
      >
        <span>{badge}</span>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[160px] tracking-tight">
          {entry.username}
          {isMe && (
            <span className="text-[var(--danger)] ml-1 text-xs">(ty)</span>
          )}
        </div>
        <div className="text-xs font-mono font-semibold text-[var(--ink)]">
          {entry.xp.toLocaleString("pl-PL")} W
        </div>
      </div>
    </div>
  );
}
