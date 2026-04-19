/* V4.7 — School pitch brochure.
 *
 * Produced via @react-pdf/renderer (same lib as V4.3 weekly report).
 * Generator ships as a function here; the API route at
 * `/api/dla-szkol/pitch` streams it, and `/dla-szkol/materialy` is
 * the HTML version of the same content so school visitors see
 * everything in-browser without downloading first.
 *
 * Content (PL canonical, one page):
 *   1. Hero: "Watt City dla szkół — SKO 2.0 by PKO"
 *   2. Value prop 3 boxes: engagement · learning · compliance
 *   3. Podstawa programowa coverage stats
 *   4. Compliance facts: GDPR-K · UODO · KNF · EU hosting
 *   5. Pricing / billing footer
 *   6. CTA: kontakt + kalendarz
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { curriculumByArea } from "@/lib/curriculum";

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0a0a0f",
  },
  h1: { fontSize: 22, fontWeight: "bold", marginBottom: 2 },
  sub: { fontSize: 11, color: "#555", marginBottom: 12 },
  h2: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 4,
    color: "#0a0a0f",
  },
  prop: {
    flexDirection: "column",
    padding: 8,
    borderWidth: 2,
    borderColor: "#0a0a0f",
    flex: 1,
    marginRight: 6,
  },
  propTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  ul: { flexDirection: "column" },
  bullet: { flexDirection: "row", marginVertical: 1 },
  bulletDot: { width: 10 },
  box: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#0a0a0f",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#777",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function PitchDocument(opts: { locale: "pl" | "en" }): React.JSX.Element {
  const t = opts.locale === "pl" ? COPY.pl : COPY.en;
  const byArea = curriculumByArea();
  const areas = Object.entries(byArea).map(
    ([a, codes]) => ({ area: a, count: codes.length }),
  );

  return (
    <Document title={`Watt City school pitch — ${opts.locale}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{t.title}</Text>
        <Text style={s.sub}>{t.subtitle}</Text>

        <View style={{ flexDirection: "row", marginTop: 4 }}>
          {t.props.map((p, i) => (
            <View
              key={p.title}
              style={[s.prop, i === t.props.length - 1 ? { marginRight: 0 } : {}]}
            >
              <Text style={s.propTitle}>{p.title}</Text>
              <Text>{p.body}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>{t.coverageTitle}</Text>
        <View style={s.box}>
          {areas.map((a) => (
            <Text key={a.area}>
              {a.area}: <Text style={{ fontWeight: "bold" }}>{a.count}</Text>{" "}
              {t.codeWord}
            </Text>
          ))}
          <Text style={{ marginTop: 4, fontStyle: "italic" }}>
            {t.coverageTotal(PODSTAWA_TOTAL())}
          </Text>
        </View>

        <Text style={s.h2}>{t.complianceTitle}</Text>
        <View style={s.ul}>
          {t.compliance.map((line) => (
            <View key={line} style={s.bullet}>
              <Text style={s.bulletDot}>✓</Text>
              <Text>{line}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>{t.featsTitle}</Text>
        <View style={s.ul}>
          {t.feats.map((line) => (
            <View key={line} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text>{line}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>{t.pricingTitle}</Text>
        <Text>{t.pricingBody}</Text>

        <Text style={s.h2}>{t.ctaTitle}</Text>
        <Text>{t.ctaBody}</Text>

        <View style={s.footer} fixed>
          <Text>Watt City · SKO 2.0 partnership</Text>
          <Text>watt-city.vercel.app/dla-szkol</Text>
        </View>
      </Page>
    </Document>
  );
}

function PODSTAWA_TOTAL(): number {
  const g = curriculumByArea();
  return Object.values(g).reduce((s, v) => s + v.length, 0);
}

const COPY = {
  pl: {
    title: "Watt City dla szkół — SKO 2.0 by PKO",
    subtitle:
      "Gamifikowana edukacja finansowa klas V-VIII, zgodna z podstawą programową MEN.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ minutowych gier, codzienne AI wyzwania, cotygodniowa liga. Dzieci wracają nie z obowiązku, tylko z nawyku.",
      },
      {
        title: "📚 Nauka",
        body: "Budżetowanie, kredyt, RRSO, inwestycje. Każda gra mapowana na konkretny kod podstawy programowej.",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K + UODO + KNF disclaimers. Hosting w UE. Zero danych sprzedawanych.",
      },
    ],
    coverageTitle: "Podstawa programowa MEN",
    codeWord: "kodów",
    coverageTotal: (n: number) =>
      `Łącznie ${n} mapowanych kodów klas V-VIII (Ekonomia, Matematyka, WOS, EDB, Informatyka).`,
    complianceTitle: "Compliance (one-liner dla rodzica)",
    compliance: [
      "GDPR-K: zgoda rodzica dla uczniów poniżej 16 lat (automatyczny flow).",
      "UODO: polski organ nadzoru, kontakt DPO w aplikacji.",
      "KNF disclaimers: na każdej stronie z kredytem.",
      "EU hosting: Upstash Frankfurt + Vercel EU. Żadne dane osobowe nie opuszczają UE.",
      "Audytowalne w 100%: ledger każdej transakcji w-monet.",
    ],
    featsTitle: "Co dostaje nauczyciel",
    feats: [
      "Panel klasy z listą uczniów + ich postępem.",
      "Cotygodniowy raport PDF dla dyrekcji i rodziców (jeden klik).",
      "Wybór tematu tygodnia z podstawy programowej.",
      "Dashboard rodzica w trybie obserwatora.",
      "Privacy controls: dziecko decyduje co pokazać rodzicowi.",
      "Tryb klasowy: bez bankructwa, bez pay-to-win.",
    ],
    pricingTitle: "Cennik",
    pricingBody:
      "Faza pilotażowa: bezpłatny dostęp dla pierwszych 10 szkół z pełnym wsparciem wdrożeniowym. Cel docelowy: model bundled z PKO SKO dla każdego ucznia z kontem w PKO Junior.",
    ctaTitle: "Kontakt",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol · calendly.com/watt-city-school",
  },
  en: {
    title: "Watt City for schools — SKO 2.0 by PKO",
    subtitle:
      "Gamified financial literacy for grades 5-8, aligned with the Polish national curriculum.",
    props: [
      {
        title: "🎯 Engagement",
        body: "15+ one-minute games, daily AI challenges, weekly league. Kids return from habit, not homework.",
      },
      {
        title: "📚 Learning",
        body: "Budgeting, credit, APR, investing. Every game mapped to a specific curriculum code.",
      },
      {
        title: "🔒 Compliance",
        body: "GDPR-K + UODO + KNF disclaimers. EU-only hosting. No data sold.",
      },
    ],
    coverageTitle: "Curriculum alignment",
    codeWord: "codes",
    coverageTotal: (n: number) =>
      `Total: ${n} mapped curriculum codes across grades 5-8 (Economics, Maths, Civics, Safety, IT).`,
    complianceTitle: "Compliance at a glance",
    compliance: [
      "GDPR-K: parental consent for under-16 users (automated flow).",
      "UODO: Polish supervisory authority — DPO contact in-app.",
      "KNF disclaimers on every loan surface.",
      "EU hosting: Upstash Frankfurt + Vercel EU. No PII leaves the EU.",
      "Fully auditable: ledger for every in-game currency transaction.",
    ],
    featsTitle: "Teacher toolkit",
    feats: [
      "Class dashboard with students and progress.",
      "Weekly PDF report for principals and parents (one click).",
      "Weekly theme picker aligned to the national curriculum.",
      "Parent observer dashboard.",
      "Privacy controls: the student chooses what to share.",
      "Classroom mode: no bankruptcy, no pay-to-win.",
    ],
    pricingTitle: "Pricing",
    pricingBody:
      "Pilot: free for the first 10 schools with full onboarding. Long-term goal: bundled with PKO SKO for every student with a PKO Junior account.",
    ctaTitle: "Contact",
    ctaBody:
      "demo@watt-city.example · https://watt-city.vercel.app/dla-szkol · calendly.com/watt-city-school",
  },
};

export async function generatePitchBrochure(
  locale: "pl" | "en" = "pl",
): Promise<Buffer> {
  return await renderToBuffer(PitchDocument({ locale }));
}
