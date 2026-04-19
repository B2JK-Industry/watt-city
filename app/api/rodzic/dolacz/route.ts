import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { redeemParentCode } from "@/lib/parent-link";

/* V4.6 — parent redeems a 6-char code issued by their kid. */

const BodySchema = z.object({
  code: z.string().min(4).max(20),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad-body: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const result = await redeemParentCode(body.code.trim(), session.username);
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: 409 },
    );
  }
  return Response.json({ ok: true, kid: result.kidUsername });
}
