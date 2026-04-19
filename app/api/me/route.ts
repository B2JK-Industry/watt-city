import { destroySession, getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/user-stats";
import { levelFromXP } from "@/lib/level";
import { cityLevelFromState } from "@/lib/city-level";
import { getPlayerState } from "@/lib/player";
import { flagForDeletion, deletionStatus } from "@/lib/soft-delete";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ authenticated: false });
  }
  const [board, stats, del, player] = await Promise.all([
    userStats(session.username),
    getUserStats(session.username),
    deletionStatus(session.username),
    getPlayerState(session.username),
  ]);
  const level = levelFromXP(board.globalXP);
  const cityLevel = cityLevelFromState(player);
  return Response.json({
    authenticated: true,
    username: session.username,
    globalXP: board.globalXP,
    globalRank: board.globalRank,
    level,
    // V3.1 — city-first title: "Level 5 · ⚡+12/h" instead of tier emoji + name.
    title: cityLevel.badgeLabel,
    cityLevel: {
      level: cityLevel.level,
      progressToNext: cityLevel.progressToNext,
      totalPoints: cityLevel.totalPoints,
      nextUnlocks: cityLevel.nextUnlocks,
      currentUnlocks: cityLevel.currentUnlocks,
      grid: cityLevel.grid,
    },
    games: stats.games,
    totalPlays: stats.totalPlays,
    deletion: del,
  });
}

// GDPR Article 17 ("right to erasure"). Phase 6.2.4 — soft-delete with a
// 30-day grace period. The cron at /api/cron/sweep-deletions finalises
// (hard-erase) once grace elapses. Logging in during grace clears the flag.
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Nie jesteś zalogowany." },
      { status: 401 },
    );
  }
  const username = session.username;
  await flagForDeletion(username);
  await destroySession();
  return Response.json({
    ok: true,
    softDelete: {
      rightInvoked: "GDPR Art. 17 — right to erasure (soft-delete, 30-day grace)",
      graceDays: 30,
      restoreBy: "log in again before 30 days elapse to cancel the deletion",
    },
  });
}
