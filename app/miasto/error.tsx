"use client";

import { useEffect } from "react";
import Link from "next/link";

/* R-07 — Route segment error boundary for /miasto.
 *
 * Without this file, an exception inside the WattCityClient bubble
 * (typically: stale upgrade state racing a server-side re-render)
 * crashed all the way to the browser default error page. Next.js
 * App Router automatically renders this component when a server or
 * client component inside `app/miasto/*` throws.
 *
 * `reset()` clears the error boundary and triggers a re-render of
 * the segment — the typical fix is "try again" since the underlying
 * cause is usually a transient race that resolves on the next
 * fetch. We also surface a "Back to home" escape hatch.
 */
export default function MiastoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side aggregator (Phase 5.3 first-party analytics)
    // catches this too; client-side log is a development convenience.
    if (typeof console !== "undefined") {
      console.error("[/miasto] segment error:", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto py-12 animate-slide-up">
      <span aria-hidden className="text-5xl text-center">
        ⚠️
      </span>
      <h1 className="t-h2 text-[var(--accent)] text-center">
        Coś poszło nie tak w Twoim mieście
      </h1>
      <p className="t-body text-[var(--ink-muted)] text-center">
        Spróbuj ponownie. Jeśli problem się powtarza, wróć do strony głównej —
        dane są zapisane bezpiecznie.
      </p>
      {error.digest && (
        <p className="t-caption text-[var(--ink-subtle)] text-center font-mono">
          ref: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Spróbuj ponownie
        </button>
        <Link href="/" className="btn btn-secondary">
          Strona główna
        </Link>
      </div>
    </div>
  );
}
