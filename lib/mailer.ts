import "server-only";

/* Env-driven mail adapter — Phase 1 backlog #12.
 *
 * Three providers, selected by env; adapters are intentionally small
 * (no SDK deps — just fetch) so we can swap providers without a
 * redeploy. Picks the first configured provider in this order:
 *
 *   1. `RESEND_API_KEY`  → https://api.resend.com/emails
 *   2. `SENDGRID_API_KEY` → https://api.sendgrid.com/v3/mail/send
 *   3. `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` → deferred (would need
 *      nodemailer; flag the intent but refuse to ship a half-working
 *      path, per the prior project note in lib/web-push.ts).
 *   4. None configured → structured log-only "would send" (the
 *      legacy mock behaviour, kept for dev + the hackathon demo).
 *
 * The `sendMail` export is the single entry point. Callers pass
 * `{to, subject, text, html?}` — no provider-specific shape leaks out.
 *
 * Compliance hook: logs ONLY the recipient domain + first 6 chars of
 * the subject, never the full address or body. RODO-K sensitive data
 * (child username, token) is passed through to the provider over
 * HTTPS only. */

export type MailEnvelope = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Override the `From` per-message (parental-consent uses a dedicated
   *  address; default is `MAIL_FROM`). */
  from?: string;
};

export type SendResult =
  | { ok: true; provider: "resend" | "sendgrid" | "logOnly"; id: string | null }
  | { ok: false; provider: string; error: string };

function defaultFrom(): string {
  return (
    process.env.MAIL_FROM ??
    "Watt City <no-reply@watt-city.vercel.app>"
  );
}

function emailDomain(addr: string): string {
  return addr.split("@")[1]?.toLowerCase() ?? "?";
}

async function sendViaResend(env: MailEnvelope): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, provider: "resend", error: "no-api-key" };
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.from ?? defaultFrom(),
      to: [env.to],
      subject: env.subject,
      text: env.text,
      html: env.html,
    }),
  });
  const body = (await resp.json().catch(() => null)) as { id?: string } | null;
  if (!resp.ok) {
    return { ok: false, provider: "resend", error: `http ${resp.status}` };
  }
  return { ok: true, provider: "resend", id: body?.id ?? null };
}

async function sendViaSendGrid(env: MailEnvelope): Promise<SendResult> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return { ok: false, provider: "sendgrid", error: "no-api-key" };
  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: env.to }] }],
      from: { email: (env.from ?? defaultFrom()).replace(/^.*<|>.*$/g, "") },
      subject: env.subject,
      content: [
        { type: "text/plain", value: env.text },
        ...(env.html ? [{ type: "text/html", value: env.html }] : []),
      ],
    }),
  });
  if (!resp.ok) {
    return { ok: false, provider: "sendgrid", error: `http ${resp.status}` };
  }
  // SendGrid returns 202 + X-Message-Id header; body is empty on success.
  const id = resp.headers.get("x-message-id");
  return { ok: true, provider: "sendgrid", id };
}

function logOnly(env: MailEnvelope, reason: string): SendResult {
  // Structured "would send" line. Never logs the full address — the
  // domain + subject prefix are enough to debug in Vercel logs.
  console.log(
    JSON.stringify({
      event: "mail.would-send",
      recipientDomain: emailDomain(env.to),
      subjectPrefix: env.subject.slice(0, 6),
      reason,
    }),
  );
  return { ok: true, provider: "logOnly", id: null };
}

export async function sendMail(env: MailEnvelope): Promise<SendResult> {
  try {
    if (process.env.RESEND_API_KEY) return await sendViaResend(env);
    if (process.env.SENDGRID_API_KEY) return await sendViaSendGrid(env);
  } catch (e) {
    // Any provider-side failure falls through to log-only so the
    // caller's path (consent dispatch, parent invite) is never
    // blocked by a transient SMTP outage. Callers still see a
    // `{ok:true, provider:"logOnly"}` which signals degraded mode.
    return logOnly(env, `provider-failed: ${(e as Error).message}`);
  }
  if (process.env.SMTP_HOST && !process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
    // SMTP-via-nodemailer is intentionally NOT implemented here — we
    // don't want to half-ship the JWT-signed payload-encrypted path
    // the way lib/web-push.ts called out. Documented follow-up.
    return logOnly(env, "smtp-host-set-but-nodemailer-not-wired");
  }
  return logOnly(env, "no-provider-configured");
}

/** Build the parental-consent email envelope. Centralised so the
 *  copy + link shape are reviewable in one place for RODO-K sign-off. */
export function buildParentalConsentMessage(opts: {
  childUsername: string;
  parentEmail: string;
  consentUrl: string;
  expiresAt: number;
}): MailEnvelope {
  const hours = Math.max(
    1,
    Math.floor((opts.expiresAt - Date.now()) / (60 * 60 * 1000)),
  );
  const text = [
    `Cześć,`,
    ``,
    `Dziecko "${opts.childUsername}" chce założyć konto w Watt City —`,
    `gamifikowanej platformie edukacji finansowej dla dzieci 9–14 lat.`,
    ``,
    `Aby kontynuować rejestrację, potwierdź zgodę w ciągu ${hours} godzin:`,
    opts.consentUrl,
    ``,
    `Jeśli się to nie dotyczy, zignoruj tę wiadomość — bez potwierdzenia`,
    `konto NIE zostanie aktywowane.`,
    ``,
    `Szczegóły ochrony prywatności: https://watt-city.vercel.app/ochrana-sukromia`,
  ].join("\n");
  return {
    to: opts.parentEmail,
    subject: `Watt City — zgoda na konto "${opts.childUsername}"`,
    text,
  };
}
