import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { findClassByCode, joinClass } from "@/lib/class";

/* V4.1 — student joins a class via 6-char code. */

const BodySchema = z.object({
  code: z.string().min(4).max(16),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad-body: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const cls = await findClassByCode(body.code.trim().toUpperCase());
  if (!cls) {
    return Response.json({ ok: false, error: "invalid-code" }, { status: 404 });
  }
  const result = await joinClass(cls.id, session.username);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 409 });
  }
  return Response.json({ ok: true, classId: cls.id, className: cls.name });
}
