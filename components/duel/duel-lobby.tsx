"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = { username: string };

export function DuelLobby({ username }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setPending("create");
    try {
      const res = await fetch("/api/duel/create", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Nepodarilo sa vytvoriť duel.");
        return;
      }
      router.push(`/duel/${json.code}`);
    } catch {
      setError("Sieťová chyba.");
    } finally {
      setPending(null);
    }
  }

  async function join(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Zadaj platný kód.");
      return;
    }
    setPending("join");
    try {
      const res = await fetch(`/api/duel/${trimmed}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Pripojenie sa nepodarilo.");
        return;
      }
      router.push(`/duel/${trimmed}`);
    } catch {
      setError("Sieťová chyba.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-6 flex flex-col gap-4">
        <h3 className="brutal-heading text-lg">Vytvoriť duel</h3>
        <p className="text-sm text-zinc-400">
          Staneš sa hráč A. Dostaneš kód a pošleš ho kamarátovi. Môžeš zahrať
          hneď — kamarát zahrá keď bude môcť.
        </p>
        <button
          type="button"
          onClick={create}
          disabled={pending !== null}
          className="btn btn-primary w-fit"
        >
          {pending === "create" ? "Vytváram…" : "Vytvoriť nový duel"}
        </button>
      </div>

      <form onSubmit={join} className="card p-6 flex flex-col gap-4">
        <h3 className="brutal-heading text-lg">Pripojiť sa</h3>
        <p className="text-sm text-zinc-400">
          Máš od kamaráta kód? Zadaj ho a pripoj sa ako hráč B.
        </p>
        <input
          className="input text-center uppercase tracking-[0.4em] font-mono text-xl"
          placeholder="K7WXM3"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={10}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={pending !== null}
          className="btn btn-pink w-fit"
        >
          {pending === "join" ? "Pripájam…" : "Pripojiť sa"}
        </button>
      </form>

      {error && (
        <p className="md:col-span-2 text-rose-400 text-sm">{error}</p>
      )}
      <p className="md:col-span-2 text-xs text-zinc-500">
        Prihlásený ako <strong className="text-zinc-300">{username}</strong>.
      </p>
    </div>
  );
}
