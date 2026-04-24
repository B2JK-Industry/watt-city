"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { BuildingInstance } from "@/lib/player";
import type { Resources } from "@/lib/resources";
import type { Listing } from "@/lib/marketplace";
import { getCatalogEntry } from "@/lib/building-catalog";

type Copy = {
  yourBuildings: string;
  listFor: string;
  listings: string;
  askLabel: string;
  listNow: string;
  buyNow: string;
  cancel: string;
  historyLabel: string;
  ownListing: string;
  sellerLabel: string;
  empty: string;
};

export function MarketplaceClient({
  username,
  ownBuildings,
  resources,
  initialListings,
  initialHistory,
  copy,
}: {
  username: string;
  tier: number;
  ownBuildings: BuildingInstance[];
  resources: Resources;
  initialListings: Listing[];
  initialHistory: Array<Record<string, unknown>>;
  copy: Copy;
}) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [history, setHistory] = useState(initialHistory);
  const [selected, setSelected] = useState<string | null>(null);
  const [ask, setAsk] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [l, h] = await Promise.all([
      fetch("/api/market/listings").then((r) => r.json()),
      fetch("/api/market/history").then((r) => r.json()),
    ]);
    if (l.ok) setListings(l.listings);
    if (h.ok) setHistory(h.history);
    router.refresh();
  }, [router]);

  const doList = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/market/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: selected, askPrice: ask }),
      });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else {
        setSelected(null);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const doBuy = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/market/buy/${id}`, { method: "POST" });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else await refresh();
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/market/cancel/${id}`, { method: "POST" });
      const j = await r.json();
      if (!j.ok) setError(j.error);
      else await refresh();
    } finally {
      setBusy(false);
    }
  };

  const sellable = ownBuildings.filter((b) => b.catalogId !== "domek");

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="card p-3 text-[var(--danger)] text-sm">{error}</div>}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{copy.yourBuildings}</h2>
        {sellable.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">{copy.empty}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sellable.map((b) => {
              const entry = getCatalogEntry(b.catalogId);
              const isSelected = selected === b.id;
              return (
                <li
                  key={b.id}
                  className={
                    "border rounded p-3 flex flex-col gap-1 text-sm cursor-pointer " +
                    (isSelected ? "border-[var(--accent)]" : "border-[var(--ink)]/30")
                  }
                  onClick={() => setSelected(b.id)}
                >
                  <div className="flex items-center justify-between">
                    <strong>{entry?.labels.pl ?? b.catalogId}</strong>
                    <span className="text-xs">L{b.level}</span>
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)]">slot #{b.slotId} · T{entry?.tier}</span>
                </li>
              );
            })}
          </ul>
        )}
        {selected && (
          <div className="flex gap-2 items-center">
            <label className="flex flex-col text-xs flex-1">
              <span>{copy.askLabel}</span>
              <input
                type="number"
                min={1}
                value={ask}
                onChange={(e) => setAsk(Number(e.target.value))}
                className="px-2 py-1 border border-[var(--ink)] rounded bg-[var(--surface-2)]"
              />
            </label>
            <button className="btn btn-primary" onClick={doList} disabled={busy || ask < 1}>
              {copy.listNow}
            </button>
          </div>
        )}
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {copy.listings} · {listings.length}
        </h2>
        {listings.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">{copy.empty}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {listings.map((l) => {
              const entry = getCatalogEntry(l.buildingSnapshot.catalogId);
              const own = l.sellerId === username;
              const canAfford = (resources.cashZl ?? 0) >= l.askPrice;
              return (
                <li
                  key={l.id}
                  className="border border-[var(--ink)]/40 rounded p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <strong>
                      {entry?.labels.pl ?? l.buildingSnapshot.catalogId} L{l.buildingSnapshot.level}
                    </strong>
                    <span className="font-mono text-sm">{l.askPrice} W$</span>
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {copy.sellerLabel}: {l.sellerId} {own ? ` ${copy.ownListing}` : ""}
                  </span>
                  {own ? (
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => doCancel(l.id)}
                      disabled={busy}
                    >
                      {copy.cancel}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary text-xs"
                      onClick={() => doBuy(l.id)}
                      disabled={busy || !canAfford}
                    >
                      {copy.buyNow}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{copy.historyLabel}</h2>
        {history.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">{copy.empty}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs font-mono">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between bg-black/20 p-2 rounded">
                <span>
                  {(h.kind as string)} · {(h.catalogId as string)}
                </span>
                <span>
                  {(h.price ?? h.askPrice ?? "-") as number} W$ ·{" "}
                  {new Date((h.ts as number) ?? 0).toLocaleDateString("pl-PL")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
