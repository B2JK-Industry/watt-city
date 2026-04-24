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
    ? "var(--danger)"
    : watts.net > 0
      ? "var(--success)"
      : "var(--accent)";

  return (
    <section
      className="card p-5 sm:p-6 flex flex-col gap-4"
      aria-labelledby="city-level-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="city-level-heading"
          className="text-xs font-semibold text-[var(--accent)]"
        >
          {t.heading}
        </h2>
        <span
          className="text-[11px] font-mono font-bold border border-[var(--ink)] px-2 py-0.5"
          style={{ background: gridColor, color: "var(--accent-ink)" }}
        >
          ⚡ {watts.net > 0 ? "+" : ""}
          {watts.net}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* V3.1 — progress ring around level number */}
        <ProgressRing level={city.level} pct={pct} />
        <div className="text-right">
          <div className="text-[10px] opacity-70">
            {t.buildingsLabel}
          </div>
          <div className="text-xl font-bold tabular-nums">
            {player.buildings.length}
          </div>
          <div className="text-[10px] opacity-70 mt-1">
            {t.level}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="opacity-70">
          {t.progressLabel}: {pct}%
        </span>
        <span className="opacity-70">
          {gridLabel} ({watts.produced}/{watts.consumed})
        </span>
      </div>

      <div className="border-t border-[var(--ink)]/40 pt-3">
        <div className="text-[10px] opacity-70 mb-1">
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

function ProgressRing({ level, pct }: { level: number; pct: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative" aria-hidden>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--surface-2)"
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{level}</span>
      </div>
    </div>
  );
}
