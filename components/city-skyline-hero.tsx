/* V3.1 — City Skyline Hero (server component).
 *
 * Replaces the V1/V2 `PlayerBuilding` (one growing avatar building) with
 * a live SVG of the player's actual 20-slot city. Occupied slots render
 * a tiny silhouette in the building's catalog colors; empty slots show
 * a placeholder "build here" card.
 *
 * R-05 (PR-J pass-7) — full daylight redesign:
 *   - 3-stop sky gradient (sunrise navy haze → warm haze → cream)
 *   - Soft sun + clouds + Beskydy mountain silhouette (atmosphere)
 *   - Katowice skyline backdrop (Spodek + 2 panels + chimney) — the
 *     "PKO partnership signal" — recognisable city profile at 12%
 *     navy opacity, sits behind the foreground buildings
 *   - 3-zone ground (grass / road / sidewalk) replaces the old
 *     tiled-pattern ground
 *   - Decorative lampposts + trees in slot gaps
 *   - Building scale bumped (0.7 + 0.05 × L) so L1 is actually
 *     visible — the prior 0.55 + 0.045 base made fresh houses
 *     disappear into the surface
 *   - Soft drop shadow under each building (defs <filter>)
 *   - Empty slots redesigned from dotted ghost to a + card with
 *     a localised "build here" label — clear affordance instead of
 *     a near-invisible dashed outline
 *
 * Rendering model still matches the existing city scene (1800×460
 * viewBox, ground at y≈400). Container background lives in CSS via
 * `.city-scene-root` so the dark night sky is core-skin only.
 */

import type { PlayerState } from "@/lib/player";
import type { Lang } from "@/lib/i18n";
import {
  SLOT_MAP,
  getCatalogEntry,
  type SlotDef,
} from "@/lib/building-catalog";

