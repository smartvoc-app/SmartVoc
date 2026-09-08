/* Prüfprotokoll 8: Eine übernommene Liste ist eine echte Kopie.
 * Ein Wort gehört in genau eine Liste (V18) — also wird kopiert, nicht verknüpft. */
import XLSX from "xlsx";
import { importPlan } from "../src/lib/export.ts";

const lies = (f) => { const wb = XLSX.readFile(f); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); };
const original = lies("/Users/martinkeller/Downloads/smartvoc-grundwortschatz-en-stufe-1 (1).xlsx");
const alsWort = (r) => ({ en: r.Englisch, de: r.Deutsch, wortart: r.Wortart,
  phonetic: r.Aussprache,
  examples: [r["Beispielsatz 1"], r["Beispielsatz 2"]].filter(Boolean),
  examplesDe: [r["Beispielsatz 1 deutsch"], r["Beispielsatz 2 deutsch"]].filter(Boolean) });
const geteilt = original.map(alsWort);

let ok = 0, fehl = 0;
const P = (was, ist, erw) => { const gut = String(ist) === String(erw); gut ? ok++ : fehl++;
  console.log(`  ${gut ? "OK   " : "FEHLER"} ${was.padEnd(56)} ${ist}${gut ? "" : "   erwartet " + erw}`); };

const { neu } = importPlan(geteilt, "en-de", "L-neu");
P("die Liste bekommt alle geteilten Wörter", neu.length, 100);
P("jedes Wort liegt in genau EINER Liste", neu.every((w) => w.lists.length === 1), true);
P("und zwar in der neuen", neu.every((w) => w.lists[0] === "L-neu"), true);
P("Sprachpaar gesetzt", neu.every((w) => w.pair === "en-de"), true);
P("Felder bleiben erhalten (Aussprache)", neu[0].phonetic, "ˈfæməli");
P("Felder bleiben erhalten (Beispielsatz)", neu[0].examples[0], "My family lives in Switzerland.");
P("Übersetzung des Beispielsatzes", neu[0].examplesDe[0], "Meine Familie lebt in der Schweiz.");
P("Wortart", neu[0].wortart, "Nomen");
P("nichts als bereits geprüft markiert", neu.every((w) => w.review === false), true);
P("Herkunft vermerkt", neu[0].source, "import");

/* Dieselbe Liste zweimal übernehmen: zwei vollständige, getrennte Kopien. */
const a = importPlan(geteilt, "en-de", "L-a").neu;
const b = importPlan(geteilt, "en-de", "L-b").neu;
P("zweimal übernommen: beide Listen vollständig", a.length + "/" + b.length, "100/100");
P("die Kopien teilen sich keine Liste", a.every((w) => w.lists[0] === "L-a") && b.every((w) => w.lists[0] === "L-b"), true);

/* Leere Freigabe darf nicht stolpern. */
P("leere Liste", importPlan([], "en-de", "L-x").neu.length, 0);
P("fehlende Wortliste", importPlan(undefined, "en-de", "L-x").neu.length, 0);

console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
