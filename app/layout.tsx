import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { NewGameToast } from "@/components/new-game-toast";
import { TierUpToast } from "@/components/tier-up-toast";
import { OnboardingTour } from "@/components/onboarding-tour";
import { CsrfBootstrap } from "@/components/csrf-bootstrap";
import { resolveTheme } from "@/lib/theme";
import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP, tierForLevel } from "@/lib/level";
import { dictFor, LANG_HTML } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getPlayerState } from "@/lib/player";
import { tickPlayer } from "@/lib/tick";
import { ensureSignupGift } from "@/lib/buildings";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  const dict = dictFor(lang);
  const theme = resolveTheme();
  // Lazy tick + signup gift on every authenticated render — both are
  // idempotent (tick is lock-guarded + ledger-deduped; gift is no-op if the
  // player already has ≥1 building). Runs before we read PlayerState so the
  // resource bar reflects the just-ticked balance.
  if (session) {
    await tickPlayer(session.username);
    const preState = await getPlayerState(session.username);
    await ensureSignupGift(preState);
  }
  const [stats, player] = await Promise.all([
    session ? userStats(session.username) : Promise.resolve(null),
    session ? getPlayerState(session.username) : Promise.resolve(null),
  ]);
  const xp = stats?.globalXP ?? 0;
  const level = levelFromXP(xp);
  return (
    <html
      lang={LANG_HTML[lang]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CsrfBootstrap />
        <SiteNav
          username={session?.username ?? null}
          xp={xp}
          rank={stats?.globalRank ?? null}
          level={level.level}
          levelProgress={level.progress}
          title={session ? `${tierForLevel(level.level).emoji} ${tierForLevel(level.level).name}` : null}
          lang={lang}
          dict={dict}
          resources={player?.resources ?? null}
        />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
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
                  en: "Tier up!",
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
              titleByTier={{
                1: { pl: "Drewniana chata", uk: "Хатинка", cs: "Dřevěná chata", en: "Wooden Shed" }[lang]!,
                2: { pl: "Rodzinny dom", uk: "Сімейний дім", cs: "Rodinný dům", en: "Family Home" }[lang]!,
                3: { pl: "Kamienica", uk: "Кам’яниця", cs: "Činžák", en: "Tenement" }[lang]!,
                4: { pl: "Solarna kamienica", uk: "Сонячна кам’яниця", cs: "Solární dům", en: "Solar House" }[lang]!,
                5: { pl: "Biurowiec", uk: "Офіс", cs: "Kancelář", en: "Office" }[lang]!,
                6: { pl: "Mrakodrap", uk: "Хмарочос", cs: "Mrakodrap", en: "Skyscraper" }[lang]!,
                7: { pl: "Altus Tower", uk: "Altus Tower", cs: "Altus Tower", en: "Altus Tower" }[lang]!,
                8: { pl: "Spodek", uk: "Сподек", cs: "Spodek", en: "Spodek Arena" }[lang]!,
                9: { pl: "Varso Tower — endgame", uk: "Varso Tower — ендгейм", cs: "Varso Tower — endgame", en: "Varso Tower — endgame" }[lang]!,
              }}
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
                <p className="text-xs text-zinc-400">
                  {theme.mascot.label} wspiera ekipę Watt City w PKO skinie.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500 pt-2">
              <span>{dict.footer.sponsors}</span>
              <span className="flex flex-wrap gap-3">
                <a href="/o-platforme" className="hover:text-[var(--accent)]">
                  {dict.nav.about}
                </a>
                <a
                  href="/ochrana-sukromia"
                  className="hover:text-[var(--accent)]"
                >
                  {dict.nav.privacy}
                </a>
                <a href="/sin-slavy" className="hover:text-[var(--accent)]">
                  {dict.nav.hall}
                </a>
                <a
                  href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026"
                  className="hover:text-[var(--accent)]"
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
