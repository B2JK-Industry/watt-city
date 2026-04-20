import Link from "next/link";
import { LEVEL_UNLOCK_LADDER } from "@/lib/city-level";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  title: "O platformie · Watt City",
  description:
    "Wizja, architektura i AI pipeline Watt City — gra edukacyjna ucząca dzieci finansów osobistych, zbudowana na ETHSilesia 2026.",
};

export default async function AboutPage() {
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.aboutPage;
  return (
    <div className="flex flex-col gap-10 animate-slide-up max-w-4xl">
      <header className="flex flex-col gap-3">
        {lang !== "pl" && (
          <p className="text-xs text-zinc-500 italic">{t.note}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-5xl">
            {t.title}
          </h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-yellow)", color: "#0a0a0f" }}
          >
            PKO XP · Gaming
          </span>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}
          >
            ETHSilesia 2026
          </span>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}
          >
            Katowice
          </span>
        </div>
        <p className="text-lg text-zinc-300 max-w-3xl">{t.heroBody}</p>
      </header>

      {/* -------- Myšlienka -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.ideaTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-zinc-300">
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

      {/* -------- Veda za dizajnom — dict-driven (see lib/locales/*.ts
          aboutPage.scienceIntro / scienceBullets / scienceConclusion).
          No hardcoded locale lives here anymore. */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.scienceTitle}</h2>
        <div className="card p-6 flex flex-col gap-4 text-zinc-300">
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
          <p className="text-sm text-zinc-400 italic">
            {t.scienceConclusion}
          </p>
        </div>
      </section>

      {/* -------- Ako to funguje — dict-driven (t.howSteps). */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.howTitle}</h2>
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

      {/* -------- AI pipeline — dict-driven (t.pipelineIntro /
          t.pipelineSteps / t.pipelineSecurity). No Slovak / locale
          leak in this file anymore. */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.pipelineTitle}</h2>
        <div className="card p-6 flex flex-col gap-5 text-zinc-300">
          <p>{t.pipelineIntro}</p>

          <div className="rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--surface-2)] p-5 sm:p-6">
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
                  <div className="min-w-[128px] rounded-xl border-[3px] border-[var(--ink)] bg-[var(--surface)] px-3 py-2 shadow-[3px_3px_0_0_var(--ink)] font-mono">
                    <p className="font-black text-sm leading-tight">
                      {step.label}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      {step.meta}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="text-[var(--accent)] font-black text-lg"
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

          <div className="rounded-xl border-2 border-[var(--neo-pink)] bg-[color-mix(in_oklab,var(--neo-pink)_12%,transparent)] p-4 text-sm">
            <strong>{t.pipelineSecurityLabel}</strong> {t.pipelineSecurityBody}
          </div>

          <p className="text-xs text-zinc-500">
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

      {/* -------- Progression ladder (V3.1 — city-first) -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.tiersTitle}</h2>
        <ol className="flex flex-col gap-3">
          {LEVEL_UNLOCK_LADDER.map((row) => (
            <li
              key={row.level}
              className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-start"
            >
              <span className="flex-shrink-0 w-14 h-14 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--accent)] text-[#0a0a0f] font-black text-lg flex flex-col items-center justify-center shadow-[3px_3px_0_0_var(--ink)]">
                <span className="text-[9px] uppercase leading-none">Lvl</span>
                <span className="text-xl leading-none">{row.level}</span>
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-base leading-tight">{row.title}</p>
                <p className="text-sm text-zinc-300">
                  <span className="opacity-60">Odblokowujesz: </span>
                  <strong>{row.unlock}</strong>
                </p>
                <p className="text-[11px] text-zinc-400 italic leading-snug">
                  💡 {row.eduMoment}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* -------- Tech stack -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.stackTitle}</h2>
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

      {/* -------- Tím -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.teamTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-zinc-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl">🛠️</span>
            <div>
              <p className="font-black uppercase text-lg tracking-tight">
                B2JK-Industry
              </p>
              <p className="text-xs text-zinc-500">
                Hackathonový tím · ETHSilesia 2026 · Katowice
              </p>
            </div>
          </div>
          <p>{t.teamBody}</p>
          <p className="text-sm text-zinc-400">
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
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.sponsorsTitle}</h2>
        <div className="card p-6 flex flex-col gap-3 text-sm text-zinc-300">
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
          <p className="text-xs text-zinc-500">
            Vďaka: PKO Bank Polski · Tauron · ETHWarsaw · AKMF ·
            Katowicki.Hub.
          </p>
        </div>
      </section>

      {/* -------- Web3 (opt-in, ETHSilesia 2026) -------- */}
      <section className="flex flex-col gap-3 card p-5 border-[var(--neo-cyan)]">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="brutal-heading text-2xl">{t.web3Title}</h2>
          <span className="text-[10px] uppercase tracking-widest opacity-70">
            {t.web3StatusLabel} {t.web3StatusValue}
          </span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{t.web3Body}</p>
        <div className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-widest font-black">
            {t.web3TenetsTitle}
          </h3>
          <ul className="list-disc pl-6 space-y-1 text-sm text-zinc-300">
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
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.roadmapTitle}</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-300">
          {t.roadmap.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-zinc-500 border-t-2 border-[var(--ink)]/30 pt-4 flex flex-wrap gap-4">
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
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-[var(--accent)] text-[#0a0a0f] border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black">
        {n}
      </span>
      <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-400">{body}</p>
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
    <div className="rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--surface)] p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--neo-cyan)] text-[#0a0a0f] border-2 border-[var(--ink)] font-black text-xs">
          {n}
        </span>
        <h4 className="font-black uppercase text-sm tracking-widest">
          {name}
        </h4>
      </div>
      <ul className="list-disc pl-5 space-y-0.5 text-xs text-zinc-400">
        {detail.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

function TechItem({ name, note }: { name: string; note: string }) {
  return (
    <div className="rounded-xl border-[3px] border-[var(--ink)] bg-[var(--surface)] shadow-[3px_3px_0_0_var(--ink)] p-3">
      <p className="font-black uppercase tracking-tight">{name}</p>
      <p className="text-xs text-zinc-400">{note}</p>
    </div>
  );
}
