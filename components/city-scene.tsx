import Link from "next/link";
import { type GameMeta } from "@/lib/games";
import { LiveCountdown } from "@/components/live-countdown";
import {
  ALL_SLOTS,
  SLOT_INTERVAL_HOURS,
  resolveSlot,
  type RotationSlot,
} from "@/lib/ai-pipeline/types";

// Slot-label map — "FAST / MEDIUM / SLOW" reads like jargon. The city
// UI uses interval-keyed labels so a user glancing at the banner
// instantly knows the cadence. PL canonical; CityPreview + /games hub
// re-use via the same constants where the UI layer localises. Keeping
// them here keeps the city-scene SVG self-contained.
const SLOT_LABEL: Record<RotationSlot, string> = {
  fast: "1h",
  medium: "6h",
  slow: "12h",
};

// Ground-plaque variant — reads like a proper city sign ("FAST · 1h") so
// the bottom tag below each AI slot tells the user which lane they're
// looking at instead of leaking an opaque envelope id. Kept separate from
// SLOT_LABEL (used in banners) so the two can diverge without a rename.
const SLOT_GROUND_TAG: Record<RotationSlot, string> = {
  fast: "FAST · 1h",
  medium: "MEDIUM · 6h",
  slow: "SLOW · 12h",
};

/** Timestamp of the next aligned rotation-bucket boundary for `slot`.
 *  When a slot sits empty (rotation pipeline hasn't filled it yet), the
 *  construction-site placeholder counts down to this moment so the user
 *  sees a real deadline for "the next fresh AI game" instead of a vague
 *  "soon" label. Matches the bucket math in lib/ai-pipeline/publish.ts
 *  (`Math.floor(now / slotHours*h) * slotHours*h`). */
function nextSlotBoundary(slot: RotationSlot, now: number): number {
  const slotMs = SLOT_INTERVAL_HOURS[slot] * 60 * 60 * 1000;
  return (Math.floor(now / slotMs) + 1) * slotMs;
}

// Night panorama of Katowice — SVG viewBox is `VB_W x VB_H`. Buildings are
// placed on a ground line at `GROUND`. Each game gets a unique silhouette.

// Layout note: 1500 wide held 9 evergreen buildings + 1 AI slot. Widening
// to 1800 makes room for 3 side-by-side AI slots on the right — one per
// active AI game (MAX_ACTIVE_AI_GAMES = 3), so every live AI challenge has
// its own clickable building in the city.
const VB_W = 1800;
const VB_H = 460;
const GROUND = 400;

export type CityGameState = {
  meta: GameMeta;
  plays: number;
  bestScore: number;
};

export type CityAiGame = {
  id: string;
  title: string;
  validUntil: number;
  glyph?: string;
  bestScore?: number; // current user's best on this AI game
  cap?: number;       // XP cap of this game's spec
  /** Which rotation lane this game belongs to. Undefined on legacy
   *  envelopes generated before the 3-slot cutover — those resolve to
   *  "fast" via `resolveSlot`. */
  rotationSlot?: RotationSlot;
};

/** Given the full list of candidate AI games (as passed to CityScene),
 *  return the one that owns `slot` for the given rendering cutoff.
 *  Expired envelopes (validUntil ≤ now) are filtered BEFORE resolving the
 *  slot owner, which is what prevents a stale envelope from rendering
 *  under a LIVE label with a red EXPIRED chip when the upstream consumer
 *  forgot to call `listActiveAiGamesWithLazyRotation`. Exported for
 *  unit-test coverage of the expired-leak regression. */
export function resolveLiveAiGameForSlot(
  activeAi: readonly CityAiGame[],
  slot: RotationSlot,
  now: number,
): CityAiGame | undefined {
  return activeAi.find(
    (g) => g.validUntil > now && resolveSlot(g.rotationSlot) === slot,
  );
}

type Props = {
  games?: CityGameState[];
  loggedIn?: boolean;
  interactive?: boolean; // true for the /games hub, false for previews
  compact?: boolean;     // smaller height
  aiGame?: CityAiGame;   // deprecated: single-AI-game path — pass aiGames instead
  aiGames?: CityAiGame[]; // one entry per active AI game (newest first); up to 3 slots
};

