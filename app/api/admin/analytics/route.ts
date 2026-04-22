import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  kindPopularity,
  mortgageFunnel,
  retentionSummary,
  readDayStream,
} from "@/lib/analytics";
import { dayBucket } from "@/lib/economy";

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const url = new URL(request.url);
  const day = url.searchParams.get("day") ?? dayBucket();
  const userSampleRaw = url.searchParams.get("users") ?? "";
  const users = userSampleRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const [kindPop, funnel, stream, retention] = await Promise.all([
    kindPopularity(day),
    mortgageFunnel(day),
    readDayStream(day, 100),
    users.length > 0
      ? retentionSummary(users)
      : Promise.resolve({ cohortDays: [], d1: 0, d7: 0, d30: 0 }),
  ]);

  return Response.json({
    ok: true,
    day,
    kindPopularity: kindPop,
    mortgageFunnel: funnel,
    recentEventsCount: stream.length,
    recentEvents: stream.slice(0, 20),
    retention,
  });
}
