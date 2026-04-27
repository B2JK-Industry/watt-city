"use client";

/* G-02 + G-06 — ContactForm primitive.
 *
 * Client component. Used by:
 *   - `/kontakt` page (variant="general")
 *   - `/dla-szkol` (variant="schools" — adds a "School name" field
 *     that prefixes the message)
 *   - Could be extended to /press or other entry points later.
 *
 * POST -> /api/contact (rate-limited 3 / 60s per IP). Success state
 * replaces the form with a thank-you card; error state renders an
 * inline alert above the submit button.
 *
 * No external email collection beyond the form input — the API
 * handler logs to console (dev) or hits a configured webhook (prod);
 * configuration lives in `lib/mailer.ts`.
 */

import { useState, type FormEvent } from "react";
import type { Lang } from "@/lib/i18n";

type Variant = "general" | "schools" | "press";

const TOPIC_FOR_VARIANT: Record<Variant, "general" | "school" | "press"> = {
  general: "general",
  schools: "school",
  press: "press",
};

type ContactDict = {
  nameLabel: string;
  emailLabel: string;
  topicLabel: string;
  messageLabel: string;
  topicGeneral: string;
  topicBug: string;
  topicSchool: string;
  topicPress: string;
  topicPrivacy: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorRate: string;
  errorGeneric: string;
  schoolLabel: string;
  schoolNamePlaceholder: string;
};

export function ContactForm({
  variant,
  lang: _lang,
  dict,
}: {
  variant: Variant;
  lang: Lang;
  dict: ContactDict;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<
    "general" | "bug" | "school" | "press" | "privacy"
  >(TOPIC_FOR_VARIANT[variant]);
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const finalMessage =
        variant === "schools" && school
          ? `[School: ${school}]\n\n${message}`
          : message;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message: finalMessage,
        }),
      });
      const j = await res.json();
      if (res.status === 429) {
        setError(dict.errorRate);
      } else if (!j.ok) {
        setError(dict.errorGeneric);
      } else {
        setSent(true);
      }
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="card p-6 flex flex-col items-center gap-2 text-center"
      >
        <span className="text-3xl" aria-hidden>
          ✅
        </span>
        <p className="font-semibold text-[var(--accent)]">
          {dict.successTitle}
        </p>
        <p className="text-[var(--ink-muted)]">{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="card p-6 flex flex-col gap-4"
      aria-busy={busy}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">
          {dict.nameLabel}
        </span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={120}
          autoComplete="name"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">
          {dict.emailLabel}
        </span>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={200}
          autoComplete="email"
        />
      </label>
      {variant === "schools" && (
        <label className="flex flex-col gap-1.5">
          <span className="t-body-sm text-[var(--ink-muted)]">
            {dict.schoolLabel}
          </span>
          <input
            className="input"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder={dict.schoolNamePlaceholder}
            maxLength={200}
          />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">
          {dict.topicLabel}
        </span>
        <select
          className="input"
          value={topic}
          onChange={(e) =>
            setTopic(e.target.value as typeof topic)
          }
          required
        >
          <option value="general">{dict.topicGeneral}</option>
          <option value="bug">{dict.topicBug}</option>
          <option value="school">{dict.topicSchool}</option>
          <option value="press">{dict.topicPress}</option>
          <option value="privacy">{dict.topicPrivacy}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="t-body-sm text-[var(--ink-muted)]">
          {dict.messageLabel}
        </span>
        <textarea
          className="input min-h-[140px] resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
        />
      </label>
      {error && (
        <p
          role="alert"
          className="t-body-sm text-[var(--danger)] border border-[var(--danger)] rounded-sm px-3 py-2"
        >
          ⚠ {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
