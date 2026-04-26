import Link from "next/link";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/* G-03 — Root 404. Server Component so it renders the player's
 * locale via the same `xp_lang` cookie path as the rest of the app.
 * Without this file Next.js fell back to the generic Vercel
 * "404 NOT_FOUND" page, breaking the brand chrome + nav. */
export default async function NotFound() {
  const lang = await getLang();
  const t = dictFor(lang).errors;
  return (
    <main className="flex flex-col gap-4 max-w-xl mx-auto py-12 text-center animate-slide-up">
      <span aria-hidden className="text-5xl">
        🔍
      </span>
      <h1 className="t-h2 text-[var(--accent)]">{t.notFoundTitle}</h1>
      <p className="text-[var(--ink-muted)]">{t.notFoundBody}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          {t.notFoundCta}
        </Link>
        <Link href="/games" className="btn btn-secondary">
          {t.notFoundGames}
        </Link>
      </div>
    </main>
  );
}
