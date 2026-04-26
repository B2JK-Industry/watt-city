import Link from "next/link";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getSession } from "@/lib/session";
import { OpenTutorialButton } from "@/components/onboarding-tour";

export const metadata = {
  title: "O platformie · Watt City",
  description:
    "Wizja, architektura i AI pipeline Watt City — gra edukacyjna ucząca dzieci finansów osobistych, zbudowana na ETHSilesia 2026.",
};

/* I-01 (F-NEW-05) — sticky TOC for the long-form about page.
 * Inline copy per-locale to avoid a 4-file dict edit for what is
 * essentially nav scaffolding. The list mirrors the section ids
 * below, so adding/removing a section means touching both arrays
 * in this file (no cross-file drift). */
const TOC: Record<
  "pl" | "uk" | "cs" | "en",
  { label: string; items: { id: string; label: string }[] }
> = {
  pl: {
    label: "Spis treści",
    items: [
      { id: "idea", label: "Myśl" },
      { id: "how", label: "Jak to działa" },
      { id: "progression", label: "Poziomy" },
      { id: "science", label: "Nauka" },
      { id: "team", label: "Zespół" },
      { id: "sponsors", label: "Sponsorzy" },
      { id: "pipeline", label: "AI pipeline" },
      { id: "stack", label: "Stack" },
      { id: "web3", label: "Web3" },
      { id: "roadmap", label: "Roadmap" },
    ],
  },
  uk: {
    label: "Зміст",
    items: [
      { id: "idea", label: "Ідея" },
      { id: "how", label: "Як це працює" },
      { id: "progression", label: "Рівні" },
      { id: "science", label: "Наука" },
      { id: "team", label: "Команда" },
      { id: "sponsors", label: "Спонсори" },
      { id: "pipeline", label: "AI pipeline" },
      { id: "stack", label: "Стек" },
      { id: "web3", label: "Web3" },
      { id: "roadmap", label: "Roadmap" },
    ],
  },
  cs: {
    label: "Obsah",
    items: [
      { id: "idea", label: "Myšlenka" },
      { id: "how", label: "Jak to funguje" },
      { id: "progression", label: "Úrovně" },
      { id: "science", label: "Věda" },
      { id: "team", label: "Tým" },
      { id: "sponsors", label: "Sponzoři" },
      { id: "pipeline", label: "AI pipeline" },
      { id: "stack", label: "Stack" },
      { id: "web3", label: "Web3" },
      { id: "roadmap", label: "Roadmap" },
    ],
  },
  en: {
    label: "Contents",
    items: [
      { id: "idea", label: "Idea" },
      { id: "how", label: "How it works" },
      { id: "progression", label: "Tiers" },
      { id: "science", label: "Science" },
      { id: "team", label: "Team" },
      { id: "sponsors", label: "Sponsors" },
      { id: "pipeline", label: "AI pipeline" },
      { id: "stack", label: "Stack" },
      { id: "web3", label: "Web3" },
      { id: "roadmap", label: "Roadmap" },
    ],
  },
};

