/* V3.1 → E-01 (PR-L) — City Skyline Hero, sunset twilight rewrite.
 *
 * Pass-7 R-05 shipped a full daylight scene; the dashboard chip on
 * /games still says "🌅 Zachód / Sunset / Захід / Soumrak" though,
 * so the hero canvas now matches the chip — early evening, sun
 * behind the horizon, moon already up, lampposts beginning to light.
 *
 * Spec (per user E-01 brief):
 *   - viewBox 1800×390 (tighter — old 460 left dead air below)
 *   - sun half-set behind the horizon (right-bias, warm)
 *   - moon top-left (small faded crescent — first hour after sunset)
 *   - Spodek silhouette + skyline backdrop kept (PKO partnership cue)
 *   - 6 lampposts evenly spaced (was 3), each with the
 *     "lit-on-play" mechanic: a lamppost glows warm-orange when ≥1
 *     building exists in its 1/6 slice of the canvas — visual proof
 *     of player progress at a glance, no extra UI required
 *   - Buildings keep level-scaled silhouettes; windows light up
 *     yellow only when the building exists (level ≥ 1) — empty
 *     slots show only the "+" placeholder, never lit windows
 *
 * Container background is overridden via `.city-skyline-hero-root`
 * scoped CSS (globals.css §R-11) so the city-scene mass retints +
 * saturate filter cannot reach the hero's twilight palette.
 */

import type { PlayerState } from "@/lib/player";
import type { Lang } from "@/lib/i18n";
import {
  SLOT_MAP,
  getCatalogEntry,
  type SlotDef,
} from "@/lib/building-catalog";
import {
  HeroBackdrop,
  HeroBackdropDefs,
  computeLampLitMask,
} from "@/components/hero-backdrop";

// E-01 follow-up — slot baseline in `lib/building-catalog.ts` is
// `y + h = 400` for every slot, so GROUND_Y MUST equal 400 or the
// buildings (and their L-level badges, which sit just above the
// ground line) clip into the sidewalk band and become invisible.
// Sky takes 400 px, ground band 30 px → total 430 px (down from
// the R-05 original 460, so the hero is still tighter than before
// but no longer chopping the level chips).
const VB_W = 1800;
const VB_H = 430;
const GROUND_Y = 400;

type Props = {
  buildings: PlayerState["buildings"];
  lang: Lang;
  /** Optional CTA label shown when the city is empty. Falls back to default dict. */
  emptyStateCta?: string;
};

const EMPTY_COPY: Record<Lang, { empty: string; emptyCta: string }> = {
  pl: {
    empty: "Twoje miasto czeka na pierwszy budynek",
    emptyCta: "Graj pierwszą grę, żeby odblokować Sklepik",
  },
  uk: {
    empty: "Місто чекає на першу будівлю",
    emptyCta: "Зіграй першу гру, щоб відкрити магазинчик",
  },
  cs: {
    empty: "Tvé město čeká na první budovu",
    emptyCta: "Zahraj první hru, abys odemkl obchůdek",
  },
  en: {
    empty: "Your city awaits its first building",
    emptyCta: "Play your first game to unlock a shop",
  },
};

const BUILD_LABEL: Record<Lang, string> = {
  pl: "Postaw",
  uk: "Збудуй",
  cs: "Postav",
  en: "Build",
};

