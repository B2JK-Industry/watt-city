import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Lang, Dict } from "@/lib/i18n";

type Props = {
  username: string | null;
  xp: number;
  rank: number | null;
  level: number;
  levelProgress: number; // 0..1
  title: string | null;
  lang: Lang;
  dict: Dict;
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
}: Props) {
  const pct = Math.round(levelProgress * 100);
  const t = dict.nav;
  return (
    <header className="w-full border-b-[3px] border-[var(--ink)] sticky top-0 z-20 bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
          <span className="inline-flex items-center justify-center w-9 h-9 bg-[var(--accent)] border-[3px] border-[var(--ink)] shadow-[3px_3px_0_0_var(--ink)] text-[var(--background)] font-black text-base">
            XP
          </span>
          <span className="uppercase">Arena</span>
        </Link>
        <div className="hidden sm:flex items-center gap-5 text-sm">
          <Link href="/games" className="hover:text-[var(--accent)] transition-colors">
            {t.city}
          </Link>
          <Link href="/duel" className="hover:text-[var(--accent)] transition-colors">
            {t.duel}
          </Link>
          <Link
            href="/leaderboard"
            className="hover:text-[var(--accent)] transition-colors"
          >
            {t.league}
          </Link>
          <Link
            href="/sin-slavy"
            className="hover:text-[var(--accent)] transition-colors"
          >
            {t.hall}
          </Link>
          <Link
            href="/o-platforme"
            className="hover:text-[var(--accent)] transition-colors"
          >
            {t.about}
          </Link>
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
              <LanguageSwitcher current={lang} />
              <LogoutButton />
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
    </header>
  );
}
