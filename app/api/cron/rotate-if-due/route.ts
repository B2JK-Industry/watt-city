import { NextRequest } from "next/server";
import { rotateIfDue } from "@/lib/ai-pipeline/publish";
import { sendAlert } from "@/lib/ops-alerts";
import { kvSet } from "@/lib/redis";
import { recordEvent } from "@/lib/analytics";

// Pipeline budget: Sonnet PL gen (~10–20s) + 3× Haiku translate (~10–20s parallel).
// Cron + external pinger both hit this — single-flight lock in rotateIfDue
// collapses concurrent calls to one publish.
export const maxDuration = 60;

// Shared auth: CRON_SECRET (for Vercel Cron / external pinger) OR ADMIN_SECRET.
// Either secret unlocks a manual trigger; in local dev neither is required.
function authorized(request: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  const admin = process.env.ADMIN_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!cron && !admin) return true; // dev open
  if (isVercelCron) return true;
  if (cron && token === cron) return true;
  if (admin && token === admin) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const result = await rotateIfDue(started);
  const durationMs = Date.now() - started;

  if (!result.ok) {
    // 409 for contention — client should back off, not retry immediately
    const status = result.contended ? 409 : 500;
    // eslint-disable-next-line no-console
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
  // eslint-disable-next-line no-console
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
