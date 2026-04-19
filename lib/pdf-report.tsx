/* V4.3 — weekly PDF report generator.
 *
 * Uses @react-pdf/renderer — JSX components compile to a server-side
 * PDF stream. Works in Node.js runtime (required for @react-pdf; NOT
 * edge-compatible — route declares `export const runtime = "nodejs"`).
 *
 * Content:
 *   Header   — PKO/Watt City brand + school + class + week dates
 *   Section  — student roster ranked by weightedScore
 *   Section  — topics covered this week (weekly theme + games played)
 *   Section  — curriculum coverage (per-area bar chart)
 *   Section  — top-3 performers + most-improved
 *   Footer   — generated date + teacher signature line
 */

import React from "react";
import { join } from "path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { SchoolClass } from "@/lib/class";
import type { ClassRosterEntry } from "@/lib/class-roster";
import {
  coverageByArea,
  type CurriculumArea,
} from "@/lib/curriculum";

/* D2 polish — Helvetica (base14) uses WinAnsiEncoding and has no
 * Polish diacritics, so "Uczeń", "Szkoła", "życiu", "Wartość" rendered
 * as "UczeD", "SzkoBa", "yciu", "WartoO" — not ship-ready. Register
 * Roboto (bundled in `public/fonts`, TTF with full Latin-2 coverage)
 * and use it as the default family. @react-pdf/font expects `src` as
 * string file-path (passed to fontkit.open), not a Buffer. */
