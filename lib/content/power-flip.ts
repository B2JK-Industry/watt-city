export type PowerRound = {
  question: string;
  left: { label: string; detail: string };
  right: { label: string; detail: string };
  correct: "left" | "right";
  fact: string;
};

// Educational content: energy efficiency + utility bills.
// Rotated pool; user sees 12-ish per round.
export const POWER_ROUNDS: PowerRound[] = [
  {
    question: "Čo ušetrí viac energie ročne?",
    left: { label: "LED 9 W", detail: "~11 kWh/rok" },
    right: { label: "Klasická 60 W", detail: "~70 kWh/rok" },
    correct: "left",
    fact: "LED spotrebuje až 6× menej elektriny pri rovnakom svetelnom výkone.",
  },
  {
    question: "Ktorá práčka je efektívnejšia?",
    left: { label: "Energ. trieda A", detail: "~180 kWh/rok" },
    right: { label: "Energ. trieda F", detail: "~410 kWh/rok" },
    correct: "left",
    fact: "Nová škála A–G v EÚ je prísnejšia. Trieda A dnes = ~polovica spotreby oproti F.",
  },
  {
    question: "Čo znižuje účet za vykurovanie viac?",
    left: { label: "Termostatická hlavica", detail: "−15 % za rok" },
    right: { label: "Zatvorené dvere do izby", detail: "marginálne" },
    correct: "left",
    fact: "Termostatické hlavice vypnú radiátor pri dosiahnutí nastavenej teploty — typicky 10–15 % ročná úspora.",
  },
  {
    question: "Ktorá spotreba je väčšia?",
    left: { label: "Sušička 1 hod", detail: "~2.5 kWh" },
    right: { label: "Notebook 8 hod", detail: "~0.5 kWh" },
    correct: "left",
    fact: "Sušička je jeden z najväčších žrútov. Sušenie na vzduchu je zadarmo.",
  },
  {
    question: "Čo viac ušetrí v kuchyni?",
    left: { label: "Pokrievka na hrnci", detail: "−30 % energie na var" },
    right: { label: "Varenie bez pokrievky", detail: "referenčné" },
    correct: "left",
    fact: "Pokrievka drží teplo — rýchlejší var, menšia spotreba.",
  },
  {
    question: "Ktorý spotrebič má menšiu standby spotrebu?",
    left: { label: "TV v standby", detail: "~0.5 W" },
    right: { label: "Starý set-top box", detail: "~15 W" },
    correct: "left",
    fact: "Standby hodnoty sa ťahajú 24/7. 15 W × 8760 h = 131 kWh/rok naprázdno.",
  },
  {
    question: "Lepšia voľba pre ohrev vody?",
    left: { label: "Plynový ohrievač", detail: "~6 kWh ekv./deň" },
    right: { label: "Elektrický bojler", detail: "~8 kWh/deň" },
    correct: "left",
    fact: "Plyn je v Poľsku stále lacnejší na ohrev vody než elektrina z mixu.",
  },
  {
    question: "Čo zníži účet za svetlo viac?",
    left: { label: "Vypnúť svetlo v nepoužívanej izbe", detail: "−5–10 %" },
    right: { label: `Nechať rozsvietené „pre istotu"`, detail: "+ zbytočné kWh" },
    correct: "left",
    fact: "Každá žiarovka 9 W × 10 h = 90 Wh, ×365 dní = ~33 kWh/rok na jednu izbu.",
  },
  {
    question: "Lepší nákup pre dlhodobú úsporu?",
    left: { label: "A+++ chladnička za 2500 zł", detail: "~140 kWh/rok" },
    right: { label: "A+ chladnička za 1500 zł", detail: "~290 kWh/rok" },
    correct: "left",
    fact: "Rozdiel 150 kWh/rok × ~0.90 zł ≈ 135 zł/rok. Vráti sa za ~7 rokov — chladnička vydrží 15+.",
  },
  {
    question: "Čo znižuje fakturu za kúrenie?",
    left: { label: "Utesnené okná", detail: "−10 až 15 % tepla" },
    right: { label: "Otvorené okno pri kúrení", detail: "priamy únik" },
    correct: "left",
    fact: "Kúrenie cez otvorené okno = peniaze letia preč. Krátke intenzívne vetranie je lepšie.",
  },
  {
    question: "Ktorý zdroj je obnoviteľný?",
    left: { label: "Fotovoltika", detail: "slnko" },
    right: { label: "Zemný plyn", detail: "fosíl" },
    correct: "left",
    fact: "Slnko, vietor, voda, biomasa, geotermia = OZE. Uhlie, ropa, plyn = fosíly.",
  },
  {
    question: "Čo je drahšie prevádzkovať za mesiac?",
    left: { label: "Klimatizácia 8 h/deň", detail: "~60 kWh/mes" },
    right: { label: "Ventilátor 8 h/deň", detail: "~12 kWh/mes" },
    correct: "left",
    fact: "Klimatizácia spotrebuje rádovo viac. Ventilátor alebo tienenie ušetria značné peniaze v lete.",
  },
  {
    question: "Čo je lepšie pre účet za vodu?",
    left: { label: "Sprchovanie 5 min", detail: "~50 l vody" },
    right: { label: "Kúpeľ vo vani", detail: "~150 l vody" },
    correct: "left",
    fact: "Sprcha spotrebuje ~3× menej vody než plná vaňa.",
  },
  {
    question: "Ktorý zdroj vypúšťa najmenej CO₂?",
    left: { label: "Jadrová elektráreň", detail: "~12 g CO₂/kWh" },
    right: { label: "Uhoľná elektráreň", detail: "~900 g CO₂/kWh" },
    correct: "left",
    fact: "Jadrová elektrina má nízke emisie porovnateľné s OZE. Uhlie je emisný líder.",
  },
  {
    question: "Čo dlhodobo znižuje náklady?",
    left: { label: "Investícia do izolácie domu", detail: "−20–40 % na kúrenie" },
    right: { label: "Vyššia teplota termostatu", detail: "+7 % za každý °C" },
    correct: "left",
    fact: "Každý 1 °C hore na termostate = ~7 % vyššia faktúra. Izolácia má dlhú návratnosť, ale podstatnú.",
  },
];

export const DURATION_SECONDS = 30;
export const XP_CORRECT = 10;
export const XP_WRONG = 5;
export const XP_CAP = 180;
