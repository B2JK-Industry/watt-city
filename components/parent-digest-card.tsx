/* V4.6 — weekly digest card (in-app, not email per V4.6 spec).
 *
 * Summarises the past week of the kid's activity in one sentence
 * parent-facing. SMTP-delivered digest is deferred to V5 — this is
 * the read-only card the parent sees when they open /rodzic.
 */

type Props = {
  kidName: string;
  scoresThisWeek: number;
  buildsThisWeek: number;
  loanTakes: number;
  themesThisWeek: string[];
};

export function ParentDigestCard(props: Props) {
  const { kidName, scoresThisWeek, buildsThisWeek, loanTakes, themesThisWeek } = props;
  const summary = buildSummary(kidName, scoresThisWeek, buildsThisWeek, loanTakes);

  return (
    <section
      className="card p-4 flex flex-col gap-3"
      style={{ borderColor: "var(--neo-cyan)", borderLeftWidth: "4px" }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-widest font-black text-[var(--accent)]">
          📬 Co się działo w tym tygodniu
        </h2>
      </div>
      <p className="text-sm leading-relaxed">{summary}</p>
      {themesThisWeek.length > 0 && (
        <div className="text-xs">
          <span className="opacity-60">Tematy:</span>{" "}
          {themesThisWeek.map((t, i) => (
            <span key={t}>
              <strong>{t}</strong>
              {i < themesThisWeek.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function buildSummary(
  name: string,
  scores: number,
  builds: number,
  loans: number,
): string {
  if (scores === 0 && builds === 0 && loans === 0) {
    return `${name} nie grał w Watt City w tym tygodniu. Może wspólnie otworzycie aplikację?`;
  }
  const bits: string[] = [];
  if (scores > 0) bits.push(`zagrał ${scores} gier`);
  if (builds > 0) bits.push(`zbudował ${builds} nowy${builds === 1 ? "" : "ch"} budynk${builds === 1 ? "" : "ów"}`);
  if (loans > 0) bits.push(`wziął ${loans} kredyt${loans === 1 ? "" : "y"} (trening finansowy!)`);
  return `${name} w tym tygodniu: ${bits.join(", ")}. 🎯`;
}
