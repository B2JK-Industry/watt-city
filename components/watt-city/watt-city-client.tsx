"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import {
  RESOURCE_DEFS,
  RESOURCE_KEYS,
  type Resources,
  type ResourceKey,
} from "@/lib/resources";
import {
  SLOT_MAP,
  type SlotCategory,
  type BuildingCatalogEntry,
  type SlotDef,
} from "@/lib/building-catalog";
import type { Loan } from "@/lib/player";

const VB_W = 1800;
const VB_H = 460;

export type WattCityBootstrap = {
  resources: Resources;
  tier: number;
  creditScore: number;
  catalog: Array<{
    entry: BuildingCatalogEntry;
    unlocked: boolean;
    affordable: boolean;
    reasonLocked: string | null;
  }>;
  slots: Array<{
    slot: SlotDef;
    building: {
      id: string;
      slotId: number;
      catalogId: string;
      level: number;
      builtAt: number;
      lastTickAt: number;
      cumulativeCost: Partial<Resources>;
      currentYield: Partial<Resources>;
      labels: Record<Lang, string> | null;
      glyph: string | null;
      roofColor: string | null;
      bodyColor: string | null;
    } | null;
  }>;
  loans: Loan[];
  lang: Lang;
  dict: {
    pickSlot: string;
    buildHere: string;
    upgrade: string;
    demolish: string;
    level: string;
    category: string;
    yields: string;
    cost: string;
    tier: string;
    creditScore: string;
    mortgageTitle: string;
    mortgageBody: string;
    mortgageMax: string;
    mortgageMonthly: string;
    mortgageTotalInterest: string;
    mortgageTake: string;
    mortgageOpen: string;
    loansTitle: string;
    noLoans: string;
    lockedComing: string;
    emptySlot: string;
    locked: string;
    rrsoLabel: string;
    termMonths: string;
    principal: string;
    comingSoon: string;
    disclaimer: string;
  };
};

function formatResourceDelta(
  delta: Partial<Resources>,
  lang: Lang,
): string {
  const parts: string[] = [];
  for (const k of RESOURCE_KEYS) {
    const v = delta[k];
    if (!v) continue;
    const def = RESOURCE_DEFS[k];
    const sign = v > 0 ? "+" : "";
    parts.push(`${sign}${v} ${def.icon}`);
  }
  return parts.length ? parts.join(" · ") : "—";
}

function categoryLabel(cat: SlotCategory, lang: Lang): string {
  const map: Record<SlotCategory, Record<Lang, string>> = {
    residential: { pl: "mieszkalne", uk: "житлове", cs: "bydlení", en: "residential" },
    commercial: { pl: "komercyjne", uk: "комерційне", cs: "komerční", en: "commercial" },
    industry: { pl: "przemysł", uk: "промисловість", cs: "průmysl", en: "industry" },
    civic: { pl: "cywilne", uk: "цивільне", cs: "občanské", en: "civic" },
    landmark: { pl: "punkt widokowy", uk: "пам’ятка", cs: "dominanta", en: "landmark" },
    decorative: { pl: "dekoracyjne", uk: "декоративне", cs: "dekorativní", en: "decorative" },
  };
  return map[cat][lang];
}

type SelectedState =
  | { kind: "slot"; slotId: number }
  | { kind: "building"; slotId: number }
  | null;

