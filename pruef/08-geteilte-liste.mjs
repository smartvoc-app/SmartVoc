/* Prüfprotokoll 8: Eine übernommene Liste muss enthalten, was geteilt wurde —
 * auch dann, wenn der Empfänger dieselben Wörter schon besitzt. */
import XLSX from "xlsx";
import { importPlan } from "../src/lib/export.ts";

const lies = (f) => { const wb = XLSX.readFile(f); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); };
const D = "/Users/martinkeller/Downloads/";
const original  = lies(D + "smartvoc-grundwortschatz-en-stufe-1 (1).xlsx");   // 100, alle Felder
const fremdlist = lies(D + "smartvoc-grundwortschatz-en-stufe-1.xlsx");       // 133, andere Wörter

/* Aus einer Tabellenzeile die Form, die auch geteilt wird. */
const alsWort = (r) => ({ en: r.Englisch, de: r.Deutsch, wortart: r.Wortart, genus: r.Genus,
  lernform: r.Formen, phonetic: r.Aussprache,
  examples: [r["Beispielsatz 1"], r["Beispielsatz 2"]].filter(Boolean),
  examplesDe: [r["Beispielsatz 1 deutsch"], r["Beispielsatz 2 deutsch"]].filter(Boolean) });
const alsBestand = (rows, id0) => rows.map((r, i) => ({ ...alsWort(r), id: "w" + (id0 + i), pair: "en-de", lists: ["alt"] }));

const geteilt = original.map(alsWort);
let ok = 0, fehl = 0;
const P = (was, ist, erw) => { const gut = String(ist) === String(erw); gut ? ok++ : fehl++;
  console.log(`  ${gut ? "OK   " : "FEHLER"} ${was.padEnd(56)} ${ist}${gut ? "" : "   erwartet " + erw}`); };

/* Fall 1 — leerer Bestand */
{ const { neu, dazu } = importPlan(geteilt, [], "en-de", "neu1", false, "en");
  P("leerer Bestand: alle Wörter neu", neu.length, 100);
  P("leerer Bestand: Liste hat 100 Wörter", neu.length + dazu.length, 100);
  P("Felder bleiben erhalten (Aussprache)", neu[0].phonetic, "ˈfæməli");
  P("Felder bleiben erhalten (Beispielsatz)", neu[0].examples[0], "My family lives in Switzerland."); }

/* Fall 2 — IHR Fall: Empfänger hat dieselbe Liste schon */
{ const bestand = alsBestand(original, 0);
  const { neu, dazu } = importPlan(geteilt, bestand, "en-de", "neu2", false, "en");
  P("gleiche Liste vorhanden: nichts doppelt angelegt", neu.length, 0);
  P("gleiche Liste vorhanden: Liste bekommt 100 Wörter", neu.length + dazu.length, 100);
  P("die vorhandenen Wörter werden zugeordnet", dazu.length, 100); }

/* Fall 3 — Empfänger hat einen anderen Bestand (die 133 Wörter) */
{ const bestand = alsBestand(fremdlist, 500);
  const { neu, dazu } = importPlan(geteilt, bestand, "en-de", "neu3", false, "en");
  P("anderer Bestand: alle 100 sind neu", neu.length, 100);
  P("anderer Bestand: nichts fälschlich zugeordnet", dazu.length, 0); }

/* Fall 4 — teilweise Überschneidung */
{ const bestand = alsBestand(original.slice(0, 40), 900);
  const { neu, dazu } = importPlan(geteilt, bestand, "en-de", "neu4", false, "en");
  P("40 bekannt, 60 neu: angelegt", neu.length, 60);
  P("40 bekannt, 60 neu: zugeordnet", dazu.length, 40);
  P("40 bekannt, 60 neu: Liste vollständig", neu.length + dazu.length, 100); }

/* Fall 5 — andere Sprache im Bestand darf nicht dazwischenfunken */
{ const bestand = alsBestand(original, 700).map((w) => ({ ...w, pair: "fr-de" }));
  const { neu, dazu } = importPlan(geteilt, bestand, "en-de", "neu5", false, "en");
  P("gleiche Wörter in anderer Sprache: trotzdem neu", neu.length, 100);
  P("gleiche Wörter in anderer Sprache: nicht zugeordnet", dazu.length, 0); }

console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
