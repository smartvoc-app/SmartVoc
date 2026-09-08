/* Paste / clipboard quick-add (Phase 5). Parses pasted text into rows and
 * hands them to the shared ReviewModal. Includes a pair-aware "AI prompt"
 * the user can paste into their own chat to get a correctly-formatted list. */
import { useState, useEffect } from "react";
import { txt } from "../lib/i18n";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { PAIRS, isLatinPair } from "../lib/pairs";
import { spalten, TRENNER, WORTARTEN, GENUS } from "../lib/export";

/* EN/FR line splitter: columns Fremd | Deutsch | Topic. Same delimiters as the
 * scan heuristic (tab / : | – — - / 2+ spaces). */
/* Split one pasted line into columns.
 *
 * Two bugs used to live here, and both fired exactly on the rows the AI prompt
 * asks for:
 *
 * 1. Every separator was accepted at once — tab, "|", colon, hyphen, en dash.
 *    Those last three also occur INSIDE the content: "e-mail", "Nun denn: los!",
 *    and most example sentences carry one. A single dash in a sentence tore the
 *    row into extra columns and everything after it landed in the wrong field.
 *    So: use the strongest separator the line actually contains, and only fall
 *    back to the loose set when there is no "|", no tab and no column gap.
 *
 * 2. Empty columns were dropped. The prompt tells the AI to leave the second
 *    example empty and still write the "|", so "dog|der Hund|Satz||Tiere" is
 *    normal — and dropping the empty shifted "Tiere" into the example slot.
 *    Inner empties are kept now; only trailing ones go, since they carry
 *    nothing. */
/* So viele Spalten hat die Vollform -- gezaehlt, nicht von Hand gefuehrt. */
const VOLL = spalten("", "").length;

export function columns(s: string): string[] {
  let p: string[];
  if (s.includes("|")) p = s.split("|");
  else if (s.includes("\t")) p = s.split("\t");
  else if (/\s{2,}/.test(s)) p = s.split(/\s{2,}/);
  else p = s.split(/\s*[–—:-]\s*/);
  p = p.map((x) => x.trim());
  /* Leere Felder am Zeilenende wegnehmen -- eine von Hand getippte Zeile
   * endet oft auf einem ueberzaehligen Trennstrich.
   *
   * ABER: die Vollform wird an ihrer Spaltenzahl erkannt, und ihre letzten
   * Felder sind meistens leer -- Aussprache fuellt fast niemand aus. Wurde
   * hier gekuerzt, zerfiel "cat |  |  |  | die Katze |  |  |  |  | " zu
   * fuenf Spalten, galt als Kurzform und die Uebersetzung landete in der
   * Aussprache. Was die App ausgibt, las sie also NICHT verlustfrei ein.
   * Deshalb bleibt die Vollform unangetastet. */
  if (p.length === VOLL) return p;
  while (p.length && p[p.length - 1] === "") p.pop();
  return p;
}

/* Eine Zeile in ein Wort. EIN Spaltensatz fuer alle Sprachen (lib/export.ts):
 *
 *   Fremdsprache | Formen | Genus | Wortart | Deutsch |
 *   Bsp1 | Bsp1 dt | Bsp2 | Bsp2 dt | Aussprache
 *
 * Kuerzere Zeilen sind von Hand getippt und behalten ihre alte Bedeutung --
 * deshalb entscheidet die Spaltenzahl, nicht der Inhalt. Bei vier Spalten
 * gehen die beiden Lesarten auseinander: Latein meint dort seine
 * Stammformen, alle anderen zwei Beispielsaetze. Also entscheidet das Paar.
 */
