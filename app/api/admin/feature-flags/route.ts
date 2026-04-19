import { NextRequest } from "next/server";
import { z } from "zod";
import {
  DEFAULT_FLAGS,
  FLAGS_KEY,
  getFlags,
  invalidateFlagsCache,
  setFlags,
  type FlagConfig,
  type FlagsBundle,
} from "@/lib/feature-flags";
import { kvGet } from "@/lib/redis";

// Bearer ADMIN_SECRET gate — shared shape with every other /api/admin/* route.
function authOk(request: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return true; // local dev without ADMIN_SECRET is open
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === expected;
}

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// Inspect current flag state. Returns the merged live bundle (defaults +
// stored overrides), the raw stored overrides (so operators can see what's
// been touched), and the shipped defaults for comparison.
export async function GET(request: NextRequest) {
  if (!authOk(request)) return unauthorized();
  const [merged, stored] = await Promise.all([
    getFlags(),
    kvGet<FlagsBundle>(FLAGS_KEY),
  ]);
  return Response.json({
    ok: true,
    flags: merged,
    stored: stored ?? null,
    defaults: DEFAULT_FLAGS,
  });
}

const FlagConfigSchema: z.ZodType<FlagConfig> = z.object({
  mode: z.enum(["off", "on", "percentage"]),
  value: z.number().int().min(0).max(100).optional(),
  allowlist: z.array(z.string().min(1).max(128)).max(1000).optional(),
  denylist: z.array(z.string().min(1).max(128)).max(1000).optional(),
});

const PatchSchema = z.object({
  // patch one named flag
  flag: z.string().min(1).max(64),
  config: FlagConfigSchema,
});

const ReplaceSchema = z.object({
  // replace whole stored bundle
  flags: z.record(z.string(), FlagConfigSchema),
});

// POST supports two shapes:
//   { flag, config }      → upsert single flag, keeping other overrides intact
//   { flags: {...} }      → replace the whole stored bundle
// Defaults (DEFAULT_FLAGS) are always the fallback when a flag is absent
// from the stored bundle, so either shape is safe.
export async function POST(request: NextRequest) {
  if (!authOk(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  // Try patch shape first
  const patch = PatchSchema.safeParse(body);
  if (patch.success) {
    const current = (await kvGet<FlagsBundle>(FLAGS_KEY)) ?? {};
    current[patch.data.flag] = patch.data.config;
    await setFlags(current);
    invalidateFlagsCache();
    return Response.json({
      ok: true,
      updated: patch.data.flag,
      stored: current,
    });
  }

  // Fall back to replace shape
  const replace = ReplaceSchema.safeParse(body);
  if (replace.success) {
    await setFlags(replace.data.flags);
    invalidateFlagsCache();
    return Response.json({
      ok: true,
      replaced: true,
      stored: replace.data.flags,
    });
  }

  return Response.json(
    {
      ok: false,
      error: "invalid-body",
      hint: "Expected { flag, config } or { flags: {...} }",
    },
    { status: 400 },
  );
}

// DELETE clears every override — returns to pure DEFAULT_FLAGS. Useful
// for "panic reset" if a bad config was pushed.
export async function DELETE(request: NextRequest) {
  if (!authOk(request)) return unauthorized();
  await setFlags({});
  invalidateFlagsCache();
  return Response.json({ ok: true, reset: true, defaults: DEFAULT_FLAGS });
}
