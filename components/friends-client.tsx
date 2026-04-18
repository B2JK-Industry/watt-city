"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Data = {
  friends: string[];
  inbox: string[];
  outgoing: string[];
  privacy: {
    profileVisibility: "public" | "friends" | "private";
    cashflowVisible: boolean;
  };
};

type Copy = {
  friendsLabel: string;
  inboxLabel: string;
  outgoingLabel: string;
  addByUsername: string;
  send: string;
  accept: string;
  reject: string;
  remove: string;
  visit: string;
  privacyLabel: string;
  publicOpt: string;
  friendsOpt: string;
  privateOpt: string;
  cashflowOpt: string;
  empty: string;
};

export function FriendsClient({ copy }: { copy: Copy }) {
  const [data, setData] = useState<Data | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/friends", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) setData(j);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (
    action: "request" | "accept" | "reject" | "remove",
    target?: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, other: target ?? other }),
      });
      const j = await res.json();
      if (!j.ok) setError(j.error);
      else {
        if (action === "request") setOther("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-zinc-400 text-sm">…</p>;

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-black uppercase">{copy.addByUsername}</h2>
        <div className="flex gap-2">
          <input
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="username"
            className="flex-1 px-3 py-2 border-[3px] border-[var(--ink)] rounded bg-[var(--surface-2)]"
          />
          <button
            className="btn btn-primary"
            disabled={busy || !other.trim()}
            onClick={() => act("request")}
          >
            {copy.send}
          </button>
        </div>
        {error && <p className="text-rose-400 text-xs">{error}</p>}
      </section>

      {data.inbox.length > 0 && (
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="text-sm font-black uppercase">{copy.inboxLabel}</h2>
          <ul className="flex flex-col gap-2">
            {data.inbox.map((u) => (
              <li key={u} className="flex items-center justify-between gap-2">
                <strong>{u}</strong>
                <div className="flex gap-1">
                  <button className="btn btn-primary text-xs" onClick={() => act("accept", u)} disabled={busy}>
                    {copy.accept}
                  </button>
                  <button className="btn btn-ghost text-xs" onClick={() => act("reject", u)} disabled={busy}>
                    {copy.reject}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">
          {copy.friendsLabel} · {data.friends.length}
        </h2>
        {data.friends.length === 0 ? (
          <p className="text-xs text-zinc-500">{copy.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.friends.map((u) => (
              <li key={u} className="flex items-center justify-between gap-2">
                <Link href={`/friends/${encodeURIComponent(u)}`} className="font-bold underline">
                  {u}
                </Link>
                <div className="flex gap-1">
                  <Link href={`/friends/${encodeURIComponent(u)}`} className="btn btn-ghost text-xs">
                    {copy.visit}
                  </Link>
                  <button className="btn btn-ghost text-xs" onClick={() => act("remove", u)} disabled={busy}>
                    {copy.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.outgoing.length > 0 && (
        <section className="card p-4 flex flex-col gap-1 text-xs text-zinc-400">
          <h3 className="text-sm font-black uppercase">{copy.outgoingLabel}</h3>
          {data.outgoing.map((u) => (
            <span key={u}>→ {u}</span>
          ))}
        </section>
      )}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase">{copy.privacyLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {(["public", "friends", "private"] as const).map((v) => {
            const label = v === "public" ? copy.publicOpt : v === "friends" ? copy.friendsOpt : copy.privateOpt;
            return (
              <button
                key={v}
                onClick={async () => {
                  setBusy(true);
                  await fetch("/api/friends", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "set-privacy",
                      privacy: { profileVisibility: v },
                    }),
                  });
                  await refresh();
                  setBusy(false);
                }}
                className={
                  "btn text-xs " +
                  (data.privacy.profileVisibility === v ? "btn-primary" : "btn-ghost")
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={data.privacy.cashflowVisible}
            onChange={async (e) => {
              await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "set-privacy",
                  privacy: { cashflowVisible: e.target.checked },
                }),
              });
              await refresh();
            }}
          />
          {copy.cashflowOpt}
        </label>
      </section>
    </div>
  );
}
