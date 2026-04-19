export type GameCategory =
  | "finance"
  | "math"
  | "memory"
  | "knowledge"
  | "reflex"
  | "energy";

export type BuildingShape = "standard" | "wide" | "tall" | "narrow";

export type Building = {
  name: string;        // In-city name: "PKO Tower"
  role: string;        // Short role line: "Wieża giełdowa"
  shape: BuildingShape;
  roof: string;        // Tailwind bg-* utility for the roof strip
  body: string;        // Tailwind bg-* utility for the walls
  glyph: string;       // Main emoji painted on the wall
  sign: string;        // Emoji on the sign board
  unlockTier?: number; // Tier >= 2 means locked until reached
};

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
  isNew?: boolean;
  hot?: boolean;
  building: Building;
};

/* Cleanup issue 1 — GAMES titles/taglines/descriptions + building.role
 * normalised to Polish (the canonical locale). Before: Slovak strings
 * leaked to PL users via landing cards, leaderboard, sin-slavy, city
 * scene tooltips, and every consumer that used `game.title` directly
 * instead of `localizedTitle(game, dict)`. Translation table per the
 * UX audit (docs/ux-audit/REPORT-2026-04-19.md issue #3).
 *
 * Per-game dict namespaces in `lib/locales/{pl,uk,cs,en}.ts` keep
 * their language-specific `headerTitle` values — `localizedTitle`
 * still prefers the dict. These strings are the safety net for direct
 * `.title` / `.tagline` reads. */
