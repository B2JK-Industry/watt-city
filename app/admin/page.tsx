import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Admin dashboard — deliberately plain. Uses inline fetch on the client for
// most ops (admin surfaces don't need elaborate UX). Every linked card
// below is either a REST endpoint (admin-secret gated) or a /admin/*
// sub-route (role-gated).
export default async function AdminHome() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getRole(session.username);
  const hasSecret = Boolean(process.env.ADMIN_SECRET);

  // Role-based access. Bearer-token path for curl / external ops is handled
  // at each API route. The page only renders for users carrying role=admin.
  if (role !== "admin") {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-400">
          Nie masz roli admin. Jeśli jesteś operatorem, używaj endpointów z
          nagłówkiem <code>Authorization: Bearer $ADMIN_SECRET</code>.
          Admin-secret skonfigurowany: {hasSecret ? "✓" : "✗"}.
        </p>
      </div>
    );
  }

  const cards: Array<{ href: string; title: string; body: string }> = [
    {
      href: "/admin/rotation",
      title: "Rotacja AI",
      body: "Stan hourly rotation + force-rotate.",
    },
    {
      href: "/admin/themes",
      title: "Pula tematów",
      body: "Włącz/wyłącz tematy; ustaw Editor's Pick.",
    },
    {
      href: "/admin/players",
      title: "Gracze",
      body: "Podgląd stanu konta; grant, suspend, unsuspend.",
    },
    {
      href: "/admin/moderation",
      title: "Moderacja",
      body: "Kolejka zgłoszonych komentarzy + ręczne hide/unhide.",
    },
    {
      href: "/admin/analytics",
      title: "Analityka",
      body: "D1/D7/D30 retention, popularność kind, mortgage funnel.",
    },
    {
      href: "/admin/health",
      title: "Zdrowie systemu",
      body: "Lock state, last rotation, backup runbook.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex items-center gap-3">
        <h1 className="section-heading text-3xl">Admin</h1>
        <span className="chip">role: admin</span>
      </header>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <li key={c.href} className="card p-4 flex flex-col gap-1">
            <Link href={c.href} className="text-lg font-semibold underline">
              {c.title}
            </Link>
            <p className="text-sm text-zinc-400">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
