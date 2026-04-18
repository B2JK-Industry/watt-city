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
      <div>
        <h1 className="text-2xl font-bold">{t.registerTitle}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.registerBody}</p>
      </div>
      <AuthForm mode="register" dict={dict} />
      <p className="text-sm text-zinc-400">
        {t.switchToLogin}{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          {t.switchToLoginAction}
        </Link>
      </p>
    </div>
  );
}
