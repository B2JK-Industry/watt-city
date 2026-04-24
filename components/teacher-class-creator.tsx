"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* V4.1 — 2-step class creation wizard used inline on the teacher
 * dashboard. Step 1 form → POST /api/nauczyciel/class → Step 2 shows
 * the generated join code + CTA. */

export function TeacherClassCreator() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "done">("form");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; joinCode: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/nauczyciel/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          grade,
          subject: subject || null,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? "unknown");
        return;
      }
      setCreated({ id: j.class.id, joinCode: j.class.joinCode });
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done" && created) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="section-heading text-xl">✅ Klasa utworzona</h2>
        <p className="text-sm">
          Podaj uczniom 6-cyfrowy kod do wpisania na{" "}
          <code className="font-mono bg-[var(--surface-2)] px-1">/uczen/dolacz</code>
          :
        </p>
        <div className="flex items-center gap-3 border border-[var(--ink)] p-4 rounded bg-[var(--surface-2)]">
          <span className="text-3xl font-mono font-semibold">
            {created.joinCode}
          </span>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => navigator.clipboard.writeText(created.joinCode)}
          >
            📋 Kopiuj
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() => router.push(`/klasa/${created.id}`)}
          >
            Otwórz dashboard klasy
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => {
              setStep("form");
              setCreated(null);
              setName("");
              setSubject("");
            }}
          >
            Utwórz kolejną
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h2 className="section-heading text-xl">Nowa klasa</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Nazwa klasy</span>
        <input
          type="text"
          required
          placeholder="np. V.B — Matematyka finansowa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Klasa (rok)</span>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
        >
          {[5, 6, 7, 8].map((g) => (
            <option key={g} value={g}>
              Klasa {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Przedmiot (opcjonalne)</span>
        <input
          type="text"
          placeholder="np. WOS, EDB, Matematyka"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
        />
      </label>
      {error && <p className="text-[var(--danger)] text-sm">Błąd: {error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-50">
        {busy ? "Tworzę…" : "Utwórz klasę"}
      </button>
    </form>
  );
}
