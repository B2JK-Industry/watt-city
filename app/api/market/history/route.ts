import { getSession } from "@/lib/session";
import { listingHistory } from "@/lib/marketplace";

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const history = await listingHistory(session.username, 50);
  return Response.json({ ok: true, history });
}