const FONT_DIR = join(process.cwd(), "public", "fonts");
Font.register({
  family: "Roboto",
  fonts: [
    { src: join(FONT_DIR, "Roboto-Regular.ttf") },
    { src: join(FONT_DIR, "Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 36,
    // Leave room for the fixed footer (bottom:24 + ~36 tall) so content
    // doesn't slide under it on the last page. Prevents the curriculum
    // bar chart from clipping when the roster is large.
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "Roboto",
    color: "#0a0a0f",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#0a0a0f",
    paddingBottom: 8,
    marginBottom: 12,
  },
  brand: { fontSize: 14, fontWeight: "bold" },
  dim: { color: "#555" },
  h2: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  rowBordered: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  barOuter: {
    height: 6,
    backgroundColor: "#eee",
    marginTop: 2,
    marginBottom: 4,
  },
  barInner: { height: 6, backgroundColor: "#f59e0b" },
  smallCaps: { fontSize: 8, letterSpacing: 0.5, color: "#555" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 6,
    fontSize: 8,
    color: "#777",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export type ReportInput = {
  cls: SchoolClass;
  roster: ClassRosterEntry[];
  weekIso: string;
  weekStartDate: string;
  weekEndDate: string;
  observedThemes: Set<string>;
  observedGames: Set<string>;
  schoolName: string;
  teacherDisplayName: string;
  generatedAt: string;
  /** Cap grade at 5-8 for curriculum map. Outside range → falls back to 7. */
  grade: 5 | 6 | 7 | 8;
};

function ReportDocument(props: ReportInput): React.JSX.Element {
  const {
    cls,
    roster,
    weekIso,
    weekStartDate,
    weekEndDate,
    observedThemes,
    observedGames,
    schoolName,
    teacherDisplayName,
    generatedAt,
    grade,
  } = props;

  const sorted = [...roster].sort((a, b) => b.weightedScore - a.weightedScore);
  const top3 = sorted.slice(0, 3);
  const cov = coverageByArea(observedThemes, observedGames, grade);
  const areas = Object.keys(cov) as CurriculumArea[];

  return (
    <Document title={`Watt City weekly report — ${cls.name} — ${weekIso}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow} fixed>
          <View>
            <Text style={s.brand}>Watt City · SKO 2.0</Text>
            <Text style={s.dim}>
              {schoolName} · {cls.name} · klasa {cls.grade}
              {cls.subject ? ` · ${cls.subject}` : ""}
            </Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={{ fontWeight: "bold" }}>Raport tygodniowy</Text>
            <Text style={s.dim}>
              {weekIso} ({weekStartDate} – {weekEndDate})
            </Text>
          </View>
        </View>

        {/* Weekly theme */}
        <Text style={s.h2}>Temat tygodnia</Text>
        <Text>{cls.weeklyTheme ?? "(nie ustawiony)"}</Text>

        {/* Roster */}
        <Text style={s.h2}>Uczniowie ({roster.length})</Text>
        <View style={s.rowBordered}>
          <Text style={{ flex: 1, fontWeight: "bold" }}>Uczeń</Text>
          <Text style={{ width: 60, textAlign: "right", fontWeight: "bold" }}>
            Level
          </Text>
          <Text style={{ width: 80, textAlign: "right", fontWeight: "bold" }}>
            Wartość
          </Text>
          <Text style={{ width: 60, textAlign: "right", fontWeight: "bold" }}>
            Score
          </Text>
        </View>
        {sorted.map((r) => (
          <View key={r.username} style={s.rowBordered}>
            <Text style={{ flex: 1 }}>{r.username}</Text>
            <Text style={{ width: 60, textAlign: "right" }}>L{r.cityLevel}</Text>
            <Text style={{ width: 80, textAlign: "right" }}>
              {Math.floor(r.cityValue).toLocaleString("pl-PL")}
            </Text>
            <Text style={{ width: 60, textAlign: "right" }}>
              {Math.floor(r.weightedScore).toLocaleString("pl-PL")}
            </Text>
          </View>
        ))}

        {/* Top 3 */}
        <Text style={s.h2}>Top 3 uczniowie tygodnia</Text>
        {top3.length === 0 ? (
          <Text style={s.dim}>Brak aktywnych uczniów.</Text>
        ) : (
          top3.map((r, i) => (
            <View key={r.username} style={s.row}>
              <Text>#{i + 1} {r.username}</Text>
              <Text>
                L{r.cityLevel} · score{" "}
                {Math.floor(r.weightedScore).toLocaleString("pl-PL")}
              </Text>
            </View>
          ))
        )}

        {/* Topics covered */}
        <Text style={s.h2}>Tematy omówione</Text>
        {observedThemes.size === 0 && observedGames.size === 0 ? (
          <Text style={s.dim}>
            Brak danych o grach z tego tygodnia. Zachęć klasę do zagrania
            co najmniej raz.
          </Text>
        ) : (
          <>
            {observedThemes.size > 0 && (
              <Text style={s.smallCaps}>
                Tematy AI: {Array.from(observedThemes).join(" · ")}
              </Text>
            )}
            {observedGames.size > 0 && (
              <Text style={s.smallCaps}>
                Gry: {Array.from(observedGames).join(" · ")}
              </Text>
            )}
          </>
        )}

        {/* Curriculum coverage — `wrap={false}` keeps the whole
            chart on a single page instead of splitting mid-bar. */}
        <View wrap={false}>
          <Text style={s.h2}>Podstawa programowa · klasa {grade}</Text>
          {areas.map((a) => {
            const c = cov[a];
            if (c.total === 0) return null;
            const pct = Math.round((c.covered / c.total) * 100);
            return (
              <View key={a}>
                <View style={s.row}>
                  <Text style={{ fontWeight: "bold" }}>{a}</Text>
                  <Text>
                    {c.covered}/{c.total} ({pct}%)
                  </Text>
                </View>
                <View style={s.barOuter}>
                  <View style={[s.barInner, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.footer} fixed>
          <Text>
            Wygenerowano: {generatedAt} · {teacherDisplayName}
          </Text>
          <Text>Podpis: ________________________</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateWeeklyReportPdf(input: ReportInput): Promise<Buffer> {
  const doc = ReportDocument(input);
  return await renderToBuffer(doc);
}
