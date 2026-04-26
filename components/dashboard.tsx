import Link from "next/link";
import { GAMES, localizedTitle } from "@/lib/games";
import type { UserStats } from "@/lib/user-stats";
import type { LevelInfo } from "@/lib/level";
// V3.1: CITY_TIERS/tierForLevel no longer imported — replaced by
// CityLevelCard + CitySkylineHero which derive from buildings, not XP.
import type { LeaderboardEntry } from "@/lib/redis";
import { CityScene, type CityGameState, type CityAiGame } from "@/components/city-scene";
import { CitySkylineHero } from "@/components/city-skyline-hero";
import { LoanSchedule } from "@/components/loan-schedule";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { CityLevelCard } from "@/components/city-level-card";
import { MedalRing } from "@/components/medal-ring";
import type { PlayerState } from "@/lib/player";
import type { Dict, Lang } from "@/lib/i18n";
import { avatarFor } from "@/lib/avatars";

const FRESH_WELCOME: Record<Lang, {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  tour: string;
  step1: string;
  step2: string;
  step3: string;
}> = {
  pl: {
    eyebrow: "Pierwszy krok",
    title: "Witaj w Watt City",
    body: "Zacznij od jednej minigry — to potrwa minutę. Później miasto budujesz samo.",
    cta: "Zagraj pierwszą minigrę",
    tour: "Zobacz krótki tutorial",
    step1: "Zarobisz pierwsze W$",
    step2: "Postawisz pierwszy budynek",
    step3: "Odblokujesz kolejną grę",
  },
  uk: {
    eyebrow: "Перший крок",
    title: "Вітаємо у Watt City",
    body: "Почни з однієї міні-гри — це займе хвилину. Місто далі будуєш у своєму темпі.",
    cta: "Зіграти першу міні-гру",
    tour: "Короткий тур",
    step1: "Заробиш перші W$",
    step2: "Поставиш першу будівлю",
    step3: "Відкриєш наступну гру",
  },
  cs: {
    eyebrow: "První krok",
    title: "Vítej ve Watt City",
    body: "Začni jednou minihrou — minutu času. Město pak roste s tebou.",
    cta: "Zahrát první minihru",
    tour: "Krátký průvodce",
    step1: "Získáš první W$",
    step2: "Postavíš první budovu",
    step3: "Odemkneš další hru",
  },
  en: {
    eyebrow: "First step",
    title: "Welcome to Watt City",
    body: "Start with one mini-game — it takes a minute. The city grows from there.",
    cta: "Play your first mini-game",
    tour: "Quick tour",
    step1: "Earn your first W$",
    step2: "Place your first building",
    step3: "Unlock your next game",
  },
};

/* I-04 (F-NEW-15) — copy for the displayName nudge. Shown when the
 * user is still using the auto-generated `wt_xxxxxxxxxx` username
 * and hasn't set a displayName yet — a single discreet banner above
 * the dashboard surfaces nudging them to /profile. */
const NAME_NUDGE: Record<Lang, { title: string; body: string; cta: string; ariaLabel: string }> = {
  pl: {
    title: "Daj sobie imię",
    body: "Twoja domyślna nazwa to wt_xxx. Wybierz imię, które zobaczą klasa i znajomi.",
    cta: "Zmień w profilu",
    ariaLabel: "Personalizuj nazwę",
  },
  uk: {
    title: "Обери собі ім'я",
    body: "Твоя стандартна назва — wt_xxx. Вибери ім'я, яке побачать клас та друзі.",
    cta: "Змінити у профілі",
    ariaLabel: "Персоналізувати ім'я",
  },
  cs: {
    title: "Dej si jméno",
    body: "Tvé výchozí jméno je wt_xxx. Vyber jméno, které uvidí třída a přátelé.",
    cta: "Změnit v profilu",
    ariaLabel: "Personalizovat jméno",
  },
  en: {
    title: "Pick a name",
    body: "Your default handle is wt_xxx. Choose a name your class and friends will recognise.",
    cta: "Edit in profile",
    ariaLabel: "Personalise your name",
  },
};

type Props = {
  username: string;
  /** I-07 (F-NEW-18) — caller-supplied avatar id (`av-0..av-9`). When
   *  omitted (or `undefined`), `avatarFor()` returns the av-0 fallback.
   *  Used by the dashboard hero next to the username. Leaderboard +
   *  friends rows still render initials — the API does not yet
   *  attach avatar to those entries; flagged as
   *  F-NEW-18-leaderboard follow-up. */
  avatar?: string;
  xp: number;
  rank: number | null;
  level: LevelInfo;
  title: string;
  stats: UserStats;
  top: LeaderboardEntry[];
  dict: Dict;
  lang: Lang;
  aiGames?: CityAiGame[];
  /** V2 R3.2 — player state snapshot for the city-level card. Optional
   *  so older call sites keep rendering without a schema break while the
   *  dashboard page threads it through. */
  player?: Pick<PlayerState, "buildings" | "wattDeficitSince" | "loans"> | null;
};

