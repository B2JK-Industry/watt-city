import Link from "next/link";
import { globalLeaderboard } from "@/lib/leaderboard";
import { GAMES } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { userStats as leaderboardStats } from "@/lib/leaderboard";
import { levelFromXP, titleForLevel } from "@/lib/level";
import { Dashboard } from "@/components/dashboard";
import { CityScene } from "@/components/city-scene";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  const dict = dictFor(lang);

  if (session) {
    const [board, stats, top, aiGames] = await Promise.all([
      leaderboardStats(session.username),
      getUserStats(session.username),
      globalLeaderboard(5),
      listActiveAiGames(),
    ]);
    const level = levelFromXP(board.globalXP);
    const liveAi = aiGames[aiGames.length - 1];
    const cityAi = liveAi
      ? {
          id: liveAi.id,
          title: liveAi.title,
          validUntil: liveAi.validUntil,
          glyph: liveAi.buildingGlyph,
          cap: xpCapForAnyLang(liveAi.spec),
          bestScore: stats.games[liveAi.id]?.bestScore ?? 0,
        }
      : undefined;
    return (
      <Dashboard
        username={session.username}
        xp={board.globalXP}
        rank={board.globalRank}
        level={level}
        title={titleForLevel(level.level)}
        stats={stats}
        top={top}
        dict={dict}
        lang={lang}
        aiGame={cityAi}
      />
    );
  }

  const [entries, aiGames] = await Promise.all([
    globalLeaderboard(5),
    listActiveAiGames(),
  ]);
  const liveAi = aiGames[aiGames.length - 1];
  // Anonymous landing — no user session, so no personal best. Pass cap so
  // the meter chrome renders (empty fill), consistent with evergreen previews.
  const cityAi = liveAi
    ? {
        id: liveAi.id,
        title: liveAi.title,
        validUntil: liveAi.validUntil,
        glyph: liveAi.buildingGlyph,
        cap: xpCapForAnyLang(liveAi.spec),
        bestScore: 0,
      }
    : undefined;
  const t = dict.hero;
  const bodyParts = t.body
    .replace("{watts}", "§WATTS§")
    .replace("{single}", "§SINGLE§")
    .replace("{varso}", "§VARSO§")
    .split(/(§WATTS§|§SINGLE§|§VARSO§)/g);
  return (
    <div className="flex flex-col gap-12 animate-slide-up">
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
            {t.topTitle}
          </h2>
          {entries.length === 0 ? (
            <p className="text-zinc-400 text-sm">{t.topEmpty}</p>
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
        <CityScene interactive={false} compact aiGame={cityAi} />
      </section>
    </div>
  );
}
