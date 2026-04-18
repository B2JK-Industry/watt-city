import { NextRequest } from "next/server";
import { z } from "zod";
import { zScore } from "@/lib/redis";
import {
  getPlayerState,
  creditResources,
  savePlayerState,
} from "@/lib/player";

// One-time migration per backlog 1.2.10: convert an XP Arena user's prior
// leaderboard XP ("W" in the old UI) into Watt City coins. Idempotent via the
// ledger dedup set — re-running with the same username is a no-op.
//
// Call:
//   POST /api/admin/backfill-resources
//   Authorization: Bearer $ADMIN_SECRET
//   Body: { username: "daniel_babjak" }
//
// Response: { ok, username, creditedCoins, resources }
const GLOBAL_LEADERBOARD_KEY = "xp:leaderboard:global";

const BodySchema = z.object({
  username: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
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

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  const priorXP = await zScore(GLOBAL_LEADERBOARD_KEY, body.username);
  if (priorXP <= 0) {
    return Response.json({
      ok: true,
      username: body.username,
      creditedCoins: 0,
      reason: "no prior XP to backfill",
    });
  }

  const state = await getPlayerState(body.username);
  const credit = await creditResources(
    state,
    "backfill",
    { coins: Math.floor(priorXP) },
    `backfill: ${Math.floor(priorXP)} XP → coins`,
    `legacy-xp:${body.username}`,
    { priorXP },
  );

  // Persist state even when dedup skips the credit, so caller sees current
  // resources in the response.
  await savePlayerState(state);

  return Response.json({
    ok: true,
    username: body.username,
    applied: credit.applied,
    creditedCoins: credit.applied ? Math.floor(priorXP) : 0,
    resources: credit.resources,
  });
}
