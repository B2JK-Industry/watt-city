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
 *
 * Implementation note: the drawer is permanently mounted and slides in/out
 * via `translate-x` rather than conditionally rendered with an entrance
 * keyframe. Keyframe-on-mount approach (the prior version) intermittently
 * failed to render in production — the `motion-safe:animate-[…]` arbitrary
 * value occasionally collided with hydration timing on slower mobile JIT.
 * Always-mounted + transform transition is bullet-proof and matches the
 * "Material drawer" pattern most mobile users recognise.
 *
 * - Slide direction: right edge, 300 ms `cubic-bezier(.4,0,.2,1)`.
 * - Closes on backdrop click, Escape key, or route change.
 * - Locks body scroll while open.
 * - `prefers-reduced-motion`: globals.css overrides transition durations
 *   to 0.01 ms, so reduced-motion users get an instant toggle.
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

  // Close on Escape — guarded so we don't attach a listener while closed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close when route changes. Compare against a captured prev so we don't
  // fire on initial mount (which would null-toggle the controlled state).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open.
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
        className="lg:hidden tap-target inline-flex items-center justify-center w-10 h-10 rounded-md text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 6h16M3 11h16M3 16h16" />
        </svg>
      </button>

      {/* Backdrop — pointer-events guarded so it never intercepts clicks
          while closed (otherwise the invisible div would steal taps from
          the page below). */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-[rgba(0,0,0,0.5)] transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel — always mounted, slides via transform. tabIndex=-1
          on the dialog allows focus management without making the panel
          a tab stop itself. */}
      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!open}
        tabIndex={-1}
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-40 w-[min(85vw,360px)] bg-[var(--surface)] flex flex-col transition-transform duration-300 ease-out shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
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
              strokeWidth="1.75"
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
      </aside>
    </>
  );
}
