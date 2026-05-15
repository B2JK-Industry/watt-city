import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getRole } from "@/lib/roles";
import { verifyCsrf } from "@/lib/csrf";
import { recordDecision, type ReviewDecision } from "@/lib/ai-review";

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

const Body = z.object({
  decision: z.enum(["approve", "request-changes", "reject"]),
  reason: z.string().max(500).optional(),
});

/* POST /api/admin/review/[id]
 *
 * Record reviewer decision (approve / request-changes / reject) for a
 * specific AI mission. Internal Review §09 governance surface.
 *
 * Side effect on `reject`: mission is pulled from live index immediately.
 * `approve` and `request-changes` are audit-only in the current
 * post-publish-review implementation.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getSession();
  const bearerOk = adminBearerOk(req);

  if (!session && !bearerOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let reviewerUsername: string;
  if (bearerOk) {
    reviewerUsername = "ops:bearer";
  } else if (session) {
    const role = await getRole(session.username);
    if (role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!(await verifyCsrf(req))) {
      return NextResponse.json({ error: "csrf-failed" }, { status: 403 });
    }
    reviewerUsername = session.username;
  } else {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-body", details: parsed.error.message },
      { status: 400 },
    );
  }

  const result = await recordDecision({
    gameId: id,
    decision: parsed.data.decision as ReviewDecision,
    reviewer: reviewerUsername,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    record: result.record,
    sideEffect: result.sideEffect ?? null,
  });
}
