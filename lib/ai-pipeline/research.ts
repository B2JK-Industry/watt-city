/* Research step — picks a theme for the next 6-hour game.
 *
 * In production this would call Claude with web search enabled to pick a
 * theme drawn from: (a) today's date/calendar (pay-day Friday, Earth Hour),
 * (b) recent PL macro news (WIBOR move, IKE limit bump, NBP rate cut),
 * (c) Tauron/PKO announcements, (d) Silesia cultural calendar (festivals,
 * Nikiszowiec anniversaries). For the hackathon MVP we use a deterministic
 * rotating pool so judges can watch a cron cycle without API keys.
 */

export type ResearchSeed = {
  theme: string;
  buildingName: string;
  buildingGlyph: string;
  buildingRoof: string;
  buildingBody: string;
  source: string;
  notes: string;
};

const ROTATION_POOL: ResearchSeed[] = [
  {
    theme: "Inflácia v Poľsku — aký je reálny úrok",
    buildingName: "NBP Watch",
    buildingGlyph: "📉",
    buildingRoof: "bg-[var(--neo-pink)]",
    buildingBody: "bg-rose-500",
    source: "research: nbp.pl cpi monthly bulletin",
    notes:
      "5 kvízových otázok o inflácii, reálnej úrokovej sadzbe, dopadoch na sporenie a na IKE limit.",
  },
  {
    theme: "Earth Hour — energia vypnutá na hodinu",
    buildingName: "Eco Hour",
    buildingGlyph: "🌍",
    buildingRoof: "bg-emerald-400",
    buildingBody: "bg-emerald-600",
    source: "research: WWF Earth Hour 2026",
    notes:
      "Price-guess: koľko kWh sa v PL ušetrí za jednu hodinu, koľko domácností to je, koľko to stojí na fakturu.",
  },
  {
    theme: "Pay-day Friday — 50/30/20",
    buildingName: "Payday Post",
    buildingGlyph: "💶",
    buildingRoof: "bg-[var(--neo-yellow)]",
    buildingBody: "bg-amber-500",
    source: "research: PKO Junior / Konto dla Młodych positioning",
    notes:
      "Price-guess: rozdeľ mzdu 4500 zł podľa pravidla 50/30/20, trafi sa kategória ±3 %.",
  },
  {
    theme: "BLIK minutovka",
    buildingName: "BLIK Kiosk",
    buildingGlyph: "⚡",
    buildingRoof: "bg-[var(--neo-cyan)]",
    buildingBody: "bg-sky-500",
    source: "research: PKO IKO + PolskiStandardPłatności",
    notes:
      "Scramble: 6 slov okolo BLIK-u (KOD, PRZELEW, KONTAKTOWE, ATM…) + kvíz o tom, ako BLIK funguje za kulisami.",
  },
];

// Deterministic pick: same UTC-day bucket → same theme, so Vercel Cron
// retries within the same day don't mint a new game.
export function pickResearchSeed(nowMs: number): ResearchSeed {
  const dayBucket = Math.floor(nowMs / (24 * 60 * 60 * 1000));
  return ROTATION_POOL[dayBucket % ROTATION_POOL.length];
}
