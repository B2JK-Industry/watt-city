import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { MARKETS, parseMarket } from "@/lib/market";
import { kvGet, kvSet } from "@/lib/redis";

/* Per-market admin dashboard (Phase 9.3.2). Each market keeps its own
 * set of config overrides (featured theme, disabled themes, economy
 * config) under `market:<id>:xp:config:*` — PL keeps its bare keys for
 * backward compat. */

const Body = z.object({
  market: z.enum(["pl", "cz", "ua"]),
  featuredTheme: z.string().optional(),
  disabled: z.array(z.string()).optional(),
});

function configKey(market: string, name: string): string {
  if (market === "pl") return `xp:config:${name}`;
  return `market:${market}:xp:config:${name}`;
}

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const url = new URL(request.url);
  const market = parseMarket(url.searchParams.get("market"));
  const [featured, disabled] = await Promise.all([
    kvGet<string | null>(configKey(market, "themes:featured")),
    kvGet<string[]>(configKey(market, "themes:disabled")),
  ]);
  return Response.json({
    ok: true,
    market: MARKETS[market],
    featuredTheme: featured ?? null,
    disabledThemes: disabled ?? [],
    markets: Object.values(MARKETS),
  });
}

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  let body;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
  if (body.featuredTheme !== undefined) {
    await kvSet(configKey(body.market, "themes:featured"), body.featuredTheme);
  }
  if (body.disabled !== undefined) {
    await kvSet(configKey(body.market, "themes:disabled"), body.disabled);
  }
  return Response.json({ ok: true });
}
