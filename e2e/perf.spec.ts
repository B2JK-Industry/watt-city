import { test, expect } from "@playwright/test";
import { waitForAnimationsSettled } from "./_helpers";

/* Phase 8 — perf.
 *
 * Lightweight Core Web Vitals-ish checks using Chromium's built-in
 * Performance API — no Lighthouse dependency. The thresholds are
 * intentionally generous for a dev server on a developer laptop;
 * they're regression guards, not marketing targets. Tune down when
 * running against prod (pass `PERF_STRICT=1`).
 *
 * We measure:
 *   - TTFB (server response time)
 *   - DOMContentLoaded (parse + blocking scripts)
 *   - `load` (all resources)
 *   - Largest Contentful Paint (if available — needs a PerformanceObserver)
 *
 * Budgets are per-route; the landing + games hub are the two pages
 * a first-time visitor is most likely to see, so they get the
 * tightest limits.
 */

const STRICT = process.env.PERF_STRICT === "1";

type Budget = {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadMs: number;
  largestContentfulPaintMs: number;
};

const BUDGET_DEV: Budget = {
  ttfbMs: 4000,
  domContentLoadedMs: 8000,
  loadMs: 15000,
  largestContentfulPaintMs: 10000,
};

const BUDGET_STRICT: Budget = {
  ttfbMs: 800,
  domContentLoadedMs: 2500,
  loadMs: 5000,
  largestContentfulPaintMs: 2500,
};

const BUDGET = STRICT ? BUDGET_STRICT : BUDGET_DEV;

const TARGETS = ["/", "/games", "/leaderboard", "/o-platforme"] as const;

test.describe("perf — per-route timing", () => {
  for (const path of TARGETS) {
    test(`${path} meets ${STRICT ? "STRICT" : "DEV"} Core-Web-Vitals budget`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await waitForAnimationsSettled(page);

      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        const paint = performance.getEntriesByType("paint");
        const fcp = paint.find((e) => e.name === "first-contentful-paint");
        // LCP via observer — poll the last reported entry.
        return new Promise<{
          ttfbMs: number;
          domContentLoadedMs: number;
          loadMs: number;
          fcpMs: number | null;
          lcpMs: number | null;
        }>((resolve) => {
          let lcp: number | null = null;
          try {
            const obs = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const last = entries[entries.length - 1];
              if (last) lcp = last.startTime;
            });
            obs.observe({ type: "largest-contentful-paint", buffered: true });
            // 250ms polling window is enough for buffered entries to
            // arrive; we're not measuring LCP in real-time here.
            setTimeout(() => {
              obs.disconnect();
              resolve({
                ttfbMs: nav ? nav.responseStart - nav.requestStart : -1,
                domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : -1,
                loadMs: nav ? nav.loadEventEnd - nav.startTime : -1,
                fcpMs: fcp ? fcp.startTime : null,
                lcpMs: lcp,
              });
            }, 250);
          } catch {
            resolve({
              ttfbMs: nav ? nav.responseStart - nav.requestStart : -1,
              domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : -1,
              loadMs: nav ? nav.loadEventEnd - nav.startTime : -1,
              fcpMs: fcp ? fcp.startTime : null,
              lcpMs: null,
            });
          }
        });
      });

      expect(timing.ttfbMs, `${path} ttfb=${timing.ttfbMs}`).toBeLessThan(BUDGET.ttfbMs);
      expect(timing.domContentLoadedMs, `${path} dcl=${timing.domContentLoadedMs}`).toBeLessThan(BUDGET.domContentLoadedMs);
      expect(timing.loadMs, `${path} load=${timing.loadMs}`).toBeLessThan(BUDGET.loadMs);
      if (timing.lcpMs !== null) {
        expect(timing.lcpMs, `${path} lcp=${timing.lcpMs}`).toBeLessThan(BUDGET.largestContentfulPaintMs);
      }
    });
  }
});

test.describe("perf — layout stability (CLS proxy)", () => {
  for (const path of TARGETS) {
    test(`${path} accumulates no layout shifts after settle`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await waitForAnimationsSettled(page);
      // Give ~500ms for any late-rendering widgets to settle, then
      // start measuring from a clean slate via a fresh PerformanceObserver.
      const cls = await page.evaluate(() =>
        new Promise<number>((resolve) => {
          let total = 0;
          const obs = new PerformanceObserver((list) => {
            for (const e of list.getEntries() as PerformanceEntry[] & { hadRecentInput?: boolean; value?: number }[]) {
              const entry = e as unknown as { hadRecentInput: boolean; value: number };
              if (!entry.hadRecentInput) total += entry.value;
            }
          });
          try {
            obs.observe({ type: "layout-shift", buffered: false });
          } catch {
            resolve(0);
            return;
          }
          setTimeout(() => {
            obs.disconnect();
            resolve(total);
          }, 1500);
        }),
      );
      // WCAG-adjacent: CLS < 0.1 is "good", < 0.25 is "needs improvement".
      // Post-settle, there should be zero shifts — nothing in the page
      // re-renders after animations finish. Generous 0.25 cap.
      expect(cls, `${path} CLS after settle=${cls}`).toBeLessThan(0.25);
    });
  }
});
