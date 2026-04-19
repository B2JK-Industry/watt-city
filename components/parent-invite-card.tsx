"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";

/* Cleanup issue 4 — /profile affordance to generate a 24h parent-invite
 * code (V4.6 observer flow). The V4.6 backend `POST /api/rodzic/code`
 * already works; this is the missing UI entry point that the audit
 * flagged as the broken step in "kid generates code → parent enters →
 * dashboard renders". Minimal UX: one button, one displayed code,
 * copy-to-clipboard helper, clear expiry countdown.
 */

type Copy = Record<
  | "heading"
  | "lead"
  | "cta"
  | "generating"
  | "expiresAt"
  | "copy"
  | "copied"
  | "enterPrompt"
  | "errorGeneric",
  string
>;

const COPY: Record<Lang, Copy> = {
  pl: {
    heading: "👪 Zaproś rodzica",
    lead: "Wygeneruj 6-znakowy kod. Wpisz go rodzicowi na /rodzic/dolacz. Kod wygasa po 24h.",
    cta: "Generuj kod",
    generating: "Generuję…",
    expiresAt: "Wygasa",
    copy: "Kopiuj",
    copied: "Skopiowano ✓",
    enterPrompt: "Rodzic wpisuje na:",
    errorGeneric: "Nie udało się wygenerować kodu.",
  },
  uk: {
    heading: "👪 Запроси батьків",
    lead: "Згенеруй 6-значний код. Батьки вводять його на /rodzic/dolacz. Термін — 24 години.",
    cta: "Створити код",
    generating: "Створюю…",
    expiresAt: "Діє до",
    copy: "Копіювати",
    copied: "Скопійовано ✓",
    enterPrompt: "Батьки вводять на:",
    errorGeneric: "Не вдалося створити код.",
  },
  cs: {
    heading: "👪 Pozvi rodiče",
    lead: "Vygeneruj 6-znakový kód. Rodič ho vepíše na /rodzic/dolacz. Kód vyprší za 24 h.",
    cta: "Vygenerovat kód",
    generating: "Generuji…",
    expiresAt: "Platí do",
    copy: "Zkopírovat",
    copied: "Zkopírováno ✓",
    enterPrompt: "Rodič vepíše na:",
    errorGeneric: "Nepodařilo se vygenerovat kód.",
  },
  en: {
    heading: "👪 Invite a parent",
    lead: "Generate a 6-character code. Your parent types it at /rodzic/dolacz. Expires in 24h.",
    cta: "Generate code",
    generating: "Generating…",
    expiresAt: "Expires",
    copy: "Copy",
    copied: "Copied ✓",
    enterPrompt: "Parent types it at:",
    errorGeneric: "Could not generate the code.",
  },
};

export function ParentInviteCard({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function issue() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rodzic/code", { method: "POST" });
      const j = await res.json();
      if (!j.ok) {
        setError(t.errorGeneric);
        return;
      }
      setCode(j.code);
      setExpiresAt(j.expiresAt);
      setCopied(false);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API missing → silent fallback (user sees the code)
    }
  }

  const hoursLeft =
    expiresAt != null
      ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (60 * 60 * 1000)))
      : null;

  return (
    <section className="card p-5 flex flex-col gap-3">
      <h2 className="brutal-heading text-lg">{t.heading}</h2>
      <p className="text-sm text-zinc-300">{t.lead}</p>
      {!code && (
        <button
          type="button"
          onClick={issue}
          disabled={busy}
          className="btn btn-primary self-start disabled:opacity-60"
        >
          {busy ? t.generating : t.cta}
        </button>
      )}
      {code && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 border-2 border-[var(--ink)] p-4 rounded bg-[var(--surface-2)]">
            <span className="text-3xl font-mono font-black tracking-widest">
              {code}
            </span>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={copy}
            >
              {copied ? t.copied : `📋 ${t.copy}`}
            </button>
          </div>
          <p className="text-[11px] opacity-70">
            {t.enterPrompt}{" "}
            <code className="font-mono">/rodzic/dolacz</code>
            {hoursLeft !== null && ` · ${t.expiresAt} ${hoursLeft}h`}
          </p>
          <button
            type="button"
            onClick={issue}
            disabled={busy}
            className="text-xs underline opacity-60 self-start"
          >
            {busy ? t.generating : "↻"}
          </button>
        </div>
      )}
      {error && <p className="text-rose-500 text-sm">⚠ {error}</p>}
    </section>
  );
}
