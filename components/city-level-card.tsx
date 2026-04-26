/* V2 refactor R3.2 — City Level hero card.
 *
 * Server component. Renders the V2 progression number (derived from
 * buildings, not XP) alongside the watt-balance badge. Sits at the top
 * of the dashboard so the city is the first thing the player sees.
 *
 * V4-UX-2026-04-25: filled the formerly-empty horizontal middle with a
 * "Twoje budynki" strip — players' actual building inventory rendered
 * as glyph chips with a level/count superscript. Reinforces "your city"
 * theme and gives the user something concrete to read in the otherwise
 * statistical card.
 */

import type { PlayerState } from "@/lib/player";
import type { Lang } from "@/lib/i18n";
import { cityLevelFromBuildings } from "@/lib/city-level";
import { cityWattBalance } from "@/lib/watts";
import { getCatalogEntry } from "@/lib/building-catalog";
import { BuildingStackBadge } from "@/components/building-stack-badge";

type Copy = Record<
  | "heading"
  | "level"
  | "levelTooltip"
  | "progressLabel"
  | "nextUnlockLabel"
  | "nothingNext"
  | "buildingsLabel"
  | "yourBuildings"
  | "noBuildingsYet"
  | "wattsBalanced"
  | "wattsDeficit"
  | "wattsSurplus",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    heading: "Twoje miasto",
    level: "Stopień miasta",
    levelTooltip:
      "Stopień miasta rośnie z każdym budynkiem. Inne niż XP tier (zarobiony za grę).",
    progressLabel: "Postęp",
    nextUnlockLabel: "Następnie odblokujesz",
    nothingNext: "Maksymalny poziom osiągnięty — gratulacje!",
    buildingsLabel: "Budynków",
    yourBuildings: "Twoje budynki",
    noBuildingsYet: "Postaw swój pierwszy budynek w Mieście →",
    wattsBalanced: "Sieć: zbilansowana",
    wattsDeficit: "Sieć: niedobór",
    wattsSurplus: "Sieć: nadwyżka",
  },
  uk: {
    heading: "Твоє місто",
    level: "Рівень міста",
    levelTooltip:
      "Рівень міста зростає з кожною будівлею. Це не XP-тір (заробляється у грі).",
    progressLabel: "Прогрес",
    nextUnlockLabel: "Далі відкриється",
    nothingNext: "Максимальний рівень — вітаємо!",
    buildingsLabel: "Будівель",
    yourBuildings: "Твої будівлі",
    noBuildingsYet: "Збудуй свою першу будівлю в Місті →",
    wattsBalanced: "Мережа: збалансована",
    wattsDeficit: "Мережа: дефіцит",
    wattsSurplus: "Мережа: надлишок",
  },
  cs: {
    heading: "Tvé město",
    level: "Stupeň města",
    levelTooltip:
      "Stupeň města roste s každou budovou. Není to XP tier (zaslouženo za hru).",
    progressLabel: "Postup",
    nextUnlockLabel: "Dále odemkneš",
    nothingNext: "Maximální úroveň — gratulujeme!",
    buildingsLabel: "Budov",
    yourBuildings: "Tvé budovy",
    noBuildingsYet: "Postav svou první budovu v Městě →",
    wattsBalanced: "Síť: vyvážená",
    wattsDeficit: "Síť: nedostatek",
    wattsSurplus: "Síť: přebytek",
  },
  en: {
    heading: "Your city",
    level: "City level",
    levelTooltip:
      "City level grows with each building you place. Different from XP tier (earned by playing).",
    progressLabel: "Progress",
    nextUnlockLabel: "Next unlock",
    nothingNext: "Max level reached — congratulations!",
    buildingsLabel: "Buildings",
    yourBuildings: "Your buildings",
    noBuildingsYet: "Place your first building in the City →",
    wattsBalanced: "Grid: balanced",
    wattsDeficit: "Grid: deficit",
    wattsSurplus: "Grid: surplus",
  },
};

type Props = {
  player: Pick<PlayerState, "buildings" | "wattDeficitSince">;
  lang: Lang;
};

/** Aggregate the player's buildings by catalog id so a city of "3 Domek
 *  + 2 Sklepik" renders as two chips (🏠 ×3, 🏪 ×2) instead of five
 *  identical glyphs. Returns up to 6 chips ordered by descending count
 *  (most-built first) so the strip reads as "what defines this city". */
