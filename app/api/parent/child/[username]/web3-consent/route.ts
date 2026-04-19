/* POST /api/parent/child/[username]/web3-consent — W6.
 *
 * Parent-side toggle for the kid's on-chain medal consent. Grants or
 * revokes the xp:consent-granted:<kid> record. On revoke, also flips
 * the kid's onboarding.web3OptIn to false AND calls burnAllForUser to
 * honour the on-chain side of withdrawal (GDPR Art. 17, matching
 * docs/web3/DEPLOY.md §7).
 *
 * Guards:
 *   - session
 *   - isParentOf(parent, kid) — only linked parents can toggle
 *   - CSRF via middleware (not exempt)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isParentOf } from "@/lib/roles";
import { getPlayerState, savePlayerState } from "@/lib/player";
import { kvSet, kvSetNX } from "@/lib/redis";
import { revokeParentalConsent, hasParentalConsent } from "@/lib/gdpr-k";
import { burnAllForUser } from "@/lib/web3/burn-all";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  consent: z.boolean(),
});

const CONSENT_GRANTED = (u: string) => `xp:consent-granted:${u}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { username: kid } = await params;
  if (!(await isParentOf(session.username, kid))) {
    return Response.json({ ok: false, error: "not-linked" }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: "bad-request",
        detail: err instanceof z.ZodError ? err.flatten() : String(err),
      },
      { status: 400 },
    );
  }

  if (body.consent) {
    // Grant side — mirror the shape lib/gdpr-k.ts grantConsent() writes,
    // but sourced from the observer dashboard rather than the email flow.
    // Idempotent: if already granted, keep the earlier timestamp.
    const existed = await hasParentalConsent(kid);
    if (!existed) {
      await kvSetNX(CONSENT_GRANTED(kid), {
        grantedAt: Date.now(),
        parentEmail: `${session.username}@parent.watt-city.local`,
        token: `observer-${session.username}-${Date.now()}`,
      });
    }
    return Response.json({
      ok: true,
      consent: true,
      alreadyGranted: existed,
    });
  }

  // Revoke side — delete consent, flip kid's opt-in off, burn medals.
  const revoked = await revokeParentalConsent(kid);
  const state = await getPlayerState(kid);
  if (state.onboarding?.web3OptIn === true) {
    state.onboarding = { ...state.onboarding, web3OptIn: false };
    await savePlayerState(state);
  }
  let burn: Awaited<ReturnType<typeof burnAllForUser>> | null = null;
  try {
    burn = await burnAllForUser(kid);
  } catch (err) {
    burn = {
      attempted: 0,
      burned: [],
      skipped: [],
      errors: [
        {
          tokenId: "?",
          reason: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
  // Best-effort kvSet to keep a revocation audit marker even if the
  // consent record was already absent (idempotent parent re-click).
  await kvSet(`xp:web3:consent-revoked:${kid}`, {
    at: Date.now(),
    by: session.username,
  });
  return Response.json({
    ok: true,
    consent: false,
    revoked,
    burn,
  });
}
