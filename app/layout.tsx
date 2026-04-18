import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP, tierForLevel } from "@/lib/level";
import { dictFor, LANG_HTML } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XP Arena · ETHSilesia 2026 · Katowice",
  description:
    "Gamifikowana edukacja finansowa i energetyczna z Katowic. Minigry o finansach, energetyce i ekonomii. Wpis do kategorii PKO XP: Gaming na ETHSilesia 2026.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  const dict = dictFor(lang);
  const stats = session ? await userStats(session.username) : null;
  const xp = stats?.globalXP ?? 0;
  const level = levelFromXP(xp);
  return (
    <html
      lang={LANG_HTML[lang]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav
          username={session?.username ?? null}
          xp={xp}
          rank={stats?.globalRank ?? null}
          level={level.level}
          levelProgress={level.progress}
          title={session ? `${tierForLevel(level.level).emoji} ${tierForLevel(level.level).name}` : null}
          lang={lang}
          dict={dict}
        />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="w-full border-t-[3px] border-[var(--ink)] mt-12 bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 bg-[var(--accent)] border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] text-[#0a0a0f] font-black text-sm">
                    XP
                  </span>
                  <span className="font-black uppercase">Arena</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500 border-t-2 border-[var(--ink)]/30 pt-4">
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
