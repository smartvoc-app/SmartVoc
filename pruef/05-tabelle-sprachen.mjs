/* Prüfprotokoll 5: Erkennt der Excel-Einleser die eigene Vorlage?
 * Und: hat jedes Sprachpaar vollständige Angaben?
 * Die Suchmuster stehen wörtlich so in WordList.tsx:141-167. */
import { spalten } from "../src/lib/export.ts";
import { PAIRS, isLatinPair } from "../src/lib/pairs.ts";

let ok = 0, fehl = 0; const zeilen = [];
const P = (was, ist, erwartet) => { const gut = String(ist) === String(erwartet); gut ? ok++ : fehl++;
  zeilen.push({ was, ist: String(ist), erwartet: String(erwartet), gut }); };

const findKey = (keys, re) => keys.find((k) => re.test(k));
const istDeutsch = (k) => /deutsch|german|übersetz|uebersetz/i.test(k);
const spalte = (keys, re, deutsch) => keys.find((k) => re.test(k) && istDeutsch(k) === deutsch);

for (const [pair, def] of Object.entries(PAIRS)) {
  const kopf = spalten(pair, def.foreignLabel);
  const RE1 = /beispiel.*1|example.*1|satz.*1/i, RE2 = /beispiel.*2|example.*2|satz.*2/i;
  const gefunden = {
    Deutsch: findKey(kopf, /germ|deut|^de$/i),
    Aussprache: findKey(kopf, /ausspr|phonet|lautschr|pronunc|ipa/i),
    Formen: findKey(kopf, /lernform|stammform|formen/i),
    Wortart: findKey(kopf, /wortart|wort.?art|^art$|pos/i),
    Genus: findKey(kopf, /^genus$|geschlecht|gender/i),
    "Beispielsatz 1": spalte(kopf, RE1, false),
    "Beispielsatz 1 deutsch": spalte(kopf, RE1, true),
    "Beispielsatz 2": spalte(kopf, RE2, false),
    "Beispielsatz 2 deutsch": spalte(kopf, RE2, true),
  };
  for (const [soll, ist] of Object.entries(gefunden)) P(`${pair}: Spalte «${soll}»`, ist, soll);

  const belegt = new Set(Object.values(gefunden).filter(Boolean));
  const kopfK = kopf.find((k) => k.trim().toLowerCase() === def.foreignLabel.toLowerCase())
    || findKey(kopf, /grundform|fremdsprache|^wort$|eng|fran|fren|espa|itali|portug|latein|^fr$|^en$|^es$|^it$|^pt$|^la$/i)
    || kopf.find((k) => !belegt.has(k));
  P(`${pair}: erste Spalte = «${def.foreignLabel}»`, kopfK, def.foreignLabel);

  P(`${pair}: Name gesetzt`, !!def.foreignLabel, true);
  P(`${pair}: Beispielzeile im Einfügen-Fenster`, !!def.foreignLabel, true);
}

console.log("Sprachpaare:", Object.keys(PAIRS).join(", "));
console.log("Latein erkannt:", Object.keys(PAIRS).filter(isLatinPair).join(", ") || "(keines)", "\n");
for (const z of zeilen) if (!z.gut) console.log(`  FEHLER ${z.was.padEnd(46)} ${z.ist}   erwartet ${z.erwartet}`);
console.log(`${ok} in Ordnung, ${fehl} fehlerhaft`);
