"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Role, ChildParentPrivacy } from "@/lib/roles";

type Copy = {
  generateCode: string;
  linkAsParent: string;
  linked: string;
  children: string;
  parents: string;
  privacy: string;
  hideLedger: string;
  hideDuels: string;
  hideBuildings: string;
  newCode: string;
  generate: string;
  link: string;
  open: string;
  /** F-NEW-12 — short helper line under the join-code input. */
  codeHelper: string;
  /** F-NEW-12 — chip with live "X/6 znaków" countdown. {n} → typed length. */
  codeProgress: string;
};

type Props = {
  role: Role;
  kids: string[];
  parents: string[];
  privacy: ChildParentPrivacy;
  copy: Copy;
};

export function ParentClient({ role: initialRole, kids: initialKids, parents, privacy: initialPrivacy, copy }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [kids, setKids] = useState(initialKids);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [code, setCode] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/parent", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) {
      setRole(j.role);
      setKids(j.children);
      setPrivacy(j.privacy);
    }
    router.refresh();
  }, [router]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-code" }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else setCode(j.code);
    } finally {
      setBusy(false);
    }
  };

  const link = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", code: linkCode }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else {
        setLinkCode("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const togglePrivacy = async (k: keyof ChildParentPrivacy, v: boolean) => {
    await fetch("/api/parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-privacy", privacy: { [k]: v } }),
    });
    await refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="card p-3 text-[var(--danger)] text-sm">{error}</div>}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{copy.generateCode}</h2>
        <button className="btn btn-ghost text-sm self-start" onClick={generate} disabled={busy}>
          {copy.generate}
        </button>
        {code && (
          <p className="text-lg font-mono">
            {copy.newCode}:&nbsp;<strong className="text-[var(--accent)]">{code}</strong>
          </p>
        )}
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 id="link-as-parent-heading" className="text-sm font-semibold">{copy.linkAsParent}</h2>
        <div className="flex gap-2">
          <input
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
            aria-labelledby="link-as-parent-heading"
            aria-describedby="link-as-parent-helper"
            className="flex-1 px-3 py-2 border border-[var(--line)] rounded bg-[var(--surface-2)] font-mono"
            maxLength={16}
          />
          {/* F-NEW-12 — visual states. Default outline ("looks
              clickable" — not the gray-disabled it used to be); fills
              navy once 6 chars are typed (the server-side validated
              code length). Even before 6 chars the button is
              clickable; the API will reject and we surface the error
              instead of the hard `disabled` UI. */}
          <button
            className={`btn ${linkCode.length === 6 ? "btn-primary" : "btn-secondary"}`}
            onClick={link}
            disabled={busy}
            aria-label={copy.link}
          >
            {copy.link}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p
            id="link-as-parent-helper"
            className="t-body-sm text-[var(--ink-muted)] flex-1"
          >
            {copy.codeHelper}
          </p>
          <span className="chip text-[10px]">
            {copy.codeProgress.replace("{n}", String(linkCode.length))}
          </span>
        </div>
      </section>

      {role === "parent" && kids.length > 0 && (
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{copy.children}</h2>
          <ul className="flex flex-col gap-1">
            {kids.map((c) => (
              <li key={c} className="flex items-center justify-between">
                <span>{c}</span>
                <Link href={`/parent/${encodeURIComponent(c)}`} className="btn btn-ghost text-xs">
                  {copy.open}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {parents.length > 0 && (
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{copy.parents}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {parents.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{copy.privacy}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={privacy.hideLedger}
            onChange={(e) => togglePrivacy("hideLedger", e.target.checked)}
          />
          {copy.hideLedger}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={privacy.hideDuelHistory}
            onChange={(e) => togglePrivacy("hideDuelHistory", e.target.checked)}
          />
          {copy.hideDuels}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={privacy.hideBuildings}
            onChange={(e) => togglePrivacy("hideBuildings", e.target.checked)}
          />
          {copy.hideBuildings}
        </label>
      </section>
    </div>
  );
}
