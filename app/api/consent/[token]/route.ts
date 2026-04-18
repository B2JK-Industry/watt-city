import { NextRequest } from "next/server";
import { grantConsent } from "@/lib/gdpr-k";

// Parent clicks the link in the dispatched email; the token resolves to
// their kid's pending consent record. A GET preview returns the kid's
// username + a note; a POST grants. Rate-limited via cookie-less form
// submission would need further thinking; for MVP the token itself is
// high-entropy (24 bytes) so guessing is infeasible.

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const r = await grantConsent(token);
  if (!r.ok) return Response.json(r, { status: 400 });
  return Response.json(r);
}
