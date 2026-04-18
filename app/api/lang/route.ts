import { NextRequest } from "next/server";
import { cookies } from "next/headers";
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
  return Response.json({ ok: true, lang });
}