export function CityScene({
  games,
  loggedIn = false,
  interactive = true,
  compact = false,
  aiGame,
  aiGames,
}: Props) {
  const activeAi: CityAiGame[] = aiGames ?? (aiGame ? [aiGame] : []);
  // Shared cutoff so all 3 slots agree on what's expired within a single
  // render — without it a stale envelope could satisfy slot A's resolve
  // but fail slot B's milliseconds later, producing an inconsistent scene.
  const renderNow = Date.now();
  const map = new Map(games?.map((g) => [g.meta.id, g]) ?? []);
  const get = (id: string) => map.get(id);

  return (
    // R-02 — the inline `background: "#07071a"` was the dominant
    // dark-navy block on the surface. Inline styles win over CSS
    // (specificity 1,0,0,0 vs 0,0,2,1), so the pko skin stayed dark
    // even with `saturate(.35) brightness(1.55)` applied on top.
    // Background is now skin-driven via `.city-scene-root` rules in
    // globals.css — core keeps the neon-night fill, pko gets the
    // daylight sky token.
    <div
      // E-04 — `data-mood="sunset"` opts the compact preview (dashboard
      // + landing) into a peach-tinted sky so it visually matches the
      // "🌅 Zachód / Sunset" chip on the games hub. The full-size hero
      // stays on the default daylight palette per AGENTS.md skin rules.
      className="city-scene-root relative w-full rounded-lg border border-[var(--line)] overflow-hidden"
      data-mood={compact ? "sunset" : undefined}
      style={{
        aspectRatio: `${VB_W} / ${VB_H}`,
        maxHeight: compact ? 360 : 560,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        /* No `role="img"` / `aria-label` on the outer SVG. When
         * `interactive` is true the scene contains focusable <a>
         * children (the per-building Links), which makes `role=img`
         * a WCAG violation (axe rule `nested-interactive` — an img
         * landmark must not contain tabbable descendants). The <title>
         * element below is the correct equivalent — it provides an
         * accessible name without asserting the whole tree is a
         * single image. */
        aria-labelledby="city-scene-title"
      >
        <title id="city-scene-title">
          Nočná panoráma Katowíc: 9 budov predstavujúcich minihry XP Arény
        </title>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#02021a" />
            <stop offset="55%" stopColor="#120f3a" />
            <stop offset="100%" stopColor="#2a1458" />
          </linearGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#fde68a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0a0a0f" />
          </linearGradient>
          <pattern id="cobbles" width="22" height="14" patternUnits="userSpaceOnUse">
            <rect width="22" height="14" fill="#0f0f1f" />
            <path d="M0 7 L22 7" stroke="#222" strokeWidth="1" />
            <path d="M11 0 L11 7 M0 7 M22 14" stroke="#222" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width={VB_W} height={GROUND} fill="url(#sky)" />

        {/* Moon + glow — repositioned 2026-04-22 to the upper-left sky
            band. Previously cx=VB_W-160 (upper-right), which collided
            with the AI-zone building banners + countdown chips (same
            x-band; SVG z-order put buildings on top so the moon bled
            through the chip corners). The upper-left sky has only
            low-profile evergreen buildings below it so a larger moon
            can live there without touching building art. */}
        <circle cx={220} cy={90} r={95} fill="url(#moonGlow)" />
        <circle
          cx={220}
          cy={90}
          r={44}
          fill="#f8fafc"
          stroke="#0a0a0f"
          strokeWidth={3}
        />
        <circle cx={200} cy={75} r={7} fill="#e2e8f0" />
        <circle cx={240} cy={108} r={5} fill="#cbd5e1" />
        <circle cx={248} cy={72} r={3} fill="#cbd5e1" />

        {/* Stars (deterministic pattern so no hydration mismatch) */}
        {STARS.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r} fill="#fffbe6" opacity={s.o} />
            {s.big && (
              <g stroke="#fffbe6" strokeWidth={0.8} opacity={s.o}>
                <line x1={s.x - 4} y1={s.y} x2={s.x + 4} y2={s.y} />
                <line x1={s.x} y1={s.y - 4} x2={s.x} y2={s.y + 4} />
              </g>
            )}
          </g>
        ))}

        {/* Distant back buildings (shadows behind hero row) */}
        <g opacity={0.55}>
          {BACK_SILHOUETTES.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={GROUND - b.h}
              width={b.w}
              height={b.h}
              fill="#0b0b20"
              stroke="#0a0a0f"
              strokeWidth={2}
            />
          ))}
          {/* chimney smoke trails very faint */}
          <path
            d={`M 160 ${GROUND - 260} q -10 -20 0 -40 q 10 -20 0 -40`}
            stroke="#1e1e3e"
            strokeWidth={3}
            fill="none"
          />
        </g>

        {/* Ground block */}
        <rect x="0" y={GROUND} width={VB_W} height={VB_H - GROUND} fill="url(#ground)" />
        <rect x="0" y={GROUND + 28} width={VB_W} height={12} fill="url(#cobbles)" />
        {/* road center dashed line */}
        <g stroke="#fde047" strokeDasharray="22 16" strokeWidth={4} opacity="0.55">
          <line x1="0" y1={GROUND + 36} x2={VB_W} y2={GROUND + 36} />
        </g>

        {/* Streetlight posts */}
        {[120, 430, 730, 1040, 1320].map((x, i) => (
          <g key={i}>
            <rect x={x - 2} y={GROUND - 52} width={4} height={54} fill="#3f3f5a" />
            <circle cx={x} cy={GROUND - 58} r={6} fill="#fde047" opacity="0.95" />
            <circle cx={x} cy={GROUND - 58} r={14} fill="#fde047" opacity="0.15" />
          </g>
        ))}

        {/* AI zone — always renders 3 fixed slots (fast / medium / slow).
            A slot without a live game shows a construction-site placeholder
            with a countdown to the next rotation boundary, so the "3 AI
            games running in parallel" contract is visible even when the
            backend pipeline is mid-generate / rate-limited / mid-deploy. */}
        {ALL_SLOTS.map((slot, i) => {
          const plan = aiPlanFor(i, 3);
          // `resolveLiveAiGameForSlot` filters expired envelopes BEFORE
          // resolving which one owns the slot. Consumers that don't use
          // lazy-rotation can leak expired games into `activeAi`; without
          // this filter the scene renders an EXPIRED chip under a
          // LIVE-labelled building (bug seen 2026-04-23).
          const game = resolveLiveAiGameForSlot(activeAi, slot, renderNow);
          return (
            <ConstructionSlot
              key={slot}
              plan={plan}
              interactive={interactive}
              aiGame={game}
              slot={slot}
            />
          );
        })}

        {/* Buildings — wrapped in SVG-native <a> so click zones sit in the
            exact same coordinate space as the art (no HTML-overlay drift). */}
        {BUILDING_PLAN.map((b, i) => {
          const g = get(b.gameId);
          const powered = (g?.plays ?? 0) > 0;
          const slot = (
            <BuildingSlot
              plan={b}
              powered={powered}
              bestScore={g?.bestScore ?? 0}
              cap={b.cap}
              index={i}
            />
          );
          // F-02 — `data-building-body="true"` opts the slot out of the
          // global `.city-scene-root` filter + broad `[fill="X"]`
          // retints (see globals.css). Without it, every building body
          // collapsed to the same muted grey on /games and the scene
          // read as outline-only wireframes — user reported it as a
          // critical regression.
          if (!interactive) return <g key={b.gameId} data-building-body="true">{slot}</g>;
          const label = `${b.title} — ${b.buildingName}${
            loggedIn && g ? ` · rekord ${g.bestScore}/${b.cap} W` : ""
          }`;
          return (
            <Link
              key={b.gameId}
              href={`/games/${b.gameId}`}
              aria-label={label}
            >
              <g
                className="building-link"
                data-building-body="true"
                data-powered={powered}
              >
                <title>{label}</title>
                {/* invisible hit rect so the whole footprint is clickable */}
                <rect
                  x={b.x - 6}
                  y={GROUND - b.h - 30}
                  width={b.w + 12}
                  height={b.h + 60}
                  fill="transparent"
                  pointerEvents="all"
                />
                {slot}
              </g>
            </Link>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Building plan ---------- */

type Plan = {
  gameId: string;
  title: string;
  buildingName: string;
  x: number;
  w: number;
  h: number;
  cap: number;
  draw: (props: DrawProps) => React.ReactNode;
};

type DrawProps = {
  x: number;
  w: number;
  h: number;
  powered: boolean;
  bestScore: number;
  cap: number;
  name: string;
};

const BUILDING_PLAN: Plan[] = [
  {
    gameId: "finance-quiz",
    title: "Quiz finansowy",
    buildingName: "Biblioteka Śląska",
    x: 40,
    w: 180,
    h: 180,
    cap: 100,
    draw: Library,
  },
  {
    gameId: "stock-tap",
    title: "Kurs akcji",
    buildingName: "PKO Tower",
    x: 240,
    w: 110,
    h: 300,
    cap: 220,
    draw: Tower,
  },
  {
    gameId: "memory-match",
    title: "Gra pamięciowa",
    buildingName: "Muzeum Śląskie",
    x: 370,
    w: 150,
    h: 170,
    cap: 160,
    draw: Museum,
  },
  {
    gameId: "math-sprint",
    title: "Sprint matematyczny",
    buildingName: "Instytut Matematyki",
    x: 540,
    w: 140,
    h: 190,
    cap: 200,
    draw: Institute,
  },
  {
    gameId: "energy-dash",
    title: "Energetyczny sprint",
    buildingName: "Silesia Solar Farm",
    x: 700,
    w: 220,
    h: 130,
    cap: 220,
    draw: SolarFarm,
  },
  {
    gameId: "power-flip",
    title: "Przełącznik mocy",
    buildingName: "Dom LED",
    x: 940,
    w: 90,
    h: 140,
    cap: 180,
    draw: LEDHouse,
  },
  {
    gameId: "currency-rush",
    title: "Pary walutowe",
    buildingName: "Kantor Rynek",
    x: 1050,
    w: 70,
    h: 120,
    cap: 180,
    draw: ExchangeBooth,
  },
  {
    gameId: "budget-balance",
    title: "Budżet domowy",
    buildingName: "PKO Oddział",
    x: 1140,
    w: 120,
    h: 170,
    cap: 160,
    draw: BankBranch,
  },
  {
    gameId: "word-scramble",
    title: "Litery w chaosie",
    buildingName: "Drukarnia",
    x: 1260,
    w: 100,
    h: 200,
    cap: 120,
    draw: Printshop,
  },
];

// AI buildings live on the right-hand side of the city, starting at
// AI_ZONE_X. Positions are computed at render time based on how many AI
// games are currently active — 1 → center slot, 2 → side-by-side, 3 →
// three in a row. When no game is active, a single construction-site
// placeholder fills the zone.
const AI_ZONE_X = 1380;
const AI_ZONE_W = 420;
const AI_SLOT_W = 72;
const AI_SLOT_HEIGHTS = [220, 195, 240]; // per-position varying heights

function aiPlanFor(index: number, total: number): Plan {
  const count = Math.max(1, Math.min(3, total));
  const zoneStart = AI_ZONE_X;
  // Evenly distribute `count` slots within AI_ZONE_W
  const gap = (AI_ZONE_W - count * AI_SLOT_W) / (count + 1);
  const x = zoneStart + gap + index * (AI_SLOT_W + gap);
  return {
    gameId: `__ai-slot-${index}__`,
    title: "Wyzwanie AI",
    buildingName: "Plac budowy",
    x,
    w: AI_SLOT_W,
    h: AI_SLOT_HEIGHTS[index % AI_SLOT_HEIGHTS.length],
    cap: 0,
    draw: ConstructionSite,
  };
}

// Fallback placeholder when no AI games are active yet (empty construction
// site so the city has something in that zone instead of a void).
const CONSTRUCTION: Plan = {
  gameId: "__coming-soon__",
  title: "Wyzwanie AI dnia",
  buildingName: "Plac budowy",
  x: AI_ZONE_X + (AI_ZONE_W - AI_SLOT_W) / 2,
  w: AI_SLOT_W,
  h: 220,
  cap: 0,
  draw: ConstructionSite,
};

function BuildingSlot({
  plan,
  powered,
  bestScore,
  cap,
  index,
}: {
  plan: Plan;
  powered: boolean;
  bestScore: number;
  cap: number;
  index: number;
}) {
  return (
    <g
      // Narrow the transition to the exact properties we animate on
      // powered-flip. `transition-all` also animates filter + transform
      // but also any future style change (stroke, opacity, translate),
      // which surprises readers and costs extra paint work.
      className="transition-[filter,transform] duration-300"
      style={{
        // Unlit buildings render as near-silhouettes matching the hero
        // copy "9 budynków = 9 mini-gier. Dopóki nie zagrasz, budynek
        // stoi w ciemności. Po wyniku zapali mu się okna i neon."
        // Prior saturate(0.35) brightness(0.6) kept colours too visible
        // to read as "darkness"; saturate(0) brightness(0.18) produces
        // a mono-tone silhouette that reads convincingly as night-dark.
        filter: powered ? "none" : "saturate(0) brightness(0.18)",
      }}
      data-idx={index}
    >
      {plan.draw({
        x: plan.x,
        w: plan.w,
        h: plan.h,
        powered,
        bestScore,
        cap,
        name: plan.buildingName,
      })}
    </g>
  );
}

/* ---------- Individual building components ---------- */

function Tower({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  const rows = 13;
  const cols = 3;
  const winW = 20;
  const winH = 14;
  const startX = x + 10;
  const startY = top + 30;
  const stepX = (w - 20) / cols;
  const stepY = (h - 50) / rows;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 18} text={name} powered={powered} />
      {/* antenna */}
      <line x1={x + w / 2} y1={top - 20} x2={x + w / 2} y2={top - 60} stroke="#0a0a0f" strokeWidth={3} />
      <circle cx={x + w / 2} cy={top - 62} r={4} fill={powered ? "#ef4444" : "#555"} />

      {/* roof */}
      <rect x={x - 5} y={top - 6} width={w + 10} height={10} fill="#0a0a0f" />
      {/* body */}
      <rect x={x} y={top} width={w} height={h} fill="#fde047" stroke="#0a0a0f" strokeWidth={3} />

      {/* windows */}
      {Array.from({ length: rows }).flatMap((_, row) =>
        Array.from({ length: cols }).map((__, col) => {
          const wx = startX + col * stepX + (stepX - winW) / 2;
          const wy = startY + row * stepY;
          const lit = powered && (row * 3 + col + 7) % 5 !== 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={wx}
              y={wy}
              width={winW}
              height={winH}
              fill={lit ? "#fde047" : "#0a0a0f"}
              stroke="#0a0a0f"
              strokeWidth={1.5}
            />
          );
        }),
      )}

      {/* entrance */}
      <rect
        x={x + w / 2 - 14}
        y={GROUND - 30}
        width={28}
        height={30}
        fill="#111"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      <rect
        x={x + w / 2 - 10}
        y={GROUND - 26}
        width={20}
        height={24}
        fill={powered ? "#f59e0b" : "#222"}
      />

      <WattMeter x={x + 5} y={GROUND + 8} w={w - 10} value={bestScore} cap={cap} />
    </g>
  );
}

function Library({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  const pillarCount = 6;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 14} text={name} powered={powered} />
      {/* pediment triangle */}
      <polygon
        points={`${x - 6},${top + 6} ${x + w / 2},${top - 18} ${x + w + 6},${top + 6}`}
        fill="#d97706"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      {/* entablature */}
      <rect x={x - 6} y={top} width={w + 12} height={16} fill="#b45309" stroke="#0a0a0f" strokeWidth={3} />
      {/* body */}
      <rect x={x} y={top + 16} width={w} height={h - 16} fill="#f59e0b" stroke="#0a0a0f" strokeWidth={3} />
      {/* pillars */}
      {Array.from({ length: pillarCount }).map((_, i) => {
        const pw = 10;
        const gap = (w - pillarCount * pw) / (pillarCount + 1);
        const px = x + gap + i * (pw + gap);
        return (
          <rect
            key={i}
            x={px}
            y={top + 24}
            width={pw}
            height={h - 50}
            fill="#92400e"
            stroke="#0a0a0f"
            strokeWidth={2}
          />
        );
      })}
      {/* steps */}
      <rect x={x - 4} y={GROUND - 16} width={w + 8} height={8} fill="#854d0e" stroke="#0a0a0f" strokeWidth={2} />
      <rect x={x - 10} y={GROUND - 8} width={w + 20} height={8} fill="#78350f" stroke="#0a0a0f" strokeWidth={2} />
      {/* entrance glow */}
      <rect
        x={x + w / 2 - 18}
        y={top + 24}
        width={36}
        height={h - 50}
        fill={powered ? "rgba(253,224,71,0.25)" : "rgba(0,0,0,0.3)"}
      />
      <WattMeter x={x + 20} y={GROUND + 8} w={w - 40} value={bestScore} cap={cap} />
    </g>
  );
}

function Museum({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  // Muzeum Śląskie stylized as a cluster of glass cubes
  const top = GROUND - h;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 14} text={name} powered={powered} />
      <rect x={x} y={top + 40} width={w} height={h - 40} fill="#0f172a" stroke="#0a0a0f" strokeWidth={3} />
      <rect x={x + 14} y={top} width={w - 28} height={60} fill="#0ea5e9" stroke="#0a0a0f" strokeWidth={3} />
      {/* glass grid */}
      {Array.from({ length: 3 }).flatMap((_, row) =>
        Array.from({ length: 4 }).map((__, col) => {
          const wx = x + 10 + col * ((w - 20) / 4);
          const wy = top + 50 + row * 30;
          const lit = powered && (row + col) % 2 === 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={wx}
              y={wy}
              width={(w - 30) / 4}
              height={22}
              fill={lit ? "#38bdf8" : "#0c1229"}
              stroke="#0a0a0f"
              strokeWidth={1.5}
            />
          );
        }),
      )}
      {/* cantilever top box */}
      <rect x={x - 6} y={top + 14} width={24} height={26} fill="#155e75" stroke="#0a0a0f" strokeWidth={3} />
      <rect x={x + w - 18} y={top + 4} width={24} height={26} fill="#155e75" stroke="#0a0a0f" strokeWidth={3} />
      <WattMeter x={x + 10} y={GROUND + 8} w={w - 20} value={bestScore} cap={cap} />
    </g>
  );
}

