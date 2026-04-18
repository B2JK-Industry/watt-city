import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { FinanceQuizClient } from "@/components/games/finance-quiz-client";
import {
  FINANCE_QUESTIONS,
  QUESTIONS_PER_ROUND,
  type QuizQuestion,
} from "@/lib/content/finance-quiz";
import { shuffle } from "@/lib/shuffle";

function pickRound(): QuizQuestion[] {
  return shuffle(FINANCE_QUESTIONS)
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
  if (!session) {
    redirect("/login?next=/games/finance-quiz");
  }
  const round = pickRound();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          ← Späť na hry
        </Link>
        <h1 className="text-3xl font-bold">Finančný kvíz</h1>
        <p className="text-zinc-400">
          {QUESTIONS_PER_ROUND} otázok z osobných financií. Za každú správnu
          odpoveď získavaš 20 XP. Po každej otázke ti vysvetlíme, prečo je
          odpoveď správna.
        </p>
      </header>
      <FinanceQuizClient questions={round} />
    </div>
  );
}
