import { NextRequest } from "next/server";
import { rotateIfDue } from "@/lib/ai-pipeline/publish";
import { isCronAuthorised, cronAuthFailure } from "@/lib/cron-auth";

// Same rationale as /api/admin/rotate-ai — generate+translate can take up
// to ~45s when the real Claude pipeline is active. With 3-slot parallel
// rotation the worst case is 3 simultaneous pipelines, but they run in
// parallel (Promise.all in `rotateIfDue`) so wall time stays in the same
// envelope.
export const maxDuration = 60;

// Vercel Cron → hits this once a day (0 9 * * *). Auth via
// `lib/cron-auth.ts#isCronAuthorised` — CRON_SECRET bearer or Vercel's
// cron header. Dev bypass is NODE_ENV-gated (previously this route
// would 500 instead of 401 for an anonymous dev caller because the
// pipeline tried to run without a key — caught by the Phase 2
// API-contract sweep).
//
// 3-slot rotation: this endpoint now mirrors /api/cron/rotate-if-due — it
// iterates fast/medium/slow and returns an aggregate. Keeping the two routes
// behaviourally identical avoids a second code path with slightly different
// semantics; the separate URL remains so the daily Vercel Cron manifest and
// any external uptime monitors pointing here don't need re-wiring.
async function handle(request: NextRequest): Promise<Response> {
  if (!isCronAuthorised(request)) return cronAuthFailure();

  const result = await rotateIfDue();
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
    publishedId: result.published,
    theme: result.theme,
    rotated: result.rotated,
    skipped: result.skipped,
    slots: result.slots,
  });
}

// Both GET + POST land on the same handler so Vercel Cron (issues GET)
// and the sibling `/api/cron/rotate-if-due` pattern (POST) can share
// operator muscle memory. Deep-audit Phase 1 backlog #3.
export async function GET(request: NextRequest): Promise<Response> {
  return handle(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request);
}
