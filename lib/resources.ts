/* Watt City resource model. Single source of truth for resource types,
 * colors, labels, and game→yield mapping. Consumed by: ledger, score route,
 * building catalog, UI ResourceBar, backfill script. See docs/ECONOMY.md §1–2.
 *
 * V2 refactor (R1.1): the player-facing surface collapses from 7 resources
 * to 4 (watts, coins, bricks, cashZl). The `glass`/`steel`/`code` keys
 * remain in the TypeScript union + legacy dicts so that stored player
 * state from V1 deserialises without shape loss — new writes never
 * produce them, and the value-based migration in R9.1 converts residual
 * balances into coins via ledger-derived rates (see REVIEW BLOCKER-2).
 * `creditScore` stays on `PlayerState`, NOT on Resources (backlog R1.1.1
 * mixed them but they're conceptually distinct — score is a derived
 * trust metric, resources are earned currencies).
 */

import { LANGS, type Lang } from "@/lib/i18n";

export type ResourceKey =
  | "watts"
  | "coins"
  | "bricks"
  | "glass" // deprecated: kept for V1 data compat, migrated to coins in R9.1
  | "steel" // deprecated
  | "code" // deprecated
  | "cashZl";

export type Resources = Record<ResourceKey, number>;

// All keys — used for clamp/add math so legacy stored values don't get
// silently truncated before the R9.1 migration runs.
export const RESOURCE_KEYS: ResourceKey[] = [
  "watts",
  "coins",
  "bricks",
  "glass",
  "steel",
  "code",
  "cashZl",
];

// Active surface — what the V2 player sees (ResourceBar, post-game modal,
// daily cap). Games NEVER yield a deprecated key on the V2 path.
export const ACTIVE_RESOURCE_KEYS: ResourceKey[] = [
  "watts",
  "coins",
  "bricks",
  "cashZl",
];

export const DEPRECATED_RESOURCE_KEYS: ResourceKey[] = [
  "glass",
  "steel",
  "code",
];

export const ZERO_RESOURCES: Resources = {
  watts: 0,
  coins: 0,
  bricks: 0,
  glass: 0,
  steel: 0,
  code: 0,
  cashZl: 0,
};

// Per-resource UI metadata. Color hex is authoritative here (ECONOMY.md §1).
// Label map mirrors the four shipped UI languages.
//
// `color` is the legacy core/dark-skin neon hue and is retained as the
// authoritative game-economy key (used in tooltips, doc generation, the
// dark-skin chips). UI rendering on the **light** pko skin reads
// `lightColor` instead — these darker variants meet WCAG AA (≥ 4.5:1
// contrast against `#ffffff`). Without this split, ResourceBar text
// fails axe-core color-contrast on every logged-in route (see UX
// Pass 3 finding F-NEW-01).
export type ResourceDef = {
  key: ResourceKey;
  icon: string;
  /** Neon hue used by the legacy core/dark skin. */
  color: string;
  /** Darker variant used by ResourceBar / parent overview on the
   *  default light `pko` skin. Must meet WCAG AA ≥ 4.5:1 on `#ffffff`. */
  lightColor: string;
  mvpActive: boolean; // false → "Wkrótce" in Phase 1, unlocks in Phase 2
  /** V2: deprecated means the key stays in storage for migration but no
   *  new game/building ever produces it and the ResourceBar hides it. */
  deprecated?: boolean;
  labels: Record<Lang, string>;
  descriptions: Record<Lang, string>; // hover tooltip: "how earned"
};

