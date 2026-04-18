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
  title: "XP Arena — ucz się grając",
  description:
    "Gamifikovaná edukačná platforma. Hraj minihry, zbieraj XP, posúvaj sa v rebríčku.",
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
        <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-zinc-400">
          <p>
            XP Arena · ETHSilesia 2026 · PKO XP: Gaming track.{" "}
            <span className="opacity-70">
              Edukačná gamifikácia — uč sa financie, matematiku, vedomosti.
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}
