/* Prüfprotokoll 7: Tut der Schalter «Umlaute und Akzente streng», was er verspricht? */
import { scoreAnswer } from "../src/lib/scoring.ts";
const B = (u, c, o) => { const r = scoreAnswer(u, c, o); return `${r.verdict}/${r.score.toFixed(2)}/${r.errorType}`; };
const LOCKER = { strictAccents: false, acceptPartial: true, lenientCase: false };
const STRENG = { strictAccents: true,  acceptPartial: true, lenientCase: false };

const faelle = [
  ["grun", "grün", "nur ein fehlender Umlaut"],
  ["ecole", "école", "nur ein fehlender Akzent"],
  ["Fruhstuck", "Frühstück", "zwei fehlende Umlaute"],
  ["cafe", "café", "fehlender Akzent am Ende"],
];
console.log("Antwort      Lösung        locker              streng");
for (const [u, c, was] of faelle)
  console.log(`${u.padEnd(12)} ${c.padEnd(13)} ${B(u,c,LOCKER).padEnd(20)}${B(u,c,STRENG)}   (${was})`);

console.log("\nGegenprobe — streng darf sonst nichts kaputt machen:");
for (const [u, c, was] of [["grün","grün","richtig"],["grüm","grün","echter Tippfehler"],["blau","grün","ganz daneben"]])
  console.log(`${u.padEnd(12)} ${c.padEnd(13)} ${B(u,c,LOCKER).padEnd(20)}${B(u,c,STRENG)}   (${was})`);
