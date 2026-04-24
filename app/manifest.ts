import type { MetadataRoute } from "next";
import { resolveTheme } from "@/lib/theme";

/* Dynamic PWA manifest — replaces the static public/manifest.webmanifest
 * so `theme_color` and `background_color` pick up the active skin at
 * build time (SKIN=pko → navy, default → yellow). Next 16 serves this
 * at /manifest.webmanifest and auto-injects the <link> tag, so the
 * static metadata no longer needs `manifest:` field.
 *
 * Icons stay on the core asset set in PR-1; skin-specific variants
 * (icon-192-pko.svg etc.) ship in PR-2 per execution plan item 26. */
export default function manifest(): MetadataRoute.Manifest {
  const theme = resolveTheme();
  const isPko = theme.id === "pko";
  return {
    name: theme.brand,
    short_name: isPko ? "PKO Junior" : "Watt City",
    description: "Gra edukacyjna ucząca dzieci finansów osobistych.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: theme.colors.background,
    theme_color: theme.colors.accent,
    lang: "pl-PL",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Miasteczko",
        short_name: "Miasto",
        url: "/miasto",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
      },
      {
        name: "Gry",
        short_name: "Gry",
        url: "/games",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
      },
    ],
  };
}
