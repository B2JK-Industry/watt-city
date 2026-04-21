import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/* Shared helpers for the E2E specs — keep logic here so smoke.spec.ts
 * (dev) and prod-smoke.spec.ts (Vercel) exercise the same code path.
 *
 * The filename starts with `_` so Playwright's default testDir glob
 * (`*.spec.ts`) ignores it — no accidental empty "test suite" loaded.
 */

/** Lowercase-alpha suffix for disposable usernames. Long enough to be
 *  collision-free across parallel workers; short enough to read in logs.
 *  Uses letters only — avoids the 7+ digit run that lib/gdpr-k.ts
 *  `PHONE_RE` rejects as PII. `l` is omitted so `rl` / `1l` can't look
 *  like a digit-one-lowercase-L to axe's anti-phishing heuristics. */
export function randomAlphaSuffix(len = 10): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Read the `wc_csrf` cookie from a browser context so tests can echo it
 *  as the `x-csrf-token` header on mutating requests — the same thing
 *  `lib/client-api.ts#postJson` does in the app. Without this every
 *  POST lands in 403 csrf-failed (by design, defense-in-depth). Returns
 *  an empty object if the cookie hasn't been seeded yet — the caller is
 *  responsible for first issuing a GET that triggers the middleware. */
export async function csrfHeaders(
  context: BrowserContext,
): Promise<Record<string, string>> {
  const cookies = await context.cookies();
  const token = cookies.find((c) => c.name === "wc_csrf")?.value;
  return token ? { "x-csrf-token": token } : {};
}

/** Ensure the CSRF cookie is present on `page.context()` by hitting the
 *  landing page once; the Edge middleware seeds the cookie on any HTML
 *  request that lacks it. Safe + idempotent. */
export async function primeCsrf(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  if (cookies.some((c) => c.name === "wc_csrf")) return;
  // Use fetch via the same context — the HTML response's Set-Cookie
  // lands in the browser jar automatically.
  await page.context().request.get("/");
}

/** Drop-in mutating-POST helper that primes the CSRF cookie and adds
 *  the header — for tests that want the "real browser" behaviour
 *  without duplicating that dance in every spec. */
export async function postJson(
  page: Page,
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  await primeCsrf(page);
  const headers = await csrfHeaders(page.context());
  const r = await page.request.post(path, {
    data: body as never,
    headers: { "content-type": "application/json", ...headers },
    failOnStatusCode: false,
  });
  const text = await r.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // leave as raw text
  }
  return { status: r.status(), body: parsed };
}

/** Same-context variant for when you hold an APIRequestContext directly
 *  (e.g. in `page.request` or a freshly-created context). */
export async function postJsonVia(
  ctx: APIRequestContext,
  csrfSource: BrowserContext,
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  const headers = await csrfHeaders(csrfSource);
  const r = await ctx.post(path, {
    data: body as never,
    headers: { "content-type": "application/json", ...headers },
    failOnStatusCode: false,
  });
  const text = await r.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep raw */
  }
  return { status: r.status(), body: parsed };
}

/** Wait for every running CSS animation / Web-Animation on the document
 *  to reach a settled frame — either `finished` resolves, or a timing-
 *  aware fallback cap expires for looping / infinite animations.
 *
 *  Why: axe's color-contrast rule samples a single frame. If a
 *  transient animation keyframes opacity (e.g. slide-up 0→1), any text
 *  rendered during the fade blends with the page background and
 *  trips WCAG 1.4.3. Waiting until the steady state makes the scan
 *  measure the user's actual reading experience. */
export async function waitForAnimationsSettled(
  page: Page,
  maxWaitMs = 1500,
): Promise<void> {
  await page.evaluate(async (cap) => {
    // Document.getAnimations() returns every Animation associated with
    // any element in the document — no options needed at this level
    // (the `{subtree}` option is the Element-level signature).
    const anims = document.getAnimations();
    if (anims.length === 0) return;
    const withinCap = anims.map(
      (a) =>
        new Promise<void>((resolve) => {
          const done = () => resolve();
          a.finished.then(done, done);
          const timing = a.effect?.getComputedTiming() ?? {};
          const iterations = Number(timing.iterations ?? 1);
          const duration = Number(timing.duration ?? 0);
          const singlePass =
            Number.isFinite(duration) && duration > 0 ? duration : cap;
          const budget =
            Number.isFinite(iterations) && iterations !== Infinity
              ? Math.min(cap, iterations * singlePass + 50)
              : cap;
          setTimeout(done, budget);
        }),
    );
    await Promise.all(withinCap);
  }, maxWaitMs);
}

export type A11yFinding = {
  id: string;
  impact: string | null | undefined;
  /* First-six-nodes detail — failing selector + rendered HTML snippet +
   * axe's per-node failure summary. Enough to triage a violation from
   * the Playwright log alone. */
  nodes: Array<{ target: string; html: string; summary: string }>;
};

/** Run an axe WCAG 2 A/AA scan and reduce to the serious/critical
 *  findings with enough per-node detail to debug without re-running.
 *  Always waits for animations to settle first. */
export async function scanSeriousA11y(page: Page): Promise<A11yFinding[]> {
  await waitForAnimationsSettled(page);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  return a11y.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 6).map((n) => ({
        target: Array.isArray(n.target) ? n.target.join(" ") : String(n.target),
        html: (n.html ?? "").slice(0, 140),
        summary: n.failureSummary ?? "",
      })),
    }));
}
