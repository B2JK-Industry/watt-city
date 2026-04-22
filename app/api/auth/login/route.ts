import { NextRequest } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { clearDeletionFlag, deletionStatus } from "@/lib/soft-delete";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

// Anti-credential-stuffing: two complementary ceilings.
//
// Per-IP (`LOGIN_IP_LIMIT`) slows a single attacker ramping through
// many usernames from one box. Default 60/min is higher than the old
// 20/min because classrooms at partner schools share one NAT exit IP
// — 25 kids behind one address can easily hit 20 legitimate logins/min
// at lesson start. 60/min still blocks credential-stuffing (an attacker
// needs millions of tries; 60/min caps them at ~86k/day — DoS-expensive).
//
// Per-username (`LOGIN_USER_LIMIT`) stops an attacker who rotates
// source IPs. 10 fails / 15 min / username is tight enough that even
// a patient adversary can't brute a password, and a legitimate user
// who forgets their password won't hit it unless they try 10 bad
// passwords in 15 minutes.
const LOGIN_IP_LIMIT = Number(process.env.LOGIN_IP_LIMIT ?? 60);
const LOGIN_IP_WINDOW_MS = Number(process.env.LOGIN_IP_WINDOW_MS ?? 60_000);
const LOGIN_USER_LIMIT = Number(process.env.LOGIN_USER_LIMIT ?? 10);
const LOGIN_USER_WINDOW_MS = Number(
  process.env.LOGIN_USER_WINDOW_MS ?? 15 * 60_000,
);

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = await rateLimit(
    `login-ip:${ip}`,
    LOGIN_IP_LIMIT,
    LOGIN_IP_WINDOW_MS,
  );
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Nieprawidłowe żądanie." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Podaj nazwę i hasło." },
      { status: 400 },
    );
  }
  // Per-username ceiling — incremented on EVERY attempt (valid or not)
  // so a success doesn't reset the window. A legitimate user hitting
  // this limit only happens after 10 wrong passwords in 15 minutes,
  // which is the correct moment to slow them down regardless.
  const userKey = `login-user:${parsed.data.username.toLowerCase()}`;
  const userRl = await rateLimit(
    userKey,
    LOGIN_USER_LIMIT,
    LOGIN_USER_WINDOW_MS,
  );
  if (!userRl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: userRl.resetAt },
      { status: 429 },
    );
  }
  const result = await loginUser(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 401 });
  }
  // Phase 6.2.4: a login during the 30-day soft-delete grace period
  // cancels the deletion. We inform the client so it can show a "welcome
  // back — your deletion was cancelled" toast.
  const wasFlagged = await deletionStatus(result.user.username);
  if (wasFlagged.flagged) {
    await clearDeletionFlag(result.user.username);
  }
  await createSession(result.user.username);
  return Response.json({
    ok: true,
    username: result.user.username,
    deletionCancelled: wasFlagged.flagged,
  });
}