const VB_W = 1800;
const VB_H = 460;
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

  // Pre-compute decorator positions (lamps + trees) once so the SVG
  // stays declarative. Anchored to ground line at GROUND_Y. We pick
  // x-coords in the gaps between major slot clusters.
  const lampX = [220, 760, 1320];
  const treeX = [120, 560, 1080, 1640];

  return (
    <section
      // R-11 — class swapped from `city-scene-root` to dedicated
      // `city-skyline-hero-root`. The hero canvas owns its palette
      // (the new R-05 daylight surface + the refreshed catalog
      // colours), so the city-scene attribute-selector retints +
      // saturate(.35) brightness(1.55) filter no longer apply. The
      // prior shared class washed cream/ivory building bodies into
      // invisibility because brightness(1.55) on near-white pushed
      // them past pure white. The hero gets its own scoped CSS in
      // globals.css (sky bg + 1 px navy outline on bodies for
      // readability against the light sky).
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
          {/* R-05 — daylight 3-stop sky. Haze top → warm mid → cream
              near horizon (matches PKO orange family). */}
          <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e8f1fb" />
            <stop offset="55%" stopColor="#f5f8fc" />
            <stop offset="100%" stopColor="#fef3e2" />
          </linearGradient>
          {/* Soft drop shadow under each foreground building. Tight
              radius so it stays an accent, not a halo. */}
          <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#000000"
              floodOpacity="0.12"
            />
          </filter>
        </defs>

        {/* ─── Layer 1: Sky + atmosphere ─── */}
        <rect width={VB_W} height={GROUND_Y} fill="url(#hero-sky)" />

        {/* Sun — top-right, soft warm orange disc, no rays */}
        <circle cx={VB_W - 220} cy={120} r={60} fill="#db912c" opacity="0.18" />

        {/* Clouds — three soft ellipses at varied positions */}
        <ellipse cx={420} cy={90} rx={90} ry={18} fill="#ffffff" opacity="0.7" />
        <ellipse cx={460} cy={102} rx={70} ry={14} fill="#ffffff" opacity="0.55" />
        <ellipse cx={1080} cy={140} rx={110} ry={20} fill="#ffffff" opacity="0.6" />
        <ellipse cx={1500} cy={70} rx={80} ry={16} fill="#ffffff" opacity="0.5" />

        {/* Beskydy mountain silhouette — single rolling polygon at 8%
            navy opacity, anchors the depth between sky and skyline. */}
        <polygon
          points={`0,${GROUND_Y - 70} 200,${GROUND_Y - 130} 460,${GROUND_Y - 90} 720,${GROUND_Y - 160} 980,${GROUND_Y - 110} 1240,${GROUND_Y - 175} 1520,${GROUND_Y - 100} 1800,${GROUND_Y - 145} 1800,${GROUND_Y} 0,${GROUND_Y}`}
          fill="#003574"
          opacity="0.08"
        />

        {/* ─── Layer 2: Katowice skyline backdrop ───
            Spodek (UFO arena) + two panel blocks + chimney, all 12%
            navy. The recognisable Katowice profile is the PKO
            partnership signal. */}
        <g opacity="0.12" fill="#003574">
          {/* Spodek arena — flat disc base + dome (centered at 600, ground = 400) */}
          <ellipse cx={600} cy={GROUND_Y - 60} rx={140} ry={18} />
          <ellipse cx={600} cy={GROUND_Y - 90} rx={110} ry={50} />
          <rect x={580} y={GROUND_Y - 60} width={40} height={60} />

          {/* Two panel blocks (Drapacze chmur) */}
          <rect x={1000} y={GROUND_Y - 220} width={70} height={220} />
          <rect x={1080} y={GROUND_Y - 180} width={60} height={180} />

          {/* Chimney — power plant marker far right */}
          <rect x={1700} y={GROUND_Y - 260} width={20} height={260} />
          <rect x={1690} y={GROUND_Y - 268} width={40} height={10} />
        </g>

        {/* ─── Layer 4 (drawn early so foreground covers): Ground zones ───
            Grass strip → road → sidewalk. Replaces the prior tiled
            pattern that read as wallpaper. */}
        <rect y={GROUND_Y} width={VB_W} height={4} fill="#2e7d49" opacity="0.15" />
        <rect y={GROUND_Y + 4} width={VB_W} height={14} fill="#636363" opacity="0.1" />
        <rect y={GROUND_Y + 18} width={VB_W} height={VB_H - GROUND_Y - 18} fill="#f9f9f9" />

        {/* Trees — small dark-green ovals on a thin stick, in gaps */}
        {treeX.map((x) => (
          <g key={`tree-${x}`} aria-hidden>
            <rect x={x - 1.5} y={GROUND_Y - 18} width={3} height={20} fill="#854d0e" />
            <ellipse cx={x} cy={GROUND_Y - 24} rx={14} ry={18} fill="#2e7d49" opacity="0.6" />
          </g>
        ))}

        {/* Lampposts — single vertical line + small circle bulb on top */}
        {lampX.map((x) => (
          <g key={`lamp-${x}`} aria-hidden>
            <line
              x1={x}
              y1={GROUND_Y - 36}
              x2={x}
              y2={GROUND_Y}
              stroke="#003574"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />
            <circle cx={x} cy={GROUND_Y - 38} r={3} fill="#db912c" />
          </g>
        ))}

        {/* ─── Layer 3: Foreground buildings + empty slots ─── */}
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
  // R-05 — placeholder card replaces the dashed ghost. Solid 1 px
  // line border + faint surface fill + centered + glyph + label.
  // Reads as "tu sa dá postaviť", not "broken outline".
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
  // R-05 — bumped scale base + per-level step so L1 is visible.
  // 0.55 + 0.045 → 0.7 + 0.05; clamps at 1.0 (max level still fills).
  const levelScale = Math.min(1, 0.7 + level * 0.05);
  const h = slot.h * levelScale;
  const y = slot.y + slot.h - h;
  const roofH = h * 0.2;
  const bodyH = h - roofH;
  // Two small lit windows on the body (R-05). Position them in the
  // upper third of the body, equally spaced.
  const winSize = Math.min(8, slot.w * 0.12);
  const winY = y + roofH + bodyH * 0.25 - winSize / 2;
  const winLeft = slot.x + slot.w * 0.28 - winSize / 2;
  const winRight = slot.x + slot.w * 0.72 - winSize / 2;
  return (
    <g aria-label={`${label} L${level}`} filter="url(#hero-shadow)">
      {/* Body */}
      <rect x={slot.x} y={y + roofH} width={slot.w} height={bodyH} fill={body} />
      {/* Roof */}
      <polygon
        points={`${slot.x},${y + roofH} ${slot.x + slot.w / 2},${y} ${slot.x + slot.w},${y + roofH}`}
        fill={roof}
      />
      {/* Lit windows */}
      <rect x={winLeft} y={winY} width={winSize} height={winSize} fill="#f9d97a" />
      <rect x={winRight} y={winY} width={winSize} height={winSize} fill="#f9d97a" />
      {/* Door — small dark rectangle bottom-center */}
      <rect
        x={slot.x + slot.w / 2 - winSize / 2}
        y={y + roofH + bodyH - winSize * 1.3}
        width={winSize}
        height={winSize * 1.3}
        fill={roof}
        opacity="0.7"
      />
      {/* Glyph centered horizontally, 60% down the body */}
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
      {/* L badge bottom-left */}
      <text
        x={slot.x + 4}
        y={y + roofH + bodyH - 4}
        fontSize="14"
        fontWeight="600"
        fill="var(--ink)"
        style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 2 }}
      >
        L{level}
      </text>
    </g>
  );
}
