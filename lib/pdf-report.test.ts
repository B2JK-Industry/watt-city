import { describe, it, expect } from "vitest";
import { generateWeeklyReportPdf } from "./pdf-report";
import type { SchoolClass } from "./class";
import type { ClassRosterEntry } from "./class-roster";

describe("V4.3 PDF report generator", () => {
  const cls: SchoolClass = {
    id: "C-test",
    name: "V.B Matematyka finansowa",
    grade: 7,
    subject: "WOS",
    teacherUsername: "teacher-alice",
    joinCode: "ABC123",
    studentUsernames: ["Anna_K", "Kuba_M"],
    weeklyTheme: "RRSO-basics",
    weeklyThemeStart: Date.now(),
    createdAt: Date.now(),
  };
  const roster: ClassRosterEntry[] = [
    {
      username: "Anna_K",
      cityLevel: 3,
      cityValue: 400,
      weightedScore: 1200,
      totalPlayed: 10,
      lastActiveAt: Date.now(),
    },
    {
      username: "Kuba_M",
      cityLevel: 2,
      cityValue: 200,
      weightedScore: 400,
      totalPlayed: 5,
      lastActiveAt: Date.now() - 60_000,
    },
  ];

  it("produces a non-empty PDF buffer with %PDF header", async () => {
    const buf = await generateWeeklyReportPdf({
      cls,
      roster,
      weekIso: "2026-W17",
      weekStartDate: "2026-04-13",
      weekEndDate: "2026-04-19",
      observedThemes: new Set(["RRSO-basics"]),
      observedGames: new Set(["finance-quiz"]),
      schoolName: "SP-12 Katowice",
      teacherDisplayName: "Alicja K.",
      generatedAt: "2026-04-19 10:00",
      grade: 7,
    });
    // PDF magic number
    expect(buf.length).toBeGreaterThan(1000);
    const head = buf.subarray(0, 5).toString("ascii");
    expect(head).toBe("%PDF-");
  }, 20_000);

  it("handles empty roster + no observations gracefully", async () => {
    const buf = await generateWeeklyReportPdf({
      cls: { ...cls, studentUsernames: [], weeklyTheme: null },
      roster: [],
      weekIso: "2026-W18",
      weekStartDate: "2026-04-27",
      weekEndDate: "2026-05-03",
      observedThemes: new Set(),
      observedGames: new Set(),
      schoolName: "Test",
      teacherDisplayName: "T",
      generatedAt: "2026-04-27 10:00",
      grade: 7,
    });
    expect(buf.length).toBeGreaterThan(500);
  }, 20_000);

  /* D2 polish — regression guards for the fixes shipped in this pass:
   * 1) Roboto font is registered so Polish diacritics render instead
   *    of broken "UczeD"/"SzkoBa"/"WartoO" fallback glyphs.
   * 2) Large rosters (20+ students) paginate onto multiple pages. */

  it("registers Roboto and uses it as page fontFamily", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const src = readFileSync(
      join(process.cwd(), "lib", "pdf-report.tsx"),
      "utf8",
    );
    expect(src.includes('Font.register({')).toBe(true);
    expect(src.includes('family: "Roboto"')).toBe(true);
    expect(src.includes('Roboto-Regular.ttf')).toBe(true);
    expect(src.includes('Roboto-Bold.ttf')).toBe(true);
    expect(src.includes('fontFamily: "Roboto"')).toBe(true);
    // Helvetica was the pre-fix font — must not leak back.
    expect(src.includes('fontFamily: "Helvetica"')).toBe(false);
  });

  it("paginates large rosters into multiple pages (wrap true)", async () => {
    const bigRoster: ClassRosterEntry[] = Array.from({ length: 30 }).map(
      (_, i) => ({
        username: `Uczeń_${i + 1}`,
        cityLevel: 2 + (i % 4),
        cityValue: 200 + i * 80,
        weightedScore: 400 + i * 120,
        totalPlayed: 2 + i,
        lastActiveAt: Date.now() - i * 60_000,
      }),
    );
    const buf = await generateWeeklyReportPdf({
      cls: { ...cls, studentUsernames: bigRoster.map((r) => r.username) },
      roster: bigRoster,
      weekIso: "2026-W17",
      weekStartDate: "2026-04-13",
      weekEndDate: "2026-04-19",
      observedThemes: new Set(["RRSO-basics"]),
      observedGames: new Set(["finance-quiz", "stock-tap"]),
      schoolName: "Szkoła Podstawowa nr 12",
      teacherDisplayName: "Alicja Kowalska",
      generatedAt: "2026-04-19 10:00",
      grade: 7,
    });
    const text = buf.toString("binary");
    // Count page objects (2+ means pagination kicked in).
    const pageCount = (text.match(/\/Type \/Page\n/g) || []).length;
    expect(pageCount).toBeGreaterThanOrEqual(2);
  }, 30_000);

  it("keeps curriculum chart together (wrap={false} guard)", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const src = readFileSync(
      join(process.cwd(), "lib", "pdf-report.tsx"),
      "utf8",
    );
    expect(src.includes("wrap={false}")).toBe(true);
  });

  it("repeats the header on subsequent pages (fixed prop)", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const src = readFileSync(
      join(process.cwd(), "lib", "pdf-report.tsx"),
      "utf8",
    );
    // Both the headerRow and the footer should be `fixed` — footer was
    // already fixed pre-polish, headerRow added in D2.
    expect(src.includes("style={s.headerRow} fixed")).toBe(true);
    expect(src.includes("style={s.footer} fixed")).toBe(true);
  });
});
