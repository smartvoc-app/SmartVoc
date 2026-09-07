/* Prüfprotokoll 2: Lernstufen, Fälligkeit, Ampel.
   Geprüft wird gegen die Schwellen aus DEFAULTS, nicht gegen mein Gedächtnis. */
import { deriveProfile, DEFAULTS, getCfg } from "../src/lib/fsrs.ts";
import { readyPercent, readyTone } from "../src/lib/readiness.ts";

const TAG = 86400000, jetzt = Date.now();
const karte = (S, vorTagen, reps = 5, lapses = 0, D = 5) => ({
  stability: S, difficulty: D, elapsed_days: vorTagen, scheduled_days: S,
  reps, lapses, learning_steps: 0, state: 2, last_review: jetzt - vorTagen * TAG,
});
let ok = 0, fehl = 0; const zeilen = [];
const P = (gruppe, was, ist, erwartet) => {
  const gut = String(ist) === String(erwartet); gut ? ok++ : fehl++;
  zeilen.push({ gruppe, was, ist: String(ist), erwartet: String(erwartet), gut });
};
const stufe = (c) => deriveProfile(c, 0.9, jetzt).stufe;

console.log("Schwellen laut DEFAULTS: S1 =", DEFAULTS.S1, "Tage, S2 =", DEFAULTS.S2, "Tage, MIN_REPS =", DEFAULTS.MIN_REPS);

P("Stufen", "nie geübt (keine Karte)", stufe(undefined), "noch_nicht_geuebt");
P("Stufen", "state 0 zählt als ungeübt", stufe({ ...karte(5, 1), state: 0 }), "noch_nicht_geuebt");
P("Stufen", "wenige Wiederholungen, kein Rückfall", stufe(karte(5, 1, 1, 0)), "neu");
P("Stufen", "S unter 3 Tagen", stufe(karte(2, 0.5, 5, 1)), "sitzt_schlecht");
P("Stufen", "S knapp unter 14", stufe(karte(13, 1, 5, 0)), "sitzt_fast");
P("Stufen", "S genau 14", stufe(karte(14, 1, 5, 0)), "sitzt");
P("Stufen", "S weit über 14", stufe(karte(60, 1, 8, 0)), "sitzt");
P("Stufen", "wenige Wiederholungen ABER Rückfall", stufe(karte(2, 0.5, 1, 1)), "sitzt_schlecht");

// Fälligkeit: interval = 9*S*(1/R - 1); bei R=0.9 also 1.0*S Tage
const p = (S, vorTagen) => deriveProfile(karte(S, vorTagen), 0.9, jetzt);
P("Fälligkeit", "frisch geübt, S=10", p(10, 0).istFaellig, false);
P("Fälligkeit", "genau am Fälligkeitstag", p(10, 10.01).istFaellig, true);
P("Fälligkeit", "kurz davor", p(10, 9).istFaellig, false);
P("Fälligkeit", "bald fällig (Puffer 2 Tage)", p(10, 8.5).baldFaellig, true);
P("Fälligkeit", "fällig ist NICHT bald fällig", p(10, 11).baldFaellig, false);
P("Fälligkeit", "Haltedauer entspricht S", Math.round(p(10, 0).interval), 10);

// Leech
const leech = (D, lapses) => deriveProfile(karte(2, 1, 6, lapses, D), 0.9, jetzt).istLeech;
P("Hartnäckig", `Schwierigkeit ${DEFAULTS.D_LEECH} und ${DEFAULTS.LAPSE_LEECH} Rückfälle`, leech(7, 3), true);
P("Hartnäckig", "Schwierigkeit zu niedrig", leech(6.9, 5), false);
P("Hartnäckig", "zu wenige Rückfälle", leech(8, 2), false);

// Ampel
const d = (sitzt, fast, rest) => ({ sitzt, sitzt_fast: fast, sitzt_schlecht: rest, neu: 0, noch_nicht_geuebt: 0 });
P("Ampel", "readyPercent zählt sitzt UND sitzt fast", readyPercent(d(5, 5, 10)), 50);
P("Ampel", "leere Liste", readyPercent(d(0, 0, 0)), 0);
P("Ampel", "95 % ist bereit", readyTone(95), "ok");
P("Ampel", "94 % ist auf Kurs", readyTone(94), "warn");
P("Ampel", "70 % ist auf Kurs", readyTone(70), "warn");
P("Ampel", "69 % ist im Rückstand", readyTone(69), "bad");
P("Ampel", "eigene Schwellen", readyTone(80, { readyGreen: 80 }), "ok");

for (const g of [...new Set(zeilen.map((z) => z.gruppe))]) {
  console.log("\n" + g);
  for (const z of zeilen.filter((x) => x.gruppe === g))
    console.log(`  ${z.gut ? "OK  " : "PRUEF"} ${z.was.padEnd(40)} ${z.ist}${z.gut ? "" : "   (angenommen " + z.erwartet + ")"}`);
}
console.log(`\n${ok} wie erwartet, ${fehl} anders`);
