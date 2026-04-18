import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getPlayerState } from "@/lib/player";
import { quoteMortgage, ALLOWED_TERMS_MONTHS } from "@/lib/loans";

const QuerySchema = z.object({
  principal: z.coerce.number().int().min(0).max(1_000_000),
  termMonths: z.coerce
    .number()
    .int()
    .refine((v) => (ALLOWED_TERMS_MONTHS as readonly number[]).includes(v), {
      message: `termMonths must be one of ${ALLOWED_TERMS_MONTHS.join(",")}`,
    }),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    principal: url.searchParams.get("principal"),
    termMonths: url.searchParams.get("termMonths"),
  });
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.message },
      { status: 400 },
    );
  }
  const state = await getPlayerState(session.username);
  const quote = quoteMortgage(state, parsed.data);
  return Response.json({ ok: true, quote });
}
