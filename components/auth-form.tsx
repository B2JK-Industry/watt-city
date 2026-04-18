"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import type { Dict } from "@/lib/i18n";

type Props = { mode: "login" | "register"; dict: Dict };

export function AuthForm({ mode, dict }: Props) {
  const t = dict.auth;
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
        setError(json.error ?? t.errorGeneric);
        return;
      }
      router.refresh();
      router.push("/games");
    } catch {
      setError(t.errorNetwork);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-300">{t.usernameLabel}</span>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_.\-]{3,24}"
          title={t.usernameTitle}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-300">{t.passwordLabel}</span>
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
        {pending ? "…" : mode === "login" ? t.submitLogin : t.submitRegister}
      </button>
      {mode === "register" && (
        <p className="text-[11px] text-zinc-500 leading-snug">
          {t.consent}{" "}
          <Link
            href="/ochrana-sukromia"
            className="underline text-[var(--accent)]"
          >
            {dict.nav.privacy}
          </Link>
          .
        </p>
      )}
    </form>
  );
}
