import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/* D3 — curriculum alignment UI surfacing.
 *
 * V4.5 shipped `lib/curriculum.ts`, `components/curriculum-chart.tsx`,
 * and the PDF report coverage section. The gap: neither the class
 * dashboard nor the teacher had a way to *set* a curriculum-aligned
 * weekly theme from the UI (only the PDF showed coverage).
 *
 * D3 adds:
 *   - `components/weekly-theme-picker.tsx` (new client component)
 *   - `ClassDashboard` mounts both `CurriculumChart` + `WeeklyThemePicker`
 *     with observedThemes/observedGames computed from the week's ledger
 *
 * File-level guards below catch silent refactors that strip the mount.
 */

const ROOT = join(__dirname, "..");
const DASH = readFileSync(
  join(ROOT, "components", "class-dashboard.tsx"),
  "utf8",
);
const PICKER = readFileSync(
  join(ROOT, "components", "weekly-theme-picker.tsx"),
  "utf8",
);

describe("D3 — ClassDashboard mounts curriculum surfaces", () => {
  it("imports CurriculumChart + WeeklyThemePicker", () => {
    expect(DASH.includes('from "@/components/curriculum-chart"')).toBe(true);
    expect(DASH.includes('from "@/components/weekly-theme-picker"')).toBe(true);
  });

  it("computes observedThemes/observedGames from per-student ledger", () => {
    expect(DASH.includes("recentLedger")).toBe(true);
    expect(DASH.includes("observedThemes")).toBe(true);
    expect(DASH.includes("observedGames")).toBe(true);
    // Week-window gate uses weeklyThemeStart or falls back to "last 7 days"
    expect(DASH.includes("weekStart")).toBe(true);
  });

  it("renders <CurriculumChart> for every viewer (student + teacher)", () => {
    expect(DASH.includes("<CurriculumChart")).toBe(true);
    // Must be outside the `role === 'teacher'` gate — students also see it.
    const chartIdx = DASH.indexOf("<CurriculumChart");
    const teacherGate = DASH.indexOf('role === "teacher"');
    // The chart appears AFTER the teacher gate block but is not itself
    // nested inside the `{role === "teacher" && ...}` expression.
    expect(chartIdx).toBeGreaterThan(0);
    expect(teacherGate).toBeGreaterThan(0);
  });

  it("renders <WeeklyThemePicker> only for teacher role", () => {
    expect(DASH.includes("<WeeklyThemePicker")).toBe(true);
    // Extract a slice around the picker and assert it sits inside a
    // `role === "teacher" &&` conditional.
    const pickerIdx = DASH.indexOf("<WeeklyThemePicker");
    const before = DASH.slice(Math.max(0, pickerIdx - 200), pickerIdx);
    expect(before.includes('role === "teacher"')).toBe(true);
  });
});

describe("D3 — WeeklyThemePicker contract", () => {
  it('is a "use client" component', () => {
    expect(PICKER.startsWith('"use client"')).toBe(true);
  });

  it("POSTs to /api/klasa/[id]/weekly-theme with { theme } body", () => {
    expect(PICKER.includes("/api/klasa/")).toBe(true);
    expect(PICKER.includes("/weekly-theme")).toBe(true);
    expect(PICKER.includes("theme: themeTag")).toBe(true);
    expect(PICKER.includes("theme: null")).toBe(true);
  });

  it("groups codes by CurriculumArea inside the <select>", () => {
    expect(PICKER.includes("<optgroup")).toBe(true);
    expect(PICKER.includes("byArea")).toBe(true);
  });

  it("uses prefers-reduced-motion-safe animation only", () => {
    // Every `animate-pulse` usage must be prefixed with `motion-safe:`.
    const total = (PICKER.match(/animate-pulse/g) || []).length;
    const safe = (PICKER.match(/motion-safe:animate-pulse/g) || []).length;
    expect(total).toBeGreaterThan(0);
    expect(safe).toBe(total);
  });

  it("shows the selected code's description + theme/game tags", () => {
    expect(PICKER.includes("selectedCurriculum")).toBe(true);
    expect(PICKER.includes("description")).toBe(true);
    expect(PICKER.includes("themes")).toBe(true);
    expect(PICKER.includes("games")).toBe(true);
  });
});
