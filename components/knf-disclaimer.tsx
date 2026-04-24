/* V2 refactor R7.2 — KNF-style disclaimer for every loan surface.
 *
 * Server component. Renders wherever a loan is quoted or taken so the
 * pedagogical frame ("this is a game, real loans are serious, always
 * read the RRSO and contract") is inescapable. Copy is deliberately
 * short — kids don't read long disclaimers. Tone echoes the KNF /
 * UOKiK consumer-protection framing: "zastanów się, zanim się
 * zadłużysz".
 */

import type { Lang } from "@/lib/i18n";

const COPY: Record<
  Lang,
  { title: string; body: string; rrsoNote: string; footnote: string }
> = {
  pl: {
    title: "⚠️ To gra edukacyjna",
    body:
      "Kredyt w Watt City uczy, jak działa oprocentowanie, RRSO i spłaty — ale to nie jest prawdziwa oferta bankowa.",
    rrsoNote:
      "RRSO pokazuje prawdziwy koszt kredytu rocznie — zawsze sprawdzaj ją w prawdziwym banku.",
    footnote:
      "Wzorowane na wytycznych KNF i UOKiK. W realnym życiu: czytaj umowę, pytaj dorosłych, nie spieszyj się.",
  },
  uk: {
    title: "⚠️ Це освітня гра",
    body:
      "Кредит у Watt City вчить, як працюють відсотки, RRSO та погашення — але це не справжня банківська пропозиція.",
    rrsoNote:
      "RRSO показує справжню річну вартість кредиту — у реальному банку завжди дивись на неї.",
    footnote:
      "За взірцем KNF та UOKiK. У реальному житті: читай договір, питай дорослих, не поспішай.",
  },
  cs: {
    title: "⚠️ Toto je vzdělávací hra",
    body:
      "Úvěr ve Watt City učí, jak funguje úrok, RRSO a splácení — ale není to skutečná bankovní nabídka.",
    rrsoNote:
      "RRSO ukazuje skutečné roční náklady úvěru — vždy si ji ve skutečné bance ověř.",
    footnote:
      "Podle vzoru KNF a UOKiK. Ve skutečném životě: čti smlouvu, ptej se dospělých, nespěchej.",
  },
  en: {
    title: "⚠️ This is an educational game",
    body:
      "Watt City loans teach how interest, APR, and repayments work — but this is not a real bank offer.",
    rrsoNote:
      "APR shows the real annual cost of a loan — always check it at a real bank.",
    footnote:
      "Modelled on KNF and UOKiK guidance. In real life: read the contract, ask a grown-up, don't rush.",
  },
};

type Props = {
  lang: Lang;
  /** compact inline variant (e.g. inline with a quote) vs full card. */
  variant?: "card" | "inline";
};

export function KnfDisclaimer({ lang, variant = "card" }: Props) {
  const t = COPY[lang];
  if (variant === "inline") {
    return (
      <p
        className="text-[11px] leading-snug px-2 py-1.5 border border-[var(--ink)] bg-[var(--surface-2)]"
        role="note"
      >
        <strong>{t.title}</strong> {t.body}{" "}
        <em className="not-italic opacity-80">{t.rrsoNote}</em>
      </p>
    );
  }
  return (
    <aside
      className="card p-3 sm:p-4 flex flex-col gap-2"
      style={{ borderColor: "var(--danger)" }}
      role="note"
      aria-label={t.title}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 border border-[var(--ink)]"
          style={{ background: "var(--danger)", color: "#0a0a0f" }}
        >
          KNF / UOKiK
        </span>
        <h3 className="text-sm font-semibold tracking-tight">
          {t.title}
        </h3>
      </div>
      <p className="text-xs leading-snug">{t.body}</p>
      <p className="text-xs leading-snug opacity-80">{t.rrsoNote}</p>
      <p className="text-[10px] leading-snug opacity-60 border-t border-[var(--ink)]/40 pt-2 mt-1">
        {t.footnote}
      </p>
    </aside>
  );
}
