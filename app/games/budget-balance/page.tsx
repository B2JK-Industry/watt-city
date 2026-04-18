import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BudgetBalanceClient } from "@/components/games/budget-balance-client";
import { SCENARIOS } from "@/lib/content/budget-balance";

export const dynamic = "force-dynamic";

export default async function BudgetBalancePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/budget-balance");
  const pick = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Budget Balance</h1>
        <p className="text-zinc-400">
          Rozdeľ mesačný príjem medzi 4 kategórie. Čím bližšie k odporúčanému
          pásmu, tým viac XP. Učíš sa pravidlo 50/30/20 na živých scenároch.
        </p>
      </header>
      <BudgetBalanceClient scenario={pick} />
    </div>
  );
}
