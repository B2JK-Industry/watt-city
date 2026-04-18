"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

type Props = { mode: "login" | "register" };

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Niečo sa nepodarilo.");
        return;
      }
      router.refresh();
      router.push("/games");
    } catch {
      setError("Sieťová chyba. Skús znova.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-300">Používateľské meno</span>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete={mode === "login" ? "username" : "username"}
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_.\-]{3,24}"
          title="3–24 znakov: písmená, čísla, _ . -"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-300">Heslo</span>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          maxLength={200}
        />
      </label>
      {error && (
        <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-900/60 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending
          ? "…"
          : mode === "login"
          ? "Prihlásiť sa"
          : "Vytvoriť účet"}
      </button>
    </form>
  );
}
