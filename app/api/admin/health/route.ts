import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { kvGet } from "@/lib/redis";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { ROTATION_HOURS } from "@/lib/ai-pipeline/types";

// Unified health endpoint — extends the Phase 1.1.9 rotation-status with
// subsystem signals so a single curl can answer "is the world OK?".
export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const now = Date.now();
  const rotationWindowMs = ROTATION_HOURS * 60 * 60 * 1000;

  const [games, lastBucket, lockValue, lastRotationFiredAt] = await Promise.all([
    listActiveAiGames(),
    kvGet<number>("xp:ai-games:last-rotation-bucket"),
    kvGet<string>("xp:rotation-lock"),
    kvGet<number>("xp:ops:last-rotation-fired-at"),
  ]);
  const lastRotationAt =
    typeof lastBucket === "number" ? lastBucket * rotationWindowMs : null;
  const minutesSinceLastRotation =
    lastRotationAt === null ? null : Math.floor((now - lastRotationAt) / 60_000);

  // Stale if no rotation in >90 min (gives hourly cadence + one-hour slack).
  const rotationStale =
    minutesSinceLastRotation === null || minutesSinceLastRotation > 90;

  // Upstash ping — we don't expose a direct command, but the kvGet above
  // implicitly succeeded. Signal "reachable" from the fact we got here.
  const storage = "upstash";

  return Response.json({
    ok: true,
    now,
    storage,
    rotation: {
      liveCount: games.length,
      lastRotationAt,
      minutesSinceLastRotation,
      expectedNextRotationAt: lastRotationAt
        ? lastRotationAt + rotationWindowMs
        : null,
      lockHeld: Boolean(lockValue),
      stale: rotationStale,
      lastFiredAt: lastRotationFiredAt,
    },
    alerts: {
      rotationStale,
    },
  });
}
