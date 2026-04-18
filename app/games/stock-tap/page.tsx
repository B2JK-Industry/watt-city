import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { StockTapClient } from "@/components/games/stock-tap-client";

export const dynamic = "force-dynamic";

export default async function StockTapPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/stock-tap");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Stock Tap</h1>
        <p className="text-zinc-400">
          Graf sa kreslí naživo. Klikni <strong>BUY</strong>, keď si myslíš, že
          cena je nízko, a <strong>SELL</strong>, keď vysoko. Zisk každého
          obchodu ide do Wattov. 45 sekúnd, max 220 W.
        </p>
      </header>
      <StockTapClient />
    </div>
  );
}
