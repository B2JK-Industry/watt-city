import { listActiveAiGames } from "@/lib/ai-pipeline/publish";

// Lightweight polling endpoint — the client queries it every N seconds and
// diffs against its last-seen game id. SSE would avoid the polling overhead
// but Upstash free tier lacks pub/sub, and Vercel serverless functions aren't
// a great fit for long-lived streams anyway.
//
// Edge cache: responses are identical for all users within a 5-second
// window, so we pin `s-maxage=5` to let Vercel edge coalesce concurrent
// polls into one origin hit. `stale-while-revalidate=30` keeps latency
// low if the edge entry expires under low traffic. Anonymous + same
// shape for everyone, so CDN caching is safe.
export async function GET() {
  const games = await listActiveAiGames();
  // Newest-first
  const sorted = [...games].sort((a, b) => b.generatedAt - a.generatedAt);
  const latest = sorted[0];
  return Response.json(
    {
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
    },
    {
      headers: {
        "cache-control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    },
  );
}
