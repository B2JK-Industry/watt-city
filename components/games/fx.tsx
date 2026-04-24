"use client";

import { useCallback, useRef, useState } from "react";

export type FloatingFx = {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: "ok" | "bad" | "combo";
};

export function useFloatingFx() {
  const [items, setItems] = useState<FloatingFx[]>([]);
  const idRef = useRef(0);

  const spawn = useCallback((f: Omit<FloatingFx, "id">) => {
    const id = ++idRef.current;
    setItems((cur) => [...cur, { ...f, id }]);
    window.setTimeout(() => {
      setItems((cur) => cur.filter((i) => i.id !== id));
    }, 900);
  }, []);

  return { items, spawn };
}

export function FloatingFxLayer({ items }: { items: FloatingFx[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it) => (
        <span
          key={it.id}
          className={`absolute font-bold text-xl sm:text-2xl select-none animate-[fx-rise_800ms_cubic-bezier(0.2,0.8,0.2,1)_forwards] ${
            it.tone === "ok"
              ? "text-[var(--success)]"
              : it.tone === "bad"
              ? "text-[var(--danger)]"
              : "text-[var(--accent)] drop-"
          }`}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}

export function ComboBadge({
  combo,
  multiplier,
}: {
  combo: number;
  multiplier: number;
}) {
  if (combo < 2) return null;
  const tier =
    multiplier >= 3
      ? "border-[var(--danger)] text-[var(--danger)]"
      : multiplier >= 2
      ? "border-[var(--accent)] text-[var(--accent)]"
      : "border-[var(--accent)] text-[var(--accent)]";
  return (
    <span
      className={`chip ${tier} font-semibold animate-[combo-pulse_700ms_ease-out]`}
    >
      <span>🔥</span>
      <strong>×{multiplier.toFixed(multiplier >= 2 ? 0 : 1)}</strong>
      <span className="opacity-70">combo {combo}</span>
    </span>
  );
}

export function comboMultiplier(combo: number): number {
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}
