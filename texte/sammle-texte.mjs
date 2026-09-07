/* Sammelt ALLE deutschen Texte der App in texte.json.
 *
 * Frueher war diese Liste von Hand zusammengetragen. Das ging einmal gut
 * und war danach sofort veraltet: jede neue Beschriftung fehlte, und
 * niemand merkte es. Jetzt liest ein Skript die Quellen.
 *
 * Drei Herkuenfte:
 *   Prosa      help.de.tsx  -- Anleitung, Lerntipps, "Dahinter"
 *   Recht      recht.ts     -- Datenschutz und Impressum, schon als Daten
 *   Oberflaeche  alle txt("...")-Aufrufe, nach Datei gruppiert
 *
 *   node texte/sammle-texte.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, "..");
const lies = (p) => readFileSync(join(wurzel, p), "utf8");

/* ---------------------------------------------------------------- Prosa */

/* Eine Zeichenkette in TypeScript, mit Maskierungen. Ein blosses /"([^"]*)"/
 * bricht an jedem \" im Text ab -- und die gibt es in der Prosa. */
/* Was hinter einem Backslash steht. Ohne diese Tabelle landete "\n" als
 * Buchstabe "n" im Text -- im Dokument stand "der Hundnliber" statt zweier
 * Zeilen. Der Umbruch wird zum Leerzeichen, weil eine Beschriftung im
 * Dokument einzeilig steht. */
const ENTKOMMEN = { n: " ", r: " ", t: " " };

function zeichenkette(s, i) {
  const q = s[i];
  let out = "", j = i + 1;
  while (j < s.length) {
    if (s[j] === "\\") { out += ENTKOMMEN[s[j + 1]] ?? s[j + 1]; j += 2; continue; }
    if (s[j] === q) return { text: out, ende: j + 1 };
    out += s[j++];
  }
  return { text: out, ende: j };
}

const entitaeten = (t) => t
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\{"\s*"\}/g, " ").replace(/\{'\s*'\}/g, " ");

/* JSX-Prosa in Klartext: Auszeichnungen raus, Text behalten. Ein <br /> ist
 * ein Zeilenumbruch im Satz und wird zu einem Leerzeichen -- im Dokument
 * steht der Satz am Stueck, und wer ihn aendert, aendert ihn als Satz. */
const nurText = (t) => entitaeten(t)
  .replace(/<br\s*\/?>/g, " ")
  .replace(/<\/?[A-Za-z][^>]*>/g, "")
  .replace(/\s+/g, " ")
  .trim();

function kapitelAus(quelle, name) {
  const s = lies(quelle);
  const start = s.indexOf(`export const ${name}`);
  if (start < 0) return [];
  // bis zum naechsten export auf Spaltenanfang
  const rest = s.slice(start);
  const ende = rest.slice(1).search(/\nexport const /);
  const block = ende < 0 ? rest : rest.slice(0, ende + 1);

  const kapitel = [];
  const reTitel = /titel:\s*"/g;
  let m;
  while ((m = reTitel.exec(block))) {
    const t = zeichenkette(block, m.index + m[0].length - 1);
    const abschnitt = block.slice(t.ende, (() => {
      reTitel.lastIndex = t.ende;
      const n = reTitel.exec(block);
      reTitel.lastIndex = m.index + 1;
      return n ? n.index : block.length;
    })());
    const teile = [];
    /* Beschriftung einer Skizze und Absaetze, in der Reihenfolge, in der
     * sie im Kapitel stehen. */
    /* Absaetze, Listenpunkte und die Beschriftung einer Skizze -- in der
     * Reihenfolge, in der sie im Kapitel stehen. Die Listenpunkte fehlten
     * zuerst; damit fiel im ersten Kapitel die eigentliche Anleitung weg. */
    const re = /(?:titel="([^"]*)")|(?:<p\b[^>]*>([\s\S]*?)<\/p>)|(?:<li\b[^>]*>([\s\S]*?)<\/li>)/g;
    let x;
    while ((x = re.exec(abschnitt))) {
      if (x[1] != null) teile.push(["S", nurText(x[1])]);
      else if (x[2] != null) { const p = nurText(x[2]); if (p) teile.push(["P", p]); }
      else { const l = nurText(x[3]); if (l) teile.push(["L", l]); }
    }
    kapitel.push([t.text, teile]);
  }
  return kapitel;
}

