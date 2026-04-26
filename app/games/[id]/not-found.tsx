import Link from "next/link";
import { GAMES } from "@/lib/games";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/* G-03 — Segment-specific 404 for /games/<unknown>. Replaces the
 * fallback root `app/not-found.tsx` for this segment with copy that
 * names the actual game count + points the player at the games hub
 * (Next.js 16 picks the deepest matching not-found.tsx). */
export default async function GameNotFound() {
  const lang = await getLang();
  const t = dictFor(lang).errors;
  return (
    <main className="flex flex-col gap-4 max-w-xl mx-auto py-12 text-center animate-slide-up">
      <span aria-hidden className="text-5xl">
        🎮
      </span>
      <h1 className="t-h2 text-[var(--accent)]">{t.notFoundGameTitle}</h1>
      <p className="text-[var(--ink-muted)]">
        {t.notFoundGameBody.replace("{n}", String(GAMES.length))}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/games" className="btn btn-primary">
          {t.notFoundGameAll}
        </Link>
        <Link href="/" className="btn btn-secondary">
          {t.notFoundCta}
        </Link>
      </div>
    </main>
  );
}
