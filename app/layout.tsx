import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { getSession } from "@/lib/session";
import { userStats } from "@/lib/leaderboard";
import { levelFromXP, titleForLevel } from "@/lib/level";

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
    "Gamifikovaná edukačná platforma z Katowíc. Minihry o financiách, energetike a ekonómii. Vstup do kategórie PKO XP: Gaming na ETHSilesia 2026.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const stats = session ? await userStats(session.username) : null;
  const xp = stats?.globalXP ?? 0;
  const level = levelFromXP(xp);
  return (
    <html
      lang="sk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav
          username={session?.username ?? null}
          xp={xp}
          rank={stats?.globalRank ?? null}
          level={level.level}
          levelProgress={level.progress}
          title={session ? titleForLevel(level.level) : null}
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
                  Postavené v Katowiciach počas hackathonu{" "}
                  <strong className="text-[var(--foreground)]">ETHSilesia 2026</strong>{" "}
                  (17–19. apríl 2026) pre kategóriu{" "}
                  <strong className="text-[var(--accent)]">PKO XP: Gaming</strong> —
                  gamifikácia finančnej a energetickej edukácie pre Gen Z.
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
              <span>
                Sponzori: PKO Bank Polski · Tauron · ETHWarsaw · AKMF · Katowicki.Hub
              </span>
              <a
                href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026"
                className="hover:text-[var(--accent)]"
                target="_blank"
                rel="noreferrer"
              >
                Zdrojový kód →
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
