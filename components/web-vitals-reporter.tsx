"use client";

import { useReportWebVitals } from "next/web-vitals";

/* Mount in the root layout. next/web-vitals instruments navigations; we
 * shuttle every metric to /api/analytics/web-vitals with a sendBeacon so
 * the report survives navigation. */
export function WebVitalsReporter(): null {
  useReportWebVitals((metric) => {
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        route: typeof window !== "undefined" ? window.location.pathname : "/",
        nav: metric.navigationType,
      });
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/web-vitals", blob);
        return;
      }
      // Fallback: fire-and-forget fetch; CSRF isn't required (exempt? No — this
      // is a POST. Middleware requires a token. Our CsrfBootstrap wraps fetch
      // so the header is injected automatically.)
      fetch("/api/analytics/web-vitals", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* swallow */
    }
  });
  return null;
}
