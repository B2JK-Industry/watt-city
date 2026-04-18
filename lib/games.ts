export type GameMeta = {
  id: string;
  title: string;
  tagline: string;
  category: "finance" | "math" | "memory" | "knowledge";
  xpCap: number;
  accent: string; // tailwind gradient class segment
  emoji?: string;
};

export const GAMES: GameMeta[] = [
  {
    id: "finance-quiz",
    title: "Finančný kvíz",
    tagline: "Základy osobných financií — 1 bod za správnu odpoveď.",
    category: "finance",
    xpCap: 100,
    accent: "from-amber-400 to-rose-500",
  },
  {
    id: "math-sprint",
    title: "Mat. šprint",
    tagline: "60 sekúnd. Rýchle počty. Každá správna = XP.",
    category: "math",
    xpCap: 200,
    accent: "from-sky-400 to-indigo-600",
  },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