export function zeileZuWort(p: string[], isLat: boolean) {
  const kopf = isLat ? "grundform" : "fgn";
  const w: any = { [kopf]: p[0] || "" };
  if (p.length >= 10) {
    w.lernform = p[1]; w.genus = p[2]; w.wortart = p[3]; w.de = p[4];
    /* Satz und Uebersetzung gehoeren zusammen und werden als Paar verworfen,
     * wenn der Satz fehlt -- sonst stuende die Uebersetzung beim falschen
     * Satz. Die Kurzformen filtern schon immer; das Vollformat schrieb
     * stattdessen ["", ""] und zeigte zwei leere Beispielzeilen an. */
    const paare = [[p[5], p[6]], [p[7], p[8]]].filter(([satz]) => satz);
    w.examples = paare.map(([satz]) => satz);
    w.examplesDe = paare.map(([, uebers]) => uebers || "");
    w.phonetic = p[9];
    return w;
  }
  if (isLat) {
    // Grundform | Lernform | Wortart | Deutsch | Bsp1 | Bsp2 | Aussprache
    if (p.length >= 7) { w.lernform = p[1]; w.wortart = p[2]; w.de = p[3]; w.examples = [p[4], p[5]].filter(Boolean); w.phonetic = p[6]; return w; }
    if (p.length >= 5) { w.lernform = p[1]; w.wortart = p[2]; w.de = p[3]; w.examples = [p[4]].filter(Boolean); return w; }
    if (p.length === 4) { w.lernform = p[1]; w.wortart = p[2]; w.de = p[3]; return w; }
    if (p.length === 3) { w.lernform = p[1]; w.de = p[2]; return w; }
    w.de = p[1] || "";
    return w;
  }
  // Fremdsprache | Deutsch | Bsp1 | Bsp2 | Aussprache
  w.de = p[1] || "";
  if (p.length >= 5) { w.examples = [p[2], p[3]].filter(Boolean); w.phonetic = p[4]; return w; }
  if (p.length === 4) { w.examples = [p[2], p[3]].filter(Boolean); return w; }
  if (p.length === 3) { w.examples = [p[2]].filter(Boolean); return w; }
  return w;
}

const KOPFZEILE = /^(unit|lesson|lektion|page|seite|vokabel|words?|english|fran|deutsch|german|grundform|latein|wort)\b/i;

function splitZeilen(text: string, isLat: boolean) {
  const out: any[] = [];
  (text || "").split(/\r?\n/).forEach((line) => {
    const s = line.trim();
    if (!s || s.length < 2) return;
    if (KOPFZEILE.test(s) && !/[-–—:|\t]/.test(s)) return;
    out.push(zeileZuWort(columns(s), isLat));
  });
  return out;
}

function rawLines(text: string, isLat: boolean) {
  return (text || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length >= 2)
    .map((l) => isLat ? { grundform: l } : { fgn: l });
}

/* Das Beispiel im Textfeld muss in der eingestellten Sprache stehen. Es
 * zeigte immer Englisch -- auch bei Franzoesisch oder Latein, und dann
 * schreibt jemand englische Woerter in eine franzoesische Liste. */
const BEISPIELE: Record<string, string> = {
  "en-de": "dog | der Hund\ncat | die Katze",
  "fr-de": "le chien | der Hund\nle chat | die Katze",
  "es-de": "el perro | der Hund\nla casa | das Haus",
  "it-de": "il cane | der Hund\nla casa | das Haus",
  "pt-de": "o cão | der Hund\na casa | das Haus",
  "la-de": "canis | canis, canis, m. | Nomen | der Hund\nliber | liber, librī, m. | Nomen | das Buch",
};

