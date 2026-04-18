import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { cancelListing } from "@/lib/marketplace";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await cancelListing(session.username, id);
  if (!result.ok) return Response.json(result, { status: 400 });
  return Response.json(result);
}
