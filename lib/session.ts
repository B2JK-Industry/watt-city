/* HMAC-signed cookie sessions — no external auth library.
 *
 * Shape: cookie `xp_sess = ${base64url(payload)}.${base64url(hmac)}`.
 * Payload is `{username, issuedAt}`; HMAC is SHA-256 with `SESSION_SECRET`.
 * `getSession()` verifies the signature in constant time (`timingSafeEqual`)
 * and returns null on any decode / signature / shape mismatch.
 *
 * Invariants
 *  - `SESSION_SECRET` ≥ 16 chars in production — enforced at module init
 *    (we throw on the first `getSecret()` call if missing).
 *  - Cookie is HttpOnly + SameSite=Lax + Secure-in-prod. JS can't read it.
 *  - 30-day max-age; no refresh rotation (hackathon scope). Users who stay
 *    signed in longer just re-login — no silent session extension path.
 *
 * Related:
 *  - `lib/csrf.ts` for same-origin mutation protection.
 *  - `app/api/auth/{login,register,logout}/route.ts` for issue/clear paths.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "xp_sess";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a value of at least 16 characters in production.",
    );
  }
  return "dev-session-secret-change-me-please";
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(value: string): string {
  const mac = createHmac("sha256", getSecret()).update(value).digest();
  return b64url(mac);
}

function verify(value: string, signature: string): boolean {
  const expected = sign(value);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type SessionPayload = { username: string; issuedAt: number };

function encodePayload(payload: SessionPayload): string {
  return b64url(Buffer.from(JSON.stringify(payload)));
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const raw = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.username === "string" &&
      typeof parsed.issuedAt === "number"
    ) {
      return parsed as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<void> {
  const payload: SessionPayload = { username, issuedAt: Date.now() };
  const body = encodePayload(payload);
  const signature = sign(body);
  const token = `${body}.${signature}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  if (!verify(body, signature)) return null;
  return decodePayload(body);
}
