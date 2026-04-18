import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <div className="max-w-md mx-auto card p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Prihlásenie</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Vráť sa k Wattom, ktoré svieti tvoje mesto.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-zinc-400">
        Nový hráč?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Vytvoriť účet
        </Link>
      </p>
    </div>
  );
}
