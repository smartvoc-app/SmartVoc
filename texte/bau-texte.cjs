const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, AlignmentType, BorderStyle, PageBreak } = d;

const T = JSON.parse(fs.readFileSync("texte.json", "utf8"));
const karte = {};           // ID -> Originaltext, fuer den Rueckweg
let nA = 0, nB = 0;
const SPALTEN = [1120, 7880];

const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, before: o.before ?? 0 },
  alignment: o.align,
  children: [new TextRun({ text, bold: o.bold, italics: o.kursiv, size: o.size ?? 21,
                           color: o.color, font: "Calibri" })],
});
const h = (text, lvl) => new Paragraph({ text, heading: lvl, spacing: { before: 260, after: 120 } });

function nummer(prefix, n) { return prefix + String(n).padStart(3, "0"); }

/* Ein Kapiteltitel ist selbst ein Text, den du aendern darfst. Er stand
   deshalb zweimal da: einmal als Word-Ueberschrift zum Navigieren, einmal
   als nummerierte Zeile zum Bearbeiten. Jetzt traegt die Ueberschrift die
   Nummer und ist die Zeile. */
function titelZeile(text, lvl) {
  const id = nummer("A-", ++nA);
  karte[id] = text;
  return new Paragraph({ heading: lvl, spacing: { before: 300, after: 120 },
    children: [new TextRun({ text: id + "  ", size: 15, color: "9A958B", font: "Consolas" }),
               new TextRun({ text })] });
}

/* Eine Zeile im langen Teil: Nummer klein davor, Text darunter. So bleibt
   die Prosa lesbar und trotzdem eindeutig referenzierbar. */
function langZeile(text, art) {
  const id = nummer("A-", ++nA);
  karte[id] = text;
  /* Drei Arten von Zeile: Zwischenueberschrift, Aufzaehlungspunkt und
     gewoehnlicher Absatz. Der Punkt ist eingerueckt und traegt ein
     Zeichen davor -- sonst liest sich eine Schritt-fuer-Schritt-Anleitung
     im Dokument wie Fliesstext und man aendert sie als solchen.
     "S" ist die Beschriftung unter einer Skizze. */
  const einzug = art === "L" ? { left: 340 } : undefined;
  return [
    new Paragraph({ spacing: { before: 140, after: 20 }, indent: einzug,
      children: [new TextRun({ text: id, size: 15, color: "9A958B", font: "Consolas" }),
                 ...(art === "S" ? [new TextRun({ text: "  Bildbeschriftung", size: 15, color: "9A958B", font: "Consolas" })] : [])] }),
    new Paragraph({ spacing: { after: 60 }, indent: einzug,
      children: [new TextRun({ text: (art === "L" ? "· " : "") + text,
                               size: art === "H" ? 22 : 21,
                               bold: art === "H",
                               italics: art === "S",
                               color: art === "S" ? "5A554C" : undefined,
                               font: "Calibri" })] }),
  ];
}

function tabelle(eintraege) {
  const zeilen = [new TableRow({ tableHeader: true, children: ["Nr.", "Text"].map((t, i) =>
    new TableCell({ width: { size: SPALTEN[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: "EFEAE0" },
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: [p(t, { bold: true, size: 18, after: 0 })] })) })];
  for (const text of eintraege) {
    const id = nummer("B-", ++nB);
    karte[id] = text;
    zeilen.push(new TableRow({ children: [
      new TableCell({ width: { size: SPALTEN[0], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 90, right: 90 },
        children: [new Paragraph({ spacing: { after: 0 },
          children: [new TextRun({ text: id, size: 15, color: "9A958B", font: "Consolas" })] })] }),
      new TableCell({ width: { size: SPALTEN[1], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 90, right: 90 },
        children: [p(text, { after: 0 })] }),
    ] }));
  }
  return new Table({ columnWidths: SPALTEN, width: { size: 9000, type: WidthType.DXA }, rows: zeilen });
}

const k = [];

// ---------------------------------------------------------------- Kopf
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p("Sämtliche deutschen Texte der App", { size: 26, color: "5A554C", after: 40 }));
k.push(p("Stand 6. September 2026 · aus dem Programmtext erzeugt (texte/sammle-texte.mjs)", { size: 19, color: "9A958B", after: 320 }));

