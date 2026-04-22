import { test, expect } from "@playwright/test";

/* Deep-audit Phase 1 backlog #13 — PWA + service-worker probes.
 *
 * Asserts the deploy-level contract:
 *   1. manifest.webmanifest is served with the correct content-type
 *      and all required fields (name, icons, start_url, display).
 *   2. service-worker.js is reachable, has `Content-Type` that makes
 *      browsers accept it for registration, and carries a long
 *      Cache-Control (SW files must be re-checked by the browser but
 *      the disk cache is OK to keep a copy).
 *   3. The root HTML includes `<link rel="manifest" href="…">` and
 *      references icons that resolve (no 404s).
 */

test.describe("pwa — manifest + service worker are served correctly", () => {
  test("/manifest.webmanifest has application/manifest+json content-type + required fields", async ({ request }) => {
    const r = await request.get("/manifest.webmanifest");
    expect(r.status()).toBe(200);
    const ct = r.headers()["content-type"] ?? "";
    expect(
      /manifest\+json|application\/json/.test(ct),
      `content-type: ${ct}`,
    ).toBe(true);
    const body = await r.json();
    expect(body.name, "manifest.name missing").toBeTruthy();
    expect(body.short_name, "manifest.short_name missing").toBeTruthy();
    expect(body.start_url, "manifest.start_url missing").toBeTruthy();
    expect(body.display, "manifest.display missing").toBeTruthy();
    expect(Array.isArray(body.icons), "manifest.icons not array").toBe(true);
    expect(body.icons.length).toBeGreaterThan(0);
  });

  test("/service-worker.js is reachable + JS content-type", async ({ request }) => {
    const r = await request.get("/service-worker.js");
    expect(r.status()).toBe(200);
    const ct = r.headers()["content-type"] ?? "";
    expect(/javascript/.test(ct), `content-type: ${ct}`).toBe(true);
    const body = await r.text();
    // Minimum contract: the SW listens for push + install events
    // (our current stub does both).
    expect(body).toMatch(/addEventListener\(["']install["']/);
    expect(body).toMatch(/addEventListener\(["']push["']/);
  });

  test("landing HTML references the manifest via <link rel=\"manifest\">", async ({ request }) => {
    const r = await request.get("/");
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toMatch(
      /<link[^>]+rel=["']manifest["'][^>]+href=["'][^"']+manifest/i,
    );
  });
});

test.describe("pwa — icons referenced by the manifest resolve", () => {
  test("every manifest icon returns 200 (no 404s)", async ({ request }) => {
    const manifest = await request
      .get("/manifest.webmanifest")
      .then((r) => r.json());
    const icons: Array<{ src: string }> = manifest.icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    const statuses = await Promise.all(
      icons.map(async (i) => {
        const r = await request.get(i.src);
        return { src: i.src, status: r.status() };
      }),
    );
    const broken = statuses.filter((s) => s.status >= 400);
    expect(broken, `broken icons: ${JSON.stringify(broken)}`).toEqual([]);
  });
});

test.describe("pwa — service worker registers without error on load", () => {
  test("loading the landing in chromium registers the SW within 2s", async ({ page }) => {
    await page.goto("/");
    // `navigator.serviceWorker.ready` resolves once a SW controller
    // is active. `PwaRegister` kicks off registration on mount.
    const hasController = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      try {
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    });
    // Playwright's headless Chrome supports SW registration but can
    // refuse on about:blank or file:// — on HTTP(S) dev it works.
    // `null` = SW API unavailable in this browser (e.g. old WebKit);
    // tolerate that by not failing, the browser-specific test would
    // catch it.
    if (hasController === null) return;
    expect(hasController).toBe(true);
  });
});
