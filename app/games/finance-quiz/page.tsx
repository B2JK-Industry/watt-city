import Link from "next/link";
import { redirect } from "next/navigation";
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

export const dynamic = "force-dynamic";

export default async function FinanceQuizPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/games/finance-quiz");
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.finance;
  const round = pickRound(lang);
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
      <FinanceQuizClient questions={round} dict={dict} />
    </div>
  );
}
