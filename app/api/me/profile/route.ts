import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { AVATARS } from "@/lib/avatars";

const PatchSchema = z.object({
  avatar: z.string().max(16).optional(),
  displayName: z.string().min(1).max(32).optional(),
  onboarding: z
    .object({
      tourSeen: z.boolean().optional(),
      mortgageTutorialSeen: z.boolean().optional(),
      firstGamePlayed: z.boolean().optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const state = await getPlayerState(session.username);
  return Response.json({
    ok: true,
    profile: state.profile ?? {},
    onboarding: state.onboarding ?? {},
    username: session.username,
    avatarChoices: AVATARS,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = PatchSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  // Avatar id sanity-check
  if (body.avatar && !AVATARS.some((a) => a.id === body.avatar)) {
    return Response.json({ ok: false, error: "unknown-avatar" }, { status: 400 });
  }
  const state = await getPlayerState(session.username);
  state.profile = {
    ...(state.profile ?? {}),
    ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
    ...(body.displayName !== undefined ? { displayName: body.displayName.trim() } : {}),
  };
  state.onboarding = {
    ...(state.onboarding ?? {}),
    ...(body.onboarding ?? {}),
  };
  await savePlayerState(state);
  return Response.json({
    ok: true,
    profile: state.profile,
    onboarding: state.onboarding,
  });
}
