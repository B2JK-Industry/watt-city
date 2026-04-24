"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";
import {
  ComboBadge,
  FloatingFxLayer,
  comboMultiplier,
  useFloatingFx,
} from "@/components/games/fx";

const GAME_ID = "stock-tap";
const DURATION_SECONDS = 45;
const TICK_MS = 160;
const HISTORY = 60;
const XP_CAP = 220;
const XP_PER_ZLOTY = 2.2; // gain multiplier: 1 zł profit → ~2 XP

type Phase = "idle" | "running" | "done";

function randomWalk(prev: number, center: number): number {
  const pull = (center - prev) * 0.02;
  const drift = (Math.random() - 0.5) * 4;
  const next = prev + pull + drift;
  return Math.max(40, Math.min(220, Number(next.toFixed(2))));
}

export function StockTapClient({ dict }: { dict: Dict }) {
  const t = dict.stock;
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [series, setSeries] = useState<number[]>(() => Array(HISTORY).fill(100));
  const [price, setPrice] = useState(100);
  const [position, setPosition] = useState<number | null>(null);
  const [cash, setCash] = useState(0);
  const [trades, setTrades] = useState(0);
  const [, setGreenTrades] = useState(0);
  const [, setRedTrades] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flash, setFlash] = useState<"buy" | "sell-ok" | "sell-bad" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const { items: fxItems, spawn: spawnFx } = useFloatingFx();
  const chartRef = useRef<HTMLDivElement | null>(null);

  // price tick
  useEffect(() => {
    if (phase !== "running") return;
    const center = 100 + Math.sin(Date.now() / 5000) * 20;
    const id = window.setInterval(() => {
      setSeries((cur) => {
        const last = cur[cur.length - 1];
        const nextPrice = randomWalk(last, center);
        setPrice(nextPrice);
        return [...cur.slice(-(HISTORY - 1)), nextPrice];
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const submit = useCallback(async (finalXp: number) => {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, finalXp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? dict.auth.errorGeneric);
    setSubmitting(false);
  }, [dict.auth.errorGeneric]);

  // Latest xp for the timer callback without re-creating the interval.
  const xpRef = useRef(0);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  // timer
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setPhase("done");
          void submit(Math.min(xpRef.current, XP_CAP));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, submit]);

  function clickPct(e: React.MouseEvent<HTMLElement>): { x: number; y: number } {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function onBuy(e: React.MouseEvent<HTMLButtonElement>) {
    if (phase !== "running" || position !== null) return;
    setPosition(price);
    setFlash("buy");
    window.setTimeout(() => setFlash(null), 250);
    const p = clickPct(e);
    spawnFx({ x: p.x, y: p.y, text: `${t.buy} @ ${price.toFixed(1)}`, tone: "ok" });
  }

  function onSell(e: React.MouseEvent<HTMLButtonElement>) {
    if (phase !== "running" || position === null) return;
    const profit = price - position;
    setPosition(null);
    setTrades((t) => t + 1);
    const p = clickPct(e);
    if (profit > 0) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      const mult = comboMultiplier(newCombo);
      const gained = Math.max(1, Math.round(profit * XP_PER_ZLOTY * mult));
      setXp((v) => Math.min(v + gained, XP_CAP));
      setGreenTrades((g) => g + 1);
      setCash((c) => c + profit);
      setFlash("sell-ok");
      spawnFx({
        x: p.x,
        y: p.y,
        text: `+${gained} W (+${profit.toFixed(1)} zł)`,
        tone: mult > 1 ? "combo" : "ok",
      });
    } else {
      setCombo(0);
      setRedTrades((r) => r + 1);
      setCash((c) => c + profit);
      setFlash("sell-bad");
      spawnFx({
        x: p.x,
        y: p.y,
        text: `${profit.toFixed(1)} zł`,
        tone: "bad",
      });
    }
    window.setTimeout(() => setFlash(null), 250);
  }

  function start() {
    setPhase("running");
    setSecondsLeft(DURATION_SECONDS);
    setSeries(Array(HISTORY).fill(100));
    setPrice(100);
    setPosition(null);
    setCash(0);
    setTrades(0);
    setGreenTrades(0);
    setRedTrades(0);
    setXp(0);
    setCombo(0);
    setBestCombo(0);
    setFlash(null);
    setResult(null);
    setSubmitError(null);
  }

  if (phase === "idle") {
    return (
      <div className="card p-8 flex flex-col gap-4 items-start">
        <h2 className="text-xl font-semibold">{t.ready}</h2>
        <p className="text-zinc-400 max-w-prose">{t.readyBody}</p>
        <button type="button" className="btn btn-primary" onClick={start}>
          {t.startShort}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref="/games/stock-tap"
        retryLabel={t.retry}
        lines={[
          { label: t.trades, value: String(trades) },
          { label: t.profitZl, value: cash.toFixed(1) },
          { label: t.bestCombo, value: String(bestCombo) },
          { label: t.score, value: String(Math.min(xp, XP_CAP)) },
        ]}
      />
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(10, max - min);
  const width = 100;
  const height = 100;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const priceDelta =
    position !== null ? price - position : 0;
  const priceDeltaTone =
    priceDelta > 0 ? "text-emerald-300" : priceDelta < 0 ? "text-rose-300" : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
        <span className="chip">
          <span className="opacity-70">{t.time}</span>
          <strong>{secondsLeft}s</strong>
        </span>
        <ComboBadge combo={combo} multiplier={comboMultiplier(combo)} />
        <span className="chip">
          <span className="opacity-70">W</span>
          <strong className="text-[var(--accent)]">{Math.min(xp, XP_CAP)}</strong>
        </span>
        <span className="chip">
          <span className="opacity-70">{t.profit}</span>
          <strong className={cash >= 0 ? "text-emerald-300" : "text-rose-300"}>
            {cash.toFixed(1)} zł
          </strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-[var(--accent)] to-[var(--accent-2)] transition-all"
          style={{ width: `${(secondsLeft / DURATION_SECONDS) * 100}%` }}
        />
      </div>

      <div
        ref={chartRef}
        className="card p-4 sm:p-5 relative flex flex-col gap-3"
      >
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400">
              {t.price}
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-bold">
              {price.toFixed(2)} zł
            </span>
          </div>
          {position !== null && (
            <div className="flex flex-col items-end text-sm">
              <span className="text-xs text-zinc-400">
                {t.openPos}
              </span>
              <span className="font-mono">
                @ {position.toFixed(2)} zł
              </span>
              <span className={`font-mono ${priceDeltaTone}`}>
                {priceDelta >= 0 ? "+" : ""}
                {priceDelta.toFixed(2)} zł
              </span>
            </div>
          )}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-40 sm:h-52"
        >
          <defs>
            <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#stockFill)"
            points={`0,${height} ${points} ${width},${height}`}
          />
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          {position !== null && (
            <line
              x1="0"
              y1={height - ((position - min) / range) * height}
              x2={width}
              y2={height - ((position - min) / range) * height}
              stroke="var(--accent-2)"
              strokeDasharray="2 2"
              strokeWidth="0.7"
            />
          )}
        </svg>
        <FloatingFxLayer items={fxItems} />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBuy}
            disabled={position !== null}
            className={`btn ${
              position !== null
                ? "btn-ghost opacity-40"
                : "bg-emerald-500 text-black hover:bg-emerald-400"
            } ${flash === "buy" ? "animate-[tile-flash-ok_320ms]" : ""}`}
          >
            {t.buy} @ {price.toFixed(1)}
          </button>
          <button
            type="button"
            onClick={onSell}
            disabled={position === null}
            className={`btn ${
              position === null
                ? "btn-ghost opacity-40"
                : "bg-rose-500 text-black hover:bg-rose-400"
            } ${
              flash === "sell-ok"
                ? "animate-[tile-flash-ok_320ms]"
                : flash === "sell-bad"
                ? "animate-[tile-flash-bad_320ms]"
                : ""
            }`}
          >
            {t.sell} @ {price.toFixed(1)}
          </button>
        </div>
        <p className="text-xs text-zinc-400">{t.tip}</p>
      </div>
    </div>
  );
}