export function CitySkylineHero({ buildings, lang, emptyStateCta }: Props) {
  const occupied = new Map(buildings.map((b) => [b.slotId, b]));
  const copy = EMPTY_COPY[lang];
  const buildLabel = BUILD_LABEL[lang];
  // Shared lit-on-play mask — same logic + same lamppost positions
  // as the /miasto manager so both surfaces light up identically as
  // the player builds.
  const lampLitMask = computeLampLitMask(buildings);

  return (
    <section
      // R-11 — dedicated `city-skyline-hero-root` opts out of the
      // city-scene retint chain (see globals.css). The hero owns its
      // sunset palette and must not be touched by the
      // `.city-scene-root` saturate(.35) brightness(1.55) filter.
      className="city-skyline-hero-root card relative overflow-hidden"
      aria-labelledby="skyline-heading"
    >
      <h2 id="skyline-heading" className="sr-only">
        {copy.empty}
      </h2>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto block"
        role="img"
        aria-label={
          buildings.length === 0
            ? copy.empty
            : `${buildings.length} budynków w mieście`
        }
      >
        <defs>
          <HeroBackdropDefs />
          <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#000000"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        {/* Shared sunset backdrop (sky/stars/moon/sun/mountains/Spodek/
            ground/lampposts). Same render path on /miasto. */}
        <HeroBackdrop lampLitMask={lampLitMask} vbH={VB_H} />

        {/* ─── Foreground buildings + empty slots ─── */}
        {SLOT_MAP.map((slot) => {
          const inst = occupied.get(slot.id);
          if (!inst) return <EmptySlot key={slot.id} slot={slot} buildLabel={buildLabel} />;
          const entry = getCatalogEntry(inst.catalogId);
          if (!entry) return <EmptySlot key={slot.id} slot={slot} buildLabel={buildLabel} />;
          return (
            <BuildingSilhouette
              key={slot.id}
              slot={slot}
              level={inst.level}
              glyph={entry.glyph}
              roof={entry.roofColor}
              body={entry.bodyColor}
              label={entry.labels[lang] ?? entry.labels.pl}
            />
          );
        })}
      </svg>
      {buildings.length === 0 && (
        <div className="city-skyline-empty-overlay absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-md flex flex-col gap-2">
            <p className="text-base sm:text-lg font-semibold tracking-tight">
              {copy.empty}
            </p>
            <p className="text-xs sm:text-sm opacity-80">
              {emptyStateCta ?? copy.emptyCta}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptySlot({
  slot,
  buildLabel,
}: {
  slot: SlotDef;
  buildLabel: string;
}) {
  const cx = slot.x + slot.w / 2;
  const top = slot.y + slot.h * 0.55;
  const h = slot.h * 0.45;
  return (
    <g aria-hidden>
      <rect
        x={slot.x + 4}
        y={top}
        width={slot.w - 8}
        height={h}
        fill="#ffffff"
        fillOpacity="0.55"
        stroke="#e5e5e5"
        strokeWidth="1"
        rx="4"
      />
      <text
        x={cx}
        y={top + h / 2 - 4}
        textAnchor="middle"
        fontSize={Math.min(28, slot.w * 0.4)}
        fill="#003574"
        opacity="0.55"
      >
        +
      </text>
      <text
        x={cx}
        y={top + h - 6}
        textAnchor="middle"
        fontSize="9"
        fill="#636363"
      >
        {buildLabel}
      </text>
    </g>
  );
}

function BuildingSilhouette({
  slot,
  level,
  glyph,
  roof,
  body,
  label,
}: {
  slot: SlotDef;
  level: number;
  glyph: string;
  roof: string;
  body: string;
  label: string;
}) {
  const levelScale = Math.min(1, 0.7 + level * 0.05);
  const h = slot.h * levelScale;
  const y = slot.y + slot.h - h;
  const roofH = h * 0.2;
  const bodyH = h - roofH;
  const winSize = Math.min(8, slot.w * 0.12);
  const winY = y + roofH + bodyH * 0.25 - winSize / 2;
  const winLeft = slot.x + slot.w * 0.28 - winSize / 2;
  const winRight = slot.x + slot.w * 0.72 - winSize / 2;
  return (
    <g aria-label={`${label} L${level}`} filter="url(#hero-shadow)">
      <rect x={slot.x} y={y + roofH} width={slot.w} height={bodyH} fill={body} />
      <polygon
        points={`${slot.x},${y + roofH} ${slot.x + slot.w / 2},${y} ${slot.x + slot.w},${y + roofH}`}
        fill={roof}
      />
      {/* Windows are lit only when the building exists — ties into
          the lit-on-play mechanic so empty slots stay dark. */}
      <rect x={winLeft} y={winY} width={winSize} height={winSize} fill="#fde2c4" />
      <rect x={winRight} y={winY} width={winSize} height={winSize} fill="#fde2c4" />
      <rect
        x={slot.x + slot.w / 2 - winSize / 2}
        y={y + roofH + bodyH - winSize * 1.3}
        width={winSize}
        height={winSize * 1.3}
        fill={roof}
        opacity="0.7"
      />
      <text
        x={slot.x + slot.w / 2}
        y={y + roofH + bodyH * 0.6}
        textAnchor="middle"
        fontSize={Math.min(36, slot.w * 0.45)}
        fill="white"
        opacity="0.85"
      >
        {glyph}
      </text>
      {/* L badge — chip with white pill behind so it stays
          readable against any building body colour. The /miasto
          manager renders this canvas at ~1200 px wide, so 1
          viewBox unit ≈ 0.67 screen px; font 14 + 26-wide pill =
          ~17 px tall on screen, well above the 9-px tap-text
          legibility floor. */}
      <rect
        x={slot.x + 2}
        y={y + roofH + bodyH - 22}
        width={26}
        height={18}
        rx={3}
        fill="#ffffff"
        opacity="0.92"
      />
      <text
        x={slot.x + 15}
        y={y + roofH + bodyH - 8}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="var(--accent)"
      >
        L{level}
      </text>
    </g>
  );
}
