import { getSession } from "@/lib/session";
import { tickPlayer } from "@/lib/tick";

// Manual tick trigger — useful for debugging, cron backstop, and the UI's
// "refresh cashflow" button. Safe to call repeatedly (idempotent by hour).
export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await tickPlayer(session.username);
  return Response.json({ ok: true, ...result });
}
