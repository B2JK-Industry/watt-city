export type BudgetTarget = {
  id: "needs" | "savings" | "investments" | "fun";
  label: string;
  hint: string;
  min: number; // percent
  max: number; // percent
  emoji: string;
};

export type BudgetScenario = {
  id: string;
  title: string;
  persona: string;
  income: number; // monthly, PLN
  targets: BudgetTarget[];
  takeaway: string;
};

// Pravidlo 50/30/20 ohnuté do 4 kategórií: potreby, zábava, úspory, investície.
export const SCENARIOS: BudgetScenario[] = [
  {
    id: "student",
    title: "Student — 1800 zł/mes",
    persona:
      "Študuješ na vysokej, bývaš na internáte. Chceš si začať odkladať a občas zainvestovať.",
    income: 1800,
    targets: [
      {
        id: "needs",
        label: "Potreby",
        hint: "Nájom, strava, doprava, škola",
        min: 45,
        max: 65,
        emoji: "🏠",
      },
      {
        id: "fun",
        label: "Zábava",
        hint: "Pivo, kino, hry, výlety",
        min: 10,
        max: 25,
        emoji: "🎮",
      },
      {
        id: "savings",
        label: "Úspory",
        hint: "Núdzový fond — cieľ 3× mesačné výdavky",
        min: 10,
        max: 20,
        emoji: "💰",
      },
      {
        id: "investments",
        label: "Investície",
        hint: "ETF, IKE — dlhý horizont",
        min: 5,
        max: 15,
        emoji: "📈",
      },
    ],
    takeaway:
      "Aj pri skromnom príjme platí pay-yourself-first: 10 % do úspor a 5 % do investícií kým žiješ s rodičmi/internátom je obrovská fora do dospelosti.",
  },
  {
    id: "first-job",
    title: "Prvá práca — 4500 zł/mes",
    persona:
      "Prvý plný úväzok po škole. Bývaš zatiaľ lacno, nemáš auto ani deti.",
    income: 4500,
    targets: [
      {
        id: "needs",
        label: "Potreby",
        hint: "Nájom, strava, doprava, faktúry",
        min: 40,
        max: 55,
        emoji: "🏠",
      },
      {
        id: "fun",
        label: "Zábava",
        hint: "Jedlá mimo domu, voľný čas, oblečenie",
        min: 15,
        max: 30,
        emoji: "🎮",
      },
      {
        id: "savings",
        label: "Úspory",
        hint: "Núdzový fond 6 mesiacov, väčšie ciele",
        min: 15,
        max: 25,
        emoji: "💰",
      },
      {
        id: "investments",
        label: "Investície",
        hint: "Pravidelné ETF, IKE/IKZE — dôchodok",
        min: 10,
        max: 20,
        emoji: "📈",
      },
    ],
    takeaway:
      "Keď nemáš záväzky, úspora 20–25 % príjmu cieli na zlatý štandard 50/30/20 — a ETF portfólio z 20-tky ti v 60 rokoch robí zázraky.",
  },
  {
    id: "family",
    title: "Rodina + hypotéka — 9000 zł/mes",
    persona:
      "Domácnosť s príjmom 9000 zł, hypotéka, malé dieťa. Rozpočet je napätejší.",
    income: 9000,
    targets: [
      {
        id: "needs",
        label: "Potreby",
        hint: "Hypotéka, strava, doprava, dieťa, poistenie",
        min: 55,
        max: 70,
        emoji: "🏠",
      },
      {
        id: "fun",
        label: "Zábava",
        hint: "Rodinný voľný čas, hobby",
        min: 10,
        max: 20,
        emoji: "🎮",
      },
      {
        id: "savings",
        label: "Úspory",
        hint: "Núdzový fond + rezerva na opravy",
        min: 10,
        max: 20,
        emoji: "💰",
      },
      {
        id: "investments",
        label: "Investície",
        hint: "Dôchodkové + vzdelanie dieťaťa",
        min: 5,
        max: 15,
        emoji: "📈",
      },
    ],
    takeaway: `Aj pri fixných nákladoch (hypotéka) sa oplatí minimum 10 % do úspor a 5 % do investícií. Menej, ale dlhodobo, porazí „odložím keď ostane".`,
  },
];

export const XP_CAP = 160;
