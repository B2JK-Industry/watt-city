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

// Anti-credential-stuffing: cap login attempts per source IP. Looser
// than register (legitimate users may mistype) but still strong
// enough to slow a dictionary attack.
const LOGIN_IP_LIMIT = Number(process.env.LOGIN_IP_LIMIT ?? 20);
const LOGIN_IP_WINDOW_MS = Number(process.env.LOGIN_IP_WINDOW_MS ?? 60_000);

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
