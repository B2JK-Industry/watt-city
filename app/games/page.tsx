import Link from "next/link";
import { GAMES, localizedTitle } from "@/lib/games";
import { getSession } from "@/lib/session";
import { getUserStats } from "@/lib/user-stats";
import { getPlayerState } from "@/lib/player";
import { cityLevelFromState } from "@/lib/city-level";
import { CityScene, type CityGameState } from "@/components/city-scene";
import { listActiveAiGamesWithLazyRotation as listActiveAiGames } from "@/lib/ai-pipeline/lazy-rotation";
import { xpCapForAnyLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import {
  ComingSoonBanner,
  ComingSoonGrid,
} from "@/components/coming-soon-banner";

export const dynamic = "force-dynamic";

export default async function GamesHubPage() {
  const session = await getSession();
  const stats = session ? await getUserStats(session.username) : null;
  // V3.1: replace tier label with city-level badge
  const player = session ? await getPlayerState(session.username) : null;
  const cityBadge = player ? cityLevelFromState(player).badgeLabel : null;
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.games;

  const cityGames: CityGameState[] = GAMES.map((g) => ({
    meta: g,
    plays: stats?.games[g.id]?.plays ?? 0,
    bestScore: stats?.games[g.id]?.bestScore ?? 0,
  }));

  const aiGames = await listActiveAiGames();
  // Newest first — slot 0 = most recent AI game.
  const cityAiGames = [...aiGames].reverse().map((g) => ({
    id: g.id,
    title: g.title,
    validUntil: g.validUntil,
    glyph: g.buildingGlyph,
    cap: xpCapForAnyLang(g.spec),
    bestScore: stats?.games[g.id]?.bestScore ?? 0,
    rotationSlot: g.rotationSlot,
  }));

  const bodyParts = t.gamesHubBody
    .replace("{light}", "§LIGHT§")
    .replace("{duelLink}", "§DUEL§")
    .split(/(§LIGHT§|§DUEL§)/g);

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="section-heading text-3xl sm:text-4xl">
            {t.gamesHubTitle}
          </h1>
          {cityBadge && (
            <span
              className="brutal-tag"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {cityBadge}
            </span>
          )}
          <span
            className="brutal-tag"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {t.gamesHubTime}
          </span>
        </div>
        <p className="text-[var(--ink-muted)] max-w-2xl">
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
      <CityScene games={cityGames} loggedIn={Boolean(session)} aiGames={cityAiGames} />
      <aside className="card p-5 flex flex-col gap-3 text-sm text-[var(--ink-muted)]">
        <h2 className="section-heading text-lg">{t.buildingsMap}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5">
          {cityGames.map((g) => (
            <li key={g.meta.id}>
              <Link
                href={`/games/${g.meta.id}`}
                className="flex items-center justify-between gap-3 hover:text-[var(--accent)]"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className={`inline-block w-2 h-2 rounded-full border border-[var(--line)] ${
                      g.plays > 0 ? "bg-[var(--sales)]" : "bg-[var(--ink-subtle)]"
                    }`}
                  />
                  <span className="font-semibold truncate">
                    {g.meta.building.name}
                  </span>
                  <span className="text-[var(--ink-muted)] truncate">
                    — {localizedTitle(g.meta, dict)}
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
      <ComingSoonBanner lang={lang} />
      <ComingSoonGrid lang={lang} />
    </div>
  );
}
