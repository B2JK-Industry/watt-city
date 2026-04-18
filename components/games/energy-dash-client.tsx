"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import {
  ComboBadge,
  FloatingFxLayer,
  comboMultiplier,
  useFloatingFx,
} from "@/components/games/fx";

const GAME_ID = "energy-dash";
const DURATION_SECONDS = 30;
const GRID_SIZE = 16; // 4x4
const BASE_CORRECT = 8;
const BASE_WRONG = 6;
const XP_CAP = 220;

type TileKind = "oze" | "fossil";
type Tile = {
  id: number;
  pos: number;
  kind: TileKind;
  icon: string;
  label: string;
  spawnedAt: number;
  ttl: number; // ms
};

const OZE = [
  { icon: "☀️", label: "Slnko" },
  { icon: "🌬️", label: "Vietor" },
  { icon: "💧", label: "Voda" },
  { icon: "🌱", label: "Biomasa" },
  { icon: "⚡", label: "Obnov. zdroj" },
];
const FOSSIL = [
  { icon: "🛢️", label: "Ropa" },
  { icon: "🪨", label: "Uhlie" },
  { icon: "🔥", label: "Plyn" },
  { icon: "💨", label: "Smog" },
];

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Phase = "idle" | "running" | "done";

export function EnergyDashClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [xp, setXp] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const { items: fxItems, spawn: spawnFx } = useFloatingFx();
  const tileIdRef = useRef(0);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // spawn tiles
  useEffect(() => {
    if (phase !== "running") return;
    let active = true;
    const spawn = () => {
      if (!active) return;
      const now = Date.now();
      setTiles((cur) => {
        const open = Array.from({ length: GRID_SIZE }, (_, i) => i).filter(
          (i) => !cur.some((t) => t.pos === i),
        );
        if (open.length === 0) return cur;
        const pos = open[Math.floor(Math.random() * open.length)];
        const kind: TileKind = Math.random() < 0.7 ? "oze" : "fossil";
        const meta = pickFrom(kind === "oze" ? OZE : FOSSIL);
        const ttl = Math.max(900, 1600 - (DURATION_SECONDS - secondsLeft) * 20);
        const tile: Tile = {
          id: ++tileIdRef.current,
          pos,
          kind,
          icon: meta.icon,
          label: meta.label,
          spawnedAt: now,
          ttl,
        };
        return [...cur, tile];
      });
      const nextDelay = Math.max(280, 650 - (DURATION_SECONDS - secondsLeft) * 10);
      window.setTimeout(spawn, nextDelay);
    };
    window.setTimeout(spawn, 150);
    return () => {
      active = false;
    };
  }, [phase, secondsLeft]);

  // expire tiles
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setTiles((cur) => cur.filter((t) => now - t.spawnedAt < t.ttl));
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

  // timer
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const submit = useCallback(async (finalXp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, finalXp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? "Nepodarilo sa zapísať skóre.");
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (phase === "done") submit(Math.min(xp, XP_CAP));
  }, [phase, xp, submit]);

  function pct(e: React.MouseEvent<HTMLElement>): { x: number; y: number } {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function tapTile(t: Tile, e: React.MouseEvent<HTMLButtonElement>) {
    if (phase !== "running") return;
    const p = pct(e);
    setTiles((cur) => cur.filter((x) => x.id !== t.id));

    if (t.kind === "oze") {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      const mult = comboMultiplier(newCombo);
      const gained = Math.round(BASE_CORRECT * mult);
      setXp((v) => Math.min(v + gained, XP_CAP));
      setHits((h) => h + 1);
      spawnFx({ x: p.x, y: p.y, text: `+${gained}`, tone: mult > 1 ? "combo" : "ok" });
    } else {
      setCombo(0);
      setXp((v) => Math.max(0, v - BASE_WRONG));
      setMisses((m) => m + 1);
      spawnFx({ x: p.x, y: p.y, text: `−${BASE_WRONG}`, tone: "bad" });
    }
  }

  function start() {
    setPhase("running");
    setSecondsLeft(DURATION_SECONDS);
    setTiles([]);
    setXp(0);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setBestCombo(0);
    setResult(null);
    setSubmitError(null);
  }

  if (phase === "idle") {
    return (
      <div className="card p-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-xl font-semibold">Pripravený?</h2>
            <p className="text-zinc-400 mt-2">
              Zelené = obnoviteľné zdroje (OZE). Čierne = fosílne. Tap zelené,
              vyhni sa čiernym. Seba-kŕmiaca sa hra — rýchlosť rastie v čase.
            </p>
          </div>
          <div className="flex-1 min-w-[220px] flex flex-col gap-2 text-sm text-zinc-300">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              Combo bonus
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1 border border-[var(--border)]">
                5+ = <strong>×1.5</strong>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1 border border-[var(--accent-2)]/50 text-[var(--accent-2)]">
                10+ = <strong>×2</strong>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1 border border-rose-400/50 text-rose-300">
                20+ = <strong>×3</strong>
              </div>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary w-fit" onClick={start}>
          Spustiť Energy Dash
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <RoundResult
        state={{ submitting, error: submitError, result }}
        gameHref="/games/energy-dash"
        retryLabel="Znova"
        lines={[
          { label: "Tapy OZE", value: String(hits) },
          { label: "Chyby", value: String(misses) },
          { label: "Best combo", value: String(bestCombo) },
          { label: "Skóre", value: String(Math.min(xp, XP_CAP)) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
        <span className="chip">
          <span className="opacity-70">Čas</span>
          <strong>{secondsLeft}s</strong>
        </span>
        <ComboBadge combo={combo} multiplier={comboMultiplier(combo)} />
        <span className="chip">
          <span className="opacity-70">W</span>
          <strong className="text-[var(--accent)]">{Math.min(xp, XP_CAP)}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${(secondsLeft / DURATION_SECONDS) * 100}%` }}
        />
      </div>
      <div
        ref={boardRef}
        className="relative grid grid-cols-4 gap-2 sm:gap-3 card p-3 sm:p-4 aspect-square sm:aspect-[4/3]"
      >
        {Array.from({ length: GRID_SIZE }, (_, i) => {
          const tile = tiles.find((t) => t.pos === i);
          return (
            <div
              key={i}
              className="relative rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]"
            >
              {tile && (
                <button
                  type="button"
                  onClick={(e) => tapTile(tile, e)}
                  aria-label={tile.label}
                  className={`absolute inset-0 rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-transform active:scale-90 ${
                    tile.kind === "oze"
                      ? "bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 border border-emerald-400/60 text-emerald-100"
                      : "bg-gradient-to-br from-zinc-700/50 to-zinc-900/80 border border-zinc-500/60 text-zinc-100"
                  }`}
                >
                  <span>{tile.icon}</span>
                </button>
              )}
            </div>
          );
        })}
        <FloatingFxLayer items={fxItems} />
      </div>
      <p className="text-xs text-zinc-500">
        💡 OZE = obnoviteľné zdroje energie. Ich podiel v EU rastie — cieľ 45 % do 2030.
      </p>
    </div>
  );
}
