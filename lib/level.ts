// Watt City progression — player's own growing building. Starts as a
// wooden shed in a Silesian mining quarter and ends atop Varso Tower
// (tallest building in the EU). Narrative kept in Polish (primary
// locale). UK/CS/EN fallback: tier labels come from the dict in
// components/tier-up-toast.tsx; full stories currently Polish-only.

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  progress: number; // 0..1
};

// Level L starts at K * (L-1)^2 watts. K = 120 pre rozumný grind.
const K = 120;

export function levelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / K)) + 1;
  const levelStart = K * (level - 1) ** 2;
  const levelEnd = K * level ** 2;
  const span = levelEnd - levelStart;
  const xpIntoLevel = safe - levelStart;
  const xpToNext = Math.max(0, levelEnd - safe);
  const progress = span > 0 ? Math.min(1, xpIntoLevel / span) : 0;
  return { level, xpIntoLevel, xpForLevel: span, xpToNext, progress };
}

export type CityTier = {
  level: number;
  name: string;
  full: string;
  emoji: string;
  accent: string; // tailwind bg-*
  story: string;
  unlocks: string;
};

export const CITY_TIERS: CityTier[] = [
  {
    level: 1,
    name: "Drewniana chata",
    full: "Drewniana chata w Nikiszowcu",
    emoji: "🛖",
    accent: "bg-amber-700",
    story:
      "Górnicza dzielnica, koniec XIX wieku. Jedna drewniana chata, jedna lampa, sterta węgla. Zaczynamy.",
    unlocks: "Dach nad głową",
  },
  {
    level: 2,
    name: "Dom robotniczy",
    full: "Dom robotniczy (Nikiszowiec)",
    emoji: "🏚️",
    accent: "bg-orange-700",
    story:
      "Czerwonoceglany szeregowiec. Wszystko w jednym trakcie: kuchnia, sypialnia, pokój dziecka przy piecu.",
    unlocks: "Podwórko + komórka",
  },
  {
    level: 3,
    name: "Dom rodzinny",
    full: "Dom rodzinny z ogródkiem",
    emoji: "🏠",
    accent: "bg-rose-500",
    story:
      "Dwa piętra, własne ogrzewanie, pierwszy bojler. Prababcia byłaby dumna — mamy wodę w domu.",
    unlocks: "Poddasze + ogród",
  },
  {
    level: 4,
    name: "Kamienica",
    full: "Kamienica w Śródmieściu",
    emoji: "🏡",
    accent: "bg-amber-500",
    story:
      "4-piętrowa kamienica miejska w centrum. Na parterze kawiarnia, wyżej najemcy. Pierwszy pasywny przychód.",
    unlocks: "Lokal na parterze",
  },
  {
    level: 5,
    name: "Solarna kamienica",
    full: "Nowoczesna kamienica z OZE",
    emoji: "🏘️",
    accent: "bg-lime-500",
    story:
      "Panele słoneczne na dachu, pompa ciepła. Zerowe rachunki, najemcy na liście 2 lata do przodu.",
    unlocks: "Dach solarny + ładowarka aut",
  },
  {
    level: 6,
    name: "Biurowiec",
    full: "Biurowiec (10 pięter)",
    emoji: "🏢",
    accent: "bg-cyan-500",
    story:
      "10 pięter, startupy wynajmują przestrzeń. BLIK-iem opłacone obiady w parterowej restauracji.",
    unlocks: "Oddział PKO w lobby",
  },
  {
    level: 7,
    name: "Wieżowiec",
    full: "Katowicki wieżowiec (30 p.)",
    emoji: "🏙️",
    accent: "bg-indigo-500",
    story:
      "30 pięter, lądowisko dla helikopterów na dachu. Dominujesz skyline Katowic. Teraz cię zauważą.",
    unlocks: "Sky lounge + heliport",
  },
  {
    level: 8,
    name: "Altus Tower",
    full: "Altus Tower · Katowice (125 m)",
    emoji: "🌆",
    accent: "bg-fuchsia-500",
    story:
      "Prawdziwy drugi najwyższy na Śląsku. Twoje imię na mosiężnej tablicy w holu.",
    unlocks: "Antena + logo PKO na dachu",
  },
  {
    level: 9,
    name: "Varso Tower",
    full: "Varso Tower · Warszawa (310 m)",
    emoji: "🚀",
    accent: "bg-rose-500",
    story:
      "Najwyższy budynek w Unii Europejskiej. Tak — twoje gry cię tam dostały. Teraz zapraszają cię na prelekcje.",
    unlocks: "Taras widokowy + neon na szczycie",
  },
];

export function tierForLevel(level: number): CityTier {
  const idx = Math.max(0, Math.min(level, CITY_TIERS.length) - 1);
  return CITY_TIERS[idx];
}

export function titleForLevel(level: number): string {
  return tierForLevel(level).name;
}

export function formatWatts(n: number): string {
  return `${Math.round(n).toLocaleString("pl-PL")} W`;
}
