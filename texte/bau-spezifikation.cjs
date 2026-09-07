/* Erzeugt die Funktionsspezifikation aus spez-inhalt.json.
 *
 *   node texte/bau-spezifikation.cjs
 *
 * Der Inhalt steht als Daten in der JSON-Datei, damit sich Text und Aufbau
 * getrennt aendern lassen. Absichtlich keine Farben und keine Bilder: das
 * Dokument beschreibt Verhalten, nicht Aussehen.
 */
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
        TableCell, WidthType, ShadingType, PageBreak, AlignmentType,
        TableOfContents, BorderStyle } = require("docx");

const T = JSON.parse(fs.readFileSync(__dirname + "/spez-inhalt.json", "utf8"));

const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  indent: o.einzug,
  children: [new TextRun({ text, bold: o.bold, italics: o.kursiv,
                           size: o.size ?? 21, color: o.color, font: "Calibri" })],
});

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1,
  spacing: { before: 380, after: 160 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 110 } });

/* Aufzaehlung: Spiegelstrich und Einzug. Word-Nummerierung waere haltbarer,
   verlangt aber eine eigene Konfiguration je Ebene; fuer ein Lesedokument
   genuegt der Strich. */
const liste = (eintraege, nummeriert) => eintraege.map((t, i) =>
  p((nummeriert ? (i + 1) + ".  " : "·  ") + t, { einzug: { left: 300 }, after: 70 }));

const SPALTEN = { 2: [3000, 6000], 3: [2200, 3400, 3400] };

function tabelle(kopf, zeilen) {
  const breiten = SPALTEN[kopf.length] || SPALTEN[3];
  const zelle = (t, i, kopfzeile) => new TableCell({
    width: { size: breiten[i], type: WidthType.DXA },
    shading: kopfzeile ? { type: ShadingType.CLEAR, fill: "EFEFEF" } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [p(t, { bold: kopfzeile, size: kopfzeile ? 19 : 20, after: 0 })],
  });
  return new Table({
    columnWidths: breiten,
    width: { size: breiten.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: kopf.map((t, i) => zelle(t, i, true)) }),
      ...zeilen.map((z) => new TableRow({ children: z.map((t, i) => zelle(t, i, false)) })),
    ],
  });
}

const k = [];
k.push(new Paragraph({ text: T.titel, heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p(T.untertitel, { size: 28, color: "444444", after: 40 }));
k.push(p(T.stand, { size: 19, color: "888888", after: 300 }));
k.push(p("Dieses Dokument beschreibt den Funktionsumfang der Anwendung: Datenmodell, Regeln und Verhalten. Gestaltung, Anordnung und Bedienelemente sind nicht Gegenstand.",
         { color: "444444", after: 220 }));

k.push(new Paragraph({ text: "Inhalt", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 } }));
for (const a of T.abschnitte) k.push(p(a.h1, { after: 50, einzug: { left: 120 } }));
k.push(new Paragraph({ children: [new PageBreak()] }));

for (const a of T.abschnitte) {
  k.push(h1(a.h1));
  for (const teil of a.teile) {
    if (teil.h2) { k.push(h2(teil.h2)); continue; }
    if (teil.p) { k.push(p(teil.p)); continue; }
    if (teil.ul) { k.push(...liste(teil.ul, false)); k.push(p("", { after: 60 })); continue; }
    if (teil.ol) { k.push(...liste(teil.ol, true)); k.push(p("", { after: 60 })); continue; }
    if (teil.tab) { k.push(teil.tab.kopf && tabelle(teil.tab.kopf, teil.tab.zeilen)); k.push(p("", { after: 180 })); continue; }
  }
}

const doc = new Document({
  creator: "SmartVoc", title: "SmartVoc — Funktionsspezifikation",
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1300, right: 1300 } } },
    children: k.filter(Boolean),
  }],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(__dirname + "/SmartVoc-Funktionsspezifikation.docx", b);
  const n = T.abschnitte.reduce((a, x) => a + x.teile.length, 0);
  console.log("Geschrieben ·", T.abschnitte.length, "Abschnitte,", n, "Bloecke");
});
