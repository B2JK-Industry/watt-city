import type { MetadataRoute } from "next";
import { resolveTheme } from "@/lib/theme";
import { getCurrentSkin } from "@/lib/skin-server";

/* Dynamic PWA manifest — replaces the static public/manifest.webmanifest
 * so `theme_color` and `background_color` pick up the active skin at
 * request time. Request-aware (reads `xp_skin` cookie via
 * getCurrentSkin) so a preview user who flipped to PKO on
 * watt-city.vercel.app also gets a PKO-tinted manifest injected into
 * their installed PWA — not the core yellow from env default.
 *
 * Icons stay on the core asset set in PR-1; skin-specific variants
 * (icon-192-pko.svg etc.) ship in PR-2 per execution plan item 26. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = resolveTheme(await getCurrentSkin());
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
      {
        src: isPko ? "/icons/icon-192-pko.svg" : "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: isPko ? "/icons/icon-512-pko.svg" : "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: isPko
          ? "/icons/icon-maskable-pko.svg"
          : "/icons/icon-maskable.svg",
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
        icons: [
          {
            src: isPko ? "/icons/icon-192-pko.svg" : "/icons/icon-192.svg",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Gry",
        short_name: "Gry",
        url: "/games",
        icons: [
          {
            src: isPko ? "/icons/icon-192-pko.svg" : "/icons/icon-192.svg",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}
