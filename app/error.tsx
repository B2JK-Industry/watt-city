"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dictFor, DEFAULT_LANG, type Lang } from "@/lib/i18n";

/* G-03 — Root segment error boundary.
 *
 * Mirror of `app/miasto/error.tsx` (R-07) but at the root segment so
 * exceptions outside `/miasto` (auth flows, /games, /leaderboard,
 * /loans, etc.) no longer fall through to the browser-default error
 * page. Next.js mounts this Client Component when ANY server or
 * client component below `app/` throws and no nearer error.tsx
 * catches it.
 *
 * i18n note: Client Components can't use `getLang()` (server-only).
 * We read `<html lang="...">` once on mount; if the value isn't a
 * supported locale, fall back to DEFAULT_LANG. The dict copy lives
 * in `lib/locales/{pl,uk,cs,en}.ts` `errors.*` so all four locales
 * see localized text instead of the legacy hardcoded PL.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const docLang = document.documentElement.lang as Lang;
      if (["pl", "uk", "cs", "en"].includes(docLang)) setLang(docLang);
    }
    if (typeof console !== "undefined") {
      console.error("[root] segment error:", error);
    }
  }, [error]);

  const t = dictFor(lang).errors;

  return (
    <main className="flex flex-col gap-4 max-w-xl mx-auto py-12 animate-slide-up">
      <span aria-hidden className="text-5xl text-center">
        ⚠️
      </span>
      <h1 className="t-h2 text-[var(--accent)] text-center">{t.title}</h1>
      <p className="t-body text-[var(--ink-muted)] text-center">{t.body}</p>
      {error.digest && (
        <p className="t-caption text-[var(--ink-subtle)] text-center font-mono">
          ref: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          {t.retry}
        </button>
        <Link href="/" className="btn btn-secondary">
          {t.back}
        </Link>
      </div>
    </main>
  );
}
