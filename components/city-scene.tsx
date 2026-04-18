import Link from "next/link";
import { type GameMeta } from "@/lib/games";

// Night panorama of Katowice — SVG viewBox is `VB_W x VB_H`. Buildings are
// placed on a ground line at `GROUND`. Each game gets a unique silhouette.

const VB_W = 1500;
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
};

type Props = {
  games?: CityGameState[];
  loggedIn?: boolean;
  interactive?: boolean; // true for the /games hub, false for previews
  compact?: boolean;     // smaller height
  aiGame?: CityAiGame;   // if set, construction site links to /games/ai/[id]
};

export function CityScene({
  games,
  loggedIn = false,
  interactive = true,
  compact = false,
  aiGame,
}: Props) {
  const map = new Map(games?.map((g) => [g.meta.id, g]) ?? []);
  const get = (id: string) => map.get(id);

  return (
    <div
      className="relative w-full rounded-2xl border-[3px] border-[var(--ink)] overflow-hidden shadow-[6px_6px_0_0_var(--ink)]"
      style={{
        background: "#07071a",
        aspectRatio: `${VB_W} / ${VB_H}`,
        maxHeight: compact ? 360 : 560,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Nočná panoráma Katowíc: 9 budov predstavujúcich minihry XP Arény"
      >
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

        {/* Moon + glow */}
        <circle cx={VB_W - 160} cy={100} r={120} fill="url(#moonGlow)" />
        <circle
          cx={VB_W - 160}
          cy={100}
          r={52}
          fill="#f8fafc"
          stroke="#0a0a0f"
          strokeWidth={3}
        />
        <circle cx={VB_W - 180} cy={85} r={9} fill="#e2e8f0" />
        <circle cx={VB_W - 145} cy={120} r={6} fill="#cbd5e1" />
        <circle cx={VB_W - 135} cy={80} r={4} fill="#cbd5e1" />

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

        {/* Construction site for the "AI game of the day" slot */}
        <ConstructionSlot
          plan={CONSTRUCTION}
          interactive={interactive}
          aiGame={aiGame}
        />

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
          if (!interactive) return <g key={b.gameId}>{slot}</g>;
          const label = `${b.title} — ${b.buildingName}${
            loggedIn && g ? ` · rekord ${g.bestScore}/${b.cap} W` : ""
          }`;
          return (
            <Link
              key={b.gameId}
              href={`/games/${b.gameId}`}
              aria-label={label}
            >
              <g className="building-link" data-powered={powered}>
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
    title: "Finančný kvíz",
    buildingName: "Biblioteka Śląska",
    x: 40,
    w: 180,
    h: 180,
    cap: 100,
    draw: Library,
  },
  {
    gameId: "stock-tap",
    title: "Stock Tap",
    buildingName: "PKO Tower",
    x: 240,
    w: 110,
    h: 300,
    cap: 220,
    draw: Tower,
  },
  {
    gameId: "memory-match",
    title: "Pamäťové páry",
    buildingName: "Muzeum Śląskie",
    x: 370,
    w: 150,
    h: 170,
    cap: 160,
    draw: Museum,
  },
  {
    gameId: "math-sprint",
    title: "Matematický šprint",
    buildingName: "Instytut Matematyki",
    x: 540,
    w: 140,
    h: 190,
    cap: 200,
    draw: Institute,
  },
  {
    gameId: "energy-dash",
    title: "Energy Dash",
    buildingName: "Silesia Solar Farm",
    x: 700,
    w: 220,
    h: 130,
    cap: 220,
    draw: SolarFarm,
  },
  {
    gameId: "power-flip",
    title: "Power Flip",
    buildingName: "Dom LED",
    x: 940,
    w: 90,
    h: 140,
    cap: 180,
    draw: LEDHouse,
  },
  {
    gameId: "currency-rush",
    title: "Kurzový šprint",
    buildingName: "Kantor Rynek",
    x: 1050,
    w: 70,
    h: 120,
    cap: 180,
    draw: ExchangeBooth,
  },
  {
    gameId: "budget-balance",
    title: "Budget Balance",
    buildingName: "PKO Oddział",
    x: 1140,
    w: 120,
    h: 170,
    cap: 160,
    draw: BankBranch,
  },
  {
    gameId: "word-scramble",
    title: "Premiešané slová",
    buildingName: "Drukarnia",
    x: 1260,
    w: 100,
    h: 200,
    cap: 120,
    draw: Printshop,
  },
];

const CONSTRUCTION: Plan = {
  gameId: "__coming-soon__",
  title: "AI výzva dňa",
  buildingName: "Stavenisko",
  x: 1370,
  w: 70,
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
      className="transition-transform duration-200"
      style={{
        filter: powered ? "none" : "saturate(0.35) brightness(0.6)",
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

function ConstructionSite({ x, w, h, name }: DrawProps) {
  // AI-generated "game of the day" placeholder. Scaffolding, caution tape,
  // crane, AI badge. Click leads to /sin-slavy (today's challenge).
  const top = GROUND - h;
  return (
    <g>
      {/* banner sign */}
      <g transform={`translate(${x + w / 2 - 42}, ${top - 26})`}>
        <rect x={0} y={0} width={84} height={18} fill="#0a0a0f" stroke="#fde047" strokeWidth={2} rx={2} />
        <text x={42} y={12} textAnchor="middle" fontSize={9} fontWeight={900} fill="#fde047">
          🤖 AI VÝZVA
        </text>
      </g>
      {/* crane */}
      <g transform={`translate(${x + w / 2 - 4}, ${top - 10})`}>
        <rect x={0} y={0} width={6} height={80} fill="#a16207" stroke="#0a0a0f" strokeWidth={2} />
        <g className="crane-arm" transform="translate(0,0)">
          <rect x={-30} y={-2} width={60} height={6} fill="#a16207" stroke="#0a0a0f" strokeWidth={2} />
          <line x1={22} y1={4} x2={22} y2={22} stroke="#0a0a0f" strokeWidth={1.5} />
          <rect x={18} y={22} width={8} height={8} fill="#fde047" stroke="#0a0a0f" strokeWidth={1.5} />
        </g>
      </g>
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
      {/* AI badge */}
      <g transform={`translate(${x + w / 2 - 18}, ${GROUND - 50})`}>
        <rect width={36} height={20} fill="#fde047" stroke="#0a0a0f" strokeWidth={2} rx={2} />
        <text x={18} y={14} textAnchor="middle" fontSize={9} fontWeight={900} fill="#0a0a0f">
          SOON
        </text>
      </g>
      {/* sign at bottom */}
      <rect x={x} y={GROUND + 4} width={w} height={16} fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} rx={2} />
      <text x={x + w / 2} y={GROUND + 15} textAnchor="middle" fontSize={8} fontWeight={900} fill="#fde047">
        STAVENISKO
      </text>
    </g>
  );
}

function ConstructionSlot({
  plan,
  interactive,
  aiGame,
}: {
  plan: Plan;
  interactive: boolean;
  aiGame?: CityAiGame;
}) {
  const live = Boolean(aiGame);
  const slot = live ? (
    <LiveAiBuilding
      x={plan.x}
      w={plan.w}
      h={plan.h}
      aiGame={aiGame!}
    />
  ) : (
    plan.draw({
      x: plan.x,
      w: plan.w,
      h: plan.h,
      powered: false,
      bestScore: 0,
      cap: 0,
      name: plan.buildingName,
    })
  );
  if (!interactive) return <g>{slot}</g>;
  const href = aiGame ? `/games/ai/${aiGame.id}` : "/sin-slavy";
  const label = aiGame
    ? `AI výzva dňa — ${aiGame.title}`
    : "AI výzva dňa — coming soon";
  const title = aiGame
    ? `AI výzva dňa · hrateľná — ${aiGame.title}`
    : "AI výzva dňa · zatiaľ vo výstavbe";
  return (
    <Link href={href} aria-label={label}>
      <g className="building-link" data-powered={live}>
        <title>{title}</title>
        <rect
          x={plan.x - 6}
          y={GROUND - plan.h - 30}
          width={plan.w + 12}
          height={plan.h + 60}
          fill="transparent"
          pointerEvents="all"
        />
        {slot}
      </g>
    </Link>
  );
}

function LiveAiBuilding({
  x,
  w,
  h,
  aiGame,
}: {
  x: number;
  w: number;
  h: number;
  aiGame: CityAiGame;
}) {
  const top = GROUND - h;
  const hoursLeft = Math.max(
    0,
    Math.round((aiGame.validUntil - Date.now()) / (60 * 60 * 1000)),
  );
  const short = aiGame.title.length > 10
    ? aiGame.title.slice(0, 10) + "…"
    : aiGame.title;
  const rows = 9;
  return (
    <g>
      {/* hours-left chip above roof */}
      <g transform={`translate(${x + w / 2 - 22}, ${top - 44})`}>
        <rect
          x={0}
          y={0}
          width={44}
          height={14}
          fill="#0a0a0f"
          stroke="#ec4899"
          strokeWidth={1.5}
          rx={2}
        />
        <text
          x={22}
          y={10}
          textAnchor="middle"
          fontSize={8}
          fontWeight={900}
          fill="#ec4899"
        >
          ⏱ {hoursLeft}h
        </text>
      </g>

      {/* banner with title */}
      <g transform={`translate(${x + w / 2 - 44}, ${top - 26})`}>
        <rect
          x={0}
          y={0}
          width={88}
          height={18}
          fill="#fde047"
          stroke="#0a0a0f"
          strokeWidth={2}
          rx={2}
        />
        <text
          x={44}
          y={12}
          textAnchor="middle"
          fontSize={8}
          fontWeight={900}
          fill="#0a0a0f"
        >
          🤖 {short.toUpperCase()}
        </text>
      </g>

      {/* antenna */}
      <line
        x1={x + w / 2}
        y1={top - 4}
        x2={x + w / 2}
        y2={top - 22}
        stroke="#0a0a0f"
        strokeWidth={3}
      />
      <circle cx={x + w / 2} cy={top - 24} r={4} fill="#ec4899" />

      {/* roof strip — pink accent */}
      <rect
        x={x - 5}
        y={top - 6}
        width={w + 10}
        height={10}
        fill="#0a0a0f"
      />
      <rect
        x={x - 2}
        y={top - 4}
        width={w + 4}
        height={6}
        fill="#ec4899"
      />

      {/* body — deep violet so it stands out against other buildings */}
      <rect
        x={x}
        y={top}
        width={w}
        height={h}
        fill="#1e1b4b"
        stroke="#0a0a0f"
        strokeWidth={3}
      />

      {/* glowing windows */}
      {Array.from({ length: rows }).map((_, row) => {
        const wy = top + 14 + row * ((h - 40) / rows);
        return (
          <g key={row}>
            <rect
              x={x + 8}
              y={wy}
              width={w / 2 - 12}
              height={7}
              fill="#fde047"
              stroke="#0a0a0f"
              strokeWidth={1}
            />
            <rect
              x={x + w / 2 + 4}
              y={wy}
              width={w / 2 - 12}
              height={7}
              fill="#22d3ee"
              stroke="#0a0a0f"
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* glyph centered on façade */}
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
      <rect
        x={x + w / 2 - 10}
        y={GROUND - 22}
        width={20}
        height={22}
        fill="#111"
        stroke="#0a0a0f"
        strokeWidth={2}
      />
      <rect
        x={x + w / 2 - 7}
        y={GROUND - 19}
        width={14}
        height={18}
        fill="#fde047"
      />

      {/* LIVE badge bottom */}
      <g transform={`translate(${x + w / 2 - 18}, ${GROUND - 50})`}>
        <rect
          width={36}
          height={20}
          fill="#ec4899"
          stroke="#0a0a0f"
          strokeWidth={2}
          rx={2}
        />
        <text
          x={18}
          y={14}
          textAnchor="middle"
          fontSize={9}
          fontWeight={900}
          fill="#0a0a0f"
        >
          LIVE
        </text>
      </g>

      {/* WattMeter — user's best score on this AI game */}
      {aiGame.cap && aiGame.cap > 0 && (
        <WattMeter
          x={x}
          y={GROUND + 8}
          w={w}
          value={aiGame.bestScore ?? 0}
          cap={aiGame.cap}
        />
      )}

      {/* street sign */}
      <rect
        x={x}
        y={GROUND + 22}
        width={w}
        height={16}
        fill="#0a0a0f"
        stroke="#0a0a0f"
        strokeWidth={2}
        rx={2}
      />
      <text
        x={x + w / 2}
        y={GROUND + 33}
        textAnchor="middle"
        fontSize={8}
        fontWeight={900}
        fill="#ec4899"
      >
        AI · {aiGame.id.replace("ai-", "").toUpperCase()}
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
  return (
    <g>
      <rect x={x} y={y} width={w} height={8} fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} rx={2} />
      <rect x={x + 1} y={y + 1} width={(w - 2) * pct} height={6} fill="#fde047" />
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
