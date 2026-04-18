import { CITY_TIERS } from "@/lib/level";

// Silueta „tvojej" budovy, rastúca podľa tieru. Jeden SVG, 9 variantov
// kreslení priamo. Reálne poľské ikony od Nikiszowca po Varso Tower.

type Props = {
  level: number;
  progress: number; // 0..1 to next tier
};

export function PlayerBuilding({ level, progress }: Props) {
  const clamped = Math.max(1, Math.min(9, level));
  return (
    <div className="relative w-full rounded-2xl border-[3px] border-[var(--ink)] overflow-hidden shadow-[6px_6px_0_0_var(--ink)]">
      <svg
        viewBox="0 0 360 280"
        preserveAspectRatio="xMidYMax meet"
        className="block w-full h-full"
        style={{ aspectRatio: "360 / 280", background: "#0f0f24" }}
        role="img"
        aria-label={`Tvoja budova: tier ${clamped} — ${CITY_TIERS[clamped - 1].full}`}
      >
        <defs>
          <linearGradient id="pbSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06051d" />
            <stop offset="60%" stopColor="#1e1856" />
            <stop offset="100%" stopColor="#311b74" />
          </linearGradient>
        </defs>
        {/* sky */}
        <rect x="0" y="0" width="360" height="240" fill="url(#pbSky)" />
        {/* stars */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fffbe6" opacity={s.o} />
        ))}
        {/* moon */}
        <circle cx="310" cy="50" r="20" fill="#f8fafc" stroke="#0a0a0f" strokeWidth={2} />
        <circle cx="302" cy="42" r="3" fill="#cbd5e1" />
        <circle cx="315" cy="56" r="2" fill="#cbd5e1" />
        {/* ground */}
        <rect x="0" y="240" width="360" height="40" fill="#0a0a0f" />
        <rect
          x="0"
          y="252"
          width="360"
          height="8"
          fill="transparent"
          stroke="#fde047"
          strokeDasharray="12 8"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Build the structure centered at x=180, ground y=240 */}
        {renderBuilding(clamped)}

        {/* progress overlay bar at bottom */}
        <g>
          <rect x="24" y="260" width="312" height="10" fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} rx={2} />
          <rect
            x="26"
            y="262"
            width={Math.max(0, (312 - 4) * progress)}
            height={6}
            fill="#fde047"
          />
        </g>
      </svg>
    </div>
  );
}

/* ---------- Building variants ---------- */

function renderBuilding(level: number): React.ReactNode {
  switch (level) {
    case 1:
      return <Shed />;
    case 2:
      return <WorkersHouse />;
    case 3:
      return <FamilyHouse />;
    case 4:
      return <Tenement />;
    case 5:
      return <SolarBlock />;
    case 6:
      return <OfficeBlock />;
    case 7:
      return <MidSkyscraper />;
    case 8:
      return <Altus />;
    case 9:
    default:
      return <Varso />;
  }
}

function Shed() {
  return (
    <g>
      {/* ground shadow */}
      <ellipse cx="180" cy="240" rx="60" ry="6" fill="#000" opacity={0.5} />
      {/* Simple wooden shed: body + pitched roof + door */}
      <polygon points="140,200 180,170 220,200" fill="#7c3f1d" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="150" y="200" width="60" height="40" fill="#92400e" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="170" y="215" width="20" height="25" fill="#1a0c03" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="157" y="208" width="10" height="8" fill="#fde047" stroke="#0a0a0f" strokeWidth={1} />
      {/* smoke from chimney */}
      <rect x="202" y="180" width="6" height="10" fill="#44403c" stroke="#0a0a0f" strokeWidth={1.5} />
      <circle cx="205" cy="176" r="4" fill="#52525b" opacity={0.6} />
      <circle cx="208" cy="170" r="5" fill="#52525b" opacity={0.4} />
    </g>
  );
}

