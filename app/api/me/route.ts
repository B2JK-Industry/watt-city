import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/user-stats";
import { levelFromXP, titleForLevel } from "@/lib/level";

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
    title: titleForLevel(level.level),
    games: stats.games,
    totalPlays: stats.totalPlays,
  });
}
