"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

/* Phase 7.3.4 — swipe-to-dismiss wrapper. Translate-X on pointer move,
 * snap back or fire onDismiss when the drag exceeds a threshold.
 * Keyboard users can still dismiss via any child button — the swipe is a
 * mobile shortcut, not a replacement. */

type Props = {
  children: ReactNode;
  onDismiss?: () => void;
  /** Horizontal distance in px to trigger dismiss. Default 80. */
  threshold?: number;
  className?: string;
};

export function SwipeToDismiss({
  children,
  onDismiss,
  threshold = 80,
  className = "",
}: Props) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    startX.current = e.clientX;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };

  const onUp = () => {
    if (startX.current === null) return;
    if (Math.abs(dx) > threshold && onDismiss) {
      onDismiss();
    }
    setDx(0);
    startX.current = null;
  };

  return (
    <div
      className={`swipeable ${className}`}
      style={{
        transform: `translateX(${dx}px)`,
        opacity: 1 - Math.min(Math.abs(dx) / (threshold * 2), 0.6),
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {children}
    </div>
  );
}
