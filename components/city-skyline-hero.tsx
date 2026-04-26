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

const VB_W = 1800;
const VB_H = 390;
const GROUND_Y = 330;

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

// 6 lampposts — evenly spaced across the canvas. Index → x in
// viewBox units. Used together with the lit-on-play mechanic below.
const LAMP_X = [150, 450, 750, 1050, 1350, 1650] as const;

export function CitySkylineHero({ buildings, lang, emptyStateCta }: Props) {
  const occupied = new Map(buildings.map((b) => [b.slotId, b]));
  const copy = EMPTY_COPY[lang];
  const buildLabel = BUILD_LABEL[lang];

  // Lit-on-play: split the canvas into 6 vertical slices, each tied
  // to one lamppost. A lamp lights up when AT LEAST one slot inside
  // its slice is occupied. Computed once per render — cheap (linear
  // scan over <20 slots) and deterministic for the SSR snapshot.
  const sliceWidth = VB_W / 6;
  const sliceHasBuilding = LAMP_X.map((_, i) => {
    const lo = i * sliceWidth;
    const hi = (i + 1) * sliceWidth;
    return SLOT_MAP.some((slot) => {
      const cx = slot.x + slot.w / 2;
      return cx >= lo && cx < hi && occupied.has(slot.id);
    });
  });

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
          {/* Sunset 4-stop sky: deep navy at the top, twilight purple,
              warm peach band, hot orange at the horizon — this is the
              palette the chip copy promises. */}
          <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0d2747" />
            <stop offset="40%" stopColor="#5b3a76" />
            <stop offset="78%" stopColor="#f4a259" />
            <stop offset="100%" stopColor="#fde2c4" />
          </linearGradient>
          {/* Half-set sun gradient — warm core fading into transparent
              so the upper half blends into the sky band cleanly. */}
          <radialGradient id="hero-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde2c4" />
            <stop offset="60%" stopColor="#db912c" />
            <stop offset="100%" stopColor="#db912c" stopOpacity="0" />
          </radialGradient>
          {/* Lamp halo — used by the lit-on-play state. */}
          <radialGradient id="hero-lamp-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde2c4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fde2c4" stopOpacity="0" />
          </radialGradient>
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

        {/* ─── Layer 1: Sky ─── */}
        <rect width={VB_W} height={GROUND_Y} fill="url(#hero-sky)" />

        {/* Faint stars — only in the upper third where the sky is dark
            enough for them to register. Hand-picked positions so the
            SSR snapshot is stable. */}
        <g fill="#ffffff" opacity="0.7">
          <circle cx={120} cy={40} r={1.4} />
          <circle cx={310} cy={70} r={1} />
          <circle cx={680} cy={28} r={1.6} />
          <circle cx={920} cy={52} r={1.2} />
          <circle cx={1240} cy={36} r={1.3} />
          <circle cx={1480} cy={64} r={1} />
          <circle cx={1720} cy={42} r={1.4} />
        </g>

        {/* Moon — top-left crescent. Two overlapping discs, the inner
            one tinted to the dark sky stop, fakes the crescent without
            a path. Soft halo via an outer 0.15 ring. */}
        <g aria-hidden>
          <circle cx={180} cy={90} r={42} fill="#ffffff" opacity="0.08" />
          <circle cx={180} cy={90} r={26} fill="#f8fafc" />
          <circle cx={194} cy={84} r={22} fill="#0d2747" />
        </g>

        {/* Sun — half disc behind horizon (right side). Center sits
            ON the horizon line so only the upper semicircle is
            visible against the orange band. */}
        <circle cx={VB_W - 280} cy={GROUND_Y} r={75} fill="url(#hero-sun)" />

        {/* Beskydy mountain silhouette — single rolling polygon,
            slightly more navy than the daylight version so it reads
            against the warm horizon. */}
        <polygon
          points={`0,${GROUND_Y - 50} 200,${GROUND_Y - 110} 460,${GROUND_Y - 70} 720,${GROUND_Y - 140} 980,${GROUND_Y - 90} 1240,${GROUND_Y - 155} 1520,${GROUND_Y - 80} 1800,${GROUND_Y - 125} 1800,${GROUND_Y} 0,${GROUND_Y}`}
          fill="#0d2747"
          opacity="0.55"
        />

        {/* ─── Layer 2: Katowice skyline backdrop ───
            Spodek (UFO arena) + two panel blocks + chimney, deeper
            navy now (silhouette against sunset). */}
        <g opacity="0.78" fill="#0d2747">
          <ellipse cx={600} cy={GROUND_Y - 50} rx={140} ry={16} />
          <ellipse cx={600} cy={GROUND_Y - 78} rx={110} ry={42} />
          <rect x={580} y={GROUND_Y - 50} width={40} height={50} />
          <rect x={1000} y={GROUND_Y - 200} width={70} height={200} />
          <rect x={1080} y={GROUND_Y - 165} width={60} height={165} />
          <rect x={1700} y={GROUND_Y - 235} width={20} height={235} />
          <rect x={1690} y={GROUND_Y - 243} width={40} height={10} />
        </g>

        {/* ─── Layer 3: Ground zones ─── */}
        <rect y={GROUND_Y} width={VB_W} height={4} fill="#2e7d49" opacity="0.25" />
        <rect y={GROUND_Y + 4} width={VB_W} height={12} fill="#3a3a3a" opacity="0.45" />
        <rect y={GROUND_Y + 16} width={VB_W} height={VB_H - GROUND_Y - 16} fill="#fef3e2" />

        {/* Lampposts — 6 across; lit when the matching canvas slice
            owns at least one occupied slot. Lit lamps render a soft
            halo + warm bulb; unlit lamps render a faded grey bulb. */}
        {LAMP_X.map((x, i) => {
          const lit = sliceHasBuilding[i];
          return (
            <g key={`lamp-${x}`} aria-hidden>
              <line
                x1={x}
                y1={GROUND_Y - 40}
                x2={x}
                y2={GROUND_Y}
                stroke="#0d2747"
                strokeOpacity={lit ? 0.85 : 0.55}
                strokeWidth="1.5"
              />
              {lit && (
                <circle
                  cx={x}
                  cy={GROUND_Y - 42}
                  r={22}
                  fill="url(#hero-lamp-halo)"
                />
              )}
              <circle
                cx={x}
                cy={GROUND_Y - 42}
                r={lit ? 4 : 3}
                fill={lit ? "#fde2c4" : "#9ca3af"}
                stroke={lit ? "#db912c" : "#6b7280"}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* ─── Layer 4: Foreground buildings + empty slots ─── */}
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
