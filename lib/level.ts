// Silesia Watt League — jedna metafora:
//  * Namiesto "XP" zbieraš Watty (W), ktoré "elektrifikujú" tvoje sliezske mesto.
//  * Každý tier posunie tvoje mesto z osady k Europskej stolici kultúry.
//  * Level-up = nová budova/zóna, ktorá sa v meste rozsvieti.

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  progress: number; // 0..1
};

// level L starts at 50 * (L-1)^2 watts.
export function levelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / 50)) + 1;
  const levelStart = 50 * (level - 1) ** 2;
  const levelEnd = 50 * level ** 2;
  const span = levelEnd - levelStart;
  const xpIntoLevel = safe - levelStart;
  const xpToNext = Math.max(0, levelEnd - safe);
  const progress = span > 0 ? Math.min(1, xpIntoLevel / span) : 0;
  return { level, xpIntoLevel, xpForLevel: span, xpToNext, progress };
}

export type CityTier = {
  level: number;
  name: string;        // short name (navbar + badge)
  full: string;        // longer descriptive name (dashboard)
  emoji: string;
  accent: string;      // tailwind color utility without prefix (bg-<accent>)
  unlocks: string;     // "new building/zone" unlocked at this tier
  story: string;       // 1-sentence flavor text
};

// 9 tiers cover L1–L9+, matching levelFromXP break-points.
export const CITY_TIERS: CityTier[] = [
  {
    level: 1,
    name: "Osada",
    full: "Uhoľná osada (1930s Silesia)",
    emoji: "🏚️",
    accent: "bg-zinc-400",
    unlocks: "Prvý rodinný domček",
    story:
      "Začínaš v starej sliezskej baníckej osade. Komíny, uhlie, pár lámp. Treba prúd.",
  },
  {
    level: 2,
    name: "Robotnícka štvrť",
    full: "Robotnícka štvrť",
    emoji: "🏘️",
    accent: "bg-amber-400",
    unlocks: "Pekáreň a tramvajová zastávka",
    story:
      "Okolie sa rozrastá. Stavia sa prvá zastávka tramvaje, pekáreň svieti až do noci.",
  },
  {
    level: 3,
    name: "Mestská časť",
    full: "Mestská časť · dzielnica",
    emoji: "🏙️",
    accent: "bg-[var(--neo-lime)]",
    unlocks: "Základná škola a PKO pobočka",
    story:
      "Prvá škola a pobočka banky — deti sa učia, rodičia otvárajú Konto dla Młodych.",
  },
  {
    level: 4,
    name: "Mesto",
    full: "Katowice · industriálne jadro",
    emoji: "🏢",
    accent: "bg-[var(--neo-cyan)]",
    unlocks: "Spodek, Rynek, trhovisko",
    story:
      "Ikonický Spodek sa rozsvieti, Rynek nabehne životom. Silnejšia sieť = viac ľudí.",
  },
  {
    level: 5,
    name: "Smart Katowice",
    full: "Smart Katowice · digitálna éra",
    emoji: "🏛️",
    accent: "bg-[var(--neo-yellow)]",
    unlocks: "Metro, cyklostezky, 5G",
    story:
      "Doprava je elektrická, cyklostezky zapojené, BLIK platby v každom stánku.",
  },
  {
    level: 6,
    name: "Silesia Hub",
    full: "Silesia Hub · regionálne centrum",
    emoji: "⚡",
    accent: "bg-[var(--neo-pink)]",
    unlocks: "Technopark + solárne farmy",
    story:
      "Start-upy lepia kancelárie vedľa OZE zdrojov. Tauron premenil uhoľné polia na solár.",
  },
  {
    level: 7,
    name: "Green Metropolis",
    full: "Green Metropolis · klimaticky neutrálne jadro",
    emoji: "🌆",
    accent: "bg-emerald-400",
    unlocks: "Geotermálne kúpele + vertikálna farma",
    story:
      "Bývalá baňa je teraz múzeum. Teplo pod zemou vyhrieva bazény, strechy kŕmia mesto.",
  },
  {
    level: 8,
    name: "Finance District",
    full: "Finance District · stredoeurópske fintech centrum",
    emoji: "🏦",
    accent: "bg-[var(--neo-purple)]",
    unlocks: "PKO Tower + burzová plocha",
    story:
      "Mladí z Katovíc riadia portfóliá IKE a ETF z 30. poschodia. Financie sú play.",
  },
  {
    level: 9,
    name: "Europejska Stolica 2.0",
    full: "Europejska Stolica Kultury 2.0",
    emoji: "🚀",
    accent: "bg-[var(--neo-red)]",
    unlocks: "EU hlavný hub kultúry a AI",
    story:
      "Katowice hostia Euro-summit, filmový festival a AI konferenciu v rovnakom týždni. Legenda.",
  },
];

export function tierForLevel(level: number): CityTier {
  const idx = Math.max(0, Math.min(level, CITY_TIERS.length) - 1);
  return CITY_TIERS[idx];
}

// Kept for backwards compatibility with any old imports.
export function titleForLevel(level: number): string {
  return tierForLevel(level).name;
}

export function formatWatts(n: number): string {
  return `${Math.round(n).toLocaleString("sk-SK")} W`;
}
