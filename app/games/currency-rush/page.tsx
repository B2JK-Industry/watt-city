import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { CurrencyRushClient } from "@/components/games/currency-rush-client";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function CurrencyRushPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/currency-rush");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.currency;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-zinc-400">{t.headerBody}</p>
      </header>
      <CurrencyRushClient dict={dict} />
    </div>
  );
}
