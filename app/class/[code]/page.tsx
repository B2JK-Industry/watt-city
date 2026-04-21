import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { getClass } from "@/lib/roles";
import { classLeaderboard } from "@/lib/class-leaderboard";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [{ code }, session, lang] = await Promise.all([
    params,
    getSession(),
    getLang(),
  ]);
  if (!session) redirect("/login");
  const cls = await getClass(code);
  if (!cls) notFound();
  const isTeacher = cls.teacher === session.username;
  const isMember = cls.members.includes(session.username);
  if (!isTeacher && !isMember) {
    redirect("/class");
  }
  const rows = await classLeaderboard(cls);

  const copy = {
    pl: {
      joinCodes: "Kody dołączenia (przekaż uczniom)",
      members: "Uczniowie",
      leaderboard: "Ranking klasy",
      qofweek: "Pytanie tygodnia",
      noQ: "Nie ustawiono.",
      curriculum: "Zakres nauki",
      export: "Eksport PDF",
      exportHint: "Eksport raportu ucznia — MVP skopiuj jako JSON, PDF wkrótce.",
    },
    uk: { joinCodes: "Коди приєднання", members: "Учні", leaderboard: "Рейтинг", qofweek: "Тема тижня", noQ: "Не встановлено.", curriculum: "Програма", export: "Експорт PDF", exportHint: "PDF-звіт — скоро, поки JSON." },
    cs: { joinCodes: "Kódy pozvánek", members: "Studenti", leaderboard: "Žebříček", qofweek: "Téma týdne", noQ: "Nenastaveno.", curriculum: "Obsah", export: "Export PDF", exportHint: "PDF export — zatím JSON." },
    en: { joinCodes: "Join codes (share with students)", members: "Members", leaderboard: "Class leaderboard", qofweek: "Question of the week", noQ: "Not set.", curriculum: "Curriculum tags", export: "Export PDF", exportHint: "Report export — MVP copies JSON; PDF coming." },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-1">
        <h1 className="brutal-heading text-2xl">{cls.name}</h1>
        <span className="chip">
          Kod: <span className="font-mono">{cls.code}</span>
        </span>
      </header>

      {isTeacher && (
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="text-sm font-black uppercase">{copy.joinCodes}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center font-mono text-[11px]">
            {cls.joinCodes.map((j) => (
              <code key={j} className="py-1 border border-[var(--ink)]/30 rounded">
                {j}
              </code>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-black uppercase">{copy.leaderboard}</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {rows.length === 0 && <li className="text-xs text-zinc-400">—</li>}
          {rows.map((r, i) => (
            <li
              key={r.username}
              className="flex items-center justify-between py-1 border-b border-[var(--ink)]/20 last:border-0"
            >
              <span className="flex items-center gap-2">
                <span className="w-6 text-right font-bold opacity-60">#{i + 1}</span>
                <Link href={`/profile/${encodeURIComponent(r.username)}`} className="underline">
                  {r.username}
                </Link>
              </span>
              <span className="font-mono">{r.xp.toLocaleString("pl-PL")} W</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-4 flex flex-col gap-1">
        <h2 className="text-sm font-black uppercase">{copy.qofweek}</h2>
        <p className="text-sm">
          {cls.qOfWeekTheme ?? <span className="text-zinc-400">{copy.noQ}</span>}
        </p>
      </section>

      <section className="card p-4 flex flex-col gap-1">
        <h2 className="text-sm font-black uppercase">{copy.curriculum}</h2>
        {cls.curriculum.length === 0 ? (
          <p className="text-xs text-zinc-400">—</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {cls.curriculum.map((t) => (
              <span key={t} className="chip text-xs">
                {t}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4 flex flex-col gap-1 text-xs text-zinc-400">
        <h2 className="text-sm font-black uppercase text-zinc-200">{copy.export}</h2>
        <p>{copy.exportHint}</p>
      </section>
    </div>
  );
}
