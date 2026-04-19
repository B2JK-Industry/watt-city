import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { compareLoans } from "@/lib/loans";
import { LoanComparison } from "@/components/loan-comparison";
import { KnfDisclaimer } from "@/components/knf-disclaimer";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type SearchParams = {
  principal?: string;
  term?: string;
};

export default async function LoanComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/loans/compare");
  }
  const qs = await searchParams;
  const principal = Math.max(100, Math.min(50_000, Number(qs.principal ?? 3000)));
  const termMonths = Math.max(1, Math.min(36, Number(qs.term ?? 12)));
  const [state, lang] = await Promise.all([
    getPlayerState(session.username),
    getLang(),
  ]);
  const rows = compareLoans(principal, termMonths, state);
  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-4xl">
      <KnfDisclaimer lang={lang} variant="card" />
      <LoanComparison
        rows={rows}
        lang={lang}
        principal={principal}
        termMonths={termMonths}
      />
    </div>
  );
}
