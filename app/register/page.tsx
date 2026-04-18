import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <div className="max-w-md mx-auto card p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Registrácia</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Vytvor si meno — od prvej hry začneš zbierať XP.
        </p>
      </div>
      <AuthForm mode="register" />
      <p className="text-sm text-zinc-400">
        Máš už účet?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Prihlásiť sa
        </Link>
      </p>
    </div>
  );
}
