import { NextRequest } from "next/server";
import { rotateIfDue } from "@/lib/ai-pipeline/publish";
import { sendAlert } from "@/lib/ops-alerts";
import { kvSet } from "@/lib/redis";
import { recordEvent } from "@/lib/analytics";
import { isCronAuthorised, cronAuthFailure } from "@/lib/cron-auth";

// Pipeline budget: Sonnet PL gen (~10–20s) + 3× Haiku translate (~10–20s parallel).
// Cron + external pinger both hit this — single-flight lock in rotateIfDue
// collapses concurrent calls to one publish.
export const maxDuration = 60;

// Auth: CRON_SECRET (Vercel Cron / external pinger) OR ADMIN_SECRET
// (manual ops trigger). Dev bypass is NODE_ENV-gated. See
// `lib/cron-auth.ts` for the full rule matrix.

export async function POST(request: NextRequest) {
  if (!isCronAuthorised(request, { allowAdminBearer: true })) {
    return cronAuthFailure();
  }
  const started = Date.now();
  const result = await rotateIfDue(started);
  const durationMs = Date.now() - started;

  if (!result.ok) {
    // 409 for contention — client should back off, not retry immediately
    const status = result.contended ? 409 : 500;
    console.log(
      JSON.stringify({
        event: "rotation.failed",
        durationMs,
        error: result.error,
        contended: Boolean(result.contended),
      }),
    );
    if (!result.contended) {
      // Fire-and-forget: sendAlert dedupes to avoid channel-spam.
      sendAlert(
        "rotation-failed",
        `🚨 Watt City rotation.failed: ${result.error} (${durationMs}ms)`,
      ).catch(() => {});
    }
    return Response.json(result, { status });
  }

  // Telemetry: single structured log line per rotation outcome. Vercel captures
  // stdout as searchable logs; a later tap (1.1.10) can forward these to a
  // metrics backend.
  console.log(
    JSON.stringify({
      event: "rotation.fired",
      durationMs,
      rotated: result.rotated,
      published: result.published,
      theme: result.theme,
      skipped: result.skipped,
      reason: result.reason,
    }),
  );
  if (result.published) {
    // Only record/cache on real publishes — no-op skips don't shift stale-check.
    await kvSet("xp:ops:last-rotation-fired-at", started);
    await recordEvent({
      kind: "rotation_fired",
      meta: { published: result.published, theme: result.theme, durationMs },
    });
  }

  return Response.json({ ...result, durationMs });
}

// Convenience for uptime pingers that only speak GET; same behaviour as POST.
export async function GET(request: NextRequest) {
  return POST(request);
}
