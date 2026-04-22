import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BudgetBalanceClient } from "@/components/games/budget-balance-client";
import { budgetScenariosFor } from "@/lib/content/budget-balance";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function BudgetBalancePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/budget-balance");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.budget;
  const pool = budgetScenariosFor(lang);
  // Server component evaluated per-request (force-dynamic): random scenario selection
  // is intentional — each page load gets a fresh scenario from the pool.
  const scenarioIndex = Math.floor(Math.random() * pool.length);
  const pick = pool[scenarioIndex];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-zinc-400">{t.headerBody}</p>
      </header>
      <BudgetBalanceClient scenario={pick} dict={dict} />
    </div>
  );
}
