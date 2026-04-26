/* GameHero — shared per-game header primitive.
 *
 * G-08. Per-game pages (finance-quiz, energy-dash, …, 9 evergreen
 * + 12 AI clients) each had their own bespoke header — emoji size,
 * back link styling, body paragraph length all drifted. New players
 * lacked a consistent "what am I playing for?" surface: rules,
 * duration, max Watts, age band weren't surfaced together.
 *
 * GameHero is a thin card with:
 *   - emoji + localized title (`localizedTitle(game, dict)` already
 *     handles the per-locale lookup with PL fallback)
 *   - localized description (game.description is PL canonical;
 *     `lang="pl"` attribute flags it for screen readers + browser
 *     auto-translate when the active locale isn't pl)
 *   - 3 chips: duration ⏱, XP cap ⚡, age hint (if set)
 *
 * Pages keep their own back link + demo banner outside this card.
 * Render between back link and the game client.
 */

import type { GameMeta } from "@/lib/games";
import type { Dict, Lang } from "@/lib/i18n";
import { localizedTitle } from "@/lib/games";

type Props = {
  game: GameMeta;
  lang: Lang;
  dict: Dict;
};

export function GameHero({ game, lang, dict }: Props) {
  const title = localizedTitle(game, dict);
  // "Up to N W" caption per locale. Embedded inline rather than as
  // a dict key because it's only used here and the variants are
  // single-token (Až / Do / До / Up to).
  const upToLabel: Record<Lang, string> = {
    pl: "Do",
    uk: "До",
    cs: "Až",
    en: "Up to",
  };
  return (
    <section className="card p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl sm:text-4xl" aria-hidden>
          {game.emoji}
        </span>
        <h1 className="t-h2 text-[var(--accent)]">{title}</h1>
      </div>
      <p className="text-[var(--ink-muted)]" lang="pl">
        {game.description}
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="chip">⏱ {game.durationLabel}</span>
        <span className="chip">
          ⚡ {upToLabel[lang]} {game.xpCap} W
        </span>
        {game.ageHint && <span className="chip">{game.ageHint}</span>}
      </div>
    </section>
  );
}
