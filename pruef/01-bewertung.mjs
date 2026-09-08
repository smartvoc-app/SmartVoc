/* Prüfprotokoll 1: Antwortbewertung, gegen die ECHTEN Vorgaben der App.
   scoreAnswer ohne Angaben nimmt lenientCase=true an; Practice uebergibt aber
   settings.lenientCase (Vorgabe false). Wer mit {} prueft, misst das Gegenteil. */
import { scoreAnswer } from "../src/lib/scoring.ts";
import { RECOMMENDED } from "../src/lib/defaults.ts";

const V = {
  lenientCase: RECOMMENDED.lenientCase,
  strictAccents: RECOMMENDED.strictAccents,
  articleMode: RECOMMENDED.articleMode,
  acceptPartial: RECOMMENDED.acceptPartial,
};
let ok = 0, fehl = 0; const faelle = [];
const P = (gruppe, was, user, correct, extra, erwartet) => {
  const r = scoreAnswer(user, correct, { ...V, ...(extra || {}) });
  const ist = `${r.verdict}/${Math.round(r.score * 100) / 100}`;
  const gut = ist === erwartet; gut ? ok++ : fehl++;
  faelle.push({ gruppe, was, eingabe: user, erwartet, ist, gut });
};

P("Grundfall", "exakt", "la maison", "la maison", {}, "correct/1");
P("Grundfall", "Leerzeichen aussen", "  la maison  ", "la maison", {}, "correct/1");
P("Grundfall", "doppelte Leerzeichen innen", "la  maison", "la maison", {}, "correct/1");
P("Grundfall", "leere Antwort", "", "la maison", {}, "wrong/0");
P("Grundfall", "voellig anderes Wort", "le chien", "la maison", {}, "wrong/0");

P("Schreibung", "klein statt gross zaehlt (Vorgabe)", "haus", "Haus", {}, "almost/0.7");
P("Schreibung", "nachsichtig gestellt", "haus", "Haus", { lenientCase: true }, "correct/1");

P("ss/ß", "ss getippt, Loesung ß", "Strasse", "Straße", {}, "correct/1");
P("ss/ß", "ß getippt, Loesung ss", "Straße", "Strasse", {}, "correct/1");

P("Akzente", "fehlt, Vorgabe nachsichtig", "ecole", "école", {}, "almost/0.7");
P("Akzente", "fehlt, streng gestellt", "ecole", "école", { strictAccents: true }, "wrong/0");
P("Akzente", "Umlaut fehlt, streng gestellt", "grun", "grün", { strictAccents: true }, "wrong/0");

P("Artikel", "fehlt, Vorgabe halber Abzug", "maison", "la maison", {}, "almost/0.7");
P("Artikel", "fehlt, freiwillig", "maison", "la maison", { articleMode: "optional" }, "correct/1");
P("Artikel", "fehlt, voll verlangt", "maison", "la maison", { articleMode: "required-full" }, "wrong/0");
P("Artikel", "falscher Artikel", "le maison", "la maison", {}, "almost/0.7");
P("Artikel", "ueberzaehlig, Loesung ohne", "the family", "family", {}, "correct/1");

P("Tippfehler", "ein Buchstabe daneben", "la maisin", "la maison", {}, "almost/0.7");
P("Tippfehler", "ein Buchstabe fehlt", "la maisn", "la maison", {}, "almost/0.7");
P("Tippfehler", "zu weit weg", "xyz", "la maison", {}, "wrong/0");
P("Tippfehler", "Teilpunkte abgeschaltet", "la maisin", "la maison", { acceptPartial: false }, "wrong/0");

for (const g of [...new Set(faelle.map((f) => f.gruppe))]) {
  console.log("\n" + g);
  for (const f of faelle.filter((x) => x.gruppe === g))
    console.log(`  ${f.gut ? "OK  " : "PRUEF"} ${f.was.padEnd(34)} "${f.eingabe}" -> ${f.ist}${f.gut ? "" : "   (angenommen " + f.erwartet + ")"}`);
}
console.log(`\n${ok} wie erwartet, ${fehl} anders`);