function Institute({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  const centerH = h;
  const sideH = h - 46;
  const sideW = 34;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 12} text={name} powered={powered} />
      {/* left tower */}
      <rect x={x} y={GROUND - sideH} width={sideW} height={sideH} fill="#6366f1" stroke="#0a0a0f" strokeWidth={3} />
      <polygon
        points={`${x - 4},${GROUND - sideH + 2} ${x + sideW / 2},${GROUND - sideH - 22} ${x + sideW + 4},${GROUND - sideH + 2}`}
        fill="#4338ca"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      {/* right tower */}
      <rect x={x + w - sideW} y={GROUND - sideH} width={sideW} height={sideH} fill="#6366f1" stroke="#0a0a0f" strokeWidth={3} />
      <polygon
        points={`${x + w - sideW - 4},${GROUND - sideH + 2} ${x + w - sideW / 2},${GROUND - sideH - 22} ${x + w + 4},${GROUND - sideH + 2}`}
        fill="#4338ca"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      {/* main */}
      <rect x={x + sideW - 4} y={top} width={w - 2 * (sideW - 4)} height={centerH} fill="#818cf8" stroke="#0a0a0f" strokeWidth={3} />
      {/* big clock / π sign */}
      <circle
        cx={x + w / 2}
        cy={top + 40}
        r={22}
        fill={powered ? "#fde047" : "#312e81"}
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      <text
        x={x + w / 2}
        y={top + 49}
        textAnchor="middle"
        fontSize={26}
        fontWeight={900}
        fill="#0a0a0f"
      >
        π
      </text>
      {/* windows */}
      {Array.from({ length: 4 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => {
          const wx = x + sideW + 6 + c * ((w - 2 * sideW - 16) / 3);
          const wy = top + 78 + r * 22;
          const lit = powered && (r + c * 2) % 3 !== 0;
          return (
            <rect
              key={`${r}-${c}`}
              x={wx}
              y={wy}
              width={(w - 2 * sideW - 24) / 3}
              height={16}
              fill={lit ? "#fcd34d" : "#1e1b4b"}
              stroke="#0a0a0f"
              strokeWidth={1.5}
            />
          );
        }),
      )}
      <WattMeter x={x + 10} y={GROUND + 8} w={w - 20} value={bestScore} cap={cap} />
    </g>
  );
}

