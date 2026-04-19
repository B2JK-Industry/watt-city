import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import type { Lang } from "@/lib/i18n";

/* V4.1 — schools landing page. Marketing surface for the PKO pitch.
 * Entry point to the teacher signup wizard at /nauczyciel/signup.
 */

export const metadata = {
  title: "Watt City dla szkół · SKO 2.0 by PKO · partner-ready",
  description:
    "Gamifikowana edukacja finansowa dla klas V-VIII. Zgodna z podstawą programową MEN. Teacher dashboard · weekly PDF · parent digest.",
};

const COPY: Record<
  Lang,
  {
    hero: string;
    tagline: string;
    ctaSignup: string;
    ctaBrochure: string;
    valueTitle1: string;
    valueBody1: string;
    valueTitle2: string;
    valueBody2: string;
    valueTitle3: string;
    valueBody3: string;
    featsTitle: string;
    feats: string[];
    curriculumBadge: string;
    compliance: string;
    pricingNote: string;
  }
> = {
  pl: {
    hero: "Watt City dla szkół",
    tagline:
      "SKO 2.0 partner-ready. Gamifikowana edukacja finansowa dla klas V-VIII, zgodna z podstawą programową MEN. Teacher dashboard · weekly PDF · parent digest.",
    ctaSignup: "Zarejestruj szkołę",
    ctaBrochure: "Materiały dla dyrekcji",
    valueTitle1: "🎯 Engagement",
    valueBody1:
      "15+ gier minutowych, codzienne AI-wyzwania, cotygodniowa liga. Dzieci wracają nie dla obowiązku — dla nawyku.",
    valueTitle2: "📚 Nauka",
    valueBody2:
      "Budżetowanie, kredyt, inwestycje, RRSO, oszczędzanie. Każda gra mapowana na konkretny kod podstawy programowej.",
    valueTitle3: "🔒 Compliance",
    valueBody3:
      "GDPR-K + UODO + KNF disclaimers. EU hosting (Upstash Frankfurt). Zero danych sprzedawanych. Wszystko po polsku.",
    featsTitle: "Co dostaniesz jako nauczyciel",
    feats: [
      "Panel klasy z listą uczniów + ich postępem",
      "Cotygodniowy raport PDF dla dyrekcji",
      "Wybór tematu tygodnia z podstawy programowej",
      "Dashboard rodzica (obserwator)",
      "Pełna prywatność — uczeń decyduje co pokazać rodzicowi",
      "Tryb klasowy — bez bankructwa, bez pay-to-win",
    ],
    curriculumBadge: "✅ Zgodne z podstawą programową MEN V-VIII",
    compliance:
      "GDPR-K · UODO · KNF disclaimers · EU hosting · audytowalne w 100%",
    pricingNote: "Pilotaż bezpłatny · docelowo bundled z PKO SKO",
  },
  uk: {
    hero: "Watt City для шкіл",
    tagline:
      "SKO 2.0 партнерська платформа. Фінансова освіта для V-VIII класу. Панель учителя · тижневий PDF · звіт для батьків.",
    ctaSignup: "Зареєструвати школу",
    ctaBrochure: "Матеріали для директора",
    valueTitle1: "🎯 Залучення",
    valueBody1:
      "15+ швидких ігор, щоденні AI-виклики, тижнева ліга. Діти вертаються не з обов'язку — звично.",
    valueTitle2: "📚 Навчання",
    valueBody2:
      "Бюджетування, кредит, RRSO, інвестиції. Кожна гра прив'язана до коду навчальної програми.",
    valueTitle3: "🔒 Compliance",
    valueBody3:
      "GDPR-K + UODO + KNF дисклеймери. Хостинг у ЄС. Жодного продажу даних.",
    featsTitle: "Що отримаєш як учитель",
    feats: [
      "Панель класу з учнями та їхнім прогресом",
      "Тижневий PDF звіт для директора",
      "Вибір теми тижня з навчальної програми",
      "Панель батьків (спостерігач)",
      "Повна приватність — учень вирішує що показувати батькам",
      "Класний режим — без банкрутства, без pay-to-win",
    ],
    curriculumBadge: "✅ Узгоджено з польською навчальною програмою MEN V-VIII",
    compliance:
      "GDPR-K · UODO · KNF дисклеймери · Хостинг у ЄС · повна auditovateľnosť",
    pricingNote: "Пілот безплатний · кінцево bundled з PKO SKO",
  },
  cs: {
    hero: "Watt City pro školy",
    tagline:
      "SKO 2.0 partner-ready. Gamifikovaná finanční gramotnost pro V-VIII třídu. Učitelský panel · týdenní PDF · rodičovský digest.",
    ctaSignup: "Zaregistrovat školu",
    ctaBrochure: "Materiály pro vedení",
    valueTitle1: "🎯 Engagement",
    valueBody1:
      "15+ minutových her, denní AI výzvy, týdenní liga. Děti se vrací z návyku, ne z povinnosti.",
    valueTitle2: "📚 Učení",
    valueBody2:
      "Rozpočtování, úvěr, RRSO, investice. Každá hra mapovaná na kód učebního programu.",
    valueTitle3: "🔒 Compliance",
    valueBody3:
      "GDPR-K + UODO + KNF disclaimery. EU hosting. Žádný prodej dat.",
    featsTitle: "Co získáš jako učitel",
    feats: [
      "Panel třídy se studenty a jejich pokrokem",
      "Týdenní PDF raport pro ředitelství",
      "Výběr tématu týdne z programu",
      "Rodičovský dashboard (observer)",
      "Plné soukromí — student rozhoduje co ukázat rodiči",
      "Třídní režim — bez bankrotu, bez pay-to-win",
    ],
    curriculumBadge: "✅ V souladu s PL učebním programem MEN V-VIII",
    compliance:
      "GDPR-K · UODO · KNF disclaimery · EU hosting · plně auditovateľné",
    pricingNote: "Pilot zdarma · finálně bundled s PKO SKO",
  },
  en: {
    hero: "Watt City for schools",
    tagline:
      "SKO 2.0 partner-ready. Financial literacy gamified for grades 5-8, aligned with the PL national curriculum. Teacher dashboard · weekly PDF · parent digest.",
    ctaSignup: "Register your school",
    ctaBrochure: "Materials for principals",
    valueTitle1: "🎯 Engagement",
    valueBody1:
      "15+ quick games, daily AI challenges, weekly league. Kids come back from habit, not homework.",
    valueTitle2: "📚 Learning",
    valueBody2:
      "Budgeting, credit, APR, savings, investments. Every game mapped to a specific curriculum code.",
    valueTitle3: "🔒 Compliance",
    valueBody3:
      "GDPR-K + UODO + KNF disclaimers. EU-only hosting. No data sold. Auditable end-to-end.",
    featsTitle: "What you get as a teacher",
    feats: [
      "Class dashboard with students and progress",
      "Weekly PDF report for principals",
      "Weekly theme picker from the national curriculum",
      "Parent observer dashboard",
      "Full privacy — students choose what to share",
      "Classroom mode — no bankruptcy, no pay-to-win",
    ],
    curriculumBadge: "✅ PL national curriculum MEN grades 5-8 aligned",
    compliance:
      "GDPR-K · UODO · KNF disclaimers · EU hosting · 100% auditable",
    pricingNote: "Pilot free · eventually bundled with PKO SKO",
  },
};

