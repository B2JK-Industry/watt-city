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
import { getSession } from "@/lib/session";
import { getRole, setRole } from "@/lib/roles";

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token === secret) return true;
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