function WorkersHouse() {
  return (
    <g>
      <ellipse cx="180" cy="240" rx="80" ry="6" fill="#000" opacity={0.5} />
      {/* Nikiszowiec red-brick 2-floor row house */}
      <polygon points="110,180 180,150 250,180" fill="#b91c1c" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="115" y="180" width="130" height="60" fill="#dc2626" stroke="#0a0a0f" strokeWidth={3} />
      {/* brick pattern */}
      {[192, 202, 212, 222].map((y) => (
        <line key={y} x1="115" y1={y} x2="245" y2={y} stroke="#0a0a0f" strokeWidth={1} opacity={0.3} />
      ))}
      {/* windows */}
      <rect x="128" y="192" width="20" height="18" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="212" y="192" width="20" height="18" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="170" y="192" width="20" height="18" fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} />
      {/* door */}
      <rect x="172" y="215" width="16" height="25" fill="#3f1d0e" stroke="#0a0a0f" strokeWidth={2} />
    </g>
  );
}

function FamilyHouse() {
  return (
    <g>
      <ellipse cx="180" cy="240" rx="90" ry="7" fill="#000" opacity={0.5} />
      <polygon points="105,170 180,130 255,170" fill="#991b1b" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="112" y="170" width="136" height="70" fill="#f43f5e" stroke="#0a0a0f" strokeWidth={3} />
      {/* floor windows */}
      {[125, 175, 215].map((x) => (
        <rect key={`t-${x}`} x={x} y="182" width="22" height="20" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      ))}
      {/* mid row */}
      {[125, 215].map((x) => (
        <rect key={`b-${x}`} x={x} y="210" width="22" height="18" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      ))}
      {/* door */}
      <rect x="168" y="210" width="24" height="30" fill="#3f1d0e" stroke="#0a0a0f" strokeWidth={2} />
      <circle cx="187" cy="225" r="1.5" fill="#fde047" />
      {/* small dormer */}
      <polygon points="165,150 180,138 195,150" fill="#7f1d1d" stroke="#0a0a0f" strokeWidth={2} />
    </g>
  );
}

function Tenement() {
  // 4-floor street-front stone house, café on ground floor
  return (
    <g>
      <ellipse cx="180" cy="240" rx="95" ry="7" fill="#000" opacity={0.5} />
      <rect x="112" y="102" width="136" height="138" fill="#f59e0b" stroke="#0a0a0f" strokeWidth={3} />
      {/* cornice */}
      <rect x="108" y="95" width="144" height="10" fill="#b45309" stroke="#0a0a0f" strokeWidth={3} />
      {/* windows 3 cols × 3 rows */}
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => {
          const x = 124 + col * 38;
          const y = 115 + row * 30;
          const lit = (row + col) % 2 === 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={24}
              height={22}
              fill={lit ? "#fde047" : "#451a03"}
              stroke="#0a0a0f"
              strokeWidth={2}
            />
          );
        }),
      )}
      {/* ground floor café */}
      <rect x="112" y="205" width="136" height="35" fill="#7c2d12" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="125" y="213" width="45" height="24" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="180" y="213" width="55" height="27" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      <text x="150" y="228" textAnchor="middle" fontSize={8} fontWeight={900} fill="#0a0a0f">
        CAFÉ
      </text>
    </g>
  );
}

function SolarBlock() {
  return (
    <g>
      <ellipse cx="180" cy="240" rx="100" ry="7" fill="#000" opacity={0.5} />
      {/* main block */}
      <rect x="100" y="90" width="160" height="150" fill="#a3e635" stroke="#0a0a0f" strokeWidth={3} />
      {/* windows */}
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3].map((col) => {
          const x = 110 + col * 36;
          const y = 105 + row * 30;
          const lit = (row * 3 + col) % 5 !== 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={26}
              height={20}
              fill={lit ? "#fde047" : "#1a2e05"}
              stroke="#0a0a0f"
              strokeWidth={1.5}
            />
          );
        }),
      )}
      {/* roof with solar panels */}
      <rect x="96" y="82" width="168" height="12" fill="#064e3b" stroke="#0a0a0f" strokeWidth={3} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={100 + i * 27}
          y={68}
          width={24}
          height={14}
          fill="#38bdf8"
          stroke="#0a0a0f"
          strokeWidth={1.5}
        />
      ))}
      {/* EV charger */}
      <rect x="248" y="215" width="10" height="25" fill="#0891b2" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="250" y="218" width="6" height="8" fill="#fde047" />
    </g>
  );
}

