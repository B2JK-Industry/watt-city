import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/session";
import { getRole } from "@/lib/roles";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { specKind } from "@/lib/ai-pipeline/types";
import { summariseAuditLog, recentAudit } from "@/lib/ai-review";

export const dynamic = "force-dynamic";

function adminBearerOk(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/* GET /api/admin/review
 *
 * Returns the current reviewer queue (all live AI missions) + audit
 * summary + recent decisions. Accessible by role=admin (session) or by
 * ADMIN_SECRET Bearer (ops/scripts). Internal Review §09 surface.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  const bearerOk = adminBearerOk(req);
  if (!session && !bearerOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session && !bearerOk) {
    const role = await getRole(session.username);
    if (role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const [games, summary, audit] = await Promise.all([
    listActiveAiGames(),
    summariseAuditLog(30),
    recentAudit(20),
  ]);

  const queue = games
    .map((g) => ({
      id: g.id,
      title: g.title,
      kind: specKind(g.spec),
      theme: g.theme,
      model: g.model,
      generatedAt: g.generatedAt,
      validUntil: g.validUntil,
      rotationSlot: g.rotationSlot ?? "fast",
      titleLocalized: g.titleLocalized,
    }))
    .sort((a, b) => b.generatedAt - a.generatedAt);

  return NextResponse.json({ queue, summary, audit });
}
