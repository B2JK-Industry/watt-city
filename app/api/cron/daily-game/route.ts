import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/ai-pipeline/publish";
import { isCronAuthorised, cronAuthFailure } from "@/lib/cron-auth";

// Same rationale as /api/admin/rotate-ai — generate+translate can take up
// to ~45s when the real Claude pipeline is active.
export const maxDuration = 60;

// Vercel Cron → hits this once a day (0 9 * * *). Auth via
// `lib/cron-auth.ts#isCronAuthorised` — CRON_SECRET bearer or Vercel's
// cron header. Dev bypass is NODE_ENV-gated (previously this route
// would 500 instead of 401 for an anonymous dev caller because the
// pipeline tried to run without a key — caught by the Phase 2
// API-contract sweep).
export async function GET(request: NextRequest) {
  if (!isCronAuthorised(request)) return cronAuthFailure();

  const result = await runPipeline();
  if (!result.ok) {
    // Generic 500 — the detailed error is already in the Vercel logs
    // via `runPipeline`'s structured log lines. Callers don't need
    // (and shouldn't learn) the Anthropic-level failure shape.
    return Response.json(
      { ok: false, error: "pipeline-failed" },
      { status: 500 },
    );
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
