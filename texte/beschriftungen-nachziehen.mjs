/* Traegt die beschlossenen Beschriftungen in den Quelltext. Ersetzt wird
   nur die vollstaendige Zeichenkette in Anfuehrungszeichen -- so trifft es
   den txt()-Aufruf und den gleichlautenden Schluessel in i18n.en.ts, aber
   kein Teilwort irgendwo im Programm. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const wurzel = decodeURIComponent(new URL("..", import.meta.url).pathname);
const B = JSON.parse(readFileSync(join(wurzel, "texte/synthese-b.json"), "utf8"));
const PAARE = B.filter(([, art, alt, neu]) => (art === "ja" || art === "angepasst") && neu && neu !== alt)
               .map(([, , alt, neu]) => [alt, neu]);

function* dateien(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!/node_modules|\bdata\b/.test(p)) yield* dateien(p); }
    else if (/\.(ts|tsx)$/.test(p)) yield p;
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ziele = [...dateien(join(wurzel, "src"))];
const gefunden = new Map(PAARE.map(([a]) => [a, 0]));

for (const f of ziele) {
  let s = readFileSync(f, "utf8");
  const vorher = s;
  for (const [alt, neu] of PAARE) {
    for (const q of ['"', "'"]) {
      const re = new RegExp(q + esc(alt) + q, "g");
      const treffer = (s.match(re) || []).length;
      if (treffer) { gefunden.set(alt, gefunden.get(alt) + treffer); s = s.replace(re, q + neu + q); }
    }
  }
  if (s !== vorher) { writeFileSync(f, s); console.log("  " + relative(wurzel, f)); }
}

const ohne = [...gefunden].filter(([, n]) => !n).map(([a]) => a);
console.log(`\n${PAARE.length} Paare · ${[...gefunden.values()].reduce((a, b) => a + b, 0)} Ersetzungen`);
if (ohne.length) { console.log("NICHT GEFUNDEN:"); for (const a of ohne) console.log("  " + JSON.stringify(a)); }
