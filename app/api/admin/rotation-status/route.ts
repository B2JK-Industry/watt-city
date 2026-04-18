import { NextRequest } from "next/server";
import { kvGet } from "@/lib/redis";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { ROTATION_HOURS } from "@/lib/ai-pipeline/types";

// Read-only rotation health check. Admin-gated when ADMIN_SECRET is set,
// open in local dev. Used by:
//  - on-call sanity check ("is rotation firing?")
//  - external uptime monitor (parse `alertIfStale`)
//  - the admin dashboard (Phase 5.1)
export async function GET(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token !== expected) {
      return Response.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  const now = Date.now();
  const rotationWindowMs = ROTATION_HOURS * 60 * 60 * 1000;

  const [games, lastBucket, lockValue] = await Promise.all([
    listActiveAiGames(),
    kvGet<number>("xp:ai-games:last-rotation-bucket"),
    kvGet<string>("xp:rotation-lock"),
  ]);

  const timeline = games
    .slice()
    .sort((a, b) => a.validUntil - b.validUntil)
    .map((g) => ({
      id: g.id,
      theme: g.theme,
      generatedAt: g.generatedAt,
      validUntil: g.validUntil,
      msUntilExpiry: g.validUntil - now,
      model: g.model,
    }));

  const expired = timeline.filter((t) => t.msUntilExpiry <= 0);
  const nextExpiringAt = timeline[0]?.validUntil ?? null;

  const lastRotationAt =
    typeof lastBucket === "number" ? lastBucket * rotationWindowMs : null;
  const minutesSinceLastRotation =
    lastRotationAt === null ? null : Math.floor((now - lastRotationAt) / 60_000);

  // Stale if no rotation has recorded in >90 min; the external pinger should
  // fire every 5 min and every hour one of those fires should actually publish.
  const alertIfStale =
    minutesSinceLastRotation === null || minutesSinceLastRotation > 90;

  return Response.json({
    ok: true,
    now,
    rotationHours: ROTATION_HOURS,
    live: timeline,
    expired,
    indexCount: timeline.length,
    lastRotationAt,
    minutesSinceLastRotation,
    nextExpiringAt,
    expectedNextRotationAt: lastRotationAt
      ? lastRotationAt + rotationWindowMs
      : null,
    lockHeld: Boolean(lockValue),
    alertIfStale,
  });
}