function aggregateByCatalog(
  buildings: ReadonlyArray<{ catalogId: string; level: number }>,
): Array<{ glyph: string; name: string; count: number; topLevel: number }> {
  const groups = new Map<
    string,
    { glyph: string; name: string; count: number; topLevel: number }
  >();
  for (const b of buildings) {
    const entry = getCatalogEntry(b.catalogId);
    if (!entry) continue;
    const prev = groups.get(b.catalogId);
    if (prev) {
      prev.count += 1;
      if (b.level > prev.topLevel) prev.topLevel = b.level;
    } else {
      groups.set(b.catalogId, {
        glyph: entry.glyph,
        name: entry.id,
        count: 1,
        topLevel: b.level,
      });
    }
  }
  return Array.from(groups.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function CityLevelCard({ player, lang }: Props) {
  const t = COPY[lang];
  const city = cityLevelFromBuildings(player.buildings);
  const watts = cityWattBalance(player.buildings);
  const pct = Math.round(city.progressToNext * 100);
  const nextUnlock = city.nextUnlocks[0] ?? null;
  const groups = aggregateByCatalog(player.buildings);

  const gridLabel = watts.inDeficit
    ? t.wattsDeficit
    : watts.net > 0
      ? t.wattsSurplus
      : t.wattsBalanced;
  const gridColor = watts.inDeficit
    ? "var(--danger)"
    : watts.net > 0
      ? "var(--success)"
      : "var(--accent)";

  return (
    <section
      className="card p-5 sm:p-6 flex flex-col gap-5"
      aria-labelledby="city-level-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="city-level-heading"
          className="t-overline text-[var(--accent)]"
        >
          {t.heading}
        </h2>
        <span
          className="text-[11px] font-mono font-semibold tabular-nums rounded-sm px-2 py-0.5"
          style={{ background: gridColor, color: "var(--accent-ink)" }}
        >
          ⚡ {watts.net > 0 ? "+" : ""}
          {watts.net}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] sm:items-center gap-5 sm:gap-6">
        {/* Left — city-level ring (navy + BuildingStackBadge inside)
            disambiguates from the XP-tier ring (orange + MedalRing)
            on the dashboard hero. F-04. */}
        <div className="flex items-center gap-4">
          <ProgressRing level={city.level} pct={pct} title={t.levelTooltip} />
          <div className="flex flex-col gap-1 text-xs sm:hidden">
            <span className="font-semibold text-[var(--ink-muted)]">
              {t.progressLabel}: {pct}%
            </span>
            <span className="text-[var(--ink-muted)]">
              {gridLabel} ({watts.produced}/{watts.consumed})
            </span>
          </div>
        </div>

        {/* Center — buildings strip */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="t-overline text-[var(--ink-muted)]">
            {t.yourBuildings}
          </span>
          {groups.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">{t.noBuildingsYet}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <li
                  key={g.name}
                  className="relative inline-flex items-center justify-center w-10 h-10 rounded-md bg-[var(--surface-2)] border border-[var(--line)] text-xl"
                  title={`${g.name} ×${g.count} · max Lvl ${g.topLevel}`}
                >
                  <span aria-hidden>{g.glyph}</span>
                  {g.count > 1 && (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[10px] font-semibold tabular-nums inline-flex items-center justify-center"
                    >
                      {g.count}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--ink-muted)]">
            <span>
              {t.progressLabel}: <strong className="text-[var(--foreground)] font-semibold">{pct}%</strong>
            </span>
            <span aria-hidden>·</span>
            <span>
              {gridLabel} ({watts.produced}/{watts.consumed})
            </span>
          </div>
        </div>

        {/* Right — building count + level label stacked */}
        <div className="text-right flex flex-col gap-0.5 min-w-[64px]">
          <span className="t-overline text-[var(--ink-muted)]">
            {t.buildingsLabel}
          </span>
          <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)] leading-none">
            {player.buildings.length}
          </span>
          <span className="t-caption text-[var(--ink-muted)] mt-1">
            {t.level}
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--line)] pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="t-overline text-[var(--ink-muted)]">
            {t.nextUnlockLabel}
          </span>
          {nextUnlock ? (
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {nextUnlock}
            </span>
          ) : (
            <span className="text-sm italic text-[var(--ink-muted)]">
              {t.nothingNext}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function ProgressRing({
  level,
  pct,
  title,
}: {
  level: number;
  pct: number;
  title: string;
}) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative shrink-0" title={title}>
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--accent)]">
        <BuildingStackBadge size={18} />
        <span className="text-xl font-semibold tabular-nums leading-none mt-0.5">
          {level}
        </span>
      </div>
    </div>
  );
}
