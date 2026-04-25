import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
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

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watt City by PKO · Edukacja finansowa dla dzieci · Katowice",
  description:
    "Watt City by PKO — gra edukacyjna ucząca dzieci finansów osobistych. Graj w minigry → zarabiaj zasoby → buduj miasto → zaciągaj kredyt → spłacaj. SKO 2.0 prototype. Pitched to PKO BP at ETHSilesia 2026.",
  manifest: "/manifest.webmanifest",
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

export const viewport = {
  themeColor: "#003574",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

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
  /* Inject full theme palette as inline CSS variables on <html> so every
   * `var(--*)` consumer picks up the skin without per-component rewrites.
   * data-skin attribute lets CSS / tests key off the skin id. */
  const skinVars: React.CSSProperties =
    theme.id === "pko"
      ? ({
          "--accent": theme.colors.accent,
          "--accent-hover": theme.colors.accentHover,
          "--accent-ink": theme.colors.accentInk,
          "--accent-2": theme.colors.accent,
          "--sales": theme.colors.sales,
          "--sales-hover": theme.colors.salesHover,
          "--sales-ink": theme.colors.salesInk,
          "--background": theme.colors.background,
          "--surface": theme.colors.surface,
          "--surface-2": theme.colors.surfaceAlt,
          "--ink": theme.colors.ink,
          "--ink-muted": theme.colors.inkMuted,
          "--ink-subtle": theme.colors.inkSubtle,
          "--foreground": theme.colors.ink,
          "--line": theme.colors.line,
          "--success": theme.colors.success,
          "--danger": theme.colors.danger,
          "--focus-ring": theme.colors.accent,
          "--brand": theme.colors.accent,
        } as React.CSSProperties)
      : ({} as React.CSSProperties);
  return (
    <html
      lang={LANG_HTML[lang]}
      data-skin={theme.id}
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        <SiteFooter lang={lang} dict={dict} theme={theme} />
      </body>
    </html>
  );
}
