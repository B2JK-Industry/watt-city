import { getSession } from "@/lib/session";
import { getPlayerState, recentLedger } from "@/lib/player";
import { userStats } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/user-stats";
import { achievementStatus } from "@/lib/achievements";
import { listFriends, listInbox, listOutgoing, readPrivacy } from "@/lib/friends";
import { listNotifications, readPrefs } from "@/lib/notifications";
import { listingHistory } from "@/lib/marketplace";
import { auditLog, getAccount } from "@/lib/pko-junior-mock";
import { deletionStatus } from "@/lib/soft-delete";
import { listChildren, listParents, readChildParentPrivacy, getRole } from "@/lib/roles";

/* GDPR Article 20 — right to data portability.
 *
 * Returns a JSON dump of everything the server stores about the caller.
 * We ship this to the user as a downloadable file via
 * `Content-Disposition: attachment`. No password hash, no other users'
 * data, and no bulk keyspace — just the caller's facts.
 */
export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const username = session.username;
  const [
    state,
    ledger,
    leaderboard,
    stats,
    achievements,
    friends,
    friendsInbox,
    friendsOutgoing,
    friendsPrivacy,
    notifs,
    notifPrefs,
    market,
    pkoAccount,
    pkoAudit,
    role,
    children,
    parents,
    childParentPrivacy,
    deletion,
  ] = await Promise.all([
    getPlayerState(username),
    recentLedger(username, 500),
    userStats(username),
    getUserStats(username),
    achievementStatus(username),
    listFriends(username),
    listInbox(username),
    listOutgoing(username),
    readPrivacy(username),
    listNotifications(username, 200),
    readPrefs(username),
    listingHistory(username, 200),
    getAccount(username),
    auditLog(username, 200),
    getRole(username),
    listChildren(username),
    listParents(username),
    readChildParentPrivacy(username),
    deletionStatus(username),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    gdpr: "Article 20 — right to data portability",
    username,
    role,
    deletion,
    player: state,
    ledger: ledger.slice(0, 500),
    leaderboard,
    userStats: stats,
    achievements: achievements
      .filter((a) => a.owned)
      .map((a) => ({ id: a.id, icon: a.def.icon })),
    friends,
    friendRequestsIncoming: friendsInbox,
    friendRequestsOutgoing: friendsOutgoing,
    friendsPrivacy,
    notifications: notifs.entries.slice(0, 200),
    notificationPrefs: notifPrefs,
    marketplaceHistory: market,
    pkoMirror: { account: pkoAccount, audit: pkoAudit },
    relationships: {
      children,
      parents,
      childParentPrivacy,
    },
    note:
      "Password hashes and other users' private data are intentionally omitted.",
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="watt-city-export-${username}-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
