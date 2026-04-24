import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import type { Lang } from "@/lib/i18n";
import { PODSTAWA_PROGRAMOWA, curriculumByArea } from "@/lib/curriculum";

/* D1 — schools marketing landing page. Full content rewrite per demo-
 * polish spec: hero + 3-audience value prop (kids/teachers/parents) +
 * 4-step "how it works" + compliance badges + curriculum preview +
 * screenshot placeholders + dual CTA (demo + teacher signup) + PDF
 * download link.
 */

export const metadata = {
  title: "Watt City dla szkół · gamifikowana edukacja finansowa",
  description:
    "Gamifikowana edukacja finansowa dla klas V-VIII zgodna z podstawą programową MEN. Teacher dashboard · weekly PDF · parent digest. Partner-ready dla PKO.",
};

type Copy = {
  heroTitle: string;
  heroSubtitle: string;
  ctaDemo: string;
  ctaSignup: string;
  ctaBrochure: string;
  audienceTitle: string;
  audKidsTitle: string;
  audKidsBody: string;
  audTeachersTitle: string;
  audTeachersBody: string;
  audParentsTitle: string;
  audParentsBody: string;
  howTitle: string;
  howStep1: string;
  howStep2: string;
  howStep3: string;
  howStep4: string;
  complianceTitle: string;
  complianceItems: string[];
  ppTitle: string;
  ppLead: string;
  ppAreaLabel: string;
  ppGradeLabel: string;
  ppMoreLabel: string;
  screensTitle: string;
  screen1: string;
  screen2: string;
  screen3: string;
  downloadTitle: string;
  downloadBody: string;
  downloadCta: string;
};

