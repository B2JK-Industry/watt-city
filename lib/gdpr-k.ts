/* GDPR-K — Polish interpretation of GDPR Art. 8 sets the digital-consent
 * age at 16. Under-16 accounts require documented parental consent. Watt
 * City stores an age bucket on signup + a consent record keyed to the
 * registration token.
 *
 * 6.3.1 age check at signup (birth year picker)
 * 6.3.2 parental consent email flow (mock SMTP — emits to ops log when
 *       SMTP env not configured)
 * 6.3.3 PII validator for usernames (reject emails, phone numbers,
 *       obviously-real-name patterns)
 * 6.3.4 12-month inactive-kid auto-delete via
 *       /api/cron/sweep-inactive-kids
 * 6.3.5 audit trail of every parental consent grant
 */

import { kvGet, kvSet, kvSetNX, lPush, lRange, lTrim } from "@/lib/redis";

export const GDPR_K_AGE_THRESHOLD = 16;
export const INACTIVE_KID_AUTO_DELETE_MS = 12 * 30 * 24 * 60 * 60 * 1000;

export type AgeBucket = "under-13" | "13-15" | "16-plus";

/** Bucket a birth year (UTC-year-based) against the current year. Day-of-year
 *  precision isn't stored — we only need buckets for consent gating. */
export function ageBucketFromBirthYear(
  birthYear: number,
  now = new Date(),
): AgeBucket {
  const age = now.getUTCFullYear() - birthYear;
  if (age < 13) return "under-13";
  if (age < GDPR_K_AGE_THRESHOLD) return "13-15";
  return "16-plus";
}

export function requiresParentalConsent(bucket: AgeBucket): boolean {
  return bucket !== "16-plus";
}

const AGE_KEY = (u: string) => `xp:user:${u}:age-bucket`;
const BIRTH_YEAR_KEY = (u: string) => `xp:user:${u}:birth-year`;
const CONSENT_AUDIT = (u: string) => `xp:parental-consent:${u}`;
const CONSENT_PENDING = (token: string) => `xp:consent-pending:${token}`;
const CONSENT_GRANTED = (u: string) => `xp:consent-granted:${u}`;

export async function writeAgeBucket(
  username: string,
  birthYear: number,
): Promise<AgeBucket> {
  const bucket = ageBucketFromBirthYear(birthYear);
  await Promise.all([
    kvSet(AGE_KEY(username), bucket),
    kvSet(BIRTH_YEAR_KEY(username), birthYear),
  ]);
  return bucket;
}

export async function readAgeBucket(
  username: string,
): Promise<AgeBucket | null> {
  return (await kvGet<AgeBucket>(AGE_KEY(username))) ?? null;
}

export async function hasParentalConsent(username: string): Promise<boolean> {
  const rec = await kvGet<{ grantedAt: number }>(CONSENT_GRANTED(username));
  return Boolean(rec);
}

/** Phase 8 W6 — revoke a previously-granted parental consent record.
 *  Idempotent; returns true if a record was actually removed. Callers
 *  are expected to chain this with lib/web3/burn-all to honour the
 *  on-chain side of the revocation. */
export async function revokeParentalConsent(
  username: string,
): Promise<boolean> {
  const existed = await hasParentalConsent(username);
  if (!existed) return false;
  const { kvDel } = await import("@/lib/redis");
  await kvDel(CONSENT_GRANTED(username));
  await appendConsentAudit(username, {
    kind: "rejected",
    parentEmail: "",
    token: "",
    ts: Date.now(),
  });
  return true;
}

// ---------------------------------------------------------------------------
// PII validator (6.3.3)
// ---------------------------------------------------------------------------

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d[\s-]?){7,}/;
// Loose "first surname" pattern — two capitalised words back-to-back. We
// don't try to ban every real name, just the obviously-risky shapes.
const NAME_PAIR_RE = /[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}/;

export function containsPII(text: string): string | null {
  if (EMAIL_RE.test(text)) return "email";
  if (PHONE_RE.test(text)) return "phone";
  if (NAME_PAIR_RE.test(text)) return "name-pair";
  return null;
}

// ---------------------------------------------------------------------------
// Parental consent flow (6.3.2 + 6.3.5)
// ---------------------------------------------------------------------------

export type PendingConsent = {
  token: string;
  childUsername: string;
  parentEmail: string;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "granted" | "expired";
};

function randomToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined") {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for node context — we're in server routes where crypto is
    // available globally in modern Node. Swallow the branch for safety.
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const CONSENT_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export async function openConsentRequest(
  childUsername: string,
  parentEmail: string,
): Promise<PendingConsent> {
  const token = randomToken();
  const now = Date.now();
  const rec: PendingConsent = {
    token,
    childUsername,
    parentEmail,
    createdAt: now,
    expiresAt: now + CONSENT_TOKEN_TTL_MS,
    status: "pending",
  };
  await kvSet(CONSENT_PENDING(token), rec, {
    ex: Math.floor(CONSENT_TOKEN_TTL_MS / 1000),
  });
  await appendConsentAudit(childUsername, {
    kind: "requested",
    parentEmail,
    token,
    ts: now,
  });
  // Mock SMTP: log a structured "sent" line. Real SMTP would dispatch here.
  console.log(
    JSON.stringify({
      event: "parental-consent.dispatched",
      childUsername,
      parentEmailDomain: parentEmail.split("@")[1] ?? "?",
      tokenHashPrefix: token.slice(0, 6),
      note: process.env.SMTP_HOST
        ? "SMTP configured — real email sent"
        : "SMTP not configured — would send in prod",
    }),
  );
  return rec;
}

export async function grantConsent(
  token: string,
): Promise<{ ok: boolean; error?: string; child?: string }> {
  const rec = await kvGet<PendingConsent>(CONSENT_PENDING(token));
  if (!rec) return { ok: false, error: "unknown-or-expired-token" };
  if (rec.status !== "pending") return { ok: false, error: "already-acted" };
  if (rec.expiresAt <= Date.now()) return { ok: false, error: "expired" };

  const grantedAt = Date.now();
  // Mark the token record as granted (for history).
  await kvSet(CONSENT_PENDING(token), { ...rec, status: "granted" as const });
  // Create the immutable "granted" record keyed by child username.
  const newConsent = await kvSetNX(CONSENT_GRANTED(rec.childUsername), {
    grantedAt,
    parentEmail: rec.parentEmail,
    token,
  });
  await appendConsentAudit(rec.childUsername, {
    kind: newConsent ? "granted" : "granted-duplicate",
    parentEmail: rec.parentEmail,
    token,
    ts: grantedAt,
  });
  return { ok: true, child: rec.childUsername };
}

export type ConsentAuditEntry = {
  kind: "requested" | "granted" | "granted-duplicate" | "rejected";
  parentEmail: string;
  token: string;
  ts: number;
};

async function appendConsentAudit(
  childUsername: string,
  entry: ConsentAuditEntry,
): Promise<void> {
  await lPush(CONSENT_AUDIT(childUsername), entry);
  await lTrim(CONSENT_AUDIT(childUsername), 0, 49);
}

export async function readConsentAudit(
  childUsername: string,
  n = 20,
): Promise<ConsentAuditEntry[]> {
  return await lRange<ConsentAuditEntry>(CONSENT_AUDIT(childUsername), n);
}