function SolarFarm({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  const buildingH = 60;
  const panels = 5;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 10} text={name} powered={powered} />
      {/* Wind turbine */}
      <g>
        <rect x={x - 10} y={GROUND - 140} width={6} height={140} fill="#475569" stroke="#0a0a0f" strokeWidth={2} />
        <circle cx={x - 7} cy={GROUND - 140} r={5} fill="#0a0a0f" />
        {/* three blades */}
        {[0, 120, 240].map((deg, i) => (
          <rect
            key={i}
            x={x - 7}
            y={GROUND - 142}
            width={3}
            height={40}
            fill="#f1f5f9"
            stroke="#0a0a0f"
            strokeWidth={1}
            transform={`rotate(${deg + 30} ${x - 7} ${GROUND - 140})`}
          />
        ))}
      </g>
      {/* body with slanted solar roof */}
      <rect x={x} y={GROUND - buildingH} width={w} height={buildingH} fill="#10b981" stroke="#0a0a0f" strokeWidth={3} />
      {/* slanted roof */}
      <polygon
        points={`${x},${GROUND - buildingH} ${x + w},${GROUND - buildingH} ${x + w},${top + 26} ${x + 20},${top}`}
        fill="#064e3b"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      {/* solar panels on the roof */}
      {Array.from({ length: panels }).map((_, i) => {
        const panelW = (w - 30) / panels - 6;
        const panelX = x + 14 + i * ((w - 30) / panels);
        const tiltY = top + 6 + i * 1.5;
        return (
          <g key={i}>
            <rect
              x={panelX}
              y={tiltY}
              width={panelW}
              height={22}
              fill={powered ? "#38bdf8" : "#0c4a6e"}
              stroke="#0a0a0f"
              strokeWidth={2}
            />
            <line
              x1={panelX + panelW / 2}
              y1={tiltY + 1}
              x2={panelX + panelW / 2}
              y2={tiltY + 21}
              stroke="#0a0a0f"
              strokeWidth={1}
            />
            <line
              x1={panelX + 1}
              y1={tiltY + 11}
              x2={panelX + panelW - 1}
              y2={tiltY + 11}
              stroke="#0a0a0f"
              strokeWidth={1}
            />
          </g>
        );
      })}
      {/* door + windows */}
      <rect x={x + w / 2 - 12} y={GROUND - 36} width={24} height={36} fill="#064e3b" stroke="#0a0a0f" strokeWidth={2} />
      <rect
        x={x + w / 2 - 8}
        y={GROUND - 32}
        width={16}
        height={28}
        fill={powered ? "#fde047" : "#222"}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <rect
          key={i}
          x={x + 10 + i * (w / 3.2)}
          y={GROUND - 46}
          width={28}
          height={16}
          fill={powered ? "#4ade80" : "#0f2e1d"}
          stroke="#0a0a0f"
          strokeWidth={1.5}
        />
      ))}
      <WattMeter x={x + 10} y={GROUND + 8} w={w - 20} value={bestScore} cap={cap} />
    </g>
  );
}

