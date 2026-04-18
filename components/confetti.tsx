"use client";

import { useMemo } from "react";

const COLORS = [
  "var(--accent)",
  "var(--accent-2)",
  "rgb(52, 211, 153)",
  "rgb(96, 165, 250)",
  "rgb(244, 114, 182)",
];

type Props = { count?: number; className?: string };

export function Confetti({ count = 28, className = "" }: Props) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isSquare = Math.random() < 0.4;
      return {
        key: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 250,
        duration: 1100 + Math.random() * 700,
        isSquare,
      };
    });
  }, [count]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.key}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.isSquare ? "2px" : "999px",
            animation: `confetti-fall ${p.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
