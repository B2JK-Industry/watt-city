import { NextRequest } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import {
  ageBucketFromBirthYear,
  containsPII,
  openConsentRequest,
  requiresParentalConsent,
  writeAgeBucket,
} from "@/lib/gdpr-k";
import { getPlayerState } from "@/lib/player";
import { ensureSignupGift } from "@/lib/buildings";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

const CURRENT_YEAR = new Date().getUTCFullYear();

/* Anti-abuse: cap new-account creation per source IP per minute.
 * Register is in EXEMPT_PATH_PREFIXES (has to be — anonymous users
 * have no CSRF cookie yet), so this is the narrowest layer available.
 * `REGISTER_IP_RATE` and `REGISTER_IP_WINDOW_MS` are overridable via
 * env for abuse-response tuning without a redeploy. */
const REGISTER_IP_LIMIT = Number(process.env.REGISTER_IP_LIMIT ?? 5);
const REGISTER_IP_WINDOW_MS = Number(process.env.REGISTER_IP_WINDOW_MS ?? 60_000);

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  // G-01 patch 4 — server-side password rules mirror the form. Min 8
  // + one letter + one digit. The HTML5 pattern on the form already
  // blocks bad input, but a hand-crafted POST should not get through.
  password: z
    .string()
    .min(8)
    .max(200)
    .regex(/(?=.*[a-zA-Z])(?=.*\d).{8,}/, "Hasło: min. 8 znaków, 1 litera i 1 cyfra."),
  // G-01 patch 4 — birth year clamped to GDPR-K target range (7-16).
  // currentYear-6 = oldest birthYear that still qualifies as 7+,
  // currentYear-16 = youngest birthYear we accept (older players are
  // outside our child-product cohort and shouldn't be onboarded
  // through the kid signup flow). Existing accounts with legacy birth
  // years are unaffected — clamp gates new registrations only.
  birthYear: z
    .number()
    .int()
    .min(CURRENT_YEAR - 16)
    .max(CURRENT_YEAR - 6)
    .optional(),
  // Phase 6.3.2: if under-16, parent's email for consent dispatch.
  parentEmail: z.string().email().max(120).optional(),
});

export async function POST(request: NextRequest) {
  // IP-based rate limit runs BEFORE body parsing so a flood of
  // malformed payloads can't use up DB CPU on scrypt hashing. 429 is
  // the conventional anti-bot response; the client should show a
  // "try again later" hint.
  const ip = clientIp(request);
  const rl = await rateLimit(
    `register-ip:${ip}`,
    REGISTER_IP_LIMIT,
    REGISTER_IP_WINDOW_MS,
  );
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate-limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  let parsed;
  try {
    const json = await request.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return Response.json(
      { ok: false, error: "Nieprawidłowe żądanie." },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    // G-01 patch 4 — surface the first Zod issue's message so password
    // rule violations + birth year clamps return useful client copy
    // instead of a generic "fill the form" string.
    const firstIssue = parsed.error.issues[0];
    return Response.json(
      {
        ok: false,
        error:
          firstIssue?.message ?? "Podaj nazwę, hasło i rok urodzenia.",
      },
      { status: 400 },
    );
  }

  // Phase 6.3.3 PII validator — reject obvious identifiers in the username.
  const pii = containsPII(parsed.data.username);
  if (pii) {
    return Response.json(
      {
        ok: false,
        error: `Nazwa użytkownika nie może zawierać danych osobowych (${pii}). Wybierz pseudonim.`,
      },
      { status: 400 },
    );
  }

  // 6.3.1 — age gate. If birthYear missing, treat as unknown and require it.
  const birthYear = parsed.data.birthYear;
  if (!birthYear) {
    return Response.json(
      { ok: false, error: "Podaj rok urodzenia (wymagane przez RODO-K)." },
      { status: 400 },
    );
  }
  const bucket = ageBucketFromBirthYear(birthYear);

  // 6.3.2 — under-16 requires parent email to dispatch consent request.
  // We still create the account so the kid can start exploring read-only
  // surfaces; the gating flags block posting / spending / trading until
  // consent is granted (enforced elsewhere in Phase 6.3 follow-ups).
  const needsConsent = requiresParentalConsent(bucket);
  const parentEmail = parsed.data.parentEmail;
  if (needsConsent && !parentEmail) {
    return Response.json(
      {
        ok: false,
        error:
          "Konta dla osób poniżej 16 lat wymagają zgody rodzica. Podaj adres e-mail rodzica.",
      },
      { status: 400 },
    );
  }

  const result = await registerUser(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  await writeAgeBucket(result.user.username, birthYear);

  let pendingConsentToken: string | null = null;
  if (needsConsent && parentEmail) {
    const pending = await openConsentRequest(result.user.username, parentEmail);
    pendingConsentToken = pending.token;
  }

  await createSession(result.user.username);

  // V3.2 — trigger the signup gift + starter kit synchronously here so
  // the very first authenticated render already sees Domek on slot 10
  // and 50 coins + 50 bricks in the wallet. Non-fatal if it fails (the
  // layout.tsx path re-runs ensureSignupGift on every authenticated
  // render as a back-stop), so we swallow errors with a structured log.
  try {
    const state = await getPlayerState(result.user.username);
    await ensureSignupGift(state);
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "v3.2.register-gift-failed",
        user: result.user.username,
        error: (e as Error).message,
      }),
    );
  }

  return Response.json({
    ok: true,
    username: result.user.username,
    ageBucket: bucket,
    needsConsent,
    pendingConsentToken,
  });
}
