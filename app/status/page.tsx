import { kvGet } from "@/lib/redis";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { ROTATION_HOURS } from "@/lib/ai-pipeline/types";

export const dynamic = "force-dynamic";

/* Public status page — Phase 5.4.7.
 *
 * Stub surface: signals whether the rotation subsystem looks alive, how
 * many AI games are live, and an obvious link to the admin dashboard for
 * on-call. No sensitive data exposed — this page is crawlable.
 */
export default async function StatusPage() {
  const now = Date.now();
  const [games, lastBucket] = await Promise.all([
    listActiveAiGames(),
    kvGet<number>("xp:ai-games:last-rotation-bucket"),
  ]);
  const rotationWindowMs = ROTATION_HOURS * 60 * 60 * 1000;
  const lastRotationAt =
    typeof lastBucket === "number" ? lastBucket * rotationWindowMs : null;
  const minutesSinceLastRotation =
    lastRotationAt === null ? null : Math.floor((now - lastRotationAt) / 60_000);
  const rotationOk = minutesSinceLastRotation !== null && minutesSinceLastRotation <= 90;
  const liveCount = games.length;

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">Watt City — status</h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Public status page. Generated {new Date(now).toISOString()}.
        </p>
      </header>
      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Rotation AI</h2>
        <p className="text-sm">
          Status:{" "}
          <strong className={rotationOk ? "text-[var(--success)]" : "text-[var(--danger)]"}>
            {rotationOk ? "OK" : "degraded"}
          </strong>
        </p>
        <p className="text-xs text-[var(--ink-muted)]">
          Live AI games: {liveCount}
        </p>
        {minutesSinceLastRotation !== null && (
          <p className="text-xs text-[var(--ink-muted)]">
            Last rotation: {minutesSinceLastRotation} min ago
          </p>
        )}
      </section>
      <section className="card p-4 flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Komponenty</h2>
        <ul className="text-xs text-[var(--ink-muted)] flex flex-col gap-1">
          <li>✅ Storage: Upstash Redis</li>
          <li>✅ Authentication: cookie sessions (scrypt + HMAC)</li>
          <li>{rotationOk ? "✅" : "❌"} AI rotation: external pinger + Vercel cron backstop</li>
          <li>✅ Static assets: Vercel CDN</li>
        </ul>
      </section>
      <p className="text-xs text-[var(--ink-muted)]">
        Szczegóły dla on-call: <a href="/admin" className="underline">/admin</a>
        . W razie incydentu zobacz <a href="/admin/health" className="underline">/admin/health</a>.
      </p>
    </div>
  );
}
