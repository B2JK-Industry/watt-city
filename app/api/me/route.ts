import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ authenticated: false });
  }
  const stats = await userStats(session.username);
  return Response.json({
    authenticated: true,
    username: session.username,
    ...stats,
  });
}
