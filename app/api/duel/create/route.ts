import { getSession } from "@/lib/session";
import { createDuel } from "@/lib/duel";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { ok: false, error: "Musíš byť prihlásený." },
      { status: 401 },
    );
  }
  const duel = await createDuel(session.username);
  return Response.json({ ok: true, code: duel.code });
}
