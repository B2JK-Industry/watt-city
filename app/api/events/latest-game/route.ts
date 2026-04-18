import { listActiveAiGames } from "@/lib/ai-pipeline/publish";

// Lightweight polling endpoint — the client queries it every N seconds and
// diffs against its last-seen game id. SSE would avoid the polling overhead
// but Upstash free tier lacks pub/sub, and Vercel serverless functions aren't
// a great fit for long-lived streams anyway. Polling at 5s * active user
// count is cheap enough for the MVP traffic profile.
export async function GET() {
  const games = await listActiveAiGames();
  // Newest-first
  const sorted = [...games].sort((a, b) => b.generatedAt - a.generatedAt);
  const latest = sorted[0];
  return Response.json({
    ok: true,
    now: Date.now(),
    latest: latest
      ? {
          id: latest.id,
          title: latest.title,
          theme: latest.theme,
          generatedAt: latest.generatedAt,
          validUntil: latest.validUntil,
          glyph: latest.buildingGlyph,
        }
      : null,
  });
}
