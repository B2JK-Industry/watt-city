"use client";

import { useEffect } from "react";

/* R-07 — top-level error boundary.
 *
 * `app/global-error.tsx` only runs when the root layout itself
 * throws. It must render its own `<html>` + `<body>` because the
 * layout did not. Keep it minimal and dependency-free — the surface
 * has to render even if the design system is broken.
 *
 * Per-segment error.tsx (`app/<segment>/error.tsx`) handles the
 * common case; global-error is the last-resort fallback that keeps
 * the site from showing the browser default error page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[global-error] root layout error:", error);
    }
  }, [error]);

  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          padding: "48px 24px",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#000000",
          minHeight: "100vh",
        }}
      >
        <main
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "48px", textAlign: "center" }} aria-hidden>
            ⚠️
          </div>
          <h1
            style={{
              color: "#003574",
              fontSize: "32px",
              lineHeight: "40px",
              fontWeight: 700,
              textAlign: "center",
              margin: 0,
            }}
          >
            Coś poszło nie tak
          </h1>
          <p
            style={{
              color: "#636363",
              fontSize: "16px",
              lineHeight: "24px",
              textAlign: "center",
              margin: 0,
            }}
          >
            Aplikacja napotkała nieoczekiwany błąd. Spróbuj ponownie, lub odśwież
            stronę.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#b7b7b7",
                fontSize: "13px",
                fontFamily: "monospace",
                textAlign: "center",
                margin: 0,
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                background: "#003574",
                color: "#ffffff",
                border: "1px solid #003574",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Spróbuj ponownie
            </button>
            {/* Plain `<a>` (not next/link) is intentional — global-error
                runs even when the root layout failed to mount, so
                `<Link>` and the next router are not reliable here. The
                next/link lint rule is suppressed for this file only. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#003574",
                border: "1px solid #003574",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Strona główna
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
