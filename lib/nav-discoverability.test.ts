import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* Cleanup issue 5 — nav discoverability for V4 pages.
 *
 * Audit found `/dla-szkol`, `/klasa`, `/rodzic`, `/pko` all 200 but
 * not reachable from the nav. We add role-aware links to SiteNav:
 *   anonymous → "Dla szkół" → /dla-szkol
 *   teacher   → "Moje klasy" → /nauczyciel
 *   parent    → "Dziecko" → /rodzic
 *
 * File-level asserts since SiteNav's role prop comes from a server-
 * component detection layer in `app/layout.tsx`.
 */

const ROOT = join(__dirname, "..");
const NAV = readFileSync(join(ROOT, "components", "site-nav.tsx"), "utf8");
const LAYOUT = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");

describe("SiteNav role prop surface", () => {
  it("accepts optional `role` prop with the 4 expected values", () => {
    expect(NAV.includes('role?: "kid" | "teacher" | "parent" | "anon"')).toBe(
      true,
    );
  });

  it("defaults role to kid when logged in, anon when not", () => {
    expect(NAV.includes('role = username ? "kid" : "anon"')).toBe(true);
  });

  it("adds /dla-szkol link for anonymous role", () => {
    expect(NAV.includes('/dla-szkol')).toBe(true);
    expect(NAV.includes("SCHOOL_LABEL[lang]")).toBe(true);
  });

  it("adds /nauczyciel link for teacher role", () => {
    expect(NAV.includes('/nauczyciel')).toBe(true);
    expect(NAV.includes("TEACHER_CLASSES_LABEL")).toBe(true);
  });

  it("adds /rodzic link for parent role", () => {
    expect(NAV.includes('/rodzic')).toBe(true);
    expect(NAV.includes("PARENT_KID_LABEL")).toBe(true);
  });

  it("provides 4-lang labels for each role addition (PL/UK/CS/EN)", () => {
    // Each label map has four keys — cheap regex scan.
    for (const label of ["SCHOOL_LABEL", "TEACHER_CLASSES_LABEL", "PARENT_KID_LABEL"]) {
      const re = new RegExp(
        `const ${label}[^=]*=\\s*\\{[^}]*pl:[^,]+,\\s*uk:[^,]+,\\s*cs:[^,]+,\\s*en:[^,]+`,
        "s",
      );
      expect(re.test(NAV), `${label} lacks all 4 langs`).toBe(true);
    }
  });
});

describe("layout.tsx role detection + SiteNav wiring", () => {
  it("imports isTeacher + parentKidUsername", () => {
    expect(LAYOUT.includes("isTeacher")).toBe(true);
    expect(LAYOUT.includes("parentKidUsername")).toBe(true);
  });

  it("passes role prop to SiteNav", () => {
    expect(LAYOUT.includes("role={navRole}")).toBe(true);
  });

  it("computes navRole with anon → teacher → parent → kid precedence", () => {
    // Minimum structural check — full precedence proven at runtime via /api/me.
    expect(LAYOUT.includes('? "anon"')).toBe(true);
    expect(LAYOUT.includes('? "teacher"')).toBe(true);
    expect(LAYOUT.includes('? "parent"')).toBe(true);
    expect(LAYOUT.includes('"kid"')).toBe(true);
  });
});
