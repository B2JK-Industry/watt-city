"use client";

import { useState } from "react";

export function LogoutButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } finally {
      // Hard reload guarantees every server component (nav, dashboard, hub)
      // re-runs with no session cookie.
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost text-xs"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "…" : label}
    </button>
  );
}
