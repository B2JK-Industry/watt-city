import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPlayerState, recentLedger, creditResources, savePlayerState } from "@/lib/player";
import { z } from "zod";
import { RESOURCE_KEYS, type ResourceKey } from "@/lib/resources";
import { kvGet, kvSet } from "@/lib/redis";
import { adminBan, adminUnban } from "@/lib/community";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const block = await requireAdmin(request);
  if (block) return block;
  const { username } = await params;
  const userRec = await kvGet(`xp:user:${username}`);
  if (!userRec)
    return Response.json({ ok: false, error: "unknown-user" }, { status: 404 });
  const [state, ledger] = await Promise.all([
    getPlayerState(username),
    recentLedger(username, 100),
  ]);
  return Response.json({
    ok: true,
    username,
    state,
    ledger,
  });
}

const ActionSchema = z.object({
  action: z.enum(["grant", "suspend", "unsuspend"]),
  grant: z.record(z.enum(RESOURCE_KEYS as unknown as [ResourceKey, ...ResourceKey[]]), z.number().int()).optional(),
  reason: z.string().max(120).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const block = await requireAdmin(request);
  if (block) return block;
  const { username } = await params;
  let body;
  try {
    body = ActionSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  if (body.action === "grant") {
    if (!body.grant)
      return Response.json({ ok: false, error: "missing-grant" }, { status: 400 });
    const state = await getPlayerState(username);
    await creditResources(
      state,
      "admin_grant",
      body.grant,
      `admin_grant: ${body.reason ?? "no reason"}`,
      `admin-grant:${username}:${Date.now()}`,
      { reason: body.reason },
    );
    await savePlayerState(state);
    return Response.json({ ok: true, resources: state.resources });
  }
  if (body.action === "suspend") {
    await adminBan(username);
    // Also flip a soft-suspend key so the session layer can refuse login.
    await kvSet(`xp:user:${username}:suspended`, true);
    return Response.json({ ok: true });
  }
  if (body.action === "unsuspend") {
    await adminUnban(username);
    await kvSet(`xp:user:${username}:suspended`, false);
    return Response.json({ ok: true });
  }
}
