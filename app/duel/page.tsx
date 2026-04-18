import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DuelLobby } from "@/components/duel/duel-lobby";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function DuelPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/duel");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.duel;
  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">{t.title}</h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}
          >
            {t.tagGame}
          </span>
        </div>
        <p className="text-zinc-400 max-w-2xl">{t.intro}</p>
      </header>
      <DuelLobby username={session.username} dict={dict} />
      <div className="card p-5 text-sm text-zinc-400">
        <h2 className="brutal-heading text-lg mb-2">{t.howTitle}</h2>
        <p className="text-sm">
          1. {t.createButton} → 2. {t.joinButton} → 3. {t.start} → 4. {t.confirm}
        </p>
        <p className="mt-3 text-zinc-500 text-xs">
          <Link className="underline" href="/games/currency-rush">
            {dict.currency.headerTitle}
          </Link>{" "}
          /{" "}
          <Link className="underline" href="/games/math-sprint">
            {dict.math.headerTitle}
          </Link>
        </p>
      </div>
    </div>
  );
}