const COPY: Record<Lang, Copy> = {
  pl: {
    heroTitle: "Watt City dla szkół · gamifikowana edukacja finansowa",
    heroSubtitle:
      "Zgodne z podstawą programową MEN V–VIII · partner-ready dla PKO. Uczniowie grają minigry i budują swoje miasto. Nauczyciel ma panel klasy i tygodniowy raport PDF. Rodzic obserwuje postępy — bez ingerencji.",
    ctaDemo: "Wypróbuj demo",
    ctaSignup: "Zapisz się jako nauczyciel",
    ctaBrochure: "Pobierz broszurę (PDF, 2 strony)",
    audienceTitle: "Dla kogo jest Watt City",
    audKidsTitle: "🎮 Dla uczniów",
    audKidsBody:
      "Miasto, minigry, finansowe wyzwania. Kids actually play. Quiz finansowy, Sprint matematyczny, Kurs akcji — każda gra uczy innej umiejętności i daje zasoby na rozbudowę miasta.",
    audTeachersTitle: "👩‍🏫 Dla nauczycieli",
    audTeachersBody:
      "Dashboard klasy, cotygodniowe tematy filtrowane po podstawie programowej, PDF raport do dziennika jednym kliknięciem. Zero admin overhead.",
    audParentsTitle: "👨‍👩‍👧 Dla rodziców",
    audParentsBody:
      "Obserwuj postępy, zobacz co dziecko się uczy. Tygodniowy digest w aplikacji. Bez ingerencji — uczeń decyduje co udostępnia.",
    howTitle: "Jak to działa — 4 kroki",
    howStep1: "Nauczyciel zakłada klasę (1 minuta, formularz)",
    howStep2: "Uczniowie dołączają 6-znakowym kodem",
    howStep3: "Grają minigry i uczą się finansów w mieście",
    howStep4: "Tygodniowy raport PDF do dziennika i rodzica",
    complianceTitle: "Compliance",
    complianceItems: [
      "GDPR-K compliant · zgoda rodzica automatycznie pod 16 r.ż.",
      "UODO aligned · polski organ nadzoru, DPO w aplikacji",
      "KNF disclaimer na każdej stronie z kredytem",
      "EU-hosted · Upstash Frankfurt + Vercel EU",
      "First-party analytics only · żadnego GA, żadnego Meta Pixela",
    ],
    ppTitle: "Zgodne z podstawą programową MEN V–VIII",
    ppLead: `Każda gra mapowana na konkretny kod podstawy programowej. Łącznie ${PODSTAWA_PROGRAMOWA.length} kodów w pięciu obszarach: Ekonomia, Matematyka, WOS, EDB, Informatyka.`,
    ppAreaLabel: "obszar",
    ppGradeLabel: "klasa",
    ppMoreLabel: "… i więcej kodów w każdym obszarze",
    screensTitle: "Jak wygląda produkt",
    screen1: "📸 Panel klasy — top 10 uczniów, temat tygodnia, pobierz PDF",
    screen2: "📸 Tygodniowy raport PDF — roster, XP, pokrycie programu",
    screen3: "📸 Dashboard ucznia — city skyline, cashflow, loan calendar",
    downloadTitle: "Materiały dla dyrekcji",
    downloadBody:
      "Jedna kartka A4, PL + EN. Wartość, mechanika, compliance, kontakt.",
    downloadCta: "Pobierz broszurę (PDF)",
  },
  uk: {
    heroTitle: "Watt City для шкіл · гейміфікована фінансова освіта",
    heroSubtitle:
      "Відповідає польській програмі MEN V–VIII. Учні грають у мінігри та будують місто. Вчитель має панель класу і тижневий PDF. Батьки спостерігають — без втручання.",
    ctaDemo: "Спробувати демо",
    ctaSignup: "Зареєструватись як учитель",
    ctaBrochure: "Завантажити брошуру (PDF, 2 стор.)",
    audienceTitle: "Для кого Watt City",
    audKidsTitle: "🎮 Для учнів",
    audKidsBody: "Місто, мінігри, фінансові виклики. Діти справді грають.",
    audTeachersTitle: "👩‍🏫 Для вчителів",
    audTeachersBody:
      "Панель класу, щотижневі теми, PDF звіт. Жодного адміністративного навантаження.",
    audParentsTitle: "👨‍👩‍👧 Для батьків",
    audParentsBody:
      "Спостерігай за прогресом. Тижневий digest в застосунку. Без втручання.",
    howTitle: "Як це працює — 4 кроки",
    howStep1: "Учитель створює клас (1 хв)",
    howStep2: "Учні приєднуються 6-знаковим кодом",
    howStep3: "Грають та вивчають фінанси",
    howStep4: "Тижневий PDF для директора і батьків",
    complianceTitle: "Compliance",
    complianceItems: [
      "GDPR-K · батьківська згода автоматично",
      "UODO aligned · польський наглядач",
      "KNF дисклеймери на кредитах",
      "Хостинг у ЄС",
      "Аналітика only first-party",
    ],
    ppTitle: "Відповідає польській програмі MEN V–VIII",
    ppLead: `Кожна гра прив'язана до конкретного коду. Разом ${PODSTAWA_PROGRAMOWA.length} кодів у 5 областях.`,
    ppAreaLabel: "область",
    ppGradeLabel: "клас",
    ppMoreLabel: "… та більше",
    screensTitle: "Як виглядає продукт",
    screen1: "📸 Панель класу — топ 10",
    screen2: "📸 Тижневий PDF звіт",
    screen3: "📸 Дашборд учня",
    downloadTitle: "Матеріали для директора",
    downloadBody: "Одна A4 сторінка, PL + EN.",
    downloadCta: "Завантажити (PDF)",
  },
  cs: {
    heroTitle: "Watt City pro školy · gamifikovaná finanční gramotnost",
    heroSubtitle:
      "V souladu s polským učebním programem MEN V–VIII. Žáci hrají minihry a staví město. Učitel má panel třídy a týdenní PDF. Rodič pozoruje bez zásahu.",
    ctaDemo: "Vyzkoušet demo",
    ctaSignup: "Zaregistrovat se jako učitel",
    ctaBrochure: "Stáhnout brožuru (PDF, 2 str.)",
    audienceTitle: "Pro koho je Watt City",
    audKidsTitle: "🎮 Pro žáky",
    audKidsBody: "Město, minihry, finanční výzvy. Děti opravdu hrají.",
    audTeachersTitle: "👩‍🏫 Pro učitele",
    audTeachersBody:
      "Panel třídy, týdenní témata, PDF raport. Žádná admin zátěž.",
    audParentsTitle: "👨‍👩‍👧 Pro rodiče",
    audParentsBody:
      "Sleduj pokrok. Týdenní digest v aplikaci. Bez zásahu.",
    howTitle: "Jak to funguje — 4 kroky",
    howStep1: "Učitel vytvoří třídu (1 min)",
    howStep2: "Žáci se připojí 6-znakovým kódem",
    howStep3: "Hrají a učí se finance",
    howStep4: "Týdenní PDF pro ředitele a rodiče",
    complianceTitle: "Compliance",
    complianceItems: [
      "GDPR-K · automatický rodičovský souhlas",
      "UODO aligned",
      "KNF disclaimery",
      "EU hosting",
      "First-party analytika only",
    ],
    ppTitle: "V souladu s PL učebním programem MEN V–VIII",
    ppLead: `Každá hra mapovaná na kód. Celkem ${PODSTAWA_PROGRAMOWA.length} kódů v 5 oblastech.`,
    ppAreaLabel: "oblast",
    ppGradeLabel: "třída",
    ppMoreLabel: "… a více",
    screensTitle: "Jak produkt vypadá",
    screen1: "📸 Panel třídy — top 10",
    screen2: "📸 Týdenní PDF",
    screen3: "📸 Dashboard studenta",
    downloadTitle: "Materiály pro ředitele",
    downloadBody: "Jedna A4 stránka, PL + EN.",
    downloadCta: "Stáhnout (PDF)",
  },
  en: {
    heroTitle: "Watt City for schools · financial literacy gamified",
    heroSubtitle:
      "Aligned with the Polish national curriculum (grades 5-8). Kids play minigames and build their own city. Teachers get a class dashboard + weekly PDF. Parents observe progress — no intervention needed.",
    ctaDemo: "Try the demo",
    ctaSignup: "Sign up as teacher",
    ctaBrochure: "Download brochure (PDF, 2 pages)",
    audienceTitle: "Who it's for",
    audKidsTitle: "🎮 For students",
    audKidsBody:
      "City, minigames, financial challenges. Kids actually play. Finance quiz, Math sprint, Stock tap — each teaches a different skill and yields resources to build.",
    audTeachersTitle: "👩‍🏫 For teachers",
    audTeachersBody:
      "Class dashboard, weekly themes filtered by curriculum code, one-click PDF report. Zero admin overhead.",
    audParentsTitle: "👨‍👩‍👧 For parents",
    audParentsBody:
      "Observe progress, see what your kid is learning. Weekly digest in-app. No intervention — the student decides what to share.",
    howTitle: "How it works — 4 steps",
    howStep1: "Teacher creates a class (1 minute, form)",
    howStep2: "Students join with a 6-character code",
    howStep3: "They play minigames and learn finance in their city",
    howStep4: "Weekly PDF report to principal and parents",
    complianceTitle: "Compliance",
    complianceItems: [
      "GDPR-K compliant · auto parental consent under 16",
      "UODO aligned · Polish supervisory authority, DPO in-app",
      "KNF disclaimer on every loan surface",
      "EU-hosted · Upstash Frankfurt + Vercel EU",
      "First-party analytics only · no GA, no Meta Pixel",
    ],
    ppTitle: "Aligned with Polish national curriculum (grades 5-8)",
    ppLead: `Every game maps to a specific curriculum code. ${PODSTAWA_PROGRAMOWA.length} codes across 5 areas: Economics, Math, Civics, Safety, IT.`,
    ppAreaLabel: "area",
    ppGradeLabel: "grade",
    ppMoreLabel: "… and more codes in every area",
    screensTitle: "What it looks like",
    screen1: "📸 Class dashboard — top 10 students, weekly theme, PDF download",
    screen2: "📸 Weekly PDF report — roster, XP, curriculum coverage",
    screen3: "📸 Student dashboard — city skyline, cashflow, loan calendar",
    downloadTitle: "Materials for principals",
    downloadBody:
      "Single A4 page, PL + EN. Value prop, mechanics, compliance, contact.",
    downloadCta: "Download brochure (PDF)",
  },
};