function LEDHouse({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 12} text={name} powered={powered} small />
      {/* pitched roof */}
      <polygon
        points={`${x - 4},${top + 22} ${x + w / 2},${top} ${x + w + 4},${top + 22}`}
        fill="#65a30d"
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      {/* body */}
      <rect x={x} y={top + 22} width={w} height={h - 22} fill="#a3e635" stroke="#0a0a0f" strokeWidth={3} />
      {/* LED strip decoration along the eaves */}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={x + 14 + i * ((w - 28) / 3)}
          cy={top + 24}
          r={3}
          fill={powered ? "#fde047" : "#3f3f46"}
        />
      ))}
      {/* window */}
      <rect
        x={x + 14}
        y={top + 38}
        width={w - 28}
        height={30}
        fill={powered ? "#fde047" : "#1a2e05"}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      <line x1={x + w / 2} y1={top + 38} x2={x + w / 2} y2={top + 68} stroke="#0a0a0f" strokeWidth={2} />
      <line x1={x + 14} y1={top + 53} x2={x + w - 14} y2={top + 53} stroke="#0a0a0f" strokeWidth={2} />
      {/* door */}
      <rect
        x={x + w / 2 - 9}
        y={GROUND - 32}
        width={18}
        height={32}
        fill="#365314"
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      <circle cx={x + w / 2 + 4} cy={GROUND - 16} r={1.6} fill="#fde047" />
      <WattMeter x={x + 4} y={GROUND + 8} w={w - 8} value={bestScore} cap={cap} />
    </g>
  );
}

function ExchangeBooth({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 10} text={name} powered={powered} small />
      {/* awning */}
      <rect x={x - 4} y={top + 14} width={w + 8} height={10} fill="#b45309" stroke="#0a0a0f" strokeWidth={3} />
      {/* striped awning */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x={x - 4 + i * ((w + 8) / 6)}
          y={top + 14}
          width={(w + 8) / 6}
          height={10}
          fill={i % 2 === 0 ? "#facc15" : "#b45309"}
          stroke="#0a0a0f"
          strokeWidth={1.5}
        />
      ))}
      {/* head */}
      <rect x={x} y={top} width={w} height={16} fill="#fbbf24" stroke="#0a0a0f" strokeWidth={3} />
      <text x={x + w / 2} y={top + 12} textAnchor="middle" fontSize={10} fontWeight={900} fill="#0a0a0f">
        KANTOR
      </text>
      {/* body */}
      <rect x={x} y={top + 24} width={w} height={h - 24} fill="#f59e0b" stroke="#0a0a0f" strokeWidth={3} />
      {/* glass window with currencies */}
      <rect
        x={x + 6}
        y={top + 34}
        width={w - 12}
        height={h - 66}
        fill={powered ? "#fde68a" : "#1f1b0b"}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      <text x={x + w / 2} y={top + 54} textAnchor="middle" fontSize={13} fontWeight={900} fill="#0a0a0f">
        €
      </text>
      <text x={x + w / 2} y={top + 74} textAnchor="middle" fontSize={13} fontWeight={900} fill="#0a0a0f">
        $
      </text>
      <text x={x + w / 2} y={top + 94} textAnchor="middle" fontSize={13} fontWeight={900} fill="#0a0a0f">
        zł
      </text>
      <WattMeter x={x} y={GROUND + 8} w={w} value={bestScore} cap={cap} />
    </g>
  );
}

function BankBranch({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 14} text={name} powered={powered} />
      {/* roof band */}
      <rect x={x - 4} y={top} width={w + 8} height={18} fill="#06b6d4" stroke="#0a0a0f" strokeWidth={3} />
      <text x={x + w / 2} y={top + 13} textAnchor="middle" fontSize={12} fontWeight={900} fill="#0a0a0f">
        PKO BP
      </text>
      {/* body */}
      <rect x={x} y={top + 18} width={w} height={h - 18} fill="#67e8f9" stroke="#0a0a0f" strokeWidth={3} />
      {/* glass front */}
      <rect
        x={x + 10}
        y={top + 28}
        width={w - 20}
        height={h - 64}
        fill={powered ? "#fde047" : "#083344"}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      {/* grid of muntins */}
      <line x1={x + w / 2} y1={top + 28} x2={x + w / 2} y2={top + h - 36} stroke="#0a0a0f" strokeWidth={2} />
      <line
        x1={x + 10}
        y1={top + (h + 28) / 2 - 10}
        x2={x + w - 10}
        y2={top + (h + 28) / 2 - 10}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      {/* ATM */}
      <rect x={x + 8} y={GROUND - 40} width={24} height={40} fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} />
      <rect x={x + 12} y={GROUND - 34} width={16} height={10} fill={powered ? "#22d3ee" : "#1e293b"} />
      <circle cx={x + 20} cy={GROUND - 16} r={2} fill={powered ? "#fde047" : "#444"} />
      {/* door */}
      <rect x={x + w - 34} y={GROUND - 36} width={24} height={36} fill="#155e75" stroke="#0a0a0f" strokeWidth={2} />
      <rect x={x + w - 30} y={GROUND - 32} width={16} height={28} fill={powered ? "#22d3ee" : "#0c4a6e"} />
      <WattMeter x={x} y={GROUND + 8} w={w} value={bestScore} cap={cap} />
    </g>
  );
}

function ConstructionSite({ x, w, h, name: _name }: DrawProps) {
  // Pending AI-slot placeholder. The parent `ConstructionSlot` already
  // draws the TOP two-tier copy (countdown chip + "🛠 AI · 1h/6h/12h"
  // lane banner), so this primitive stays visually quiet: barricade-hatched
  // scaffolding + a single neutral "🚧" glyph. The ground tag below is
  // intentionally *not* drawn here — `ConstructionSlot` overlays its own
  // slot-keyed ground tag (see bug 5 / bug 4 alignment) so that live and
  // pending slots share an identical bottom plaque instead of the verbose
  // "STAVENISKO + SOON + AI VÝZVA" stack the old site rendered.
  const top = GROUND - h;
  return (
    <g>
      {/* scaffolding */}
      <rect x={x} y={top + 20} width={w} height={h - 20} fill="#1f2937" stroke="#0a0a0f" strokeWidth={3} />
      {/* diagonal caution stripes */}
      <rect
        x={x}
        y={top + 20}
        width={w}
        height={h - 20}
        fill="transparent"
        style={{
          fill: "url(#caution)",
        }}
      />
      <defs>
        <pattern id="caution" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#111827" />
          <path d="M0 20 L20 0" stroke="#fde047" strokeWidth="4" />
        </pattern>
      </defs>
      {/* scaffolding rails */}
      {[top + 40, top + 80, top + 120, top + 160, top + 200].map((y, i) => (
        <line
          key={i}
          x1={x + 2}
          y1={y}
          x2={x + w - 2}
          y2={y}
          stroke="#fde047"
          strokeWidth={2}
          opacity={0.9}
        />
      ))}
      {/* uprights */}
      {[x + 10, x + w / 2, x + w - 10].map((cx, i) => (
        <line
          key={i}
          x1={cx}
          y1={top + 20}
          x2={cx}
          y2={GROUND}
          stroke="#fde047"
          strokeWidth={2}
          opacity={0.9}
        />
      ))}
      {/* Neutral single glyph — replaces the prior "SOON" / "🤖 AI VÝZVA"
          sign stack. One marker, no copy. */}
      <text
        x={x + w / 2}
        y={top + h / 2 + 14}
        textAnchor="middle"
        fontSize={38}
        style={{ filter: "drop-shadow(0 2px 0 #000)" }}
      >
        🚧
      </text>
    </g>
  );
}

