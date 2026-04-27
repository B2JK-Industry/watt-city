/* G-14 — teacher email verification token store.
 *
 * Single-use 24h-TTL tokens stored in Redis (or memory KV in dev).
 * Issued at signup, consumed at /verify?token=…. The token is
 * opaque (32-byte URL-safe base64); we don't expose the username
 * in the URL because that would leak teacher emails to anyone who
 * can see browser history.
 *
 * Threat model: a leaked token grants verification on the matching
 * teacher account. 24h TTL bounds the blast radius; single-use
 * (we delete on consume) prevents replay. The token does NOT grant
 * session — verification just flips the `verified` flag.
 */

import { kvSet, kvGet, kvDel } from "@/lib/redis";

const TOKEN_KEY = (token: string) => `xp:teacher-verify:${token}`;
const TTL_SECONDS = 60 * 60 * 24; // 24 h

export type TeacherVerifyPayload = {
  username: string;
  email: string;
  createdAt: number;
};

/** Generate an opaque URL-safe token. 32 bytes of entropy → 43-char
 *  base64url string. Web Crypto is available in the Edge runtime. */
function randomToken(byteLen = 32): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  // Manual base64url to avoid Node `Buffer` (Edge-incompatible).
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function openTeacherVerification(
  username: string,
  email: string,
): Promise<{ token: string }> {
  const token = randomToken();
  const payload: TeacherVerifyPayload = {
    username,
    email,
    createdAt: Date.now(),
  };
  await kvSet(TOKEN_KEY(token), payload, { ex: TTL_SECONDS });
  return { token };
}

export async function consumeTeacherVerification(
  token: string,
): Promise<TeacherVerifyPayload | null> {
  const payload = await kvGet<TeacherVerifyPayload>(TOKEN_KEY(token));
  if (!payload) return null;
  // Single-use — delete BEFORE returning so a parallel double-click
  // can't redeem twice.
  await kvDel(TOKEN_KEY(token));
  return payload;
}
