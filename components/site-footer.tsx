import Link from "next/link";
import type { Lang, Dict } from "@/lib/i18n";
import type { ThemeTokens } from "@/lib/theme";

/**
 * Site footer — 3-layer adaptation of `03-COMPONENTS.md` §8.
 *
 * Spec §8 prescribes 4 layers (action bar / kurzy / link columns / legal),
 * but two of those carry bank-specific assumptions:
 *  - Layer 1 "book meeting / find branch / call us" doesn't apply to a game
 *    (no branches, no sales agents); UX-finding F-029 marks it @decision-needed.
 *  - Layer 2 "kurzy table" (FX rates) reads as financial-product chrome and
 *    would mislead users into thinking real money moves through the app.
 * Therefore this implementation collapses to:
 *   1. Brand + tagline (analogue to spec §1, but informational)
 *   2. Link columns (spec §3) — game / about / legal
 *   3. Legal bar (spec §4) — disclaimer, sponsors, source link
 *
 * Every text label is sourced from `dict.footer` / `dict.nav` where one
 * already exists; column headings are kept in this file (same pattern as
 * `site-nav.tsx::SCHOOL_LABEL`) to avoid expanding the i18n surface for a
 * structural redesign.
 */

const SECTIONS: Record<
  Lang,
  { play: string; about: string; legal: string; help: string }
> = {
  pl: { play: "Graj", about: "Platforma", legal: "Prawne", help: "Pomoc" },
  uk: { play: "Грати", about: "Платформа", legal: "Правове", help: "Допомога" },
  cs: { play: "Hraj", about: "Platforma", legal: "Právní", help: "Pomoc" },
  en: { play: "Play", about: "Platform", legal: "Legal", help: "Help" },
};

const HELP_LABELS: Record<
  Lang,
  { compareLoans: string; faq: string; contact: string }
> = {
  pl: {
    compareLoans: "Porównaj kredyty",
    faq: "FAQ — wkrótce",
    contact: "Kontakt — wkrótce",
  },
  uk: {
    compareLoans: "Порівняй кредити",
    faq: "FAQ — скоро",
    contact: "Контакти — скоро",
  },
  cs: {
    compareLoans: "Porovnat půjčky",
    faq: "FAQ — brzy",
    contact: "Kontakt — brzy",
  },
  en: {
    compareLoans: "Compare loans",
    faq: "FAQ — soon",
    contact: "Contact — soon",
  },
};

type Props = {
  lang: Lang;
  dict: Dict;
  theme: ThemeTokens;
};

export function SiteFooter({ lang, dict, theme }: Props) {
  const sections = SECTIONS[lang];
  const help = HELP_LABELS[lang];
  const bodyParts = dict.footer.body
    .replace("{event}", "§EVENT§")
    .replace("{track}", "§TRACK§")
    .split(/(§EVENT§|§TRACK§)/g);

  return (
    <footer className="w-full border-t border-[var(--line)] mt-12 bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">
        {/* Layer 1 — brand + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col gap-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-md font-semibold text-sm"
                style={{ background: theme.colors.accent, color: theme.colors.accentInk }}
              >
                {theme.brandShort}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-semibold text-[var(--foreground)]">
                  {theme.brand}
                </span>
                <span className="t-overline text-[var(--accent)]">by PKO</span>
              </span>
            </div>
            <p className="t-body-sm text-[var(--ink-muted)]">
              {bodyParts.map((p, i) => {
                if (p === "§EVENT§")
                  return (
                    <strong key={i} className="text-[var(--foreground)] font-semibold">
                      {dict.footer.event}
                    </strong>
                  );
                if (p === "§TRACK§")
                  return (
                    <strong key={i} className="text-[var(--accent)] font-semibold">
                      {dict.footer.track}
                    </strong>
                  );
                return <span key={i}>{p}</span>;
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="chip">PKO XP: Gaming</span>
            <span className="chip">ETHSilesia 2026</span>
            <span className="chip">Katowice · PL</span>
          </div>
        </div>

        {/* Layer 2 — link columns */}
        <nav
          aria-label={sections.about}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[var(--line)] pt-8"
        >
          <FooterColumn heading={sections.play}>
            <FooterLink href="/games">{dict.nav.games}</FooterLink>
            <FooterLink href="/miasto">{dict.nav.city}</FooterLink>
            <FooterLink href="/leaderboard">{dict.nav.league}</FooterLink>
            <FooterLink href="/marketplace">
              {{ pl: "Giełda", uk: "Біржа", cs: "Burza", en: "Marketplace" }[lang]}
            </FooterLink>
          </FooterColumn>
          <FooterColumn heading={sections.about}>
            <FooterLink href="/o-platforme">{dict.nav.about}</FooterLink>
            <FooterLink href="/dla-szkol">
              {{ pl: "Dla szkół", uk: "Для шкіл", cs: "Pro školy", en: "For schools" }[lang]}
            </FooterLink>
            <FooterLink href="/sin-slavy">{dict.nav.hall}</FooterLink>
          </FooterColumn>
          <FooterColumn heading={sections.help}>
            <FooterLink href="/loans/compare">{help.compareLoans}</FooterLink>
            <span className="t-body-sm text-[var(--ink-muted)]" aria-disabled="true">
              {help.faq}
            </span>
            <span className="t-body-sm text-[var(--ink-muted)]" aria-disabled="true">
              {help.contact}
            </span>
            <FooterLink
              href="https://github.com/B2JK-Industry/watt-city"
              external
            >
              {dict.footer.sourceLink}
            </FooterLink>
          </FooterColumn>
          <FooterColumn heading={sections.legal}>
            <FooterLink href="/ochrana-sukromia">{dict.nav.privacy}</FooterLink>
          </FooterColumn>
        </nav>

        {/* Layer 3 — legal bar */}
        <div className="border-t border-[var(--line)] pt-6 flex flex-col gap-3">
          <p className="t-caption text-[var(--ink-muted)]">{theme.disclaimer}</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 t-body-sm text-[var(--ink-muted)]">
            <span>{dict.footer.sponsors}</span>
            <span className="t-caption">
              © {new Date().getUTCFullYear()} {theme.brand}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="t-overline text-[var(--ink-muted)]">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {Array.isArray(children)
          ? children.map((c, i) => <li key={i}>{c}</li>)
          : <li>{children}</li>}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="t-body-sm text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors tap-target inline-flex items-center"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="t-body-sm text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors tap-target inline-flex items-center"
    >
      {children}
    </Link>
  );
}