export function PasteModal({ open, pair, onParsed, onClose, initialText }: { open: boolean; pair: string; onParsed: (rows: any[]) => void; onClose: () => void; initialText?: string }) {
  const BEISPIEL = BEISPIELE[pair] || BEISPIELE["en-de"];
  const toast = useToast();
  const isLat = isLatinPair(pair);
  const P = PAIRS[pair] || PAIRS["en-de"];
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (open) { setText(initialText || ""); setCopied(false); } }, [open, initialText]);
  if (!open) return null;

  /* Zwei Aufgaben, ein Prompt: Wörter aus einem Foto ABSCHREIBEN (der übliche
   * Fall — eine Heftseite) oder eine Liste zu einem Thema ERZEUGEN. Die alte
   * Fassung konnte nur das Zweite und hatte einen Platzhalter „…", den man
   * ausfüllen musste; wer sie unverändert einfügte, bekam erfundene Wörter.
   *
   * Die Spaltenzahl ist fix und jede Spalte wird geschrieben, auch die leeren.
   * Der Parser erkennt das neue Format an genau dieser Anzahl. */
  /* Die Spalten stehen in lib/export.ts -- dieselbe Reihenfolge, in der die
   * App auch ausgibt. Die Zahl daneben wurde frueher von Hand gefuehrt und
   * war falsch (sie nannte 8 statt 7 und 10 statt 9), sodass der Prompt eine
   * Spalte zu viel verlangte. Jetzt wird sie gezaehlt. */
  const SPALTEN = spalten(pair, P.foreignLabel);
  const COLS = SPALTEN.join(TRENNER);
  const nCols = SPALTEN.length;
  /* Die Formen gibt es in jeder Sprache, aber sie bedeuten nicht ueberall
   * dasselbe -- bei Latein die Stammformen, sonst Plural und
   * unregelmaessige Formen. Deshalb zwei Regeln statt einer. */
  const formenRegel = isLat
    ? "Formen = die Stammformen (Nomen: Nominativ, Genitiv, Genus; Verb: die vier Stammformen; Deponens: drei; Adjektiv: die drei Genusformen). Bei unveränderlichen Wörtern leer.\n"
    : `Formen = was man zum Wort mitlernt: beim Nomen Singular und Plural, beim Verb die Gegenwart oder die unregelmäßigen Formen. Beispiele: "child, children" · "aller: je vais, tu vas, il va". Ist alles regelmäßig, lass es leer.\n`;

  /* Der Prompt hat zwei Aufgaben, und sie sind verschieden streng:
   *
   * ABSCHREIBEN aus einem Foto -- der uebliche Fall. Was auf dem Blatt
   * steht, ist die Liste des Lehrers und muss Wort fuer Wort so
   * uebernommen werden, auch wenn die KI es anders uebersetzt haette. Was
   * darauf zusaetzlich steht -- Beispielsaetze, Lautschrift, Geschlecht,
   * Stammformen -- wird ebenfalls abgeschrieben statt neu erfunden.
   * Nur was FEHLT, ergaenzt die KI. Vorher hiess es "was du nicht weißt,
   * lässt du leer"; damit kam von einer abfotografierten Heftseite eine
   * Liste ohne einen einzigen Beispielsatz zurueck.
   *
   * ERZEUGEN zu einem Thema -- der zweite Fall, wenn kein Foto dabei ist.
   */
  const sprache = isLat ? "Latein" : P.foreignLabel;
  const aiPrompt =
    `Ich gebe dir gleich ein Foto einer Vokabelliste — meist eine Heftseite oder eine Buchseite. Schreib die Wörter daraus ab und ergänze, was fehlt.\n\n` +
    `ABSCHREIBEN, NICHT ÜBERSETZEN: Wort und Übersetzung stehen auf dem Blatt und werden genau so übernommen, auch wenn du es anders sagen würdest. Keine Wörter weglassen, keine dazuerfinden, die Reihenfolge des Blattes beibehalten.\n` +
    `ÜBERNEHMEN, WAS DASTEHT: Steht auf dem Blatt schon ein Beispielsatz, eine Lautschrift, ein Geschlecht oder eine Stammform, dann übernimm genau die — erfinde nichts Eigenes daneben.\n` +
    `ERGÄNZEN, WAS FEHLT: Alle übrigen Felder füllst DU aus, nach den Regeln unten. Leer bleiben nur die Felder, bei denen unten ausdrücklich steht, dass sie leer bleiben dürfen.\n\n` +
    `Ist kein Foto dabei, erstelle stattdessen eine Vokabelliste ${sprache} ⇄ Deutsch zu dem Thema, das ich nenne.\n\n` +
    `Gib NUR eine Tabelle aus, eine Zeile pro Wort, Spalten getrennt durch " | ", in genau dieser Reihenfolge:\n${COLS}\n\n` +
    `Jede Zeile hat genau ${nCols} Spalten, also ${nCols - 1} Trennstriche — auch um leere Felder herum.\n` +
    formenRegel +
    `Genus = das Geschlecht des Fremdworts, genau eines von: ${GENUS.join(", ")}. Nur bei Nomen, sonst leer.${isLat ? "" : P.foreignLabel === "Englisch" ? " Im Englischen leer, außer bei Wörtern, die es nur im Plural gibt (pl)." : ""}\n` +
    `Wortart = genau eines von: ${WORTARTEN.join(", ")}. Nichts anderes, keine Abkürzungen.\n` +
    `Beispielsätze: zwei verschiedene, kurz und einfach, auf ${sprache}; daneben jeweils die deutsche Übersetzung.\n` +
    `Aussprache = ${isLat
      ? "das Stichwort noch einmal, mit Längenzeichen über den langen Vokalen (amicus → amīcus). Keine Lautschrift."
      : "IPA-Lautschrift des Fremdworts, ohne Klammern, mit Betonungszeichen; beim Nomen ohne den Artikel."}\n` +
    `Nomen mit Artikel, auf beiden Seiten${isLat ? " (Latein ohne Artikel, dafür mit Stammformen)" : ""}. Deutsche Rechtschreibung mit ß.\n` +
    `Verwende " | " nirgends im Text selbst. Keine Nummerierung, keine Überschrift, kein weiterer Text.`;

  const copyPrompt = () => navigator.clipboard?.writeText(aiPrompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  const pasteClipboard = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) setText(t); else toast(txt("Zwischenablage ist leer"), "x"); }
    catch { toast(txt("Die App kommt nicht an die Zwischenablage. Füg den Text von Hand ein."), "x"); }
  };

  const proceed = () => {
    if (!text.trim()) return;
    let rows = splitZeilen(text, isLat);
    if (!rows.length) rows = rawLines(text, isLat); // never crash / never empty
    onParsed(rows);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: "94vw" }}>
        <div className="modal-head">
          <div className="modal-title">{txt("Einfügen")} <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>· {txt(P.foreignLabel)} ⇄ {txt(P.nativeLabel)}</span></div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Der KI-Weg war eine eigene Zeile im Blatt davor und fuehrte in
            genau dieses Fenster. Jetzt steht er hier, wo er gebraucht wird:
            als Satz und als Knopf unter dem Textfeld. */}
        <div className="tips-intro" style={{ marginBottom: 12 }}>
          Füge eine Wortliste ein — eine Zeile pro Wort, Spalten getrennt durch Tab, „|", „–" oder „:".
          {isLat ? " Kurz genügt: Grundform | Formen | Wortart | Deutsch." : ` Kurz genügt: ${P.foreignLabel} | Deutsch.`}
          {" "}{txt("Nichts zum Kopieren? Mit dem Auftrag unten macht dir deine KI-App aus einem Foto deiner Heftseite eine fertige Liste.")}
        </div>

        <textarea className="field" style={{ minHeight: 150, resize: "vertical", fontFamily: "var(--mono)", fontSize: 16 }}
          placeholder={BEISPIEL}
          value={text} onChange={(e) => setText(e.target.value)} />

        <div className="toolbelt" style={{ justifyContent: "flex-start", marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={pasteClipboard}><Icon name="download" size={14} /> {txt("Aus Zwischenablage")}</button>
          <button className="btn btn-ghost btn-sm" onClick={copyPrompt}><Icon name={copied ? "check" : "sparkle"} size={14} /> {copied ? "Prompt kopiert" : "KI-Prompt kopieren"}</button>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{txt("Abbrechen")}</button>
          <button className="btn btn-primary" disabled={!text.trim()} onClick={proceed}><Icon name="arrowRight" size={15} /> {txt("Weiter zum Prüfen")}</button>
        </div>
      </div>
    </div>
  );
}
