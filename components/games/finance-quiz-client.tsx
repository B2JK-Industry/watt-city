"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/lib/content/finance-quiz";
import { XP_PER_CORRECT } from "@/lib/content/finance-quiz";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict, Lang } from "@/lib/i18n";

type Props = {
  questions: QuizQuestion[];
  dict: Dict;
  /** When true, skip `submitScore` — the user is not signed in. The
   *  end-of-round screen swaps in a register CTA instead of leaderboard
   *  numbers. Defaults to false to preserve existing behaviour for the
   *  authenticated session call sites. */
  anonymous?: boolean;
  lang?: Lang;
};
type Phase = "playing" | "reveal" | "done";

const GAME_ID = "finance-quiz";

const ANON_RESULT: Record<Lang, {
  title: string;
  scored: string;
  pitch: string;
  registerCta: string;
  loginCta: string;
  retry: string;
  back: string;
}> = {
  pl: {
    title: "Koniec rundy demo",
    scored: "Trafiłeś {n}/{total} pytań · {xp} W",
    pitch: "Załóż konto, by zapisać XP, odblokować mini-gry i budować swoje miasto.",
    registerCta: "Załóż konto",
    loginCta: "Mam już konto",
    retry: "Zagraj jeszcze raz",
    back: "Inne mini-gry",
  },
  uk: {
    title: "Кінець демо-раунду",
    scored: "Правильних: {n}/{total} · {xp} W",
    pitch: "Створи акаунт, щоб зберегти XP, відкрити інші ігри та будувати своє місто.",
    registerCta: "Створити акаунт",
    loginCta: "У мене вже є акаунт",
    retry: "Зіграти ще раз",
    back: "Інші міні-ігри",
  },
  cs: {
    title: "Konec demo kola",
    scored: "Správně: {n}/{total} · {xp} W",
    pitch: "Založ si účet, aby ses ukládal XP, odemkl další hry a stavěl své město.",
    registerCta: "Založit účet",
    loginCta: "Mám účet",
    retry: "Hrát znovu",
    back: "Jiné mini-hry",
  },
  en: {
    title: "Demo round finished",
    scored: "You answered {n}/{total} correctly · {xp} W",
    pitch: "Sign up to save your XP, unlock other mini-games, and build your city.",
    registerCta: "Create account",
    loginCta: "I have an account",
    retry: "Play again",
    back: "Other mini-games",
  },
};

export function FinanceQuizClient({
  questions,
  dict,
  anonymous = false,
  lang = "pl",
}: Props) {
  const t = dict.finance;
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  /* Soft retry for the anonymous demo. The previous implementation
   * fired `window.location.href = "/games/finance-quiz"` which is a
   * full-page reload — visible blank flash, scroll reset, every
   * client island re-mounts. Now: reset local round state + ask
   * Next.js to re-render the server tree (`router.refresh()`), which
   * runs `pickRound(lang)` again on the server and hands back a
   * fresh question set without dropping the React tree. */
  function softRetry() {
    setIndex(0);
    setPhase("playing");
    setChosen(null);
    setCorrectCount(0);
    setSubmitError(null);
    setResult(null);
    router.refresh();
  }

  const total = questions.length;
  const current = questions[index];
  const progress = useMemo(
    () => ((index + (phase === "reveal" ? 1 : 0)) / total) * 100,
    [index, phase, total],
  );

  const submit = useCallback(async (xp: number) => {
    if (anonymous) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitScore(GAME_ID, xp);
    if (res.ok) setResult(res);
    else setSubmitError(res.error ?? dict.auth.errorGeneric);
    setSubmitting(false);
  }, [anonymous, dict.auth.errorGeneric]);

  function choose(optionIdx: number) {
    if (phase !== "playing") return;
    setChosen(optionIdx);
    if (optionIdx === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
    setPhase("reveal");
  }

  function nextStep() {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setChosen(null);
      setPhase("playing");
    } else {
      setPhase("done");
      void submit(correctCount * XP_PER_CORRECT);
    }
  }

  if (phase === "done") {
    if (anonymous) {
      const a = ANON_RESULT[lang];
      const xp = correctCount * XP_PER_CORRECT;
      const scoredLine = a.scored
        .replace("{n}", String(correctCount))
        .replace("{total}", String(total))
        .replace("{xp}", String(xp));
      return (
        <div className="card p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="t-overline text-[var(--ink-muted)]">demo</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--accent)]">
              {a.title}
            </h2>
            <p className="t-body text-[var(--foreground)]">{scoredLine}</p>
          </div>
          <p className="t-body-lg text-[var(--foreground)] max-w-xl">{a.pitch}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-sales">
              {a.registerCta}
            </Link>
            <Link href="/login" className="btn btn-secondary">
              {a.loginCta}
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={softRetry}
            >
              {a.retry}
            </button>
            <Link href="/games" className="btn btn-ghost">
              {a.back}
            </Link>
          </div>
        </div>
      );
    }
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error: submitError, result }}
        gameHref="/games/finance-quiz"
        retryLabel={t.retryLabel}
        lines={[
          { label: t.statsCorrect, value: `${correctCount}/${total}` },
          { label: t.statsWrong, value: String(total - correctCount) },
          {
            label: t.statsScore,
            value: String(correctCount * XP_PER_CORRECT),
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-[var(--ink-muted)]">
        <span>
          {t.progressQuestion
            .replace("{i}", String(index + 1))
            .replace("{n}", String(total))}
        </span>
        <span>
          {t.progressCorrect}:{" "}
          <strong className="text-[var(--accent)]">{correctCount}</strong>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] from-[var(--accent)] to-[var(--accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="card p-6 flex flex-col gap-5">
        <h2 className="text-xl font-semibold">{current.prompt}</h2>
        <div className="flex flex-col gap-2">
          {current.options.map((opt, i) => {
            const isCorrect = i === current.correctIndex;
            const isChosen = i === chosen;
            let variant =
              "bg-[var(--surface-2)] border-[var(--line)] hover:border-[var(--accent)]";
            if (phase === "reveal") {
              if (isCorrect) {
                variant = "bg-[color-mix(in_oklab,var(--success)_8%,white)] border-[var(--success)]";
              } else if (isChosen) {
                variant = "bg-[color-mix(in_oklab,var(--danger)_12%,white)] border-[var(--danger)]";
              } else {
                variant =
                  "bg-[var(--surface-2)] border-[var(--line)] opacity-70";
              }
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={phase === "reveal"}
                className={`text-left border rounded-xl px-4 py-3 transition-colors ${variant}`}
              >
                <span className="font-mono opacity-60 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {phase === "reveal" && (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl px-4 py-3 border ${
                chosen === current.correctIndex
                  ? "bg-[color-mix(in_oklab,var(--success)_8%,white)] border-[var(--success)]"
                  : "bg-[color-mix(in_oklab,var(--danger)_12%,white)] border-[var(--danger)]"
              }`}
            >
              <p className="font-semibold mb-1">
                {chosen === current.correctIndex ? t.correctMark : t.wrongMark}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">{current.explanation}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary self-end"
              onClick={nextStep}
            >
              {index + 1 < total ? t.next : t.finish}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
