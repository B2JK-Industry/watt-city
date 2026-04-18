"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DUEL_GAMES, type DuelGameId } from "@/lib/duel";
import type { Dict } from "@/lib/i18n";

type Props = { username: string; dict: Dict };

export function DuelLobby({ username, dict }: Props) {
  const t = dict.duel;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState<DuelGameId>("currency-rush-duel");
  const [pending, setPending] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setPending("create");
    try {
      const res = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? t.errorCreate);
        return;
      }
      router.push(`/duel/${json.code}`);
    } catch {
      setError(t.errorNetwork);
    } finally {
      setPending(null);
    }
  }

  async function join(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError(t.errorInvalidCode);
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
        setError(json.error ?? t.errorJoin);
        return;
      }
      router.push(`/duel/${trimmed}`);
    } catch {
      setError(t.errorNetwork);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-6 flex flex-col gap-4">
        <h3 className="brutal-heading text-lg">{t.createTitle}</h3>
        <p className="text-sm text-zinc-400">{t.createBody}</p>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            {t.pickGameLabel}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DUEL_GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGameId(g.id)}
                className={`text-left rounded-xl border-[3px] px-3 py-2.5 transition-all ${
                  gameId === g.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[3px_3px_0_0_var(--accent)]"
                    : "border-[var(--ink)] bg-[var(--surface-2)] hover:border-[var(--accent)]/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <p className="font-black uppercase text-sm tracking-tight">
                      {g.title}
                    </p>
                    <p className="text-[11px] text-zinc-400">{g.tagline}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={pending !== null}
          className="btn btn-primary w-fit"
        >
          {pending === "create" ? t.creating : t.createButton}
        </button>
      </div>

      <form onSubmit={join} className="card p-6 flex flex-col gap-4">
        <h3 className="brutal-heading text-lg">{t.joinTitle}</h3>
        <p className="text-sm text-zinc-400">{t.joinBody}</p>
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
          {pending === "join" ? t.joining : t.joinButton}
        </button>
      </form>

      {error && (
        <p className="md:col-span-2 text-rose-400 text-sm">{error}</p>
      )}
      <p className="md:col-span-2 text-xs text-zinc-500">
        {t.loggedInAs.replace("{name}", "")} <strong className="text-zinc-300">{username}</strong>.
      </p>
    </div>
  );
}
