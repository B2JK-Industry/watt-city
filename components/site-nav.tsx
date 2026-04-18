import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type Props = {
  username: string | null;
  xp: number;
  rank: number | null;
};

export function SiteNav({ username, xp, rank }: Props) {
  return (
    <header className="w-full border-b border-[var(--border)]/60 backdrop-blur sticky top-0 z-20 bg-[color-mix(in_oklab,var(--background)_80%,transparent)]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-block w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" />
          <span>XP Arena</span>
        </Link>
        <div className="hidden sm:flex items-center gap-5 text-sm">
          <Link href="/games" className="hover:text-[var(--accent)]">Hry</Link>
          <Link href="/leaderboard" className="hover:text-[var(--accent)]">Rebríček</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {username ? (
            <>
              <span className="chip">
                <span className="opacity-70">XP</span>
                <strong>{xp}</strong>
                {rank !== null && (
                  <span className="opacity-70">· #{rank}</span>
                )}
              </span>
              <span className="hidden sm:inline opacity-80">{username}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost text-sm">Prihlásiť</Link>
              <Link href="/register" className="btn btn-primary text-sm">Registrácia</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
