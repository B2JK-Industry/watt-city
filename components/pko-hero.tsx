import Link from "next/link";
import type { Dict } from "@/lib/i18n";

/* Anonymous-visitor PKO landing hero. Per docs/partnerships/
 * pko-visual-system-v1/07-LANDING-HERO-REDESIGN.md — banking-clean
 * layout (hero band → trust band → three-up perks → how-it-works →
 * footer). Only rendered when app/layout.tsx resolveTheme() reports
 * the PKO skin; the core anonymous hero in app/page.tsx renders
 * unchanged for the default skin.
 *
 * CSS lives in app/globals-pko.css §9-§11 (hero-band, trust-band,
 * perks-row, steps-row). This component carries the markup + copy
 * only; all shape primitives flow through the PKO skin shield. */
export function PkoHero({ dict }: { dict: Dict }) {
  const t = dict.pkoHero;
  return (
    <div className="pko-landing flex flex-col gap-0 animate-slide-up -mx-4 sm:-mx-6">
      <section className="pko-hero-band">
        <div className="pko-hero-copy">
          <h1 className="pko-hero-title">{t.title}</h1>
          <p className="pko-hero-sub">{t.sub}</p>
          <div className="pko-hero-cta-row">
            <Link href="/register" className="btn btn-primary btn-cta-hero">
              {t.ctaPrimary}
            </Link>
            <Link href="/o-platforme" className="btn btn-ghost btn-cta-hero">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
        <div className="pko-hero-skyline" aria-hidden>
          <PkoSkylineIcon />
          <div className="pko-hero-skyline-caption">
            <span>{t.skylineCaption}</span>
            <span className="pko-hero-skyline-badge">{t.skylineBadge}</span>
          </div>
        </div>
      </section>

      <section className="pko-trust-band" role="contentinfo">
        {t.trustLine}
      </section>

      <section className="pko-perks">
        <h2 className="pko-perks-title">{t.perksTitle}</h2>
        <div className="pko-perks-row">
          <article className="pko-perk-card">
            <PerkIcon kind="shield" />
            <h3>{t.perkSafetyTitle}</h3>
            <p>{t.perkSafetyBody}</p>
          </article>
          <article className="pko-perk-card">
            <PerkIcon kind="game" />
            <h3>{t.perkGameTitle}</h3>
            <p>{t.perkGameBody}</p>
          </article>
          <article className="pko-perk-card">
            <PerkIcon kind="growth" />
            <h3>{t.perkGrowthTitle}</h3>
            <p>{t.perkGrowthBody}</p>
          </article>
        </div>
      </section>

      <section className="pko-steps">
        <h2 className="pko-steps-title">{t.stepsTitle}</h2>
        <ol className="pko-steps-row">
          <li className="pko-step">
            <span className="pko-step-circle" aria-hidden>1</span>
            <span>{t.step1}</span>
          </li>
          <li className="pko-step">
            <span className="pko-step-circle" aria-hidden>2</span>
            <span>{t.step2}</span>
          </li>
          <li className="pko-step">
            <span className="pko-step-circle" aria-hidden>3</span>
            <span>{t.step3}</span>
          </li>
        </ol>
      </section>
    </div>
  );
}

/* Lightweight inline icon set — 48×48, 1-line navy strokes, no fill.
 * A single <svg> per role so the bundle stays small; official PKO
 * iconography swaps via CSS background-image on the .pko-perk-icon
 * class once the brand team ships the sprite (tracked in
 * OPEN-QUESTIONS-LOG.md Q2). */
function PerkIcon({ kind }: { kind: "shield" | "game" | "growth" }) {
  if (kind === "shield") {
    return (
      <svg
        className="pko-perk-icon"
        viewBox="0 0 48 48"
        width="48"
        height="48"
        aria-hidden
        focusable="false"
      >
        <path
          d="M24 6 L40 12 V24 C40 34 32 40 24 42 C16 40 8 34 8 24 V12 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 24 L22 29 L31 19"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "game") {
    return (
      <svg
        className="pko-perk-icon"
        viewBox="0 0 48 48"
        width="48"
        height="48"
        aria-hidden
        focusable="false"
      >
        <rect
          x="6"
          y="14"
          width="36"
          height="22"
          rx="6"
          ry="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle cx="34" cy="22" r="2" fill="currentColor" />
        <circle cx="34" cy="28" r="2" fill="currentColor" />
        <line
          x1="12"
          y1="25"
          x2="20"
          y2="25"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="21"
          x2="16"
          y2="29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      className="pko-perk-icon"
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden
      focusable="false"
    >
      <polyline
        points="6,34 18,22 26,30 42,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="32,12 42,12 42,22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PkoSkylineIcon() {
  return (
    <svg
      className="pko-hero-skyline-svg"
      viewBox="0 0 480 300"
      width="100%"
      height="100%"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="pkoHeroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sko-navy-500, #004C9A)" />
          <stop offset="1" stopColor="var(--sko-navy-900, #001E4B)" />
        </linearGradient>
      </defs>
      <rect width="480" height="300" fill="url(#pkoHeroSky)" />
      {/* Back silhouette */}
      <path
        d="M0 220 L40 220 L40 180 L80 180 L80 150 L140 150 L140 120 L200 120 L200 90 L240 90 L240 70 L280 70 L280 110 L320 110 L320 140 L360 140 L360 170 L420 170 L420 200 L480 200 L480 300 L0 300 Z"
        fill="var(--sko-navy-700, #003574)"
      />
      {/* Front silhouette */}
      <path
        d="M0 250 L60 250 L60 210 L110 210 L110 180 L160 180 L160 220 L210 220 L210 170 L260 170 L260 210 L310 210 L310 190 L360 190 L360 230 L420 230 L420 200 L480 200 L480 300 L0 300 Z"
        fill="var(--sko-navy-900, #001E4B)"
      />
      {/* Windows — warm orange lit accents */}
      <g fill="var(--sko-accent-orange-light, #DB912C)">
        <rect x="90" y="190" width="4" height="6" />
        <rect x="102" y="190" width="4" height="6" />
        <rect x="90" y="202" width="4" height="6" />
        <rect x="180" y="195" width="4" height="6" />
        <rect x="192" y="195" width="4" height="6" />
        <rect x="235" y="180" width="4" height="6" />
        <rect x="247" y="185" width="4" height="6" />
        <rect x="335" y="205" width="4" height="6" />
        <rect x="400" y="215" width="4" height="6" />
      </g>
    </svg>
  );
}