function OfficeBlock() {
  return (
    <g>
      <ellipse cx="180" cy="240" rx="100" ry="7" fill="#000" opacity={0.5} />
      {/* 10-floor office */}
      <rect x="110" y="56" width="140" height="184" fill="#0891b2" stroke="#0a0a0f" strokeWidth={3} />
      {/* many windows */}
      {Array.from({ length: 9 }).flatMap((_, row) =>
        Array.from({ length: 5 }).map((__, col) => {
          const x = 118 + col * 25;
          const y = 66 + row * 19;
          const lit = (row * 2 + col * 3 + 5) % 7 !== 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={18}
              height={13}
              fill={lit ? "#fde047" : "#083344"}
              stroke="#0a0a0f"
              strokeWidth={1}
            />
          );
        }),
      )}
      {/* PKO band at top */}
      <rect x="106" y="48" width="148" height="12" fill="#fde047" stroke="#0a0a0f" strokeWidth={3} />
      <text x="180" y="58" textAnchor="middle" fontSize={9} fontWeight={900} fill="#0a0a0f">
        PKO BP
      </text>
      {/* lobby */}
      <rect x="156" y="215" width="48" height="25" fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="162" y="220" width="36" height="20" fill="#67e8f9" />
    </g>
  );
}

function MidSkyscraper() {
  return (
    <g>
      <ellipse cx="180" cy="240" rx="110" ry="7" fill="#000" opacity={0.5} />
      {/* tall skyscraper */}
      <rect x="125" y="30" width="110" height="210" fill="#6366f1" stroke="#0a0a0f" strokeWidth={3} />
      {/* roof helipad */}
      <rect x="121" y="24" width="118" height="8" fill="#0a0a0f" />
      <circle cx="180" cy="22" r="6" fill="#0a0a0f" stroke="#fde047" strokeWidth={2} />
      <text x="180" y="25" textAnchor="middle" fontSize={6} fontWeight={900} fill="#fde047">
        H
      </text>
      {/* rows of windows */}
      {Array.from({ length: 14 }).flatMap((_, row) =>
        Array.from({ length: 4 }).map((__, col) => {
          const x = 134 + col * 23;
          const y = 40 + row * 14;
          const lit = (row * 7 + col * 3 + 11) % 5 !== 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={16}
              height={8}
              fill={lit ? "#fde047" : "#1e1b4b"}
              stroke="#0a0a0f"
              strokeWidth={0.8}
            />
          );
        }),
      )}
      {/* entrance */}
      <rect x="168" y="215" width="24" height="25" fill="#0a0a0f" stroke="#0a0a0f" strokeWidth={2} />
      <rect x="172" y="218" width="16" height="22" fill="#fde047" />
    </g>
  );
}

