"use client";

import { useMemo, useState, useTransition } from "react";
import type { CurriculumCode, CurriculumArea } from "@/lib/curriculum";

/* D3 — weekly-theme picker. Client component — lets the teacher pick
 * a theme from the curriculum catalog grouped by area. POSTs to
 * /api/klasa/[id]/weekly-theme. The previous dashboard surfaced the
 * current weekly theme as read-only text; no UI existed to set it.
 *
 * Backend: app/api/klasa/[id]/weekly-theme/route.ts already accepts
 * `{ theme: string | null }`. We map picker selection → theme string
 * using the theme tag from CurriculumCode.themes[0] plus the code, so
 * coverage attribution works out of the box:
 *   picked "wos.7.3.2" → POST { theme: "budget-50-30-20" }
 *
 * Reduced motion: the only animation is opacity fade on save — respects
 * prefers-reduced-motion via the `motion-safe:` variant.
 */

type Props = {
  classId: string;
  currentTheme: string | null;
  grade: 5 | 6 | 7 | 8;
  codes: CurriculumCode[];
};

export function WeeklyThemePicker({
  classId,
  currentTheme,
  grade,
  codes,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");
  const [isPending, startTransition] = useTransition();

  const byArea = useMemo(() => {
    const out: Partial<Record<CurriculumArea, CurriculumCode[]>> = {};
    for (const c of codes) {
      if (c.grade !== grade) continue;
      (out[c.area] ??= []).push(c);
    }
    return out;
  }, [codes, grade]);

  const selectedCurriculum = codes.find((c) => c.code === selectedCode);
  const themeTag = selectedCurriculum?.themes[0] ?? "";

  const save = () => {
    if (!themeTag) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/klasa/${classId}/weekly-theme`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: themeTag }),
        });
        setSaved(res.ok ? "ok" : "err");
        if (res.ok) {
          // full refresh so the dashboard header + coverage chart
          // re-read from Redis.
          window.location.reload();
        }
      } catch {
        setSaved("err");
      }
    });
  };

  const clear = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/klasa/${classId}/weekly-theme`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: null }),
        });
        setSaved(res.ok ? "ok" : "err");
        if (res.ok) window.location.reload();
      } catch {
        setSaved("err");
      }
    });
  };

  return (
    <section className="card p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold text-[var(--accent)]">
          🧩 Ustaw temat tygodnia
        </h3>
        {currentTheme && (
          <span className="text-[10px] opacity-70">
            obecnie: <code className="font-mono">{currentTheme}</code>
          </span>
        )}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Wybierz kod podstawy programowej:</span>
        <select
          value={selectedCode}
          onChange={(e) => {
            setSelectedCode(e.target.value);
            setSaved("idle");
          }}
          className="bg-[var(--surface-2)] border border-[var(--ink)] rounded p-2 text-sm font-mono"
        >
          <option value="">— wybierz —</option>
          {(Object.keys(byArea) as CurriculumArea[]).map((area) => (
            <optgroup key={area} label={area}>
              {byArea[area]?.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.description.slice(0, 60)}
                  {c.description.length > 60 ? "…" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {selectedCurriculum && (
        <div className="text-xs opacity-80 leading-relaxed border-l border-[var(--accent)] pl-3">
          <p>
            <strong>{selectedCurriculum.code}</strong> · {selectedCurriculum.subarea} · klasa{" "}
            {selectedCurriculum.grade}
          </p>
          <p className="mt-1">{selectedCurriculum.description}</p>
          <p className="mt-1 opacity-70">
            Tematy: <code className="font-mono">{selectedCurriculum.themes.join(", ")}</code>
          </p>
          <p className="opacity-70">
            Gry: <code className="font-mono">{selectedCurriculum.games.join(", ")}</code>
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={save}
          disabled={!themeTag || isPending}
          className="btn btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Zapisuję…" : `Ustaw temat: ${themeTag || "—"}`}
        </button>
        {currentTheme && (
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className="btn btn-ghost text-xs"
          >
            Wyczyść temat
          </button>
        )}
        {saved === "ok" && (
          <span className="text-xs text-[var(--success)] motion-safe:animate-pulse">
            ✅ Zapisano
          </span>
        )}
        {saved === "err" && (
          <span className="text-xs text-[var(--danger)]">
            ❌ Błąd zapisu — spróbuj ponownie
          </span>
        )}
      </div>
    </section>
  );
}