export const RESOURCE_DEFS: Record<ResourceKey, ResourceDef> = {
  watts: {
    key: "watts",
    icon: "⚡",
    color: "#fde047",
    lightColor: "#a16207", // amber-700 ≈ 5.6:1 on white
    mvpActive: true,
    labels: {
      pl: "Waty",
      uk: "Вати",
      cs: "Watty",
      en: "Watts",
    },
    descriptions: {
      pl: "Za refleksowe gry — energy-dash, power-flip, math-sprint. Zasila elektrownie.",
      uk: "За рефлекс-ігри — energy-dash, power-flip, math-sprint. Живить електростанції.",
      cs: "Za reflexní hry — energy-dash, power-flip, math-sprint. Pohání elektrárny.",
      en: "From reflex games — energy-dash, power-flip, math-sprint. Powers elektrownie.",
    },
  },
  coins: {
    key: "coins",
    icon: "🪙",
    color: "#f59e0b",
    lightColor: "#a85a18", // warm dark orange ≈ 5.0:1 on white
    mvpActive: true,
    labels: {
      pl: "Monety",
      uk: "Монети",
      cs: "Mince",
      en: "Coins",
    },
    descriptions: {
      pl: "Za gry wiedzy — quiz, true-false, budget-balance. Na codzienne budowy.",
      uk: "За ігри знань — квіз, правда-неправда, budget-balance. На щоденні будови.",
      cs: "Za znalostní hry — kvíz, pravda-nepravda, budget-balance. Na běžné stavby.",
      en: "From knowledge games — quiz, true-false, budget-balance. Everyday builds.",
    },
  },
  bricks: {
    key: "bricks",
    icon: "🧱",
    color: "#a16207",
    lightColor: "#a16207", // already AA-safe (5.6:1 on white)
    mvpActive: true,
    labels: {
      pl: "Cegły",
      uk: "Цегла",
      cs: "Cihly",
      en: "Bricks",
    },
    descriptions: {
      pl: "Za gry słownikowe — word-scramble, memory-match. Surowiec budowlany.",
      uk: "За словникові ігри — word-scramble, memory-match. Будівельний матеріал.",
      cs: "Za slovní hry — word-scramble, memory-match. Stavební materiál.",
      en: "From vocabulary games — word-scramble, memory-match. Raw material.",
    },
  },
  glass: {
    key: "glass",
    icon: "🪟",
    color: "#22d3ee",
    lightColor: "#0e6b78", // deep teal ≈ 6.1:1 on white
    mvpActive: false,
    deprecated: true,
    labels: {
      pl: "Szkło",
      uk: "Скло",
      cs: "Sklo",
      en: "Glass",
    },
    descriptions: {
      pl: "Za gry analityczne — price-guess, order, chart-read. Na Huta szkła, panele PV.",
      uk: "За аналітичні ігри — price-guess, order, chart-read. Для скляного заводу.",
      cs: "Za analytické hry — price-guess, order, chart-read. Na sklárnu a fotovoltaiku.",
      en: "From analytical games — price-guess, order, chart-read. Powers glass foundry + PV.",
    },
  },
  steel: {
    key: "steel",
    icon: "🔩",
    color: "#94a3b8",
    lightColor: "#475569", // slate-600 ≈ 7.0:1 on white
    mvpActive: false,
    deprecated: true,
    labels: {
      pl: "Stal",
      uk: "Сталь",
      cs: "Ocel",
      en: "Steel",
    },
    descriptions: {
      pl: "Za gry wieloetapowe — what-if, timeline-build. Na budynki T5+ (walcownia, fotowoltaika).",
      uk: "За багатокрокові ігри — what-if, timeline-build. Для будівель T5+.",
      cs: "Za vícestupňové hry — what-if, timeline-build. Pro budovy T5+.",
      en: "From multi-step games — what-if, timeline-build. Powers T5+ buildings.",
    },
  },
  code: {
    key: "code",
    icon: "💾",
    color: "#22c55e",
    lightColor: "#15803d", // green-700 ≈ 4.7:1 on white
    mvpActive: false,
    deprecated: true,
    labels: {
      pl: "Kod",
      uk: "Код",
      cs: "Kód",
      en: "Code",
    },
    descriptions: {
      pl: "Za zaawansowane gry — negotiate, tax-fill. Na Software house + landmark T8.",
      uk: "За складні ігри — negotiate, tax-fill. Для Software house + T8.",
      cs: "Za pokročilé hry — negotiate, tax-fill. Pro Software house + T8.",
      en: "From advanced games — negotiate, tax-fill. Powers Software house + T8.",
    },
  },
  cashZl: {
    key: "cashZl",
    icon: "💵",
    color: "#16a34a",
    lightColor: "#15803d", // green-700 ≈ 4.7:1 on white (matches `--success`)
    mvpActive: true,
    labels: {
      pl: "W$",
      uk: "W$",
      cs: "W$",
      en: "W$",
    },
    descriptions: {
      pl: "W-dolar — waluta miejska. Z cashflow budynków, na spłatę kredytu. (GRA EDUKACYJNA — to nie są prawdziwe pieniądze.)",
      uk: "W-долар — міська валюта. З cashflow будівель, на виплату кредиту. (Навчальна гра — це не справжні гроші.)",
      cs: "W-dolar — městská měna. Z cashflow budov, na splátku úvěru. (Vzdělávací hra — nejsou to skutečné peníze.)",
      en: "W-dollar — city currency. From building cashflow, for loan repayment. (Educational game — not real money.)",
    },
  },
};