function Altus() {
  // 125m Altus Tower (Katowice). Dominantný dvojitý telo so zaoblenou hranou
  return (
    <g>
      <ellipse cx="180" cy="240" rx="115" ry="7" fill="#000" opacity={0.5} />
      {/* stepped silhouette */}
      <rect x="105" y="140" width="60" height="100" fill="#a855f7" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="165" y="24" width="55" height="216" fill="#c084fc" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="220" y="100" width="35" height="140" fill="#a855f7" stroke="#0a0a0f" strokeWidth={3} />
      {/* antenna */}
      <rect x="189" y="6" width="6" height="18" fill="#0a0a0f" />
      <circle cx="192" cy="5" r="3" fill="#ef4444" className="caution-blink" />
      {/* main tower windows grid */}
      {Array.from({ length: 16 }).flatMap((_, row) =>
        Array.from({ length: 3 }).map((__, col) => {
          const x = 170 + col * 16;
          const y = 32 + row * 12;
          const lit = (row * 3 + col + 1) % 4 !== 0;
          return (
            <rect
              key={`m-${row}-${col}`}
              x={x}
              y={y}
              width={12}
              height={8}
              fill={lit ? "#fde047" : "#3b1970"}
              stroke="#0a0a0f"
              strokeWidth={0.7}
            />
          );
        }),
      )}
      {/* side blocks windows */}
      {Array.from({ length: 7 }).flatMap((_, row) =>
        [0, 1, 2].map((col) => {
          const x = 112 + col * 17;
          const y = 148 + row * 12;
          const lit = (row + col) % 2 === 0;
          return (
            <rect
              key={`l-${row}-${col}`}
              x={x}
              y={y}
              width={12}
              height={8}
              fill={lit ? "#fde047" : "#3b1970"}
              stroke="#0a0a0f"
              strokeWidth={0.7}
            />
          );
        }),
      )}
      {/* PKO neon on top band */}
      <rect x="165" y="22" width="55" height="10" fill="#0a0a0f" />
      <text x="192" y="30" textAnchor="middle" fontSize={8} fontWeight={900} fill="#fde047">
        PKO
      </text>
    </g>
  );
}

function Varso() {
  // 310m Varso Tower, tallest building in the EU. Spire on top.
  return (
    <g>
      <ellipse cx="180" cy="240" rx="120" ry="7" fill="#000" opacity={0.5} />
      {/* base podium */}
      <rect x="100" y="200" width="160" height="40" fill="#18181b" stroke="#0a0a0f" strokeWidth={3} />
      {/* main shaft */}
      <rect x="150" y="30" width="60" height="210" fill="#27272a" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="142" y="60" width="76" height="180" fill="#3f3f46" stroke="#0a0a0f" strokeWidth={3} />
      {/* signature spire */}
      <polygon points="180,30 175,14 180,-6 185,14" fill="#0a0a0f" stroke="#fde047" strokeWidth={1.5} />
      <rect x="178" y="-8" width="4" height="8" fill="#fde047" />
      <circle cx="180" cy="-10" r="3" fill="#ef4444" className="caution-blink" />
      {/* windows grid - full height */}
      {Array.from({ length: 30 }).flatMap((_, row) =>
        Array.from({ length: 4 }).map((__, col) => {
          const x = 148 + col * 16;
          const y = 38 + row * 5.5;
          const lit = (row * 7 + col * 13 + 19) % 6 !== 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={12}
              height={3.2}
              fill={lit ? "#fde047" : "#18181b"}
              stroke="#0a0a0f"
              strokeWidth={0.4}
            />
          );
        }),
      )}
      {/* flanking stubs */}
      <rect x="106" y="180" width="30" height="60" fill="#18181b" stroke="#0a0a0f" strokeWidth={3} />
      <rect x="224" y="180" width="30" height="60" fill="#18181b" stroke="#0a0a0f" strokeWidth={3} />
      {/* lobby glow */}
      <rect x="160" y="215" width="40" height="25" fill="#fde047" stroke="#0a0a0f" strokeWidth={2} />
      <text x="180" y="230" textAnchor="middle" fontSize={9} fontWeight={900} fill="#0a0a0f">
        VARSO
      </text>
    </g>
  );
}

/* ---------- Stars for the sky ---------- */

const STARS = [
  { x: 30, y: 40, r: 1, o: 0.8 },
  { x: 70, y: 20, r: 1.3, o: 0.9 },
  { x: 120, y: 50, r: 0.9, o: 0.6 },
  { x: 80, y: 80, r: 1, o: 0.7 },
  { x: 240, y: 30, r: 1.2, o: 0.85 },
  { x: 270, y: 90, r: 0.9, o: 0.6 },
  { x: 330, y: 110, r: 1, o: 0.7 },
  { x: 200, y: 60, r: 0.8, o: 0.5 },
  { x: 50, y: 110, r: 1, o: 0.6 },
  { x: 150, y: 140, r: 0.8, o: 0.5 },
];