function ConstructionSlot({
  plan,
  interactive,
  aiGame,
  slot: slotKind,
}: {
  plan: Plan;
  interactive: boolean;
  aiGame?: CityAiGame;
  /** The rotation lane this visual slot represents. When `aiGame` is
   *  undefined the placeholder labels itself as "1h / 6h / 12h" and
   *  counts down to the next boundary for THAT lane. */
  slot?: RotationSlot;
}) {
  const live = Boolean(aiGame);
  const top = GROUND - plan.h;
  // Pending placeholder: no live game yet for this slot. Surface the
  // lane cadence ("1h / 6h / 12h") + a LiveCountdown to the next
  // aligned rotation boundary so the user sees a concrete deadline,
  // not "coming soon". When `slotKind` is missing (legacy caller),
  // we skip the lane-branded banner entirely and fall back to the
  // plain construction-site art.
  const pendingCountdown = !live && slotKind
    ? nextSlotBoundary(slotKind, Date.now())
    : null;
  const laneLabel = slotKind ? SLOT_LABEL[slotKind] : null;

  const node = live ? (
    <LiveAiBuilding
      x={plan.x}
      w={plan.w}
      h={plan.h}
      aiGame={aiGame!}
      slot={slotKind}
    />
  ) : (
    <g>
      {plan.draw({
        x: plan.x,
        w: plan.w,
        h: plan.h,
        powered: false,
        bestScore: 0,
        cap: 0,
        name: plan.buildingName,
      })}
      {pendingCountdown !== null && laneLabel && (
        <>
          {/* lane-cadence badge (1h / 6h / 12h) + countdown to the
              next rotation boundary. Same vertical layout + gap
              rhythm as LiveAiBuilding so live + pending slots stack
              visually together. */}
          <g transform={`translate(${plan.x + plan.w / 2 - 22}, ${top - 70})`}>
            <rect
              x={0}
              y={0}
              width={44}
              height={14}
              fill="#0a0a0f"
              stroke="#fde047"
              strokeWidth={1.5}
              rx={2}
              opacity={0.7}
            />
            <LiveCountdown
              validUntil={pendingCountdown}
              color="#fde047"
            />
          </g>
          <g transform={`translate(${plan.x + plan.w / 2 - 44}, ${top - 46})`}>
            <rect
              x={0}
              y={0}
              width={88}
              height={18}
              fill="#fde047"
              stroke="#0a0a0f"
              strokeWidth={2}
              rx={2}
              opacity={0.55}
            />
            <text
              x={44}
              y={12}
              textAnchor="middle"
              fontSize={8}
              fontWeight={900}
              fill="#0a0a0f"
            >
              🛠 AI · {laneLabel}
            </text>
          </g>
          {/* Ground plaque — mirrors the LIVE slot's street sign (same y,
              same fill/font/size) so pending and live slots visually share
              a bottom row. Carries the slot-keyed label so the user sees
              which lane is "under construction" from a glance. */}
          <rect
            x={plan.x}
            y={GROUND + 22}
            width={plan.w}
            height={16}
            fill="#0a0a0f"
            stroke="#0a0a0f"
            strokeWidth={2}
            rx={2}
          />
          <text
            x={plan.x + plan.w / 2}
            y={GROUND + 33}
            textAnchor="middle"
            fontSize={8}
            fontWeight={900}
            fill="#fde047"
          >
            {slotKind ? SLOT_GROUND_TAG[slotKind] : "AI · SOON"}
          </text>
        </>
      )}
    </g>
  );
  if (!interactive) return <g>{node}</g>;
  const href = aiGame ? `/games/ai/${aiGame.id}` : "/sin-slavy";
  const label = aiGame
    ? `Wyzwanie AI dnia — ${aiGame.title}`
    : laneLabel
      ? `Wyzwanie AI · ${laneLabel} · wkrótce`
      : "Wyzwanie AI dnia — wkrótce";
  const title = aiGame
    ? `Wyzwanie AI dnia · dostępne — ${aiGame.title} (${aiGame.id})`
    : laneLabel
      ? `Wyzwanie AI · ${laneLabel} · w budowie — nowa gra za chwilę`
      : "Wyzwanie AI dnia · w budowie";
  return (
    <Link href={href} aria-label={label}>
      <g className="building-link" data-powered={live}>
        <title>{title}</title>
        <rect
          x={plan.x - 6}
          y={GROUND - plan.h - 80}
          width={plan.w + 12}
          height={plan.h + 110}
          fill="transparent"
          pointerEvents="all"
        />
        {node}
      </g>
    </Link>
  );
}

// Hash the game id into a deterministic visual recipe so every published AI
// game looks materially different — different roof color, body color, roof
// silhouette, and window pattern. Same id → same building, always.
const AI_ROOF_PALETTE = [
  "#ec4899", "#22d3ee", "#fde047", "#a3e635",
  "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e",
];
const AI_BODY_PALETTE = [
  "#1e1b4b", "#064e3b", "#831843", "#78350f",
  "#164e63", "#581c87", "#0f172a", "#7c2d12",
];
const AI_WINDOW_PRIMARY = [
  "#fde047", "#22d3ee", "#a3e635", "#f97316", "#ec4899", "#8b5cf6",
];
const AI_WINDOW_SECONDARY = [
  "#22d3ee", "#fde047", "#ec4899", "#a3e635", "#f97316", "#fb7185",
];

type AiRoofShape = "flat" | "pitched" | "stepped" | "crenellated";
const AI_ROOF_SHAPES: AiRoofShape[] = ["flat", "pitched", "stepped", "crenellated"];
type AiWindowPattern = "grid" | "stacked" | "offset";
const AI_WINDOW_PATTERNS: AiWindowPattern[] = ["grid", "stacked", "offset"];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 131 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function recipeFor(id: string) {
  const h = hashId(id);
  return {
    roofColor: AI_ROOF_PALETTE[h % AI_ROOF_PALETTE.length],
    bodyColor: AI_BODY_PALETTE[(h >> 3) % AI_BODY_PALETTE.length],
    windowA: AI_WINDOW_PRIMARY[(h >> 6) % AI_WINDOW_PRIMARY.length],
    windowB: AI_WINDOW_SECONDARY[(h >> 9) % AI_WINDOW_SECONDARY.length],
    roofShape: AI_ROOF_SHAPES[(h >> 12) % AI_ROOF_SHAPES.length],
    windowPattern: AI_WINDOW_PATTERNS[(h >> 15) % AI_WINDOW_PATTERNS.length],
  };
}

