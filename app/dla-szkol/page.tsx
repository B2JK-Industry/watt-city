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

/* UX Pass 3 F-NEW-03 — `schoolSteps` adds the per-step `body` lines.
 * Old `howStep1..4` keys are kept for back-compat (other surfaces may
 * read them via the inline COPY shape) but the dla-szkol page now
 * renders title + body from `schoolSteps`. */
type SchoolStep = { title: string; body: string };

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
  schoolSteps: [SchoolStep, SchoolStep, SchoolStep, SchoolStep];
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
    schoolSteps: [
      {
        title: "Załóż konto nauczyciela",
        body: "Wpisz imię, szkołę i ustaw hasło. Zajmuje 30 sekund — bez weryfikacji e-mail, bez ankiet.",
      },
      {
        title: "Stwórz klasę i pobierz kody",
        body: "Generujemy 30 jednorazowych kodów do rozdania uczniom. PDF z kodami jest gotowy od razu.",
      },
      {
        title: "Uczniowie grają",
        body: "Logują się kodem, grają minigry, budują swoje miasto Watt City. Bez konta rodzica, bez e-mail.",
      },
      {
        title: "Śledzisz postępy",
        body: "Tygodniowy raport PDF do dziennika, panel klasy z top 10 i wybór tematu na kolejny tydzień.",
      },
    ],
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
    schoolSteps: [
      {
        title: "Створіть акаунт учителя",
        body: "Введіть ім'я, школу та пароль. 30 секунд — без верифікації e-mail, без анкет.",
      },
      {
        title: "Створіть клас і скачайте коди",
        body: "Генеруємо 30 одноразових кодів для роздачі учням. PDF з кодами готовий одразу.",
      },
      {
        title: "Учні грають",
        body: "Логінуються кодом, грають у міні-ігри, будують своє місто Watt City. Без батьківського акаунта.",
      },
      {
        title: "Спостерігаєте за прогресом",
        body: "Тижневий PDF звіт, панель класу з топ-10 і вибір теми на наступний тиждень.",
      },
    ],
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
    schoolSteps: [
      {
        title: "Založte si účet učitele",
        body: "Zadejte jméno, školu a heslo. 30 sekund — bez ověření e-mailu, bez dotazníků.",
      },
      {
        title: "Vytvořte třídu a stáhněte kódy",
        body: "Vygenerujeme 30 jednorázových kódů pro žáky. PDF s kódy je hotové ihned.",
      },
      {
        title: "Žáci hrají",
        body: "Přihlásí se kódem, hrají minihry, staví své město Watt City. Bez rodičovského účtu, bez e-mailu.",
      },
      {
        title: "Sledujete pokrok",
        body: "Týdenní PDF do třídnice, panel třídy s top 10 a volba tématu na další týden.",
      },
    ],
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
    schoolSteps: [
      {
        title: "Create a teacher account",
        body: "Enter your name, school and password. 30 seconds — no email verification, no surveys.",
      },
      {
        title: "Create a class and download codes",
        body: "We generate 30 single-use codes to hand out to students. PDF with codes is ready immediately.",
      },
      {
        title: "Students play",
        body: "They sign in with the code, play minigames, build their Watt City. No parent account, no email.",
      },
      {
        title: "Track progress",
        body: "Weekly PDF report to the gradebook, class top-10 panel, and pick the topic for next week.",
      },
    ],
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
            className="chip"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            ✅ MEN V–VIII
          </span>
          <span
            className="chip"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            PKO SKO 2.0
          </span>
          <span
            className="chip"
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
            className="btn btn-secondary text-base"
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

      {/* -------- How it works (4-step diagram) --------
           UX Pass 3 F-NEW-03 — each card is now title + body. Earlier
           rendering surfaced just numbers in circles, which read as
           "unfinished" to a school director arriving cold. */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.howTitle}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.schoolSteps.map((step, i) => (
            <li
              key={i}
              className="card p-5 flex flex-col gap-3 relative"
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-semibold"
              >
                {i + 1}
              </span>
              <h3 className="t-h5 text-[var(--accent)]">{step.title}</h3>
              <p className="t-body-sm text-[var(--ink-muted)] leading-relaxed">
                {step.body}
              </p>
              {i < 3 && (
                <span
                  aria-hidden
                  className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[var(--accent)] text-2xl font-semibold"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* -------- Screenshots — content-rich previews --------
          Real screenshot assets are still pending PKO-side delivery.
          Earlier we showed a striped "Preview · soon" placeholder which
          made the page read like an unfinished deck. We now render
          per-screen content sketches (a mini class roster, a PDF
          summary card, a cashflow strip) using the same primitives
          the actual screens use, so a director sees a believable
          preview of what they'll receive instead of a TODO marker. */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.screensTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Class panel — top students roster preview */}
          <figure className="card p-0 overflow-hidden flex flex-col">
            <div className="bg-[var(--surface-2)] border-b border-[var(--line)] px-3 py-2 flex items-center justify-between">
              <span className="t-overline text-[var(--ink-muted)]">Klasa 7B</span>
              <span className="t-caption text-[var(--ink-muted)]">
                {lang === "pl" ? "tydzień 12" : lang === "uk" ? "тиждень 12" : lang === "cs" ? "týden 12" : "week 12"}
              </span>
            </div>
            <ol className="flex flex-col">
              {[
                { rank: 1, name: "Anna K.", xp: 1840, medal: "🥇" },
                { rank: 2, name: "Jakub P.", xp: 1620, medal: "🥈" },
                { rank: 3, name: "Zofia W.", xp: 1455, medal: "🥉" },
                { rank: 4, name: "Mateusz O.", xp: 1320 },
                { rank: 5, name: "Hanna L.", xp: 1180 },
              ].map((row) => (
                <li
                  key={row.rank}
                  className="flex items-center justify-between px-4 py-2 border-b border-[var(--line)] last:border-b-0 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span aria-hidden className="w-5 text-center text-[var(--ink-muted)]">
                      {row.medal ?? `#${row.rank}`}
                    </span>
                    <span className="truncate text-[var(--foreground)]">{row.name}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--accent)]">
                    {row.xp.toLocaleString("pl-PL")} W
                  </span>
                </li>
              ))}
            </ol>
            <figcaption className="px-4 py-3 border-t border-[var(--line)] text-sm leading-snug text-[var(--foreground)]">
              {t.screen1}
            </figcaption>
          </figure>

          {/* 2. Weekly PDF report — summary card preview */}
          <figure className="card p-0 overflow-hidden flex flex-col">
            <div className="bg-[var(--surface-2)] border-b border-[var(--line)] px-3 py-2 flex items-center gap-2">
              <span aria-hidden className="text-base">📄</span>
              <span className="t-overline text-[var(--ink-muted)]">
                Raport.pdf · 2 {lang === "pl" ? "strony" : lang === "uk" ? "стор." : lang === "cs" ? "strany" : "pages"}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-3 p-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: lang === "pl" ? "Uczniów" : lang === "uk" ? "Учнів" : lang === "cs" ? "Žáků" : "Students", value: "30" },
                  { label: lang === "pl" ? "Aktywnych" : lang === "uk" ? "Активних" : lang === "cs" ? "Aktivních" : "Active", value: "27" },
                  { label: lang === "pl" ? "Kodów MEN" : lang === "uk" ? "Кодів MEN" : lang === "cs" ? "Kódů MEN" : "Codes", value: "14" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1.5"
                  >
                    <div className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                      {stat.label}
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-[var(--accent)]">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              <ul className="flex flex-col gap-1 text-xs text-[var(--ink-muted)]">
                <li>✓ {lang === "pl" ? "Roster + XP per uczeń" : lang === "uk" ? "Список + XP" : lang === "cs" ? "Roster + XP na žáka" : "Roster + XP per student"}</li>
                <li>✓ {lang === "pl" ? "Pokrycie podstawy programowej" : lang === "uk" ? "Покриття програми" : lang === "cs" ? "Pokrytí programu" : "Curriculum coverage"}</li>
                <li>✓ {lang === "pl" ? "Wykres aktywności tygodniowej" : lang === "uk" ? "Графік активності" : lang === "cs" ? "Týdenní graf" : "Weekly activity chart"}</li>
              </ul>
            </div>
            <figcaption className="px-4 py-3 border-t border-[var(--line)] text-sm leading-snug text-[var(--foreground)]">
              {t.screen2}
            </figcaption>
          </figure>

          {/* 3. Student dashboard — city skyline + cashflow strip */}
          <figure className="card p-0 overflow-hidden flex flex-col">
            <div className="bg-[var(--surface-2)] border-b border-[var(--line)] px-3 py-2 flex items-center gap-2">
              <span aria-hidden className="text-base">🏙️</span>
              <span className="t-overline text-[var(--ink-muted)]">
                {lang === "pl" ? "Panel ucznia" : lang === "uk" ? "Панель учня" : lang === "cs" ? "Panel žáka" : "Student panel"}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-3 p-4">
              <div
                className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] flex items-end justify-center gap-1 px-3 py-3"
                aria-hidden
              >
                <span className="text-2xl leading-none">🏠</span>
                <span className="text-3xl leading-none">🏢</span>
                <span className="text-2xl leading-none">🏪</span>
                <span className="text-3xl leading-none">🏨</span>
                <span className="text-2xl leading-none">🏛️</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { icon: "⚡", label: "Watt", value: "+24/h", tone: "text-[var(--success)]" },
                  { icon: "💰", label: "W$", value: "1 240", tone: "text-[var(--accent)]" },
                  { icon: "📅", label: lang === "pl" ? "Rata" : lang === "uk" ? "Платіж" : lang === "cs" ? "Splátka" : "Payment", value: "120", tone: "text-[var(--foreground)]" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      <span aria-hidden>{stat.icon} </span>
                      {stat.label}
                    </span>
                    <span className={`tabular-nums font-semibold ${stat.tone}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="px-4 py-3 border-t border-[var(--line)] text-sm leading-snug text-[var(--foreground)]">
              {t.screen3}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* -------- Compliance badges row -------- */}
      <section className="card p-5 flex flex-col gap-3 border-[var(--success)]">
        <h2 className="section-heading text-lg">{t.complianceTitle}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {t.complianceItems.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="text-[var(--success)] font-semibold">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* -------- Podstawa programowa preview --------
          Curriculum chips are dense data — readability matters more than
          compact text. Bumped from 10/12 px to 13/14 px and the
          "+ more codes" footer turned from a tiny gray italic line into
          a real CTA pointing at the brochure that contains the full list. */}
      <section className="flex flex-col gap-4">
        <h2 className="section-heading text-2xl">{t.ppTitle}</h2>
        <p className="t-body text-[var(--foreground)] max-w-3xl">{t.ppLead}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {preview.map((c) => (
            <li
              key={c.code}
              className="border border-[var(--line)] rounded-md p-4 flex flex-col gap-1.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-xs font-semibold px-2 py-0.5 bg-[var(--surface-2)] rounded text-[var(--accent)]">
                  {c.code}
                </code>
                <span className="t-caption text-[var(--ink-muted)]">
                  {t.ppAreaLabel}: {c.area} · {t.ppGradeLabel}: {c.grade}
                </span>
              </div>
              <p className="text-sm leading-snug text-[var(--foreground)]">
                {c.description}
              </p>
            </li>
          ))}
        </ul>
        <Link
          href="/api/dla-szkol/pitch?locale=pl"
          prefetch={false}
          className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          {t.ppMoreLabel} <span aria-hidden>→</span>
        </Link>
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
        <p className="text-sm sm:text-base font-semibold">
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
          <Link href="/nauczyciel/signup" className="btn btn-secondary">
            {t.ctaSignup}
          </Link>
        </div>
      </section>
    </div>
  );
}
