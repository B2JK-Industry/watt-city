import { getSession } from "@/lib/session";
import { achievementStatus, sweepAchievements } from "@/lib/achievements";

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // Sweep first so newly-earned achievements surface on the next page load.
  const newly = await sweepAchievements(session.username);
  const status = await achievementStatus(session.username);
  return Response.json({ ok: true, achievements: status, newly });
}
