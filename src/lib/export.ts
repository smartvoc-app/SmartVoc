/* ===================================================================
 * Die Spalten — EINE Quelle fuer alles, was Woerter als Tabelle sieht.
 *
 * Vier Stellen sprachen bisher ueber dieselben Spalten, und drei davon
 * widersprachen sich: der KI-Prompt nannte sieben Spalten und behauptete
 * im naechsten Satz, es seien acht; die Excel-Vorlage ließ die deutschen
 * Beispielsaetze ganz weg und setzte die Aussprache an eine andere Stelle;
 * der Einleser suchte sich die Spalten ueber Ueberschriften zusammen.
 *
 * Jetzt steht die Reihenfolge hier, und Prompt, Vorlage, Ausgabe und
 * Einlesen halten sich daran. Damit gilt: was die App ausgibt, liest sie
 * auch wieder ein — ohne Verlust.
 * =================================================================== */
import { isLatinPair } from "./pairs";

/* Trennzeichen der Textform. Steht es im Inhalt, zerfaellt die Zeile beim
 * Einlesen in zu viele Spalten — deshalb wird es beim Ausgeben ersetzt. */
export const TRENNER = " | ";

/* EIN Spaltensatz fuer alle Sprachen.
 *
 * Vorher gab es zwei: Latein mit Grundform, Lernform und Wortart, alle
 * anderen ohne. Zwei Vorlagen, die beide "smartvoc-vorlage.xlsx" hiessen,
 * lagen danach nebeneinander im Download-Ordner und waren nicht zu
 * unterscheiden -- und wer die falsche ausfuellte, bekam beim Einlesen
 * Unsinn.
 *
 * Jetzt zehn Spalten, immer dieselben, in derselben Reihenfolge. Was eine
 * Sprache nicht kennt, bleibt leer: "Lernform" fuellt nur Latein aus. Eine
 * leere Spalte kostet nichts; zwei Formate kosten jedes Mal eine
 * Verwechslung.
 *
 * `fremdLabel` steht im Kopf der ersten Spalte, damit man einer
 * heruntergeladenen Datei ansieht, fuer welche Sprache sie gedacht ist --
 * die Form ist trotzdem ueberall gleich. */
export function spalten(pair: string, fremdLabel: string): string[] {
  return [fremdLabel, "Formen", "Genus", "Wortart", "Deutsch",
          "Beispielsatz 1", "Beispielsatz 1 deutsch",
          "Beispielsatz 2", "Beispielsatz 2 deutsch", "Aussprache"];
}

/* Das Geschlecht des Fremdworts.
 *
 * Es steht als eigene Angabe da und wird NICHT aus dem Artikel abgeleitet:
 * das ginge nur im Deutschen. "l'école" ist weiblich, "l'uomo" maennlich,
 * "lo zaino" maennlich, "el agua" weiblich -- das Franzoesische und das
 * Italienische waehlen den Artikel nach dem Anlaut, das Spanische elidiert.
 * Umgekehrt bleibt der Artikel im Wortfeld stehen, denn aus dem Geschlecht
 * liesse er sich aus denselben Gruenden nicht zurueckbauen.
 *
 * Kein eigenes Feld fuer den Numerus: "Singular" traefe auf 99 von 100
 * Nomen zu, und ein Merkmal, das fast immer denselben Wert hat, traegt
 * keine Auskunft. Angeschrieben wird die Ausnahme -- deshalb die
 * Plural-Werte hier drin, in der Schreibweise der Woerterbuecher. */
export const GENUS = ["m", "f", "n", "m pl", "f pl", "n pl", "pl"];

export const GENUS_LANG: Record<string, string> = {
  m: "männlich", f: "weiblich", n: "sächlich",
  "m pl": "männlich, nur Plural", "f pl": "weiblich, nur Plural",
  "n pl": "sächlich, nur Plural", pl: "nur Plural",
};

