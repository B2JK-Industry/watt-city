/* Friends system — Phase 3.1.
 *
 * Friendship is symmetric but requires a pending→accepted handshake. Data:
 *   xp:user:<u>:friends         = set of confirmed friend usernames
 *   xp:user:<u>:friend-requests = set of pending outgoing requests
 *   xp:user:<u>:friend-inbox    = set of pending incoming requests
 *   xp:user:<u>:friend-privacy  = JSON { profileVisibility, cashflowVisible }
 * When Alice sends a request to Bob:
 *   - Alice's :friend-requests gains "bob"
 *   - Bob's :friend-inbox gains "alice"
 *   - Bob accepts → both get mirrored into :friends; both request/inbox sets
 *     drop the entry.
 * Symmetry is enforced at write time; we don't trust either side alone.
 */

import { kvGet, kvSet, sAdd, sHas } from "@/lib/redis";
import { pushNotification } from "@/lib/notifications";

type FriendSetKind = "friends" | "requests" | "inbox";

function keyFor(kind: FriendSetKind, username: string): string {
  if (kind === "friends") return `xp:user:${username}:friends`;
  if (kind === "requests") return `xp:user:${username}:friend-requests`;
  return `xp:user:${username}:friend-inbox`;
}

const LIST_KEY = (kind: FriendSetKind, username: string) =>
  `${keyFor(kind, username)}:list`;

const PRIVACY_KEY = (u: string) => `xp:user:${u}:friend-privacy`;

export type PrivacySettings = {
  /** Who can view public profile: anyone, friends, or just-me. Default
   *  per GDPR-K is "friends" — opt-in visibility for kid accounts. */
  profileVisibility: "public" | "friends" | "private";
  /** Show cashflow/resource totals on profile? Default false per
   *  "hide cashflow numbers" (backlog 3.1.5). */
  cashflowVisible: boolean;
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: "friends",
  cashflowVisible: false,
};

async function addToSet(kind: FriendSetKind, user: string, other: string) {
  const added = await sAdd(keyFor(kind, user), other);
  if (!added) return false;
  // Mirror in a JSON list so we can enumerate cheaply.
  const list = (await kvGet<string[]>(LIST_KEY(kind, user))) ?? [];
  if (!list.includes(other)) {
    await kvSet(LIST_KEY(kind, user), [...list, other]);
  }
  return true;
}

async function removeFromSet(kind: FriendSetKind, user: string, other: string) {
  // Our redis helpers don't expose SREM; we simulate by rebuilding the list
  // and invalidating the set membership via list-as-truth. The set (SADD) is
  // only consulted by `sHas` — since we always write both, the list is the
  // canonical view.
  const list = (await kvGet<string[]>(LIST_KEY(kind, user))) ?? [];
  const next = list.filter((x) => x !== other);
  await kvSet(LIST_KEY(kind, user), next);
  // We can't easily remove from the SADD set across stores without SREM.
  // Workaround: re-key the set (replace with a fresh SADD'd one via list).
  // For MVP: rely on list as the enumeration source; the SADD set is just a
  // fast existence check and is tolerated-stale. `isFriend` et al. consult the
  // list instead.
  return list.length !== next.length;
}

async function inList(kind: FriendSetKind, user: string, other: string) {
  const list = (await kvGet<string[]>(LIST_KEY(kind, user))) ?? [];
  return list.includes(other);
}

export async function listFriends(username: string): Promise<string[]> {
  return (await kvGet<string[]>(LIST_KEY("friends", username))) ?? [];
}

export async function listInbox(username: string): Promise<string[]> {
  return (await kvGet<string[]>(LIST_KEY("inbox", username))) ?? [];
}

export async function listOutgoing(username: string): Promise<string[]> {
  return (await kvGet<string[]>(LIST_KEY("requests", username))) ?? [];
}

export async function isFriend(a: string, b: string): Promise<boolean> {
  return await inList("friends", a, b);
}

// ---------------------------------------------------------------------------
// Send / accept / reject / remove
// ---------------------------------------------------------------------------

export type FriendOpResult = { ok: true } | { ok: false; error: string };

export async function sendFriendRequest(
  from: string,
  to: string,
): Promise<FriendOpResult> {
  if (from === to) return { ok: false, error: "cannot-friend-self" };
  const userRec = await kvGet(`xp:user:${to}`);
  if (!userRec) return { ok: false, error: "unknown-user" };
  if (await inList("friends", from, to)) return { ok: false, error: "already-friends" };
  if (await inList("requests", from, to))
    return { ok: false, error: "already-requested" };
  // If `to` already has a request FROM `from` in their inbox we skip the
  // mirror; if there's a reverse request (to→from in their requests + from's
  // inbox) we auto-accept — friends can handshake from either side.
  if (await inList("inbox", from, to)) {
    // `from` already has request from `to` in inbox → auto-accept
    return await acceptFriendRequest(from, to);
  }
  await addToSet("requests", from, to);
  await addToSet("inbox", to, from);
  await pushNotification(to, {
    kind: "friend-request",
    title: `Zaproszenie od ${from}`,
    body: `${from} chce się zaprzyjaźnić w Watt City.`,
    href: "/friends",
    meta: { from },
  });
  return { ok: true };
}

export async function acceptFriendRequest(
  self: string,
  requester: string,
): Promise<FriendOpResult> {
  if (!(await inList("inbox", self, requester)))
    return { ok: false, error: "no-such-request" };
  await addToSet("friends", self, requester);
  await addToSet("friends", requester, self);
  await removeFromSet("inbox", self, requester);
  await removeFromSet("requests", requester, self);
  await pushNotification(requester, {
    kind: "friend-accepted",
    title: `${self} zaakceptował zaproszenie`,
    body: "Możecie teraz odwiedzać swoje miasta.",
    href: "/friends",
    meta: { other: self },
  });
  return { ok: true };
}

export async function rejectFriendRequest(
  self: string,
  requester: string,
): Promise<FriendOpResult> {
  if (!(await inList("inbox", self, requester)))
    return { ok: false, error: "no-such-request" };
  await removeFromSet("inbox", self, requester);
  await removeFromSet("requests", requester, self);
  return { ok: true };
}

export async function removeFriend(
  self: string,
  other: string,
): Promise<FriendOpResult> {
  if (!(await inList("friends", self, other)))
    return { ok: false, error: "not-friends" };
  await removeFromSet("friends", self, other);
  await removeFromSet("friends", other, self);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

export async function readPrivacy(username: string): Promise<PrivacySettings> {
  const existing = await kvGet<Partial<PrivacySettings>>(PRIVACY_KEY(username));
  return { ...DEFAULT_PRIVACY, ...(existing ?? {}) };
}

export async function writePrivacy(
  username: string,
  patch: Partial<PrivacySettings>,
): Promise<PrivacySettings> {
  const next = { ...(await readPrivacy(username)), ...patch };
  await kvSet(PRIVACY_KEY(username), next);
  return next;
}

/** True when `viewer` (may be null for anonymous) may see `target`'s profile. */
export async function canViewProfile(
  target: string,
  viewer: string | null,
): Promise<boolean> {
  const privacy = await readPrivacy(target);
  if (privacy.profileVisibility === "public") return true;
  if (!viewer) return false;
  if (viewer === target) return true;
  if (privacy.profileVisibility === "private") return false;
  return await isFriend(target, viewer);
}