function tippsAus(quelle) {
  const s = lies(quelle);
  const start = s.indexOf("export const TIPPS_DE");
  const block = s.slice(start, s.indexOf("export const ANLEITUNG_DE"));
  const out = [];
  const re = /\{\s*h:\s*"/g;
  let m;
  while ((m = re.exec(block))) {
    const h = zeichenkette(block, m.index + m[0].length - 1);
    const bi = block.indexOf('b: "', h.ende);
    const b = zeichenkette(block, bi + 3);
    out.push([h.text, b.text]);
    re.lastIndex = b.ende;
  }
  return out;
}

/* ----------------------------------------------------------- Rechtstexte */

function rechtAus(name) {
  const s = lies("src/lib/recht.ts");
  /* Mit Doppelpunkt suchen: sonst trifft "DATENSCHUTZ" zuerst die Zeile
   * DATENSCHUTZ_URL, und der Block ist eine URL statt der Texte. */
  const start = s.indexOf(`export const ${name}:`);
  const rest = s.slice(start);
  const ende = rest.slice(1).search(/\nexport const /);
  const block = ende < 0 ? rest : rest.slice(0, ende + 1);
  const out = [];
  const re = /(\bh:\s*")|(\bp:\s*\[)/g;
  let m;
  while ((m = re.exec(block))) {
    if (m[1]) { const t = zeichenkette(block, m.index + m[0].length - 1); out.push(["H", t.text]); re.lastIndex = t.ende; continue; }
    // p: [ "…", "…" ]
    let i = m.index + m[0].length;
    while (i < block.length && block[i] !== "]") {
      if (block[i] === '"') { const t = zeichenkette(block, i); out.push(["P", t.text]); i = t.ende; continue; }
      i++;
    }
    re.lastIndex = i;
  }
  return out;
}

/* ---------------------------------------------------------- Oberflaeche */

const BEREICH = {
  "src/App.tsx": "Rahmen und Reiter",
  "src/components/Practice.tsx": "Üben",
  "src/components/PlanTab.tsx": "Übungsplan",
  "src/components/WordList.tsx": "Wortlisten",
  "src/components/Stats.tsx": "Statistik",
  "src/components/SettingsTab.tsx": "Einstellungen",
  "src/components/Help.tsx": "Hilfe (Rahmen)",
  "src/components/AccountModal.tsx": "Konto",
  "src/components/ImportShareModal.tsx": "Geteilte Liste übernehmen",
  "src/components/PasteModal.tsx": "Liste einfügen und KI-Prompt",
  "src/components/ReviewModal.tsx": "Wörter prüfen",
  "src/components/ShareModal.tsx": "Teilen",
  "src/components/WordDetailModal.tsx": "Wort im Detail",
  "src/components/FsrsValuesModal.tsx": "Erweiterte Werte",
  "src/components/ListPicker.tsx": "Listenwahl",
  "src/components/TipPopup.tsx": "Lerntipp-Einblendung",
  "src/components/UeberModal.tsx": "Über SmartVoc",
  "src/lib/anzeige.ts": "Anzeige-Einstellungen",
  "src/lib/export.ts": "Spalten und Wortarten",
  "src/lib/smartlists.ts": "Smart Lists",
  "src/lib/stufen.ts": "Lernstufen",
  "src/lib/readiness.ts": "Ampel",
  "src/lib/defaults.ts": "Voreinstellungen",
  "src/lib/plan.ts": "Gratis und Pro",
  "src/lib/pairs.ts": "Sprachen",
  "src/ui/WahlPille.tsx": "Auswahlpillen",
  "src/ui/Bestaetigen.tsx": "Rückfragen",
  "src/ui/LernstandBlock.tsx": "Lernstand",
  "src/ui/MasteryBar.tsx": "Lernstandsleiste",
  "src/ui/ScreenHead.tsx": "Kopfzeile",
  "src/ui/PairPill.tsx": "Sprachpille",
  "src/ui/Toast.tsx": "Rückmeldungen",
  "src/ui/LatinKeys.tsx": "Lateinische Sonderzeichen",
  "src/ui/Startbild.tsx": "Startbild",
  "src/ui/Kritzel.tsx": "Beschriftungen in den Zeichnungen",
  "src/sync/auth.tsx": "Anmeldung",
  "src/sync/SyncBridge.tsx": "Abgleich mit dem Konto",
  "src/lib/statistik.ts": "Statistik (Auswertungen)",
  "src/lib/latin.ts": "Latein",
  "src/lib/fsrs.ts": "Lernmodell",
  "src/lib/migrate.ts": "Umbauten an alten Daten",
  "src/lib/runqueue.ts": "Rundensteuerung",
  "src/store/StoreProvider.tsx": "Datenhaltung",
};

/* Kommentare weg, bevor irgendetwas gesucht wird. Sonst landen die
 * Erklaerungen im Programmtext im Dokument -- und die sind zwar deutsch,
 * aber niemand liest sie in der App. */
function ohneKommentare(s) {
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === '"' || c === "'" || c === "`") {          // Zeichenkette am Stueck
      let j = i + 1;
      while (j < s.length) { if (s[j] === "\\") { j += 2; continue; } if (s[j] === c) break; j++; }
      out += s.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === "/" && n === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (c === "/" && n === "/") { const e = s.indexOf("\n", i); i = e < 0 ? s.length : e; continue; }
    out += c; i++;
  }
  return out;
}

/* Sieht der Text nach einer Beschriftung aus, die jemand liest? Deutsch
 * erkennt man an den Umlauten und an einer Handvoll Woerter, die in
 * Programmtext nicht vorkommen. */
const DEUTSCH = /[äöüÄÖÜß]|\b(der|die|das|den|dem|ein|eine|einen|und|oder|nicht|kein|keine|dein|deine|mit|ohne|auf|für|ist|sind|war|wird|hast|kannst|willst|dich|dir|noch|schon|jetzt|hier|alle|jede|jeder|Wort|Wörter|Liste|Listen|Sprache|Karte|Übung|Konto)\b/;
/* Bezeichner aus dem Programm, die keine Beschriftung sind. Sie kamen
 * bisher durch, weil CSS-Klassen wie "card-dir" oder "wl-alle" an der
 * Wortgrenze auf "dir" bzw. "alle" passen und die Deutsch-Erkennung damit
 * ansprang -- und weil Dateien aus NUR_BESCHRIFTUNG die Erkennung ganz
 * uebersprangen. Beides faellt hier heraus, bevor es ins Dokument geraet. */
const PROGRAMM = [
  /^\.{1,2}\//,                  // ./fsrs, ../lib/engine
  /^var\(/,                      // var(--blue)
  /^[a-z0-9]+(?:[ -][a-z0-9]+)*-[a-z0-9]+(?:[ -][a-z0-9]+)*$/, // card-dir-arrow, li li-alle
  /^[a-z]+[A-Z][A-Za-z0-9]*$/,    // beispieleModus, formenAn
];
/* Der Bindestrich in Regel 3 ist entscheidend: ohne ihn faellt auch
 * "sitzt fast", "wackelt noch" oder "f pl" heraus -- lauter echte
 * Beschriftungen, die genauso aus kleinen Woertern mit Trenner bestehen. */
const istProgramm = (t) => PROGRAMM.some((r) => r.test(t));

const TECHNIK = /^(https?:|[./]|[a-z0-9_-]+\.(ts|tsx|js|json|png|svg|css)$)|^[a-z][A-Za-z0-9]*$|^[A-Z_]+$/;

/* Bruchstuecke aus dem Programmtext. Der JSX-Textknoten ">…<" faengt
 * gelegentlich ueber eine Attributgrenze hinweg, und Vorlagenzeichenketten
 * bringen ${...} mit. Eine Beschriftung darf geschweifte Klammern nur als
 * Platzhalter enthalten -- {n}, {name} -- und sonst keine Programmzeichen. */
const BRUCHSTUECK = /\$\{|=>|\/>|<\/|\w+=\{|\w+="|`|\bconst\b|\breturn\b|\?\s*$|:\s*$/;
const PLATZHALTER_WEG = (x) => x.replace(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, "");

function istBeschriftung(t) {
  const x = t.trim();
  if (x.length < 3 || x.length > 400) return false;
  if (TECHNIK.test(x) || istProgramm(x)) return false;
  if (BRUCHSTUECK.test(x)) return false;
  if (/[{}<>]/.test(PLATZHALTER_WEG(x))) return false;
  if (!DEUTSCH.test(x)) return false;
  if (/^[\s\d.,;:!?()[\]+*/=&|%$#@~^-]*$/.test(x)) return false;
  return true;
}

/* Dateien, die nichts ALS Beschriftungen enthalten: Wortlisten von
 * Bezeichnungen, die anderswo durch txt() gehen. Dort greift die
 * Deutsch-Erkennung nicht, weil "Immer anzeigen" und "Nie anzeigen" fuer
 * eine Heuristik nicht deutsch aussehen -- sie enthalten weder Umlaut
 * noch eines der Fuellwoerter. */
const NUR_BESCHRIFTUNG = new Set([
  "src/lib/anzeige.ts", "src/lib/export.ts", "src/lib/stufen.ts",
  "src/lib/smartlists.ts", "src/lib/readiness.ts",
]);

function* dateien(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* dateien(p);
    else if (/\.tsx?$/.test(p)) yield p;
  }
}

/* Alle sichtbaren deutschen Beschriftungen, nach Bereich.
 *
 * Zwei Herkuenfte, und die zweite ist der Grund fuer diese Funktion:
 *   1. txt("…") und toast("…") -- der Vertrag der App
 *   2. alles andere, was deutsch aussieht: JSX-Text, placeholder, title,
 *      Beschriftungstabellen wie STUFE_LANG, die Zeichnungen in Kritzel.
 *      Diese Texte gehen an der Uebersetzung vorbei; im Dokument fehlten
 *      sie bisher, und in der englischen Fassung stuenden sie deutsch da.
 * Was aus (2) stammt, wird gemeldet -- daraus wird die Nacharbeit.
 */
function oberflaeche() {
  const nachBereich = {};
  const gesehen = new Set();
  const ohneTxt = [];
  const pfade = [...dateien(join(wurzel, "src"))]
    .map((p) => relative(wurzel, p))
    .filter((p) => !/i18n|help\.(de|en)\.tsx|seed\.ts|schemes|xlsx-leer|migrate\.ts/.test(p))
    .sort((a, b) => (BEREICH[a] ? 0 : 1) - (BEREICH[b] ? 0 : 1) || a.localeCompare(b));

  for (const p of pfade) {
    const roh = ohneKommentare(lies(p));
    const bereich = BEREICH[p] || "Weitere (" + p.split("/").pop().replace(/\.tsx?$/, "") + ")";
    const treffer = [];
    /* Was durch txt() geht, IST eine Beschriftung -- da wird nicht geraten.
     * Die Deutsch-Erkennung gilt nur fuer den zweiten Weg, wo tatsaechlich
     * zwischen Programmtext und Anzeige unterschieden werden muss. Sie war
     * zuerst auch auf txt() angewandt und warf dabei "Formen",
     * "Geschlecht", "Als Text" und ein Dutzend weiterer Beschriftungen
     * weg -- kurze Woerter ohne Umlaut sehen fuer eine Heuristik nicht
     * deutsch aus. */
    /* Drei Wege, und der dritte ist neu. In Dateien aus NUR_BESCHRIFTUNG
     * steht NUR Anzeigetext -- dort darf die Bezeichner-Sperre nicht
     * greifen. Sie warf sonst genau die sichtbarsten Woerter der App weg:
     * "sitzt", "fast", "wackelt", "neu" und "bereit" sind einzelne
     * Kleinbuchstabenwoerter und sehen fuer eine Heuristik aus wie
     * Programmbezeichner. Sie stehen unter jeder Lernstandsleiste. */
    const nimm = (text, durchTxt, roh2) => {
      const t = text.trim();
      if (gesehen.has(t)) return;
      if (roh2) { if (t.length < 2 || istProgramm(t)) return; }   // aus einer Beschriftungstabelle
      else if (durchTxt) { if (t.length < 2 || /^[a-z0-9_.:-]+$/.test(t) || istProgramm(t)) return; }
      else if (!istBeschriftung(t)) return;
      gesehen.add(t); treffer.push(t);
      if (!durchTxt) ohneTxt.push([p, t]);
    };

    // 1) txt(…) und toast(…)
    const re = /\b(?:txt|toast)\(\s*(["'])/g;
    let m;
    while ((m = re.exec(roh))) { const t = zeichenkette(roh, m.index + m[0].length - 1); re.lastIndex = t.ende; nimm(t.text, true); }

    // 2) alle uebrigen Zeichenketten in Anfuehrungszeichen
    const alles = NUR_BESCHRIFTUNG.has(p);
    const re2 = /(["'])/g;
    let x;
    while ((x = re2.exec(roh))) {
      const t = zeichenkette(roh, x.index);
      re2.lastIndex = t.ende;
      nimm(t.text, alles);
    }

    /* 2b) Zwei Beschriftungstabellen, die die Sperre oben wegwirft.
     * "sitzt", "fast", "wackelt", "neu" sind einzelne Kleinbuchstaben-
     * woerter und sehen fuer eine Heuristik aus wie Programmbezeichner --
     * sie stehen aber unter jeder Lernstandsleiste und gehoeren damit zu
     * den sichtbarsten Woertern der App. Die Tabellen beim Namen zu nennen
     * ist ehrlicher als die Heuristik weiter aufzuweichen: daneben stehen
     * in derselben Datei STUFE_FARBE und STUFE_BADGE, und deren Werte
     * ("var(--ok)", "green") sind gerade keine Beschriftung. */
    for (const name of ["STUFE_KURZ", "STUFE_LANG"]) {
      const i = roh.indexOf("const " + name);
      if (i < 0) continue;
      const start = roh.indexOf("{", i), ende = roh.indexOf("}", start);
      if (start < 0 || ende < 0) continue;
      for (const m of roh.slice(start, ende).matchAll(/:\s*"([^"]+)"/g)) nimm(m[1], true, true);
    }

    /* Ebenso die sechs Sprachnamen. Sie stehen in der Sprachwahl, in der
     * Richtungswahl und im Satz "Auf {sprache} eintippen ..." -- und
     * fehlten bisher ganz, weil "English" und "Español" fuer eine
     * Deutsch-Erkennung nicht deutsch sind. Genau deshalb gehoeren sie
     * ins Dokument: sie sind der Grund, warum dort "Auf English
     * eintippen" steht. */
    if (/pairs\.ts$/.test(p))
      for (const m of roh.matchAll(/label:\s*"([^"]+)"/g)) nimm(m[1], true, true);

    // 3) JSX-Textknoten: >Text<
    for (const j of roh.matchAll(/>([^<>{}]{3,300})</g)) nimm(entitaeten(j[1]), false);

    if (treffer.length) (nachBereich[bereich] ||= []).push(...treffer);
  }
  oberflaeche.ohneTxt = ohneTxt;
  return nachBereich;
}

/* -------------------------------------------------------------- Ausgabe */

const ueber = lies("src/components/UeberModal.tsx");
const leadM = ueber.match(/className="ueber-lead">\s*\{?\s*(?:txt\(\s*)?(["'])/);
const ueberLead = leadM
  ? zeichenkette(ueber, leadM.index + leadM[0].length - 1).text
  : nurText((ueber.match(/ueber-lead[^>]*>([\s\S]*?)<\/p>/) || [, ""])[1]);

/* Ein Text, der schon in Teil A steht, darf in Teil B nicht noch einmal
 * auftauchen: sonst redigiert man ihn zweimal und die beiden Fassungen
 * laufen auseinander. Betroffen ist zum Beispiel der Einleitungssatz von
 * "Ueber SmartVoc", der als Prosa UND als txt()-Aufruf existiert. */
function ohneDoppel(gruppen, schonDa) {
  const set = new Set(schonDa.map((x) => x.trim()));
  const out = {};
  for (const [k, v] of Object.entries(gruppen)) {
    const rest = v.filter((t) => !set.has(t.trim()));
    if (rest.length) out[k] = rest;
  }
  return out;
}

const T = {
  anleitung: kapitelAus("src/components/help.de.tsx", "ANLEITUNG_DE"),
  tipps: tippsAus("src/components/help.de.tsx"),
  theorie_lead: (lies("src/components/help.de.tsx").match(/THEORIE_LEAD_DE[^"]*"/) ? (() => {
    const s = lies("src/components/help.de.tsx");
    const i = s.indexOf("THEORIE_LEAD_DE");
    const q = s.indexOf('"', i);
    return zeichenkette(s, q).text;
  })() : ""),
  theorie: kapitelAus("src/components/help.de.tsx", "THEORIE_DE"),
  ueber_lead: ueberLead,
  datenschutz: rechtAus("DATENSCHUTZ"),
  impressum: rechtAus("IMPRESSUM"),
  oberflaeche: null,   // gleich, wenn Teil A steht
};

T.oberflaeche = ohneDoppel(oberflaeche(), [
  T.theorie_lead, T.ueber_lead,
  ...T.tipps.flat(),
  ...[...T.anleitung, ...T.theorie].flatMap(([titel, teile]) => [titel, ...teile.map((x) => x[1])]),
  ...[...T.datenschutz, ...T.impressum].map((x) => x[1]),
]);

writeFileSync(join(hier, "texte.json"), JSON.stringify(T, null, 1) + "\n", "utf8");

const zaehl = (x) => Array.isArray(x) ? x.length : typeof x === "string" ? 1 : Object.values(x).flat().length;
let n = 0;
for (const [k, v] of Object.entries(T)) { const c = zaehl(v); n += c; console.log(`${k.padEnd(14)} ${c}`); }
const kapitelTexte = [...T.anleitung, ...T.theorie].reduce((a, k) => a + 1 + k[1].length, 0);
console.log(`\nKapitel-Textstellen: ${kapitelTexte}`);
console.log(`Oberflaechen-Beschriftungen: ${Object.values(T.oberflaeche).flat().length} in ${Object.keys(T.oberflaeche).length} Bereichen`);

/* Was NICHT durch txt() geht, steht in der englischen Fassung deutsch da.
 * Diese Liste ist die Nacharbeit -- sie gehoert nicht ins Dokument fuer
 * den Redakteur, sondern neben den Programmtext. */
const drin = new Set(Object.values(T.oberflaeche).flat());
const offen = (oberflaeche.ohneTxt || []).filter(([, t]) => drin.has(t));
const jeDatei = {};
for (const [f, t] of offen) (jeDatei[f] ||= []).push(t);
writeFileSync(join(hier, "ohne-txt.json"), JSON.stringify(jeDatei, null, 1) + "\n", "utf8");
console.log(`\nNoch nicht durch txt(): ${offen.length} Beschriftungen in ${Object.keys(jeDatei).length} Dateien -> texte/ohne-txt.json`);
