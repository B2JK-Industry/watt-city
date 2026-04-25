"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  ariaLabel: string;
  openLabel: string;
  closeLabel: string;
  /** Drawer body — typically the role-aware nav links list. Server-rendered
   *  in the parent and passed as children so this client wrapper stays small. */
  children: ReactNode;
  /** Optional secondary block (auth actions, lang switcher) rendered under
   *  a divider below the main nav links. */
  footer?: ReactNode;
};

/**
 * Mobile-only hamburger trigger + slide-in drawer (per spec §5).
 * - Slides from right, 300 ms motion-slow easing.
 * - Closes on backdrop click, Escape key, or route change.
 * - Locks body scroll while open.
 * - Reduced-motion respected via `motion-safe:` prefix on the animation
 *   utility, so it falls back to instant when prefers-reduced-motion is set.
 */
export function MobileNavDrawer({
  ariaLabel,
  openLabel,
  closeLabel,
  children,
  footer,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close when route changes (link click already triggers nav)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((o) => !o)}
        className="sm:hidden tap-target inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-40 bg-[rgba(0,0,0,0.5)] motion-safe:animate-[fade-in_200ms_ease-out]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="sm:hidden fixed top-0 right-0 bottom-0 z-40 w-[min(85vw,360px)] bg-[var(--surface)] elev-soft-lg flex flex-col motion-safe:animate-[slide-in-right_300ms_cubic-bezier(.4,0,.2,1)]"
          >
            <div className="flex items-center justify-between px-4 h-[56px] border-b border-[var(--line)]">
              <span className="t-h5 text-[var(--accent)]">{ariaLabel}</span>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
                className="tap-target w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-[var(--surface-2)] transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M4 4l10 10M14 4l-10 10" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {children}
            </nav>
            {footer && (
              <div className="border-t border-[var(--line)] p-4 flex flex-col gap-3">
                {footer}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
