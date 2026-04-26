import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ResourceBar } from "@/components/resource-bar";
import { NotificationBell } from "@/components/notification-bell";
import { NavLink } from "@/components/nav-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { OpenTutorialButton } from "@/components/onboarding-tour";
import { resolveTheme } from "@/lib/theme";
import type { Lang, Dict } from "@/lib/i18n";
import type { Resources } from "@/lib/resources";

const DRAWER_LABELS: Record<Lang, { menu: string; open: string; close: string; language: string }> = {
  pl: { menu: "Menu", open: "Otwórz menu", close: "Zamknij menu", language: "Język" },
  uk: { menu: "Меню", open: "Відкрити меню", close: "Закрити меню", language: "Мова" },
  cs: { menu: "Menu", open: "Otevřít menu", close: "Zavřít menu", language: "Jazyk" },
  en: { menu: "Menu", open: "Open menu", close: "Close menu", language: "Language" },
};

/* I-06 (F-NEW-17, scoped) — nav-level "Replay tutorial" affordance.
 * Implemented via the existing `OpenTutorialButton` client component
 * (mounted in the desktop right cluster + mobile drawer footer). No
 * FAQ, no Kontakt entries — those need product copy decisions; the
 * replay button is the safe shipping subset. */

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
  // R-03 — `/loans/compare` was previously reachable only from the
  // /miasto mortgage panel deep-link. Adding the 5th nav slot makes
  // the comparison surface a first-class entry. The label keys land
  // in `nav.loans` for all 4 locales (Kredyty / Кредити / Půjčky /
  // Loans). Anonymous users are bounced to /login by the page guard,
  // which is consistent with /miasto.
  const navLinks: Array<{ href: string; label: string }> = [
    { href: "/miasto", label: t.city },
    { href: "/games", label: t.games },
    { href: "/loans/compare", label: t.loans },
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
    <header className="w-full border-b border-[var(--line)] sticky top-0 z-40 bg-[var(--surface)]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-[56px] sm:h-[72px] flex items-center justify-between gap-4">
        {(() => {
          const theme = resolveTheme();
          return (
            // R-01 — anchor wrap got a `rounded-md` so the global
            // `:focus-visible { outline-offset: 2px }` ring traces the
            // logo block, not a square clipped through the navy tile.
            // Padding gives the orange accent breathing room from the
            // outline.
            //
            // Icon swap (PR-M) — replaced the WC initials chip with the
            // shipped brand mark (`/app/icon.png` is the favicon source;
            // `wattcity-icon-96.png` is the same artwork at nav-bar dpr).
            // Wordmark + "by PKO" stay text-based so they remain
            // theme-aware (token-driven colour) and translatable —
            // the bitmap holds only the iconography.
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-md px-1 -mx-1"
              aria-label={`${theme.brand} by PKO`}
            >
              <Image
                src="/brand/wattcity-icon-96.png"
                alt=""
                aria-hidden
                width={36}
                height={36}
                priority
                className="rounded-md"
              />
              <span className="flex items-baseline gap-1.5">
                <span className="font-semibold text-lg text-[var(--foreground)]">
                  {theme.brand}
                </span>
                <span className="hidden min-[420px]:inline t-overline text-[var(--accent)]">
                  by PKO
                </span>
              </span>
            </Link>
          );
        })()}
        {/* R-01 — gap 5 → 4 reclaims a few pixels so 5 nav links + the
            right cluster fit at lg without "O platformě" wrapping. */}
        <div className="hidden lg:flex items-stretch self-stretch gap-4 text-sm">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {username ? (
            <>
              {/* R-01 — status indicators (level ring, XP chip,
                  username card with title) jumped to `xl+` (≥1280).
                  At lg (1024–1279) the row had: 5 nav links + ring +
                  chip + username card + bell + tutorial + lang +
                  logout — that overflowed and pushed the username
                  card under the bell. xl+ keeps the full info, lg–xl
                  keeps just the interactive controls. */}
              <span
                className="level-ring hidden xl:inline-flex"
                style={{ ["--p" as string]: String(pct) }}
                title={`Tier ${level} · ${pct}%`}
              >
                <span>{level}</span>
              </span>
              <span className="chip hidden xl:inline-flex">
                <strong>{xp.toLocaleString("pl-PL")} W</strong>
                {rank !== null && (
                  <span className="opacity-70">· #{rank}</span>
                )}
              </span>
              <span className="hidden xl:flex flex-col leading-tight">
                <span className="font-semibold">{username}</span>
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
              {/* Lang + logout live in header on desktop, in the drawer
                  on mobile/tablet (see footer prop below). This removes
                  the cramped 5-control cluster from narrow viewports
                  per the demo-review punch list. */}
              <span className="hidden lg:inline-flex">
                <OpenTutorialButton
                  lang={lang}
                  className="btn btn-ghost btn-sm"
                />
              </span>
              <span className="hidden lg:inline-flex">
                <LanguageSwitcher current={lang} />
              </span>
              <span className="hidden lg:inline-flex">
                <LogoutButton label={t.logout} />
              </span>
              <MobileNavDrawer
                ariaLabel={DRAWER_LABELS[lang].menu}
                openLabel={DRAWER_LABELS[lang].open}
                closeLabel={DRAWER_LABELS[lang].close}
                footer={
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="t-body-sm font-semibold text-[var(--foreground)]">
                        {username}
                      </span>
                      {title && (
                        <span className="text-[11px] font-semibold text-[var(--accent)]">
                          {title}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="t-overline text-[var(--ink-muted)]">
                        {DRAWER_LABELS[lang].language}
                      </span>
                      <LanguageSwitcher current={lang} variant="drawer" />
                    </div>
                    {/* I-06 — replay tutorial action lives in the
                        drawer footer for mobile + tablet. The
                        `OpenTutorialButton` (client component)
                        dispatches `wc:open-tour`, opening the
                        OnboardingTour modal on top of the current
                        page. site-nav.tsx is a server component, so
                        the onClick has to live inside the existing
                        client primitive. */}
                    <OpenTutorialButton
                      lang={lang}
                      className="btn btn-secondary self-start"
                    />
                    <LogoutButton label={t.logout} />
                  </>
                }
              >
                {navLinks.map((l) => (
                  <NavLink key={l.href} href={l.href} variant="mobile">
                    <span className="t-h5 block py-2">{l.label}</span>
                  </NavLink>
                ))}
              </MobileNavDrawer>
            </>
          ) : (
            <>
              {/* Desktop: lang + login + register; Mobile: register only +
                  drawer (login + lang inside). Cuts header to logo + 1
                  primary CTA + menu per demo-review punch list. */}
              <span className="hidden lg:inline-flex">
                <LanguageSwitcher current={lang} />
              </span>
              <Link
                href="/login"
                className="hidden lg:inline-flex btn btn-secondary btn-sm"
              >
                {t.login}
              </Link>
              <Link href="/register" className="btn btn-sales btn-sm">
                {t.register}
              </Link>
              <MobileNavDrawer
                ariaLabel={DRAWER_LABELS[lang].menu}
                openLabel={DRAWER_LABELS[lang].open}
                closeLabel={DRAWER_LABELS[lang].close}
                footer={
                  <>
                    <Link
                      href="/login"
                      className="btn btn-secondary"
                    >
                      {t.login}
                    </Link>
                    <div className="flex flex-col gap-2">
                      <span className="t-overline text-[var(--ink-muted)]">
                        {DRAWER_LABELS[lang].language}
                      </span>
                      <LanguageSwitcher current={lang} variant="drawer" />
                    </div>
                  </>
                }
              >
                {navLinks.map((l) => (
                  <NavLink key={l.href} href={l.href} variant="mobile">
                    <span className="t-h5 block py-2">{l.label}</span>
                  </NavLink>
                ))}
              </MobileNavDrawer>
            </>
          )}
        </div>
      </nav>
      {username && resources && (
        <div className="border-t border-[var(--line)] bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 overflow-x-auto">
            <ResourceBar resources={resources} lang={lang} />
          </div>
        </div>
      )}
    </header>
  );
}