export function WattCityClient({ bootstrap }: { bootstrap: WattCityBootstrap }) {
  const router = useRouter();
  const [state, setState] = useState(bootstrap);
  const [selected, setSelected] = useState<SelectedState>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dict, lang } = state;

  const refresh = useCallback(async () => {
    const r = await fetch("/api/buildings", { cache: "no-store" });
    const j = await r.json();
    if (j.ok) {
      // Merge back into state, keeping dict/lang stable.
      setState((prev) => ({
        ...prev,
        resources: j.resources,
        tier: j.tier,
        creditScore: j.creditScore,
        catalog: j.catalog,
        slots: j.slots,
      }));
    }
    router.refresh();
  }, [router]);

  const doPlace = useCallback(
    async (slotId: number, catalogId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/buildings/place", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId, catalogId }),
        });
        const j = await res.json();
        if (!j.ok) {
          setError(j.error);
        } else {
          setSelected({ kind: "building", slotId });
          await refresh();
        }
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const doUpgrade = useCallback(
    async (instanceId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/buildings/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceId }),
        });
        const j = await res.json();
        if (!j.ok) setError(j.error);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const doDemolish = useCallback(
    async (instanceId: string) => {
      if (!confirm("Zburzyć budynek? Otrzymasz 50% kosztów.")) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/buildings/demolish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceId }),
        });
        const j = await res.json();
        if (!j.ok) setError(j.error);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const selectedSlotDef = useMemo(() => {
    if (!selected) return null;
    return SLOT_MAP.find((s) => s.id === selected.slotId) ?? null;
  }, [selected]);

  const selectedSnap = useMemo(() => {
    if (!selected) return null;
    return state.slots.find((s) => s.slot.id === selected.slotId) ?? null;
  }, [selected, state.slots]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tier + credit banner */}
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <span className="chip">
            <strong>{dict.tier}</strong>&nbsp;
            <span className="font-mono">T{state.tier}</span>
          </span>
          <span className="chip">
            <strong>{dict.creditScore}</strong>&nbsp;
            <span className="font-mono">{state.creditScore}/100</span>
          </span>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 max-w-md">
          {dict.disclaimer}
        </p>
      </header>

      {/* Slot map */}
      <section className="card p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Watt City slot map"
        >
          {/* sky gradient */}
          <defs>
            <linearGradient id="wc-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="1" stopColor="#020617" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#wc-sky)" />
          <line x1={0} y1={400} x2={VB_W} y2={400} stroke="#1e293b" strokeWidth={4} />

          {state.slots.map(({ slot, building }) => {
            const isSelected = selected?.slotId === slot.id;
            const occupied = Boolean(building);
            const fill = occupied
              ? (building?.bodyColor ?? "#475569")
              : "rgba(100,116,139,0.1)";
            const stroke = isSelected ? "#fde047" : "#334155";
            return (
              <g
                key={slot.id}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setSelected(
                    occupied
                      ? { kind: "building", slotId: slot.id }
                      : { kind: "slot", slotId: slot.id },
                  )
                }
                role="button"
                aria-label={`Slot ${slot.id} — ${slot.category}`}
              >
                {/* slot frame */}
                <rect
                  x={slot.x}
                  y={slot.y}
                  width={slot.w}
                  height={slot.h}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 4 : 2}
                  strokeDasharray={occupied ? undefined : "6,4"}
                  rx={3}
                />
                {/* roof band for occupied */}
                {occupied && building?.roofColor && (
                  <rect
                    x={slot.x}
                    y={slot.y}
                    width={slot.w}
                    height={14}
                    fill={building.roofColor}
                    stroke="#0a0a0f"
                    strokeWidth={2}
                  />
                )}
                {/* glyph / id label */}
                <text
                  x={slot.x + slot.w / 2}
                  y={slot.y + slot.h / 2 + 8}
                  textAnchor="middle"
                  fontSize={slot.w < 80 ? 18 : 28}
                  fill={occupied ? "#0a0a0f" : "#94a3b8"}
                  style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.4))" }}
                >
                  {occupied ? (building?.glyph ?? "🏗") : "+"}
                </text>
                {/* level badge */}
                {occupied && (
                  <g transform={`translate(${slot.x + slot.w - 22}, ${slot.y + 2})`}>
                    <rect width={20} height={14} fill="#0a0a0f" stroke="#fde047" strokeWidth={1.5} rx={2} />
                    <text x={10} y={11} textAnchor="middle" fontSize={8} fontWeight={900} fill="#fde047">
                      L{building?.level}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </section>

      {error && (
        <div className="card p-3 border-red-500 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Detail panel */}
      {selected && selectedSlotDef && (
        <section className="card p-4 flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase">
              {selectedSnap?.building
                ? (selectedSnap.building.labels?.[lang] ?? selectedSnap.building.catalogId)
                : `${dict.pickSlot} — #${selectedSlotDef.id}`}
            </h2>
            <span className="chip text-xs">
              {dict.category}: {categoryLabel(selectedSlotDef.category, lang)}
            </span>
          </header>

          {selectedSnap?.building ? (
            <BuildingDetail
              building={selectedSnap.building}
              dict={dict}
              lang={lang}
              onUpgrade={() => doUpgrade(selectedSnap.building!.id)}
              onDemolish={() => doDemolish(selectedSnap.building!.id)}
              busy={busy}
            />
          ) : (
            <CatalogList
              catalog={state.catalog}
              slot={selectedSlotDef}
              onPlace={(cid) => doPlace(selectedSlotDef.id, cid)}
              dict={dict}
              lang={lang}
              busy={busy}
            />
          )}
        </section>
      )}

      {/* Loans card */}
      <MortgageCard
        resources={state.resources}
        loans={state.loans}
        creditScore={state.creditScore}
        onChange={refresh}
        dict={dict}
        lang={lang}
      />
    </div>
  );
}

function BuildingDetail({
  building,
  dict,
  lang,
  onUpgrade,
  onDemolish,
  busy,
}: {
  building: NonNullable<WattCityBootstrap["slots"][number]["building"]>;
  dict: WattCityBootstrap["dict"];
  lang: Lang;
  onUpgrade: () => void;
  onDemolish: () => void;
  busy: boolean;
}) {
  const isDomek = building.catalogId === "domek";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <span className="chip">
          {dict.level}:&nbsp;<strong>L{building.level}</strong>
        </span>
        <span className="chip">
          {dict.yields}:&nbsp;
          <strong>{formatResourceDelta(building.currentYield, lang)}/h</strong>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {building.level < 10 && (
          <button
            className="btn btn-primary text-sm"
            onClick={onUpgrade}
            disabled={busy}
          >
            {dict.upgrade} (L{building.level + 1})
          </button>
        )}
        {!isDomek && (
          <button
            className="btn btn-ghost text-sm"
            onClick={onDemolish}
            disabled={busy}
          >
            {dict.demolish} (50%)
          </button>
        )}
      </div>
    </div>
  );
}

function CatalogList({
  catalog,
  slot,
  onPlace,
  dict,
  lang,
  busy,
}: {
  catalog: WattCityBootstrap["catalog"];
  slot: SlotDef;
  onPlace: (catalogId: string) => void;
  dict: WattCityBootstrap["dict"];
  lang: Lang;
  busy: boolean;
}) {
  // Filter to compatible entries (category match or decorative slot)
  const compatible = catalog.filter(
    (c) =>
      slot.category === "decorative" || c.entry.category === slot.category,
  );
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {compatible.map(({ entry, unlocked, affordable, reasonLocked }) => {
        const canBuild = entry.mvpActive && unlocked && affordable;
        return (
          <li
            key={entry.id}
            className={
              "border-2 border-[var(--ink)]/40 rounded p-3 flex flex-col gap-2 text-sm " +
              (canBuild ? "" : "opacity-60")
            }
          >
            <header className="flex items-center justify-between">
              <strong className="uppercase text-xs tracking-wider">
                {entry.labels[lang]}
              </strong>
              <span className="text-[10px] opacity-70">T{entry.tier}</span>
            </header>
            <p className="text-xs leading-snug">{entry.teasers[lang]}</p>
            <div className="flex flex-wrap gap-1 text-[11px] font-mono">
              <span className="chip">
                {dict.cost}: {formatResourceDelta(entry.baseCost, lang)}
              </span>
              {Object.keys(entry.baseYieldPerHour).length > 0 && (
                <span className="chip">
                  {dict.yields}: {formatResourceDelta(entry.baseYieldPerHour, lang)}/h
                </span>
              )}
            </div>
            {canBuild ? (
              <button
                className="btn btn-primary text-xs"
                onClick={() => onPlace(entry.id)}
                disabled={busy}
              >
                {dict.buildHere}
              </button>
            ) : (
              <span className="text-[11px] text-zinc-400">
                🔒 {reasonLocked === "coming-soon"
                  ? dict.lockedComing
                  : reasonLocked ?? dict.locked}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MortgageCard({
  resources,
  loans,
  creditScore,
  onChange,
  dict,
  lang,
}: {
  resources: Resources;
  loans: Loan[];
  creditScore: number;
  onChange: () => Promise<void>;
  dict: WattCityBootstrap["dict"];
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [principal, setPrincipal] = useState<number>(0);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [quote, setQuote] = useState<null | {
    apr: number;
    monthlyPayment: number;
    totalInterest: number;
    rrso: number;
    maxPrincipal: number;
    preferred: boolean;
    eligibility: { ok: boolean; missing: string[] };
  }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshQuote = useCallback(
    async (p: number, t: number) => {
      const r = await fetch(
        `/api/loans/quote?principal=${p}&termMonths=${t}`,
      );
      const j = await r.json();
      if (j.ok) setQuote(j.quote);
    },
    [],
  );

  const activeLoans = loans.filter((l) => l.status === "active");

  return (
    <section className="card p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase">{dict.mortgageTitle}</h2>
        <button
          className="btn btn-ghost text-xs"
          onClick={() => {
            setOpen((v) => !v);
            if (!open && principal === 0) {
              refreshQuote(500, 24);
              setPrincipal(500);
            }
          }}
        >
          {dict.mortgageOpen}
        </button>
      </header>
      <p className="text-sm text-zinc-400">{dict.mortgageBody}</p>

      {open && (
        <div className="flex flex-col gap-3 border-t-2 border-[var(--ink)]/30 pt-3">
          <label className="flex flex-col gap-1 text-xs">
            <span>{dict.principal} (W$)</span>
            <input
              type="range"
              min={0}
              max={quote?.maxPrincipal ?? 5000}
              step={100}
              value={principal}
              onChange={(e) => {
                const p = Number(e.target.value);
                setPrincipal(p);
                refreshQuote(p, termMonths);
              }}
            />
            <span className="font-mono">
              {principal.toLocaleString("pl-PL")} / max{" "}
              {(quote?.maxPrincipal ?? 0).toLocaleString("pl-PL")}
            </span>
          </label>
          <div className="flex gap-2">
            {[12, 24, 36].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTermMonths(t);
                  refreshQuote(principal, t);
                }}
                className={
                  "btn text-xs " +
                  (termMonths === t ? "btn-primary" : "btn-ghost")
                }
              >
                {t} {dict.termMonths}
              </button>
            ))}
          </div>
          {quote && (
            <ul className="text-xs font-mono flex flex-col gap-0.5 bg-black/20 p-2 rounded">
              <li>
                {dict.mortgageMonthly}:&nbsp;
                <strong>{quote.monthlyPayment.toFixed(2)} W$</strong>
              </li>
              <li>
                {dict.rrsoLabel}: <strong>{(quote.rrso * 100).toFixed(2)} %</strong>
                {quote.preferred ? " ⭐" : ""}
              </li>
              <li>
                {dict.mortgageTotalInterest}:&nbsp;
                <strong>{quote.totalInterest.toFixed(2)} W$</strong>
              </li>
              <li>
                {dict.mortgageMax}:&nbsp;
                <strong>{quote.maxPrincipal.toLocaleString("pl-PL")} W$</strong>
              </li>
              {!quote.eligibility.ok && (
                <li className="text-red-400">
                  🔒 {quote.eligibility.missing.join(", ")}
                </li>
              )}
            </ul>
          )}
          <button
            className="btn btn-primary text-sm"
            disabled={busy || !quote?.eligibility.ok}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const res = await fetch("/api/loans/take", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ principal, termMonths }),
                });
                const j = await res.json();
                if (!j.ok) {
                  setError(j.error);
                } else {
                  setOpen(false);
                  await onChange();
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            {dict.mortgageTake}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Active loan list */}
      <div className="mt-2">
        <h3 className="text-sm font-black uppercase mb-1">{dict.loansTitle}</h3>
        {activeLoans.length === 0 ? (
          <p className="text-xs text-zinc-500">{dict.noLoans}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs font-mono">
            {activeLoans.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between bg-black/20 p-2 rounded"
              >
                <span>
                  {l.id.slice(0, 8)} · {l.outstanding.toFixed(0)} W$ @{" "}
                  {(l.apr * 100).toFixed(0)}% · {l.monthsPaid}/{l.termMonths}
                </span>
                <span
                  className={
                    l.missedConsecutive > 0 ? "text-red-400" : "text-emerald-400"
                  }
                >
                  {l.missedConsecutive > 0
                    ? `❗${l.missedConsecutive}×`
                    : "OK"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
