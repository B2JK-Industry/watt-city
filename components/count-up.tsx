"use client";

import { useEffect, useRef, useState } from "react";

/* D6 — animated number count-up. Used on the round-result award to
 * make the "+220 W" reveal feel rewarding. Steps 0 → final over
 * `durationMs`. Respects prefers-reduced-motion: with reduce, renders
 * the final value immediately. Format hook lets callers localise
 * ("1 234 W", "1,234 W"); default uses `toLocaleString("pl-PL")`.
 */

type Props = {
  value: number;
  durationMs?: number;
  className?: string;
  format?: (n: number) => string;
};

export function CountUp({
  value,
  durationMs = 900,
  className = "",
  format,
}: Props) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    // Animate from last committed display value → new `value`.
    fromRef.current = prevRef.current;
    startRef.current = null;
    let rafId = 0;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      // ease-out cubic
      const e = 1 - (1 - t) ** 3;
      const next = Math.round(
        fromRef.current + (value - fromRef.current) * e,
      );
      setDisplay(next);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  const shown = (format ?? ((n: number) => n.toLocaleString("pl-PL")))(display);
  return <span className={className}>{shown}</span>;
}
