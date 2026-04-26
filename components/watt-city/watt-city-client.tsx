"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import {
  type Resources,
} from "@/lib/resources";
import {
  SLOT_MAP,
  type SlotCategory,
  type BuildingCatalogEntry,
  type SlotDef,
} from "@/lib/building-catalog";
import type { Loan } from "@/lib/player";
import { KnfDisclaimer } from "@/components/knf-disclaimer";
import {
  formatResourceBundle,
  formatResourceCost,
  formatResourceDelta,
  formatResourceMissing,
} from "@/lib/resource-format";

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
    /** Shortfall when !affordable — renders "Brakuje: 48 🧱, 30 🪙"
     *  beside the Buy CTA. `{}` when affordable. */
    missing: Partial<Resources>;
  }>;
  slots: Array<{
    slot: SlotDef;
    /** Pre-computed L+1 preview (cost/yield/affordability/missing) for the
     *  occupied building, null when slot is empty or building is L10. */
    upgrade: {
      nextLevelCost: Partial<Resources> | null;
      nextLevelYield: Partial<Resources> | null;
      nextLevelAffordable: boolean;
      missing: Partial<Resources>;
    } | null;
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
    nextLevelLabel: string;
    insufficientResources: string;
    demolishConfirm: string;
    atMaxLevel: string;
    errorUnknown: string;
    errorRateLimited: string;
    errorScoreInProgress: string;
    successUpgrade: string;
    successPlace: string;
    successDemolish: string;
  };
};

/* Auto-clear delay for the success-toast banner. Long enough that a
 * scanning user notices it, short enough to not stack with the next
 * upgrade attempt. */
