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

const CURRENT_YEAR = new Date().getUTCFullYear();

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
  // Phase 6.3.1: required. Client collects via a <select> of birth years.
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(CURRENT_YEAR)
    .optional(),
  // Phase 6.3.2: if under-16, parent's email for consent dispatch.
  parentEmail: z.string().email().max(120).optional(),
});

export async function POST(request: NextRequest) {
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
    return Response.json(
      { ok: false, error: "Podaj nazwę, hasło i rok urodzenia." },
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
