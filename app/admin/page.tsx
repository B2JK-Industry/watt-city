import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/* Admin dashboard.
 *
 * Two surfaces:
 *
 *  1) `/admin/review` — operator UI for the AI mission approval queue
 *     (Internal Review §09, "PKO does not have to trust our AI. PKO
 *     controls it"). Role-gated, no admin-secret required.
 *
 *  2) REST admin endpoints for ops/curl use. Each route is gated by
 *     `Authorization: Bearer $ADMIN_SECRET` and intended for
 *     scripted operations rather than a UI. The cards below document
 *     the available endpoints rather than linking to dead sub-routes.
 */
export default async function AdminHome() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getRole(session.username);
  const hasSecret = Boolean(process.env.ADMIN_SECRET);

  if (role !== "admin") {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Nie masz roli admin. Jeśli jesteś operatorem, używaj endpointów z
          nagłówkiem <code>Authorization: Bearer $ADMIN_SECRET</code>.
          Admin-secret skonfigurowany: {hasSecret ? "✓" : "✗"}.
        </p>
      </div>
    );
  }

  // Operator UI surfaces. Currently only the AI-mission approval queue.
  const uiSurfaces: Array<{ href: string; title: string; body: string }> = [
    {
      href: "/admin/review",
      title: "Kolejka zatwierdzania misji AI",
      body: "Approve / request changes / reject każdej wygenerowanej misji przed publikacją. Pełny audit trail (Internal Review §09).",
    },
  ];

  // REST endpoints — operator/curl interface. Each requires
  // `Authorization: Bearer $ADMIN_SECRET` and is intentionally not
  // exposed as a UI page to keep the attack surface small.
  const restOps: Array<{ endpoint: string; method: string; title: string; body: string }> = [
    {
      endpoint: "/api/admin/rotation-status",
      method: "GET",
      title: "Rotation status",
      body: "Stan hourly AI-rotation. Lock state, last rotation, next due.",
    },
    {
      endpoint: "/api/admin/rotate-ai",
      method: "POST",
      title: "Force rotation",
      body: "Manuálne spustenie rotácie mimo cron rozvrhu.",
    },
    {
      endpoint: "/api/admin/themes",
      method: "GET / POST",
      title: "Pula tematów",
      body: "Aktywne / nieaktywne tematy; Editor's Pick.",
    },
    {
      endpoint: "/api/admin/moderation",
      method: "GET / POST",
      title: "Moderacja",
      body: "Kolejka zgłoszonych komentarzy; hide/unhide.",
    },
    {
      endpoint: "/api/admin/analytics",
      method: "GET",
      title: "Analityka",
      body: "D1/D7/D30 retention, popularność kind, mortgage funnel.",
    },
    {
      endpoint: "/api/admin/health",
      method: "GET",
      title: "Health check",
      body: "Lock state, last rotation, Redis depth, backup status.",
    },
    {
      endpoint: "/api/admin/player/[username]",
      method: "GET",
      title: "Gracz — podgląd",
      body: "Stan konta jednego gracza; grant / suspend / unsuspend.",
    },
    {
      endpoint: "/api/admin/feature-flags",
      method: "GET / POST",
      title: "Feature flags",
      body: "Live tuning bez deploy. Percentage / on / off.",
    },
    {
      endpoint: "/api/admin/leaderboard",
      method: "GET / POST",
      title: "Leaderboard ops",
      body: "Podgląd top-N; reset; usuń konkrétneho gracza.",
    },
    {
      endpoint: "/api/admin/backup",
      method: "POST",
      title: "Backup",
      body: "Snapshot kľúčových Redis keys do S3-compatible storage.",
    },
    {
      endpoint: "/api/admin/engine-check",
      method: "GET",
      title: "Engine check",
      body: "Cross-sanity: leaderboard vs player state, ledger integrity.",
    },
    {
      endpoint: "/api/admin/teacher-verify",
      method: "POST",
      title: "Verify teacher",
      body: "Manual approval flagu nauczyciela po weryfikacji szkoły.",
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex items-center gap-3">
        <h1 className="section-heading text-3xl">Admin</h1>
        <span className="chip">role: admin</span>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">UI surfaces</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {uiSurfaces.map((c) => (
            <li key={c.href} className="card p-4 flex flex-col gap-1">
              <Link href={c.href} className="text-lg font-semibold underline">
                {c.title}
              </Link>
              <p className="text-sm text-[var(--ink-muted)]">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">REST endpoints</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Każdy endpoint vyžaduje{" "}
          <code>Authorization: Bearer $ADMIN_SECRET</code>. Žiadny UI nie je
          úmyselne exponovaný pre tieto operácie — admin attack surface
          minimalizovaný na curl/scripted ops.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {restOps.map((c) => (
            <li key={c.endpoint} className="card p-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="chip">{c.method}</span>
                <code className="text-sm font-semibold">{c.endpoint}</code>
              </div>
              <p className="text-sm text-[var(--ink-muted)] mt-1">
                <strong>{c.title}.</strong> {c.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
