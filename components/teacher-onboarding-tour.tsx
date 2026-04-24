"use client";

import { useState } from "react";

/* V4.1 — skippable teacher tour (4 steps). Fires once per teacher
 * account (sentinel `xp:teacher:<u>.tourSeenAt` set via PATCH on
 * completion — API TBD; client-side localStorage fallback). */

const STEPS = [
  {
    title: "Dashboard",
    body: "Tutaj zobaczysz wszystkie swoje klasy. Każda klasa ma kod, który wpisują dzieci.",
  },
  {
    title: "Tydzień",
    body: "Wybierz temat tygodnia z podstawy programowej. Dzieci zobaczą go w swoim dashboardzie.",
  },
  {
    title: "Postęp klasy",
    body: "Leaderboard + roster pokazuje, kto gra, kto rośnie, kto potrzebuje pomocy.",
  },
  {
    title: "Raport PDF",
    body: "Jedno kliknięcie = PDF dla dyrekcji i rodziców. Zrzut postępu + podstawa programowa.",
  },
];

const LS_KEY = "v4.teacher.tour.seen";

export function TeacherOnboardingTour({
  tourSeenAt,
}: {
  tourSeenAt: number | null;
}) {
  const [hidden, setHidden] = useState(() => {
    if (tourSeenAt) return true;
    if (typeof window !== "undefined") return !!localStorage.getItem(LS_KEY);
    return false;
  });
  const [step, setStep] = useState(0);

  if (hidden) return null;

  function finish() {
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, "1");
    // Fire-and-forget — server-side persistence can land later.
    fetch("/api/nauczyciel/tour-done", { method: "POST" }).catch(() => {});
    setHidden(true);
  }

  const s = STEPS[step];
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
    >
      <div className="card max-w-md w-full p-6 flex flex-col gap-4 border-[var(--accent)]">
        <div className="flex items-baseline justify-between">
          <h2 className="section-heading text-lg">{s.title}</h2>
          <span className="text-xs opacity-60">
            Krok {step + 1}/{STEPS.length}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{s.body}</p>
        <div className="flex justify-between items-center mt-2">
          <button
            type="button"
            className="text-xs underline opacity-70"
            onClick={finish}
          >
            Pomiń
          </button>
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() =>
              step === STEPS.length - 1 ? finish() : setStep(step + 1)
            }
          >
            {step === STEPS.length - 1 ? "Rozumiem — zaczynajmy" : "Dalej"}
          </button>
        </div>
      </div>
    </div>
  );
}
