/* BuildingTile — shared SVG slot rendering used by both
 * `CitySkylineHero` (read-only homepage hero) and `WattCityClient`
 * (interactive /miasto manager).
 *
 * Before this extraction:
 *   - homepage rendered pitched-roof silhouettes that grew with
 *     level (`levelScale = 0.7 + 0.05 * level`)
 *   - /miasto rendered the same slots as flat rects with a tiny
 *     14-px roof BAND, no level scaling at all
 * Same data + same slots + two looks → user reported "prečo ... maju
 * strechu a v sekci mestečko nie ... narast vyšky niekde je a niekde
 * nie je ... nech to bude jednotne".
 *
 * Both surfaces now mount `<BuildingTile>` for occupied slots and
 * `<EmptyBuildingTile>` for empty ones. /miasto adds onClick +
 * isSelected to make the tile a button; the visual rendering stays
 * identical.
 *
 * Requires `<HeroBackdropDefs />` to be inlined in the same SVG —
 * the tile uses `filter: url(#hero-shadow)` from there.
 */

import type { SlotDef } from "@/lib/building-catalog";

type CommonProps = {
  slot: SlotDef;
  /** /miasto passes a click handler; homepage hero leaves it
   *  undefined, so the tile renders as plain SVG (no cursor, no
   *  role=button). */
  onClick?: () => void;
  /** /miasto's selected state — yellow ring around the tile. */
  isSelected?: boolean;
  /** A11y label for interactive use; ignored when onClick is null. */
  ariaLabel?: string;
};

export function BuildingTile({
  slot,
  level,
  glyph,
  body,
  roof,
  onClick,
  isSelected,
  ariaLabel,
}: CommonProps & {
  level: number;
  glyph: string;
  body: string;
  roof: string;
}) {
  // Same scale on both surfaces: L1 → 0.75, capped at 1.0 for L≥6.
  const levelScale = Math.min(1, 0.7 + level * 0.05);
  const h = slot.h * levelScale;
  const y = slot.y + slot.h - h;
  const roofH = h * 0.2;
  const bodyH = h - roofH;
  // Two windows + a door — sized by slot width. Position windows
  // in the upper third of the body.
  const winSize = Math.min(8, slot.w * 0.12);
  const winY = y + roofH + bodyH * 0.25 - winSize / 2;
  const winLeft = slot.x + slot.w * 0.28 - winSize / 2;
  const winRight = slot.x + slot.w * 0.72 - winSize / 2;
  const interactive = Boolean(onClick);
  return (
    <g
      onClick={onClick}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
      filter="url(#hero-shadow)"
    >
      {/* Body */}
      <rect x={slot.x} y={y + roofH} width={slot.w} height={bodyH} fill={body} />
      {/* Pitched roof */}
      <polygon
        points={`${slot.x},${y + roofH} ${slot.x + slot.w / 2},${y} ${slot.x + slot.w},${y + roofH}`}
        fill={roof}
      />
      {/* Lit windows — warm ivory matches the sunset palette. */}
      <rect x={winLeft} y={winY} width={winSize} height={winSize} fill="#fde2c4" />
      <rect x={winRight} y={winY} width={winSize} height={winSize} fill="#fde2c4" />
      {/* Door */}
      <rect
        x={slot.x + slot.w / 2 - winSize / 2}
        y={y + roofH + bodyH - winSize * 1.3}
        width={winSize}
        height={winSize * 1.3}
        fill={roof}
        opacity="0.7"
      />
      {/* Glyph centered horizontally, 60% down the body */}
      <text
        x={slot.x + slot.w / 2}
        y={y + roofH + bodyH * 0.6}
        textAnchor="middle"
        fontSize={Math.min(36, slot.w * 0.45)}
        fill="white"
        opacity="0.85"
      >
        {glyph}
      </text>
      {/* L badge — white pill + accent text, readable on /miasto's
          ~1200 px render width (1 viewBox unit ≈ 0.67 screen px). */}
      <rect
        x={slot.x + 2}
        y={y + roofH + bodyH - 22}
        width={26}
        height={18}
        rx={3}
        fill="#ffffff"
        opacity="0.92"
      />
      <text
        x={slot.x + 15}
        y={y + roofH + bodyH - 8}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="var(--accent)"
      >
        L{level}
      </text>
      {/* Selected ring — only on /miasto. Outer rect at viewBox
          coords so it doesn't disturb tile geometry. Uses
          --accent-ink for the ring colour to keep within token
          family even on core skin. */}
      {isSelected && (
        <rect
          x={slot.x - 3}
          y={y - 3}
          width={slot.w + 6}
          height={h + 6}
          fill="none"
          stroke="#fde047"
          strokeWidth={3}
          rx={4}
        />
      )}
    </g>
  );
}

export function EmptyBuildingTile({
  slot,
  buildLabel,
  onClick,
  isSelected,
  ariaLabel,
}: CommonProps & { buildLabel: string }) {
  // Place the placeholder card in the lower 45% of the slot bounding
  // box so the empty tile reads at the same baseline as occupied
  // tiles (which anchor to slot bottom).
  const cx = slot.x + slot.w / 2;
  const top = slot.y + slot.h * 0.55;
  const h = slot.h * 0.45;
  const interactive = Boolean(onClick);
  return (
    <g
      onClick={onClick}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      <rect
        x={slot.x + 4}
        y={top}
        width={slot.w - 8}
        height={h}
        fill="#ffffff"
        fillOpacity="0.55"
        stroke={isSelected ? "#fde047" : "#e5e5e5"}
        strokeWidth={isSelected ? 2 : 1}
        rx="4"
      />
      <text
        x={cx}
        y={top + h / 2 - 4}
        textAnchor="middle"
        fontSize={Math.min(28, slot.w * 0.4)}
        fill="#003574"
        opacity="0.55"
      >
        +
      </text>
      <text
        x={cx}
        y={top + h - 6}
        textAnchor="middle"
        fontSize="9"
        fill="#636363"
      >
        {buildLabel}
      </text>
    </g>
  );
}
