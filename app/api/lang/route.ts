import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANGS, COOKIE_NAME, type Lang } from "@/lib/i18n";

export async function POST(req: NextRequest) {
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