export const GAMES: GameMeta[] = [
  {
    id: "energy-dash",
    title: "Energetyczny sprint",
    tagline: "Klikaj OZE, omijaj paliwa kopalne. Combo ×3.",
    description:
      "30-sekundowa gra refleksowa na siatce 4×4. Klikaj tylko odnawialne źródła (słońce, wiatr, woda, biomasa). Czarnych (węgiel, ropa) nie dotykaj. Prędkość rośnie, combo daje ×1.5/×2/×3. Max 220 W.",
    category: "energy",
    xpCap: 220,
    durationLabel: "30 s",
    accent: "from-emerald-400 via-teal-500 to-sky-600",
    emoji: "⚡",
    ageHint: "15–20",
    isNew: true,
    hot: true,
    building: {
      name: "Silesia Solar Farm",
      role: "Farma solarna",
      shape: "wide",
      roof: "bg-emerald-400",
      body: "bg-emerald-500",
      glyph: "☀️",
      sign: "⚡",
    },
  },
  {
    id: "power-flip",
    title: "Przełącznik mocy",
    tagline: "Który wybór oszczędza więcej energii?",
    description:
      "Dwie opcje, 30 sekund na combo. LED vs klasyka, klasa A vs F, pokrywka vs bez, termostat vs grzejnik na full. Uczysz się zasad codziennej oszczędności energii.",
    category: "energy",
    xpCap: 180,
    durationLabel: "30 s",
    accent: "from-lime-400 via-emerald-500 to-green-600",
    emoji: "💡",
    ageHint: "15–20",
    isNew: true,
    building: {
      name: "Dom LED",
      role: "Showroom energetyczny",
      shape: "narrow",
      roof: "bg-[var(--neo-lime)]",
      body: "bg-lime-500",
      glyph: "💡",
      sign: "✨",
    },
  },
  {
    id: "stock-tap",
    title: "Kurs akcji",
    tagline: "Kup nisko, sprzedaj wysoko. Wykres na żywo.",
    description:
      "45 sekund, żywy wykres ceny. Klik BUY, trzymaj pozycję, klik SELL w najwyższym punkcie. Zyskowne transakcje z rzędu = bonus combo. Stratne resetują combo. Max 220 W.",
    category: "finance",
    xpCap: 220,
    durationLabel: "45 s",
    accent: "from-yellow-400 via-amber-500 to-orange-600",
    emoji: "📈",
    ageHint: "15–20",
    isNew: true,
    hot: true,
    building: {
      name: "PKO Tower",
      role: "Wieża giełdowa",
      shape: "tall",
      roof: "bg-[var(--neo-yellow)]",
      body: "bg-amber-500",
      glyph: "📈",
      sign: "🏦",
    },
  },
  {
    id: "budget-balance",
    title: "Budżet domowy",
    tagline: "Zasada 50/30/20 na żywych scenariuszach.",
    description:
      "Dostajesz miesięczny dochód (student / pierwsza praca / rodzina) i 4 kategorie. Rozdziel 100% tak, by trafić w zalecane pasma. Im lepiej, tym więcej Watów (max 160 W).",
    category: "finance",
    xpCap: 160,
    durationLabel: "bez licznika",
    accent: "from-cyan-400 via-blue-500 to-indigo-600",
    emoji: "📊",
    ageHint: "16+",
    isNew: true,
    building: {
      name: "PKO Oddział",
      role: "Oddział bankowy",
      shape: "standard",
      roof: "bg-[var(--neo-cyan)]",
      body: "bg-sky-500",
      glyph: "🏦",
      sign: "💳",
    },
  },
  {
    id: "finance-quiz",
    title: "Quiz finansowy",
    tagline: "5 pytań z finansów osobistych.",
    description:
      "Sprawdź swoją wiedzę o kredytach, oszczędzaniu, ETF, inflacji i BLIK. Za każdą poprawną odpowiedź +20 W i wyjaśnienie, dlaczego jest poprawna.",
    category: "knowledge",
    xpCap: 100,
    durationLabel: "~2 min",
    accent: "from-amber-400 via-orange-500 to-rose-500",
    emoji: "🧠",
    building: {
      name: "Biblioteka Śląska",
      role: "Biblioteka regionalna",
      shape: "wide",
      roof: "bg-amber-400",
      body: "bg-amber-600",
      glyph: "📚",
      sign: "🧠",
    },
  },
  {
    id: "math-sprint",
    title: "Sprint matematyczny",
    tagline: "60 s szybkich obliczeń.",
    description:
      "Dodawanie, odejmowanie, mnożenie. Enter = wyślij. Poprawnie +10, błędnie −5. Sprawdź swoją pamięciową matematykę — max 200 W.",
    category: "math",
    xpCap: 200,
    durationLabel: "60 s",
    accent: "from-sky-400 via-indigo-500 to-purple-600",
    emoji: "⚡",
    building: {
      name: "Instytut Matematyki",
      role: "Instytut matematyczny",
      shape: "standard",
      roof: "bg-indigo-400",
      body: "bg-indigo-500",
      glyph: "🔢",
      sign: "π",
    },
  },
  {
    id: "memory-match",
    title: "Gra pamięciowa",
    tagline: "Dopasuj pojęcie do definicji.",
    description:
      "8 par pojęć finansowych i ich definicji. Odwróć dwie karty — jeśli się zgadzają, zostają odkryte. Szybciej = wyższy wynik.",
    category: "memory",
    xpCap: 160,
    durationLabel: "~90 s",
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    emoji: "🎴",
    building: {
      name: "Muzeum Śląskie",
      role: "Muzeum regionalne",
      shape: "standard",
      roof: "bg-teal-400",
      body: "bg-teal-600",
      glyph: "🏛️",
      sign: "🎴",
    },
  },
  {
    id: "currency-rush",
    title: "Pary walutowe",
    tagline: "Przeliczenia walut na czas.",
    description:
      "EUR ↔ PLN ↔ USD. 45 sekund, jak najwięcej poprawnych odpowiedzi. Tolerancja ±2%. Szybkie matematyczne myślenie na realnych kursach.",
    category: "finance",
    xpCap: 180,
    durationLabel: "45 s",
    accent: "from-lime-400 via-yellow-500 to-amber-600",
    emoji: "💱",
    building: {
      name: "Kantor Rynek",
      role: "Kantor na Rynku",
      shape: "narrow",
      roof: "bg-yellow-400",
      body: "bg-yellow-600",
      glyph: "💱",
      sign: "€",
    },
  },
  {
    id: "word-scramble",
    title: "Litery w chaosie",
    tagline: "Odkoduj finansowe pojęcie.",
    description:
      "Litery są pomieszane — odkryj oryginalne polskie słowo z obszaru finansów i ekonomii. 8 słów na rundę, każde poprawne +15 W.",
    category: "knowledge",
    xpCap: 120,
    durationLabel: "~2 min",
    accent: "from-fuchsia-500 via-pink-500 to-rose-500",
    emoji: "🔡",
    building: {
      name: "Drukarnia",
      role: "Miejska drukarnia",
      shape: "standard",
      roof: "bg-fuchsia-400",
      body: "bg-fuchsia-600",
      glyph: "🖨️",
      sign: "🔡",
    },
  },
];

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  finance: "Finanse",
  math: "Matematyka",
  memory: "Pamięć",
  knowledge: "Wiedza",
  reflex: "Refleks",
  energy: "Energetyka",
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

// Each evergreen game has its own dict namespace for page copy; this helper
// resolves id → the localized title. Falls back to the hardcoded Polish
// title from GameMeta (now canonical post-cleanup) if the dict lookup misses.
const ID_TO_DICT_KEY: Record<string, string> = {
  "energy-dash": "energy",
  "power-flip": "power",
  "stock-tap": "stock",
  "budget-balance": "budget",
  "finance-quiz": "finance",
  "math-sprint": "math",
  "memory-match": "memory",
  "currency-rush": "currency",
  "word-scramble": "word",
};

// Dict here is structurally loose because the full Dict type mixes nested
// objects + arrays (aboutPage.roadmap etc.); we only care about the
// per-game sub-dicts, each of which has `headerTitle: string`.
type DictLike = {
  [ns: string]:
    | undefined
    | {
        headerTitle?: string;
        [k: string]: unknown;
      }
    | unknown;
};

export function localizedTitle(game: GameMeta, dict: DictLike): string {
  const key = ID_TO_DICT_KEY[game.id];
  if (!key) return game.title;
  const ns = dict[key] as { headerTitle?: string } | undefined;
  return ns?.headerTitle ?? game.title;
}
