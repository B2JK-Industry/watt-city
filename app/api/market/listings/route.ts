import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { listActiveListings } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const catalogId = url.searchParams.get("catalog") ?? undefined;
  const listings = await listActiveListings({ catalogId });
  return Response.json({ ok: true, listings });
}
