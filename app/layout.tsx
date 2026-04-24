import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { NewGameToast } from "@/components/new-game-toast";
import { TierUpToast } from "@/components/tier-up-toast";
import { OnboardingTour } from "@/components/onboarding-tour";
import { CsrfBootstrap } from "@/components/csrf-bootstrap";
import { CookieConsent } from "@/components/cookie-consent";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { PwaRegister } from "@/components/pwa-register";
import { BottomTabs } from "@/components/bottom-tabs";
import { WattDeficitPanel } from "@/components/watt-deficit-panel";
import { deficitState } from "@/lib/watts";
import { resolveTheme } from "@/lib/theme";
import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP } from "@/lib/level";
import { cityLevelFromState } from "@/lib/city-level";
import { dictFor, LANG_HTML } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getPlayerState } from "@/lib/player";
import { tickPlayer } from "@/lib/tick";
import { ensureSignupGift } from "@/lib/buildings";
import { isFlagEnabled } from "@/lib/feature-flags";
import { isTeacher } from "@/lib/class";
import { parentKidUsername } from "@/lib/parent-link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watt City · Edukacja finansowa dla dzieci · Katowice",
  description:
    "Watt City — gra edukacyjna ucząca dzieci finansów osobistych. Graj w minigry → zarabiaj zasoby → buduj miasto → zaciągaj kredyt → spłacaj. SKO 2.0 prototype. Pitched to PKO BP at ETHSilesia 2026.",
  // Manifest is auto-served from app/manifest.ts — Next 16 injects the
  // <link rel="manifest"> tag, so no explicit `manifest` field here.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Watt City",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export function generateViewport() {
  const theme = resolveTheme();
  return {
    themeColor: theme.colors.accent,
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  const dict = dictFor(lang);
  const theme = resolveTheme();
  // Lazy tick on every authenticated render (idempotent, lock-guarded,
  // ledger-deduped). Must run before we read PlayerState so the
  // resource bar reflects the just-ticked balance.
  if (session) {
    await tickPlayer(session.username);
  }
  // Single `getPlayerState` round-trip — the prior layout called it
  // twice (once guarding `ensureSignupGift`, again inside the parallel
  // block). Folding: read once, pass to ensureSignupGift which returns
  // the same (possibly-mutated) state, and reuse downstream.
  const [
    stats,
    player,
    cityFirstEnabled,
    brownoutPanelEnabled,
    teacherFlag,
    linkedKid,
  ] = await Promise.all([
    session ? userStats(session.username) : Promise.resolve(null),
    session
      ? getPlayerState(session.username).then(ensureSignupGift)
      : Promise.resolve(null),
    session
      ? isFlagEnabled("v3_city_first", session.username)
      : Promise.resolve(true),
    session
      ? isFlagEnabled("v3_brownout_panel", session.username)
      : Promise.resolve(false),
    // Cleanup issue 5 — role lookup so SiteNav can add "Moje klasy" /
    // "Dziecko" / "Dla szkół" links appropriate to the viewer.
    session ? isTeacher(session.username) : Promise.resolve(false),
    session ? parentKidUsername(session.username) : Promise.resolve(null),
  ]);
  const navRole: "kid" | "teacher" | "parent" | "anon" = !session
    ? "anon"
    : teacherFlag
      ? "teacher"
      : linkedKid
        ? "parent"
        : "kid";
  const xp = stats?.globalXP ?? 0;
  const level = levelFromXP(xp);
  // V3.1: nav badge shows city-level + grid state when flag is on; falls back
  // to a minimal "Level N" XP label when flipped off (no tier emojis — those
  // were the XP-Arena legacy that V3 removes). Existing player data untouched.
  const navTitle = (() => {
    if (!session) return null;
    if (cityFirstEnabled && player) {
      return cityLevelFromState(player).badgeLabel;
    }
    return `XP Lv ${level.level}`;
  })();
  /* D8 polish — SKIN=pko only changed the brand chip colour before;
   * the rest of the app kept the Watt City yellow from :root. Inject
   * the PKO palette as a style override on <html> so every
   * `var(--accent)` / `var(--background)` / `var(--surface)` /
   * `var(--ink)` consumer picks up the PKO skin without per-component
   * rewrites. data-skin attribute lets CSS or tests key off the skin. */
  const skinVars: React.CSSProperties =
    theme.id === "pko"
      ? ({
          "--accent": theme.colors.accent,
          "--accent-2": theme.colors.accent,
          "--background": theme.colors.background,
          "--surface": theme.colors.surface,
          "--surface-2": theme.colors.surface,
          "--ink": theme.colors.ink,
          "--foreground": theme.colors.ink,
          "--brand": theme.colors.accent,
        } as React.CSSProperties)
      : ({} as React.CSSProperties);
  return (
    <html
      lang={LANG_HTML[lang]}
      data-skin={theme.id}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={skinVars}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">
          {{ pl: "Przejdź do treści", uk: "До контенту", cs: "Přejít na obsah", en: "Skip to content" }[lang]}
        </a>
        <CsrfBootstrap />
        <WebVitalsReporter />
        <PwaRegister lang={lang} />
        <CookieConsent lang={lang} hasBottomTabs={Boolean(session)} />
        {session && player && brownoutPanelEnabled && (
          <WattDeficitPanel deficit={deficitState(player)} lang={lang} />
        )}
        <SiteNav
          username={session?.username ?? null}
          role={navRole}
          xp={xp}
          rank={stats?.globalRank ?? null}
          level={level.level}
          levelProgress={level.progress}
          title={navTitle}
          lang={lang}
          dict={dict}
          resources={player?.resources ?? null}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8"
        >
          {children}
        </main>
        {/* CashflowHud moved to per-page mount — see
            components/cashflow-hud-mount.tsx. Lives on /miasto
            and /loans/compare where the hourly-yield + watt-balance
            numbers feed an active decision. Other pages use the
            resource-bar in SiteNav for passive state. */}
        {session && <BottomTabs lang={lang} />}
        {session && (
          <>
            <NewGameToast
              newChallengeLabel={
                {
                  pl: "🤖 Nowe wyzwanie AI",
                  uk: "🤖 Новий AI-виклик",
                  cs: "🤖 Nová AI výzva",
                  en: "🤖 New AI challenge",
                }[lang]
              }
              dismissLabel={{ pl: "Zamknij", uk: "Закрити", cs: "Zavřít", en: "Dismiss" }[lang]}
              playLabel={{ pl: "Graj", uk: "Грати", cs: "Hrát", en: "Play" }[lang]}
            />
            <OnboardingTour lang={lang} />
            <TierUpToast
              headline={
                {
                  pl: "Awans!",
                  uk: "Підвищення!",
                  cs: "Povýšení!",
                  en: "Level up!",
                }[lang]
              }
              levelWord={
                {
                  pl: "Poziom",
                  uk: "Рівень",
                  cs: "Úroveň",
                  en: "Level",
                }[lang]
              }
              dismissLabel={
                {
                  pl: "Zamknij",
                  uk: "Закрити",
                  cs: "Zavřít",
                  en: "Dismiss",
                }[lang]
              }
              /* Cleanup issue 2 — `titleByTier` map dropped. The V1 tier-
                 name vocabulary leaked to every logged-in user on level-up.
                 V3.1 city-first progression doesn't map 1-to-1 onto the
                 tier API's 1-9 scale, so the toast shows just "Poziom N" —
                 the concept the user sees on their nav badge + CityLevelCard. */
            />
          </>
        )}
        <footer className="w-full border-t-[3px] border-[var(--ink)] mt-12 bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] font-black text-sm"
                    style={{ background: theme.colors.accent, color: theme.colors.accentInk }}
                  >
                    {theme.brandShort}
                  </span>
                  <span className="font-black uppercase">{theme.brand}</span>
                </div>
                <p className="text-sm text-zinc-400 max-w-md">
                  {dict.footer.body
                    .replace("{event}", "§EVENT§")
                    .replace("{track}", "§TRACK§")
                    .split(/(§EVENT§|§TRACK§)/g)
                    .map((p, i) => {
                      if (p === "§EVENT§")
                        return (
                          <strong key={i} className="text-[var(--foreground)]">
                            {dict.footer.event}
                          </strong>
                        );
                      if (p === "§TRACK§")
                        return (
                          <strong key={i} className="text-[var(--accent)]">
                            {dict.footer.track}
                          </strong>
                        );
                      return <span key={i}>{p}</span>;
                    })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="brutal-tag" style={{ background: "var(--neo-cyan)", color: "#0a0a0f" }}>
                  PKO XP: Gaming
                </span>
                <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>
                  ETHSilesia 2026
                </span>
                <span className="brutal-tag" style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}>
                  Katowice · PL
                </span>
              </div>
            </div>
            <div className="border-t-2 border-[var(--ink)]/30 pt-4 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                ⚠️ {theme.disclaimer}
              </p>
            </div>
            {theme.mascot && (
              <div className="flex items-center gap-3 border-t-2 border-[var(--ink)]/20 pt-3">
                <div
                  className="w-12 h-16 flex-shrink-0"
                  aria-label={theme.mascot.label}
                  dangerouslySetInnerHTML={{ __html: theme.mascot.svg }}
                />
                <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                  <span className="font-black uppercase tracking-widest text-[11px]">
                    Powered by PKO Bank Polski
                  </span>
                  <span>
                    {theme.mascot.label} + SKO 2.0 partnership — wspiera ekipę
                    Watt City w PKO skinie.
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-400 pt-2">
              <span>{dict.footer.sponsors}</span>
              <span className="flex flex-wrap gap-3">
                <a href="/o-platforme" className="tap-target hover:text-[var(--accent)]">
                  {dict.nav.about}
                </a>
                <a
                  href="/ochrana-sukromia"
                  className="tap-target hover:text-[var(--accent)]"
                >
                  {dict.nav.privacy}
                </a>
                <a href="/sin-slavy" className="tap-target hover:text-[var(--accent)]">
                  {dict.nav.hall}
                </a>
                <a
                  href="https://github.com/B2JK-Industry/watt-city"
                  className="tap-target hover:text-[var(--accent)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {dict.footer.sourceLink}
                </a>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
