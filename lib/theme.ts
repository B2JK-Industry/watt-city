/* Theme / white-label tokens — Phase 4.1.
 *
 * Two themes ship: `core` (Watt City neo-brutalist, the default) and `pko`
 * (PKO Bank Polski partnership skin). Toggle via env var `SKIN` — any
 * deployment can swap without code changes. Layout reads resolveTheme()
 * and injects CSS variables + brand strings at render time.
 *
 * The PKO skin uses PKO's public brand colors (navy + red accent) per the
 * publicly available PKO BP styleguide, not any internal asset. When a
 * real partnership is signed the PKO team can replace the logo SVG with
 * their approved asset; the token interface stays stable.
 */

export type SkinId = "core" | "pko";

export type ThemeTokens = {
  id: SkinId;
  brand: string; // "Watt City" | "PKO Junior × Watt City"
  brandShort: string; // "WC" | "PKO"
  colors: {
    accent: string;
    accentInk: string; // text on accent
    background: string;
    surface: string;
    ink: string;
  };
  /** Footer disclaimer text per skin. The PKO skin uses PKO-compliance
   *  wording; the core skin uses the generic "edukacyjna gra" note. */
  disclaimer: string;
  mascot: MascotDef | null;
};

export type MascotDef = {
  id: "zyrafa" | "none";
  label: string;
  /** Inline SVG fragment (≤ 2 KB); rendered as-is. For the PKO skin this
   *  is a simple Żyrafa placeholder — the real mascot asset is swapped in
   *  via env override when PKO ships their vector. */
  svg: string;
};

const ZYRAFA_PLACEHOLDER_SVG = `
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
    accentInk: "#0a0a0f",
    background: "#0a0a0f",
    surface: "#0f172a",
    ink: "#f8fafc",
  },
  disclaimer:
    "GRA EDUKACYJNA — to nie są prawdziwe pieniądze. Budynki, kredyty i W-dolary istnieją tylko w grze.",
  mascot: null,
};

export const PKO_THEME: ThemeTokens = {
  id: "pko",
  brand: "PKO Junior × Watt City",
  brandShort: "PKO",
  colors: {
    // Verified against pkobp.pl/junior 2026-04-24 — see
    // docs/partnerships/pko-visual-system-v1/04-DESIGN-TOKENS.json.
    // `accent` is the DOMINANT navy (97× occurrences on pkobp.pl/junior),
    // not PKO corporate red — red is reserved for co-branding lockups only.
    accent: "#003574", // PKO navy-700 (PRIMARY)
    accentInk: "#ffffff",
    background: "#001E4B", // PKO navy-900 (darkest — hero, page BG)
    surface: "#003574", // PKO navy-700 (card surface on navy BG)
    ink: "#ffffff",
  },
  disclaimer:
    "GRA EDUKACYJNA W PARTNERSTWIE Z PKO BP — waluta w grze (W-dolary) NIE jest pieniądzem i NIE może być wymieniona na PLN. Mirror do PKO Junior jest opcjonalny i wymaga zgody rodzica.",
  mascot: {
    id: "zyrafa",
    label: "Żyrafa PKO",
    svg: ZYRAFA_PLACEHOLDER_SVG,
  },
};

export function resolveTheme(skin: SkinId = currentSkin()): ThemeTokens {
  if (skin === "pko") return PKO_THEME;
  return CORE_THEME;
}

/** Reads `SKIN` env var at call time. Safe in both server and client (the
 *  client only sees what the server injects into the layout). */
export function currentSkin(): SkinId {
  const raw = process.env.SKIN ?? process.env.NEXT_PUBLIC_SKIN;
  return raw === "pko" ? "pko" : "core";
}
