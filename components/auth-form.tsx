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
          setError(t.errorBirthYearMissing);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">{t.usernameLabel}</span>
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
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">{t.passwordLabel}</span>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : 6}
          maxLength={200}
          {...(mode === "register"
            ? {
                pattern: "(?=.*[a-zA-Z])(?=.*\\d).{8,}",
                title: t.passwordTitle,
              }
            : {})}
        />
        {/* G-01 patch 7 — live password strength checklist (register
            only). Strict GDPR-K + bank-grade discipline asks for an
            explicit visible rule list so kids see WHY the form is
            blocking submission, not just an opaque HTML5 alert. */}
        {mode === "register" && password.length > 0 && (
          <ul className="t-caption text-[var(--ink-muted)] flex flex-col gap-0.5 mt-1">
            <li className={password.length >= 8 ? "text-[var(--success)]" : ""}>
              {password.length >= 8 ? "✓" : "○"} {t.pwRule8chars}
            </li>
            <li className={/[a-zA-Z]/.test(password) ? "text-[var(--success)]" : ""}>
              {/[a-zA-Z]/.test(password) ? "✓" : "○"} {t.pwRuleLetter}
            </li>
            <li className={/\d/.test(password) ? "text-[var(--success)]" : ""}>
              {/\d/.test(password) ? "✓" : "○"} {t.pwRuleDigit}
            </li>
          </ul>
        )}
      </label>
      {mode === "register" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="t-body-sm text-[var(--ink-muted)]">{t.birthYearLabel}</span>
            <select
              className="input"
              value={birthYear}
              onChange={(e) =>
                setBirthYear(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            >
              <option value="">—</option>
              {/* G-01 patch 1 — clamped to 11 entries (currentYear-6
                  newest → currentYear-16 oldest), matching the GDPR-K
                  child-product target audience (9-14) plus a 2-year
                  buffer. The previous 90-entry range (1932-2021)
                  served no realistic age band and let pre-teens select
                  birth years that fall outside parental-consent flow. */}
              {Array.from({ length: 11 }, (_, i) => currentYear - 6 - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {needsParent && (
            <label className="flex flex-col gap-1.5">
              <span className="t-body-sm text-[var(--ink-muted)]">
                {t.parentEmailLabel}
              </span>
              <input
                type="email"
                className="input"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required={needsParent}
                placeholder={t.parentEmailPlaceholder}
                maxLength={120}
              />
            </label>
          )}
        </>
      )}
      {error && (
        <div
          role="alert"
          className="t-body-sm text-[var(--danger)] border border-[var(--danger)] bg-[var(--surface-2)] rounded-sm px-3 py-2"
        >
          ⚠ {error}
        </div>
      )}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "…" : mode === "login" ? t.submitLogin : t.submitRegister}
      </button>
      {mode === "register" && (
        <p className="t-caption text-[var(--ink-muted)] leading-snug">
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
