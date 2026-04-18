// XP Arena progression — namiesto "mestskej progresie" ide o
// RASTÚCU vlastnú budovu hráča. Začínaš ako drevená búda v baníckej
// osade a skončíš na streche Varso Tower (najvyššia budova v EÚ).

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
    name: "Drevená búda",
    full: "Drevená búda v Nikiszowci",
    emoji: "🛖",
    accent: "bg-amber-700",
    story:
      "Banícka štvrť, koniec 19. storočia. Jedna drevená búda, jedna lampa, hromada uhlia. Začíname.",
    unlocks: "Strecha nad hlavou",
  },
  {
    level: 2,
    name: "Robotnícky dom",
    full: "Robotnícky dom (Nikiszowiec)",
    emoji: "🏚️",
    accent: "bg-orange-700",
    story:
      "Červenotehlový radový dom. Všetko v jednom trakte: kuchyňa, spálňa, detská izba pri peci.",
    unlocks: "Dvor + kôlňa",
  },
  {
    level: 3,
    name: "Rodinný dom",
    full: "Rodinný dom s dvorom",
    emoji: "🏠",
    accent: "bg-rose-500",
    story:
      "Dve poschodia, vlastné kúrenie, prvý bojler. Prababka by bola hrdá — máme vodu v byte.",
    unlocks: "Podkrovie + záhrada",
  },
  {
    level: 4,
    name: "Kamenica",
    full: "Kamenica v Śródmieście",
    emoji: "🏡",
    accent: "bg-amber-500",
    story:
      "4-poschodová mestská kamenica v centre. V prízemí kaviareň, hore nájomníci. Prvý pasívny príjem.",
    unlocks: "Obchod na prízemí",
  },
  {
    level: 5,
    name: "Solárna činžovka",
    full: "Moderná činžovka s OZE",
    emoji: "🏘️",
    accent: "bg-lime-500",
    story:
      "Solárne panely na streche, tepelné čerpadlo. Nulové faktúry, nájomníci na zozname 2 roky dopredu.",
    unlocks: "Solárna strecha + e-auto nabíjačka",
  },
  {
    level: 6,
    name: "Kancelárska budova",
    full: "Kancelárska budova (10 poschodí)",
    emoji: "🏢",
    accent: "bg-cyan-500",
    story:
      "10 poschodí, startupy ti prenajímajú priestor. BLIK plátané obedy v prízemnej reštaurácii.",
    unlocks: "PKO pobočka v lobby",
  },
  {
    level: 7,
    name: "Mrakodrap",
    full: "Katowicki mrakodrap (30 p.)",
    emoji: "🏙️",
    accent: "bg-indigo-500",
    story:
      "30 poschodí, helipad na streche. Dominancia skyline Katowíc. Teraz ti neprehliadnu.",
    unlocks: "Sky lounge + heli plocha",
  },
  {
    level: 8,
    name: "Altus Tower",
    full: "Altus Tower · Katowice (125 m)",
    emoji: "🌆",
    accent: "bg-fuchsia-500",
    story:
      "Reálna druhá najvyššia v Silesii. Tvoje meno na mosadznej tabuli vo vestibule.",
    unlocks: "Anténa + PKO logo na streche",
  },
  {
    level: 9,
    name: "Varso Tower",
    full: "Varso Tower · Warszawa (310 m)",
    emoji: "🚀",
    accent: "bg-rose-500",
    story:
      "Najvyššia budova v Európskej únii. Tak, áno — tvoje hry ťa tam dostali. Teraz ťa volajú prednášať.",
    unlocks: "Observation deck + neón na vrchu",
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
  return `${Math.round(n).toLocaleString("sk-SK")} W`;
}
