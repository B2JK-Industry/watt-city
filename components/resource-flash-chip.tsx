"use client";

import { useEffect, useRef, useState } from "react";

/* D6 — HUD delta flash wrapper for a resource chip. Watches `value`
 * and briefly pulses a ring on every change (up = lime, down = pink).
 * Respects prefers-reduced-motion by skipping the animation outright.
 * Intentionally tiny — server renders the ResourceBar; this client
 * companion can be slotted into any compact HUD that needs the flash. */

type Props = {
  value: number;
  icon: string;
  color: string;
  title: string;
};

export function ResourceFlashChip({ value, icon, color, title }: Props) {
  const [flash, setFlash] = useState<null | "up" | "down">(null);
  const prev = useRef<number>(value);

  useEffect(() => {
    if (prev.current === value) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) {
        prev.current = value;
        return;
      }
    }
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const id = setTimeout(() => setFlash(null), 650);
    return () => clearTimeout(id);
  }, [value]);

  const flashColor =
    flash === "up"
      ? "var(--success)"
      : flash === "down"
        ? "var(--danger)"
        : "transparent";

  return (
    <span
      title={title}
      className={`flex items-center gap-1 px-2 py-1 rounded border font-mono tabular-nums text-xs bg-[var(--surface)] ${
        flash ? "motion-safe:animate-[hud-delta-flash_640ms_ease-out]" : ""
      }`}
      style={
        { borderColor: color, "--delta-flash": flashColor } as React.CSSProperties
      }
    >
      <span aria-hidden className="text-sm leading-none">
        {icon}
      </span>
      <span className="font-bold" style={{ color }}>
        {value.toLocaleString("pl-PL")}
      </span>
    </span>
  );
}
