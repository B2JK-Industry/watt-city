import Link from "next/link";
import { getSession } from "@/lib/session";
import { FinanceQuizClient } from "@/components/games/finance-quiz-client";
import {
  financeQuestionsFor,
  QUESTIONS_PER_ROUND,
  type QuizQuestion,
} from "@/lib/content/finance-quiz";
import { shuffle } from "@/lib/shuffle";
import { dictFor, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

function pickRound(lang: Lang): QuizQuestion[] {
  return shuffle(financeQuestionsFor(lang))
    .slice(0, QUESTIONS_PER_ROUND)
    .map((q) => {
      const correctValue = q.options[q.correctIndex];
      const shuffledOptions = shuffle(q.options);
      const newCorrect = shuffledOptions.indexOf(correctValue);
      return { ...q, options: shuffledOptions, correctIndex: newCorrect };
    });
}

const DEMO_BANNER: Record<Lang, { tag: string; body: string; cta: string }> = {
  pl: {
    tag: "Tryb demo",
    body: "Grasz bez konta. Wynik nie zostanie zapisany w rankingu.",
    cta: "Załóż konto, by zapisywać XP",
  },
  uk: {
    tag: "Демо-режим",
    body: "Ти граєш без акаунта. Результат не буде збережений у рейтингу.",
    cta: "Створи акаунт, щоб зберігати XP",
  },
  cs: {
    tag: "Demo režim",
    body: "Hraješ bez účtu. Skóre se neuloží do žebříčku.",
    cta: "Založ účet pro ukládání XP",
  },
  en: {
    tag: "Demo mode",
    body: "Playing without an account. Your score won't be saved to the leaderboard.",
    cta: "Sign up to save your XP",
  },
};

export const dynamic = "force-dynamic";

/* Anonymous demo entry point — `finance-quiz` is the conversion-friendly
 * showcase per the demo-review punch list. Anonymous visitors land,
 * play, see the value, then hit a register CTA. No leaderboard write,
 * no PlayerState mutation: `submitScore` is short-circuited client-side
 * when `anonymous` is true. */
export default async function FinanceQuizPage() {
  const session = await getSession();
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.finance;
  const round = pickRound(lang);
  const anonymous = !session;
  const demo = DEMO_BANNER[lang];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-[var(--ink-muted)] hover:underline">
          {dict.games.back}
        </Link>
        <h1 className="text-3xl font-bold">{t.headerTitle}</h1>
        <p className="text-[var(--ink-muted)]">
          {t.headerBody.replace("{n}", String(QUESTIONS_PER_ROUND))}
        </p>
      </header>
      {anonymous && (
        <aside
          className="card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4"
          aria-label={demo.tag}
        >
          <div className="flex items-center gap-2">
            <span className="chip">{demo.tag}</span>
          </div>
          <p className="flex-1 t-body-sm text-[var(--ink-muted)]">{demo.body}</p>
          <Link href="/register" className="btn btn-sales btn-sm shrink-0">
            {demo.cta}
          </Link>
        </aside>
      )}
      <FinanceQuizClient questions={round} dict={dict} anonymous={anonymous} lang={lang} />
    </div>
  );
}
