import { destroySession, getSession } from "@/lib/session";
import { userStats, removeUserFromAllBoards } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/user-stats";
import { levelFromXP, tierForLevel } from "@/lib/level";
import { GAMES } from "@/lib/games";
import { kvDel } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ authenticated: false });
  }
  const [board, stats] = await Promise.all([
    userStats(session.username),
    getUserStats(session.username),
  ]);
  const level = levelFromXP(board.globalXP);
  return Response.json({
    authenticated: true,
    username: session.username,
    globalXP: board.globalXP,
    globalRank: board.globalRank,
    level,
    title: `${tierForLevel(level.level).emoji} ${tierForLevel(level.level).name}`,
    games: stats.games,
    totalPlays: stats.totalPlays,
  });
}

// GDPR Article 17 ("right to erasure"): user-initiated account deletion.
// Removes the user record, per-user stats, and every leaderboard entry.
// Session cookie is destroyed so the client is effectively logged out.
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Nie jesteś zalogowany." },
      { status: 401 },
    );
  }
  const username = session.username;
  await Promise.all([
    kvDel(`xp:user:${username}`),
    kvDel(`xp:stats:${username}`),
    removeUserFromAllBoards(
      username,
      GAMES.map((g) => g.id),
    ),
  ]);
  await destroySession();
  return Response.json({
    ok: true,
    erased: {
      keys: [
        `xp:user:${username}`,
        `xp:stats:${username}`,
        "xp:leaderboard:global",
        ...GAMES.map((g) => `xp:leaderboard:game:${g.id}`),
      ],
      rightInvoked: "GDPR Art. 17 — right to erasure",
    },
  });
}
