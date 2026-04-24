/* Theme / white-label tokens.
 *
 * Two themes ship:
 *   - `pko`  — PKO-style light-mode skin: white surface, navy primary,
 *              warm-orange sales accent. **DEFAULT** in prod.
 *   - `core` — Watt City neo-brutalist legacy (dark, neon). Opt-in via
 *              SKIN=core.
 *
 * Toggle via env var `SKIN` / `NEXT_PUBLIC_SKIN`. Layout reads
 * resolveTheme() and injects CSS variables + brand strings at render
 * time. Tokens are derived from pkobp.pl (April 2026) — see
 * `docs/pko-redesign/02-DESIGN-TOKENS.md` for exact values.
 */

export type SkinId = "core" | "pko";

export type ThemeTokens = {
  id: SkinId;
  brand: string;
  brandShort: string;
  colors: {
    accent: string;
    accentHover: string;
    accentInk: string;
    sales: string;
    salesHover: string;
    salesInk: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    ink: string;
    inkMuted: string;
    inkSubtle: string;
    line: string;
    success: string;
    danger: string;
  };
  /** Footer disclaimer text per skin. */
  disclaimer: string;
  /** Mascot is null until a real asset is delivered — placeholder
   *  rectangles read as broken images (see docs/pko-redesign/05 §1-C). */
  mascot: MascotDef | null;
};

export type MascotDef = {
  id: "zyrafa" | "none";
  label: string;
  /** Inline SVG fragment (≤ 2 KB); rendered as-is. */
  svg: string;
};

// Retained for potential future use once a real mascot asset lands.
// Intentionally unused — referenced here to avoid dead-code warnings.
export const ZYRAFA_PLACEHOLDER_SVG = `
<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" aria-label="Żyrafa">
  <rect x="12" y="32" width="8" height="26" fill="#fbbf24" stroke="#000" stroke-width="2"/>
  <rect x="22" y="26" width="4" height="32" fill="#fbbf24" stroke="#000" stroke-width="2"/>
  <rect x="18" y="2" width="10" height="28" fill="#fbbf24" stroke="#000" stroke-width="2"/>
  <rect x="16" y="0" width="3" height="4" fill="#78350f"/>
  <rect x="26" y="0" width="3" height="4" fill="#78350f"/>
  <circle cx="23" cy="10" r="1.5" fill="#000"/>
  <circle cx="27" cy="10" r="1.5" fill="#000"/>
  <rect x="14" y="14" width="5" height="3" fill="#78350f"/>
  <rect x="24" y="14" width="5" height="3" fill="#78350f"/>
</svg>`.trim();

export const CORE_THEME: ThemeTokens = {
  id: "core",
  brand: "Watt City",
  brandShort: "WC",
  colors: {
    accent: "#fde047",
    accentHover: "#facc15",
    accentInk: "#0a0a0f",
    sales: "#fb923c",
    salesHover: "#f97316",
    salesInk: "#0a0a0f",
    background: "#0a0a0f",
    surface: "#0f172a",
    surfaceAlt: "#1e1e2e",
    ink: "#f8fafc",
    inkMuted: "#94a3b8",
    inkSubtle: "#64748b",
    line: "#f8fafc",
    success: "#a3e635",
    danger: "#f87171",
  },
  disclaimer:
    "GRA EDUKACYJNA — to nie są prawdziwe pieniądze. Budynki, kredyty i W-dolary istnieją tylko w grze.",
  mascot: null,
};

export const PKO_THEME: ThemeTokens = {
  id: "pko",
  brand: "Watt City",
  brandShort: "WC",
  colors: {
    accent: "#003574",
    accentHover: "#004c9a",
    accentInk: "#ffffff",
    sales: "#db912c",
    salesHover: "#cc7a09",
    salesInk: "#ffffff",
    background: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f9f9f9",
    ink: "#000000",
    inkMuted: "#636363",
    inkSubtle: "#b7b7b7",
    line: "#e5e5e5",
    success: "#2e7d49",
    danger: "#c0342b",
  },
  disclaimer:
    "GRA EDUKACYJNA — to nie są prawdziwe pieniądze. Budynki, kredyty i W-dolary istnieją tylko w grze.",
  mascot: null,
};

export function resolveTheme(skin: SkinId = currentSkin()): ThemeTokens {
  if (skin === "core") return CORE_THEME;
  return PKO_THEME;
}

/** Reads `SKIN` env var at call time. `pko` is the default; only an
 *  explicit `SKIN=core` / `NEXT_PUBLIC_SKIN=core` opts into the legacy
 *  neo-brutalist skin. */
export function currentSkin(): SkinId {
  const raw = process.env.SKIN ?? process.env.NEXT_PUBLIC_SKIN;
  if (raw === "core") return "core";
  return "pko";
}
