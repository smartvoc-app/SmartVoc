/* Prüfprotokoll 6: Ist die englische Fassung vollständig und aktuell? */
import fs from "node:fs";
import { EN } from "../src/lib/i18n.en.ts";

const de = JSON.parse(fs.readFileSync("texte/texte.json", "utf8"));
const flach = (v, raus = []) => { if (typeof v === "string") raus.push(v);
  else if (Array.isArray(v)) v.forEach((x) => flach(x, raus));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => flach(x, raus)); return raus; };

const oberflaeche = [...new Set(flach(de.oberflaeche))].filter((s) => s.trim());
const fehlt = oberflaeche.filter((s) => !(s in EN));
const unbenutzt = Object.keys(EN).filter((k) => !oberflaeche.includes(k));

console.log(`Oberflächentexte deutsch : ${oberflaeche.length}`);
console.log(`Einträge in i18n.en.ts   : ${Object.keys(EN).length}`);
console.log(`ohne englische Fassung   : ${fehlt.length}`);
console.log(`englisch ohne deutsches Gegenstück : ${unbenutzt.length}\n`);

if (fehlt.length) { console.log("OHNE ÜBERSETZUNG:"); fehlt.slice(0, 40).forEach((s) => console.log("  · " + s.slice(0, 100))); console.log(); }

/* Deutsche Reste im englischen Wert — der Fehler, der schon zweimal auftrat. */
const UMLAUT = /[äöüßÄÖÜ]/;
const DE_WORT = /\b(der|die|das|und|nicht|Wörter|Wortliste|Übung|Einstellung|dein|deine|wird|kann|schon|noch|auch|mehr|dann|wenn|beim|zum|zur|vom)\b/;
const verdaechtig = Object.entries(EN).filter(([k, v]) =>
  typeof v === "string" && v.trim() && (UMLAUT.test(v) || DE_WORT.test(v)));
console.log(`Englische Werte mit deutschen Spuren: ${verdaechtig.length}`);
verdaechtig.slice(0, 25).forEach(([k, v]) => console.log(`  · ${k.slice(0, 45)}  →  ${String(v).slice(0, 60)}`));

/* Identisch zum Deutschen — meist vergessen, manchmal absichtlich (Namen, Zahlen) */
const gleich = Object.entries(EN).filter(([k, v]) => k === v && k.length > 18);
console.log(`\nEnglisch identisch zum Deutschen (>18 Zeichen): ${gleich.length}`);
gleich.slice(0, 20).forEach(([k]) => console.log("  · " + k.slice(0, 80)));

/* Platzhalter müssen in beiden Fassungen dieselben sein */
const PH = (s) => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(",");
const phFehler = Object.entries(EN).filter(([k, v]) => typeof v === "string" && PH(k) !== PH(v));
console.log(`\nPlatzhalter stimmen nicht überein: ${phFehler.length}`);
phFehler.forEach(([k, v]) => console.log(`  · «${k}» [${PH(k)}]  →  «${v}» [${PH(v)}]`));

/* ---- Der teuerste Fehler: Übersetzung vorhanden, aber nie abgerufen ---- */
const ohne = JSON.parse(fs.readFileSync("texte/ohne-txt.json", "utf8"));
const roh = Array.isArray(ohne) ? ohne
  : Object.entries(ohne).flatMap(([datei, liste]) =>
      (Array.isArray(liste) ? liste : []).map((x) => ({ datei, text: typeof x === "string" ? x : x.text })));
const stumm = roh.filter((r) => r.text && (r.text in EN));
console.log(`\n\nÜbersetzt, aber ohne txt() ausgegeben: ${stumm.length}`);
const proDatei = {};
for (const r of stumm) (proDatei[r.datei] ||= []).push(r.text);
for (const [d, liste] of Object.entries(proDatei)) {
  console.log(`\n  ${d}  (${liste.length})`);
  liste.slice(0, 8).forEach((t) => console.log("    · " + t.slice(0, 78)));
  if (liste.length > 8) console.log(`    … und ${liste.length - 8} weitere`);
}
