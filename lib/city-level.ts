/* V2 refactor R1.2 — city level derived from buildings.
 *
 * V1 had three parallel progression numbers (XP-based level, tier via
 * sqrt(sum of building levels), credit score). V2 keeps only two:
 * city level (derived purely from buildings — see below) and credit
 * score (behaviour signal on PlayerState, unchanged).
 *
 * Level formula: sumPoints = Σ (building.level per building). Points
 * are divided by 3 (the "3 buildings on this level earn you a new
 * level" heuristic), square-rooted, floored — same curvature as V1
 * tier but anchored to something the player can see and act on
 * (building upgrades), not opaque XP. Capped at 10.
 *
 * V3.1 — CITY_TIERS replacement: adds `LEVEL_UNLOCK_LADDER` (rich
 * `{level, title, unlock, eduMoment}` rows) used by /o-platforme, the
 * dashboard City Level card, and the level-up toast. The old
 * `LEVEL_UNLOCKS` record-of-string-arrays stays for back-compat with
 * tests + internal derivation of `currentUnlocks` / `nextUnlocks`.
 */

import type { BuildingInstance, PlayerState } from "@/lib/player";
import { cityWattBalance } from "@/lib/watts";

export const CITY_MAX_LEVEL = 10;

export type CityLevel = {
  level: number;
  /** 0..1 fraction toward next level (1.0 at max). */
  progressToNext: number;
  /** Human-facing list of what becomes available on the NEXT level. */
  nextUnlocks: string[];
  /** Unlocks already earned at the current level. */
  currentUnlocks: string[];
  /** Sum of every building.level across the city. */
  totalPoints: number;
};

// Per-level unlock list — pedagogical moment for tier-up toast (R3.4).
// Keyed by level reached; value = human-readable PL strings (other langs
// resolve in the UI layer via dict).
export const LEVEL_UNLOCKS: Record<number, string[]> = {
  1: ["Domek (start)"],
  2: ["Mała elektrownia", "Sklepik osiedlowy"],
  3: ["Huta szkła", "Biblioteka", "Bank lokalny"],
  4: ["Walcownia stali", "Centrum nauki", "Gimnazjum sportowe"],
  5: ["Fotowoltaika z magazynem", "Panele słoneczne (duże)"],
  6: ["Software house", "Farma wiatrowa"],
  7: ["Rafineria", "Wieżowiec", "Biurowiec"],
  8: ["Spodek (landmark)", "Ratusz"],
  9: ["Elektrownia gazowa", "Centrum eventowe"],
  10: ["Varso Residence", "Tauron Plant", "Katowice Industry Hub"],
};

export function cityLevelFromBuildings(
  buildings: Array<Pick<BuildingInstance, "level">>,
): CityLevel {
  const totalPoints = buildings.reduce((s, b) => {
    const v = Number.isFinite(b.level) ? Math.max(0, b.level) : 0;
    return s + v;
  }, 0);
  const raw = Math.floor(Math.sqrt(totalPoints / 3));
  const level = Math.max(1, Math.min(CITY_MAX_LEVEL, raw || 1));

  // Progress to next = where we are inside the current level's point span.
  // Points required to reach level L = 3·(L-1)² (inverse of floor(sqrt/3)).
  const pointsForCurrent = 3 * (level - 1) ** 2;
  const pointsForNext = 3 * level ** 2;
  const span = pointsForNext - pointsForCurrent || 1;
  const progressToNext =
    level >= CITY_MAX_LEVEL
      ? 1
      : Math.max(0, Math.min(1, (totalPoints - pointsForCurrent) / span));

  return {
    level,
    progressToNext,
    totalPoints,
    currentUnlocks: LEVEL_UNLOCKS[level] ?? [],
    nextUnlocks: level < CITY_MAX_LEVEL ? (LEVEL_UNLOCKS[level + 1] ?? []) : [],
  };
}

/** Has the city crossed a level threshold? `before` + `after` supplied
 *  by the caller; true when after > before and both are valid levels. */
export function crossedLevelUp(before: number, after: number): boolean {
  return Number.isFinite(before) && Number.isFinite(after) && after > before;
}

// ---------------------------------------------------------------------------
// V3.1 — LEVEL_UNLOCK_LADDER (rich per-level entries)
// ---------------------------------------------------------------------------

export type LevelUnlock = {
  level: number;
  /** Short 1-2 word label shown in the progress ring. Localized in UI. */
  title: string;
  /** Human-readable "what gets unlocked at this level" — PL canonical. */
  unlock: string;
  /** One-sentence educational moment for /o-platforme ladder + toast. */
  eduMoment: string;
};