// Per-game resource yield. Each evergreen / AI-kind identifier maps to the
// resource mix awarded on a new personal best. Mirrors the ECONOMY.md §2
// matrix; yields scale linearly with the xp delta (1:1 on primary, 0.5:1 on
// secondary), so bigger score improvements credit more resources.
export type ResourceYield = {
  primary: ResourceKey;
  /** Multiplier applied to xp delta. 1 ≈ parity with xp earned. */
  primaryRatio: number;
  secondary?: ResourceKey;
  secondaryRatio?: number;
};

// Evergreen game ids → their primary resource yield. V2: only 4-resource
// set produced. Glass/steel/code yields from V1 now route to coins.
export const EVERGREEN_YIELDS: Record<string, ResourceYield> = {
  "energy-dash": { primary: "watts", primaryRatio: 1 },
  "power-flip": { primary: "watts", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "stock-tap": { primary: "coins", primaryRatio: 1, secondary: "watts", secondaryRatio: 0.5 },
  "budget-balance": { primary: "coins", primaryRatio: 1, secondary: "cashZl", secondaryRatio: 0.5 },
  "finance-quiz": { primary: "coins", primaryRatio: 1 },
  "math-sprint": { primary: "watts", primaryRatio: 1 },
  "memory-match": { primary: "bricks", primaryRatio: 1 },
  "currency-rush": { primary: "coins", primaryRatio: 1, secondary: "watts", secondaryRatio: 0.5 },
  "word-scramble": { primary: "bricks", primaryRatio: 1 },
};

// AI game kinds → yields. V2: glass/steel/code redirected to coins at
// 0.8× (reflects review BLOCKER-2 rationale — those kinds generally
// produced smaller numbers per xp unit than coins games).
export const AI_KIND_YIELDS: Record<string, ResourceYield> = {
  quiz: { primary: "coins", primaryRatio: 1 },
  scramble: { primary: "bricks", primaryRatio: 1 },
  "price-guess": { primary: "coins", primaryRatio: 0.8, secondary: "bricks", secondaryRatio: 0.4 },
  "true-false": { primary: "coins", primaryRatio: 1 },
  "match-pairs": { primary: "bricks", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.4 },
  order: { primary: "coins", primaryRatio: 0.8, secondary: "bricks", secondaryRatio: 0.4 },
  memory: { primary: "bricks", primaryRatio: 1 },
  "fill-in-blank": { primary: "bricks", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "calc-sprint": { primary: "watts", primaryRatio: 1 },
  "portfolio-pick": { primary: "coins", primaryRatio: 1, secondary: "cashZl", secondaryRatio: 0.5 },
  "budget-allocate": { primary: "coins", primaryRatio: 1, secondary: "cashZl", secondaryRatio: 0.5 },
  "what-if": { primary: "coins", primaryRatio: 0.8, secondary: "bricks", secondaryRatio: 0.4 },
  dialog: { primary: "coins", primaryRatio: 1 },
  "chart-read": { primary: "coins", primaryRatio: 0.8, secondary: "bricks", secondaryRatio: 0.4 },
  negotiate: { primary: "coins", primaryRatio: 1 },
  "timeline-build": { primary: "coins", primaryRatio: 0.8, secondary: "bricks", secondaryRatio: 0.4 },
  "invest-sim": { primary: "watts", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "tax-fill": { primary: "coins", primaryRatio: 1 },
};

// Resolve a yield for any gameId. Evergreen ids match directly; AI games
// (prefix `ai-`) look up by kind from the game spec (caller supplies).
export function yieldForGame(
  gameId: string,
  aiKind?: string,
): ResourceYield | null {
  const evergreen = EVERGREEN_YIELDS[gameId];
  if (evergreen) return evergreen;
  if (gameId.startsWith("ai-") && aiKind) {
    return AI_KIND_YIELDS[aiKind] ?? null;
  }
  return null;
}

/** Max balance any single resource can hold (ECONOMY.md §1). */
export const MAX_BALANCE = 1_000_000;

/** Round + clamp magnitudes on a resource delta (keeping sign). Positive
 *  deltas are capped at MAX_BALANCE; negative deltas (debits) at -MAX_BALANCE.
 *  Applying the delta via `addResources` still floors balances at 0 so we
 *  never go negative. */
export function clampResources(r: Partial<Resources>): Partial<Resources> {
  const out: Partial<Resources> = {};
  for (const k of RESOURCE_KEYS) {
    const v = r[k];
    if (v === undefined || v === 0) continue;
    const rounded = v < 0 ? Math.ceil(v) : Math.floor(v);
    const clamped = Math.max(-MAX_BALANCE, Math.min(MAX_BALANCE, rounded));
    out[k] = clamped;
  }
  return out;
}

// Sum two resource deltas; missing keys default to 0. Used by tick + score paths.
export function addResources(
  a: Resources,
  b: Partial<Resources>,
): Resources {
  const out = { ...a };
  for (const k of RESOURCE_KEYS) {
    const delta = b[k] ?? 0;
    out[k] = Math.max(0, Math.min(MAX_BALANCE, (a[k] ?? 0) + delta));
  }
  return out;
}

// Convert an xp delta into a resource delta using a yield rule.
export function resourceDeltaFromYield(
  xpDelta: number,
  y: ResourceYield,
): Partial<Resources> {
  const delta: Partial<Resources> = {};
  delta[y.primary] = Math.floor(xpDelta * y.primaryRatio);
  if (y.secondary && y.secondaryRatio) {
    delta[y.secondary] = Math.floor(xpDelta * y.secondaryRatio);
  }
  return delta;
}

/** Apply a per-day earned cap to a positive resource delta. Given the prior
 *  running total per resource (map key → already-earned today), trims each
 *  resource's delta so `earnedToday + delta <= cap`. Negatives are passed
 *  through unchanged (caps are earn-side only). Returns the trimmed delta. */
export function capDailyYield(
  delta: Partial<Resources>,
  earnedToday: Partial<Record<ResourceKey, number>>,
  cap: number,
): Partial<Resources> {
  const out: Partial<Resources> = {};
  for (const [k, v] of Object.entries(delta) as [ResourceKey, number][]) {
    if (v <= 0) {
      out[k] = v;
      continue;
    }
    const prior = earnedToday[k] ?? 0;
    const remaining = Math.max(0, cap - prior);
    out[k] = Math.min(v, remaining);
  }
  return out;
}

export { LANGS };
export type { Lang };
