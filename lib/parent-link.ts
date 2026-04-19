/* V4.6 — parent ↔ kid linking via short-lived invite codes.
 *
 * Kid: /profile → "Zaproś rodzica" → 6-char code with 24h TTL.
 * Parent: /rodzic/dolacz → enter code → linked.
 * Link is observer-only; parent sees the kid's dashboard stripped of
 * anything the kid has marked private.
 */

import { kvGet, kvSet, kvDel, sAdd, sMembers, sRem } from "@/lib/redis";

export const PARENT_CODE_TTL_SECONDS = 24 * 60 * 60; // 24h
export const PARENT_CODE_KEY = (code: string) => `xp:parent-code:${code}`;
export const PARENT_LINKS_KEY = (kidUsername: string) => `xp:parent-links:${kidUsername}`;
export const KID_OF_PARENT_KEY = (parentUsername: string) =>
  `xp:kid-of-parent:${parentUsername}`; // one kid per parent for MVP

function generateCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(6))]
    .map((b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 30])
    .join("");
}

/** Kid issues a parent-invite code. Returns `{ code, expiresAt }`. */
export async function issueParentCode(
  kidUsername: string,
): Promise<{ code: string; expiresAt: number }> {
  // Collision-check with up to 5 retries.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const taken = await kvGet<string>(PARENT_CODE_KEY(code));
    if (taken) continue;
    const expiresAt = Date.now() + PARENT_CODE_TTL_SECONDS * 1000;
    await kvSet(PARENT_CODE_KEY(code), kidUsername, {
      ex: PARENT_CODE_TTL_SECONDS,
    });
    return { code, expiresAt };
  }
  // Fallback: timestamp-based
  const fallback = `P${Date.now().toString(36).slice(-5).toUpperCase()}`;
  const expiresAt = Date.now() + PARENT_CODE_TTL_SECONDS * 1000;
  await kvSet(PARENT_CODE_KEY(fallback), kidUsername, {
    ex: PARENT_CODE_TTL_SECONDS,
  });
  return { code: fallback, expiresAt };
}

/** Parent redeems the code → persistent link. One kid per parent (MVP). */
export async function redeemParentCode(
  code: string,
  parentUsername: string,
): Promise<
  | { ok: true; kidUsername: string }
  | { ok: false; error: "invalid-or-expired" | "parent-already-linked" }
> {
  const kid = await kvGet<string>(PARENT_CODE_KEY(code.toUpperCase()));
  if (!kid) return { ok: false, error: "invalid-or-expired" };
  const existing = await kvGet<string>(KID_OF_PARENT_KEY(parentUsername));
  if (existing && existing !== kid) {
    return { ok: false, error: "parent-already-linked" };
  }
  await sAdd(PARENT_LINKS_KEY(kid), parentUsername);
  await kvSet(KID_OF_PARENT_KEY(parentUsername), kid);
  await kvDel(PARENT_CODE_KEY(code.toUpperCase())); // one-shot
  return { ok: true, kidUsername: kid };
}

export async function parentKidUsername(
  parentUsername: string,
): Promise<string | null> {
  return await kvGet<string>(KID_OF_PARENT_KEY(parentUsername));
}

export async function listParentsOf(
  kidUsername: string,
): Promise<string[]> {
  return await sMembers(PARENT_LINKS_KEY(kidUsername));
}

export async function unlinkParent(
  kidUsername: string,
  parentUsername: string,
): Promise<void> {
  await sRem(PARENT_LINKS_KEY(kidUsername), parentUsername);
  const current = await kvGet<string>(KID_OF_PARENT_KEY(parentUsername));
  if (current === kidUsername) {
    await kvDel(KID_OF_PARENT_KEY(parentUsername));
  }
}
