import Link from "next/link";
import { globalLeaderboard } from "@/lib/leaderboard";
import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { userStats as leaderboardStats } from "@/lib/leaderboard";
import { levelFromXP, titleForLevel } from "@/lib/level";
import { Dashboard } from "@/components/dashboard";
import { CityPreview } from "@/components/city-preview";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session) {
    const [board, stats, top] = await Promise.all([
      leaderboardStats(session.username),
      getUserStats(session.username),
      globalLeaderboard(5),
    ]);
    const level = levelFromXP(board.globalXP);
    return (
      <Dashboard
        username={session.username}
        xp={board.globalXP}
        rank={board.globalRank}
        level={level}
        title={titleForLevel(level.level)}
        stats={stats}
        top={top}
      />
    );
  }

  const entries = await globalLeaderboard(5);
  return (
    <div className="flex flex-col gap-12 animate-slide-up">
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>
              PKO XP · Gaming
            </span>
            <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>
              ETHSilesia 2026
            </span>
            <span className="brutal-tag" style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}>
              Katowice
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[0.95] uppercase tracking-tight">
            Vygeneruj{" "}
            <span className="inline-block bg-[var(--accent)] text-[#0a0a0f] px-3 py-1 border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] my-1">
              Watty
            </span>
            . Postav{" "}
            <span className="inline-block bg-[var(--neo-cyan)] text-[#0a0a0f] px-3 py-1 border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] my-1">
              Katowice
            </span>
            .
          </h1>
          <p className="text-lg text-zinc-300 max-w-xl">
            Arkáda minihier o tom, čo Gen Z naozaj potrebuje vedieť: BLIK, ETF,
            RRSO, energetika, inflácia, kurzy. Každý správny tap vygeneruje{" "}
            <strong className="text-[var(--accent)]">Watty</strong>, ktoré
            posúvajú tvoje sliezske mesto z baníckej osady až k{" "}
            <strong className="text-[var(--neo-cyan)]">Europejska Stolica 2.0</strong>.
            9 tierov. 9 hier. 1 liga.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Vytvoriť účet
            </Link>
            <Link href="/games" className="btn btn-ghost">
              Prehľad hier
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost">
              Rebríček
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {GAMES.slice(0, 4).map((g) => (
              <li key={g.id} className="card p-3 flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.accent} flex items-center justify-center`}
                >
                  {g.emoji}
                </span>
                <span className="font-medium">{g.title}</span>
              </li>
            ))}
          </ul>
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
                    {e.xp.toLocaleString("sk-SK")} W
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">Panorama Katowíc</h2>
        <p className="text-zinc-400 max-w-xl -mt-2">
          9 budov = 9 minihier. Poklikaj na ktorúkoľvek a rozsvieť ju. Tu je
          nahliadnutie — po registrácii dostaneš vlastnú verziu mesta.
        </p>
        <CityPreview />
      </section>

    </div>
  );
}