k.push(h("So arbeitest du damit", HeadingLevel.HEADING_2));
k.push(p("Jeder Text trägt eine Nummer. Ändere den Text, aber lass die Nummer stehen. Daran erkenne ich beim Zurückspielen, welche Stelle gemeint ist. Kommentare kannst du als Word-Kommentar an den Text hängen oder in eckigen Klammern dahinterschreiben."));
k.push(p("Teil A sind die langen Texte, also die Hilfe und die Rechtstexte. Dort lohnt sich die meiste Arbeit, weil sie am Stück gelesen werden."));
k.push(p("Teil B sind die kurzen Beschriftungen: Knöpfe, Titel, Meldungen, Erklärzeilen. Sie sind nach Bereich der App geordnet."));
k.push(p("In Teil A steht vor einer Bildbeschriftung das Wort „Bildbeschriftung“; Aufzählungspunkte sind eingerückt und mit · gekennzeichnet.", { color: "5A554C" }));

// ------------------------------------------------------------- Teil A
k.push(new Paragraph({ children: [new PageBreak()] }));
k.push(new Paragraph({ text: "Teil A: die langen Texte", heading: HeadingLevel.HEADING_1 }));

k.push(h("A1 · Hilfe: Anleitung", HeadingLevel.HEADING_2));
for (const [titel, absaetze] of T.anleitung) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  for (const [art, t] of absaetze) k.push(...langZeile(t, art));
}

k.push(h("A2 · Hilfe: Lerntipps", HeadingLevel.HEADING_2));
for (const [titel, text] of T.tipps) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  k.push(...langZeile(text, "P"));
}

k.push(h("A3 · Hilfe: Dahinter", HeadingLevel.HEADING_2));
k.push(...langZeile(T.theorie_lead, "P"));
for (const [titel, absaetze] of T.theorie) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  for (const [art, t] of absaetze) k.push(...langZeile(t, art));
}

k.push(h("A4 · Über SmartVoc", HeadingLevel.HEADING_2));
k.push(...langZeile(T.ueber_lead, "P"));
k.push(h("Datenschutz", HeadingLevel.HEADING_3));
for (const [art, t] of T.datenschutz) k.push(...langZeile(t, art));
k.push(h("Impressum", HeadingLevel.HEADING_3));
for (const [art, t] of T.impressum) k.push(...langZeile(t, art));

// ------------------------------------------------------------- Teil B
k.push(new Paragraph({ children: [new PageBreak()] }));
k.push(new Paragraph({ text: "Teil B: die kurzen Beschriftungen", heading: HeadingLevel.HEADING_1 }));
k.push(p("Nach Bereich der App geordnet. {n}, {p} und ähnliche Klammern sind Platzhalter für Zahlen und Namen; sie müssen genau so stehen bleiben.", { color: "5A554C", after: 240 }));

/* Die Reihenfolge folgt dem Weg durch die App, nicht dem Alphabet: erst
   die vier Bereiche, dann die Einstellungen, dann was sich darueber legt. */
const ordnung = ["Üben", "Übungsplan", "Wortlisten", "Statistik", "Einstellungen",
  "Anzeige-Einstellungen", "Erweiterte Werte", "Konto", "Hilfe (Rahmen)", "Über SmartVoc",
  "Liste einfügen und KI-Prompt", "Wörter prüfen", "Geteilte Liste übernehmen", "Teilen",
  "Listenwahl", "Wort im Detail", "Lernstand", "Lernstandsleiste", "Rückfragen",
  "Auswahlpillen", "Rückmeldungen", "Smart Lists", "Lernstufen", "Ampel",
  "Spalten und Wortarten", "Sprachen", "Sprachpille", "Voreinstellungen",
  "Gratis und Pro", "Kopfzeile", "Lerntipp-Einblendung", "Lateinische Sonderzeichen",
  "Startbild", "Rahmen und Reiter", "Beschriftungen in den Zeichnungen",
  "Anmeldung", "Abgleich mit dem Konto", "Statistik (Auswertungen)", "Latein",
  "Lernmodell", "Rundensteuerung", "Datenhaltung", "Umbauten an alten Daten"];
const gruppen = T.oberflaeche;
const rest = Object.keys(gruppen).filter(g => !ordnung.includes(g) && g !== "Nicht mehr verwendet").sort();
for (const g of [...ordnung, ...rest]) {
  const e = gruppen[g];
  if (!e || !e.length) continue;
  k.push(h(g + "  (" + e.length + ")", HeadingLevel.HEADING_2));
  k.push(tabelle(e.slice().sort((a, b) => a.localeCompare(b, "de"))));
  k.push(p("", { after: 200 }));
}

const doc = new Document({
  creator: "SmartVoc", title: "SmartVoc — alle deutschen Texte",
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1300, right: 1300 } } },
              children: k }],
});
Packer.toBuffer(doc).then(b => {
  fs.writeFileSync("SmartVoc-Texte-Deutsch.docx", b);
  fs.writeFileSync("texte-karte.json", JSON.stringify(karte, null, 1));
  console.log("Teil A:", nA, "| Teil B:", nB, "| Datei geschrieben");
});
