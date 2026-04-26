import Link from "next/link";
import type { ReactNode } from "react";

/* G-03 (F-NEW-06) — shared empty-state primitive.
 *
 * Replaces text-only "nothing here" lines on /leaderboard, /friends,
 * /profile achievements grid, and /parent (no kid linked). The
 * component is server-render-friendly (no client hooks) and only
 * relies on the existing `.card` + `.btn*` primitives + the typo
 * scale, so dropping it into a new surface is a one-line addition.
 */
type CtaVariant = "primary" | "secondary" | "sales";

type Props = {
  /** Decorative emoji or 1.5px-stroke icon. Treated as `aria-hidden`. */
  icon: ReactNode;
  title: string;
  body?: string;
  cta?: { href: string; label: string; variant?: CtaVariant };
};

function btnClass(variant?: CtaVariant): string {
  if (variant === "sales") return "btn btn-sales";
  if (variant === "secondary") return "btn btn-secondary";
  return "btn";
}

export function EmptyState({ icon, title, body, cta }: Props) {
  return (
    <div className="card flex flex-col items-center text-center gap-4 py-12 px-6">
      <div aria-hidden className="text-5xl leading-none">
        {icon}
      </div>
      <h3 className="t-h4 text-[var(--accent)]">{title}</h3>
      {body && (
        <p className="t-body-sm text-[var(--ink-muted)] max-w-md leading-relaxed">
          {body}
        </p>
      )}
      {cta && (
        <Link href={cta.href} className={btnClass(cta.variant)}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}
