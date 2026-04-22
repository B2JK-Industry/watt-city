/* Admin auth — Phase 5.1.
 *
 * Two paths into admin surfaces:
 *  1. The user has `role === "admin"` (set via setRole).
 *  2. The request carries `Authorization: Bearer $ADMIN_SECRET`.
 * Either grants access. Both paths apply per request — no session-
 * persisted admin flag beyond the role (so revoking the role kicks the
 * user out on next request).
 */

import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/session";
import { getRole, setRole } from "@/lib/roles";

/** Constant-time bearer-token compare. Prevents a network-timing
 *  attacker from probing `ADMIN_SECRET` byte-by-byte via response
 *  latency (the old `token === secret` short-circuited on the first
 *  mismatched char). Length mismatch returns false before
 *  `timingSafeEqual` is called — we'd need equal-length buffers
 *  anyway — and does not reveal the secret's length beyond what a
 *  single query already learns. */
function safeTokenEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (safeTokenEqual(token, secret)) return true;
  }
  const session = await getSession();
  if (!session) return false;
  return (await getRole(session.username)) === "admin";
}

export async function requireAdmin(
  request: NextRequest,
): Promise<Response | null> {
  if (await isAdminRequest(request)) return null;
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function promoteToAdmin(username: string): Promise<void> {
  await setRole(username, "admin");
}
