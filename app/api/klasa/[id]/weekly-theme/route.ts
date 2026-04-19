import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getClass, setWeeklyTheme } from "@/lib/class";

/* V4.2/V4.5 — teacher sets the class weekly theme. Body is either
 * `{ theme: null }` (clear) or `{ theme: "<short label>" }` (set).
 * Only the class's own teacher can mutate. */

const BodySchema = z.object({
  theme: z.string().max(200).nullable(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const cls = await getClass(id);
  if (!cls) return Response.json({ ok: false, error: "not-found" }, { status: 404 });
  if (cls.teacherUsername !== session.username) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return Response.json({ ok: false, error: `bad-body: ${(e as Error).message}` }, { status: 400 });
  }
  await setWeeklyTheme(id, body.theme);
  return Response.json({ ok: true });
}
