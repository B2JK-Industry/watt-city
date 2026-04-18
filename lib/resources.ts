/* Watt City resource model. Single source of truth for resource types,
 * colors, labels, and game→yield mapping. Consumed by: ledger, score route,
 * building catalog, UI ResourceBar, backfill script. See docs/ECONOMY.md §1–2.
 */

import { LANGS, type Lang } from "@/lib/i18n";

export type ResourceKey =
  | "watts"
  | "coins"
  | "bricks"
  | "glass"
  | "steel"
  | "code"
  | "cashZl";

export type Resources = Record<ResourceKey, number>;

export const RESOURCE_KEYS: ResourceKey[] = [
  "watts",
  "coins",
  "bricks",
  "glass",
  "steel",
  "code",
  "cashZl",
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
export type ResourceDef = {
  key: ResourceKey;
  icon: string;
  color: string;
  mvpActive: boolean; // false → "Wkrótce" in Phase 1, unlocks in Phase 2
  labels: Record<Lang, string>;
  descriptions: Record<Lang, string>; // hover tooltip: "how earned"
};

export const RESOURCE_DEFS: Record<ResourceKey, ResourceDef> = {
  watts: {
    key: "watts",
    icon: "⚡",
    color: "#fde047",
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
    mvpActive: false,
    labels: {
      pl: "Szkło",
      uk: "Скло",
      cs: "Sklo",
      en: "Glass",
    },
    descriptions: {
      pl: "Wkrótce — odblokujesz w fazie 2 przez gry analityczne (price-guess, order).",
      uk: "Скоро — відкриєте у фазі 2 через аналітичні ігри.",
      cs: "Brzy — odemknete ve fázi 2 analytickými hrami.",
      en: "Coming soon — phase 2 unlocks via analytical games.",
    },
  },
  steel: {
    key: "steel",
    icon: "🔩",
    color: "#94a3b8",
    mvpActive: false,
    labels: {
      pl: "Stal",
      uk: "Сталь",
      cs: "Ocel",
      en: "Steel",
    },
    descriptions: {
      pl: "Wkrótce — odblokujesz w fazie 2 przez trudne gry wieloetapowe.",
      uk: "Скоро — відкриєте у фазі 2.",
      cs: "Brzy — odemknete ve fázi 2.",
      en: "Coming soon — phase 2 multi-step games.",
    },
  },
  code: {
    key: "code",
    icon: "💾",
    color: "#22c55e",
    mvpActive: false,
    labels: {
      pl: "Kod",
      uk: "Код",
      cs: "Kód",
      en: "Code",
    },
    descriptions: {
      pl: "Wkrótce — odblokujesz w fazie 2 przez najtrudniejsze gry (negotiate, tax-fill).",
      uk: "Скоро — відкриєте у фазі 2.",
      cs: "Brzy — odemknete ve fázi 2.",
      en: "Coming soon — phase 2 advanced games.",
    },
  },
  cashZl: {
    key: "cashZl",
    icon: "💵",
    color: "#16a34a",
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

// Evergreen game ids → their primary resource yield.
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

// AI game kinds → yields (ECONOMY.md §2 matrix, proportional to xp delta).
export const AI_KIND_YIELDS: Record<string, ResourceYield> = {
  quiz: { primary: "coins", primaryRatio: 1 },
  scramble: { primary: "bricks", primaryRatio: 1 },
  "price-guess": { primary: "glass", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "true-false": { primary: "coins", primaryRatio: 1 },
  "match-pairs": { primary: "bricks", primaryRatio: 1, secondary: "glass", secondaryRatio: 0.5 },
  order: { primary: "glass", primaryRatio: 1 },
  memory: { primary: "bricks", primaryRatio: 1 },
  "fill-in-blank": { primary: "bricks", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "calc-sprint": { primary: "watts", primaryRatio: 1 },
  "portfolio-pick": { primary: "glass", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "budget-allocate": { primary: "coins", primaryRatio: 1, secondary: "cashZl", secondaryRatio: 0.5 },
  "what-if": { primary: "steel", primaryRatio: 1 },
  dialog: { primary: "coins", primaryRatio: 1 },
  "chart-read": { primary: "glass", primaryRatio: 1 },
  negotiate: { primary: "code", primaryRatio: 1 },
  "timeline-build": { primary: "steel", primaryRatio: 1 },
  "invest-sim": { primary: "watts", primaryRatio: 1, secondary: "coins", secondaryRatio: 0.5 },
  "tax-fill": { primary: "code", primaryRatio: 1 },
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

export { LANGS };
export type { Lang };
