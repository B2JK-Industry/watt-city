import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { isParentOf, readChildParentPrivacy } from "@/lib/roles";
import { getPlayerState, recentLedger } from "@/lib/player";
import { userStats } from "@/lib/leaderboard";
import { achievementStatus } from "@/lib/achievements";
import { computePlayerTier } from "@/lib/buildings";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { username } = await params;
  if (!(await isParentOf(session.username, username))) {
    return Response.json({ ok: false, error: "not-linked" }, { status: 403 });
  }
  const privacy = await readChildParentPrivacy(username);
  const [state, stats, achievements] = await Promise.all([
    getPlayerState(username),
    userStats(username),
    achievementStatus(username),
  ]);
  const tier = computePlayerTier(state.buildings);
  // Respect the child's per-parent privacy filters.
  const visibleLedger = privacy.hideLedger ? [] : await recentLedger(username, 30);
  const visibleBuildings = privacy.hideBuildings ? [] : state.buildings;
  return Response.json({
    ok: true,
    child: {
      username,
      displayName: state.profile?.displayName ?? username,
      avatar: state.profile?.avatar,
      tier,
      globalXP: stats.globalXP,
      globalRank: stats.globalRank,
      creditScore: state.creditScore,
      achievements: achievements.filter((a) => a.owned).map((a) => a.id),
      resources: state.resources,
      buildings: visibleBuildings,
      ledger: visibleLedger,
    },
    privacy,
  });
}
