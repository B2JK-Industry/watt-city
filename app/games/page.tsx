import Link from "next/link";
import { GAMES } from "@/lib/games";

export default function GamesHubPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Hry</h1>
        <p className="text-zinc-400">
          Vyber si minihru. Body sa sčítajú do globálneho rebríčka.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className="card p-5 hover:border-[var(--accent)] transition-colors"
          >
            <div
              className={`h-24 rounded-xl mb-4 bg-gradient-to-br ${g.accent}`}
            />
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg">{g.title}</h3>
              <span className="chip text-xs">{g.category}</span>
            </div>
            <p className="text-sm text-zinc-400">{g.tagline}</p>
            <p className="text-xs mt-3 opacity-60">Max {g.xpCap} XP za kolo</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
