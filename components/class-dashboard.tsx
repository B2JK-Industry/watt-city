import Link from "next/link";
import type { SchoolClass } from "@/lib/class";
import { classRoster, type ClassRosterEntry } from "@/lib/class-roster";

/* V4.2 — class dashboard hero panel. Server component. */

type Props = {
  cls: SchoolClass;
  role: "teacher" | "student";
  viewerUsername: string;
};

export async function ClassDashboard({ cls, role, viewerUsername }: Props) {
  const roster = await classRoster(cls);
  const ordered = [...roster].sort((a, b) => b.weightedScore - a.weightedScore);
  const top10 = ordered.slice(0, 10);

  const weekDeadline = cls.weeklyThemeStart
    ? cls.weeklyThemeStart + 7 * 24 * 60 * 60 * 1000
    : null;
  const daysLeft = weekDeadline
    ? Math.max(0, Math.ceil((weekDeadline - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-widest opacity-60">
            Klasa {cls.grade}
            {cls.subject ? ` · ${cls.subject}` : ""}
          </p>
          <h1 className="brutal-heading text-3xl sm:text-4xl">{cls.name}</h1>
          <p className="text-xs opacity-70">
            Kod dołączenia:{" "}
            <strong className="font-mono text-[var(--accent)]">
              {cls.joinCode}
            </strong>{" "}
            · {cls.studentUsernames.length} uczniów
          </p>
        </div>
        {role === "teacher" && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/klasa/${cls.id}/report?format=pdf`}
              className="btn btn-primary text-sm"
              prefetch={false}
            >
              📄 Pobierz raport PDF
            </Link>
            <Link
              href={`/nauczyciel`}
              className="btn btn-ghost text-sm"
            >
              ← Klasy
            </Link>
          </div>
        )}
      </header>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest font-black text-[var(--accent)]">
          🎯 Temat tygodnia
        </h2>
        {cls.weeklyTheme ? (
          <>
            <p className="font-bold text-lg">{cls.weeklyTheme}</p>
            {daysLeft !== null && (
              <p className="text-xs opacity-70">
                {daysLeft === 0 ? "Ostatni dzień tego tygodnia" : `${daysLeft} dni zostało`}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm italic opacity-70">
            {role === "teacher"
              ? "Nie ustawiłeś jeszcze tematu tygodnia. Otwórz edytor niżej."
              : "Nauczyciel nie ustawił tematu tygodnia."}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="card p-4 flex flex-col gap-3">
          <h2 className="brutal-heading text-lg">📊 Liga klasy (top 10)</h2>
          {top10.length === 0 ? (
            <p className="text-sm italic opacity-70">
              Żaden uczeń jeszcze nie wszedł. Udostępnij kod:{" "}
              <strong className="font-mono text-[var(--accent)]">
                {cls.joinCode}
              </strong>
              .
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {top10.map((s, i) => (
                <RosterRow
                  key={s.username}
                  rank={i + 1}
                  entry={s}
                  highlight={s.username === viewerUsername}
                />
              ))}
            </ol>
          )}
        </div>

        {role === "teacher" && (
          <aside className="card p-4 flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-widest font-black text-[var(--accent)]">
              ⚡ Szybkie akcje
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link
                  href={`/api/klasa/${cls.id}/report?format=pdf`}
                  className="underline hover:text-[var(--accent)]"
                  prefetch={false}
                >
                  📄 Pobierz raport PDF
                </Link>
              </li>
              <li>
                <span className="opacity-60">🔇 Wycisz ucznia</span>
                <span className="text-[10px] opacity-40 block">(V5)</span>
              </li>
              <li>
                <span className="opacity-60">📝 Dodaj notatkę do ucznia</span>
                <span className="text-[10px] opacity-40 block">(V5)</span>
              </li>
              <li>
                <span className="opacity-60">👪 Zaproś rodzica</span>
                <span className="text-[10px] opacity-40 block">(V4.6 — kid-initiated code)</span>
              </li>
            </ul>
          </aside>
        )}
      </section>
    </div>
  );
}

function RosterRow({
  rank,
  entry,
  highlight,
}: {
  rank: number;
  entry: ClassRosterEntry;
  highlight: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 py-2 border-b border-[var(--ink)]/20 last:border-b-0 ${
        highlight ? "text-[var(--accent)] font-bold" : ""
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-6 text-center text-xs opacity-70">#{rank}</span>
        <span className="truncate">{entry.username}</span>
        <span className="text-[10px] opacity-60 hidden sm:inline">
          L{entry.cityLevel}
        </span>
      </span>
      <span className="font-mono text-sm">
        {Math.floor(entry.weightedScore).toLocaleString("pl-PL")}
      </span>
    </li>
  );
}
