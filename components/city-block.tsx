"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  type BuildingShape,
  type GameCategory,
  type GameMeta,
} from "@/lib/games";

export type CityGame = GameMeta & {
  bestScore: number;
  plays: number;
  lastPlayedAt: number;
};

type Props = {
  games: CityGame[];
  loggedIn: boolean;
};

type Filter = GameCategory | "all";

function shapeToGrid(shape: BuildingShape): string {
  // mobile: full-width; small: 2 cols; lg: 6 cols skyline
  switch (shape) {
    case "wide":
      return "col-span-1 sm:col-span-2 lg:col-span-3 row-span-1";
    case "tall":
      return "col-span-1 sm:col-span-1 lg:col-span-2 row-span-2";
    case "narrow":
      return "col-span-1 row-span-1";
    case "standard":
    default:
      return "col-span-1 sm:col-span-1 lg:col-span-2 row-span-1";
  }
}

export function CityBlock({ games, loggedIn }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const categories = useMemo<Filter[]>(() => {
    const present = new Set<GameCategory>();
    games.forEach((g) => present.add(g.category));
    return ["all", ...Array.from(present)];
  }, [games]);

  const visible = useMemo(
    () =>
      games.filter((g) => filter === "all" || g.category === filter),
    [games, filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`chip cursor-pointer ${
              filter === c
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "hover:border-[var(--accent)]/40"
            }`}
          >
            {c === "all" ? "Všetky štvrte" : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Ground strip under the city so buildings look "planted" */}
      <div className="relative">
        <div
          key={filter}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[160px] sm:auto-rows-[180px] gap-4"
        >
          {visible.map((g) => (
            <div
              key={g.id}
              className={`${shapeToGrid(g.building.shape)} stagger-item`}
            >
              <BuildingTile game={g} loggedIn={loggedIn} />
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="mt-3 h-6 rounded-xl border-[3px] border-[var(--ink)] bg-zinc-700"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0 6px, transparent 6px 12px)",
          }}
        />
        <div
          aria-hidden="true"
          className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500"
        >
          <span>ul. Mariacka</span>
          <span>Katowice · Silesia</span>
        </div>
      </div>
    </div>
  );
}

function BuildingTile({
  game,
  loggedIn,
}: {
  game: CityGame;
  loggedIn: boolean;
}) {
  const powered = loggedIn && game.plays > 0;
  const pct = game.bestScore
    ? Math.min(100, Math.round((game.bestScore / game.xpCap) * 100))
    : 0;
  const shape = game.building.shape;
  const isTall = shape === "tall";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative h-full block rounded-2xl border-[3px] border-[var(--ink)] overflow-hidden shadow-[6px_6px_0_0_var(--ink)] hover:shadow-[9px_9px_0_0_var(--ink)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
    >
      {/* Badges */}
      {game.isNew && <span className="new-badge">Nové</span>}
      {game.hot && <span className="hot-badge">🔥 Hot</span>}

      {/* Roof */}
      <div
        className={`${game.building.roof} border-b-[3px] border-[var(--ink)] h-6 sm:h-7 relative`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(0,0,0,0.18) 0 6px, transparent 6px 12px)",
          }}
        />
      </div>

      {/* Body */}
      <div
        className={`relative ${game.building.body} h-[calc(100%-1.5rem)] sm:h-[calc(100%-1.75rem)]`}
      >
        {/* Big window / glyph */}
        <div
          className={`absolute inset-x-3 top-3 ${isTall ? "bottom-20" : "bottom-16"} rounded-lg border-[3px] border-[var(--ink)] bg-[#0a0a0f]/85 flex items-center justify-center overflow-hidden`}
        >
          <span
            className={`select-none ${
              isTall ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl"
            }`}
          >
            {game.building.glyph}
          </span>
          {/* window grid pattern */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Powered-on lamp in corner */}
        <span
          aria-hidden="true"
          title={powered ? "Rozsvietené" : "Zhasnuté"}
          className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-[var(--ink)] ${
            powered
              ? "bg-[var(--neo-yellow)] shadow-[0_0_10px_2px_var(--neo-yellow)]"
              : "bg-zinc-700"
          }`}
        />

        {/* Sign board at the bottom */}
        <div className="absolute left-2 right-2 bottom-2 bg-[#0a0a0f] border-[3px] border-[var(--ink)] rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-[3px_3px_0_0_var(--ink)]">
          <span className="text-lg leading-none">{game.building.sign}</span>
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              {game.building.role}
            </span>
            <span className="font-black truncate text-sm">
              {game.building.name}
            </span>
          </div>
          <span className="hidden sm:inline text-[10px] font-mono text-zinc-500">
            {game.durationLabel}
          </span>
        </div>

        {/* Watt meter overlay (only if played) */}
        {powered && (
          <div
            aria-hidden="true"
            className="absolute inset-x-2 bottom-[3.25rem] h-1.5 rounded-full bg-black/60 border border-[var(--ink)] overflow-hidden"
            title={`${game.bestScore}/${game.xpCap} W`}
          >
            <div
              className="h-full bg-[var(--neo-yellow)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Mini title overlay top-left (for quick scan) */}
        <span className="absolute top-2 left-2 bg-[#0a0a0f] border-2 border-[var(--ink)] rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
          {game.title}
        </span>
      </div>
    </Link>
  );
}
