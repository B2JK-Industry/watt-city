import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ResourceBar } from "@/components/resource-bar";
import { NotificationBell } from "@/components/notification-bell";
import { resolveTheme, type SkinId } from "@/lib/theme";
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
  /** Request-resolved skin from the layout. When omitted we fall back
   *  to env-based resolution — fine for static nav, but breaks the
   *  xp_skin cookie path. Layout always passes this. */
  skin?: SkinId;
};

const SCHOOL_LABEL: Record<Lang, string> = {
  pl: "Dla szkół",
  uk: "Для шкіл",
  cs: "Pro školy",
  en: "For schools",
};

const TEACHER_CLASSES_LABEL: Record<Lang, string> = {
  pl: "Moje klasy",
  uk: "Мої класи",
  cs: "Mé třídy",
  en: "My classes",
};

const PARENT_KID_LABEL: Record<Lang, string> = {
  pl: "Dziecko",
  uk: "Дитина",
  cs: "Dítě",
  en: "My kid",
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
  skin,
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
  // entry point. Anonymous visitor gets the classroom landing CTA;
  // logged-in teacher gets the class dashboard; logged-in parent
  // (linked to a kid) gets the observer dashboard.
  const navLinks: Array<{ href: string; label: string }> = [
    { href: "/miasto", label: t.city },
    { href: "/games", label: t.games },
    { href: "/leaderboard", label: t.league },
    { href: "/o-platforme", label: t.about },
  ];
  if (role === "anon") {
    navLinks.push({ href: "/dla-szkol", label: SCHOOL_LABEL[lang] });
  } else if (role === "teacher") {
    navLinks.push({ href: "/nauczyciel", label: TEACHER_CLASSES_LABEL[lang] });
  } else if (role === "parent") {
    navLinks.push({ href: "/rodzic", label: PARENT_KID_LABEL[lang] });
  }
  return (
    <header className="w-full border-b-[3px] border-[var(--ink)] sticky top-0 z-20 bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {(() => {
          const theme = resolveTheme(skin);
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
              className="tap-target hover:text-[var(--accent)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {username ? (
            <>
              {/* Narrow-viewport tiering — 320 px is the smallest phone
                  we support. With ring + chip + bell + lang + logout the
                  right cluster spans ~283 px, which combined with the
                  brand logo (110 px) overflows a 320-px viewport. Hide
                  the purely-informational chip + ring below ~400 px,
                  keep the interactive controls reachable. */}
              <span
                className="level-ring hidden min-[420px]:inline-flex"
                style={{ ["--p" as string]: String(pct) }}
                title={`Tier ${level} · ${pct}%`}
              >
                <span>{level}</span>
              </span>
              <span className="chip hidden min-[380px]:inline-flex">
                <strong>{xp.toLocaleString("pl-PL")} W</strong>
                {rank !== null && (
                  <span className="opacity-70 hidden sm:inline">· #{rank}</span>
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
      {/* Mobile-only secondary nav. Wrapping in <nav> (not <div>) gives
          the `nav a` tap-target CSS (globals.css §7.3.1) a selector
          to hit + a proper landmark for screen readers. */}
      <nav
        aria-label={t.city}
        className="sm:hidden border-t border-[var(--ink)]/30 bg-[var(--surface)]"
      >
        <div className="max-w-6xl mx-auto px-3 py-1.5 overflow-x-auto">
          <ul className="flex items-center gap-3 text-xs font-semibold whitespace-nowrap">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="tap-target px-2 py-1 rounded hover:text-[var(--accent)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
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
