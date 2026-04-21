import Link from "next/link";
import nextDynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAiGame } from "@/lib/ai-pipeline/publish";
import { resolveSpecForLang } from "@/lib/ai-pipeline/types";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { GameComments } from "@/components/game-comments";

export const dynamic = "force-dynamic";

// Phase 6.5.3 — code-split every AI kind client into its own chunk. Only
// the kind actually rendered for the current spec is downloaded. Saves
// ~60 KB gzipped on first paint for the common quiz/scramble path.
const AiQuizClient = nextDynamic(() =>
  import("@/components/games/ai-quiz-client").then((m) => m.AiQuizClient),
);
const AiScrambleClient = nextDynamic(() =>
  import("@/components/games/ai-scramble-client").then((m) => m.AiScrambleClient),
);
const AiPriceGuessClient = nextDynamic(() =>
  import("@/components/games/ai-price-guess-client").then((m) => m.AiPriceGuessClient),
);
const AiTrueFalseClient = nextDynamic(() =>
  import("@/components/games/ai-truefalse-client").then((m) => m.AiTrueFalseClient),
);
const AiMatchPairsClient = nextDynamic(() =>
  import("@/components/games/ai-matchpairs-client").then((m) => m.AiMatchPairsClient),
);
const AiOrderClient = nextDynamic(() =>
  import("@/components/games/ai-order-client").then((m) => m.AiOrderClient),
);
const AiMemoryClient = nextDynamic(() =>
  import("@/components/games/ai-memory-client").then((m) => m.AiMemoryClient),
);
const AiFillBlankClient = nextDynamic(() =>
  import("@/components/games/ai-fillblank-client").then((m) => m.AiFillBlankClient),
);
const AiCalcSprintClient = nextDynamic(() =>
  import("@/components/games/ai-calcsprint-client").then((m) => m.AiCalcSprintClient),
);
const AiBudgetClient = nextDynamic(() =>
  import("@/components/games/ai-budget-client").then((m) => m.AiBudgetClient),
);
const AiWhatIfClient = nextDynamic(() =>
  import("@/components/games/ai-whatif-client").then((m) => m.AiWhatIfClient),
);
const AiChartReadClient = nextDynamic(() =>
  import("@/components/games/ai-chartread-client").then((m) => m.AiChartReadClient),
);

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
        <p className="text-sm text-zinc-400">{game.description}</p>
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
      {spec.kind === "memory" && (
        <AiMemoryClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "fill-in-blank" && (
        <AiFillBlankClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "calc-sprint" && (
        <AiCalcSprintClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "budget-allocate" && (
        <AiBudgetClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "what-if" && (
        <AiWhatIfClient gameId={game.id} spec={spec} dict={dict} />
      )}
      {spec.kind === "chart-read" && (
        <AiChartReadClient gameId={game.id} spec={spec} dict={dict} />
      )}
      <GameComments
        gameId={game.id}
        currentUser={session.username}
        labels={{
          title: { pl: "Komentarze", uk: "Коментарі", cs: "Komentáře", en: "Comments" }[lang]!,
          placeholder: { pl: "Co sądzisz o tej grze?", uk: "Що думаєш?", cs: "Co myslíš?", en: "What do you think?" }[lang]!,
          post: { pl: "Wyślij", uk: "Надіслати", cs: "Odeslat", en: "Post" }[lang]!,
          report: { pl: "Zgłoś", uk: "Скарга", cs: "Nahlásit", en: "Report" }[lang]!,
          empty: { pl: "Brak komentarzy.", uk: "Немає коментарів.", cs: "Žádné komentáře.", en: "No comments yet." }[lang]!,
          slurWarn: { pl: "Twój komentarz zawiera niedozwolone słowo.", uk: "Коментар містить заборонене слово.", cs: "Komentář obsahuje zakázané slovo.", en: "Your comment contains disallowed text." }[lang]!,
        }}
      />
    </div>
  );
}
