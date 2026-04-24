import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { listProposals } from "@/lib/theme-proposals";
import { ThemeProposalsClient } from "@/components/theme-proposals-client";

export const dynamic = "force-dynamic";

export default async function ProposeThemePage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");
  const proposals = await listProposals(50);

  const copy = {
    pl: {
      heading: "Zaproponuj temat AI hry",
      intro: "Twój pomysł trafi do kolejki. Inni gracze głosują; admin wybiera najlepsze i dodaje do puli.",
      placeholder: "np. 'Jak planować weekend za 500 zł'",
      submit: "Zgłoś",
      vote: "👍 Głosuj",
      voted: "✓ Zagłosowałeś",
      empty: "Pierwszy zgłosi zostanie wyróżniony.",
      ranking: "Ranking propozycji",
    },
    uk: {
      heading: "Запропонуй тему",
      intro: "Твоя пропозиція потрапляє в чергу; інші голосують.",
      placeholder: "напр. 'Як планувати вихідні за 500 zł'",
      submit: "Подати",
      vote: "👍 Голос",
      voted: "✓ Голос відданий",
      empty: "Поки порожньо.",
      ranking: "Рейтинг пропозицій",
    },
    cs: {
      heading: "Navrhni téma",
      intro: "Návrh jde do fronty; ostatní hlasují.",
      placeholder: "např. 'Jak naplánovat víkend za 500 zł'",
      submit: "Odeslat",
      vote: "👍 Hlasovat",
      voted: "✓ Hlasováno",
      empty: "Zatím prázdné.",
      ranking: "Žebříček návrhů",
    },
    en: {
      heading: "Propose an AI-game theme",
      intro: "Your idea goes into the queue. Other players vote; admins pick the best.",
      placeholder: "e.g. 'How to plan a weekend on 500 zł'",
      submit: "Submit",
      vote: "👍 Vote",
      voted: "✓ Voted",
      empty: "Be the first to propose!",
      ranking: "Proposals ranking",
    },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">{copy.heading}</h1>
        <p className="text-sm text-zinc-400">{copy.intro}</p>
      </header>
      <ThemeProposalsClient
        currentUser={session.username}
        initialProposals={proposals}
        copy={copy}
      />
    </div>
  );
}
