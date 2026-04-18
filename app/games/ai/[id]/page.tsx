import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAiGame } from "@/lib/ai-pipeline/publish";
import { resolveSpecForLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { AiQuizClient } from "@/components/games/ai-quiz-client";
import { AiScrambleClient } from "@/components/games/ai-scramble-client";
import { AiPriceGuessClient } from "@/components/games/ai-price-guess-client";
import { AiTrueFalseClient } from "@/components/games/ai-truefalse-client";
import { AiMatchPairsClient } from "@/components/games/ai-matchpairs-client";
import { AiOrderClient } from "@/components/games/ai-order-client";

export const dynamic = "force-dynamic";

export default async function AiGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/games/ai/${id}`);
  const game = await getAiGame(id);
  if (!game) notFound();

  const lang = await getLang();
  const dict = dictFor(lang);
  const spec = resolveSpecForLang(game.spec, lang);

  const hoursLeft = Math.max(
    0,
    Math.round((game.validUntil - Date.now()) / (60 * 60 * 1000)),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/games" className="text-sm text-zinc-400 hover:underline">
          {dict.games.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip border-[var(--accent)] text-[var(--accent)]">
            🤖 {dict.ai.badge}
          </span>
          <span className="chip">{game.theme}</span>
          <span className="chip">
            {dict.ai.model}: <strong className="ml-1">{game.model}</strong>
          </span>
          {hoursLeft > 0 && (
            <span className="chip">
              ⏱ {dict.ai.hoursLeft.replace("{h}", String(hoursLeft))}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{game.title}</h1>
        <p className="text-zinc-300">{game.tagline}</p>
        <p className="text-sm text-zinc-500">{game.description}</p>
      </header>

      {spec.kind === "quiz" && (
        <AiQuizClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "scramble" && (
        <AiScrambleClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "price-guess" && (
        <AiPriceGuessClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "true-false" && (
        <AiTrueFalseClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "match-pairs" && (
        <AiMatchPairsClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "order" && (
        <AiOrderClient gameId={game.id} spec={spec} dict={dict} />
      )}
    </div>
  );
}
