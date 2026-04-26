import { test, type Page, type BrowserContext } from "@playwright/test";
import { primeCsrf, randomAlphaSuffix, scanSeriousA11y } from "./_helpers";
import fs from "node:fs";
import path from "node:path";

/* Senior product walkthrough — visual + functional capture.
 *
 * Iterates anonymous + logged-in (kid + teacher) flows on desktop and
 * mobile viewports, takes full-page screenshots and runs an axe-core
 * scan per page. Output lands in tmp/walkthrough-shots/ + a JSON
 * findings ledger so a reviewer can diff visual state with one read.
 */

/* Output goes to `tmp/walkthrough-shots/<LABEL>/` so multiple runs
 * (e.g. pre-/post-PR) can be diffed via `pnpm test:walk:diff`. The
 * default label is `current` to keep one-shot manual runs simple;
 * set `WALKTHROUGH_LABEL=<name>` to bucket a baseline run. */
const LABEL = process.env.WALKTHROUGH_LABEL ?? "current";
const SHOT_DIR = path.resolve(process.cwd(), "tmp/walkthrough-shots", LABEL);
const FINDINGS_PATH = path.join(SHOT_DIR, "_findings.json");

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

type ConsoleErr = { type: string; text: string; location?: string };
type RouteFinding = {
  route: string;
  viewport: "desktop" | "mobile";
  status: number | null;
  durationMs: number;
  consoleErrors: ConsoleErr[];
  pageErrors: string[];
  a11ySerious: Array<{ id: string; impact: string | null | undefined; nodeCount: number; firstTarget?: string }>;
  shot: string;
};

const findings: RouteFinding[] = [];

function recordFinding(f: RouteFinding) {
  findings.push(f);
  fs.writeFileSync(FINDINGS_PATH, JSON.stringify(findings, null, 2));
}

function attachConsoleCapture(page: Page) {
  const consoleErrors: ConsoleErr[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text().slice(0, 400),
        location: `${msg.location().url}:${msg.location().lineNumber}`,
      });
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message.slice(0, 400));
  });
  return { consoleErrors, pageErrors };
}

/* Pre-mark cookie consent as accepted so its sticky bar never lands
 * in any review screenshot. The key is the `LOCAL_KEY` from
 * `components/cookie-consent.tsx` (`wc_cookie_consent_v1`); we set it
 * before every navigation so a fresh BrowserContext doesn't leak the
 * banner into the first capture. Best-effort: storage may be unset
 * pre-navigation in some browser contexts, so we wrap in try/catch. */
async function dismissCookieBanner(page: Page) {
  await page
    .evaluate(() => {
      try {
        localStorage.setItem("wc_cookie_consent_v1", String(Date.now()));
      } catch {
        /* storage unavailable — ignore */
      }
    })
    .catch(() => null);
}

async function captureRoute(
  page: Page,
  route: string,
  viewport: "desktop" | "mobile",
  label: string,
) {
  const start = Date.now();
  const cap = attachConsoleCapture(page);
  let status: number | null = null;
  page.once("response", (res) => {
    if (res.url().endsWith(route) || res.url().endsWith(route + "/")) {
      status = res.status();
    }
  });
  try {
    const resp = await page.goto(route, { waitUntil: "networkidle", timeout: 25_000 });
    if (resp) status = resp.status();
  } catch (e) {
    cap.pageErrors.push(`navigation: ${(e as Error).message}`);
  }
  await dismissCookieBanner(page);
  // brief settle for any client-side hydration / animations
  await page.waitForTimeout(400);

  const shot = `${viewport}__${label}.png`;
  await page.screenshot({ path: path.join(SHOT_DIR, shot), fullPage: true }).catch(() => null);

  let a11y: RouteFinding["a11ySerious"] = [];
  try {
    const findings = await scanSeriousA11y(page);
    a11y = findings.map((f) => ({
      id: f.id,
      impact: f.impact,
      nodeCount: f.nodes.length,
      firstTarget: f.nodes[0]?.target,
    }));
  } catch {
    // ignore — page may be navigating
  }

  recordFinding({
    route,
    viewport,
    status,
    durationMs: Date.now() - start,
    consoleErrors: cap.consoleErrors,
    pageErrors: cap.pageErrors,
    a11ySerious: a11y,
    shot,
  });

  // detach listeners by clearing arrays — page is reused across goto's
  cap.consoleErrors.length = 0;
  cap.pageErrors.length = 0;
}

const PUBLIC_ROUTES: Array<[route: string, label: string]> = [
  ["/", "01-landing"],
  ["/o-platforme", "02-o-platforme"],
  ["/dla-szkol", "03-dla-szkol"],
  ["/dla-szkol/materialy", "04-dla-szkol-materialy"],
  ["/login", "05-login"],
  ["/register", "06-register"],
  ["/sin-slavy", "07-sin-slavy"],
  ["/leaderboard", "08-leaderboard"],
  ["/games", "09-games-anon"],
  ["/ochrana-sukromia", "10-privacy"],
  ["/status", "11-status"],
  ["/nauczyciel/signup", "12-teacher-signup"],
  ["/rodzic/dolacz", "13-parent-redeem"],
];

