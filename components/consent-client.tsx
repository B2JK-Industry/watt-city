"use client";

import Link from "next/link";
import { useState } from "react";

export function ConsentClient({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<string | null>(null);

  const confirm = async () => {
    setStatus("busy");
    setError(null);
    try {
      const res = await fetch(`/api/consent/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error);
        setStatus("err");
      } else {
        setChild(j.child ?? null);
        setStatus("ok");
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus("err");
    }
  };

  if (status === "ok") {
    return (
      <div className="card p-6 flex flex-col gap-2 border-emerald-500/60">
        <p className="text-lg font-black text-emerald-400">Dziękujemy ✓</p>
        <p className="text-sm">
          Zgoda została zapisana. {child && <>Konto <strong>{child}</strong> jest aktywne.</>}
          Rodzic może łączyć się z kontem dziecka przez stronę <Link
            href="/parent"
            className="underline text-[var(--accent)]"
          >
            /parent
          </Link>.
        </p>
      </div>
    );
  }
  return (
    <div className="card p-6 flex flex-col gap-3">
      <button
        className="btn btn-primary self-start"
        onClick={confirm}
        disabled={status === "busy"}
      >
        {status === "busy" ? "Wysyłam…" : "Potwierdzam zgodę"}
      </button>
      {error && (
        <p className="text-rose-400 text-sm">
          Błąd: {error}. Link mógł wygasnąć (ważny 48h) lub już został użyty.
        </p>
      )}
    </div>
  );
}
