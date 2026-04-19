import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ResourceBar } from "@/components/resource-bar";
import { NotificationBell } from "@/components/notification-bell";
import { resolveTheme } from "@/lib/theme";
import type { Lang, Dict } from "@/lib/i18n";
import type { Resources } from "@/lib/resources";

type Props = {
  username: string | null;
  xp: number;
  rank: number | null;
  level: number;
  levelProgress: number; // 0..1
  title: string | null;
  lang: Lang;
  dict: Dict;
  /** Server-fetched wallet. Null when anonymous. */
  resources: Resources | null;
  /** Cleanup issue 5 — role-aware nav discoverability. Passed from
   *  `app/layout.tsx` after reading the session user's teacher/parent
   *  flags. Defaults to `"kid"` when omitted so existing callers keep
   *  working. */
  role?: "kid" | "teacher" | "parent" | "anon";
};

export function SiteNav({
  username,
  xp,
  rank,
  level,
  levelProgress,
  title,
  lang,
  dict,
  resources,
  role = username ? "kid" : "anon",
}: Props) {
  const pct = Math.round(levelProgress * 100);
  const t = dict.nav;
  // V2 R3.3 — nav cleanup: fold "Sala sławy" into Ranking, drop duplicates.
  // "Liga" keeps its existing dict key but visually reads as a city-first
  // ranking (leaderboard page switches to topCities in R3.1.2).
  // V3.6 — /duel routes removed (see ADR 001-v3-duel-removal). nav nie
  // ukazuje link; dict keys zachované pre back-compat ale nie sú
  // referencované.
  // Cleanup issue 5 — role-aware links so every V4 page has a nav
  // entry point. Teachers see their class dashboard, parents linked
  // to a kid see the observer dashboard, everyone else (anon + kid)
  // sees the classroom landing so a parent browsing over a child's
  // shoulder has a one-tap path without logging out. All labels read
  // from the `nav` dict — no per-Lang lookup tables in this file.
  const navLinks: Array<{ href: string; label: string }> = [
    { href: "/miasto", label: t.city },
    { href: "/games", label: t.games },
    { href: "/leaderboard", label: t.league },
    { href: "/o-platforme", label: t.about },
  ];
  if (role === "teacher") {
    navLinks.push({ href: "/nauczyciel", label: t.teacherClasses });
  } else if (role === "parent") {
    navLinks.push({ href: "/rodzic", label: t.parentKid });
  } else {
    navLinks.push({ href: "/dla-szkol", label: t.school });
  }
  return (
    <header className="w-full border-b-[3px] border-[var(--ink)] sticky top-0 z-20 bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {(() => {
          const theme = resolveTheme();
          return (
            <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
              <span
                className="inline-flex items-center justify-center w-9 h-9 border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black text-base"
                style={{ background: theme.colors.accent, color: theme.colors.accentInk }}
              >
                {theme.brandShort}
              </span>
              <span className="uppercase">{theme.brand}</span>
            </Link>
          );
        })()}
        <div className="hidden sm:flex items-center gap-5 text-sm">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[var(--accent)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {username ? (
            <>
              <span
                className="level-ring"
                style={{ ["--p" as string]: String(pct) }}
                title={`Tier ${level} · ${pct}%`}
              >
                <span>{level}</span>
              </span>
              <span className="chip">
                <strong>{xp.toLocaleString("pl-PL")} W</strong>
                {rank !== null && (
                  <span className="opacity-70">· #{rank}</span>
                )}
              </span>
              <span className="hidden md:flex flex-col leading-tight">
                <span className="font-bold uppercase tracking-tight">{username}</span>
                {title && (
                  <span className="text-[11px] font-semibold text-[var(--accent)]">
                    {title}
                  </span>
                )}
              </span>
              <NotificationBell
                labels={{
                  bell: { pl: "Powiadomienia", uk: "Сповіщення", cs: "Upozornění", en: "Notifications" }[lang]!,
                  empty: { pl: "Brak powiadomień.", uk: "Порожньо.", cs: "Žádná upozornění.", en: "No notifications." }[lang]!,
                  markSeen: { pl: "Oznacz jako przeczytane", uk: "Позначити прочитаним", cs: "Označit jako přečtené", en: "Mark as seen" }[lang]!,
                  quietActive: { pl: "Cisza nocna — push wstrzymany", uk: "Тиша — push призупинено", cs: "Noční klid — push pozastaven", en: "Quiet hours — push held" }[lang]!,
                }}
              />
              <LanguageSwitcher current={lang} />
              <LogoutButton label={t.logout} />
            </>
          ) : (
            <>
              <LanguageSwitcher current={lang} />
              <Link href="/login" className="btn btn-ghost text-sm">
                {t.login}
              </Link>
              <Link href="/register" className="btn btn-primary text-sm">
                {t.register}
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="sm:hidden border-t border-[var(--ink)]/30 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-3 py-1.5 overflow-x-auto">
          <ul className="flex items-center gap-3 text-xs font-semibold whitespace-nowrap">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="px-2 py-1 rounded hover:text-[var(--accent)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {username && resources && (
        <div className="border-t border-[var(--ink)]/30 bg-[var(--background)]">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 overflow-x-auto">
            <ResourceBar resources={resources} lang={lang} />
          </div>
        </div>
      )}
    </header>
  );
}
