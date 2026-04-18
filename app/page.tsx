import Link from "next/link";
import { globalLeaderboard } from "@/lib/leaderboard";
import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [entries, session] = await Promise.all([
    globalLeaderboard(5),
    getSession(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="flex flex-col gap-6">
          <span className="chip w-fit">PKO XP · Gaming · ETHSilesia 2026</span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Ucz się grając.{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              Zbieraj XP.
            </span>{" "}
            Vyhraj rebríček.
          </h1>
          <p className="text-lg text-zinc-300 max-w-xl">
            XP Arena je platforma edukačných minihier. Každá hra ti dá body do
            globálneho rebríčka — financie, matematika, vedomosti. Čím viac
            hráš, tým viac sa učíš.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/games" className="btn btn-primary">Spustiť hru</Link>
            {!session && (
              <Link href="/register" className="btn btn-ghost">
                Vytvoriť účet
              </Link>
            )}
            <Link href="/leaderboard" className="btn btn-ghost">
              Rebríček
            </Link>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">
            Top 5 globálne
          </h2>
          {entries.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              Ešte nikto neskóroval. Buď prvý!
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {entries.map((e) => (
                <li
                  key={e.username}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)]/60 last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold opacity-70">
                      #{e.rank}
                    </span>
                    <span>{e.username}</span>
                  </span>
                  <span className="font-mono font-semibold text-[var(--accent)]">
                    {e.xp} XP
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Hry dostupné teraz</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Všetky hry →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className="card p-5 hover:border-[var(--accent)] transition-colors"
            >
              <div
                className={`h-20 rounded-xl mb-4 bg-gradient-to-br ${g.accent}`}
              />
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{g.title}</h3>
                <span className="chip text-xs">{g.category}</span>
              </div>
              <p className="text-sm text-zinc-400">{g.tagline}</p>
              <p className="text-xs mt-3 opacity-60">
                Max {g.xpCap} XP za kolo
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
