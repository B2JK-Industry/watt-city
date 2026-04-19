import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getClass } from "@/lib/class";

/* V4.1 — fetch a class by id. Teacher sees full roster + metadata;
 *   student (member) sees metadata + the roster with their own privacy
 *   flags; non-member → 404. */

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const cls = await getClass(id);
  if (!cls) return Response.json({ ok: false, error: "not-found" }, { status: 404 });

  const isTeacherOfClass = cls.teacherUsername === session.username;
  const isMember = cls.studentUsernames.includes(session.username);
  if (!isTeacherOfClass && !isMember) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return Response.json({
    ok: true,
    class: cls,
    role: isTeacherOfClass ? "teacher" : "student",
  });
}
