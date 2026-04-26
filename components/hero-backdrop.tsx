/* HeroBackdrop — shared sunset twilight scene used by both
 * `CitySkylineHero` (read-only homepage hero) and `WattCityClient`
 * (interactive /miasto manager).
 *
 * Before this extraction, /miasto rendered a bare two-stop sky
 * gradient + a single ground line, so the homepage hero (sun, moon,
 * Spodek, mountains, lampposts, lit-on-play) and the city manager
 * looked like two different products. Same data + same place + two
 * different visuals = WTF moment for the player.
 *
 * Caller responsibilities:
 *   - own the outer `<svg>` + `viewBox` (this returns SVG `<g>`s)
 *   - render the foreground layer ON TOP (interactive slots, building
 *     silhouettes, etc.) — backdrop draws everything BELOW the
 *     ground-line decorations only
 *   - pass `lampLitMask` (length 6) computed from buildings; helper
 *     `computeLampLitMask` does the slice-bucket math both callers
 *     need
 *
 * Coordinates assume VB_W=1800 + GROUND_Y=400. Both consumers are
 * already pinned to this — slot baseline in `lib/building-catalog.ts`
 * is `y + h = 400` so changing it would require migrating SLOT_MAP.
 */

import { SLOT_MAP } from "@/lib/building-catalog";

export const BACKDROP_VB_W = 1800;
export const BACKDROP_GROUND_Y = 400;

const LAMP_X = [150, 450, 750, 1050, 1350, 1650] as const;

/** Slice the canvas into 6 vertical strips and report which ones
 *  contain at least one occupied slot. The result drives the
 *  lit-on-play lamppost mechanic — gives an at-a-glance read of
 *  player progress without any extra UI.
 *
 *  Accepts anything with `slotId` so /miasto can pass its own slot
 *  view shape without coercing into full BuildingInstance objects. */
export function computeLampLitMask(
  buildings: ReadonlyArray<{ slotId: number }>,
): boolean[] {
  const occupied = new Set(buildings.map((b) => b.slotId));
  const sliceWidth = BACKDROP_VB_W / LAMP_X.length;
  return LAMP_X.map((_, i) => {
    const lo = i * sliceWidth;
    const hi = (i + 1) * sliceWidth;
    return SLOT_MAP.some((slot) => {
      const cx = slot.x + slot.w / 2;
      return cx >= lo && cx < hi && occupied.has(slot.id);
    });
  });
}

/** Returns SVG `<defs>` for the backdrop — caller must inline this
 *  inside its own `<defs>` so the gradient/filter ids are scoped to
 *  the same SVG tree. */
export function HeroBackdropDefs() {
  return (
    <>
      <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#0d2747" />
        <stop offset="40%" stopColor="#5b3a76" />
        <stop offset="78%" stopColor="#f4a259" />
        <stop offset="100%" stopColor="#fde2c4" />
      </linearGradient>
      <radialGradient id="hero-sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fde2c4" />
        <stop offset="60%" stopColor="#db912c" />
        <stop offset="100%" stopColor="#db912c" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hero-lamp-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fde2c4" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#fde2c4" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/** Atmospheric layers (sky + stars + moon + sun + mountains +
 *  Spodek silhouette + ground zones + lampposts). Goes BEFORE
 *  any foreground building/slot layer in the SVG. */
export function HeroBackdrop({
  lampLitMask,
  vbH = 430,
}: {
  lampLitMask: boolean[];
  /** The caller's viewBox height. Sky fills 0..GROUND_Y; ground band
   *  fills GROUND_Y..vbH. Defaults to 430 (CitySkylineHero); /miasto
   *  uses 460 for slightly more ground breathing room below. */
  vbH?: number;
}) {
  const G = BACKDROP_GROUND_Y;
  const W = BACKDROP_VB_W;
  return (
    <g aria-hidden>
      {/* Sky */}
      <rect width={W} height={G} fill="url(#hero-sky)" />

      {/* Faint stars (deterministic) */}
      <g fill="#ffffff" opacity="0.7">
        <circle cx={120} cy={40} r={1.4} />
        <circle cx={310} cy={70} r={1} />
        <circle cx={680} cy={28} r={1.6} />
        <circle cx={920} cy={52} r={1.2} />
        <circle cx={1240} cy={36} r={1.3} />
        <circle cx={1480} cy={64} r={1} />
        <circle cx={1720} cy={42} r={1.4} />
      </g>

      {/* Moon top-left — two overlapping discs fake the crescent. */}
      <circle cx={180} cy={90} r={42} fill="#ffffff" opacity="0.08" />
      <circle cx={180} cy={90} r={26} fill="#f8fafc" />
      <circle cx={194} cy={84} r={22} fill="#0d2747" />

      {/* Sun half-set behind the horizon (right side). */}
      <circle cx={W - 280} cy={G} r={75} fill="url(#hero-sun)" />

      {/* Beskydy mountain silhouette. */}
      <polygon
        points={`0,${G - 50} 200,${G - 110} 460,${G - 70} 720,${G - 140} 980,${G - 90} 1240,${G - 155} 1520,${G - 80} 1800,${G - 125} 1800,${G} 0,${G}`}
        fill="#0d2747"
        opacity="0.55"
      />

      {/* Katowice skyline backdrop — Spodek arena + 2 panel blocks
          + chimney. Brand cue. */}
      <g opacity="0.78" fill="#0d2747">
        <ellipse cx={600} cy={G - 50} rx={140} ry={16} />
        <ellipse cx={600} cy={G - 78} rx={110} ry={42} />
        <rect x={580} y={G - 50} width={40} height={50} />
        <rect x={1000} y={G - 200} width={70} height={200} />
        <rect x={1080} y={G - 165} width={60} height={165} />
        <rect x={1700} y={G - 235} width={20} height={235} />
        <rect x={1690} y={G - 243} width={40} height={10} />
      </g>

      {/* Ground zones (grass / road / sidewalk) — caller can render
          on top with their own ground-line if needed (the /miasto
          manager keeps a 1 px line for slot-baseline reference). */}
      <rect y={G} width={W} height={4} fill="#2e7d49" opacity="0.25" />
      <rect y={G + 4} width={W} height={12} fill="#3a3a3a" opacity="0.45" />
      <rect y={G + 16} width={W} height={vbH - G - 16} fill="#fef3e2" />

      {/* Lampposts — lit when their slice owns ≥1 occupied slot. */}
      {LAMP_X.map((x, i) => {
        const lit = lampLitMask[i];
        return (
          <g key={`lamp-${x}`}>
            <line
              x1={x}
              y1={G - 40}
              x2={x}
              y2={G}
              stroke="#0d2747"
              strokeOpacity={lit ? 0.85 : 0.55}
              strokeWidth="1.5"
            />
            {lit && (
              <circle
                cx={x}
                cy={G - 42}
                r={22}
                fill="url(#hero-lamp-halo)"
              />
            )}
            <circle
              cx={x}
              cy={G - 42}
              r={lit ? 4 : 3}
              fill={lit ? "#fde2c4" : "#9ca3af"}
              stroke={lit ? "#db912c" : "#6b7280"}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </g>
  );
}
