"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* V4.6 — parent redeems the 6-char code their kid generated. */

export default function ParentJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rodzic/dolacz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? "unknown");
        return;
      }
      router.push("/rodzic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5 animate-slide-up">
      <header>
        <h1 className="section-heading text-3xl">Dołącz jako rodzic</h1>
        <p className="text-sm text-[var(--ink-muted)] mt-2">
          Twoje dziecko wygenerowało w swoim profilu 6-znakowy kod. Wpisz
          go poniżej, żeby obserwować jego postępy.
        </p>
      </header>
      <form onSubmit={submit} className="card p-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Kod dostępu</span>
          <input
            type="text"
            required
            minLength={4}
            maxLength={10}
            autoFocus
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="border border-[var(--line)] bg-[var(--surface)] px-3 py-3 rounded font-mono text-xl text-center"
          />
        </label>
        {error && <p className="text-[var(--danger)] text-sm">Błąd: {error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">
          {busy ? "Łączę…" : "Zacznij obserwować"}
        </button>
        <p className="text-[11px] text-[var(--ink-muted)] leading-snug mt-2">
          Twój dostęp jest tylko do odczytu (tryb obserwatora). Nie możesz
          edytować konta dziecka. Dziecko kontroluje, co widzisz, w swoich
          ustawieniach prywatności.
        </p>
      </form>
    </div>
  );
}
