/* ss -> ß in den beschreibenden Texten. Nur lange Vokale und Diphthonge:
   "heisst" wird "heißt", "muss" bleibt "muss". Wortstaemme, damit auch
   gebeugte Formen und Zusammensetzungen mitkommen -- aber mit Wortgrenze,
   damit "Grossvater" aus den Wortlisten unberuehrt bleibt.

   Die Abfrage ist davon nicht betroffen: scoring.ts behandelt ß und ss seit
   jeher als gleich (ueM === ceM), in beide Richtungen. Wer "Strasse"
   tippt, wo "Straße" steht, hat recht -- und umgekehrt. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const PAARE = [
  ["heisst", "heißt"], ["heissen", "heißen"], ["heissende", "heißende"],
  ["weiss", "weiß"], ["weisst", "weißt"], ["weissen", "weißen"],
  ["gross", "groß"], ["grosse", "große"], ["grossen", "großen"], ["grosser", "großer"],
  ["grosses", "großes"], ["grossem", "großem"], ["grösser", "größer"],
  ["grössere", "größere"], ["grösseren", "größeren"], ["grösserer", "größerer"],
  ["grösste", "größte"], ["grössten", "größten"], ["grösster", "größter"], ["grösstes", "größtes"],
  ["Gross", "Groß"], ["Grösse", "Größe"], ["Grössen", "Größen"],
  ["ausser", "außer"], ["ausserdem", "außerdem"], ["ausserhalb", "außerhalb"],
  ["äussere", "äußere"], ["äusseren", "äußeren"], ["äusserst", "äußerst"],
  ["ausschliesslich", "ausschließlich"], ["schliesslich", "schließlich"],
  ["schliessen", "schließen"], ["Schliessen", "Schließen"], ["schliesst", "schließt"],
  ["schliesse", "schließe"], ["geschlossen", "geschlossen"],
  ["regelmässig", "regelmäßig"], ["regelmässige", "regelmäßige"],
  ["regelmässigen", "regelmäßigen"], ["Regelmässigkeit", "Regelmäßigkeit"],
  ["unregelmässig", "unregelmäßig"], ["unregelmässige", "unregelmäßige"],
  ["unregelmässigen", "unregelmäßigen"],
  ["blosse", "bloße"], ["blossen", "bloßen"], ["blosses", "bloßes"], ["bloss", "bloß"],
  ["dreissig", "dreißig"], ["dreissiger", "dreißiger"],
  ["liess", "ließ"], ["liessen", "ließen"],
  ["sass", "saß"], ["sassen", "saßen"],
  ["zustösst", "zustößt"], ["stösst", "stößt"], ["stossen", "stoßen"],
  ["Fuss", "Fuß"], ["Fusszeile", "Fußzeile"],
  ["massgeblich", "maßgeblich"], ["Mass", "Maß"], ["Massnahme", "Maßnahme"],
  ["Massnahmen", "Maßnahmen"], ["gemäss", "gemäß"], ["Strasse", "Straße"],
];

/* Kein Wort dieser Liste darf Teil eines laengeren Wortes ersetzen:
   "Grossvater" und "Fussball" stehen in den Wortlisten und bleiben. */
const RE = new RegExp("(?<![A-Za-zÄÖÜäöüß])(" +
  PAARE.map(([a]) => a).sort((a, b) => b.length - a.length).join("|") +
  ")(?![A-Za-zÄÖÜäöüß])", "g");
const KARTE = Object.fromEntries(PAARE);

export function umstellen(text) { return text.replace(RE, (m) => KARTE[m] ?? m); }

function* dateien(dir, filter) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!/node_modules|\bdata\b|starter/.test(p)) yield* dateien(p, filter); }
    else if (filter.test(p)) yield p;
  }
}

if (process.argv[1].endsWith("scharfes-s.mjs")) {
  const wurzel = decodeURIComponent(new URL("..", import.meta.url).pathname);
  const ziele = [
    ...dateien(join(wurzel, "src"), /\.(ts|tsx)$/),
    join(wurzel, "public/datenschutz.html"),
    join(wurzel, "texte/synthese-a1.json"),
    join(wurzel, "texte/synthese-b.json"),
  ];
  let n = 0;
  for (const f of ziele) {
    const alt = readFileSync(f, "utf8"), neu = umstellen(alt);
    if (alt !== neu) {
      writeFileSync(f, neu);
      const treffer = [...alt.matchAll(RE)].length;
      console.log(`  ${relative(wurzel, f)}  (${treffer})`);
      n += treffer;
    }
  }
  console.log(`\n${n} Ersetzungen`);
}
