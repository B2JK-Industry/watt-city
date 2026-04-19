import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";

/* Phase 10.2.1 — Claude model check cron.
 *
 * Pings the Anthropic /v1/models endpoint and reports which models we
 * use (claude-sonnet-4-6, claude-haiku-4-5) vs what's currently
 * available. When a newer major/minor shows up, we surface it here so
 * the operator can plan a migration commit (update PRIMARY_MODEL /
 * TRANSLATION_MODEL in lib/ai-pipeline/generate.ts).
 *
 * Fails closed on missing ANTHROPIC_API_KEY — no secret is logged.
 */

const CURRENT_MODELS = {
  primary: "claude-sonnet-4-6",
  translation: "claude-haiku-4-5",
};

export async function GET(request: NextRequest) {
  const block = await requireAdmin(request);
  if (block) return block;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({
      ok: false,
      reason: "no-api-key",
      using: CURRENT_MODELS,
    });
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          status: res.status,
          using: CURRENT_MODELS,
          note: "Anthropic API returned non-200",
        },
        { status: 500 },
      );
    }
    const data = (await res.json()) as {
      data?: Array<{ id: string; created_at?: string; type?: string }>;
    };
    const models = (data.data ?? []).map((m) => m.id);
    const newer = models.filter((id) => {
      if (id.startsWith("claude-opus-") && !id.includes("mini")) return true;
      if (id.startsWith("claude-sonnet-") && id > CURRENT_MODELS.primary) return true;
      if (id.startsWith("claude-haiku-") && id > CURRENT_MODELS.translation) return true;
      return false;
    });
    return Response.json({
      ok: true,
      using: CURRENT_MODELS,
      availableCount: models.length,
      newerAvailable: newer,
      migrationHint:
        newer.length > 0
          ? "Consider updating PRIMARY_MODEL / TRANSLATION_MODEL in lib/ai-pipeline/generate.ts — see docs/upgrade-playbook.md"
          : "Up to date",
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message, using: CURRENT_MODELS },
      { status: 500 },
    );
  }
}
