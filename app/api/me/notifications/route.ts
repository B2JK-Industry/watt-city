import { z } from "zod";
import { getSession } from "@/lib/session";
import {
  listNotifications,
  markAllSeen,
  readPrefs,
  writePrefs,
} from "@/lib/notifications";
import { withPlayerLock } from "@/lib/player-lock";

// Validated body schema — the prior typed-but-unvalidated shape let a
// user persist garbage like `{quietHours: {start: "🔥"}}` into their
// own prefs, which would crash the next read on destructuring. Not
// cross-user exploitable (gated to self via session) but a one-shot
// self-DoS on the notification panel. Zod enforces primitives +
// bounded ranges so a malicious payload is rejected pre-write.
const PrefsSchema = z.object({
  enabled: z
    .object({
      "in-app": z.boolean().optional(),
      push: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .partial()
    .optional(),
  quietHours: z
    .object({
      enabled: z.boolean().optional(),
      start: z.number().int().min(0).max(23).optional(),
      end: z.number().int().min(0).max(23).optional(),
    })
    .partial()
    .optional(),
});

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mark-seen") }),
  z.object({ action: z.literal("set-prefs"), prefs: PrefsSchema }),
]);

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [feed, prefs] = await Promise.all([
    listNotifications(session.username, 50),
    readPrefs(session.username),
  ]);
  return Response.json({ ok: true, ...feed, prefs });
}

// POST { action: "mark-seen" } | { action: "set-prefs", prefs: {...} }
export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let parsed;
  try {
    const raw = await request.json();
    parsed = BodySchema.safeParse(raw);
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: `bad request: ${parsed.error.message}` },
      { status: 400 },
    );
  }
  const body = parsed.data;
  return withPlayerLock(session.username, async () => {
    if (body.action === "mark-seen") {
      await markAllSeen(session.username);
      return Response.json({ ok: true });
    }
    // action === "set-prefs"
    const next = await writePrefs(session.username, body.prefs);
    return Response.json({ ok: true, prefs: next });
  });
}
