import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { EnergyDashClient } from "@/components/games/energy-dash-client";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EnergyDashPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/energy-dash");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.energy;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-[var(--ink-muted)]">{t.headerBody}</p>
      </header>
      <EnergyDashClient dict={dict} />
    </div>
  );
}
