export type ScoreSuccess = {
  ok: true;
  awarded: number;
  globalXP: number;
  gameXP: number;
  globalRank: number | null;
  level: {
    level: number;
    xpIntoLevel: number;
    xpForLevel: number;
    xpToNext: number;
    progress: number;
  };
  gameStats: {
    plays: number;
    bestScore: number;
    totalScore: number;
    lastPlayedAt: number;
  };
  isNewBest: boolean;
  previousBest: number;
  delta: number;
};

export type ScoreFailure = { ok: false; error: string };

export type ScoreResponse = ScoreSuccess | ScoreFailure;

export async function submitScore(
  gameId: string,
  xp: number,
): Promise<ScoreResponse> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ gameId, xp: Math.max(0, Math.floor(xp)) }),
  });
  try {
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error ?? "Nepodarilo sa zapísať skóre." };
    }
    return json as ScoreSuccess;
  } catch {
    return { ok: false, error: "Neplatná odpoveď servera." };
  }
}
