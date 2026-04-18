import Link from "next/link";
import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP, tierForLevel } from "@/lib/level";
import { CityScene, type CityGameState } from "@/components/city-scene";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function GamesHubPage() {
  const session = await getSession();
  const stats = session ? await getUserStats(session.username) : null;
  const lb = session ? await userStats(session.username) : null;
  const level = lb ? levelFromXP(lb.globalXP) : null;
  const tier = level ? tierForLevel(level.level) : null;
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.games;

  const cityGames: CityGameState[] = GAMES.map((g) => ({
    meta: g,
    plays: stats?.games[g.id]?.plays ?? 0,
    bestScore: stats?.games[g.id]?.bestScore ?? 0,
  }));

  const aiGames = await listActiveAiGames();
  const liveAi = aiGames[aiGames.length - 1];
  const cityAi = liveAi
    ? {
        id: liveAi.id,
        title: liveAi.title,
        validUntil: liveAi.validUntil,
        glyph: liveAi.buildingGlyph,
        cap: xpCapForAnyLang(liveAi.spec),
        bestScore: stats?.games[liveAi.id]?.bestScore ?? 0,
      }
    : undefined;

  const bodyParts = t.gamesHubBody
    .replace("{light}", "§LIGHT§")
    .replace("{duelLink}", "§DUEL§")
    .split(/(§LIGHT§|§DUEL§)/g);

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">
            {t.gamesHubTitle}
          </h1>
          {tier && (
            <span
              className="brutal-tag"
              style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}
            >
              {tier.emoji} {tier.name}
            </span>
          )}
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}
          >
            {t.gamesHubTime}
          </span>
        </div>
        <p className="text-zinc-400 max-w-2xl">
          {bodyParts.map((p, i) => {
            if (p === "§LIGHT§")
              return (
                <strong key={i} className="text-[var(--accent)]">
                  {t.gamesHubBodyLight}
                </strong>
              );
            if (p === "§DUEL§")
              return (
                <Link
                  key={i}
                  href="/duel"
                  className="underline hover:text-[var(--accent)]"
                >
                  {t.gamesHubDuelLink}
                </Link>
              );
            return <span key={i}>{p}</span>;
          })}
        </p>
      </header>
      <CityScene games={cityGames} loggedIn={Boolean(session)} aiGame={cityAi} />
      <aside className="card p-5 flex flex-col gap-3 text-sm text-zinc-300">
        <h2 className="brutal-heading text-lg">{t.buildingsMap}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5">
          {cityGames.map((g) => (
            <li key={g.meta.id}>
              <Link
                href={`/games/${g.meta.id}`}
                className="flex items-center justify-between gap-3 hover:text-[var(--accent)]"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className={`inline-block w-2 h-2 rounded-full border border-[var(--ink)] ${
                      g.plays > 0 ? "bg-[var(--neo-yellow)]" : "bg-zinc-700"
                    }`}
                  />
                  <span className="font-semibold truncate">
                    {g.meta.building.name}
                  </span>
                  <span className="text-zinc-500 truncate">
                    — {g.meta.title}
                  </span>
                </span>
                <span className="chip text-[10px] whitespace-nowrap">
                  {g.meta.durationLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
