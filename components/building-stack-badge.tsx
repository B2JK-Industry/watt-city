/* BuildingStackBadge — visual primitive for the *city-level* metric.
 *
 * One half of the F-04 Tier-vs-City-level disambiguation pair (the
 * other half is `MedalRing`, used for the XP-tier metric on the
 * dashboard). Three stacked rooftops in navy, sized for inline use
 * inside a progress-ring center. The "city you build" connotation
 * (vs. medals you earn) reinforces the new label split:
 *   "Stupeň města 3"  ← BuildingStackBadge + navy ring
 *   "Tvůj tier 4"     ← MedalRing          + sales ring
 *
 * Pure SVG, no client deps. Inline `currentColor` so the parent
 * ring's text colour propagates and the badge stays in token
 * family on both pko (navy) and core (yellow) skins.
 */

type Props = {
  /** Outer box size in CSS px. Internals scale via viewBox. */
  size?: number;
  /** Optional className for layout positioning. */
  className?: string;
};

export function BuildingStackBadge({ size = 22, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {/* Bottom row — two short buildings side by side. */}
      <rect x={2} y={15} width={6} height={7} />
      <rect x={9} y={13} width={5} height={9} />
      {/* Mid building — pitched roof. */}
      <polygon points="14.5,12 18,9 21.5,12" />
      <rect x={14.5} y={12} width={7} height={10} />
      {/* Tall tower with antenna pin. */}
      <rect x={3} y={6} width={4} height={9} />
      <rect x={4.5} y={3.5} width={1} height={2.5} />
      {/* Window detail strip on tall tower for visual texture. */}
      <rect x={4} y={8} width={2} height={1} fill="#ffffff" opacity={0.5} />
      <rect x={4} y={11} width={2} height={1} fill="#ffffff" opacity={0.5} />
    </svg>
  );
}