function RoofShape({
  x,
  w,
  top,
  shape,
  color,
}: {
  x: number;
  w: number;
  top: number;
  shape: AiRoofShape;
  color: string;
}) {
  if (shape === "flat") {
    return (
      <>
        <rect x={x - 5} y={top - 6} width={w + 10} height={10} fill="#0a0a0f" />
        <rect x={x - 2} y={top - 4} width={w + 4} height={6} fill={color} />
      </>
    );
  }
  if (shape === "pitched") {
    const peak = top - 22;
    return (
      <>
        <polygon
          points={`${x - 6},${top} ${x + w / 2},${peak} ${x + w + 6},${top}`}
          fill={color}
          stroke="#0a0a0f"
          strokeWidth={3}
        />
      </>
    );
  }
  if (shape === "stepped") {
    return (
      <>
        <rect x={x - 4} y={top - 16} width={w + 8} height={8} fill={color} stroke="#0a0a0f" strokeWidth={2} />
        <rect x={x + 6} y={top - 24} width={w - 12} height={10} fill={color} stroke="#0a0a0f" strokeWidth={2} />
        <rect x={x + w / 2 - 6} y={top - 32} width={12} height={10} fill={color} stroke="#0a0a0f" strokeWidth={2} />
      </>
    );
  }
  // crenellated
  const merlons = 5;
  const step = w / merlons;
  return (
    <g>
      <rect x={x - 4} y={top - 10} width={w + 8} height={10} fill={color} stroke="#0a0a0f" strokeWidth={2} />
      {Array.from({ length: merlons }).map((_, i) => {
        if (i % 2 === 0) return null;
        return (
          <rect
            key={i}
            x={x + i * step}
            y={top - 18}
            width={step - 1}
            height={10}
            fill={color}
            stroke="#0a0a0f"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

function AiWindows({
  x,
  w,
  top,
  h,
  pattern,
  colorA,
  colorB,
}: {
  x: number;
  w: number;
  top: number;
  h: number;
  pattern: AiWindowPattern;
  colorA: string;
  colorB: string;
}) {
  const rows = 9;
  const rowH = (h - 40) / rows;
  const items: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    const wy = top + 14 + row * rowH;
    if (pattern === "grid") {
      items.push(
        <g key={row}>
          <rect x={x + 8} y={wy} width={w / 2 - 12} height={7} fill={colorA} stroke="#0a0a0f" strokeWidth={1} />
          <rect x={x + w / 2 + 4} y={wy} width={w / 2 - 12} height={7} fill={colorB} stroke="#0a0a0f" strokeWidth={1} />
        </g>,
      );
    } else if (pattern === "stacked") {
      items.push(
        <rect
          key={row}
          x={x + 8}
          y={wy}
          width={w - 16}
          height={7}
          fill={row % 2 === 0 ? colorA : colorB}
          stroke="#0a0a0f"
          strokeWidth={1}
        />,
      );
    } else {
      // offset — staggered triptych
      const cols = 3;
      const cellW = (w - 16) / cols;
      const stagger = (row % 2) * (cellW / 2);
      for (let c = 0; c < cols; c++) {
        items.push(
          <rect
            key={`${row}-${c}`}
            x={x + 8 + c * cellW + stagger}
            y={wy}
            width={cellW - 2}
            height={7}
            fill={c % 2 === 0 ? colorA : colorB}
            stroke="#0a0a0f"
            strokeWidth={1}
          />,
        );
      }
    }
  }
  return <>{items}</>;
}

function LiveAiBuilding({
  x,
  w,
  h,
  aiGame,
  slot,
}: {
  x: number;
  w: number;
  h: number;
  aiGame: CityAiGame;
  /** Lane this live game belongs to. When present, the banner and bottom
   *  tag carry a lane prefix ("1h", "6h", "12h") so the 3-lane structure
   *  is legible from a glance. Missing = legacy caller → original format. */
  slot?: RotationSlot;
}) {
  const top = GROUND - h;
  // Tighten the title budget when a lane prefix is present so the banner
  // doesn't run past the widened chip.
  const titleBudget = slot ? 8 : 10;
  const short =
    aiGame.title.length > titleBudget
      ? aiGame.title.slice(0, titleBudget) + "…"
      : aiGame.title;
  const r = recipeFor(aiGame.id);
  const laneLabel = slot ? SLOT_LABEL[slot] : null;
  const bannerText = laneLabel
    ? `🤖 ${laneLabel} · ${short.toUpperCase()}`
    : `🤖 ${short.toUpperCase()}`;
  // Widen the banner only when a lane prefix is added, so legacy single-
  // lane callers keep the original width they were designed around.
  const bannerW = laneLabel ? 102 : 88;
  const bannerDx = bannerW / 2;
  // V4-UX-2026-04-25: AI buildings now respect plays/bestScore for the
  // lit/silhouette toggle, just like evergreen buildings. Without this
  // every AI slot stayed neon-bright on first visit, contradicting the
  // "play to light up your city" copy. CSS attribute hook lets pko skin
  // dim further; under core skin the data-powered attribute is just
  // metadata (no rule applies).
  const aiPowered = (aiGame.bestScore ?? 0) > 0;
  return (
    <g
      className="ai-building transition-[filter] duration-300"
      data-powered={String(aiPowered)}
      style={{
        filter: aiPowered ? "none" : "saturate(0.25) brightness(0.55)",
      }}
    >
      {/* Pillar layout above the roof — stacked vertically with explicit
          gaps so the countdown chip + title banner never touch. Prior
          layout (countdown at top-52, banner at top-34) left only a
          4-px SVG gap that collapsed at render scale, producing the
          visible overlap reported by user. New layout gives each
          element ≥10-px breathing room and keeps the antenna long
          enough to reach the roof. */}

      {/* live countdown chip — client-ticks every second */}
      <g transform={`translate(${x + w / 2 - 22}, ${top - 70})`}>
        <rect
          x={0}
          y={0}
          width={44}
          height={14}
          fill="#0a0a0f"
          stroke={r.roofColor}
          strokeWidth={1.5}
          rx={2}
        />
        <LiveCountdown validUntil={aiGame.validUntil} color={r.roofColor} />
      </g>

      {/* banner with title — 42 px below countdown top (countdown bottom
          at top-56, banner top at top-46 → 10 px clear gap) */}
      <g transform={`translate(${x + w / 2 - bannerDx}, ${top - 46})`}>
        <rect x={0} y={0} width={bannerW} height={18} fill="#fde047" stroke="#0a0a0f" strokeWidth={2} rx={2} />
        <text x={bannerDx} y={12} textAnchor="middle" fontSize={8} fontWeight={900} fill="#0a0a0f">
          {bannerText}
        </text>
      </g>

      {/* antenna — extends from the roof up to just below the banner */}
      <line x1={x + w / 2} y1={top - 10} x2={x + w / 2} y2={top - 28} stroke="#0a0a0f" strokeWidth={3} />
      <circle cx={x + w / 2} cy={top - 30} r={4} fill={r.roofColor} />

      {/* roof (per-id silhouette) */}
      <RoofShape x={x} w={w} top={top} shape={r.roofShape} color={r.roofColor} />

      {/* body */}
      <rect x={x} y={top} width={w} height={h} fill={r.bodyColor} stroke="#0a0a0f" strokeWidth={3} />

      {/* windows (per-id pattern) */}
      <AiWindows
        x={x}
        w={w}
        top={top}
        h={h}
        pattern={r.windowPattern}
        colorA={r.windowA}
        colorB={r.windowB}
      />

      {/* glyph centered */}
      {aiGame.glyph && (
        <text
          x={x + w / 2}
          y={top + h / 2 + 14}
          textAnchor="middle"
          fontSize={36}
          style={{ filter: "drop-shadow(0 2px 0 #000)" }}
        >
          {aiGame.glyph}
        </text>
      )}

      {/* door */}
      <rect x={x + w / 2 - 10} y={GROUND - 22} width={20} height={22} fill="#111" stroke="#0a0a0f" strokeWidth={2} />
      <rect x={x + w / 2 - 7} y={GROUND - 19} width={14} height={18} fill="#fde047" />

      {/* LIVE badge bottom */}
      <g transform={`translate(${x + w / 2 - 18}, ${GROUND - 50})`}>
        <rect width={36} height={20} fill={r.roofColor} stroke="#0a0a0f" strokeWidth={2} rx={2} />
        <text x={18} y={14} textAnchor="middle" fontSize={9} fontWeight={900} fill="#0a0a0f">
          LIVE
        </text>
      </g>

      {/* WattMeter */}
      {aiGame.cap && aiGame.cap > 0 && (
        <WattMeter x={x} y={GROUND + 8} w={w} value={aiGame.bestScore ?? 0} cap={aiGame.cap} />
      )}

      {/* Ground-anchored street sign. `y` is computed from GROUND (not
          from the per-slot building top) so all three AI slots' tags sit
          on the same row regardless of AI_SLOT_HEIGHTS. Slot-keyed label
          teaches the user the lane identity; the envelope id is relegated
          to the <title> tooltip above the Link. */}
      <rect x={x} y={GROUND + 22} width={w} height={16} fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} rx={2} />
      <text x={x + w / 2} y={GROUND + 33} textAnchor="middle" fontSize={8} fontWeight={900} fill={r.roofColor}>
        {slot ? SLOT_GROUND_TAG[slot] : `AI · ${aiGame.id.replace("ai-", "").toUpperCase()}`}
      </text>
    </g>
  );
}

function Printshop({ x, w, h, powered, bestScore, cap, name }: DrawProps) {
  const top = GROUND - h;
  // chimney on the right
  return (
    <g>
      <NeonSign x={x + w / 2} y={top - 14} text={name} powered={powered} />
      {/* chimney */}
      <rect x={x + w - 24} y={top - 50} width={16} height={50} fill="#44403c" stroke="#0a0a0f" strokeWidth={3} />
      <rect x={x + w - 28} y={top - 54} width={24} height={6} fill="#1c1917" stroke="#0a0a0f" strokeWidth={2} />
      {/* smoke puffs */}
      {powered &&
        [0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={x + w - 14 + (i % 2) * 6}
            cy={top - 68 - i * 16}
            r={8 + i * 2}
            fill="#94a3b8"
            opacity={0.5 - i * 0.12}
          />
        ))}

      {/* sawtooth roof */}
      {Array.from({ length: 4 }).map((_, i) => {
        const sx = x + i * ((w - 10) / 4);
        const sw = (w - 10) / 4;
        return (
          <polygon
            key={i}
            points={`${sx},${top + 20} ${sx + sw / 2},${top - 4} ${sx + sw},${top + 20}`}
            fill="#a21caf"
            stroke="#0a0a0f"
            strokeWidth={2}
          />
        );
      })}
      <rect x={x} y={top + 18} width={w} height={h - 18} fill="#c026d3" stroke="#0a0a0f" strokeWidth={3} />
      {/* large factory windows */}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 4 }).map((__, c) => {
          const wx = x + 8 + c * ((w - 16) / 4);
          const wy = top + 30 + r * 30;
          const lit = powered && (r * 7 + c) % 4 !== 0;
          return (
            <rect
              key={`${r}-${c}`}
              x={wx}
              y={wy}
              width={(w - 20) / 4}
              height={22}
              fill={lit ? "#fde047" : "#2a0a2e"}
              stroke="#0a0a0f"
              strokeWidth={1.5}
            />
          );
        }),
      )}
      <WattMeter x={x} y={GROUND + 8} w={w} value={bestScore} cap={cap} />
    </g>
  );
}

