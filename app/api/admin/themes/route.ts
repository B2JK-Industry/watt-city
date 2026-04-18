import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { listResearchSeeds } from "@/lib/ai-pipeline/research";
import { kvGet, kvSet } from "@/lib/redis";

// Admin-editable overrides on top of the hardcoded pool. We don't MUTATE the
// source-of-truth array — that lives in lib/ai-pipeline/research.ts — but we
// expose a "disabled themes" list that pickResearchSeed consults (once we
// wire it) and a "featured theme index" for the Editor's Pick (5.5.4).
const DISABLED_KEY = "xp:config:themes:disabled";
const FEATURED_KEY = "xp:config:themes:featured";

const PatchSchema = z.object({
  disable: z.array(z.string()).optional(),
  enable: z.array(z.string()).optional(),
  featuredTheme: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const [disabled, featured] = await Promise.all([
    kvGet<string[]>(DISABLED_KEY),
    kvGet<string>(FEATURED_KEY),
  ]);
  return Response.json({
    ok: true,
    pool: listResearchSeeds().map((s, i) => ({
      index: i,
      theme: s.theme,
      kind: s.kind,
      age: s.age ?? null,
      subject: s.subject ?? null,
      disabled: (disabled ?? []).includes(s.theme),
      featured: featured === s.theme,
    })),
  });
}

export async function POST(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  let body;
  try {
    body = PatchSchema.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: `bad request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
  const existing = (await kvGet<string[]>(DISABLED_KEY)) ?? [];
  const disabled = new Set(existing);
  (body.disable ?? []).forEach((t) => disabled.add(t));
  (body.enable ?? []).forEach((t) => disabled.delete(t));
  await kvSet(DISABLED_KEY, Array.from(disabled));
  if (body.featuredTheme !== undefined) {
    if (body.featuredTheme === "") {
      await kvSet(FEATURED_KEY, null);
    } else {
      await kvSet(FEATURED_KEY, body.featuredTheme);
    }
  }
  return Response.json({ ok: true });
}
