/* V2 refactor R3.2 — City Level hero card.
 *
 * Server component. Renders the V2 progression number (derived from
 * buildings, not XP) alongside the watt-balance badge. Sits at the top
 * of the dashboard so the city is the first thing the player sees.
 *
 * V1 XP-level stats still render beneath this during the rollout
 * window (VOCAB-AUDIT §2.1 — removal scheduled post-R3.2 once the
 * feature-flag gate ships in R9.3.1).
 */

import type { PlayerState } from "@/lib/player";
import type { Lang } from "@/lib/i18n";
import { cityLevelFromBuildings } from "@/lib/city-level";
import { cityWattBalance } from "@/lib/watts";

type Copy = Record<
  | "heading"
  | "level"
  | "progressLabel"
  | "nextUnlockLabel"
  | "nothingNext"
  | "buildingsLabel"
  | "wattsBalanced"
  | "wattsDeficit"
  | "wattsSurplus",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    heading: "Twoje miasto",
    level: "Poziom",
    progressLabel: "Postęp",
    nextUnlockLabel: "Następnie odblokujesz",
    nothingNext: "Maksymalny poziom osiągnięty — gratulacje!",
    buildingsLabel: "Budynków",
    wattsBalanced: "Sieć: zbilansowana",
    wattsDeficit: "Sieć: niedobór",
    wattsSurplus: "Sieć: nadwyżka",
  },
  uk: {
    heading: "Твоє місто",
    level: "Рівень",
    progressLabel: "Прогрес",
    nextUnlockLabel: "Далі відкриється",
    nothingNext: "Максимальний рівень — вітаємо!",
    buildingsLabel: "Будівель",
    wattsBalanced: "Мережа: збалансована",
    wattsDeficit: "Мережа: дефіцит",
    wattsSurplus: "Мережа: надлишок",
  },
  cs: {
    heading: "Tvé město",
    level: "Úroveň",
    progressLabel: "Postup",
    nextUnlockLabel: "Dále odemkneš",
    nothingNext: "Maximální úroveň — gratulujeme!",
    buildingsLabel: "Budov",
    wattsBalanced: "Síť: vyvážená",
    wattsDeficit: "Síť: nedostatek",
    wattsSurplus: "Síť: přebytek",
  },
  en: {
    heading: "Your city",
    level: "Level",
    progressLabel: "Progress",
    nextUnlockLabel: "Next unlock",
    nothingNext: "Max level reached — congratulations!",
    buildingsLabel: "Buildings",
    wattsBalanced: "Grid: balanced",
    wattsDeficit: "Grid: deficit",
    wattsSurplus: "Grid: surplus",
  },
};

type Props = {
  player: Pick<PlayerState, "buildings" | "wattDeficitSince">;
  lang: Lang;
};

export function CityLevelCard({ player, lang }: Props) {
  const t = COPY[lang];
  const city = cityLevelFromBuildings(player.buildings);
  const watts = cityWattBalance(player.buildings);
  const pct = Math.round(city.progressToNext * 100);
  const nextUnlock = city.nextUnlocks[0] ?? null;

  const gridLabel = watts.inDeficit
    ? t.wattsDeficit
    : watts.net > 0
      ? t.wattsSurplus
      : t.wattsBalanced;
  const gridColor = watts.inDeficit
    ? "var(--neo-pink)"
    : watts.net > 0
      ? "var(--neo-lime)"
      : "var(--neo-cyan)";

  return (
    <section
      className="card p-5 sm:p-6 flex flex-col gap-4"
      aria-labelledby="city-level-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="city-level-heading"
          className="text-xs uppercase tracking-widest font-black text-[var(--accent)]"
        >
          {t.heading}
        </h2>
        <span
          className="text-[11px] font-mono font-bold border-2 border-[var(--ink)] px-2 py-0.5"
          style={{ background: gridColor, color: "#0a0a0f" }}
        >
          ⚡ {watts.net > 0 ? "+" : ""}
          {watts.net}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase opacity-70">{t.level}</span>
          <span className="text-4xl font-black tabular-nums">{city.level}</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase opacity-70">
            {t.buildingsLabel}
          </div>
          <div className="text-xl font-bold tabular-nums">
            {player.buildings.length}
          </div>
        </div>
      </div>

      <div
        className="h-2 border-2 border-[var(--ink)] bg-[var(--surface-2)] relative overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="opacity-70">
          {t.progressLabel}: {pct}%
        </span>
        <span className="opacity-70">
          {gridLabel} ({watts.produced}/{watts.consumed})
        </span>
      </div>

      <div className="border-t-2 border-[var(--ink)]/40 pt-3">
        <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
          {t.nextUnlockLabel}
        </div>
        {nextUnlock ? (
          <div className="text-sm font-bold">{nextUnlock}</div>
        ) : (
          <div className="text-sm italic opacity-70">{t.nothingNext}</div>
        )}
      </div>
    </section>
  );
}
