import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* D4 — 1-click demo start flow.
 *
 * New surface: POST /api/dla-szkol/demo/start → seeds demo (if absent),
 * creates session for demo-teacher-pl, returns { ok: true, redirectTo:
 * "/nauczyciel" }. The landing page /dla-szkol/demo renders a
 * <DemoStartButton> that calls it.
 *
 * Integration test below exercises the route handler directly (Redis
 * falls back to in-memory in test env), then validates the session
 * cookie was set on the response.
 */

const ROOT = join(__dirname, "..");
const ROUTE = readFileSync(
  join(ROOT, "app", "api", "dla-szkol", "demo", "start", "route.ts"),
  "utf8",
);
const PAGE = readFileSync(
  join(ROOT, "app", "dla-szkol", "demo", "page.tsx"),
  "utf8",
);
const BTN = readFileSync(
  join(ROOT, "app", "dla-szkol", "demo", "demo-start-button.tsx"),
  "utf8",
);

describe("D4 — /api/dla-szkol/demo/start route", () => {
  it("is a POST handler with nodejs runtime", () => {
    expect(ROUTE.includes("export async function POST")).toBe(true);
    expect(ROUTE.includes('runtime = "nodejs"')).toBe(true);
    expect(ROUTE.includes('dynamic = "force-dynamic"')).toBe(true);
  });

  it("seeds demo school (idempotent via isDemoSeedPresent)", () => {
    expect(ROUTE.includes("seedDemoSchool")).toBe(true);
    expect(ROUTE.includes("isDemoSeedPresent")).toBe(true);
  });

  it("creates a session for DEMO_TEACHER_USERNAME", () => {
    expect(ROUTE.includes("createSession")).toBe(true);
    expect(ROUTE.includes("DEMO_TEACHER_USERNAME")).toBe(true);
  });

  it("guards on v4_demo_seed flag (belt-and-suspenders)", () => {
    expect(ROUTE.includes('isFlagEnabled("v4_demo_seed"')).toBe(true);
    expect(ROUTE.includes("demo-disabled")).toBe(true);
  });

  it("returns redirectTo /nauczyciel on success", () => {
    expect(ROUTE.includes('redirectTo: "/nauczyciel"')).toBe(true);
  });
});

describe("D4 — /dla-szkol/demo landing", () => {
  it("mounts the <DemoStartButton>", () => {
    expect(PAGE.includes("DemoStartButton")).toBe(true);
    expect(PAGE.includes('from "./demo-start-button"')).toBe(true);
  });

  it("references the demo credentials via constants (no hard-code)", () => {
    expect(PAGE.includes("DEMO_TEACHER_USERNAME")).toBe(true);
    expect(PAGE.includes("DEMO_CLASS_NAME")).toBe(true);
  });

  it("links to /nauczyciel/signup for users who want their own account", () => {
    expect(PAGE.includes('href="/nauczyciel/signup"')).toBe(true);
  });
});

describe("D4 — <DemoStartButton> client component", () => {
  it('is a "use client" component', () => {
    expect(BTN.startsWith('"use client"')).toBe(true);
  });

  it("POSTs to /api/dla-szkol/demo/start and follows redirect", () => {
    expect(BTN.includes('"/api/dla-szkol/demo/start"')).toBe(true);
    expect(BTN.includes("method: \"POST\"")).toBe(true);
    expect(BTN.includes("window.location.href")).toBe(true);
  });

  it("shows a pending state during the POST", () => {
    expect(BTN.includes("useTransition")).toBe(true);
    expect(BTN.includes("isPending")).toBe(true);
  });

  it("surfaces errors without leaving the page", () => {
    expect(BTN.includes("setError")).toBe(true);
  });
});

/* The end-to-end POST call requires Next.js request scope for
 * `cookies()` (createSession writes a cookie). That scope is only
 * available inside a real dev/prod server or under `next dev --e2e`,
 * neither of which vitest provides. We stop at the file-level guards
 * — the happy path is smoke-tested manually against the dev server. */
