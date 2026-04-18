// Level curve: level L starts at 50 * (L-1)^2 XP.
// L1=0, L2=50, L3=200, L4=450, L5=800, L6=1250, L7=1800, L8=2450, ...
export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  progress: number; // 0..1
};

export function levelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / 50)) + 1;
  const levelStart = 50 * (level - 1) ** 2;
  const levelEnd = 50 * level ** 2;
  const span = levelEnd - levelStart;
  const xpIntoLevel = safe - levelStart;
  const xpToNext = Math.max(0, levelEnd - safe);
  const progress = span > 0 ? Math.min(1, xpIntoLevel / span) : 0;
  return {
    level,
    xpIntoLevel,
    xpForLevel: span,
    xpToNext,
    progress,
  };
}

export function titleForLevel(level: number): string {
  if (level >= 30) return "Legenda";
  if (level >= 20) return "Veľmajster";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Šampión";
  if (level >= 7) return "Veterán";
  if (level >= 5) return "Skúsený";
  if (level >= 3) return "Hráč";
  return "Nováčik";
}
