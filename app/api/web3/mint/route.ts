/* POST /api/web3/mint — W4.
 *
 * Gates (in order, each short-circuits):
 *   1. Zod body validation
 *   2. Session authn
 *   3. Feature flag on + consent gate (lib/web3/consent.ts)
 *   4. User owns the achievement off-chain (lib/achievements)
 *   5. SIWE-lite wallet signature verification (lib/web3/signatures)
 *   6. Single-flight lock (Redis kvSetNX) — prevents duplicate mint tx
 *      on rapid client retries
 *   7. Idempotency via ownerOf(tokenId) — returns alreadyMinted
 *      cheaply, never burns gas on a duplicate
 *   8. Relayer balance guard — 503 before we submit a doomed tx
 *
 * CSRF is enforced by the Edge middleware (see lib/csrf-shared.ts) —
 * this route is NOT in the exempt list, so requests without a valid
 * X-CSRF-Token header are blocked before they reach this handler.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { ownedAchievements, ACHIEVEMENT_DEFS, type AchievementId } from "@/lib/achievements";
import { kvSetNX, kvDel, lPush, lTrim } from "@/lib/redis";
import { checkWeb3Gate } from "@/lib/web3/consent";
import { verifyMintSignature } from "@/lib/web3/signatures";
import {
  mintMedal,
  tokenIdFor,
  tokenIdToString,
  MINT_LOG_KEY,
  type MintLogEntry,
} from "@/lib/web3/mint";
import { MEDAL_URIS } from "@/lib/web3/medal-uris";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENT_DEFS) as AchievementId[];

const BodySchema = z.object({
  achievementId: z.enum(ALLOWED_ACHIEVEMENT_IDS as [AchievementId, ...AchievementId[]]),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "wallet must be 0x + 40 hex"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "signature must be 0x hex"),
  message: z.string().min(20).max(4096),
});

const LOCK_TTL_SECONDS = 60; // single-flight window per (user, achievement)
const LOCK_KEY = (username: string, id: AchievementId) =>
  `xp:web3:mint-lock:${username}:${id}`;
const MINT_LOG_CAP = 99; // keep the newest 100 entries

export async function POST(req: NextRequest) {
  // 1. Zod parse
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
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

  // 2. Session
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 3. Feature flag + consent gate
  const gate = await checkWeb3Gate(session.username);
  if (!gate.allowed) {
    const status = gate.reason === "web3-disabled" ? 404 : 403;
    return Response.json(
      {
        ok: false,
        error: gate.reason,
        ageBucket: gate.ageBucket,
      },
      { status },
    );
  }

  // 4. Achievement ownership
  const owned = await ownedAchievements(session.username);
  if (!owned.includes(body.achievementId)) {
    return Response.json(
      { ok: false, error: "achievement-not-owned" },
      { status: 403 },
    );
  }

  // 5. Wallet signature
  const sigResult = await verifyMintSignature({
    username: session.username,
    achievementId: body.achievementId,
    walletAddress: body.walletAddress,
    message: body.message,
    signature: body.signature,
  });
  if (!sigResult.ok) {
    return Response.json(
      { ok: false, error: "signature-invalid", reason: sigResult.reason },
      { status: 401 },
    );
  }
  const recovered: Address = sigResult.recovered;

  // 6. Single-flight lock per (user, achievement). Idempotency check
  //    below is on-chain, but the lock keeps rapid retries from double-
  //    submitting a tx while the first is still in-flight.
  const lockKey = LOCK_KEY(session.username, body.achievementId);
  const gotLock = await kvSetNX(lockKey, { at: Date.now() }, { ex: LOCK_TTL_SECONDS });
  if (!gotLock) {
    return Response.json(
      { ok: false, error: "mint-in-progress" },
      { status: 409 },
    );
  }

  try {
    // 7 + 8. Compute tokenId → mint (handles idempotency + balance guard)
    const tokenId = tokenIdFor(session.username, body.achievementId);
    const tokenURI = MEDAL_URIS[body.achievementId];
    const result = await mintMedal({
      to: recovered,
      tokenId,
      tokenURI,
      achievementId: body.achievementId,
    });

    if (result.kind === "alreadyMinted") {
      return Response.json({
        ok: true,
        alreadyMinted: true,
        tokenId: tokenIdToString(tokenId),
        owner: result.owner,
        tokenURI: result.tokenURI,
      });
    }
    if (result.kind === "relayerEmpty") {
      return Response.json(
        {
          ok: false,
          error: "relayer-empty",
          balanceWei: result.balanceWei.toString(),
        },
        { status: 503 },
      );
    }
    if (result.kind === "error") {
      return Response.json(
        { ok: false, error: "mint-failed", detail: result.message },
        { status: 502 },
      );
    }

    // Success — append to the server-side mint log (audit + gallery
    // fallback for any chain indexer lag).
    const logEntry: MintLogEntry = {
      tokenId: tokenIdToString(tokenId),
      achievementId: body.achievementId,
      walletAddress: getAddress(recovered),
      txHash: result.txHash,
      mintedAt: Date.now(),
    };
    await lPush(MINT_LOG_KEY(session.username), logEntry);
    await lTrim(MINT_LOG_KEY(session.username), 0, MINT_LOG_CAP);

    return Response.json({
      ok: true,
      alreadyMinted: false,
      tokenId: tokenIdToString(tokenId),
      txHash: result.txHash as Hex,
      explorerUrl: result.explorerUrl,
      tokenURI,
    });
  } finally {
    await kvDel(lockKey);
  }
}
