import Link from "next/link";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { LiveCountdown } from "@/components/live-countdown";

/* G-07 — `/games/ai` parent route.
 *
 * Pre-PR-P: only `app/games/ai/[id]/page.tsx` existed; visiting the
 * bare `/games/ai` returned the generic 404 (now PR-P G-03 root
 * not-found, but still a dead-end for kids who guess the URL).
 *
 * This server component lists 0-3 currently-live AI envelopes via
 * the same `listActiveAiGames()` reader the dashboard preview uses.
 * Empty state is graceful: rotation hint + cron timing copy so the
 * player knows when the next game lands instead of seeing a blank.
 */
export const dynamic = "force-dynamic";

export default async function AiGamesHub() {
  const lang = await getLang();
  const t = dictFor(lang).aiHub;
  const active = await listActiveAiGames();

  return (
    <main className="flex flex-col gap-6 max-w-4xl mx-auto animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
        <p className="text-[var(--ink-muted)]">{t.body}</p>
      </header>

      {active.length === 0 ? (
        <div className="card p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl" aria-hidden>
            🤖
          </span>
          <p className="font-semibold">{t.emptyTitle}</p>
          <p className="text-[var(--ink-muted)]">{t.emptyBody}</p>
          <p className="t-caption text-[var(--ink-subtle)] mt-2">
            {t.rotationHint}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((envelope) => (
            <li key={envelope.id}>
              <Link
                href={`/games/ai/${envelope.id}`}
                className="card card--interactive p-5 flex flex-col gap-2 h-full"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl" aria-hidden>
                    {envelope.buildingGlyph}
                  </span>
                  <span className="chip text-[10px] border-[var(--accent)] text-[var(--accent)]">
                    AI
                  </span>
                </div>
                <h2
                  className="font-semibold tracking-tight text-base"
                  lang="pl"
                >
                  {envelope.title}
                </h2>
                <p
                  className="text-sm text-[var(--ink-muted)] line-clamp-2"
                  lang="pl"
                >
                  {envelope.tagline}
                </p>
                <span className="t-caption text-[var(--ink-muted)] mt-auto">
                  ⏱{" "}
                  <LiveCountdown
                    validUntil={envelope.validUntil}
                    svg={false}
                    color="var(--ink-muted)"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
