import "server-only";
import { cookies } from "next/headers";
import { LANGS, DEFAULT_LANG, COOKIE_NAME, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw && (LANGS as readonly string[]).includes(raw)) {
    return raw as Lang;
  }
  return DEFAULT_LANG;
}