const SUCCESS_AUTO_CLEAR_MS = 2500;

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
  const searchParams = useSearchParams();
  const [state, setState] = useState(bootstrap);
  // V2 fix: HUD rescue CTA links `/miasto?build=mala-elektrownia`. Resolve the
  // param once during initial state to pre-select a compatible free slot — doing
  // this in the useState initializer avoids a mount-time effect.
  const [selected, setSelected] = useState<SelectedState>(() => {
    const wanted = searchParams?.get("build");
    if (!wanted) return null;
    const catalogEntry = bootstrap.catalog.find((c) => c.entry.id === wanted);
    if (!catalogEntry) return null;
    const targetCategory = catalogEntry.entry.category;
    const freeSlot = bootstrap.slots.find(
      (s) =>
        !s.building &&
        (s.slot.category === targetCategory || s.slot.category === "decorative"),
    );
    return freeSlot ? { kind: "slot", slotId: freeSlot.slot.id } : null;
  });
  const [busy, setBusy] = useState(false);
  /** Structured error info so the banner can render a localized message
   *  with an actionable `missing` breakdown on affordability failures.
   *  Raw string codes (e.g. "rate-limited") map to `dict.errorX` keys;
   *  unknown codes fall through to `dict.errorUnknown`. */
  const [error, setError] = useState<
    | { code: string; missing?: Partial<Resources>; detail?: string }
    | null
  >(null);
  // R-13 — success toast for place / upgrade / demolish. The page used
  // to silently update on success — user clicked "Ulepsz", state
  // refreshed, and nothing told them the action landed. The auto-
  // clear timeout keeps the toast off the next render so the
  // surface doesn't feel sticky.
  const [success, setSuccess] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashSuccess = useCallback((message: string) => {
    setSuccess(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(
      () => setSuccess(null),
      SUCCESS_AUTO_CLEAR_MS,
    );
  }, []);
  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );
  const { dict, lang } = state;

  /** Translate a server error code + optional missing breakdown into a
   *  display string. Centralised so every mutation handler shares the
   *  same rendering rules — if a new error code is introduced, we
   *  add one branch here instead of touching every call site. */
  const renderError = useCallback(
    (info: { code: string; missing?: Partial<Resources>; detail?: string }): string => {
      if (info.code === "not-affordable" && info.missing) {
        const missingText = formatResourceMissing(info.missing, lang);
        if (missingText) {
          return dict.insufficientResources.replace("{missing}", missingText);
        }
      }
      if (info.code === "rate-limited") return dict.errorRateLimited;
      if (info.code === "score-in-progress") return dict.errorScoreInProgress;
      return dict.errorUnknown.replace("{code}", info.code);
    },
    [dict, lang],
  );

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

  // V3.4 — retry once after 500ms when server returns 409 "score-in-progress"
  // so a concurrent /api/score POST that briefly held the building lock
  // doesn't force the user to click the mutation button twice.
  const postWithRetry = useCallback(
    async (path: string, body: unknown): Promise<Response> => {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status !== 409) return res;
      const j = await res.clone().json().catch(() => null);
      if (!j || j.error !== "score-in-progress") return res;
      await new Promise((r) => setTimeout(r, 500));
      return fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [],
  );

  const doPlace = useCallback(
    async (slotId: number, catalogId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await postWithRetry("/api/buildings/place", {
          slotId,
          catalogId,
        });
        const j = await res.json();
        if (!j.ok) {
          setError({ code: j.error, missing: j.missing, detail: j.detail });
        } else {
          setSelected({ kind: "building", slotId });
          flashSuccess(dict.successPlace);
          await refresh();
        }
      } finally {
        setBusy(false);
      }
    },
    [refresh, postWithRetry, flashSuccess, dict.successPlace],
  );

  const doUpgrade = useCallback(
    async (instanceId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await postWithRetry("/api/buildings/upgrade", {
          instanceId,
        });
        const j = await res.json();
        if (!j.ok) setError({ code: j.error, missing: j.missing });
        else flashSuccess(dict.successUpgrade);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh, postWithRetry, flashSuccess, dict.successUpgrade],
  );

  const doDemolish = useCallback(
    async (instanceId: string) => {
      // i18n: the confirm copy is sourced from the per-locale dict so UK/CS/EN
      // sessions don't see Polish. Previously hardcoded in this function.
      if (!confirm(dict.demolishConfirm)) return;
      setBusy(true);
      setError(null);
      try {
        const res = await postWithRetry("/api/buildings/demolish", {
          instanceId,
        });
        const j = await res.json();
        if (!j.ok) setError({ code: j.error, missing: j.missing });
        else flashSuccess(dict.successDemolish);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh, postWithRetry, dict.demolishConfirm],
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
        <p className="text-[11px] text-[var(--ink-muted)] max-w-md">
          {dict.disclaimer}
        </p>
      </header>

      {/* Slot map */}
      <section className="card p-2 sm:p-4 city-scene-viewport">
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
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                )}
                {/* glyph / id label */}
                <text
                  x={slot.x + slot.w / 2}
                  y={slot.y + slot.h / 2 + 8}
                  textAnchor="middle"
                  fontSize={slot.w < 80 ? 18 : 28}
                  fill={occupied ? "var(--ink)" : "#94a3b8"}
                  style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.4))" }}
                >
                  {occupied ? (building?.glyph ?? "🏗") : "+"}
                </text>
                {/* level badge */}
                {occupied && (
                  <g transform={`translate(${slot.x + slot.w - 22}, ${slot.y + 2})`}>
                    <rect width={20} height={14} fill="var(--ink)" stroke="#fde047" strokeWidth={1.5} rx={2} />
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
          {renderError(error)}
        </div>
      )}

      {/* R-13 — success toast (place / upgrade / demolish). Auto-clears
          via `flashSuccess` after SUCCESS_AUTO_CLEAR_MS. role=status
          gets it announced to screen readers without being interruptive
          like role=alert. The card uses surface-2 + green left rule
          (1 px navy-success accent — keeps brand max-1px border rule). */}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="card p-3 text-sm text-[var(--foreground)] border-l border-l-[var(--success)] motion-safe:animate-slide-up"
        >
          {success}
        </div>
      )}

      {/* Detail panel */}
      {selected && selectedSlotDef && (
        <section className="card p-4 flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
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
              upgrade={selectedSnap.upgrade}
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
  upgrade,
  dict,
  lang,
  onUpgrade,
  onDemolish,
  busy,
}: {
  building: NonNullable<WattCityBootstrap["slots"][number]["building"]>;
  /** Server-computed L+1 preview. `null` for L10 (max-level) or missing
   *  catalog. Drives both the cost/yield chips and the affordability
   *  disable state on the upgrade button. */
  upgrade: WattCityBootstrap["slots"][number]["upgrade"];
  dict: WattCityBootstrap["dict"];
  lang: Lang;
  onUpgrade: () => void;
  onDemolish: () => void;
  busy: boolean;
}) {
  const isDomek = building.catalogId === "domek";
  // R-12 — defensive null/undefined check. The /api/buildings GET
  // response previously dropped the `upgrade` field, so after a
  // successful upgrade the refreshed slot had `upgrade === undefined`,
  // and `upgrade !== null` evaluated true → reading
  // `.nextLevelAffordable` on undefined threw. The route now passes
  // `upgrade` through, but the client guard collapses both `null` and
  // `undefined` so a future regression cannot crash the page again.
  const hasUpgrade = upgrade != null;
  const atMax = building.level >= 10 || !hasUpgrade;
  const canUpgrade =
    hasUpgrade && upgrade.nextLevelAffordable && !busy;
  const missingText =
    hasUpgrade && !upgrade.nextLevelAffordable && upgrade.missing
      ? formatResourceMissing(upgrade.missing, lang)
      : "";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="chip">
          {dict.level}:&nbsp;<strong>L{building.level}</strong>
        </span>
        <span className="chip">
          {dict.yields}:&nbsp;
          <strong>{formatResourceDelta(building.currentYield, lang)}/h</strong>
          {upgrade?.nextLevelYield && (
            <>
              &nbsp;→&nbsp;
              <strong>{formatResourceBundle(upgrade.nextLevelYield, lang, { signed: true })}/h</strong>
            </>
          )}
        </span>
        {upgrade?.nextLevelCost && (
          <span className="chip">
            {dict.nextLevelLabel}&nbsp;{dict.cost}:&nbsp;
            <strong>{formatResourceCost(upgrade.nextLevelCost, lang)}</strong>
          </span>
        )}
      </div>
      {/* Actionable shortfall — renders only when the player is short on
          the upgrade. Hidden otherwise to keep the common path quiet. */}
      {missingText && (
        <p className="text-xs text-[var(--sales)]">
          {dict.insufficientResources.replace("{missing}", missingText)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!atMax ? (
          <button
            className="btn btn-primary text-sm"
            onClick={onUpgrade}
            disabled={!canUpgrade}
            title={
              upgrade && !upgrade.nextLevelAffordable
                ? dict.insufficientResources.replace("{missing}", missingText)
                : undefined
            }
          >
            {dict.upgrade} (L{building.level + 1})
          </button>
        ) : (
          <span className="text-xs text-[var(--ink-muted)]">🏁 {dict.atMaxLevel}</span>
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
      {compatible.map(({ entry, unlocked, affordable, reasonLocked, missing }) => {
        const canBuild = entry.mvpActive && unlocked && affordable;
        const missingText =
          entry.mvpActive && unlocked && !affordable
            ? formatResourceMissing(missing, lang)
            : "";
        return (
          <li
            key={entry.id}
            className={
              "border border-[var(--line)] rounded p-3 flex flex-col gap-2 text-sm " +
              (canBuild ? "" : "opacity-60")
            }
          >
            <header className="flex items-center justify-between">
              <strong className="text-xs">
                {entry.labels[lang]}
              </strong>
              <span className="text-[10px] opacity-70">T{entry.tier}</span>
            </header>
            <p className="text-xs leading-snug">{entry.teasers[lang]}</p>
            <div className="flex flex-wrap gap-1 text-[11px] font-mono">
              <span className="chip">
                {dict.cost}: {formatResourceCost(entry.baseCost, lang)}
              </span>
              {Object.keys(entry.baseYieldPerHour).length > 0 && (
                <span className="chip">
                  {dict.yields}: {formatResourceCost(entry.baseYieldPerHour, lang)}/h
                </span>
              )}
            </div>
            {/* Actionable shortfall — renders only when the player is
                unlocked but short on resources. Tier-locked or coming-soon
                entries fall through to the <span> below. */}
            {missingText && (
              <p className="text-[11px] text-[var(--sales)] leading-snug">
                {dict.insufficientResources.replace("{missing}", missingText)}
              </p>
            )}
            {canBuild ? (
              <button
                className="btn btn-primary text-xs"
                onClick={() => onPlace(entry.id)}
                disabled={busy}
              >
                {dict.buildHere}
              </button>
            ) : (
              <span className="text-[11px] text-[var(--ink-muted)]">
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

/* R-06 (PR-J pass-7) — MortgageCard reliability hardening. */

// Unified config matches LoanComparison (lib/loan-comparison.tsx).
// Defaults moved out of the component so the slider boundaries and
// the comparison page never drift.
const MORTGAGE_PRINCIPAL_MIN = 500;
const MORTGAGE_PRINCIPAL_MAX = 10_000;
const MORTGAGE_PRINCIPAL_STEP = 500;

const MORTGAGE_ERROR_COPY: Record<
  Lang,
  Record<string, string>
> = {
  pl: {
    "principal-too-low": "Minimum to 100 W$.",
    "principal-exceeds-cap": "Kwota przekracza limit dla twojego cashflow.",
    "rate-limited": "Zbyt szybko. Poczekaj chwilę.",
    unauthorized: "Najpierw się zaloguj.",
    "ineligible": "Brakuje warunków: {missing}.",
    generic: "Coś poszło nie tak. Spróbuj ponownie.",
  },
  uk: {
    "principal-too-low": "Мінімум 100 W$.",
    "principal-exceeds-cap": "Сума перевищує ліміт.",
    "rate-limited": "Занадто швидко. Зачекай.",
    unauthorized: "Спочатку увійди.",
    "ineligible": "Не вистачає умов: {missing}.",
    generic: "Щось пішло не так. Спробуй знову.",
  },
  cs: {
    "principal-too-low": "Minimum je 100 W$.",
    "principal-exceeds-cap": "Částka překračuje limit.",
    "rate-limited": "Příliš rychle. Počkej.",
    unauthorized: "Nejdřív se přihlas.",
    "ineligible": "Chybí podmínky: {missing}.",
    generic: "Něco se pokazilo. Zkus znovu.",
  },
  en: {
    "principal-too-low": "Minimum is 100 W$.",
    "principal-exceeds-cap": "Amount exceeds your cashflow cap.",
    "rate-limited": "Too fast. Wait a moment.",
    unauthorized: "Please log in first.",
    "ineligible": "Missing conditions: {missing}.",
    generic: "Something went wrong. Try again.",
  },
};

function translateError(
  lang: Lang,
  raw: string | null | undefined,
  missing?: string[],
): string {
  if (!raw) return MORTGAGE_ERROR_COPY[lang].generic;
  const map = MORTGAGE_ERROR_COPY[lang];
  const t = map[raw];
  if (!t) return raw; // server returned an unknown code — surface the raw text
  if (raw === "ineligible" && missing && missing.length > 0) {
    return t.replace("{missing}", missing.join(", "));
  }
  return t;
}

function MortgageCard({
  resources: _resources,
  loans,
  creditScore: _creditScore,
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
  const [principal, setPrincipal] = useState<number>(MORTGAGE_PRINCIPAL_MIN);
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
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // R-06 — debounce + AbortController so a fast slider drag fires one
  // request, not one per pixel. Identical pattern to LoanComparison.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightAbort = useRef<AbortController | null>(null);

  const refreshQuote = useCallback(
    (p: number, t: number) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        if (inflightAbort.current) inflightAbort.current.abort();
        const ac = new AbortController();
        inflightAbort.current = ac;
        setQuoteLoading(true);
        try {
          const r = await fetch(
            `/api/loans/quote?principal=${p}&termMonths=${t}`,
            { signal: ac.signal },
          );
          const j = await r.json();
          if (j.ok) setQuote(j.quote);
        } catch (e) {
          // AbortError = newer call superseded us — ignore.
          if ((e as Error).name !== "AbortError") {
            // soft-fail: keep last quote, surface generic error
            setError(translateError(lang, "generic"));
          }
        } finally {
          setQuoteLoading(false);
        }
      }, 200);
    },
    [lang],
  );

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (inflightAbort.current) inflightAbort.current.abort();
    },
    [],
  );

  const activeLoans = loans.filter((l) => l.status === "active");
  const maxPrincipal = quote?.maxPrincipal ?? MORTGAGE_PRINCIPAL_MAX;
  // R-06 — when the player has no cashflow yet (`maxPrincipal < 100`),
  // the slider is meaningless. Show a focused EmptyState pointing at
  // building an income source instead of a broken zero-min slider.
  const noCapacity = quote !== null && quote.maxPrincipal < 100;

  return (
    <section className="card p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{dict.mortgageTitle}</h2>
        <button
          className="btn btn-ghost text-xs"
          onClick={() => {
            setOpen((v) => !v);
            if (!open && principal === MORTGAGE_PRINCIPAL_MIN) {
              refreshQuote(MORTGAGE_PRINCIPAL_MIN, 24);
            }
          }}
        >
          {dict.mortgageOpen}
        </button>
      </header>
      <p className="text-sm text-[var(--ink-muted)]">{dict.mortgageBody}</p>

      {open && noCapacity && (
        <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-3 text-sm">
          <p className="text-[var(--accent)] font-semibold">
            {{
              pl: "Najpierw zbuduj budynek z cashflow",
              uk: "Спершу постав будівлю з cashflow",
              cs: "Nejprve postav budovu s cashflow",
              en: "First build a building with cashflow",
            }[lang]}
          </p>
          <p className="text-[var(--ink-muted)] text-xs">
            {{
              pl: "Bank potrzebuje regularnego dochodu, by udzielić kredytu. Postaw Sklepik lub Małą elektrownię.",
              uk: "Банк потребує регулярного доходу. Постав магазинчик або електростанцію.",
              cs: "Banka potřebuje pravidelný příjem. Postav Obchůdek nebo malou elektrárnu.",
              en: "The bank needs regular income to offer credit. Build a shop or small power plant first.",
            }[lang]}
          </p>
        </div>
      )}

      {open && !noCapacity && (
        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-3">
          <label className="flex flex-col gap-1 text-xs">
            <span>{dict.principal} (W$)</span>
            <input
              type="range"
              min={MORTGAGE_PRINCIPAL_MIN}
              max={Math.max(MORTGAGE_PRINCIPAL_MIN, maxPrincipal)}
              step={MORTGAGE_PRINCIPAL_STEP}
              value={Math.min(
                Math.max(principal, MORTGAGE_PRINCIPAL_MIN),
                maxPrincipal,
              )}
              onChange={(e) => {
                const p = Number(e.target.value);
                setPrincipal(p);
                refreshQuote(p, termMonths);
              }}
              aria-label={`${dict.principal} (W$)`}
              aria-valuetext={`${principal.toLocaleString("pl-PL")} W$`}
              className="w-full mortgage-range accent-[var(--accent)]"
            />
            <span className="font-mono tabular-nums">
              {principal.toLocaleString("pl-PL")} / max{" "}
              {maxPrincipal.toLocaleString("pl-PL")}
              {quoteLoading && (
                <span className="ml-2 text-[var(--ink-muted)]">
                  {{
                    pl: "Liczę…",
                    uk: "Рахую…",
                    cs: "Počítám…",
                    en: "Calculating…",
                  }[lang]}
                </span>
              )}
            </span>
          </label>
          <div className="flex gap-2" role="radiogroup" aria-label={dict.termMonths}>
            {[12, 24, 36].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTermMonths(t);
                  refreshQuote(principal, t);
                }}
                role="radio"
                aria-checked={termMonths === t}
                className={
                  "btn text-xs " +
                  (termMonths === t ? "btn-primary" : "btn-secondary")
                }
              >
                {t} {dict.termMonths}
              </button>
            ))}
          </div>
          {quote && (
            <ul className="text-xs font-mono flex flex-col gap-0.5 bg-[var(--surface-2)] border border-[var(--line)] p-3 rounded-md">
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
                <li className="text-[var(--danger)]">
                  🔒 {translateError(lang, "ineligible", quote.eligibility.missing)}
                </li>
              )}
            </ul>
          )}
          {/* R7.2 KNF disclaimer — required on every loan-taking surface */}
          <KnfDisclaimer lang={lang} variant="inline" />

          {/* R-03 — discoverability bridge to the dedicated comparison
              page. Carries the user's current quote params so the
              landing /loans/compare opens with matching sliders set,
              not the default 3000/12 fallback. */}
          <a
            href={`/loans/compare?principal=${principal}&term=${termMonths}`}
            className="btn btn-secondary text-xs self-start"
          >
            {{
              pl: "Porównaj wszystkie kredyty →",
              uk: "Порівняти всі кредити →",
              cs: "Porovnat všechny úvěry →",
              en: "Compare all loans →",
            }[lang]}
          </a>

          <button
            className="btn btn-primary text-sm"
            disabled={busy || !quote?.eligibility.ok || quoteLoading}
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
                  setError(translateError(lang, j.error, j.missing));
                } else {
                  setOpen(false);
                  await onChange();
                }
              } catch {
                setError(translateError(lang, "generic"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy
              ? {
                  pl: "Zaciągam…",
                  uk: "Беру…",
                  cs: "Beru…",
                  en: "Taking…",
                }[lang]
              : dict.mortgageTake}
          </button>
          {error && (
            <p
              role="alert"
              className="text-xs text-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_8%,var(--surface))] border border-[var(--danger)] rounded-md px-3 py-2"
            >
              {error}
            </p>
          )}
        </div>
      )}

      {/* Active loan list */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold mb-1">{dict.loansTitle}</h3>
        {activeLoans.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">{dict.noLoans}</p>
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
                    l.missedConsecutive > 0 ? "text-red-400" : "text-[var(--success)]"
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
