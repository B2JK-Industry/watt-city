import Link from "next/link";
import { globalLeaderboard } from "@/lib/leaderboard";
import { topCities } from "@/lib/city-value";
import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { userStats as leaderboardStats } from "@/lib/leaderboard";
import { levelFromXP } from "@/lib/level";
import { cityLevelFromState } from "@/lib/city-level";
import { Dashboard } from "@/components/dashboard";
import { CityScene } from "@/components/city-scene";
import { getPlayerState } from "@/lib/player";
import { listActiveAiGamesWithLazyRotation as listActiveAiGames } from "@/lib/ai-pipeline/lazy-rotation";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { ComingSoonBanner } from "@/components/coming-soon-banner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  const dict = dictFor(lang);

  if (session) {
    const [board, stats, top, aiGames, playerState] = await Promise.all([
      leaderboardStats(session.username),
      getUserStats(session.username),
      globalLeaderboard(5),
      listActiveAiGames(),
      getPlayerState(session.username),
    ]);
    const level = levelFromXP(board.globalXP);
    // Newest AI game first — city renders each as its own clickable building.
    const cityAiGames = [...aiGames].reverse().map((g) => ({
      id: g.id,
      title: g.title,
      validUntil: g.validUntil,
      glyph: g.buildingGlyph,
      cap: xpCapForAnyLang(g.spec),
      bestScore: stats.games[g.id]?.bestScore ?? 0,
      rotationSlot: g.rotationSlot,
    }));
    return (
      <Dashboard
        username={session.username}
        xp={board.globalXP}
        rank={board.globalRank}
        level={level}
        title={cityLevelFromState(playerState).badgeLabel}
        stats={stats}
        top={top}
        dict={dict}
        lang={lang}
        aiGames={cityAiGames}
        player={playerState}
      />
    );
  }

  // V2 R3.1.2 — anonymous landing shows the top 3 CITY-VALUE ranks
  // (BLOCKER-3 parallel ZSET). If the V2 leaderboard is empty during the
  // rollout we fall back to the V1 XP ranking so early visitors still see
  // social proof.
  const [cities, entries, aiGames] = await Promise.all([
    topCities(3),
    globalLeaderboard(5),
    listActiveAiGames(),
  ]);
  // Drop entries from V1 leaderboard that have a V2 city-value entry so
  // the anonymous landing never double-counts a user. `cities` ordering
  // is authoritative when non-empty.
  const cityUsernames = new Set(cities.map((c) => c.username));
  const v1Fallback = entries.filter((e) => !cityUsernames.has(e.username));
  const showCities = cities.length > 0;
  // Anonymous landing — no personal best. Still surface every live AI
  // building so visitors can see what's on offer before signing up.
  const cityAiGames = [...aiGames].reverse().map((g) => ({
    id: g.id,
    title: g.title,
    validUntil: g.validUntil,
    glyph: g.buildingGlyph,
    cap: xpCapForAnyLang(g.spec),
    bestScore: 0,
    rotationSlot: g.rotationSlot,
  }));
  const t = dict.hero;
  const bodyParts = t.body
    .replace("{watts}", "§WATTS§")
    .replace("{single}", "§SINGLE§")
    .replace("{varso}", "§VARSO§")
    .split(/(§WATTS§|§SINGLE§|§VARSO§)/g);
  return (
    <div className="flex flex-col gap-12 animate-slide-up">
      <ComingSoonBanner lang={lang} />
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>
              {t.tagTrack}
            </span>
            <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>
              {t.tagEvent}
            </span>
            <span className="brutal-tag" style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}>
              {t.tagPlace}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[0.95] uppercase tracking-tight">
            {t.titleGenerate}{" "}
            <span className="inline-block bg-[var(--accent)] text-[#0a0a0f] px-3 py-1 border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] my-1">
              {t.titleWatts}
            </span>
            . {t.titleBuild}{" "}
            <span className="inline-block bg-[var(--neo-cyan)] text-[#0a0a0f] px-3 py-1 border-[3px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--ink)] my-1">
              {t.titleHouse}
            </span>{" "}
            {t.titleIn}
          </h1>
          <p className="text-lg text-zinc-300 max-w-xl">
            {bodyParts.map((part, i) => {
              if (part === "§WATTS§")
                return (
                  <strong key={i} className="text-[var(--accent)]">
                    {t.bodyWatts}
                  </strong>
                );
              if (part === "§SINGLE§")
                return <strong key={i}>{t.bodySingle}</strong>;
              if (part === "§VARSO§")
                return (
                  <strong key={i} className="text-[var(--neo-cyan)]">
                    {t.bodyVarso}
                  </strong>
                );
              return <span key={i}>{part}</span>;
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              {t.ctaRegister}
            </Link>
            <Link href="/o-platforme" className="btn btn-cyan">
              {t.ctaAbout}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              {t.ctaGames}
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
            {showCities
              ? { pl: "Trzy największe miasta", uk: "Три найбільші міста", cs: "Tři největší města", en: "Top 3 cities" }[lang]
              : t.topTitle}
          </h2>
          {showCities ? (
            <ol className="flex flex-col gap-2">
              {cities.map((c, i) => (
                <li
                  key={c.username}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)]/60 last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold opacity-70">
                      #{i + 1}
                    </span>
                    <span>{c.username}</span>
                  </span>
                  <span className="font-mono font-semibold text-[var(--neo-cyan)]">
                    {Math.floor(c.xp).toLocaleString("pl-PL")} W$
                  </span>
                </li>
              ))}
            </ol>
          ) : v1Fallback.length === 0 ? (
            <p className="text-zinc-400 text-sm">{t.topEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {v1Fallback.slice(0, 3).map((e) => (
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
                    {e.xp.toLocaleString("pl-PL")} W
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.scenesTitle}</h2>
        <p className="text-zinc-400 max-w-xl -mt-2">{t.scenesBody}</p>
        <CityScene interactive={false} compact aiGames={cityAiGames} />
      </section>
    </div>
  );
}
