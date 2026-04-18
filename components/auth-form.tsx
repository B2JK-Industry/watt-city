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
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currentYear = new Date().getUTCFullYear();
  const needsParent =
    mode === "register" && birthYear !== "" && currentYear - Number(birthYear) < 16;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body: Record<string, unknown> = { username, password };
      if (mode === "register") {
        if (birthYear === "") {
          setError("Podaj rok urodzenia.");
          return;
        }
        body.birthYear = Number(birthYear);
        if (needsParent) body.parentEmail = parentEmail;
      }
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
      {mode === "register" && (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-300">Rok urodzenia (RODO-K)</span>
            <select
              className="input"
              value={birthYear}
              onChange={(e) =>
                setBirthYear(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            >
              <option value="">—</option>
              {Array.from({ length: 90 }, (_, i) => currentYear - 5 - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {needsParent && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-300">
                E-mail rodzica (wymagane dla &lt; 16 lat)
              </span>
              <input
                type="email"
                className="input"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required={needsParent}
                placeholder="rodzic@example.com"
                maxLength={120}
              />
            </label>
          )}
        </>
      )}
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
