import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.auth;
  return (
    <div className="max-w-md mx-auto card p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="t-h2 text-[var(--accent)]">{t.registerTitle}</h1>
        <p className="t-body text-[var(--foreground)]">{t.registerBody}</p>
      </div>
      <AuthForm mode="register" dict={dict} />
      <p className="t-body-sm text-[var(--ink-muted)]">
        {t.switchToLogin}{" "}
        <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
          {t.switchToLoginAction}
        </Link>
      </p>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--line)]">
        {/* G-01 patch 5 — chip title was hardcoded EN, leaked to all
            non-en locales as untranslatable. Now reads from `t.gdprKTooltip`
            so PL/UK/CS players see localized tooltip text. */}
        <span className="chip" title={t.gdprKTooltip}>
          🔒 GDPR-K
        </span>
        <span className="chip" title="KNF / UOKiK aligned">
          ⚖️ KNF / UOKiK
        </span>
        <span className="chip" title="EU-hosted (Frankfurt + Vercel EU)">
          🇪🇺 EU-hosted
        </span>
      </div>
    </div>
  );
}
