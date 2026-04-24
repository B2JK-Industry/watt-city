"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* V4.1 — single-screen teacher signup wizard. Creates the user +
 * teacher account + session in one POST, then navigates to the class
 * creation wizard at /nauczyciel.
 */

export default function TeacherSignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [rolesOk, setRolesOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!rolesOk) {
      setError("Potwierdź że jesteś aktywnym nauczycielem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/nauczyciel/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          displayName,
          email: email || undefined,
          schoolName,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? "unknown-error");
        return;
      }
      router.push("/nauczyciel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">Rejestracja nauczyciela</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Jeden formularz. Po rejestracji stworzysz klasę i otrzymasz kod do
          wpisania dzieciom.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-3 card p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Imię i nazwisko</span>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">E-mail (opcjonalnie)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
          />
          <span className="text-[10px] opacity-60">
            Nie publikujemy. Używamy wyłącznie do odzyskania dostępu.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Szkoła</span>
          <input
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="np. Szkoła Podstawowa nr 12, Katowice"
            className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Nazwa użytkownika (login)</span>
          <input
            type="text"
            required
            minLength={3}
            pattern="^[A-Za-z0-9_.\\-]+$"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Hasło (min 8 znaków)</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[var(--ink)] bg-[var(--surface)] px-3 py-2 rounded font-mono"
          />
        </label>
        <label className="flex items-start gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={rolesOk}
            onChange={(e) => setRolesOk(e.target.checked)}
            className="mt-1"
          />
          <span>
            Potwierdzam że jestem aktywnym nauczycielem i używam Watt City
            w ramach pracy dydaktycznej.
          </span>
        </label>
        {error && <p className="text-[var(--danger)] text-sm">Błąd: {error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary mt-2 disabled:opacity-50"
        >
          {busy ? "Rejestruję…" : "Załóż konto nauczyciela"}
        </button>
      </form>
    </div>
  );
}
