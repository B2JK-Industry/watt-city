import Link from "next/link";
import { GAMES } from "@/lib/games";
import { gameLeaderboard } from "@/lib/leaderboard";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const session = await getSession();
  const results = await Promise.all(
    GAMES.map(async (g) => ({
      game: g,
      top: await gameLeaderboard(g.id, 3),
    })),
  );

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">Sieň slávy</h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}
          >
            🥇🥈🥉
          </span>
        </div>
        <p className="text-zinc-400 max-w-2xl">
          Najlepší traja v každej minihre. Medaila zostáva v profile aj po tom,
          čo hra zanikne — tak to aspoň bude fungovať pri sezónnych a AI
          výzvach, ktoré prídu v ďalšej vlne.
        </p>
      </header>

      {/* Today's AI challenge placeholder */}
      <section className="card p-6 flex flex-col gap-3 border-[var(--accent)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="brutal-heading text-xl">Dnešná AI výzva</h2>
          <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>
            🤖 Coming soon
          </span>
        </div>
        <p className="text-sm text-zinc-300 max-w-2xl">
          Každý deň ráno vygeneruje Claude novú 24-hodinovú minihru — krátku,
          tematickú, zameranú na aktuálnu udalosť (Tax Freedom Day, Earth
          Hour, pay-day Friday, Katowice festival). Top 3 hráči dostanú{" "}
          <strong className="text-[var(--accent)]">permanentnú medailu</strong>{" "}
          do profilu. Hra zanikne, medaila ostane. Watty sa rátajú ako vždy.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="chip">⏱ štart · ráno 09:00</div>
          <div className="chip">⏳ zánik · o 24 h</div>
          <div className="chip">🥇 medaila · do profilu</div>
          <div className="chip">🤖 vytvorila AI</div>
        </div>
      </section>

      {/* Permanent games — current top 3 */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-xl sm:text-2xl">Medaile podľa hier</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map(({ game, top }) => (
            <div
              key={game.id}
              className="card p-5 flex flex-col gap-3 stagger-item"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 hover:text-[var(--accent)]"
                >
                  <span className="text-3xl">{game.emoji}</span>
                  <div>
                    <p className="font-black uppercase tracking-tight">
                      {game.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-semibold">
                      {game.building.name}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/leaderboard?game=${game.id}`}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  Celá liga →
                </Link>
              </div>
              <ol className="flex flex-col gap-1.5">
                {[0, 1, 2].map((i) => {
                  const entry = top[i];
                  const medal = ["🥇", "🥈", "🥉"][i];
                  const tone = [
                    "bg-[var(--neo-yellow)]",
                    "bg-zinc-300",
                    "bg-[var(--neo-orange)]",
                  ][i];
                  return (
                    <li
                      key={i}
                      className={`flex items-center justify-between rounded-lg border-2 border-[var(--ink)] px-2.5 py-1.5 ${
                        entry
                          ? `${tone} text-[#0a0a0f]`
                          : "bg-[var(--surface-2)] text-zinc-500"
                      } ${
                        entry && entry.username === session?.username
                          ? "ring-2 ring-[var(--neo-pink)]"
                          : ""
                      }`}
                    >
                      <span className="flex items-center gap-2.5 font-semibold truncate">
                        <span className="text-lg">{medal}</span>
                        {entry ? (
                          <span className="truncate">
                            {entry.username}
                            {entry.username === session?.username && (
                              <span className="ml-1 text-[10px] font-black">
                                (TY)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="italic">zatiaľ nikto</span>
                        )}
                      </span>
                      <span className="font-mono font-black text-sm whitespace-nowrap">
                        {entry ? `${entry.xp.toLocaleString("sk-SK")} W` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <aside className="card p-5 text-sm text-zinc-400">
        <p>
          <strong className="text-zinc-200">Prečo zaniknuté hry?</strong> Každý
          deň niečo nové drží na platforme život (á la Wordle, NYT Games, Duolingo
          daily). Permanentné medaile dávajú pocit trvalého statusu (á la Strava
          PR-ky).
        </p>
      </aside>
    </div>
  );
}
