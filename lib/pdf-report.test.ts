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
});
