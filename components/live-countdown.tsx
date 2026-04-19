"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  validUntil: number;
  /** Render inside an SVG <g> (default). Set false to render a plain span. */
  svg?: boolean;
  /** Fill / color for the text. */
  color?: string;
  /** Show "Xm Ys" when under this many seconds. Otherwise "Xh Ym". */
  secondsThreshold?: number;
};

// Ticks every second on the client. The SVG parent (city-scene) is rendered
// server-side; this component hydrates and replaces the static text with a
// live countdown. Used on every LIVE AI building so players see the 1h window
// closing in real time.
//
// When the countdown hits 0 we call `router.refresh()` so the server
// re-renders without the stale building. `listActiveAiGamesWithLazyRotation`
// on the server filters out expired envelopes and schedules a real rotation
// via `after()`. Otherwise players see "0s" stuck on a building that's past
// its validUntil.
export function LiveCountdown({
  validUntil,
  svg = true,
  color = "#fde047",
  secondsThreshold = 60 * 60,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const refreshedRef = useRef(false);
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = Math.max(0, validUntil - now);
  const totalSec = Math.floor(msLeft / 1000);

  // One-shot refresh trigger the moment the countdown expires.
  useEffect(() => {
    if (msLeft > 0 || refreshedRef.current) return;
    refreshedRef.current = true;
    router.refresh();
  }, [msLeft, router]);

  const label =
    msLeft <= 0
      ? "EXPIRED"
      : totalSec < secondsThreshold
        ? `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`
        : `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;

  if (!svg) {
    return (
      <span
        className="font-mono tabular-nums"
        suppressHydrationWarning
        style={{ color }}
      >
        ⏱ {label}
      </span>
    );
  }
  // SVG text — renders inside the city-scene chip. `suppressHydrationWarning`
  // because the server renders one timestamp, the client hydrates with the
  // current time; the 1s flicker is acceptable.
  return (
    <text
      x={22}
      y={10}
      textAnchor="middle"
      fontSize={8}
      fontWeight={900}
      fill={color}
      suppressHydrationWarning
    >
      ⏱ {label}
    </text>
  );
}
