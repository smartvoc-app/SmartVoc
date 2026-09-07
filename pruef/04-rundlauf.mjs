/* Prüfprotokoll 4: Was die App ausgibt, muss sie auch wieder einlesen. */
import { alsText, wortZeile, spalten, TRENNER } from "../src/lib/export.ts";
import { columns, zeileZuWort } from "../src/components/PasteModal.tsx";

let ok = 0, fehl = 0; const zeilen = [];
const P = (was, ist, erwartet) => { const gut = JSON.stringify(ist) === JSON.stringify(erwartet); gut ? ok++ : fehl++;
  zeilen.push({ was, ist: JSON.stringify(ist), erwartet: JSON.stringify(erwartet), gut }); };

const rund = (w, pair = "en-de", schluessel = "fgn") => {
  const text = alsText([w], pair, schluessel);
  return zeileZuWort(columns(text), pair === "la-de");
};

console.log("Spalten:", spalten("en-de", "Englisch").length, "\n");

/* 1 — voll ausgefülltes Wort */
const voll = { fgn: "dog", lernform: "", genus: "", wortart: "Nomen", de: "der Hund",
  examples: ["The dog barks.", "A big dog."], examplesDe: ["Der Hund bellt.", "Ein grosser Hund."], phonetic: "dɒɡ" };
const r1 = rund(voll);
P("voll: Fremdwort", r1.fgn, "dog");
P("voll: Deutsch", r1.de, "der Hund");
P("voll: Wortart", r1.wortart, "Nomen");
P("voll: Beispielsätze", r1.examples, ["The dog barks.", "A big dog."]);
P("voll: Übersetzungen", r1.examplesDe, ["Der Hund bellt.", "Ein grosser Hund."]);
P("voll: Aussprache", r1.phonetic, "dɒɡ");

/* 2 — das gewöhnliche Wort: nur Fremdwort und Deutsch */
const knapp = { fgn: "cat", de: "die Katze" };
const zeileKnapp = alsText([knapp], "en-de", "fgn");
console.log("Exportzeile knapp:", JSON.stringify(zeileKnapp));
console.log("nach columns():   ", JSON.stringify(columns(zeileKnapp)), "\n");
const r2 = rund(knapp);
P("knapp: Fremdwort", r2.fgn, "cat");
P("knapp: Deutsch bleibt erhalten", r2.de, "die Katze");
P("knapp: keine erfundene Aussprache", r2.phonetic || "", "");
P("knapp: keine erfundenen Beispielsätze", r2.examples || [], []);

/* 3 — Aussprache fehlt, sonst alles da */
const ohnePhon = { ...voll, phonetic: "" };
const r3 = rund(ohnePhon);
P("ohne Aussprache: Deutsch", r3.de, "der Hund");
P("ohne Aussprache: Wortart", r3.wortart, "Nomen");

/* 4 — Latein mit Lernform */
const lat = { grundform: "liber", lernform: "liber, librī, m.", wortart: "Nomen", de: "das Buch" };
const r4 = rund(lat, "la-de", "fgn");
P("Latein: Grundform", r4.grundform, "liber");
P("Latein: Lernform", r4.lernform, "liber, librī, m.");
P("Latein: Deutsch", r4.de, "das Buch");

/* 5 — Trennzeichen im Inhalt darf die Zeile nicht sprengen */
const mitStrich = { fgn: "either | or", de: "entweder | oder" };
const r5 = rund(mitStrich);
P("Pipe im Inhalt: Fremdwort", r5.fgn, "either / or");
P("Pipe im Inhalt: Deutsch", r5.de, "entweder / oder");

for (const z of zeilen) console.log(`  ${z.gut ? "OK   " : "FEHLER"} ${z.was.padEnd(38)} ${z.ist}${z.gut ? "" : "   erwartet " + z.erwartet}`);
console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