const KID_ROUTES: Array<[route: string, label: string]> = [
  ["/", "20-dashboard"],
  ["/miasto", "21-miasto"],
  ["/games", "22-games-loggedin"],
  ["/games/finance-quiz", "23-game-finance-quiz"],
  ["/games/math-sprint", "24-game-math-sprint"],
  ["/games/budget-balance", "25-game-budget-balance"],
  ["/profile", "26-profile"],
  ["/loans/compare", "27-loans-compare"],
  ["/friends", "28-friends"],
  ["/marketplace", "29-marketplace"],
  ["/parent", "30-parent-hub"],
  ["/propose-theme", "31-propose-theme"],
  ["/pko", "32-pko-mirror"],
];

const TEACHER_ROUTES: Array<[route: string, label: string]> = [
  ["/nauczyciel", "40-teacher-dashboard"],
  ["/dla-szkol", "41-teacher-dla-szkol"],
];

async function registerKid(page: Page, ctx: BrowserContext): Promise<string> {
  const username = `wt_${randomAlphaSuffix(10)}`;
  await primeCsrf(page);
  const cookies = await ctx.cookies();
  const csrf = cookies.find((c) => c.name === "wc_csrf")?.value;
  const r = await page.request.post("/api/auth/register", {
    data: { username, password: "demo-password-12345", birthYear: 2010 },
    headers: csrf ? { "x-csrf-token": csrf, "content-type": "application/json" } : { "content-type": "application/json" },
  });
  if (!r.ok()) {
    const body = await r.text();
    throw new Error(`register kid ${username}: ${r.status()} ${body}`);
  }
  return username;
}

async function registerTeacher(page: Page, ctx: BrowserContext): Promise<string> {
  const username = `tc_${randomAlphaSuffix(10)}`;
  await primeCsrf(page);
  const cookies = await ctx.cookies();
  const csrf = cookies.find((c) => c.name === "wc_csrf")?.value;
  const r = await page.request.post("/api/nauczyciel/signup", {
    data: {
      displayName: "Demo Nauczyciel",
      email: `${username}@example.test`,
      schoolName: "Szkoła Demo",
      username,
      password: "demo-password-12345",
      consent: true,
    },
    headers: csrf ? { "x-csrf-token": csrf, "content-type": "application/json" } : { "content-type": "application/json" },
  });
  if (!r.ok()) {
    const body = await r.text();
    throw new Error(`register teacher ${username}: ${r.status()} ${body}`);
  }
  return username;
}

async function seedSomeXp(page: Page, ctx: BrowserContext) {
  await primeCsrf(page);
  const cookies = await ctx.cookies();
  const csrf = cookies.find((c) => c.name === "wc_csrf")?.value;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (csrf) headers["x-csrf-token"] = csrf;
  for (const [gameId, xp] of [
    ["finance-quiz", 80],
    ["math-sprint", 60],
    ["memory-match", 40],
    ["currency-rush", 60],
  ] as const) {
    await page.request.post("/api/score", { data: { gameId, xp }, headers, failOnStatusCode: false });
  }
}

test.describe.configure({ mode: "serial" });

test("walkthrough: anonymous + kid + teacher across desktop and mobile", async ({ browser }) => {
  test.setTimeout(600_000);

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  const desktopPage = await desktop.newPage();
  const mobilePage = await mobile.newPage();

  // ---- Anonymous pass ----
  for (const [route, label] of PUBLIC_ROUTES) {
    await captureRoute(desktopPage, route, "desktop", label);
    await captureRoute(mobilePage, route, "mobile", label);
  }

  // ---- Kid pass ----
  await registerKid(desktopPage, desktop);
  await seedSomeXp(desktopPage, desktop);
  // Mobile: independent kid (so we see fresh dashboard on mobile too)
  await registerKid(mobilePage, mobile);
  await seedSomeXp(mobilePage, mobile);

  for (const [route, label] of KID_ROUTES) {
    await captureRoute(desktopPage, route, "desktop", label);
    await captureRoute(mobilePage, route, "mobile", label);
  }

  // ---- Teacher pass — fresh contexts so we don't carry kid session ----
  await desktop.clearCookies();
  await mobile.clearCookies();
  await registerTeacher(desktopPage, desktop);
  await registerTeacher(mobilePage, mobile);

  for (const [route, label] of TEACHER_ROUTES) {
    await captureRoute(desktopPage, route, "desktop", label);
    await captureRoute(mobilePage, route, "mobile", label);
  }

  await desktop.close();
  await mobile.close();

  // Final write
  fs.writeFileSync(FINDINGS_PATH, JSON.stringify(findings, null, 2));
});
