export type ScrambleWord = {
  word: string; // canonical answer (UPPERCASE, ASCII-ish PL ok)
  hint: string;
};

export const SCRAMBLE_WORDS: ScrambleWord[] = [
  { word: "POŻYCZKA", hint: "Krátkodobá pôžička od banky alebo inštitúcie." },
  { word: "KREDYT", hint: "Dlhodobý bankový úver." },
  { word: "INFLACJA", hint: "Rast cien a pokles hodnoty peňazí." },
  { word: "INWESTYCJA", hint: "Vloženie kapitálu na očakávaný zisk." },
  { word: "OSZCZĘDNOŚĆ", hint: "To, čo odložíš nabok." },
  { word: "AKCJA", hint: "Podiel na firme, obchodovaný na burze." },
  { word: "OBLIGACJA", hint: "Dlhový cenný papier s výplatou úroku." },
  { word: "BUDŻET", hint: "Plán príjmov a výdavkov." },
  { word: "LOKATA", hint: "Termínovaný vklad v banke." },
  { word: "WALUTA", hint: "Peňažná jednotka krajiny." },
  { word: "ZYSK", hint: "Rozdiel, keď výnos prevýši náklady." },
  { word: "STRATA", hint: "Opak zisku." },
  { word: "KURS", hint: "Pomer, za ktorý sa jedna mena mení za inú." },
  { word: "BANKOMAT", hint: "Stroj, z ktorého vyberieš hotovosť." },
  { word: "OPROCENTOWANIE", hint: "Výška úroku vyjadrená v percentách." },
];

export const WORDS_PER_ROUND = 8;
export const XP_PER_WORD = 15;
