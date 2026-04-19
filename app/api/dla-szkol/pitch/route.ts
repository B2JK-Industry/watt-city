import { NextRequest } from "next/server";
import { generatePitchBrochure } from "@/lib/pitch-pdf";

/* V4.7 — school pitch brochure download.
 *   GET /api/dla-szkol/pitch?locale=pl  (or en)
 *   → streams the 1-page PDF.
 * Public — no auth required; this is the marketing hand-out. */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const loc = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "pl";
  const pdf = await generatePitchBrochure(loc);
  const filename = `watt-city-school-pitch-${loc}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