export default async function SchoolsLanding() {
  const lang = await getLang();
  const t = COPY[lang];
  const areas = curriculumByArea();
  // Top-10 curated codes for the landing preview (2 per area).
  const preview = (["Ekonomia", "Matematyka", "WOS", "EDB", "Informatyka"] as const)
    .flatMap((area) => areas[area].slice(0, 2));

  return (
    <div className="flex flex-col gap-12 animate-slide-up">
      {/* -------- Hero -------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <span
            className="brutal-tag"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            ✅ MEN V–VIII
          </span>
          <span
            className="brutal-tag"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            PKO SKO 2.0
          </span>
          <span
            className="brutal-tag"
            style={{ background: "var(--success)", color: "var(--accent-ink)" }}
          >
            GDPR-K
          </span>
        </div>
        <h1 className="section-heading text-4xl sm:text-5xl leading-tight">
          {t.heroTitle}
        </h1>
        <p className="t-body-lg text-[var(--foreground)] max-w-3xl leading-relaxed">
          {t.heroSubtitle}
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href="/dla-szkol/demo" className="btn btn-primary text-base">
            🎬 {t.ctaDemo}
          </Link>
          <Link
            href="/nauczyciel/signup"
            className="btn btn-cyan text-base"
          >
            {t.ctaSignup}
          </Link>
          <Link
            href="/api/dla-szkol/pitch?locale=pl"
            className="btn btn-ghost text-base"
            prefetch={false}
          >
            📄 {t.ctaBrochure}
          </Link>
        </div>
      </section>

      {/* -------- 3-audience value prop -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.audienceTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: t.audKidsTitle,
              body: t.audKidsBody,
              accent: "var(--accent)",
            },
            {
              title: t.audTeachersTitle,
              body: t.audTeachersBody,
              accent: "var(--accent)",
            },
            {
              title: t.audParentsTitle,
              body: t.audParentsBody,
              accent: "var(--danger)",
            },
          ].map((col) => (
            <div
              key={col.title}
              className="card p-5 flex flex-col gap-2"
              style={{ borderTop: `4px solid ${col.accent}` }}
            >
              <h3 className="font-semibold text-lg">{col.title}</h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                {col.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------- How it works (4-step diagram) -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.howTitle}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[t.howStep1, t.howStep2, t.howStep3, t.howStep4].map(
            (step, i) => (
              <li
                key={i}
                className="card p-4 flex flex-col gap-2 relative"
              >
                <span
                  className="w-10 h-10 rounded-xl border border-[var(--ink)] bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xl flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
                {i < 3 && (
                  <span
                    aria-hidden
                    className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[var(--accent)] text-2xl font-semibold"
                  >
                    →
                  </span>
                )}
              </li>
            ),
          )}
        </ol>
      </section>

      {/* -------- Screenshots (SVG placeholders) -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.screensTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[t.screen1, t.screen2, t.screen3].map((caption, i) => (
            <div
              key={i}
              className="aspect-video rounded-xl border border-[var(--ink)] p-6 flex items-center justify-center text-center"
              style={{
                background: `linear-gradient(135deg, var(--accent), var(--accent))`,
                color: "var(--accent-ink)",
              }}
            >
              <p className="font-semibold text-sm leading-relaxed">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------- Compliance badges row -------- */}
      <section className="card p-5 flex flex-col gap-3 border-[var(--success)]">
        <h2 className="section-heading text-lg">{t.complianceTitle}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {t.complianceItems.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="text-[var(--success)] font-bold">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* -------- Podstawa programowa preview -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.ppTitle}</h2>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">{t.ppLead}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {preview.map((c) => (
            <li
              key={c.code}
              className="border border-[var(--ink)]/40 rounded p-3 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <code className="font-mono text-[10px] px-1.5 py-0.5 bg-[var(--surface-2)] rounded">
                  {c.code}
                </code>
                <span className="text-[10px] opacity-70">
                  {t.ppAreaLabel}: {c.area} · {t.ppGradeLabel}: {c.grade}
                </span>
              </div>
              <p className="text-xs leading-snug">{c.description}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs italic opacity-70">{t.ppMoreLabel}</p>
      </section>

      {/* -------- Download brochure -------- */}
      <aside className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[var(--accent)]">
        <div className="flex flex-col gap-1">
          <h2 className="section-heading text-lg">{t.downloadTitle}</h2>
          <p className="text-sm text-[var(--ink-muted)]">{t.downloadBody}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/api/dla-szkol/pitch?locale=pl"
            className="btn btn-primary text-sm"
            prefetch={false}
          >
            📄 PL
          </Link>
          <Link
            href="/api/dla-szkol/pitch?locale=en"
            className="btn btn-ghost text-sm"
            prefetch={false}
          >
            📄 EN
          </Link>
          <Link
            href="/dla-szkol/materialy"
            className="btn btn-ghost text-sm"
          >
            HTML
          </Link>
        </div>
      </aside>

      {/* -------- Bottom CTA (repeat primary actions) -------- */}
      <section className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--surface-2)]">
        <p className="text-sm sm:text-base font-bold">
          {lang === "pl"
            ? "Gotowy zobaczyć produkt?"
            : lang === "uk"
              ? "Готовий побачити продукт?"
              : lang === "cs"
                ? "Připraven vidět produkt?"
                : "Ready to see the product?"}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dla-szkol/demo" className="btn btn-primary">
            🎬 {t.ctaDemo}
          </Link>
          <Link href="/nauczyciel/signup" className="btn btn-cyan">
            {t.ctaSignup}
          </Link>
        </div>
      </section>
    </div>
  );
}
