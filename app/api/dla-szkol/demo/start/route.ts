import { NextRequest } from "next/server";
import {
  seedDemoSchool,
  isDemoSeedPresent,
  DEMO_TEACHER_USERNAME,
} from "@/lib/demo-seed";
import { createSession } from "@/lib/session";
import { isFlagEnabled } from "@/lib/feature-flags";

/* D4 — 1-click demo start for the PKO pitch.
 *
 *   POST /api/dla-szkol/demo/start
 *
 * Visitor hits /dla-szkol/demo, clicks "Rozpocznij demo". Route:
 *   1. If seed is absent, runs `seedDemoSchool()` (idempotent, sentinel-
 *      gated) so the demo class + 30 students + activity exist.
 *   2. Creates a session cookie for `demo-teacher-pl`.
 *   3. Returns 200 with the landing URL so the client can redirect.
 *
 * No admin secret required — this is a public, one-click demo. The
 * underlying seed call is still idempotent + sentinel-gated, so hitting
 * this 1000x a day only actually seeds once. Flag `v4_demo_seed` acts
 * as a belt-and-suspenders off-switch.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const allowed = await isFlagEnabled("v4_demo_seed", "anon");
  if (!allowed) {
    return Response.json(
      { ok: false, error: "demo-disabled" },
      { status: 503 },
    );
  }

  try {
    if (!(await isDemoSeedPresent())) {
      await seedDemoSchool();
    }
    await createSession(DEMO_TEACHER_USERNAME);
    return Response.json({
      ok: true,
      username: DEMO_TEACHER_USERNAME,
      redirectTo: "/nauczyciel",
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: `seed-failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
