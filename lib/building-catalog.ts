/* Watt City building catalog — Phase 1 MVP.
 *
 * Only Domek is fully buildable at signup (decision D4: earn-to-unlock).
 * Every other Tier-2+ building is listed but hidden behind a resource
 * threshold that the player has to cross by playing games first. The 20
 * slot map (ECONOMY.md §3) pins a `category` per slot — buildings can only
 * be placed on slots whose category matches (or on "decorative" any-tier).
 *
 * Numbers follow ECONOMY.md §3 directly. When the balance designer tweaks
 * a number, it lands here — single source of truth for the economy.
 */

import type { Resources } from "@/lib/resources";
import type { Lang } from "@/lib/i18n";

export type SlotCategory =
  | "residential"
  | "commercial"
  | "industry"
  | "civic"
  | "landmark"
  | "decorative";

export type BuildingTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type UnlockCondition =
  | { kind: "always" }
  | { kind: "lifetime-resource"; resource: keyof Resources; amount: number }
  | { kind: "tier"; minTier: BuildingTier };

export type BuildingCatalogEntry = {
  id: string;
  category: SlotCategory;
  tier: BuildingTier;
  baseCost: Partial<Resources>;
  /** Primary yield per hour at level 1. Can be sparse — empty = civic/multiplier. */
  baseYieldPerHour: Partial<Resources>;
  /** Multiplier-type buildings: apply this % bonus to matching game-kind yields. */
  multiplier?: {
    target: "citywide-all" | "quiz-true-false" | "order-match" | "reflex";
    percent: number;
  };
  unlock: UnlockCondition;
  /** Glyph on the building silhouette. */
  glyph: string;
  /** Roof Tailwind/hex color for visual recipe. */
  roofColor: string;
  /** Body color. */
  bodyColor: string;
  labels: Record<Lang, string>;
  teasers: Record<Lang, string>; // short one-line teaser for coming-soon/UI tooltip
  /** MVP: only Domek is fully active; everything else is "coming soon". Used
   *  by the build modal to show/hide the action button. */
  mvpActive: boolean;
};

