import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { assignPlayer, getDuel, summarize } from "@/lib/duel";
import { DuelRoom } from "@/components/duel/duel-room";

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

  const record = await getDuel(code);
  if (!record) {
    return (
      <div className="max-w-md mx-auto card p-8 flex flex-col gap-4">
        <h1 className="text-2xl font-black uppercase">Duel neexistuje</h1>
        <p className="text-zinc-400">
          Kód <code className="text-[var(--accent)]">{code}</code> nie je
          platný, alebo duel už expiroval (po 6 hodinách).
        </p>
        <Link href="/duel" className="btn btn-primary w-fit">
          Späť na lobby
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
      />
    </div>
  );
}
