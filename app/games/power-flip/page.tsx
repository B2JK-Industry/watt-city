import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PowerFlipClient } from "@/components/games/power-flip-client";
import { powerRoundsFor, type PowerRound } from "@/lib/content/power-flip";
import { shuffle } from "@/lib/shuffle";
import { dictFor, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

function pickRound(lang: Lang): PowerRound[] {
  return shuffle(powerRoundsFor(lang)).map((r) => {
    if (Math.random() < 0.5) {
      return {
        ...r,
        left: r.right,
        right: r.left,
        correct: r.correct === "left" ? "right" : "left",
      };
    }
    return r;
  });
}

export default async function PowerFlipPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/power-flip");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.power;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-[var(--ink-muted)]">{t.headerBody}</p>
      </header>
      <PowerFlipClient rounds={pickRound(lang)} dict={dict} />
    </div>
  );
}
