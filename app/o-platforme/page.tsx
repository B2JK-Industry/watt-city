import Link from "next/link";
import { CITY_TIERS } from "@/lib/level";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  title: "O platformie · XP Arena",
  description:
    "Wizja, architektura i AI pipeline XP Areny — gamifikowana edukacja finansowa i energetyczna dla Gen Z, zbudowana na ETHSilesia 2026 dla kategorii PKO XP: Gaming.",
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

      {/* -------- Veda za dizajnom -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.scienceTitle}</h2>
        <div className="card p-6 flex flex-col gap-4 text-zinc-300">
          <p>
            Dnešný užívateľ prichádza unavený z celého dňa a hľadá{" "}
            <strong>nový dopaminergný podnet</strong>, nie replikáciu
            včerajšieho. Výskum v behaviorálnej psychológii a HCI to
            potvrdzuje:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>Berridge &amp; Robinson — incentive salience (1998).</strong>{" "}
              Dopamin nekóduje potešenie (liking) ale <em>motiváciu hľadať</em>{" "}
              nové podnety (wanting). Platformy ktoré pravidelne prinášajú{" "}
              novotu udržiavajú „wanting" na vyšších hodnotách.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/9858756/"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                PubMed
              </a>
            </li>
            <li>
              <strong>
                Skinner — intermittent reinforcement (operant conditioning).
              </strong>{" "}
              Variabilné odmeny (nevieš dopredu čo dnes bude) tvoria
              najtrvalejšie návyky — viac než konštantné odmeny.{" "}
              <a
                href="https://en.wikipedia.org/wiki/Reinforcement#Intermittent_reinforcement_schedules"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                Wikipedia
              </a>
            </li>
            <li>
              <strong>
                Csíkszentmihályi — Flow (1990).
              </strong>{" "}
              Hráč ostáva pohltený keď výzva mierne prevyšuje zručnosť. 30-s
              hra s combo multiplikátormi tento zóny trafí presne — príliš
              ľahká uspí, príliš ťažká otrávi.{" "}
              <a
                href="https://en.wikipedia.org/wiki/Flow_(psychology)"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                Flow
              </a>
            </li>
            <li>
              <strong>Deci &amp; Ryan — Self-Determination Theory.</strong>{" "}
              Motiváciu drží trojica autonómia (vyberám si hru), kompetencia
              (rebríček, medaile), vzťahovosť (duel s kamošom).{" "}
              <a
                href="https://selfdeterminationtheory.org/"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                SDT
              </a>
            </li>
            <li>
              <strong>Nir Eyal — Hooked (2014).</strong> Variabilné odmeny +
              investícia (buildup) = habit loop. XP Arena kombinuje oba: AI
              variabilita + rastúca budova ako investícia v čase.{" "}
              <a
                href="https://www.nirandfar.com/hooked/"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                nirandfar.com
              </a>
            </li>
            <li>
              <strong>Duolingo retention playbook.</strong> Streak + denná
              výzva + leagues = 100 M+ MAU. Replikujeme princípy, ale
              výmenou za lekcie jazyka ponúkame finance + energetiku, a
              metaforu „animovaná sova" sme nahradili rastúcou budovou.{" "}
              <a
                href="https://blog.duolingo.com/how-we-reimagined-our-streak-system/"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                Duolingo blog
              </a>
            </li>
            <li>
              <strong>NYT Wordle — water-cooler efekt.</strong> Deterministický
              seed, všetci hrajú rovnakú úlohu → spontánne rozhovory. Náš{" "}
              <em>duel kódom</em> a <em>seeded AI výzva dňa</em> odvodzujú
              rovnaký efekt.{" "}
              <a
                href="https://www.nytco.com/press/wordle/"
                className="underline text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                NYT
              </a>
            </li>
          </ul>
          <p className="text-sm text-zinc-400 italic">
            Záver: <strong>veľa generovaných hier</strong> nie je „cheat na
            engagement" — je to priamy preklad desaťročí výskumu do
            dostupnej platformy.
          </p>
        </div>
      </section>

      {/* -------- Ako to funguje -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.howTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard
            n={1}
            title="Hraj"
            body="9 evergreen minihier (finance + energetika) + dnešná AI výzva. Každá trvá 30–90 s. Combo ×3. Okamžitý feedback."
          />
          <StepCard
            n={2}
            title="Vygeneruj Watty"
            body="Best-score model: opakovanie ti nezvýši skóre, musíš rekord prekonať. Tvoja budova rastie tier po tieri."
          />
          <StepCard
            n={3}
            title="Súťaž"
            body="Duel kódom s kamošom (PvP bonus ×2 Watty), Sliezska Watt liga, Sieň slávy medailí."
          />
        </div>
      </section>

      {/* -------- AI pipeline -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.pipelineTitle}</h2>
        <div className="card p-6 flex flex-col gap-5 text-zinc-300">
          <p>
            Kostra pipelinu je v commite už teraz — produkčný spúšťač čaká
            iba na aktiváciu <code>ANTHROPIC_API_KEY</code>. Pri hackathon
            demo beží deterministický fallback, aby judge mohol odsledovať
            celý cyklus bez billingu.
          </p>

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
            <PipelineStep
              n="1"
              name="Research"
              detail={[
                "lib/ai-pipeline/research.ts",
                "16 tém × 4 konkrétnych uhlov × 3 obtiažnosti — daily bucket vyberie (téma, angle, difficulty).",
                "Každá téma je viazaná na 1 kind (quiz / scramble / price-guess).",
              ]}
            />
            <PipelineStep
              n="2"
              name="Generate (Sonnet PL)"
              detail={[
                "lib/ai-pipeline/generate.ts",
                "Claude Sonnet 4.6 produkuje PL spec podľa kind-specific schémy (anyOf/$defs sa vyhýbame).",
                "Prompt caching na systémovom prompte; user prompt má date + theme + angle + difficulty.",
              ]}
            />
            <PipelineStep
              n="3"
              name="Translate (Haiku ×3)"
              detail={[
                "Claude Haiku 4.5 preloží PL spec paralelne do UK / CS / EN.",
                "Numerické invarianty (correctIndex, truth, tolerancePct, xpPer*, unit) sú lock-ed z PL — translator nesmie meniť.",
                "PL-native termíny (zł, BLIK, NBP, RRSO, IKE/IKZE) sú chránené v prompte.",
              ]}
            />
            <PipelineStep
              n="4"
              name="Validate"
              detail={[
                "zod schémy: QuizItem / ScrambleItem / PriceGuessItem / LocalizedSpec (pl/uk/cs/en) / AiGame envelope.",
                "Portfolio diversity gate: ak hra s rovnakou témou už je live, odmietneme.",
              ]}
            />
            <PipelineStep
              n="5"
              name="Publish + archive"
              detail={[
                "Envelope `xp:ai-games:<id>` — trvalé (bez TTL), hra ostáva playable naveky.",
                "Index `xp:ai-games:index` capnutý na 3 aktívne hry; pretečené sa iba odstránia z indexu, ale stále sa dajú hrať cez /games/ai/<id>.",
                "Archive record `xp:ai-games:archive:<id>` — minimálna kópia pre Hall of Fame.",
              ]}
            />
            <PipelineStep
              n="6"
              name="UI rollout"
              detail={[
                "CityScene: unikátny SVG vizuál hashnutý z game id (768 kombinácií) + WattMeter.",
                "Renderer `/games/ai/[id]` vyberie spec podľa užívateľovho lang cookie (fallback na PL).",
                "Medaile za top 3 ostávajú permanentne (leaderboard ZSET bez TTL).",
              ]}
            />
          </div>

          <div className="rounded-xl border-2 border-[var(--neo-pink)] bg-[color-mix(in_oklab,var(--neo-pink)_12%,transparent)] p-4 text-sm">
            <strong>Bezpečnosť:</strong> Cron endpoint je strážený{" "}
            <code>Bearer &lt;CRON_SECRET&gt;</code> hlavičkou; Vercel Cron
            podpisuje volania automaticky. Žiadne user PII nikdy neopúšťa
            Upstash (Claude vidí iba zadanie témy, nie user data).
          </div>

          <p className="text-xs text-zinc-500">
            Source of truth:{" "}
            <a
              href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026/tree/main/lib/ai-pipeline"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              /lib/ai-pipeline
            </a>
            {" · "}
            <a
              href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026/blob/main/app/api/cron/daily-game/route.ts"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              /api/cron/daily-game
            </a>
            {" · "}
            <a
              href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026/blob/main/vercel.json"
              className="underline text-[var(--accent)]"
              target="_blank"
              rel="noreferrer"
            >
              vercel.json
            </a>
          </p>
        </div>
      </section>

      {/* -------- Progression -------- */}
      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-2xl">{t.tiersTitle}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {CITY_TIERS.map((t) => (
            <div
              key={t.level}
              className={`aspect-square rounded-xl border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] ${t.accent} flex flex-col items-center justify-center text-center p-1`}
              title={`Tier ${t.level}: ${t.full}`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-[9px] font-black uppercase text-[#0a0a0f] leading-tight mt-0.5">
                T{t.level}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          Drevená búda (Nikiszowiec) → Robotnícky dom → Rodinný dom →
          Kamenica → Solárna činžovka → Kancelária → Mrakodrap → Altus Tower
          (125 m) → <strong>Varso Tower</strong> (310 m, najvyššia v EÚ).
        </p>
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
          href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026"
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
