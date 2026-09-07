/* Der lange Gedankenstrich raus.
 *
 * Im Deutschen ist er ohnehin falsch -- dort steht ein kurzer, und meistens
 * genuegt ein Komma, ein Doppelpunkt oder ein Punkt. Gehaeuft liest er sich
 * wie maschinell geschrieben, und das soll die App nicht.
 *
 * Jede Stelle einzeln entschieden: Aufzaehlung bekommt einen Doppelpunkt,
 * Einschub ein Komma, zwei Aussagen einen Punkt. Zahlenbereiche ("1-2 Wo.")
 * behalten den kurzen Strich, der gehoert dort hin. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PAARE = [
  ["Abbrechen — leer starten", "Abbrechen, leer starten"],
  ["Als Treffer zählt jede Antwort, die nicht ganz daneben war — ein fehlender Akzent oder ein Buchstabendreher also auch.",
   "Als Treffer zählt jede Antwort, die nicht ganz daneben war. Ein fehlender Akzent oder ein Buchstabendreher zählt also auch."],
  ["Die Beispielsätze eines Wortes stehen auf der Lösungsseite der Karte — der Satz in der Fremdsprache und darunter seine Übersetzung.",
   "Die Beispielsätze eines Wortes stehen auf der Lösungsseite der Karte: der Satz in der Fremdsprache und darunter seine Übersetzung."],
  ["Angesehen ist noch nicht gelernt — wechsle zu einer Antwortart, die zählt.",
   "Angesehen ist noch nicht gelernt. Wechsle zu einer Antwortart, die zählt."],
  ["Fast — Schreibweise der Stammformen prüfen", "Fast: Schreibweise der Stammformen prüfen"],
  ["Gerät auf dieses Konto umgestellt — die vorherigen Daten liegen als Sicherung auf dem Gerät.",
   "Gerät auf dieses Konto umgestellt. Die vorherigen Daten liegen als Sicherung auf dem Gerät."],
  ["Jetzt fällig — der beste Moment zum Auffrischen", "Jetzt fällig, der beste Moment zum Auffrischen"],
  ["Liste nicht gefunden — Code prüfen.", "Liste nicht gefunden. Bitte den Code prüfen."],
  ["Lege oben eine an — oder üb mit dem Grundwortschatz.", "Lege oben eine an, oder üb mit dem Grundwortschatz."],
  ["OK — in dieses Konto übernehmen", "OK, in dieses Konto übernehmen"],
  ["Offline — wird nachgeholt", "Ohne Netz, wird nachgeholt"],
  ["Richtig — die Längenstriche sind in der Lösung rot markiert",
   "Richtig. Die Längenstriche sind in der Lösung rot markiert"],
  ["Sync-Problem — Wiederholung folgt", "Abgleich fehlgeschlagen, neuer Versuch folgt"],
  ["und fragt seltener nach — das ist riskanter.", "und fragt seltener nach. Das ist riskanter."],
  ["Zurück zur Liste — dort stehen die Wege, sie zu füllen.",
   "Zurück zur Liste. Dort stehen die Wege, sie zu füllen."],
  ["abtippen, einfügen — oder von deiner KI-App aus einem Foto erstellen lassen",
   "abtippen, einfügen oder von deiner KI-App aus einem Foto erstellen lassen"],
  ["baut sich auf — ab heute füllt sich diese Linie", "baut sich auf, ab heute füllt sich diese Linie"],
  ["xlsx ist im iOS-Bündel nicht enthalten — Tabellen gibt es nur im Web",
   "xlsx ist im iOS-Bündel nicht enthalten. Tabellen gibt es nur im Web"],
];

function* dateien(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!/node_modules|\bdata\b/.test(p)) yield* dateien(p); }
    else if (/\.(ts|tsx)$/.test(p)) yield p;
  }
}

const wurzel = decodeURIComponent(new URL("..", import.meta.url).pathname);
const zaehler = new Map(PAARE.map(([a]) => [a, 0]));
for (const f of dateien(join(wurzel, "src"))) {
  let s = readFileSync(f, "utf8");
  const vorher = s;
  for (const [a, b] of PAARE) {
    if (!s.includes(a)) continue;
    zaehler.set(a, zaehler.get(a) + s.split(a).length - 1);
    s = s.split(a).join(b);
  }
  if (s !== vorher) { writeFileSync(f, s); console.log("  " + relative(wurzel, f)); }
}
const ohne = [...zaehler].filter(([, n]) => !n).map(([a]) => a);
console.log(`\n${[...zaehler.values()].reduce((a, b) => a + b, 0)} Ersetzungen`);
if (ohne.length) { console.log("NICHT GEFUNDEN:"); for (const a of ohne) console.log("  " + a.slice(0, 70)); }
