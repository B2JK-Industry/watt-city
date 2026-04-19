import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { AVATARS } from "@/lib/avatars";
import {
  readAgeBucket,
  requiresParentalConsent,
  hasParentalConsent,
} from "@/lib/gdpr-k";
import { burnAllForUser } from "@/lib/web3/burn-all";

const PatchSchema = z.object({
  avatar: z.string().max(16).optional(),
  displayName: z.string().min(1).max(32).optional(),
  onboarding: z
    .object({
      tourSeen: z.boolean().optional(),
      mortgageTutorialSeen: z.boolean().optional(),
      firstGamePlayed: z.boolean().optional(),
      /** Phase 8 W6 — user opts into the web3 medal flow. For users
       *  under 16, the server rejects a `true` unless a linked parent
       *  has already granted consent. Setting it to `false` triggers
       *  burnAllForUser (best-effort) to honour GDPR Art. 17 on-chain. */
      web3OptIn: z.boolean().optional(),
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

  // web3OptIn write gate: under-16 users can't set it to true without
  // a parent-granted consent record. Any-age user can flip it off.
  let burnResult: Awaited<ReturnType<typeof burnAllForUser>> | null = null;
  const nextOptIn = body.onboarding?.web3OptIn;
  const prevOptIn = state.onboarding?.web3OptIn === true;
  if (nextOptIn === true && !prevOptIn) {
    const [ageBucket, parentalConsent] = await Promise.all([
      readAgeBucket(session.username),
      hasParentalConsent(session.username),
    ]);
    const needsParent = ageBucket ? requiresParentalConsent(ageBucket) : true;
    if (needsParent && !parentalConsent) {
      return Response.json(
        { ok: false, error: "parent-consent-required" },
        { status: 403 },
      );
    }
  }
  if (nextOptIn === false && prevOptIn) {
    // Best-effort — log any per-token errors but don't fail the flip.
    burnResult = await burnAllForUser(session.username).catch((err) => ({
      attempted: 0,
      burned: [],
      skipped: [],
      errors: [{ tokenId: "?", reason: err instanceof Error ? err.message : String(err) }],
    }));
  }

  state.onboarding = {
    ...(state.onboarding ?? {}),
    ...(body.onboarding ?? {}),
  };
  await savePlayerState(state);
  return Response.json({
    ok: true,
    profile: state.profile,
    onboarding: state.onboarding,
    ...(burnResult ? { burn: burnResult } : {}),
  });
}