/* ---------- Tiny reusable subprimitives ---------- */

function NeonSign({
  x,
  y,
  text,
  powered,
  small,
}: {
  x: number;
  y: number;
  text: string;
  powered: boolean;
  small?: boolean;
}) {
  const fontSize = small ? 9 : 10;
  const pad = small ? 4 : 6;
  const width = Math.max(40, text.length * (small ? 5.2 : 6)) + pad * 2;
  return (
    <g transform={`translate(${x - width / 2}, ${y - (small ? 10 : 12)})`}>
      <rect
        width={width}
        height={small ? 12 : 14}
        fill="#0a0a0f"
        stroke="#0a0a0f"
        strokeWidth={2}
        rx={2}
      />
      <text
        x={width / 2}
        y={small ? 9 : 10}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={900}
        fill={powered ? "#fde047" : "#3f3f46"}
        style={{ letterSpacing: 0.5 }}
      >
        {text}
      </text>
      {powered && (
        <rect
          x={-2}
          y={-2}
          width={width + 4}
          height={(small ? 12 : 14) + 4}
          fill="none"
          stroke="#fde047"
          strokeWidth={1}
          opacity={0.35}
          rx={3}
        />
      )}
    </g>
  );
}

function WattMeter({
  x,
  y,
  w,
  value,
  cap,
}: {
  x: number;
  y: number;
  w: number;
  value: number;
  cap: number;
}) {
  if (cap <= 0) return null;
  const pct = Math.min(1, value / cap);
  // R-09 — `class="watt-meter"` opts the inner fill out of the
  // global `[fill="#fde047"]` retint (see globals.css). The
  // attribute selector matches all neon-yellow fills inside the
  // city scene EXCEPT elements bearing this class — keeps the
  // best-score progress meter visibly yellow on the pko skin
  // (it is a UI signal, not a decorative window).
  return (
    <g>
      <rect x={x} y={y} width={w} height={8} fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} rx={2} />
      <rect
        className="watt-meter"
        x={x + 1}
        y={y + 1}
        width={(w - 2) * pct}
        height={6}
        fill="#fde047"
      />
    </g>
  );
}

/* ---------- Decorative data ---------- */

const STARS: { x: number; y: number; r: number; o: number; big?: boolean }[] = [
  { x: 80, y: 60, r: 1.5, o: 0.8 },
  { x: 140, y: 120, r: 1, o: 0.6 },
  { x: 220, y: 40, r: 1.8, o: 0.9, big: true },
  { x: 320, y: 90, r: 1.2, o: 0.7 },
  { x: 400, y: 30, r: 1.6, o: 0.85 },
  { x: 500, y: 110, r: 1, o: 0.55 },
  { x: 560, y: 50, r: 1.3, o: 0.8 },
  { x: 640, y: 140, r: 1.7, o: 0.9, big: true },
  { x: 720, y: 60, r: 1.1, o: 0.65 },
  { x: 820, y: 30, r: 1.5, o: 0.8 },
  { x: 900, y: 140, r: 1.2, o: 0.7 },
  { x: 980, y: 50, r: 1.5, o: 0.85 },
  { x: 1080, y: 170, r: 1, o: 0.55 },
  { x: 1160, y: 110, r: 1.6, o: 0.9, big: true },
  { x: 1260, y: 40, r: 1.2, o: 0.7 },
  { x: 1340, y: 180, r: 1.1, o: 0.6 },
];

const BACK_SILHOUETTES: { x: number; w: number; h: number }[] = [
  { x: 0, w: 80, h: 180 },
  { x: 80, w: 60, h: 240 },
  { x: 320, w: 120, h: 160 },
  { x: 460, w: 80, h: 220 },
  { x: 680, w: 140, h: 150 },
  { x: 860, w: 90, h: 210 },
  { x: 980, w: 110, h: 170 },
  { x: 1180, w: 70, h: 230 },
  { x: 1260, w: 140, h: 160 },
];
