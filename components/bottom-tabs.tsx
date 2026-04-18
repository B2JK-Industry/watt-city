import Link from "next/link";
import type { Lang } from "@/lib/i18n";

/* Phase 7.3.5 — mobile-only bottom-tab navigation (< 640px viewport).
 *
 * Shows 4 primary destinations. The desktop `SiteNav` still renders the
 * full horizontal row; this component is an additional bottom bar that
 * only appears below `sm:` breakpoint, so thumb-reach on phones is
 * comfortable without collapsing the desktop UX.
 */
export function BottomTabs({ lang }: { lang: Lang }) {
  const copy = {
    pl: { city: "Miasto", games: "Gry", profile: "Profil", market: "Giełda" },
    uk: { city: "Місто", games: "Ігри", profile: "Профіль", market: "Біржа" },
    cs: { city: "Město", games: "Hry", profile: "Profil", market: "Burza" },
    en: { city: "City", games: "Games", profile: "Profile", market: "Market" },
  }[lang];
  const tabs = [
    { href: "/miasto", icon: "🏙️", label: copy.city },
    { href: "/games", icon: "🎮", label: copy.games },
    { href: "/marketplace", icon: "🛒", label: copy.market },
    { href: "/profile", icon: "👤", label: copy.profile },
  ];
  return (
    <nav
      className="bottom-tabs sm:hidden fixed bottom-0 inset-x-0 z-20 bg-[var(--surface)] border-t-[3px] border-[var(--ink)]"
      aria-label={lang === "pl" ? "Nawigacja dolna" : "Bottom navigation"}
    >
      <ul className="grid grid-cols-4 text-[11px]">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex flex-col items-center justify-center py-2 gap-0.5 text-zinc-300 hover:text-[var(--accent)]"
            >
              <span aria-hidden className="text-lg leading-none">
                {t.icon}
              </span>
              <span className="font-semibold">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
