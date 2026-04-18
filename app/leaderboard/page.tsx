import Link from "next/link";
import { gameLeaderboard, globalLeaderboard } from "@/lib/leaderboard";
import { GAMES, getGame } from "@/lib/games";
import { LeaderboardEntry } from "@/lib/redis";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ game?: string }>;
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const gameId = sp.game;
  const game = gameId ? getGame(gameId) : undefined;

  const entries: LeaderboardEntry[] = game
    ? await gameLeaderboard(game.id, 50)
    : await globalLeaderboard(50);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Rebríček</h1>
        <p className="text-zinc-400">
          {game
            ? `Najlepší hráči v hre ${game.title}.`
            : "Najlepší hráči naprieč všetkými hrami."}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/leaderboard"
          className={`chip ${!game ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
        >
          Globálne
        </Link>
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/leaderboard?game=${g.id}`}
            className={`chip ${game?.id === g.id ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
          >
            {g.title}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {entries.length === 0 ? (
          <p className="p-6 text-zinc-400">
            Ešte nikto neskóroval{game ? ` v hre ${game.title}` : ""}. Buď prvý!
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--surface-2)]/60 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 w-16">Pozícia</th>
                <th className="text-left px-4 py-3">Hráč</th>
                <th className="text-right px-4 py-3">XP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.username}
                  className="border-t border-[var(--border)]/60"
                >
                  <td className="px-4 py-3 font-bold opacity-80">#{e.rank}</td>
                  <td className="px-4 py-3">{e.username}</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--accent)]">
                    {e.xp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
