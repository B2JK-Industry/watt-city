import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { CurrencyRushClient } from "@/components/games/currency-rush-client";

export const dynamic = "force-dynamic";

export default async function CurrencyRushPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/games/currency-rush");
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Kurzový šprint</h1>
        <p className="text-zinc-400">
          45 sekúnd na čo najviac prevodov. EUR ↔ PLN ↔ USD. Tolerancia ±2 %.
          Správna +12 XP, zlá −4 (min 0). Strop 180 XP.
        </p>
      </header>
      <CurrencyRushClient />
    </div>
  );
}
