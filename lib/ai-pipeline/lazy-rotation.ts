import { after } from "next/server";
import { listActiveAiGames, rotationIsDue, rotateIfDue } from "./publish";
import type { AiGame } from "./types";

/* Lazy rotation — called by server components that render LIVE AI games.
 *
 * Two modes:
 *  1. Every live game is past expiry (or the list is empty) → await rotation
 *     synchronously so this render returns a fresh game. Yes, this can cost
 *     up to ~30s, but it only happens on the *first* visit of a new hour
 *     when neither Vercel Cron nor the external pinger has fired yet.
 *  2. At least one game is still live → schedule rotation in `after()` so it
 *     runs after the response is sent. Visitor sees the current list now,
 *     the next visitor sees the rotated list.
 *
 * `rotateIfDue()` is already idempotent + lock-guarded, so multiple concurrent
 * render paths collapse safely.
 */
export async function listActiveAiGamesWithLazyRotation(): Promise<AiGame[]> {
  const now = Date.now();
  let games = await listActiveAiGames();

  const due = await rotationIsDue(games, now);
  if (!due) return games;

  const allExpiredOrEmpty =
    games.length === 0 || games.every((g) => g.validUntil <= now);

  if (allExpiredOrEmpty) {
    // Block the render — this path has no live game to show otherwise.
    const result = await rotateIfDue(now);
    if (result.ok && result.published) {
      games = await listActiveAiGames();
    }
    return games;
  }

  // Happy path: already have something live; kick the refresh into after().
  try {
    after(async () => {
      await rotateIfDue(Date.now());
    });
  } catch {
    // after() is only valid in request scope — ignore outside (e.g. tests).
  }
  return games;
}
