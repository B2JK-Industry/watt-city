"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClassDef, Role } from "@/lib/roles";

type Copy = {
  createClass: string;
  className: string;
  create: string;
  joinAsStudent: string;
  joinCode: string;
  join: string;
  yourClasses: string;
  members: string;
  code: string;
  open: string;
};

export function ClassClient({
  username,
  initialClasses,
  initialRole,
  copy,
}: {
  username: string;
  initialClasses: ClassDef[];
  initialRole: Role;
  copy: Copy;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [role, setRole] = useState(initialRole);
  const [className, setClassName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/class", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) {
      setClasses(j.classes ?? []);
      setRole(j.role);
    }
    router.refresh();
  }, [router]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: className }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else {
        setClassName("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", joinCode: joinCodeInput }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else {
        setJoinCodeInput("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="card p-3 text-rose-400 text-sm">{error}</div>}

      {role !== "parent" && (
        <section className="card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase">{copy.joinAsStudent}</h2>
          <div className="flex gap-2">
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder={copy.joinCode}
              className="flex-1 px-3 py-2 border-[3px] border-[var(--ink)] rounded bg-[var(--surface-2)] font-mono"
              maxLength={8}
            />
            <button className="btn btn-primary" onClick={join} disabled={busy || joinCodeInput.length < 4}>
              {copy.join}
            </button>
          </div>
        </section>
      )}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase">{copy.createClass}</h2>
        <div className="flex gap-2">
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder={copy.className}
            className="flex-1 px-3 py-2 border-[3px] border-[var(--ink)] rounded bg-[var(--surface-2)]"
            maxLength={60}
          />
          <button className="btn btn-primary" onClick={create} disabled={busy || className.length < 2}>
            {copy.create}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase">{copy.yourClasses}</h2>
        {classes.length === 0 ? (
          <p className="text-xs text-zinc-400">—</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classes.map((cls) => (
              <li key={cls.code} className="card p-3 flex flex-col gap-1">
                <strong>{cls.name}</strong>
                <span className="text-xs text-zinc-400">
                  {copy.code}: <span className="font-mono">{cls.code}</span> ·{" "}
                  {copy.members}: {cls.members.length}
                </span>
                <Link href={`/class/${cls.code}`} className="btn btn-ghost text-xs mt-1 self-start">
                  {copy.open}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
