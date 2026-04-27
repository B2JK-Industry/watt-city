import Link from "next/link";
import { redirect } from "next/navigation";
import {
  consumeTeacherVerification,
} from "@/lib/teacher-verify";
import { markTeacherVerified } from "@/lib/class";
import { getLang } from "@/lib/i18n-server";

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
 *
 * G-31 — locale-aware error explainer (was hardcoded PL on first
 * ship). Token consume + redirect path is locale-agnostic so it
 * doesn't need translation.
 */

type SearchParams = {
  token?: string;
};

const COPY = {
  pl: {
    title: "Link wygasł lub został już użyty",
    body: "Linki weryfikacyjne działają 24 godziny i tylko raz. Możesz poprosić o nowy z pulpitu nauczyciela albo zarejestrować się jeszcze raz.",
    dashboard: "Pulpit nauczyciela",
    signup: "Nowa rejestracja",
  },
  uk: {
    title: "Посилання застаріло або вже було використано",
    body: "Посилання для верифікації діють 24 години та лише один раз. Запроси нове з панелі вчителя або зареєструйся знову.",
    dashboard: "Панель вчителя",
    signup: "Нова реєстрація",
  },
  cs: {
    title: "Odkaz vypršel nebo už byl použit",
    body: "Verifikační odkazy fungují 24 hodin a pouze jednou. Vyžádej si nový z panelu učitele nebo se zaregistruj znovu.",
    dashboard: "Panel učitele",
    signup: "Nová registrace",
  },
  en: {
    title: "Link has expired or was already used",
    body: "Verification links work for 24 hours and a single use. Request a new one from the teacher dashboard or sign up again.",
    dashboard: "Teacher dashboard",
    signup: "New signup",
  },
} as const;

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
    const lang = await getLang();
    const t = COPY[lang];
    return (
      <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center animate-slide-up">
        <span aria-hidden className="text-5xl">
          ⏳
        </span>
        <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
        <p className="text-[var(--ink-muted)] max-w-md">{t.body}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/nauczyciel" className="btn btn-primary">
            {t.dashboard}
          </Link>
          <Link href="/nauczyciel/signup" className="btn btn-secondary">
            {t.signup}
          </Link>
        </div>
      </main>
    );
  }
  await markTeacherVerified(payload.username);
  redirect("/nauczyciel?verified=1");
}
