import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { assignPlayer, getDuel, summarize } from "@/lib/duel";
import { DuelRoom } from "@/components/duel/duel-room";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function DuelRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const session = await getSession();
  if (!session) redirect(`/login?next=/duel/${code}`);
  const lang = await getLang();
  const dict = dictFor(lang);

  const record = await getDuel(code);
  if (!record) {
    return (
      <div className="max-w-md mx-auto card p-8 flex flex-col gap-4">
        <h1 className="text-2xl font-black uppercase">{dict.duel.title}</h1>
        <p className="text-zinc-400">
          <code className="text-[var(--accent)]">{code}</code>
        </p>
        <Link href="/duel" className="btn btn-primary w-fit">
          {dict.duel.back}
        </Link>
      </div>
    );
  }

  const role = assignPlayer(record, session.username);
  const initial = summarize(record);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <DuelRoom
        code={code}
        self={session.username}
        role={role}
        initial={initial}
        dict={dict}
      />
    </div>
  );
}
