/* Prüfprotokoll 9: Die Regel «ein Wort, eine Liste» — jetzt im Modell.
 *
 * Seit v2 trägt ein Wort `listId: string`, ein Pflichtfeld. Zwei Listen an
 * einem Wort sind damit nicht mehr darstellbar; geprüft wird, was übrig
 * bleibt: dass jede Id auf eine Liste zeigt, die es gibt. */
import { importPlan } from "../src/lib/export.ts";

const pruefe = (vocab, lists, was, sollGesund = true) => {
  const gueltig = new Set(lists.map((l) => l.id));
  const ohne = vocab.filter((w) => !w.listId || !gueltig.has(w.listId));
  const doppelt = vocab.map((w) => w.id).filter((id, i, a) => a.indexOf(id) !== i);
  const summe = lists.reduce((n, l) => n + vocab.filter((w) => w.listId === l.id).length, 0);
  const gesund = !ohne.length && !doppelt.length && summe === vocab.length;
  const gut = gesund === sollGesund;
  console.log(`  ${gut ? "OK   " : "FEHLER"} ${was.padEnd(50)} ${vocab.length} Wörter, Summe der Listen ${summe}` +
    (ohne.length ? `, ${ohne.length} ohne gültige Liste` : "") +
    (doppelt.length ? `, ${doppelt.length} doppelte Ids` : ""));
  return gut;
};

let ok = 0, fehl = 0; const z = (g) => g ? ok++ : fehl++;
const listen = [{ id: "L1" }, { id: "L2" }];

/* Ein gesunder Bestand */
const gesund = [...Array.from({ length: 30 }, (_, i) => ({ id: "a" + i, listId: "L1" })),
                ...Array.from({ length: 20 }, (_, i) => ({ id: "b" + i, listId: "L2" }))];
z(pruefe(gesund, listen, "50 Wörter auf zwei Listen"));

/* Die Zustände, die das alte Modell zuliess, muss der Melder erkennen */
z(pruefe([...gesund, { id: "x", listId: "" }], listen, "Wort ohne Liste wird erkannt", false));
z(pruefe([...gesund, { id: "y", listId: "geloescht" }], listen, "Wort mit toter Listen-Id wird erkannt", false));
z(pruefe([...gesund, { id: "a0", listId: "L2" }], listen, "doppelte Wort-Id wird erkannt", false));

/* Eine übernommene Liste ist eine Kopie — jedes Wort in genau der neuen Liste */
const geteilt = Array.from({ length: 40 }, (_, i) => ({ en: "w" + i, de: "W " + i }));
const kopie = importPlan(geteilt, "en-de", "L1").neu.map((w, i) => ({ ...w, id: "k" + i }));
z(pruefe(kopie, listen, "übernommene Liste"));
console.log(`  ${kopie.every((w) => w.listId === "L1") ? "OK   " : "FEHLER"} ${"jedes Wort trägt die neue Liste".padEnd(50)} ${kopie.every((w) => w.listId === "L1")}`);
kopie.every((w) => w.listId === "L1") ? ok++ : fehl++;

/* Zweimal übernommen: zwei getrennte Kopien, keine gemeinsamen Ids */
const a = importPlan(geteilt, "en-de", "L1").neu.map((w, i) => ({ ...w, id: "a" + i }));
const b = importPlan(geteilt, "en-de", "L2").neu.map((w, i) => ({ ...w, id: "b" + i }));
z(pruefe([...a, ...b], listen, "zweimal übernommen: 80 eigenständige Wörter"));

console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
