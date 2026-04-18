"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORY_ACCENTS,
  CATEGORY_LABELS,
  type GameCategory,
  type GameMeta,
} from "@/lib/games";

export type HubGame = GameMeta & {
  bestScore: number;
  plays: number;
  lastPlayedAt: number;
};

type Props = {
  games: HubGame[];
  loggedIn: boolean;
};

type Filter = GameCategory | "all";

export function GamesHub({ games, loggedIn }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo<Filter[]>(() => {
    const present = new Set<GameCategory>();
    games.forEach((g) => present.add(g.category));
    return ["all", ...Array.from(present)];
  }, [games]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => {
      if (filter !== "all" && g.category !== filter) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    });
  }, [games, filter, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
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
              {c === "all" ? "Všetko" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Vyhľadať hru</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hľadať hru…"
            className="input pl-9"
          />
          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          >
            ⌕
          </span>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-zinc-400">
          Nenašla sa žiadna hra pre „{query}".
        </div>
      ) : (
        <div
          key={`${filter}-${query}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {visible.map((g) => (
            <div key={g.id} className="stagger-item">
              <GameCard game={g} loggedIn={loggedIn} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game, loggedIn }: { game: HubGame; loggedIn: boolean }) {
  const percentOfCap = game.bestScore
    ? Math.min(100, Math.round((game.bestScore / game.xpCap) * 100))
    : 0;

  return (
    <Link
      href={`/games/${game.id}`}
      className="relative card game-tile p-5 flex flex-col gap-4 h-full"
    >
      {game.isNew && <span className="new-badge">Nové</span>}
      {game.hot && <span className="hot-badge">🔥 Hot</span>}
      <div
        className={`relative h-24 rounded-xl bg-gradient-to-br ${game.accent} overflow-hidden`}
      >
        <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-90 group-hover:scale-110 transition-transform">
          {game.emoji}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">{game.title}</h3>
        <span className={`chip text-xs ${CATEGORY_ACCENTS[game.category]}`}>
          {CATEGORY_LABELS[game.category]}
        </span>
      </div>
      <p className="text-sm text-zinc-400 flex-1">{game.tagline}</p>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>⏱ {game.durationLabel}</span>
        <span>max {game.xpCap} W</span>
      </div>
      {loggedIn && game.plays > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Tvoj rekord</span>
            <span className="font-mono font-semibold text-[var(--accent)]">
              {game.bestScore}/{game.xpCap} W
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
              style={{ width: `${percentOfCap}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500">
            {game.plays} {game.plays === 1 ? "kolo" : "kôl"} odohratých
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500">
          {loggedIn ? "Ešte si nehral" : "Prihlás sa pre uloženie skóre"}
        </div>
      )}
    </Link>
  );
}
