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
import type { LoanComparisonRow } from "@/lib/loans";
import { KnfDisclaimer } from "@/components/knf-disclaimer";
import { LoanComparison } from "@/components/loan-comparison";
import {
  HeroBackdrop,
  HeroBackdropDefs,
  computeLampLitMask,
} from "@/components/hero-backdrop";
import { BuildingTile, EmptyBuildingTile } from "@/components/building-tile";
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
  /** F-01 — server-computed loan comparison rows feed the inline
   *  LoanComparison embedded in the Hypotéka panel (replaces the
   *  deprecated /loans/compare standalone route). */
  loanComparison: {
    rows: LoanComparisonRow[];
    principal: number;
    termMonths: number;
  };
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
          {/* PR-N — sunset backdrop shared with the homepage hero so
              players don't see two different "city scenes" for the
              same data. The interactive slot layer sits on top. */}
          <defs>
            <HeroBackdropDefs />
          </defs>
          <HeroBackdrop
            lampLitMask={computeLampLitMask(
              state.slots
                .filter((s) => Boolean(s.building))
                .map((s) => ({ slotId: s.slot.id })),
            )}
            vbH={VB_H}
          />

          {/* F-05 — slot rendering delegated to shared BuildingTile /
              EmptyBuildingTile so /miasto matches the homepage hero
              (same pitched roofs + level-scaled heights + L-pill).
              Click handler + selected ring stay /miasto-only via
              optional props. */}
          {state.slots.map(({ slot, building }) => {
            const isSelected = selected?.slotId === slot.id;
            const handleClick = () =>
              setSelected(
                building
                  ? { kind: "building", slotId: slot.id }
                  : { kind: "slot", slotId: slot.id },
              );
            const ariaLabel = `Slot ${slot.id} — ${slot.category}`;
            if (!building) {
              return (
                <EmptyBuildingTile
                  key={slot.id}
                  slot={slot}
                  buildLabel={dict.buildHere}
                  onClick={handleClick}
                  isSelected={isSelected}
                  ariaLabel={ariaLabel}
                />
              );
            }
            return (
              <BuildingTile
                key={slot.id}
                slot={slot}
                level={building.level}
                glyph={building.glyph ?? "🏗"}
                body={building.bodyColor ?? "#475569"}
                roof={building.roofColor ?? "#1e293b"}
                onClick={handleClick}
                isSelected={isSelected}
                ariaLabel={ariaLabel}
              />
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

      {/* F-01 — Hypotéka panel hosts the inline LoanComparison.
          The `id="hypoteka"` anchor is the redirect target from the
          deprecated /loans/compare route. */}
      <MortgageCard
        resources={state.resources}
        loans={state.loans}
        creditScore={state.creditScore}
        onChange={refresh}
        dict={dict}
        lang={lang}
        loanComparison={bootstrap.loanComparison}
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

// F-01 — MORTGAGE_PRINCIPAL_* constants + translateError helper +
// MORTGAGE_ERROR_COPY removed alongside the inline mortgage-only flow.
// LoanComparison owns slider bounds + error rendering now.

function MortgageCard({
  resources: _resources,
  loans,
  creditScore: _creditScore,
  onChange,
  dict,
  lang,
  loanComparison,
}: {
  resources: Resources;
  loans: Loan[];
  creditScore: number;
  onChange: () => Promise<void>;
  dict: WattCityBootstrap["dict"];
  lang: Lang;
  loanComparison: WattCityBootstrap["loanComparison"];
}) {
  const [open, setOpen] = useState(false);
  const activeLoans = loans.filter((l) => l.status === "active");

  return (
    <section
      id="hypoteka"
      className="card p-4 flex flex-col gap-3 scroll-mt-24"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{dict.mortgageTitle}</h2>
        <button
          className="btn btn-ghost text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          {dict.mortgageOpen}
        </button>
      </header>
      <p className="text-sm text-[var(--ink-muted)]">{dict.mortgageBody}</p>

      {/* F-01 — open state mounts the full LoanComparison inline.
          Mortgage is just one row in the 4-product table now; the
          standalone /loans/compare page redirects here so the
          Hypotéka panel is the single source of truth for credit. */}
      {open && (
        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-3">
          <KnfDisclaimer lang={lang} variant="inline" />
          <LoanComparison
            rows={loanComparison.rows}
            lang={lang}
            principal={loanComparison.principal}
            termMonths={loanComparison.termMonths}
            variant="inline"
            onLoanTaken={async () => {
              setOpen(false);
              await onChange();
            }}
          />
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