/* Die Wortarten. Sie waren auf Latein beschraenkt und dort auf fuenf
 * Klassen; beides ohne Grund. Ein englisches "under" ist genauso eine
 * Praeposition, und die Angabe traegt zweierlei: sie steht in den Angaben
 * zum Wort, und sie kann spaeter die Ablenker beim Multiple-Choice
 * verbessern -- heute werden die rein zufaellig aus dem Sprachvorrat
 * gezogen, sodass unter einem Verb drei Nomen stehen koennen. */
export const WORTARTEN = [
  "Nomen", "Verb", "Adjektiv", "Adverb", "Pronomen",
  "Zahlwort", "Präposition", "Konjunktion", "Wendung",
];

const sauber = (v: any) => String(v ?? "").replace(/\|/g, "/").replace(/[\r\n\t]+/g, " ").trim();

/* Ein Wort als Zeile, in der Reihenfolge von `spalten`. Leere Felder
 * bleiben leer und werden trotzdem geschrieben: der Einleser erkennt das
 * vollstaendige Format an der Spaltenzahl. */
export function wortZeile(w: any, pair: string, fremdSchluessel: string): string[] {
  const bsp = w.examples || [];
  const bspDe = w.examplesDe || [];
  const kopf = isLatinPair(pair) ? w.grundform : w[fremdSchluessel];
  return [kopf, w.lernform, w.genus, w.wortart, w.de,
          bsp[0], bspDe[0], bsp[1], bspDe[1], w.phonetic].map(sauber);
}

/* Die Textform: eine Zeile je Wort, keine Ueberschrift. Eine Ueberschrift
 * traegt hier Trennzeichen und waere beim Einlesen ein Wort. */
export function alsText(words: any[], pair: string, fremdSchluessel: string): string {
  return words.map((w) => wortZeile(w, pair, fremdSchluessel).join(TRENNER)).join("\n");
}

/* Die Form fuer Teilen und Sicherung: dieselben Felder, aber benannt statt
 * nach Position — eine geteilte Liste soll auch dann noch lesbar sein,
 * wenn sich die Spaltenreihenfolge einmal aendert. */
export function wortNutzlast(w: any, pair: string, fremdSchluessel: string) {
  const kopf = isLatinPair(pair)
    ? { grundform: w.grundform || "", lernform: w.lernform || "", wortart: w.wortart || "", de: w.de || "" }
    : { [fremdSchluessel]: w[fremdSchluessel] || "", lernform: w.lernform || "", wortart: w.wortart || "", de: w.de || "" };
  const bsp = (w.examples || []).map((s: any) => String(s || "").trim());
  const bspDe = (w.examplesDe || []).map((s: any) => String(s || "").trim());
  const rest: any = {};
  if (bsp.some(Boolean)) rest.examples = bsp;
  if (bspDe.some(Boolean)) rest.examplesDe = bspDe;
  if (w.phonetic) rest.phonetic = String(w.phonetic).trim();
  if (w.genus) rest.genus = String(w.genus).trim();
  return { ...kopf, ...rest };
}
/* Wie sich eine uebernommene Liste auf den Bestand legt.
 *
 * Ein Wort gehoert in genau eine Liste (V18). Eine uebernommene Liste ist
 * deshalb immer eine echte Kopie: jedes geteilte Wort wird neu angelegt,
 * mit eigener Id und eigenem Lernstand.
 *
 * Verknuepfen statt kopieren waere falsch. Wer "Lektion 5" uebernimmt und
 * drei dieser Woerter schon in "Lektion 4" hat, bekaeme sonst eine
 * unvollstaendige Lektion 5 -- und die drei Woerter stuenden in zwei
 * Listen, was die Regel bricht. Ueberspringen war der urspruengliche
 * Fehler: wer dieselbe Liste schon besass, bekam eine LEERE daneben.
 *
 * Steht hier und nicht im Fenster, damit es sich pruefen laesst.
 */
export function importPlan(worte: any[], pair: string, listId: string): { neu: any[] } {
  return { neu: (worte || []).map((w) => ({ ...w, pair, lists: [listId], review: false, source: "import" })) };
}
