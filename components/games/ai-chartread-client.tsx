"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import type { ChartReadSpecSchema } from "@/lib/ai-pipeline/types";
import { submitScore, type ScoreResponse } from "@/lib/client-api";
import { RoundResult } from "@/components/games/round-result";
import type { Dict } from "@/lib/i18n";

type Spec = z.infer<typeof ChartReadSpecSchema>;

const VB_W = 600;
const VB_H = 320;
const PAD = 40;

function Chart({ spec }: { spec: Spec }) {
  const ys = spec.points.map((p) => p.y);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys);
  const xCount = spec.points.length;
  const chartW = VB_W - PAD * 2;
  const chartH = VB_H - PAD * 2;
  const xStep = chartW / Math.max(1, xCount - 1);

  const mapY = (y: number) =>
    PAD + chartH - ((y - yMin) / Math.max(1, yMax - yMin)) * chartH;

  const path = spec.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${PAD + i * xStep} ${mapY(p.y)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto card">
      <title>{spec.chartTitle}</title>
      {/* axes */}
      <line x1={PAD} y1={VB_H - PAD} x2={VB_W - PAD} y2={VB_H - PAD} stroke="var(--line)" strokeWidth={1} />
      <line x1={PAD} y1={PAD} x2={PAD} y2={VB_H - PAD} stroke="var(--line)" strokeWidth={1} />
      {/* title */}
      <text x={VB_W / 2} y={20} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--accent)">
        {spec.chartTitle}
      </text>
      {/* y-label */}
      <text x={12} y={PAD - 6} fontSize={10} fill="var(--ink-muted)">
        {spec.yLabel}
      </text>
      {/* x-label */}
      <text x={VB_W - PAD} y={VB_H - 10} textAnchor="end" fontSize={10} fill="var(--ink-muted)">
        {spec.xLabel}
      </text>
      {spec.chartType === "line" ? (
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
      ) : (
        spec.points.map((p, i) => {
          const x = PAD + i * xStep - 10;
          const y = mapY(p.y);
          const h = VB_H - PAD - y;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={20}
              height={h}
              fill="var(--sales)"
              stroke="var(--accent)"
              strokeWidth={1}
            />
          );
        })
      )}
      {spec.points.map((p, i) => (
        <g key={i}>
          <circle cx={PAD + i * xStep} cy={mapY(p.y)} r={3} fill="var(--sales)" />
          <text
            x={PAD + i * xStep}
            y={VB_H - PAD + 14}
            textAnchor="middle"
            fontSize={9}
            fill="var(--ink-muted)"
          >
            {String(p.x)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AiChartReadClient({
  gameId,
  spec,
  dict,
}: {
  gameId: string;
  spec: Spec;
  dict: Dict;
}) {
  const t = dict.ai;
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const isCorrect = chosen === spec.correctIndex;

  const submit = useCallback(
    async (xp: number) => {
      setSubmitting(true);
      setError(null);
      const res = await submitScore(gameId, xp);
      if (res.ok) setResult(res);
      else setError(res.error ?? dict.auth.errorGeneric);
      setSubmitting(false);
    },
    [gameId, dict.auth.errorGeneric],
  );

  if (done) {
    return (
      <RoundResult
        dict={dict}
        state={{ submitting, error, result }}
        gameHref={`/games/ai/${gameId}`}
        lines={[
          { label: t.correct, value: isCorrect ? "1/1" : "0/1" },
          { label: t.score, value: String(isCorrect ? spec.xpPerCorrect : 0) },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Chart spec={spec} />
      <div className="card p-5 flex flex-col gap-4">
        <p className="font-semibold">{spec.question}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {spec.options.map((opt, i) => {
            const isAnswer = i === spec.correctIndex;
            const isChosen = chosen === i;
            const tone = !revealed
              ? isChosen
                ? "border-[var(--accent)]"
                : "hover:border-[var(--accent)]"
              : isAnswer
                ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,white)]"
                : isChosen
                  ? "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,white)]"
                  : "opacity-50";
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => setChosen(i)}
                className={`rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-left text-sm transition ${tone}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {revealed ? (
          <div className="flex flex-col gap-2">
            <div
              className={`rounded-xl p-3 border ${
                isCorrect
                  ? "border-[var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,white)]"
                  : "border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,white)]"
              }`}
            >
              <p className="font-semibold mb-1">
                {isCorrect ? t.correctMark : t.wrongMark}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">{spec.explanation}</p>
            </div>
            <button
              className="btn btn-primary self-end"
              onClick={() => {
                setDone(true);
                void submit(isCorrect ? spec.xpPerCorrect : 0);
              }}
            >
              {t.finish}
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary self-start"
            disabled={chosen === null}
            onClick={() => setRevealed(true)}
          >
            {t.check}
          </button>
        )}
      </div>
    </div>
  );
}
