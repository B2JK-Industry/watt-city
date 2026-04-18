import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { listTeacherClasses, getRole } from "@/lib/roles";
import { ClassClient } from "@/components/class-client";

export const dynamic = "force-dynamic";

export default async function ClassPage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  const role = await getRole(session.username);
  const classes = role === "teacher" ? await listTeacherClasses(session.username) : [];

  const copy = {
    pl: {
      heading: "Klasa",
      teacherBadge: "Nauczyciel",
      createClass: "Utwórz nową klasę",
      className: "Nazwa klasy",
      create: "Stwórz",
      joinAsStudent: "Dołącz jako uczeń",
      joinCode: "Kod dołączenia",
      join: "Dołącz",
      yourClasses: "Twoje klasy",
      members: "Uczniów",
      code: "Kod klasy",
      open: "Otwórz",
      curriculumTitle: "Zakres nauki",
      qofweekTitle: "Pytanie tygodnia",
      leaderboard: "Ranking klasy",
    },
    uk: { heading: "Клас", teacherBadge: "Вчитель", createClass: "Створити клас", className: "Назва класу", create: "Створити", joinAsStudent: "Приєднатися", joinCode: "Код", join: "Приєднатися", yourClasses: "Мої класи", members: "Учнів", code: "Код", open: "Відкрити", curriculumTitle: "Програма", qofweekTitle: "Тема тижня", leaderboard: "Рейтинг" },
    cs: { heading: "Třída", teacherBadge: "Učitel", createClass: "Vytvořit třídu", className: "Název", create: "Vytvořit", joinAsStudent: "Připojit se", joinCode: "Kód", join: "Připojit", yourClasses: "Mé třídy", members: "Studentů", code: "Kód", open: "Otevřít", curriculumTitle: "Obsah", qofweekTitle: "Téma týdne", leaderboard: "Žebříček" },
    en: { heading: "Class", teacherBadge: "Teacher", createClass: "Create a class", className: "Class name", create: "Create", joinAsStudent: "Join as student", joinCode: "Join code", join: "Join", yourClasses: "Your classes", members: "Members", code: "Class code", open: "Open", curriculumTitle: "Curriculum", qofweekTitle: "Q of the week", leaderboard: "Class ranking" },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex items-center gap-3">
        <h1 className="brutal-heading text-3xl">{copy.heading}</h1>
        {role === "teacher" && <span className="chip">{copy.teacherBadge}</span>}
      </header>
      <ClassClient
        username={session.username}
        initialClasses={classes}
        initialRole={role}
        copy={copy}
      />
    </div>
  );
}
