import Link from "next/link";
import { redirect } from "next/navigation";
import {
  consumeTeacherVerification,
} from "@/lib/teacher-verify";
import { markTeacherVerified } from "@/lib/class";

/* G-14 — teacher email verification landing.
 *
 * The link in the verify email points here with `?token=…`. We
 * consume the token (single-use), flip the teacher's `verified`
 * flag, then redirect to /nauczyciel so the dashboard's class-
 * creation CTAs are unblocked.
 *
 * Failure modes:
 *   - missing token → 308 to /login (link probably mistyped)
 *   - expired/redeemed token → render an explainer with a "request
 *     new link" CTA pointing back at signup
 */

type SearchParams = {
  token?: string;
};

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  if (!sp.token) {
    redirect("/login");
  }
  const payload = await consumeTeacherVerification(sp.token);
  if (!payload) {
    return (
      <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center animate-slide-up">
        <span aria-hidden className="text-5xl">
          ⏳
        </span>
        <h1 className="t-h2 text-[var(--accent)]">Link wygasł lub został już użyty</h1>
        <p className="text-[var(--ink-muted)] max-w-md">
          Linki weryfikacyjne działają 24 godziny i tylko raz. Możesz
          poprosić o nowy z pulpitu nauczyciela albo zarejestrować się
          jeszcze raz.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/nauczyciel" className="btn btn-primary">
            Pulpit nauczyciela
          </Link>
          <Link href="/nauczyciel/signup" className="btn btn-secondary">
            Nowa rejestracja
          </Link>
        </div>
      </main>
    );
  }
  await markTeacherVerified(payload.username);
  redirect("/nauczyciel?verified=1");
}