export const BUILDING_CATALOG: BuildingCatalogEntry[] = [
  {
    id: "domek",
    category: "residential",
    tier: 1,
    baseCost: {}, // free at signup
    baseYieldPerHour: { coins: 5 },
    unlock: { kind: "always" },
    glyph: "🏠",
    roofColor: "#f59e0b",
    bodyColor: "#fde047",
    labels: {
      pl: "Domek",
      uk: "Будиночок",
      cs: "Domek",
      en: "Little House",
    },
    teasers: {
      pl: "Twój pierwszy dom. Daje 5 monet co godzinę. Start kariery.",
      uk: "Твій перший будинок. Дає 5 монет щогодини. Старт кар'єри.",
      cs: "Tvůj první dům. Dává 5 mincí každou hodinu. Začátek kariéry.",
      en: "Your first house. Yields 5 coins per hour. Career starter.",
    },
    mvpActive: true,
  },
  {
    id: "mala-elektrownia",
    category: "industry",
    tier: 2,
    baseCost: { bricks: 80, coins: 50 },
    baseYieldPerHour: { watts: 8 },
    unlock: { kind: "lifetime-resource", resource: "watts", amount: 50 },
    glyph: "⚡",
    roofColor: "#facc15",
    bodyColor: "#a16207",
    labels: {
      pl: "Mała elektrownia",
      uk: "Маленька електростанція",
      cs: "Malá elektrárna",
      en: "Small Power Plant",
    },
    teasers: {
      pl: "Produkuje 8 ⚡/h. Odblokujesz po zarobieniu 50 ⚡ w grach refleksowych.",
      uk: "Виробляє 8 ⚡/год. Відкриється після зароблених 50 ⚡.",
      cs: "Produkuje 8 ⚡/h. Odemkne se po získání 50 ⚡.",
      en: "Produces 8 ⚡/h. Unlocks after you earn 50 ⚡ from reflex games.",
    },
    mvpActive: true,
  },
  {
    id: "sklepik",
    category: "commercial",
    tier: 2,
    baseCost: { bricks: 60, coins: 80 },
    baseYieldPerHour: { coins: 6, bricks: 2 },
    unlock: { kind: "lifetime-resource", resource: "coins", amount: 50 },
    glyph: "🏪",
    roofColor: "#f472b6",
    bodyColor: "#be185d",
    labels: {
      pl: "Sklepik osiedlowy",
      uk: "Магазинчик",
      cs: "Obchůdek",
      en: "Corner Shop",
    },
    teasers: {
      pl: "6 🪙 + 2 🧱 co godzinę. Odblokujesz po 50 🪙 z gier wiedzy.",
      uk: "6 🪙 + 2 🧱 щогодини. Відкриється після 50 🪙 зі знаннєвих ігор.",
      cs: "6 🪙 + 2 🧱 každou hodinu. Odemkne se po 50 🪙 ze znalostních her.",
      en: "6 🪙 + 2 🧱 per hour. Unlocks after 50 🪙 from knowledge games.",
    },
    mvpActive: true,
  },
  // Phase 2.4: flipped mvpActive=true — the backend multiplier machinery now
  // respects these entries' bonuses at both tick-time (citywide) and score-
  // time (kind multipliers). Spodek T8 kept as aspirational endgame.
  {
    id: "bank-lokalny",
    category: "civic",
    tier: 3,
    baseCost: { bricks: 200, coins: 1500 },
    baseYieldPerHour: {},
    unlock: { kind: "tier", minTier: 3 },
    glyph: "🏦",
    roofColor: "#0ea5e9",
    bodyColor: "#1e40af",
    labels: {
      pl: "Bank lokalny",
      uk: "Місцевий банк",
      cs: "Místní banka",
      en: "Local Bank",
    },
    teasers: {
      pl: "Odblokowuje kredyt preferowany 5% APR (vs 8% standardowy).",
      uk: "Відкриває пільговий кредит 5% APR (vs 8%).",
      cs: "Odemyká zvýhodněný úvěr 5% APR (vs 8%).",
      en: "Unlocks the Preferred mortgage (5% APR vs 8%).",
    },
    mvpActive: true,
  },
  {
    id: "huta-szkla",
    category: "industry",
    tier: 3,
    baseCost: { bricks: 250, coins: 1200, watts: 100 },
    baseYieldPerHour: { glass: 4 },
    unlock: { kind: "tier", minTier: 3 },
    glyph: "🪟",
    roofColor: "#22d3ee",
    bodyColor: "#0e7490",
    labels: {
      pl: "Huta szkła",
      uk: "Скляний завод",
      cs: "Sklárna",
      en: "Glass Foundry",
    },
    teasers: {
      pl: "Pierwszy producent szkła, 4 🪟/h.",
      uk: "Перший виробник скла, 4 🪟/год.",
      cs: "První producent skla, 4 🪟/h.",
      en: "First glass producer, 4 🪟/h.",
    },
    mvpActive: true,
  },
  {
    id: "biblioteka",
    category: "civic",
    tier: 3,
    baseCost: { bricks: 300, coins: 800 },
    baseYieldPerHour: {},
    multiplier: { target: "quiz-true-false", percent: 20 },
    unlock: { kind: "tier", minTier: 3 },
    glyph: "📚",
    roofColor: "#f59e0b",
    bodyColor: "#92400e",
    labels: {
      pl: "Biblioteka",
      uk: "Бібліотека",
      cs: "Knihovna",
      en: "Library",
    },
    teasers: {
      pl: "+20% 🪙 z gier quiz / true-false / finance-quiz.",
      uk: "+20% 🪙 з квіз / true-false / finance-quiz.",
      cs: "+20% 🪙 z kvíz / true-false / finance-quiz.",
      en: "+20% 🪙 on quiz / true-false / finance-quiz yields.",
    },
    mvpActive: true,
  },
  {
    id: "walcownia",
    category: "industry",
    tier: 4,
    baseCost: { bricks: 400, glass: 200, coins: 2000 },
    baseYieldPerHour: { steel: 3 },
    unlock: { kind: "tier", minTier: 4 },
    glyph: "🔩",
    roofColor: "#94a3b8",
    bodyColor: "#334155",
    labels: {
      pl: "Walcownia stali",
      uk: "Сталеливарний завод",
      cs: "Ocelárna",
      en: "Steel Rolling Mill",
    },
    teasers: {
      pl: "3 🔩/h, potrzebne do budynków T5+.",
      uk: "3 🔩/год, потрібна для T5+.",
      cs: "3 🔩/h, potřebná pro T5+.",
      en: "3 🔩/h, needed for tier-5+ buildings.",
    },
    mvpActive: true,
  },
  {
    id: "gimnazjum-sportowe",
    category: "civic",
    tier: 4,
    baseCost: { bricks: 350, coins: 1000, watts: 200 },
    baseYieldPerHour: {},
    multiplier: { target: "reflex", percent: 20 },
    unlock: { kind: "tier", minTier: 4 },
    glyph: "🏟️",
    roofColor: "#ef4444",
    bodyColor: "#991b1b",
    labels: {
      pl: "Gimnazjum sportowe",
      uk: "Спортивна гімназія",
      cs: "Sportovní gymnázium",
      en: "Sports Gymnasium",
    },
    teasers: {
      pl: "+20% ⚡ z refleksowych gier (power-flip, math-sprint, energy-dash).",
      uk: "+20% ⚡ з рефлекс-ігор.",
      cs: "+20% ⚡ z reflexních her.",
      en: "+20% ⚡ on reflex-game yields.",
    },
    mvpActive: true,
  },
  {
    id: "centrum-nauki",
    category: "civic",
    tier: 4,
    baseCost: { bricks: 500, glass: 100, coins: 1500 },
    baseYieldPerHour: {},
    multiplier: { target: "order-match", percent: 20 },
    unlock: { kind: "tier", minTier: 4 },
    glyph: "🔬",
    roofColor: "#14b8a6",
    bodyColor: "#115e59",
    labels: {
      pl: "Centrum nauki",
      uk: "Центр науки",
      cs: "Centrum vědy",
      en: "Science Center",
    },
    teasers: {
      pl: "+20% 🪟 z gier analitycznych (order, match-pairs, chart-read).",
      uk: "+20% 🪟 з аналітичних ігор.",
      cs: "+20% 🪟 z analytických her.",
      en: "+20% 🪟 on analytical-game yields.",
    },
    mvpActive: true,
  },
  {
    id: "fotowoltaika",
    category: "industry",
    tier: 5,
    baseCost: { bricks: 200, glass: 100, steel: 50, watts: 100 },
    baseYieldPerHour: { watts: 12, cashZl: 1 },
    unlock: { kind: "tier", minTier: 5 },
    glyph: "☀️",
    roofColor: "#eab308",
    bodyColor: "#a16207",
    labels: {
      pl: "Fotowoltaika z magazynem",
      uk: "Фотовольтаїка зі сховищем",
      cs: "Fotovoltaika s úložištěm",
      en: "Solar + Storage",
    },
    teasers: {
      pl: "12 ⚡ + 1 💵/h, tier 5.",
      uk: "12 ⚡ + 1 💵/год, tier 5.",
      cs: "12 ⚡ + 1 💵/h, tier 5.",
      en: "12 ⚡ + 1 💵/h, tier 5.",
    },
    mvpActive: true,
  },
  {
    id: "software-house",
    category: "commercial",
    tier: 6,
    baseCost: { bricks: 200, glass: 300, steel: 200, coins: 5000 },
    baseYieldPerHour: { code: 4, cashZl: 8 },
    unlock: { kind: "tier", minTier: 6 },
    glyph: "💻",
    roofColor: "#22c55e",
    bodyColor: "#14532d",
    labels: {
      pl: "Software house",
      uk: "Софтверний хаб",
      cs: "Software house",
      en: "Software House",
    },
    teasers: {
      pl: "4 💾 + 8 💵/h, tier 6.",
      uk: "4 💾 + 8 💵/год, tier 6.",
      cs: "4 💾 + 8 💵/h, tier 6.",
      en: "4 💾 + 8 💵/h, tier 6.",
    },
    mvpActive: true,
  },
  /* Decorative buildings (cosmetic-only, 0 yield, any slot) */
  {
    id: "kosciol",
    category: "decorative",
    tier: 2,
    baseCost: { bricks: 100, coins: 150 },
    baseYieldPerHour: {},
    unlock: { kind: "always" },
    glyph: "⛪",
    roofColor: "#eab308",
    bodyColor: "#f3f4f6",
    labels: {
      pl: "Kościół",
      uk: "Церква",
      cs: "Kostel",
      en: "Church",
    },
    teasers: {
      pl: "Dekoracyjny. Symbol sąsiedzkiej tożsamości.",
      uk: "Декоративний. Символ сусідської ідентичності.",
      cs: "Dekorativní. Symbol sousedské identity.",
      en: "Decorative. Neighborhood identity landmark.",
    },
    mvpActive: true,
  },
  {
    id: "park",
    category: "decorative",
    tier: 1,
    baseCost: { bricks: 50, coins: 80 },
    baseYieldPerHour: {},
    unlock: { kind: "always" },
    glyph: "🌳",
    roofColor: "#22c55e",
    bodyColor: "#166534",
    labels: {
      pl: "Park",
      uk: "Парк",
      cs: "Park",
      en: "Park",
    },
    teasers: {
      pl: "Dekoracyjny. Zielone płuca miasta.",
      uk: "Декоративний. Зелені легені міста.",
      cs: "Dekorativní. Zelené plíce města.",
      en: "Decorative. The city's green lungs.",
    },
    mvpActive: true,
  },
  {
    id: "fontanna",
    category: "decorative",
    tier: 2,
    baseCost: { bricks: 80, coins: 120, glass: 30 },
    baseYieldPerHour: {},
    unlock: { kind: "always" },
    glyph: "⛲",
    roofColor: "#0ea5e9",
    bodyColor: "#0284c7",
    labels: {
      pl: "Fontanna",
      uk: "Фонтан",
      cs: "Fontána",
      en: "Fountain",
    },
    teasers: {
      pl: "Dekoracyjna. Rynek wygląda lepiej.",
      uk: "Декоративний. Площа виглядає краще.",
      cs: "Dekorativní. Náměstí vypadá líp.",
      en: "Decorative. Makes the square look better.",
    },
    mvpActive: true,
  },
  {
    id: "spodek",
    category: "landmark",
    tier: 8,
    baseCost: { bricks: 1500, glass: 1000, steel: 500, code: 200, coins: 20000 },
    baseYieldPerHour: {},
    multiplier: { target: "citywide-all", percent: 5 },
    unlock: { kind: "tier", minTier: 8 },
    glyph: "🛸",
    roofColor: "#c084fc",
    bodyColor: "#581c87",
    labels: {
      pl: "Spodek",
      uk: "Сподек",
      cs: "Spodek",
      en: "Spodek Arena",
    },
    teasers: {
      pl: "+5% wszystkich yieldów. Katowicki landmark.",
      uk: "+5% усіх yield. Катовіцький landmark.",
      cs: "+5% všech yieldů. Katovický landmark.",
      en: "+5% on all yields. Katowice landmark.",
    },
    mvpActive: true,
  },
];

