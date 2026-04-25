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
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{t.tagTrack}</span>
            <span className="chip">{t.tagEvent}</span>
            <span className="chip">{t.tagPlace}</span>
          </div>
          <h1 className="t-display text-[var(--accent)]">
            {t.titleGenerate} <span className="text-[var(--foreground)]">{t.titleWatts}</span>
            . {t.titleBuild} <span className="text-[var(--foreground)]">{t.titleHouse}</span>{" "}
            {t.titleIn}
          </h1>
          <p className="t-body-lg text-[var(--ink-muted)] max-w-xl">
            {bodyParts.map((part, i) => {
              if (part === "§WATTS§")
                return (
                  <strong key={i} className="text-[var(--foreground)] font-semibold">
                    {t.bodyWatts}
                  </strong>
                );
              if (part === "§SINGLE§")
                return (
                  <strong key={i} className="text-[var(--foreground)] font-semibold">
                    {t.bodySingle}
                  </strong>
                );
              if (part === "§VARSO§")
                return (
                  <strong key={i} className="text-[var(--accent)] font-semibold">
                    {t.bodyVarso}
                  </strong>
                );
              return <span key={i}>{part}</span>;
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-sales">
              {t.ctaRegister}
            </Link>
            <Link href="/o-platforme" className="btn btn-secondary">
              {t.ctaAbout}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              {t.ctaGames}
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GAMES.slice(0, 4).map((g) => (
              <li
                key={g.id}
                className="card card--interactive p-4 flex flex-col items-start gap-3 min-h-[120px]"
              >
                <span
                  aria-hidden
                  className="w-11 h-11 rounded-md inline-flex items-center justify-center bg-[var(--surface-2)] border border-[var(--line)] text-xl"
                >
                  {g.emoji}
                </span>
                <span className="t-body-sm font-medium text-[var(--foreground)] leading-snug text-balance">
                  {g.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card card--elevated">
          <h2 className="t-overline text-[var(--ink-muted)] mb-3">
            {showCities
              ? { pl: "Trzy największe miasta", uk: "Три найбільші міста", cs: "Tři největší města", en: "Top 3 cities" }[lang]
              : t.topTitle}
          </h2>
          {showCities ? (
            <ol className="flex flex-col">
              {cities.map((c, i) => (
                <li
                  key={c.username}
                  className="flex items-center justify-between py-3 border-b border-[var(--line)] last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center t-body-sm text-[var(--ink-muted)]">
                      #{i + 1}
                    </span>
                    <span className="t-body text-[var(--foreground)]">{c.username}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--accent)]">
                    {Math.floor(c.xp).toLocaleString("pl-PL")} W$
                  </span>
                </li>
              ))}
            </ol>
          ) : v1Fallback.length === 0 ? (
            <p className="t-body-sm text-[var(--ink-muted)]">{t.topEmpty}</p>
          ) : (
            <ol className="flex flex-col">
              {v1Fallback.slice(0, 3).map((e) => (
                <li
                  key={e.username}
                  className="flex items-center justify-between py-3 border-b border-[var(--line)] last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center t-body-sm text-[var(--ink-muted)]">
                      #{e.rank}
                    </span>
                    <span className="t-body text-[var(--foreground)]">{e.username}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--accent)]">
                    {e.xp.toLocaleString("pl-PL")} W
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="section-heading">{t.scenesTitle}</h2>
        <p className="t-body-lg text-[var(--ink-muted)] max-w-xl -mt-2">{t.scenesBody}</p>
        <CityScene interactive={false} compact aiGames={cityAiGames} />
      </section>
    </div>
  );
}
