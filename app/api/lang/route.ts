import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANGS, COOKIE_NAME, type Lang } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  // G-22 — same-origin check. Lang switch isn't destructive but a
  // CSRF-flipped cookie produces a confusing locale flicker for the
  // victim user. Origin header is set by every modern browser for
  // fetch/XHR; missing-origin requests (e.g. curl) still pass
  // since the operation is low-stakes — strict-strict mode would
  // block legit dev/test tooling. Mismatched origin → 403.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(req.url).host) {
        return Response.json(
          { ok: false, error: "cross-origin" },
          { status: 403 },
        );
      }
    } catch {
      return Response.json(
        { ok: false, error: "bad-origin" },
        { status: 403 },
      );
    }
  }
  const body = (await req.json().catch(() => ({}))) as { lang?: string };
  const lang = body.lang;
  if (!lang || !(LANGS as readonly string[]).includes(lang)) {
    return Response.json({ ok: false, error: "invalid lang" }, { status: 400 });
  }
  const store = await cookies();
  store.set(COOKIE_NAME, lang as Lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // R-10 — bust the RSC cache for the entire layout tree so server
  // components re-execute with the new `xp_lang` cookie. Without
  // this, Next.js 16 keeps serving the previously-rendered RSC
  // payload (which closed over the old dictionary) for /miasto and
  // similar surfaces, producing nav-in-PL / body-in-CS mixes.
  revalidatePath("/", "layout");
  return Response.json({ ok: true, lang });
}
