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
      {/* Drop shadow used by `<BuildingTile>` on both surfaces. Lives
       *  here rather than in city-skyline-hero so the /miasto manager
       *  (which doesn't import the hero) gets the same shadow id. */}
      <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="3"
          floodColor="#000000"
          floodOpacity="0.18"
        />
      </filter>
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

      {/* Katowice skyline silhouette — recognisable landmarks at
          continuous horizon, capped to ~100 px so the foreground
          buildings (60–180 px tall) sit clearly in front. Anchored
          to the warm horizon band; opacity 0.7 navy reads as
          backlit city against the sunset.
          Left → right roughly maps to:
            • industrial / coal-mine (far left)
            • residential rooftops (low)
            • church tower
            • Spodek arena (iconic)
            • cathedral dome
            • Altus / Pałac Goldsteinów / KTW skyscrapers
            • winding tower (kopalnia)
            • cooling tower + power-plant chimney (far right) */}
      <g opacity="0.7" fill="#0d2747">
        {/* Industrial complex + smokestack (far left) */}
        <rect x={20} y={G - 55} width={60} height={55} />
        <rect x={48} y={G - 95} width={8} height={40} />
        <rect x={85} y={G - 40} width={35} height={40} />
        {/* Low residential rooftops */}
        <rect x={130} y={G - 48} width={28} height={48} />
        <polygon points={`130,${G - 48} 144,${G - 60} 158,${G - 48}`} />
        <rect x={165} y={G - 42} width={26} height={42} />
        <rect x={196} y={G - 50} width={32} height={50} />
        <polygon points={`196,${G - 50} 212,${G - 64} 228,${G - 50}`} />
        {/* Church tower */}
        <rect x={245} y={G - 90} width={18} height={90} />
        <polygon points={`245,${G - 90} 254,${G - 105} 263,${G - 90}`} />
        <rect x={270} y={G - 50} width={42} height={50} />
        {/* Mid neighborhood blocks */}
        <rect x={320} y={G - 55} width={36} height={55} />
        <rect x={362} y={G - 45} width={32} height={45} />
        <rect x={400} y={G - 60} width={40} height={60} />
        <rect x={446} y={G - 48} width={30} height={48} />
        {/* Spodek arena — iconic UFO disc */}
        <ellipse cx={555} cy={G - 38} rx={68} ry={10} />
        <ellipse cx={555} cy={G - 56} rx={55} ry={26} />
        <rect x={543} y={G - 38} width={24} height={38} />
        {/* Cathedral — Katedra Chrystusa Króla, large dome */}
        <rect x={640} y={G - 70} width={60} height={70} />
        <ellipse cx={670} cy={G - 70} rx={32} ry={20} />
        <rect x={665} y={G - 100} width={10} height={30} />
        <polygon points={`665,${G - 100} 670,${G - 108} 675,${G - 100}`} />
        {/* Skyscraper cluster — Altus / Pałac Goldsteinów / KTW */}
        <rect x={730} y={G - 88} width={26} height={88} />
        <rect x={760} y={G - 102} width={32} height={102} />
        <polygon points={`760,${G - 102} 776,${G - 112} 792,${G - 102}`} />
        <rect x={798} y={G - 95} width={22} height={95} />
        <rect x={825} y={G - 80} width={28} height={80} />
        {/* Smaller mid-band blocks */}
        <rect x={860} y={G - 50} width={36} height={50} />
        <rect x={900} y={G - 58} width={30} height={58} />
        <rect x={935} y={G - 45} width={28} height={45} />
        <rect x={968} y={G - 65} width={34} height={65} />
        {/* Winding tower (kopalnia) — distinctive A-frame */}
        <rect x={1010} y={G - 92} width={6} height={92} />
        <rect x={1040} y={G - 92} width={6} height={92} />
        <line x1={1010} y1={G - 92} x2={1046} y2={G - 65} stroke="#0d2747" strokeWidth={3} />
        <line x1={1046} y1={G - 92} x2={1010} y2={G - 65} stroke="#0d2747" strokeWidth={3} />
        <circle cx={1028} cy={G - 78} r={6} fill="#0d2747" />
        <rect x={1050} y={G - 50} width={30} height={50} />
        {/* More residential / mid */}
        <rect x={1085} y={G - 56} width={32} height={56} />
        <rect x={1120} y={G - 42} width={28} height={42} />
        <rect x={1152} y={G - 60} width={30} height={60} />
        <polygon points={`1152,${G - 60} 1167,${G - 70} 1182,${G - 60}`} />
        <rect x={1188} y={G - 48} width={26} height={48} />
        <rect x={1218} y={G - 55} width={32} height={55} />
        {/* Office mid-rise */}
        <rect x={1255} y={G - 75} width={36} height={75} />
        <rect x={1295} y={G - 60} width={28} height={60} />
        <rect x={1326} y={G - 50} width={30} height={50} />
        {/* Industrial east — boiler + lower factory */}
        <rect x={1360} y={G - 45} width={45} height={45} />
        <rect x={1410} y={G - 70} width={28} height={70} />
        <rect x={1442} y={G - 50} width={32} height={50} />
        <rect x={1478} y={G - 58} width={26} height={58} />
        {/* Cooling tower (Elektrownia) — distinctive hyperboloid hint */}
        <polygon
          points={`1515,${G} 1505,${G - 70} 1510,${G - 95} 1545,${G - 95} 1550,${G - 70} 1540,${G}`}
        />
        {/* Power plant — chimney pair + boiler hall */}
        <rect x={1570} y={G - 50} width={40} height={50} />
        <rect x={1620} y={G - 110} width={14} height={110} />
        <rect x={1612} y={G - 116} width={30} height={8} />
        <rect x={1655} y={G - 130} width={14} height={130} />
        <rect x={1647} y={G - 138} width={30} height={8} />
        {/* Far-right buffer rooftops */}
        <rect x={1690} y={G - 40} width={30} height={40} />
        <rect x={1725} y={G - 48} width={28} height={48} />
        <polygon points={`1725,${G - 48} 1739,${G - 58} 1753,${G - 48}`} />
        <rect x={1760} y={G - 35} width={26} height={35} />
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
