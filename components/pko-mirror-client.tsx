"use client";

import { useCallback, useState } from "react";
import type { JuniorAccount, JuniorTx } from "@/lib/pko-junior-mock";

type Copy = {
  createAccount: string;
  childName: string;
  create: string;
  balance: string;
  mirror: string;
  mirrorHint: string;
  topup: string;
  amount: string;
  apply: string;
  history: string;
  empty: string;
};

type Props = {
  initialAccount: JuniorAccount | null;
  initialAudit: JuniorTx[];
  wattCityCashZl: number;
  copy: Copy;
};

export function PkoMirrorClient({ initialAccount, initialAudit, wattCityCashZl, copy }: Props) {
  const [account, setAccount] = useState(initialAccount);
  const [audit, setAudit] = useState(initialAudit);
  const [childName, setChildName] = useState("");
  const [topupAmount, setTopupAmount] = useState(10);
  const [mirrorPct, setMirrorPct] = useState(0.1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/pko", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) {
      setAudit(j.audit ?? []);
      if (j.balance?.ok) {
        setAccount((prev) => ({
          ...(prev ?? { username: "", childName: j.balance.childName, balancePln: 0, linkedAt: 0 }),
          balancePln: j.balance.balance,
        }));
      }
    }
  }, []);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/pko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else await refresh();
      return j;
    } finally {
      setBusy(false);
    }
  };

  if (!account) {
    return (
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{copy.createAccount}</h2>
        <div className="flex gap-2">
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={copy.childName}
            className="flex-1 px-3 py-2 border border-[var(--ink)] rounded bg-[var(--surface-2)]"
          />
          <button
            className="btn btn-primary"
            disabled={busy || !childName.trim()}
            onClick={async () => {
              const j = await post({ action: "ensure-account", childName });
              if (j?.ok) setAccount(j.account);
            }}
          >
            {copy.create}
          </button>
        </div>
        {error && <p className="text-[var(--danger)] text-xs">{error}</p>}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="card p-3 text-[var(--danger)] text-sm">{error}</div>}
      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{copy.balance}</h2>
        <p className="text-3xl font-mono font-semibold">
          {account.balancePln.toLocaleString("pl-PL")} PLN
        </p>
        <p className="text-xs text-[var(--ink-muted)]">{account.childName}</p>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{copy.mirror}</h2>
        <p className="text-xs text-[var(--ink-muted)]">{copy.mirrorHint}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs">Watt City cashZl: {wattCityCashZl}</span>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={mirrorPct}
            onChange={(e) => setMirrorPct(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-mono">{(mirrorPct * 100).toFixed(0)} %</span>
          <button
            className="btn btn-primary"
            disabled={busy || wattCityCashZl <= 0}
            onClick={() => post({ action: "mirror", pct: mirrorPct })}
          >
            {copy.apply}
          </button>
        </div>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{copy.topup}</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={500}
            value={topupAmount}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            className="w-24 px-2 py-1 border border-[var(--ink)] rounded bg-[var(--surface-2)] font-mono"
          />
          <button
            className="btn btn-primary"
            disabled={busy || topupAmount < 1}
            onClick={() => post({ action: "topup", amount: topupAmount })}
          >
            {copy.apply}
          </button>
        </div>
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{copy.history}</h2>
        {audit.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">{copy.empty}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs font-mono">
            {audit.map((t) => (
              <li key={t.txId} className="flex justify-between bg-black/20 p-2 rounded">
                <span>
                  {t.kind} · {t.amount} PLN
                </span>
                <span>{new Date(t.ts).toLocaleString("pl-PL")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
