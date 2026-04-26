/* V4.8 — "Content Machine Phase 2" teaser banner.
 *
 * Mounted on / and /games. Informational only — sets expectations for
 * the V5 content expansion (60+ themes, 18 game kinds). Respects the
 * `v4_coming_soon_banner` feature flag (default on).
 */

import type { Lang } from "@/lib/i18n";

const COPY: Record<Lang, { hero: string; sub: string }> = {
  pl: {
    hero: "🚀 Content Machine Phase 2 · Q3 2026",
    sub: "60+ nowych tematów · 18 game kinds · klasyki finansowe + AI generator",
  },
  uk: {
    hero: "🚀 Content Machine Phase 2 · Q3 2026",
    sub: "60+ нових тем · 18 game kinds · класика фінансів + AI-генератор",
  },
  cs: {
    hero: "🚀 Content Machine Phase 2 · Q3 2026",
    sub: "60+ nových témat · 18 game kinds · finanční klasiky + AI generátor",
  },
  en: {
    hero: "🚀 Content Machine Phase 2 · Q3 2026",
    sub: "60+ new themes · 18 game kinds · financial classics + AI generator",
  },
};

/* Demo-review punch list: this banner used to lead the anonymous
 * landing with a 4 px danger-red bar shouting "Content Machine Phase
 * 2 · Q3 2026" above the value prop. It now reads as a quiet
 * informational note (subtle navy bar, neutral text colour, smaller
 * type) and lives under the hero, never above. */
export function ComingSoonBanner({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <aside
      className="card px-4 py-3 flex flex-col sm:flex-row gap-1 sm:gap-3 sm:items-baseline"
      style={{
        borderLeft: "2px solid var(--accent)",
      }}
      aria-label="Roadmap teaser"
    >
      <span className="t-overline text-[var(--ink-muted)] shrink-0">
        Roadmap
      </span>
      <p className="t-body-sm text-[var(--foreground)]">
        <span className="font-semibold">{t.hero.replace("🚀 ", "")}</span>
        <span className="text-[var(--ink-muted)]"> · {t.sub}</span>
      </p>
    </aside>
  );
}

export type ComingSoonTile = {
  kind: string;
  emoji: string;
  teaser: Record<Lang, string>;
};

export const COMING_SOON_TILES: ComingSoonTile[] = [
  {
    kind: "portfolio-pick",
    emoji: "📈",
    teaser: {
      pl: "Portfolio Pick — wybierz 3 z 6 akcji, sprawdź wyniki za rok.",
      uk: "Portfolio Pick — вибери 3 з 6 акцій, подивися результат за рік.",
      cs: "Portfolio Pick — vyber 3 z 6 akcií, sleduj výsledek za rok.",
      en: "Portfolio Pick — choose 3 of 6 stocks, see the 1-year outcome.",
    },
  },
  {
    kind: "tax-fill",
    emoji: "📝",
    teaser: {
      pl: "Tax Fill — wypełnij PIT-37, dostań rebate.",
      uk: "Tax Fill — заповни PIT-37, отримай повернення.",
      cs: "Tax Fill — vyplň PIT-37, získej rebate.",
      en: "Tax Fill — complete PIT-37 and claim your rebate.",
    },
  },
  {
    kind: "scenario-dialog",
    emoji: "🎭",
    teaser: {
      pl: "Scenario Dialog — podejmij decyzję finansową za swojego avatara.",
      uk: "Scenario Dialog — прийми фінансове рішення за свого аватара.",
      cs: "Scenario Dialog — rozhodni se za svého avatara.",
      en: "Scenario Dialog — make a financial decision as your avatar.",
    },
  },
  {
    kind: "chart-read-pro",
    emoji: "📊",
    teaser: {
      pl: "Chart Read Pro — analiza wykresów inflacji, lokat, akcji.",
      uk: "Chart Read Pro — аналіз графіків інфляції, депозитів, акцій.",
      cs: "Chart Read Pro — analýza grafů inflace, vkladů, akcií.",
      en: "Chart Read Pro — analyse inflation, deposit and stock charts.",
    },
  },
  {
    kind: "negotiate",
    emoji: "🤝",
    teaser: {
      pl: "Negotiate — wynegocjuj pensję, kredyt, cenę.",
      uk: "Negotiate — домовся про зарплату, кредит, ціну.",
      cs: "Negotiate — vyjednej si plat, úvěr, cenu.",
      en: "Negotiate — haggle over salary, loan, or price.",
    },
  },
];

export function ComingSoonGrid({ lang }: { lang: Lang }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-heading text-xl">
        🔒 Wkrótce · Coming Soon
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COMING_SOON_TILES.map((tile) => (
          <li
            key={tile.kind}
            className="card p-4 flex flex-col gap-2 opacity-70"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-3xl">{tile.emoji}</span>
              <span className="text-[10px] font-semibold opacity-60">
                Wkrótce
              </span>
            </div>
            <p className="text-sm leading-snug">{tile.teaser[lang]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
