import { getSession } from "@/lib/session";
import { getTeacher, saveTeacher } from "@/lib/class";

/* V4.1 — mark teacher tour complete server-side so the modal doesn't
 * re-appear for this teacher on another device. */

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const teacher = await getTeacher(session.username);
  if (!teacher) return Response.json({ ok: false, error: "not-teacher" }, { status: 403 });
  teacher.tourSeenAt = Date.now();
  await saveTeacher(teacher);
  return Response.json({ ok: true });
}
