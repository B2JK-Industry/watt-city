import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SKIN_COOKIE_NAME, isValidSkin } from "@/lib/skin-server";

/**
 * Skin toggle endpoint.
 *
 * GET  `/api/skin?value=pko` — sets the `xp_skin` cookie and redirects
 *   to `?redirect=` (defaults to `/`). Designed for shareable preview
 *   links: send a stakeholder
 *   `watt-city.vercel.app/api/skin?value=pko` and they see the SKO skin
 *   on every subsequent page load without flipping the Vercel env var.
 *
 * POST `/api/skin` with JSON `{ "value": "pko" }` — same effect,
 *   returns JSON `{ ok: true, skin }`. For programmatic use (client
 *   toggle buttons, E2E tests).
 *
 * To clear: `?value=core` or DELETE.
 *
 * Cookie flags:
 *   - `sameSite: "lax"` — survives top-level navigation, blocks CSRF
 *     from other origins.
 *   - `path: "/"` — global.
 *   - `maxAge: 1 year` — matches the language-preference cookie.
 *   - No `httpOnly` — this is a UI preference, not a secret; harmless
 *     if JS reads it.
 */
const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function sanitizeRedirect(raw: string | null): string {
  // Only allow same-origin path redirects to block open-redirect abuse.
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const value = url.searchParams.get("value") ?? "";
  const redirect = sanitizeRedirect(url.searchParams.get("redirect"));
  if (!isValidSkin(value)) {
    return Response.json(
      { ok: false, error: "invalid skin; must be 'core' or 'pko'" },
      { status: 400 },
    );
  }
  const store = await cookies();
  store.set(SKIN_COOKIE_NAME, value, COOKIE_OPTS);
  return Response.redirect(new URL(redirect, url.origin), 303);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { value?: string };
  const value = body.value ?? "";
  if (!isValidSkin(value)) {
    return Response.json(
      { ok: false, error: "invalid skin; must be 'core' or 'pko'" },
      { status: 400 },
    );
  }
  const store = await cookies();
  store.set(SKIN_COOKIE_NAME, value, COOKIE_OPTS);
  return Response.json({ ok: true, skin: value });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SKIN_COOKIE_NAME);
  return Response.json({ ok: true, skin: "core" });
}