export function getCatalogEntry(id: string): BuildingCatalogEntry | null {
  return BUILDING_CATALOG.find((b) => b.id === id) ?? null;
}

export type SlotDef = {
  id: number; // 0..19
  category: SlotCategory;
  // Static SVG position on the 1800×460 city viewBox (ECONOMY.md §3 slot map).
  x: number;
  y: number;
  w: number;
  h: number;
};

// 20 slots on the shared SVG scene. Categories follow ECONOMY.md §3 row-by-row.
// All dimensions in SVG units; y is GROUND-relative for rendering.
export const SLOT_MAP: SlotDef[] = [
  // Row 0 — landmark (tier 8+)
  { id: 0, category: "landmark", x: 60, y: 220, w: 140, h: 180 },
  // Row 1 — civic (tier 3-7)
  { id: 1, category: "civic", x: 220, y: 260, w: 100, h: 140 },
  { id: 2, category: "civic", x: 340, y: 260, w: 100, h: 140 },
  // Row 2 — industry (tier 5-7), 4 slots
  { id: 3, category: "industry", x: 460, y: 280, w: 90, h: 120 },
  { id: 4, category: "industry", x: 560, y: 280, w: 90, h: 120 },
  { id: 5, category: "industry", x: 660, y: 280, w: 90, h: 120 },
  { id: 6, category: "industry", x: 760, y: 280, w: 90, h: 120 },
  // Row 3 — commercial (tier 3-5), 3 slots
  { id: 7, category: "commercial", x: 870, y: 300, w: 90, h: 100 },
  { id: 8, category: "commercial", x: 970, y: 300, w: 90, h: 100 },
  { id: 9, category: "commercial", x: 1070, y: 300, w: 90, h: 100 },
  // Row 4 — residential (tier 1-4), 4 slots
  { id: 10, category: "residential", x: 1170, y: 320, w: 80, h: 80 },
  { id: 11, category: "residential", x: 1260, y: 320, w: 80, h: 80 },
  { id: 12, category: "residential", x: 1350, y: 320, w: 80, h: 80 },
  { id: 13, category: "residential", x: 1440, y: 320, w: 80, h: 80 },
  // Row 5 — decorative (any), 4 slots
  { id: 14, category: "decorative", x: 1530, y: 340, w: 60, h: 60 },
  { id: 15, category: "decorative", x: 1600, y: 340, w: 60, h: 60 },
  { id: 16, category: "decorative", x: 1670, y: 340, w: 60, h: 60 },
  { id: 17, category: "decorative", x: 1740, y: 340, w: 50, h: 60 },
  // Row 6 — civic at bottom
  { id: 18, category: "civic", x: 10, y: 340, w: 40, h: 60 },
  { id: 19, category: "civic", x: 1790, y: 340, w: 10, h: 60 }, // edge filler, usable but small
];

