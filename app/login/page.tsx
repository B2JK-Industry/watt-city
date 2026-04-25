import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.auth;
  return (
    <div className="max-w-md mx-auto card p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="t-h2 text-[var(--accent)]">{t.loginTitle}</h1>
        <p className="t-body text-[var(--foreground)]">{t.loginBody}</p>
      </div>
      <AuthForm mode="login" dict={dict} />
      <p className="t-body-sm text-[var(--ink-muted)]">
        {t.switchToRegister}{" "}
        <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
          {t.switchToRegisterAction}
        </Link>
      </p>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--line)]">
        <span className="chip" title="GDPR-K compliant">
          🔒 GDPR-K
        </span>
        <span className="chip" title="KNF/UOKiK aligned">
          ⚖️ KNF / UOKiK
        </span>
        <span className="chip" title="EU-hosted">
          🇪🇺 EU-hosted
        </span>
      </div>
    </div>
  );
}
