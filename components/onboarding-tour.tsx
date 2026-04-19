"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";

type Props = { lang: Lang };

type Step = { title: string; body: string; emoji: string; cta?: string; href?: string };

/* D5 — 4-step kid tour: welcome → resources → buildings → loans.
 * Previous final step was "first game" which duplicated the landing's
 * own CTA; loans is the distinctive mechanic (no-real-risk credit
 * simulator) and the one a PKO demo audience wants to see first. */
function stepsFor(lang: Lang): Step[] {
  const set: Record<Lang, Step[]> = {
    pl: [
      {
        title: "Witaj w Watt City",
        body: "Graj w minigry → zarabiaj surowce → buduj miasto → poznaj kredyt bez ryzyka.",
        emoji: "👋",
      },
      {
        title: "Twój portfel",
        body: "Waty ⚡, monety 🪙, cegły 🧱. Reszta (🪟 🔩 💾 💵) odblokuje się podczas gry.",
        emoji: "🪙",
      },
      {
        title: "Twoje miasto",
        body: "Zaczynasz z 1 Domkiem. Każdy slot ma kategorię — buduj to, co pasuje.",
        emoji: "🏠",
        cta: "Zobacz miasto",
        href: "/miasto",
      },
      {
        title: "Kredyt bez ryzyka",
        body: "Wirtualny kredyt hipoteczny w PKO. Sprawdź RRSO, harmonogram spłat i symulator — wszystko na wirtualnych Watach. Żadnych prawdziwych pieniędzy.",
        emoji: "🏦",
        cta: "Otwórz porównywarkę",
        href: "/loans/compare",
      },
    ],
    uk: [
      { title: "Вітаємо у Watt City", body: "Грай → заробляй → будуй → вчися кредиту без ризику.", emoji: "👋" },
      { title: "Гаманець", body: "Ват ⚡, монети 🪙, цегла 🧱. Решта — розблокуєш далі.", emoji: "🪙" },
      { title: "Твоє місто", body: "Починаєш із Будиночка. Кожен слот має категорію.", emoji: "🏠", cta: "До міста", href: "/miasto" },
      { title: "Безризиковий кредит", body: "Віртуальна іпотека PKO. Перевір RRSO, графік платежів і симулятор — усе на віртуальних Ватах.", emoji: "🏦", cta: "Порівняння кредитів", href: "/loans/compare" },
    ],
    cs: [
      { title: "Vítej ve Watt City", body: "Hraj → vyděláš → stavíš → učíš se úvěrům bez rizika.", emoji: "👋" },
      { title: "Peněženka", body: "Watty ⚡, mince 🪙, cihly 🧱. Zbytek odemkneš postupně.", emoji: "🪙" },
      { title: "Tvé město", body: "Začínáš s Domkem. Každý slot má kategorii.", emoji: "🏠", cta: "Do města", href: "/miasto" },
      { title: "Úvěr bez rizika", body: "Virtuální hypotéka PKO. Zkontroluj RRSO, splátkový plán a simulátor — vše na virtuálních Wattech.", emoji: "🏦", cta: "Porovnat úvěry", href: "/loans/compare" },
    ],
    en: [
      { title: "Welcome to Watt City", body: "Play → earn → build → learn about loans with no real risk.", emoji: "👋" },
      { title: "Your wallet", body: "Watts ⚡, coins 🪙, bricks 🧱. More unlock as you play.", emoji: "🪙" },
      { title: "Your city", body: "You start with a Domek. Each slot has a category.", emoji: "🏠", cta: "Open city", href: "/miasto" },
      { title: "No-risk credit", body: "A virtual PKO mortgage. Inspect APR, the repayment schedule and simulator — all on virtual Watts. No real money.", emoji: "🏦", cta: "Compare loans", href: "/loans/compare" },
    ],
  };
  return set[lang];
}

// Renders on first login until the user dismisses. The `tourSeen` flag is
// persisted server-side via PATCH /api/me/profile so the modal doesn't pop
// on every page load after the player's first visit.
export function OnboardingTour({ lang }: Props) {
  const [needsTour, setNeedsTour] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const steps = stepsFor(lang);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setNeedsTour(!j.onboarding?.tourSeen);
        }
      })
      .catch(() => {
        setNeedsTour(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function dismiss() {
    setNeedsTour(false);
    await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding: { tourSeen: true } }),
    });
  }

  if (!needsTour) return null;
  const step = steps[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 motion-safe:animate-[fade-in_200ms_ease-out]"
    >
      <div className="card p-6 w-[min(92vw,28rem)] flex flex-col gap-4 shadow-[6px_6px_0_0_var(--ink)] motion-safe:animate-[pop-in_220ms_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {index + 1}/{steps.length}
          </span>
          <button onClick={dismiss} className="underline">
            {{ pl: "Pomiń", uk: "Пропустити", cs: "Přeskočit", en: "Skip" }[lang]}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-5xl" aria-hidden>
            {step.emoji}
          </span>
          <h2 id="onboarding-step-title" className="text-2xl font-black">{step.title}</h2>
          <p className="text-sm text-zinc-300">{step.body}</p>
        </div>
        <div className="flex justify-between">
          <button
            className="btn btn-ghost text-sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            ←
          </button>
          {index + 1 < steps.length ? (
            <button
              className="btn btn-primary text-sm"
              onClick={() => setIndex((i) => i + 1)}
            >
              {{ pl: "Dalej", uk: "Далі", cs: "Dál", en: "Next" }[lang]}
            </button>
          ) : step.href ? (
            <Link href={step.href} className="btn btn-primary text-sm" onClick={dismiss}>
              {step.cta ?? "Go"}
            </Link>
          ) : (
            <button className="btn btn-primary text-sm" onClick={dismiss}>
              {{ pl: "Start", uk: "Старт", cs: "Start", en: "Start" }[lang]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
