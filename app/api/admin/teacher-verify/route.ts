import { NextRequest } from "next/server";
import { z } from "zod";
import { markTeacherVerified } from "@/lib/class";

/* PR-P G-14 follow-up — admin shortcut to flip a teacher's `verified`
 * flag without going through the email link. Used by the e2e suite
 * (golden-paths #5 class mode) to bypass the verify gate. ADMIN_SECRET
 * is the primary guard; local dev without the secret is allowed
 * (matches the pattern in `seed-demo-school` and other admin
 * endpoints).
 *
 * POST { username } with `Authorization: Bearer $ADMIN_SECRET`.
 */

const BodySchema = z.object({
  username: z.string().min(1).max(64),
});

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function checkSecret(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return true;
  const authz = req.headers.get("authorization") ?? "";
  return authz === `Bearer ${expected}`;
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized();
  let parsed;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad-body: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  await markTeacherVerified(parsed.username);
  return Response.json({ ok: true, verified: true });
}
