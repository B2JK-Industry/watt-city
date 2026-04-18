export type GameCategory =
  | "finance"
  | "math"
  | "memory"
  | "knowledge"
  | "reflex"
  | "energy";

export type GameMeta = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  xpCap: number;
  durationLabel: string;
  accent: string;
  emoji: string;
  ageHint?: string;
};

export const GAMES: GameMeta[] = [
  {
    id: "energy-dash",
    title: "Energy Dash",
    tagline: "Tap OZE, vyhni sa fosílom. Combo ×3.",
    description:
      "30 s reakčná hra na 4×4 mriežke. Klikaj iba obnoviteľné zdroje (slnko, vietor, voda, biomasa). Čiernych sa nedotkni. Rýchlosť rastie, combo dáva ×1.5/×2/×3. Strop 220 XP.",
    category: "energy",
    xpCap: 220,
    durationLabel: "30 s",
    accent: "from-emerald-400 via-teal-500 to-sky-600",
    emoji: "⚡",
    ageHint: "15–20",
  },
  {
    id: "power-flip",
    title: "Power Flip",
    tagline: "Ktorá voľba šetrí viac energie?",
    description:
      "Dve možnosti, 30 s na combo. LED vs klasika, trieda A vs F, pokrievka vs bez, termostat vs radiátor naplno. Učíš sa pravidlá každodennej úspory.",
    category: "energy",
    xpCap: 180,
    durationLabel: "30 s",
    accent: "from-lime-400 via-emerald-500 to-green-600",
    emoji: "💡",
    ageHint: "15–20",
  },
  {
    id: "stock-tap",
    title: "Stock Tap",
    tagline: "Kúp nízko, predaj vysoko. Live chart.",
    description:
      "45 sekúnd, živý graf ceny. Klik BUY, drž pozíciu, klik SELL v najvyššom bode. Ziskové obchody v rade = combo bonus. Stratové resetujú combo. Strop 220 XP.",
    category: "finance",
    xpCap: 220,
    durationLabel: "45 s",
    accent: "from-yellow-400 via-amber-500 to-orange-600",
    emoji: "📈",
    ageHint: "15–20",
  },
  {
    id: "budget-balance",
    title: "Budget Balance",
    tagline: "Pravidlo 50/30/20 na živých scenároch.",
    description:
      "Dostaneš mesačný príjem (student / prvá práca / rodina) a 4 kategórie. Rozdeľ 100 % tak, aby si trafil odporúčané pásma. Čím lepšie, tým viac XP (strop 160).",
    category: "finance",
    xpCap: 160,
    durationLabel: "bez časovača",
    accent: "from-cyan-400 via-blue-500 to-indigo-600",
    emoji: "📊",
    ageHint: "16+",
  },
  {
    id: "finance-quiz",
    title: "Finančný kvíz",
    tagline: "5 otázok z osobných financií.",
    description:
      "Otestuj svoje vedomosti o úveroch, úsporách, ETF, inflácii a BLIK. Za každú správnu odpoveď +20 XP a vysvetlenie, prečo je správna.",
    category: "knowledge",
    xpCap: 100,
    durationLabel: "~2 min",
    accent: "from-amber-400 via-orange-500 to-rose-500",
    emoji: "🧠",
  },
  {
    id: "math-sprint",
    title: "Matematický šprint",
    tagline: "60 s rýchlych počtov.",
    description:
      "Sčítanie, odčítanie, násobenie. Enter = odoslať. Správne +10, zle −5. Otestuj svoju mentálnu matematiku — strop 200 XP.",
    category: "math",
    xpCap: 200,
    durationLabel: "60 s",
    accent: "from-sky-400 via-indigo-500 to-purple-600",
    emoji: "⚡",
  },
  {
    id: "memory-match",
    title: "Pamäťové páry",
    tagline: "Spáruj pojem s definíciou.",
    description:
      "8 párov finančných pojmov a ich definícií. Otoč dve karty, ak sa zhodujú, ostanú odkryté. Rýchlejšie → vyššie XP.",
    category: "memory",
    xpCap: 160,
    durationLabel: "~90 s",
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    emoji: "🎴",
  },
  {
    id: "currency-rush",
    title: "Kurzový šprint",
    tagline: "Prevody mien proti času.",
    description:
      "EUR ↔ PLN ↔ USD. 45 sekúnd, čo najviac správnych odpovedí. Tolerancia ±2 %. Rýchle matematické premýšľanie v reálnych kurzoch.",
    category: "finance",
    xpCap: 180,
    durationLabel: "45 s",
    accent: "from-lime-400 via-yellow-500 to-amber-600",
    emoji: "💱",
  },
  {
    id: "word-scramble",
    title: "Premiešané slová",
    tagline: "Odkódoj finančný pojem.",
    description:
      "Písmená sú premiešané — odhaľ pôvodné poľské slovo z oblasti financií a ekonómie. 8 slov za kolo, každá správna +15 XP.",
    category: "knowledge",
    xpCap: 120,
    durationLabel: "~2 min",
    accent: "from-fuchsia-500 via-pink-500 to-rose-500",
    emoji: "🔡",
  },
];

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  finance: "Financie",
  math: "Matematika",
  memory: "Pamäť",
  knowledge: "Vedomosti",
  reflex: "Reflex",
  energy: "Energetika",
};

export const CATEGORY_ACCENTS: Record<GameCategory, string> = {
  finance: "text-lime-300 border-lime-500/40",
  math: "text-sky-300 border-sky-500/40",
  memory: "text-emerald-300 border-emerald-500/40",
  knowledge: "text-amber-300 border-amber-500/40",
  reflex: "text-rose-300 border-rose-500/40",
  energy: "text-teal-300 border-teal-500/40",
};

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