export function getSlot(id: number): SlotDef | null {
  return SLOT_MAP.find((s) => s.id === id) ?? null;
}

// Slot 10 is the default residential slot where Domek goes at signup.
export const DOMEK_SLOT_ID = 10;

/** Compute level cost/yield using ECONOMY.md §3 multipliers. */
export const COST_MULTIPLIER = 1.6;
export const YIELD_MULTIPLIER = 1.4;

export function costAtLevel(
  base: Partial<Resources>,
  level: number,
): Partial<Resources> {
  if (level < 1) return {};
  const mult = COST_MULTIPLIER ** (level - 1);
  const out: Partial<Resources> = {};
  for (const [k, v] of Object.entries(base) as [keyof Resources, number][]) {
    out[k] = Math.ceil(v * mult);
  }
  return out;
}

export function yieldAtLevel(
  base: Partial<Resources>,
  level: number,
): Partial<Resources> {
  if (level < 1) return {};
  const mult = YIELD_MULTIPLIER ** (level - 1);
  const out: Partial<Resources> = {};
  for (const [k, v] of Object.entries(base) as [keyof Resources, number][]) {
    out[k] = Math.ceil(v * mult);
  }
  return out;
}

/** True if player's cumulative ever-earned resources (per ledger) satisfy
 *  the unlock condition. Tier unlocks are gated later by player tier. */
export function isUnlocked(
  entry: BuildingCatalogEntry,
  lifetimeEarned: Resources,
  playerTier: number,
): boolean {
  switch (entry.unlock.kind) {
    case "always":
      return true;
    case "lifetime-resource":
      return (
        (lifetimeEarned[entry.unlock.resource] ?? 0) >= entry.unlock.amount
      );
    case "tier":
      return playerTier >= entry.unlock.minTier;
  }
}

// Check whether a catalog entry can be placed on a given slot.
export function isCategoryCompatible(
  entry: BuildingCatalogEntry,
  slot: SlotDef,
): boolean {
  if (slot.category === "decorative") return true; // any
  return slot.category === entry.category;
}