/** V3.1 — richer ladder for /o-platforme, dashboard, toast. Derived
 *  from the building catalog's tier gates + a pedagogical one-liner
 *  per level. PL canonical; UI layer may translate titles via dict. */
export const LEVEL_UNLOCK_LADDER: LevelUnlock[] = [
  {
    level: 1,
    title: "Start",
    unlock: "Domek (start)",
    eduMoment:
      "Twoje miasto zaczyna się od jednego domu. Każda gra = zasoby → każda budowa = wyższy poziom miasta.",
  },
  {
    level: 2,
    title: "Pierwsze usługi",
    unlock: "Sklepik osiedlowy + Mała elektrownia",
    eduMoment:
      "Sklepik daje pasywne monety. Elektrownia zasila sieć — bez niej fabryki przestaną zarabiać.",
  },
  {
    level: 3,
    title: "Lokalna bankowość",
    unlock: "Bank lokalny (5% APR) + Biblioteka + Huta szkła",
    eduMoment:
      "Bank lokalny daje lepsze warunki kredytu (5% zamiast 8%). W realu: lokalna bankowość + dobra historia = niższe raty.",
  },
  {
    level: 4,
    title: "Przemysł i nauka",
    unlock: "Walcownia stali + Centrum nauki + Gimnazjum sportowe",
    eduMoment:
      "Budynki civic (biblioteka, gimnazjum, centrum nauki) dają bonus do konkretnych typów gier. Specjalizuj się.",
  },
  {
    level: 5,
    title: "Zielona energia",
    unlock: "Fotowoltaika z magazynem",
    eduMoment:
      "Fotowoltaika produkuje watty i trochę cashZl. W realu: OZE = niższe rachunki + nadwyżka do sprzedaży.",
  },
  {
    level: 6,
    title: "Tech i usługi",
    unlock: "Software house + Farma wiatrowa",
    eduMoment:
      "Software house to pierwszy budynek produkujący cashZl (pieniądze banku). Tech = duża marża, duże koszty energii.",
  },
  {
    level: 7,
    title: "Skyscraper",
    unlock: "Rafineria + Wieżowiec + Biurowiec",
    eduMoment:
      "Wieżowce to endgame residential. Dużą nieruchomość finansujesz kredytem — porównaj RRSO różnych produktów.",
  },
  {
    level: 8,
    title: "Landmark",
    unlock: "Spodek (landmark) + Ratusz",
    eduMoment:
      "Landmark daje +5% do każdego yield w mieście. Pierwszy prawdziwy passive-income booster.",
  },
  {
    level: 9,
    title: "Big infra",
    unlock: "Elektrownia gazowa + Centrum eventowe",
    eduMoment:
      "Na tym poziomie Twoja sieć energetyczna musi być ogromna. Dywersyfikuj źródła — słońce + wiatr + gaz.",
  },
  {
    level: 10,
    title: "Endgame",
    unlock: "Varso Residence + Tauron Plant + Katowice Industry Hub",
    eduMoment:
      "Poziom 10 = Twoje miasto jest wzorem. Teraz skupiasz się na spłacaniu kredytów, optimizacji cashflow, pomocy innym.",
  },
];

// ---------------------------------------------------------------------------
// V3.1 — cityLevelFromState: richer snapshot consumed by the nav badge,
// landing preview, and profile summary. Wraps cityLevelFromBuildings
// with grid state so the badge can show "Level 5 · ⚡+12/h".
// ---------------------------------------------------------------------------

export type GridState = "surplus" | "balanced" | "deficit";

export type CityLevelSnapshot = CityLevel & {
  /** Localized summary row for the nav badge: "Level 5 · ⚡+12/h". */
  badgeLabel: string;
  grid: {
    state: GridState;
    net: number;
    produced: number;
    consumed: number;
    emoji: string;
  };
};

export function cityLevelFromState(
  state: Pick<PlayerState, "buildings">,
): CityLevelSnapshot {
  const base = cityLevelFromBuildings(state.buildings);
  const balance = cityWattBalance(state.buildings);
  const gridState: GridState = balance.inDeficit
    ? "deficit"
    : balance.net > 0
      ? "surplus"
      : "balanced";
  const emoji = gridState === "deficit" ? "⚠️" : gridState === "surplus" ? "⚡" : "🔌";
  const sign = balance.net > 0 ? "+" : "";
  return {
    ...base,
    grid: {
      state: gridState,
      net: balance.net,
      produced: balance.produced,
      consumed: balance.consumed,
      emoji,
    },
    badgeLabel: `Level ${base.level} · ${emoji}${sign}${balance.net}/h`,
  };
}
