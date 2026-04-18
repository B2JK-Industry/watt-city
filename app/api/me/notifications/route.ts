import { getSession } from "@/lib/session";
import {
  listNotifications,
  markAllSeen,
  readPrefs,
  writePrefs,
  type NotificationSettings,
} from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [feed, prefs] = await Promise.all([
    listNotifications(session.username, 50),
    readPrefs(session.username),
  ]);
  return Response.json({ ok: true, ...feed, prefs });
}

// POST { action: "mark-seen" | "set-prefs", prefs?: NotificationSettings }
export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { action?: string; prefs?: Partial<NotificationSettings> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (body.action === "mark-seen") {
    await markAllSeen(session.username);
    return Response.json({ ok: true });
  }
  if (body.action === "set-prefs" && body.prefs) {
    const next = await writePrefs(session.username, body.prefs);
    return Response.json({ ok: true, prefs: next });
  }
  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
