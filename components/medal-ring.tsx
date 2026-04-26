/* MedalRing — visual primitive for the *XP-tier* metric.
 *
 * Pair to `BuildingStackBadge` (city-level metric). Sized for use
 * inside the dashboard's XP progress ring; the medal-with-ribbon
 * connotation flags this as "what you earn" vs. "what you build".
 *
 * Pure SVG, no client deps. Uses `currentColor` so the parent text
 * colour drives the medal fill and the ring stays in token family.
 */

type Props = {
  size?: number;
  className?: string;
};

export function MedalRing({ size = 22, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {/* Ribbon — two crossed bands above the medal. */}
      <polygon points="6,2 9,2 12,9 9,9" />
      <polygon points="18,2 15,2 12,9 15,9" />
      {/* Medal disc with inner ring. */}
      <circle cx={12} cy={15} r={6} />
      <circle cx={12} cy={15} r={3.5} fill="#ffffff" opacity={0.4} />
      {/* Star pip in center. */}
      <polygon
        points="12,12.6 12.7,14.4 14.6,14.4 13.05,15.5 13.6,17.3 12,16.2 10.4,17.3 10.95,15.5 9.4,14.4 11.3,14.4"
        fill="#ffffff"
        opacity={0.9}
      />
    </svg>
  );
}
