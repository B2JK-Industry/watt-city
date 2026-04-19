import { describe, it, expect } from "vitest";
import { GAMES, CATEGORY_LABELS, localizedTitle } from "./games";

/* Cleanup issue 1 — Slovak-leak regression guards. Protects against the
 * canonical GAMES strings regressing back into Slovak (the root cause
 * of the UX audit finding: landing + leaderboard + sin-slavy + city
 * scene used `.title` / `.tagline` directly and showed SK to PL users).
 */

const SLOVAK_CANARY_PHRASES = [
  "Finančný kvíz",
  "Pamäťové páry",
  "Kurzový šprint",
  "Matematický šprint",
  "Premiešané slová",
  "reakčná hra",
  "Banková",
  "Sliezska knižnica",
  "Zmenáreň na Rynku",
  "Mestská tlačiareň",
  "Sliezske múzeum",
  "Matematický inštitút",
  "Burzová veža",
  "Solárna farma",
  "Energetický showroom",
];

const POLISH_EXPECTED_TITLES: Record<string, string> = {
  "finance-quiz": "Quiz finansowy",
  "memory-match": "Gra pamięciowa",
  "word-scramble": "Litery w chaosie",
  "stock-tap": "Kurs akcji",
  "energy-dash": "Energetyczny sprint",
  "budget-balance": "Budżet domowy",
  "power-flip": "Przełącznik mocy",
  "currency-rush": "Pary walutowe",
  "math-sprint": "Sprint matematyczny",
};

describe("GAMES canonical titles (cleanup issue 1)", () => {
  it("every game title matches the audit-mandated Polish translation", () => {
    for (const g of GAMES) {
      const expected = POLISH_EXPECTED_TITLES[g.id];
      expect(expected, `unknown game id: ${g.id}`).toBeDefined();
      expect(g.title, `game ${g.id}`).toBe(expected);
    }
  });

  it("no Slovak canary phrase survives in title/tagline/description/role", () => {
    for (const g of GAMES) {
      const blob = [
        g.title,
        g.tagline,
        g.description,
        g.building.role,
      ].join(" | ");
      for (const bad of SLOVAK_CANARY_PHRASES) {
        expect(
          blob.includes(bad),
          `${g.id} contains Slovak "${bad}"`,
        ).toBe(false);
      }
    }
  });

  it("CATEGORY_LABELS all Polish (audit called out Slovak: Financie/Pamäť/Vedomosti/Energetika)", () => {
    expect(CATEGORY_LABELS.finance).toBe("Finanse");
    expect(CATEGORY_LABELS.memory).toBe("Pamięć");
    expect(CATEGORY_LABELS.knowledge).toBe("Wiedza");
    expect(CATEGORY_LABELS.energy).toBe("Energetyka");
  });
});

describe("localizedTitle resolves dict.headerTitle with Polish fallback", () => {
  it("PL dict wins when present", () => {
    const fq = GAMES.find((g) => g.id === "finance-quiz")!;
    const t = localizedTitle(fq, { finance: { headerTitle: "DICT_WINS" } });
    expect(t).toBe("DICT_WINS");
  });

  it("falls back to canonical Polish GAMES.title when dict missing", () => {
    const fq = GAMES.find((g) => g.id === "finance-quiz")!;
    const t = localizedTitle(fq, {});
    expect(t).toBe("Quiz finansowy"); // canonical Polish, not Slovak
  });
});
