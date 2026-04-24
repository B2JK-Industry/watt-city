import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getTeacher, isTeacher, listClassesFor } from "@/lib/class";
import { TeacherClassCreator } from "@/components/teacher-class-creator";
import { TeacherOnboardingTour } from "@/components/teacher-onboarding-tour";
import { PkoMascot } from "@/components/pko-mascot";

/* V4.1 — teacher dashboard. Landing destination after signup; shows
 * existing classes + inline wizard to create a new one. */

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/nauczyciel/signup");
  }
  if (!(await isTeacher(session.username))) {
    redirect("/dla-szkol");
  }
  const [teacher, classes] = await Promise.all([
    getTeacher(session.username),
    listClassesFor(session.username),
  ]);

  return (
    <div className="flex flex-col gap-8 animate-slide-up max-w-5xl">
      <TeacherOnboardingTour tourSeenAt={teacher?.tourSeenAt ?? null} />

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">
            Witaj, nauczycielu
          </p>
          <h1 className="section-heading text-3xl sm:text-4xl">
            {teacher?.displayName ?? session.username}
          </h1>
          <p className="text-sm text-zinc-300">
            {teacher?.schoolName ?? "Szkoła"} ·{" "}
            <span className="opacity-70">
              {classes.length === 0
                ? "brak klas"
                : `${classes.length} klas${classes.length === 1 ? "a" : ""}`}
            </span>
          </p>
        </div>
        {/* V4.10 — PKO corner badge (only renders when SKIN=pko) */}
        <PkoMascot size="badge" />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="section-heading text-xl">Twoje klasy</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">
            Nie masz jeszcze klasy. Utwórz pierwszą poniżej.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((cls) => (
              <li key={cls.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                  <span className="text-[10px] opacity-70">
                    klasa {cls.grade}
                  </span>
                </div>
                <p className="text-xs opacity-70">
                  Kod dołączenia:{" "}
                  <strong className="font-mono text-[var(--accent)]">
                    {cls.joinCode}
                  </strong>{" "}
                  · {cls.studentUsernames.length} uczniów
                </p>
                <Link
                  href={`/klasa/${cls.id}`}
                  className="btn btn-primary text-xs mt-1"
                >
                  Otwórz dashboard klasy
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <TeacherClassCreator />
      </section>
    </div>
  );
}
