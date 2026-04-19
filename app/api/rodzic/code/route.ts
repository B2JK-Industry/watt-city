import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { issueParentCode } from "@/lib/parent-link";

/* V4.6 — kid issues a parent-invite code. One-per-session for sanity,
 * TTL 24h, auto-expires. */

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { code, expiresAt } = await issueParentCode(session.username);
  return Response.json({ ok: true, code, expiresAt });
}