export default async function SchoolsLanding() {
  const lang = await getLang();
  const t = COPY[lang];

  return (
    <div className="flex flex-col gap-10 animate-slide-up">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="brutal-tag" style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}>
            {t.curriculumBadge}
          </span>
          <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>
            PKO SKO 2.0
          </span>
        </div>
        <h1 className="brutal-heading text-4xl sm:text-6xl">{t.hero}</h1>
        <p className="text-lg text-zinc-300 max-w-3xl">{t.tagline}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/nauczyciel/signup" className="btn btn-primary">
            {t.ctaSignup}
          </Link>
          <Link href="/dla-szkol/materialy" className="btn btn-ghost">
            {t.ctaBrochure}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: t.valueTitle1, body: t.valueBody1, accent: "var(--neo-yellow)" },
          { title: t.valueTitle2, body: t.valueBody2, accent: "var(--neo-cyan)" },
          { title: t.valueTitle3, body: t.valueBody3, accent: "var(--neo-pink)" },
        ].map((col) => (
          <div
            key={col.title}
            className="card p-5 flex flex-col gap-2"
            style={{ borderTop: `4px solid ${col.accent}` }}
          >
            <h2 className="font-black text-lg">{col.title}</h2>
            <p className="text-sm text-zinc-300">{col.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-xl">{t.featsTitle}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {t.feats.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 p-2 border-2 border-[var(--ink)]/30 rounded"
            >
              <span className="text-[var(--accent)]">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="card p-5 flex flex-col gap-2 border-[var(--neo-lime)]">
        <h2 className="font-black uppercase text-xs tracking-widest">
          Compliance
        </h2>
        <p className="text-sm">{t.compliance}</p>
        <p className="text-xs opacity-70">{t.pricingNote}</p>
      </aside>
    </div>
  );
}
