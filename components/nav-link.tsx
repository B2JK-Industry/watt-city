"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Variant = "desktop" | "mobile";

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
};

/**
 * Nav link with active-state indicator.
 * - Desktop: 2 px navy bottom border on active (spec §5).
 * - Mobile (secondary nav): color change only (no underline — too noisy in
 *   a horizontal-scroll strip).
 *
 * Active match rules:
 *   "/" matches only exact "/".
 *   Any other href matches exact OR descendant (e.g. /games/... activates /games).
 */
export function NavLink({ href, children, variant = "desktop" }: Props) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`tap-target inline-flex items-center px-2 py-1 rounded transition-colors ${
          active
            ? "text-[var(--accent)] font-semibold"
            : "text-[var(--ink-muted)] hover:text-[var(--accent)]"
        }`}
      >
        {children}
      </Link>
    );
  }

  // Desktop: 2 px bottom border. Always reserved (transparent) so layout
  // doesn't shift between active/inactive states. Spec §5 explicit exception
  // to the §7 "max 1 px border" rule: active nav state may use 2 px stripe.
  //
  // R-01 — `whitespace-nowrap` so multi-word labels ("O platformě",
  // "Pro školy") never break the desktop nav row's vertical alignment.
  // The lg `gap-4` + 5 nav links fit on a 1024 viewport without wrap.
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`tap-target h-full inline-flex items-center whitespace-nowrap border-b-2 transition-colors ${
        active
          ? "text-[var(--accent)] border-[var(--accent)]"
          : "text-[var(--ink-muted)] border-transparent hover:text-[var(--accent)]"
      }`}
    >
      {children}
    </Link>
  );
}
