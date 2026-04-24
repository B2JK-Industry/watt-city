"use client";

import { useState, useTransition } from "react";

/* D4 — demo-start CTA. Client because the POST → redirect flow
 * depends on runtime fetch + window.location. Kept intentionally
 * minimal: POST, read JSON, redirect to the returned URL. */

export function DemoStartButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const start = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/dla-szkol/demo/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await res.json()) as {
          ok: boolean;
          redirectTo?: string;
          error?: string;
        };
        if (!data.ok || !data.redirectTo) {
          setError(data.error ?? "seed-failed");
          return;
        }
        window.location.href = data.redirectTo;
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        disabled={isPending}
        className="btn btn-primary text-lg px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "⏳ Tworzę demo…" : "🎬 Rozpocznij demo (1 klik)"}
      </button>
      {error && (
        <p className="text-xs text-[var(--danger)]">
          Błąd: <code className="font-mono">{error}</code> — spróbuj
          ponownie albo{" "}
          <a href="/login" className="underline">
            zaloguj się ręcznie
          </a>
          .
        </p>
      )}
      <p className="text-[10px] opacity-60">
        Pierwsze kliknięcie może zająć 2-3 sekundy (seed 30 uczniów +
        4-tygodniowa aktywność). Kolejne są natychmiastowe.
      </p>
    </div>
  );
}
