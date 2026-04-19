import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getClass, getTeacher, currentWeekIso } from "@/lib/class";
import { classRoster } from "@/lib/class-roster";
import { generateWeeklyReportPdf } from "@/lib/pdf-report";
import { recentLedger } from "@/lib/player";

/* V4.3 — Node.js runtime (react-pdf needs it). Streams the PDF back
 * with filename `watt-city-<classId>-<week>.pdf` so the browser
 * download defaults to something meaningful. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function parseWeek(weekParam: string | null): string {
  if (weekParam && /^\d{4}-W\d{2}$/.test(weekParam)) return weekParam;
  return currentWeekIso();
}

function weekBoundsFromIso(iso: string): { start: Date; end: Date } {
  const m = iso.match(/^(\d{4})-W(\d{2})$/);
  if (!m) {
    const now = new Date();
    return { start: now, end: now };
  }
  const year = Number(m[1]);
  const week = Number(m[2]);
  // ISO-8601 week: 4 Jan is always in week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const cls = await getClass(id);
  if (!cls) return Response.json({ ok: false, error: "not-found" }, { status: 404 });
  if (cls.teacherUsername !== session.username) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const weekIso = parseWeek(req.nextUrl.searchParams.get("week"));
  const { start, end } = weekBoundsFromIso(weekIso);

  // Collect observed themes + games from every student's recent
  // ledger (scope: all score entries this calendar week).
  const observedThemes = new Set<string>();
  const observedGames = new Set<string>();
  for (const student of cls.studentUsernames) {
    const log = await recentLedger(student, 100);
    for (const entry of log) {
      if (entry.kind !== "score") continue;
      if (entry.ts < start.getTime() || entry.ts > end.getTime() + 24 * 60 * 60 * 1000) {
        continue;
      }
      const gameId = (entry.meta?.gameId as string) ?? "";
      const aiKind = (entry.meta?.aiKind as string) ?? "";
      if (gameId) observedGames.add(gameId);
      if (aiKind) observedThemes.add(aiKind);
    }
  }
  if (cls.weeklyTheme) observedThemes.add(cls.weeklyTheme);

  const roster = await classRoster(cls);
  const teacher = await getTeacher(cls.teacherUsername);

  const pdf = await generateWeeklyReportPdf({
    cls,
    roster,
    weekIso,
    weekStartDate: start.toISOString().slice(0, 10),
    weekEndDate: end.toISOString().slice(0, 10),
    observedThemes,
    observedGames,
    schoolName: teacher?.schoolName ?? "Szkoła",
    teacherDisplayName: teacher?.displayName ?? cls.teacherUsername,
    generatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    grade:
      cls.grade >= 5 && cls.grade <= 8
        ? (cls.grade as 5 | 6 | 7 | 8)
        : 7,
  });

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="watt-city-${cls.id}-${weekIso}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
