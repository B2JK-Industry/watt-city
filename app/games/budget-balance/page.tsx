import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BudgetBalanceClient } from "@/components/games/budget-balance-client";
import { budgetScenariosFor } from "@/lib/content/budget-balance";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getGame } from "@/lib/games";
import { GameHero } from "@/components/game-hero";

export const dynamic = "force-dynamic";

export default async function BudgetBalancePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/budget-balance");
  const lang = await getLang();
  const dict = dictFor(lang);
  const gameMeta = getGame("budget-balance");
  if (!gameMeta) notFound();
  const pool = budgetScenariosFor(lang);
  // Server component evaluated per-request (force-dynamic): random scenario selection
  // is intentional — each page load gets a fresh scenario from the pool.
  const scenarioIndex = Math.floor(Math.random() * pool.length);
  const pick = pool[scenarioIndex];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
      </header>
      <GameHero game={gameMeta} lang={lang} dict={dict} />
      <BudgetBalanceClient scenario={pick} dict={dict} />
    </div>
  );
}
