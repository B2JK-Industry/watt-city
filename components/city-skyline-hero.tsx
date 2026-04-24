/* V3.1 — City Skyline Hero (server component).
 *
 * Replaces the V1/V2 `PlayerBuilding` (one growing avatar building) with
 * a live SVG of the player's actual 20-slot city. Occupied slots render
 * a tiny silhouette in the building's catalog colors; empty slots show
 * a dotted ghost placeholder. The hero serves as a recognisable glance
 * of "this is MY city" on the dashboard.
 *
 * Rendering model matches the existing city scene (1800×460 viewBox,
 * ground at y≈400) but at reduced scale — hero is a compact skyline,
 * not the full interactive canvas.
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

export function CitySkylineHero({ buildings, lang, emptyStateCta }: Props) {
  const occupied = new Map(buildings.map((b) => [b.slotId, b]));
  const copy = EMPTY_COPY[lang];

  return (
    <section
      className="card relative overflow-hidden"
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
        {/* Sky gradient */}
        <defs>
          <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <pattern
            id="hero-ground"
            x="0"
            y="0"
            width="40"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="40" height="20" fill="#1f2937" />
            <line x1="0" y1="0" x2="40" y2="0" stroke="var(--ink)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width={VB_W} height={GROUND_Y} fill="url(#hero-sky)" />
        <rect
          y={GROUND_Y}
          width={VB_W}
          height={VB_H - GROUND_Y}
          fill="url(#hero-ground)"
        />

        {/* Slot silhouettes — occupied first, then empty ghosts on top */}
        {SLOT_MAP.map((slot) => {
          const inst = occupied.get(slot.id);
          if (!inst) return <EmptySlot key={slot.id} slot={slot} />;
          const entry = getCatalogEntry(inst.catalogId);
          if (!entry) return <EmptySlot key={slot.id} slot={slot} />;
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-center px-4">
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

function EmptySlot({ slot }: { slot: SlotDef }) {
  return (
    <rect
      x={slot.x}
      y={slot.y + slot.h * 0.6}
      width={slot.w}
      height={slot.h * 0.4}
      fill="none"
      stroke="#1f2937"
      strokeWidth="2"
      strokeDasharray="6 4"
      rx="4"
    />
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
  const levelScale = Math.min(1, 0.55 + level * 0.045);
  const h = slot.h * levelScale;
  const y = slot.y + slot.h - h;
  const roofH = h * 0.2;
  const bodyH = h - roofH;
  return (
    <g aria-label={`${label} L${level}`}>
      {/* Body */}
      <rect x={slot.x} y={y + roofH} width={slot.w} height={bodyH} fill={body} />
      {/* Roof */}
      <polygon
        points={`${slot.x},${y + roofH} ${slot.x + slot.w / 2},${y} ${slot.x + slot.w},${y + roofH}`}
        fill={roof}
      />
      {/* Glyph centered horizontally, 60% down the body */}
      <text
        x={slot.x + slot.w / 2}
        y={y + roofH + bodyH * 0.6}
        textAnchor="middle"
        fontSize={Math.min(36, slot.w * 0.45)}
        fill="white"
      >
        {glyph}
      </text>
      {/* L badge bottom-left */}
      <text
        x={slot.x + 4}
        y={y + roofH + bodyH - 4}
        fontSize="14"
        fontWeight="900"
        fill="var(--ink)"
        style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 2 }}
      >
        L{level}
      </text>
    </g>
  );
}