export default async function AboutPage() {
  const [lang, session] = await Promise.all([getLang(), getSession()]);
  const dict = dictFor(lang);
  const t = dict.aboutPage;
  const toc = TOC[lang];
  return (
    <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-10 max-w-6xl">
      {/* I-01 — sticky TOC. Hidden under lg (mobile + tablet read
          top-to-bottom). The aside is sticky so the chapter index
          stays in view while the user scrolls through the article.
          No active-state highlight — that needs `IntersectionObserver`
          + a client component; deferred so this PR stays focused
          and the navigation is already a meaningful win without it. */}
      <aside
        className="hidden lg:block"
        aria-label={toc.label}
      >
        <nav className="sticky top-24 flex flex-col gap-1 t-body-sm">
          <p className="t-overline text-[var(--ink-muted)] mb-1">{toc.label}</p>
          {toc.items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-2 py-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col gap-10 animate-slide-up min-w-0">
      <header className="flex flex-col gap-3">
        {lang !== "pl" && (
          <p className="text-xs text-[var(--ink-muted)] italic">{t.note}</p>
        )}
        <h1 className="section-heading text-3xl sm:text-5xl">
          {t.title}
        </h1>
        {/* Hero chips trimmed to one line, all neutral. The previous
            three-chip row (one in danger-red) read as a jury pitch
            above the value prop; keeps just the partner badge so the
            page leads with the product story for parents/teachers. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">PKO · ETHSilesia 2026 · Katowice</span>
        </div>
        <p className="t-body-lg text-[var(--foreground)] max-w-3xl">{t.heroBody}</p>
        {session && (
          <div className="flex">
            <OpenTutorialButton lang={lang} />
          </div>
        )}
      </header>

      {/* -------- Myšlienka -------- */}
      <section id="idea" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.ideaTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-[var(--foreground)]">
          <p>
            {t.ideaBody1}{" "}
            <a
              href="https://www.oecd.org/finance/financial-education/oecd-pisa-global-financial-literacy-survey.htm"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              OECD PISA 2022
            </a>
            .
          </p>
          <p>{t.ideaBody2}</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>{t.ideaList1}</li>
            <li>{t.ideaList2}</li>
            <li>{t.ideaList3}</li>
          </ol>
        </div>
      </section>

      {/* Section order — value first, technical lower. Demo-review
          punch list flagged the prior layout (idea → science → AI
          pipeline → tiers → tech → team → sponsors → web3) for opening
          with technical density above the parent/teacher/player value
          prop. New order: how it works → progression → science →
          team → sponsors, then AI pipeline → tech stack → web3 once
          the reader is past the value pitch. */}

      {/* -------- Ako to funguje — dict-driven (t.howSteps). */}
      <section id="how" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.howTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.howSteps.map((step, i) => (
            <StepCard
              key={step.title}
              n={i + 1}
              title={step.title}
              body={step.body}
            />
          ))}
        </div>
      </section>

      {/* -------- Progression ladder (V3.1 — city-first) -------- */}
      <section id="progression" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.tiersTitle}</h2>
        <ol className="flex flex-col gap-3">
          {t.ladder.map((row, i) => (
            <li
              key={i}
              className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-start"
            >
              <span className="flex-shrink-0 w-14 h-14 rounded-xl border border-[var(--line)] bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-lg flex flex-col items-center justify-center">
                <span className="text-[9px] leading-none">Lvl</span>
                <span className="text-xl leading-none">{i + 1}</span>
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-base leading-tight">{row.title}</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  <span className="opacity-60">{t.tiersUnlockLabel} </span>
                  <strong>{row.unlock}</strong>
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] italic leading-snug">
                  💡 {row.eduMoment}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* -------- Veda za dizajnom — dict-driven (see lib/locales/*.ts
          aboutPage.scienceIntro / scienceBullets / scienceConclusion). */}
      <section id="science" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.scienceTitle}</h2>
        <div className="card p-6 flex flex-col gap-4 text-[var(--foreground)]">
          <p>{t.scienceIntro}</p>
          <ul className="list-disc pl-6 space-y-3">
            {t.scienceBullets.map((bullet) => (
              <li key={bullet.linkHref}>
                <strong>{bullet.boldHead}</strong>{" "}
                {bullet.body}{" "}
                <a
                  href={bullet.linkHref}
                  className="underline text-[var(--accent)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {bullet.linkText}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[var(--ink-muted)] italic">
            {t.scienceConclusion}
          </p>
        </div>
      </section>

      {/* -------- Tím -------- */}
      <section id="team" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.teamTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-[var(--foreground)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl">🛠️</span>
            <div>
              <p className="font-semibold text-lg tracking-tight">
                B2JK-Industry
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Hackathonový tím · ETHSilesia 2026 · Katowice
              </p>
            </div>
          </div>
          <p>{t.teamBody}</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Kontakt:{" "}
            <a
              href="https://github.com/B2JK-Industry"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              github.com/B2JK-Industry
            </a>
            .
          </p>
        </div>
      </section>

      {/* -------- Sponzori / thanks -------- */}
      <section id="sponsors" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.sponsorsTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-sm text-[var(--foreground)]">
          <p>{t.sponsorsBody}</p>
          <p>
            {t.sponsorsStack}{" "}
            <Link
              href="/ochrana-sukromia"
              className="underline text-[var(--accent)]"
            >
              /ochrana-sukromia
            </Link>
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Vďaka: PKO Bank Polski · Tauron · ETHWarsaw · AKMF ·
            Katowicki.Hub.
          </p>
        </div>
      </section>

      {/* -------- AI pipeline (technical — moved below the product
          story per the demo-review punch list). */}
      <section id="pipeline" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.pipelineTitle}</h2>
        <div className="card p-6 flex flex-col gap-5 text-[var(--foreground)]">
          <p>{t.pipelineIntro}</p>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-5 sm:p-6">
            <ol className="flex flex-wrap gap-x-3 gap-y-4 text-xs sm:text-sm">
              {[
                { label: "Vercel Cron", meta: "0 9 * * *" },
                { label: "Research", meta: "pickSeed()" },
                { label: "Generate", meta: "Claude 4.6" },
                { label: "Validate", meta: "zod schema" },
                { label: "Portfolio", meta: "diversity gate" },
                { label: "Publish", meta: "Upstash TTL" },
                { label: "Evict", meta: "oldest of 3" },
              ].map((step, i, arr) => (
                <li
                  key={step.label}
                  className="flex items-center gap-2"
                >
                  <div className="min-w-[128px] rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono">
                    <p className="font-semibold text-sm leading-tight">
                      {step.label}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
                      {step.meta}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="text-[var(--accent)] font-semibold text-lg"
                    >
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.pipelineSteps.map((step, i) => (
              <PipelineStep
                key={step.name}
                n={String(i + 1)}
                name={step.name}
                detail={step.details}
              />
            ))}
          </div>

          <div className="rounded-xl border border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] p-4 text-sm">
            <strong>{t.pipelineSecurityLabel}</strong> {t.pipelineSecurityBody}
          </div>

          <p className="text-xs text-[var(--ink-muted)]">
            Source of truth:{" "}
            <a
              href="https://github.com/B2JK-Industry/watt-city/tree/main/lib/ai-pipeline"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              /lib/ai-pipeline
            </a>
            {" · "}
            <a
              href="https://github.com/B2JK-Industry/watt-city/blob/main/app/api/cron/daily-game/route.ts"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              /api/cron/daily-game
            </a>
            {" · "}
            <a
              href="https://github.com/B2JK-Industry/watt-city/blob/main/vercel.json"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              vercel.json
            </a>
          </p>
        </div>
      </section>

      {/* -------- Tech stack -------- */}
      <section id="stack" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.stackTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <TechItem name="Next.js 16" note="App Router, RSC, Turbopack." />
          <TechItem name="React 19.2" note="Server components + client islands." />
          <TechItem name="TypeScript strict" note="Úplné typové pokrytie." />
          <TechItem name="Tailwind CSS 4" note="Neo-brutalist tokens + primitives v globals.css." />
          <TechItem name="Upstash Redis" note="Sorted sets pre leaderboardy, JSON pre účty a duely, EU región." />
          <TechItem name="zod" note="Vstupná + AI-output validácia." />
          <TechItem name="scrypt + HMAC" note="Heslá + HTTP-only signed session cookie." />
          <TechItem name="Vercel Cron" note="AI pipeline trigger denne o 09:00 UTC." />
          <TechItem name="Anthropic SDK" note="Claude Sonnet 4.6 (PL gen) + Haiku 4.5 (3× preklad), JSON structured output." />
          <TechItem name="SVG, žiadne PNG/JPG" note="Celé mestečko + budova sú vektor, ostrý na 4K." />
        </div>
      </section>

      {/* -------- Web3 (opt-in, ETHSilesia 2026) -------- */}
      <section id="web3" className="flex flex-col gap-3 card p-5 border-[var(--accent)] scroll-mt-24">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="section-heading text-2xl">{t.web3Title}</h2>
          <span className="text-[10px] opacity-70">
            {t.web3StatusLabel} {t.web3StatusValue}
          </span>
        </div>
        <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{t.web3Body}</p>
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold">
            {t.web3TenetsTitle}
          </h3>
          <ul className="list-disc pl-6 space-y-1 text-sm text-[var(--ink-muted)]">
            {t.web3Tenets.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-70">
          {t.web3LinksLabel}{" "}
          <a
            href="https://github.com/B2JK-Industry/watt-city/blob/main/docs/web3/SUBMISSION.md"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {t.web3SubmissionLinkLabel}
          </a>
          {" · "}
          <a
            href="https://github.com/B2JK-Industry/watt-city/blob/main/docs/web3/PLAN.md"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {t.web3PlanLinkLabel}
          </a>
        </p>
      </section>

      {/* -------- Roadmap -------- */}
      <section id="roadmap" className="flex flex-col gap-4 scroll-mt-24">
        <h2 className="section-heading text-2xl">{t.roadmapTitle}</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--ink-muted)]">
          {t.roadmap.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-[var(--ink-muted)] border-t border-[var(--line)] pt-4 flex flex-wrap gap-4">
        <Link href="/" className="underline">Späť na domov</Link>
        <Link href="/ochrana-sukromia" className="underline">Ochrana súkromia</Link>
        <a
          href="https://github.com/B2JK-Industry/watt-city"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
      </div>
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-[var(--accent)] text-[var(--accent-ink)] border border-[var(--line)] font-semibold">
        {n}
      </span>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--ink-muted)]">{body}</p>
    </div>
  );
}

function PipelineStep({
  n,
  name,
  detail,
}: {
  n: string;
  name: string;
  detail: string[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--line)] font-semibold text-xs">
          {n}
        </span>
        <h4 className="font-semibold text-sm">
          {name}
        </h4>
      </div>
      <ul className="list-disc pl-5 space-y-0.5 text-xs text-[var(--ink-muted)]">
        {detail.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

function TechItem({ name, note }: { name: string; note: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
      <p className="font-semibold tracking-tight">{name}</p>
      <p className="text-xs text-[var(--ink-muted)]">{note}</p>
    </div>
  );
}
