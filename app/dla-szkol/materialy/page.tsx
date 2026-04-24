import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { curriculumByArea } from "@/lib/curriculum";

/* V4.7 — HTML version of the pitch brochure at
 * `/dla-szkol/materialy`. PDF downloads at `/api/dla-szkol/pitch`. */

export const metadata = {
  title: "Materiały dla dyrekcji · Watt City dla szkół",
};

export default async function MaterialsPage() {
  const lang = await getLang();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.pl;
  const byArea = curriculumByArea();
  const total = Object.values(byArea).reduce((s, v) => s + v.length, 0);

  return (
    <div className="flex flex-col gap-8 animate-slide-up max-w-4xl">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="section-heading text-3xl sm:text-4xl">{t.title}</h1>
          <p className="text-sm text-zinc-300 mt-2">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/api/dla-szkol/pitch?locale=pl"
            className="btn btn-primary text-sm"
            prefetch={false}
          >
            📄 Pobierz PDF (PL)
          </Link>
          <Link
            href="/api/dla-szkol/pitch?locale=en"
            className="btn btn-ghost text-sm"
            prefetch={false}
          >
            📄 PDF (EN)
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {t.props.map((p) => (
          <div key={p.title} className="card p-4 flex flex-col gap-1">
            <h2 className="font-semibold text-sm">{p.title}</h2>
            <p className="text-sm text-zinc-300">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="section-heading text-lg">{t.coverageTitle}</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
          {Object.entries(byArea).map(([area, codes]) => (
            <li key={area} className="card p-3 text-center">
              <div className="text-xs opacity-60">{area}</div>
              <div className="text-2xl font-semibold mt-1">{codes.length}</div>
              <div className="text-[10px] opacity-60">{t.codes}</div>
            </li>
          ))}
        </ul>
        <p className="text-xs italic opacity-80">
          {t.coverageTotal.replace("{n}", String(total))}
        </p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="section-heading text-lg">{t.complianceTitle}</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {t.compliance.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[var(--accent)]">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-2">
        <h2 className="section-heading text-lg">{t.ctaTitle}</h2>
        <p className="text-sm">{t.ctaBody}</p>
      </section>
    </div>
  );
}

const COPY = {
  pl: {
    title: "Materiały dla dyrekcji",
    subtitle:
      "Jedno-stronicowa broszura do pokazania na radzie pedagogicznej. PDF dostępny w dwóch językach.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ minutowych gier, codzienne AI wyzwania, cotygodniowa liga.",
      },
      {
        title: "📚 Nauka",
        body: "Każda gra mapowana na kod podstawy programowej MEN V-VIII.",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K · UODO · KNF · EU hosting. Zero danych sprzedawanych.",
      },
    ],
    coverageTitle: "Mapowanie podstawy programowej",
    codes: "kodów",
    coverageTotal:
      "Łącznie {n} kodów klas V-VIII w pięciu obszarach. Rozszerzenie do SP IV i LO planowane na V5.",
    complianceTitle: "Compliance",
    compliance: [
      "GDPR-K: zgoda rodzica dla uczniów poniżej 16 lat (automatyczny flow).",
      "UODO: polski organ nadzoru, kontakt DPO w aplikacji.",
      "KNF disclaimers na każdej stronie z kredytem.",
      "EU hosting: Upstash Frankfurt + Vercel EU. Żadne dane osobowe nie opuszczają UE.",
      "Audytowalne w 100%: ledger każdej transakcji w-monet.",
    ],
    ctaTitle: "Kontakt",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol · calendly.com/watt-city-school",
  },
  en: {
    title: "Materials for principals",
    subtitle:
      "One-page brochure for your faculty council. PDF available in two languages.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ one-minute games, daily AI challenges, weekly league.",
      },
      {
        title: "📚 Learning",
        body: "Every game mapped to a national curriculum code (grades 5-8).",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K · UODO · KNF · EU hosting. No data sold.",
      },
    ],
    coverageTitle: "Curriculum coverage",
    codes: "codes",
    coverageTotal:
      "{n} codes total across grades 5-8 in five areas. SP-IV and LO expansion planned for V5.",
    complianceTitle: "Compliance",
    compliance: [
      "GDPR-K: parental consent for under-16 users (automated flow).",
      "UODO: Polish supervisory authority — DPO contact in-app.",
      "KNF disclaimers on every loan surface.",
      "EU hosting: Upstash Frankfurt + Vercel EU. No PII leaves the EU.",
      "Fully auditable: ledger for every in-game currency transaction.",
    ],
    ctaTitle: "Contact",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol · calendly.com/watt-city-school",
  },
  uk: {
    title: "Матеріали для директора",
    subtitle:
      "Односторінкова брошура. PDF доступний у двох мовах.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ швидких ігор, щоденні AI-виклики, тижнева ліга.",
      },
      {
        title: "📚 Learning",
        body: "Кожна гра прив'язана до коду навчальної програми.",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K · UODO · KNF · Хостинг у ЄС.",
      },
    ],
    coverageTitle: "Відповідність програмі",
    codes: "кодів",
    coverageTotal:
      "Разом {n} кодів V-VIII класу. Розширення до SP IV планується на V5.",
    complianceTitle: "Compliance",
    compliance: [
      "GDPR-K: згода батьків для учнів до 16 років.",
      "UODO: польський наглядовий орган.",
      "KNF дисклеймери на кожній сторінці з кредитом.",
      "Хостинг у ЄС: Upstash Frankfurt + Vercel EU.",
      "Повна прозорість: ledger кожної транзакції.",
    ],
    ctaTitle: "Контакт",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol",
  },
  cs: {
    title: "Materiály pro ředitele",
    subtitle:
      "Jednostránková brožura. PDF ve dvou jazycích.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ minutových her, denní AI výzvy, týdenní liga.",
      },
      {
        title: "📚 Učení",
        body: "Každá hra mapovaná na kód učebního programu.",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K · UODO · KNF · EU hosting.",
      },
    ],
    coverageTitle: "Mapování učebního programu",
    codes: "kódů",
    coverageTotal:
      "Celkem {n} kódů V-VIII. Rozšíření plánováno na V5.",
    complianceTitle: "Compliance",
    compliance: [
      "GDPR-K: souhlas rodiče pro studenty do 16 let.",
      "UODO: polský dozorový orgán.",
      "KNF disclaimery na každé stránce s úvěrem.",
      "EU hosting: Upstash Frankfurt + Vercel EU.",
      "Plně auditovateľné: ledger každé transakce.",
    ],
    ctaTitle: "Kontakt",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol",
  },
};
