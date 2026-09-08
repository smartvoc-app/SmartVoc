/* Prüfprotokoll 10: Wie zählt ein Tippfehler? */
import { scoreAnswer, FAST_MAX } from "../src/lib/scoring.ts";
import { RECOMMENDED } from "../src/lib/defaults.ts";
import { record, outcomeOf } from "../src/lib/runqueue.ts";
import { deriveRating } from "../src/lib/fsrs.ts";

let ok = 0, fehl = 0;
const P = (was, ist, erw) => { const gut = String(ist) === String(erw); gut ? ok++ : fehl++;
  console.log(`  ${gut ? "OK   " : "FEHLER"} ${was.padEnd(52)} ${ist}${gut ? "" : "   erwartet " + erw}`); };

const O = (extra) => ({ ...RECOMMENDED, ...extra });
const b = (u, c, o) => scoreAnswer(u, c, o);

console.log("Obergrenze für «fast richtig»:", FAST_MAX, "\n");
P("Voreinstellung ist milde", RECOMMENDED.acceptPartial, true);
P("Tippfehler: Urteil", b("brotther", "brother", O({})).verdict, "almost");
P("Tippfehler: Punktzahl", b("brotther", "brother", O({})).score, 0.7);
P("Akzent fehlt: Punktzahl", b("ecole", "école", O({})).score, 0.7);
P("Artikel falsch: Punktzahl", b("der Haus", "das Haus", O({ articleMode: "partial" })).score, 0.7);
P("streng gestellt: Tippfehler ist falsch", b("brotther", "brother", O({ acceptPartial: false })).verdict, "wrong");
P("streng gestellt: Punktzahl", b("brotther", "brother", O({ acceptPartial: false })).score, 0);

/* Was macht die Runde daraus, und welche Note bekommt FSRS? */
console.log("\nRunde und Note:");
for (const [name, milde] of [["milde (Voreinstellung)", true], ["streng", false]]) {
  /* Ein Wort, Ziel 1. Erste Antwort: fast richtig. */
  const w = { id: "w1", goal: 1, done: 0, correct: 0, attempts: 0, usedHint: false,
              failedOnce: false, fastOnce: false, mastered: false, graded: false, sinceShown: 0, block: 0 };
  const st = { words: { w1: w }, current: "w1", lastId: null, total: 1, goalTotal: 1, cards: 0, rng: () => 0.5 };
  record(st, { correct: milde, fast: true, usedHint: false, elapsedMs: 4000 });
  const erg = outcomeOf(w);
  const note = deriveRating(erg, "type");
  const NAMEN = { 1: "Again (nochmal)", 2: "Hard (schwer)", 3: "Good (gut)", 4: "Easy (leicht)" };
  P(`${name}: Runde geschafft?`, w.mastered, milde);
  P(`${name}: FSRS-Note`, NAMEN[note] || note, milde ? "Hard (schwer)" : "Again (nochmal)");
}
console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
