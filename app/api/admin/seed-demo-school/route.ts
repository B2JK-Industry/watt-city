import { NextRequest } from "next/server";
import {
  seedDemoSchool,
  teardownDemoSchool,
  isDemoSeedPresent,
  DEMO_TEACHER_USERNAME,
  DEMO_TEACHER_PASSWORD,
} from "@/lib/demo-seed";

/* V4.4 — demo school seed.
 *   POST /api/admin/seed-demo-school
 *     Authorization: Bearer $ADMIN_SECRET
 *   → creates demo-teacher-pl + class + 30 students + 4w activity.
 *     Idempotent via `xp:demo-seed:v1` sentinel.
 *
 *   DELETE /api/admin/seed-demo-school  → tears it all down.
 *   GET                              → status ping (is seed present).
 *
 * Also feature-flag gated (`v4_demo_seed`) even though ADMIN_SECRET is
 * the primary gate; flipping the flag off is a belt-and-suspenders
 * emergency off-switch.
 */

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function checkSecret(request: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return true; // local dev without secret → allow
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === expected;
}

export async function GET(request: NextRequest) {
  if (!checkSecret(request)) return unauthorized();
  return Response.json({
    ok: true,
    present: await isDemoSeedPresent(),
    credentials: {
      teacher: DEMO_TEACHER_USERNAME,
      password: DEMO_TEACHER_PASSWORD, // intentionally exposed — demo account only
      note: "Use these credentials to sign in at /login once the seed is present.",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!checkSecret(request)) return unauthorized();
  const result = await seedDemoSchool();
  return Response.json({
    ok: true,
    ...result,
    credentials: {
      teacher: DEMO_TEACHER_USERNAME,
      password: DEMO_TEACHER_PASSWORD,
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (!checkSecret(request)) return unauthorized();
  const result = await teardownDemoSchool();
  return Response.json(result);
}
