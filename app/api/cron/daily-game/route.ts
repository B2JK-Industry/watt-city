import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/ai-pipeline/publish";

// Vercel Cron → hits this every 6 hours. Protected by a shared secret
// (set CRON_SECRET on Vercel; Vercel Cron sends Authorization: Bearer <secret>).
// Manual trigger is allowed from the same deployment if you pass the header.
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (expected) {
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token !== expected && !isVercelCron) {
      return Response.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  const result = await runPipeline();
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }
  return Response.json({
    ok: true,
    publishedId: result.game.id,
    theme: result.game.theme,
    model: result.game.model,
    validUntil: result.game.validUntil,
    evicted: result.evicted,
  });
}