function timeAgo(ts: number, d: Dict["dashboard"]): string {
  if (!ts) return d.timeNever;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return d.timeJustNow;
  if (mins < 60) return d.timeMinutesAgo.replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return d.timeHoursAgo.replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  return d.timeDaysAgo.replace("{n}", String(days));
}

export function Dashboard({
  username,
  avatar,
  xp,
  rank,
  level,
  stats,
  top,
  dict,
  lang,
  aiGames,
  player,
}: Props) {
  const av = avatarFor(avatar);
  const d = dict.dashboard;
  const locale = lang === "pl" ? "pl-PL" : lang === "cs" ? "cs-CZ" : lang === "uk" ? "uk-UA" : "en-US";
  const playedIds = Object.keys(stats.games);
  const unplayed = GAMES.filter((g) => !playedIds.includes(g.id));
  const recent = [...playedIds]
    .map((id) => ({
      game: GAMES.find((g) => g.id === id),
      stats: stats.games[id],
    }))
    .filter((r) => r.game)
    .sort((a, b) => b.stats.lastPlayedAt - a.stats.lastPlayedAt)
    .slice(0, 3);
  const recommended = unplayed[0] ?? GAMES[0];
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - level.progress);
  const cityGames: CityGameState[] = GAMES.map((g) => ({
    meta: g,
    plays: stats.games[g.id]?.plays ?? 0,
    bestScore: stats.games[g.id]?.bestScore ?? 0,
  }));

  const isFresh = stats.totalPlays === 0;
  const fresh = FRESH_WELCOME[lang];
  // I-04 — only show the nudge when the visible username still
  // matches the auto-generated `wt_xxxxxxxxxx` pattern. We can't
  // read profile.displayName here without threading another prop
  // through every Dashboard caller; the username pattern is a
  // reliable proxy for "user hasn't customised identity yet".
  const isDefaultName = /^wt_[a-z0-9]{6,}$/i.test(username);
  const nudge = NAME_NUDGE[lang];

  return (
    <div className="flex flex-col gap-10 animate-slide-up">
      {isDefaultName && (
        <aside
          className="card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4"
          aria-label={nudge.ariaLabel}
        >
          <span aria-hidden className="text-2xl shrink-0">✨</span>
          <div className="flex-1 flex flex-col gap-0.5">
            <p className="t-h5 text-[var(--accent)]">{nudge.title}</p>
            <p className="t-body-sm text-[var(--ink-muted)]">{nudge.body}</p>
          </div>
          <Link href="/profile" className="btn btn-secondary btn-sm shrink-0">
            {nudge.cta}
          </Link>
        </aside>
      )}
      {isFresh && (
        <section
          className="card card--elevated p-6 sm:p-8 flex flex-col gap-5"
          aria-label={fresh.title}
        >
          <div className="flex flex-col gap-1.5">
            <span className="t-overline text-[var(--accent)]">
              {fresh.eyebrow}
            </span>
            <h1 className="t-h2 text-[var(--accent)]">
              {fresh.title}
            </h1>
            <p className="t-body-lg text-[var(--foreground)] max-w-2xl">
              {fresh.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${recommended.id}`}
              className="btn btn-sales"
            >
              {fresh.cta}
            </Link>
            <Link href="/o-platforme" className="btn btn-ghost">
              {fresh.tour}
            </Link>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--line)]">
            {[fresh.step1, fresh.step2, fresh.step3].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[var(--foreground)]"
              >
                <span
                  aria-hidden
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-[var(--accent)] font-semibold text-xs"
                >
                  {i + 1}
                </span>
                <span className="leading-snug pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {player && <CityLevelCard player={player} lang={lang} />}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* I-07 — 48×48 avatar tile. `avatarFor()` returns the
                  picked emoji (or av-0 fallback) so the hero matches
                  the avatar shown on /profile. Decorative, screen
                  readers fall back to the headline username. */}
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-2xl"
                style={{ color: av.hue }}
              >
                {av.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-[var(--ink-muted)]">
                  {d.welcome}
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight truncate">
                  {username}
                </h1>
                {/* V3.1: city identity lives in CityLevelCard above the hero;
                    hero now surfaces XP progression only as a secondary ring. */}
              </div>
            </div>
            {/* F-04 — XP-tier ring uses --sales (orange) + MedalRing
                icon + "Tvůj tier" label so it visually + textually
                separates from the city-level ring (navy +
                BuildingStackBadge + "Stupeň města") in CityLevelCard
                directly above. The two metrics are different:
                tier = XP earned by playing, city level = buildings
                you placed. Pre-F-04 both rings shared --accent and
                neither was labelled — players reported confusion. */}
            <div className="relative" title={d.yourTierTooltip}>
              <svg width="96" height="96" viewBox="0 0 120 120" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--sales)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--sales)]">
                <MedalRing size={20} />
                <span className="text-xl font-semibold leading-none mt-0.5">{level.level}</span>
                <span className="text-[10px] text-[var(--ink-muted)] mt-0.5">{d.yourTier}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label={d.totalWatts} value={`${xp.toLocaleString(locale)} W`} accent />
            <Stat
              label={d.rank}
              value={rank !== null ? `#${rank}` : "—"}
            />
            <Stat label={d.plays} value={String(stats.totalPlays)} />
            <Stat
              label={d.toNext}
              value={level.xpToNext > 0 ? `${level.xpToNext} W` : d.max}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${recommended.id}`}
              className="btn btn-primary"
            >
              {playedIds.length === 0 ? d.ctaFirstGame : d.ctaTryNew}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              {d.ctaAllGames}
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost">
              {d.ctaLeague}
            </Link>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <h2 className="t-overline text-[var(--accent)]">
            {d.topSilesia}
          </h2>
          {top.length === 0 ? (
            <p className="text-[var(--ink-muted)] text-sm">{d.topEmpty}</p>
          ) : (
            <ol className="flex flex-col">
              {top.map((e) => {
                const isMe = e.username === username;
                const medal =
                  e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : null;
                const initials = e.username.slice(0, 2).toUpperCase();
                return (
                  <li
                    key={e.username}
                    className={`flex items-center justify-between gap-3 py-2.5 border-b border-[var(--line)] last:border-b-0 ${
                      // Me-row tint + 1 px accent left rule. The
                      // 3 px stripe was a brutalism leftover (max
                      // 1 px borders per `01-BRAND-MANUAL.md` §7),
                      // so the highlight comes from the navy 4%
                      // background + the accent rule + bold font.
                      isMe ? "bg-[color-mix(in_oklab,var(--accent)_4%,transparent)] -mx-3 px-3 rounded-md border-l border-l-[var(--accent)]" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {medal ? (
                        <span aria-hidden className="w-7 text-center text-lg">
                          {medal}
                        </span>
                      ) : (
                        <span className="w-7 text-center text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
                          #{e.rank}
                        </span>
                      )}
                      <span
                        aria-hidden
                        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-[var(--accent-ink)] bg-[var(--accent)] shrink-0"
                      >
                        {initials}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          isMe
                            ? "font-semibold text-[var(--accent)]"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {e.username}
                      </span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-sm text-[var(--foreground)] shrink-0">
                      {e.xp.toLocaleString(locale)} W
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {/* V3.1 — City skyline replaces the PlayerBuilding tree + tier gallery.
          Players see their actual 20-slot city, not a single growing avatar. */}
      {player && (
        <section className="flex flex-col gap-4">
          <h2 className="section-heading text-xl sm:text-2xl">{d.yourBuildingTitle}</h2>
          <CitySkylineHero buildings={player.buildings} lang={lang} />
        </section>
      )}

      {/* V3.5 — loan schedule widget renders only when there's ≥1 active loan. */}
      {player && player.loans.length > 0 && (
        <LoanSchedule loans={player.loans} lang={lang} />
      )}

      {/* Hide the "continue" section entirely for fresh users — the
          welcome card already owns the first-step CTA, so an empty
          repeat would just dilute focus and feel systemic. */}
      {!isFresh && (
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">{d.continueTitle}</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {d.ctaAllGames} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-[var(--ink-muted)]">
            {d.continueEmpty.split("{game}")[0]}
            <Link
              href={`/games/${recommended.id}`}
              className="text-[var(--accent)] underline"
            >
              {localizedTitle(recommended, dict)}
            </Link>
            {d.continueEmpty.split("{game}")[1] ?? ""}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recent.map(({ game, stats: gs }) =>
              game ? (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="relative card game-tile stagger-item p-5 flex flex-col gap-3"
                >
                  <div
                    className={`h-16 rounded-xl bg-[var(--accent)] ${game.accent} flex items-center justify-center text-3xl`}
                  >
                    {game.emoji}
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{localizedTitle(game, dict)}</h3>
                    <span className="text-xs text-[var(--ink-muted)]">
                      {timeAgo(gs.lastPlayedAt, d)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ink-muted)]">{d.record}</span>
                    <span className="font-mono text-[var(--accent)] font-semibold">
                      {gs.bestScore}/{game.xpCap}
                    </span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        )}
      </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="section-heading text-2xl">{d.cityNightTitle}</h2>
          <Link
            href="/games"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {d.cityNightOpen} →
          </Link>
        </div>
        <CityScene
          games={cityGames}
          loggedIn
          compact
          backdrop="sunset"
          aiGames={aiGames}
        />
      </section>

      <section className="flex flex-col gap-3 card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-heading text-lg">{d.dataRightsTitle}</h2>
          <span
            className="chip"
            style={{ background: "var(--success)", color: "var(--accent-ink)" }}
          >
            GDPR
          </span>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">{d.dataRightsBody}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/ochrana-sukromia" className="btn btn-ghost text-xs">
            {d.privacyReceipt}
          </Link>
          <DeleteAccountButton t={d} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  /** When true, visually emphasised as the "primary" stat — left navy 1 px
   *  rule + navy value text on a light surface. Previous full-navy fill
   *  read as a pressed/selected state which confused users (UX feedback
   *  2026-04-25). The 4 px rule was a brutalism leftover; brand manual
   *  caps borders at 1 px and the navy value text already carries the
   *  accent. */
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 ${
        accent ? "border-l border-l-[var(--accent)]" : ""
      }`}
    >
      <div className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-xl font-semibold font-mono tabular-nums ${
          accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
