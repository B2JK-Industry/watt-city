import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getClass, type SchoolClass } from "@/lib/class";
import { ClassDashboard } from "@/components/class-dashboard";

/* V4.1/V4.2 — per-class dashboard. Teacher sees the full hero panel
 * (leaderboard + roster + quick actions); student sees a read-only
 * "my class" digest.
 */

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export default async function ClassPage({ params }: RouteCtx) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const cls: SchoolClass | null = await getClass(id);
  if (!cls) {
    return (
      <div className="card p-6">
        <p className="text-sm">Klasa nie istnieje.</p>
        <Link href="/nauczyciel" className="underline text-[var(--accent)]">
          Wróć do dashboardu
        </Link>
      </div>
    );
  }
  const isTeacherOfClass = cls.teacherUsername === session.username;
  const isMember = cls.studentUsernames.includes(session.username);
  if (!isTeacherOfClass && !isMember) {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <p className="text-sm">Nie jesteś członkiem tej klasy.</p>
        <Link href="/" className="underline text-[var(--accent)]">
          Wróć na stronę główną
        </Link>
      </div>
    );
  }
  return (
    <ClassDashboard
      cls={cls}
      role={isTeacherOfClass ? "teacher" : "student"}
      viewerUsername={session.username}
    />
  );
}
