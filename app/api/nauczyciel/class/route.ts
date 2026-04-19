import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createClass, isTeacher, listClassesFor } from "@/lib/class";

/* V4.1 — class CRUD for the signed-in teacher.
 *   GET  /api/nauczyciel/class     — list my classes
 *   POST /api/nauczyciel/class     — create a class
 */

const CreateBody = z.object({
  name: z.string().min(1).max(200),
  grade: z.number().int().min(1).max(12),
  subject: z.string().max(200).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await isTeacher(session.username))) {
    return Response.json({ ok: false, error: "not-teacher" }, { status: 403 });
  }
  const classes = await listClassesFor(session.username);
  return Response.json({ ok: true, classes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await isTeacher(session.username))) {
    return Response.json({ ok: false, error: "not-teacher" }, { status: 403 });
  }
  let body;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad-body: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const cls = await createClass({
    name: body.name,
    grade: body.grade,
    subject: body.subject ?? null,
    teacherUsername: session.username,
  });
  return Response.json({ ok: true, class: cls });
}
