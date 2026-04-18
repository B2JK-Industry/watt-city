import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DuelLobby } from "@/components/duel/duel-lobby";

export const dynamic = "force-dynamic";

export default async function DuelPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/duel");
  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">Duel</h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}
          >
            Kurzový šprint · 6 kôl
          </span>
        </div>
        <p className="text-zinc-400 max-w-2xl">
          Zmeraj si sily s kamarátom. Vytvor duel, pošli mu 6-znakový kód —
          obaja dostanete <strong>identických 6 prevodov</strong> (rovnaký seed).
          V každom kole vyhráva ten, kto napíše <strong>presnejšie číslo</strong>.
          Ak je rozdiel rovnaký, rozhoduje rýchlejšia odpoveď.
        </p>
      </header>
      <DuelLobby username={session.username} />
      <div className="card p-5 text-sm text-zinc-400">
        <h2 className="brutal-heading text-lg mb-2">Ako to funguje</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-1">
          <li>Klik „Vytvoriť duel" → dostaneš kód, napr. <code>K7WXM3</code>.</li>
          <li>Pošli kód kamarátovi (Messenger, SMS, in-person).</li>
          <li>On ho zadá vyššie, klik „Pripojiť sa".</li>
          <li>Obaja zahráte 6 kôl. Nemusíte naraz — ale hráte <em>rovnaké</em> otázky.</li>
          <li>Stránka <code>/duel/&lt;kód&gt;</code> ukazuje výsledok live.</li>
        </ol>
        <p className="mt-3 text-zinc-500">
          Tip: Duel neuznáva XP / tiers — je to čistá súťaž na presnosť. Ale
          zahrievacie kolo singleplayer <Link className="underline" href="/games/currency-rush">Kurzový šprint</Link> sa počíta.
        </p>
      </div>
    </div>
  );
}
