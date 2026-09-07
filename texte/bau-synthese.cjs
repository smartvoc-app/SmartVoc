/* Baut die Synthese-Fassung: meine Abwaegung des externen Reviews, danach
   saemtliche Texte in der Fassung, die daraus folgt. Die frueheren Dateien
   bleiben unangetastet -- diese hier ist eine neue Kopie. */
const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, BorderStyle, PageBreak } = d;

const T  = JSON.parse(fs.readFileSync(process.env.EN ? "texte-en.json" : "texte.json", "utf8"));
/* Teil A1 kommt aus dem Programmtext, nicht aus einer Zwischendatei.
   Sonst laufen Dokument und App auseinander, sobald ich beim Einbauen
   einen Satz noch anfasse -- und genau das ist passiert. */
const B  = process.env.EN ? [] : JSON.parse(fs.readFileSync("synthese-b.json", "utf8"));
const EN = !!process.env.EN;   // dieselbe Vorlage, andere Sprache

const GRAU = "9A958B", GRUEN = "1E6B45", ROT = "9B2C2C", BRAUN = "8A4B00";
const karte = {};
let nA = 0, nB = 0;
const SPALTEN = [1120, 7880];

/* Der Extraktor las den Prompt-Baustein falsch, weil dort gerade
   Anfuehrungszeichen mitten in einer Vorlagenzeichenkette stehen. Bis das
   im Programm auf typografische umgestellt ist, steht hier der gemeinte
   Text -- sonst wandert das Bruchstueck in die Uebersetzung. */
const REPARATUR = { 'statt „ß': 'Schweizer Schreibung: „ss“ statt „ß“.' };

const ERSATZ = new Map();
for (const [, art, alt, neu] of B)
  if ((art === "ja" || art === "angepasst") && neu && neu !== alt) ERSATZ.set(alt, neu);

const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, before: o.before ?? 0 },
  indent: o.einzug,
  children: [new TextRun({ text, bold: o.bold, italics: o.kursiv, size: o.size ?? 21,
                           color: o.color, font: "Calibri" })],
});
const h = (text, lvl) => new Paragraph({ text, heading: lvl, spacing: { before: 260, after: 120 } });

const nummer = (prefix, n) => prefix + String(n).padStart(3, "0");

function titelZeile(text, lvl) {
  const id = nummer("A-", ++nA);
  karte[id] = text;
  return new Paragraph({ heading: lvl, spacing: { before: 300, after: 120 },
    children: [new TextRun({ text: id + "  ", size: 15, color: GRAU, font: "Consolas" }),
               new TextRun({ text })] });
}

/* Zeilenarten: P Absatz, L Aufzaehlung, S Bildbeschriftung, H fette Frage,
   G Auftrag an die Grafik (kein Text der App, deshalb nicht nummeriert). */
function langZeile(text, art) {
  if (art === "G") return [p("[Grafik zeigt: " + text + "]",
    { color: BRAUN, kursiv: true, size: 19, einzug: { left: 340 }, after: 140 })];
  const id = nummer("A-", ++nA);
  karte[id] = text;
  const einzug = art === "L" ? { left: 340 } : undefined;
  return [
    new Paragraph({ spacing: { before: 140, after: 20 }, indent: einzug,
      children: [new TextRun({ text: id, size: 15, color: GRAU, font: "Consolas" }),
                 ...(art === "S" ? [new TextRun({ text: "  Bildbeschriftung", size: 15, color: GRAU, font: "Consolas" })] : [])] }),
    new Paragraph({ spacing: { after: 60 }, indent: einzug,
      children: [new TextRun({ text: (art === "L" ? "· " : "") + text,
                               size: art === "H" ? 22 : 21,
                               bold: art === "H",
                               italics: art === "S",
                               color: art === "S" ? "5A554C" : undefined,
                               font: "Calibri" })] }),
  ];
}

function zelle(kinder, breite, fill) {
  return new TableCell({ width: { size: breite, type: WidthType.DXA },
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: kinder });
}

/* Teil B: der Text in der neuen Fassung. Wo etwas geaendert wurde, steht
   die alte Fassung klein darunter -- so ist beim Gegenlesen sichtbar, was
   sich bewegt hat, ohne dass die Liste unlesbar wird. */
function tabelle(eintraege) {
  const zeilen = [new TableRow({ tableHeader: true, children: ["Nr.", "Text"].map((t, i) =>
    zelle([p(t, { bold: true, size: 18, after: 0 })], SPALTEN[i], "EFEAE0")) })];
  for (const roh of eintraege) {
    const text = REPARATUR[roh] ?? roh;
    const neu = ERSATZ.get(text);
    const id = nummer("B-", ++nB);
    karte[id] = neu ?? text;
    zeilen.push(new TableRow({ children: [
      zelle([new Paragraph({ spacing: { after: 0 },
        children: [new TextRun({ text: id, size: 15, color: GRAU, font: "Consolas" })] })], SPALTEN[0]),
      zelle([p(neu ?? text, { after: 0 })], SPALTEN[1]),
    ] }));
  }
  return new Table({ columnWidths: SPALTEN, width: { size: 9000, type: WidthType.DXA }, rows: zeilen });
}

const k = [];

// ------------------------------------------------------------------ Kopf
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p(EN ? "All English texts of the app" : "Sämtliche deutschen Texte der App", { size: 26, color: "5A554C", after: 40 }));
k.push(p(EN ? "7 September 2026 · generated from the program text (texte/sammle-texte.mjs)" : "Stand 7. September 2026 · aus dem Programmtext erzeugt (texte/sammle-texte.mjs)", { size: 19, color: GRAU, after: 320 }));

k.push(h(EN ? "How to work with this" : "So arbeitest du damit", HeadingLevel.HEADING_2));
k.push(p(EN ? "Every text carries a number. Change the text, but leave the number in place. Comments can be attached as Word comments or written in square brackets after the text." : "Jeder Text trägt eine Nummer. Ändere den Text, aber lass die Nummer stehen. Kommentare kannst du als Word-Kommentar anhängen oder in eckigen Klammern dahinterschreiben."));
k.push(p(EN ? "Part A holds the long texts, that is the help and the legal notices. Part B holds the short labels: buttons, titles, messages, explanatory lines. They are ordered by area of the app." : "Teil A sind die langen Texte, also die Hilfe und die Rechtstexte. Teil B sind die kurzen Beschriftungen: Knöpfe, Titel, Meldungen, Erklärzeilen. Sie sind nach Bereich der App geordnet."));
k.push(p(EN ? "In Part A, an image caption is preceded by the word “Bildbeschriftung”; bullet points are indented and marked with ·. Content that stays German on purpose (card examples, the AI prompt) is left as it is: the app translates into German, so a card shows German solutions." : "In Teil A steht vor einer Bildbeschriftung das Wort „Bildbeschriftung“; Aufzählungspunkte sind eingerückt und mit · gekennzeichnet. Braun-kursive Klammern beschreiben, was die zugehörige Grafik zeigen muss, sie sind kein Text der App und tragen keine Nummer.", { color: "5A554C" }));

// -------------------------------------------------------------- Teil A
k.push(new Paragraph({ children: [new PageBreak()] }));
k.push(new Paragraph({ text: EN ? "Part A: the long texts" : "Teil A: die langen Texte", heading: HeadingLevel.HEADING_1 }));

k.push(h(EN ? "A1 · Help: Guide" : "A1 · Hilfe: Anleitung", HeadingLevel.HEADING_2));
for (const [titel, absaetze] of T.anleitung) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  for (const [art, t] of absaetze) k.push(...langZeile(t, art));
}

k.push(h(EN ? "A2 · Help: Study tips" : "A2 · Hilfe: Lerntipps", HeadingLevel.HEADING_2));
for (const [titel, text] of T.tipps) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  k.push(...langZeile(text, "P"));
}

k.push(h(EN ? "A3 · Help: Behind it" : "A3 · Hilfe: Dahinter", HeadingLevel.HEADING_2));
k.push(...langZeile(T.theorie_lead, "P"));
for (const [titel, absaetze] of T.theorie) {
  k.push(titelZeile(titel, HeadingLevel.HEADING_3));
  for (const [art, t] of absaetze) k.push(...langZeile(t, art));
}

k.push(h(EN ? "A4 · About SmartVoc" : "A4 · Über SmartVoc", HeadingLevel.HEADING_2));
if (T.ueber_lead) k.push(...langZeile(T.ueber_lead, "P"));
k.push(h(EN ? "Privacy" : "Datenschutz", HeadingLevel.HEADING_3));
for (const [art, t] of T.datenschutz) k.push(...langZeile(t, art));
k.push(h(EN ? "Imprint" : "Impressum", HeadingLevel.HEADING_3));
for (const [art, t] of T.impressum) k.push(...langZeile(t, art));

// -------------------------------------------------------------- Teil B
k.push(new Paragraph({ children: [new PageBreak()] }));
k.push(new Paragraph({ text: EN ? "Part B: the short labels" : "Teil B: die kurzen Beschriftungen", heading: HeadingLevel.HEADING_1 }));
k.push(p(EN ? "Ordered by area of the app. {n}, {p} and similar braces are placeholders for numbers and names; they have to stay exactly as they are." : "Nach Bereich der App geordnet. {n}, {p} und ähnliche Klammern sind Platzhalter für Zahlen und Namen; sie müssen genau so stehen bleiben.", { color: "5A554C", after: 240 }));

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
/* Die Bereichsnamen sind Ueberschriften des Dokuments, keine Texte der App --
   sie stehen deshalb hier und nicht in i18n.en.ts. */
const BEREICH_EN = {
  "Üben": "Practise", "Übungsplan": "Practice plan", "Wortlisten": "Word lists",
  "Statistik": "Statistics", "Einstellungen": "Settings",
  "Anzeige-Einstellungen": "Display settings", "Erweiterte Werte": "Advanced values",
  "Konto": "Account", "Hilfe (Rahmen)": "Help (frame)", "Über SmartVoc": "About SmartVoc",
  "Liste einfügen und KI-Prompt": "Paste a list and AI prompt", "Wörter prüfen": "Checking words",
  "Geteilte Liste übernehmen": "Taking a shared list", "Teilen": "Sharing",
  "Listenwahl": "List picker", "Wort im Detail": "Word in detail", "Lernstand": "Progress",
  "Lernstandsleiste": "Progress bar", "Rückfragen": "Confirmations", "Auswahlpillen": "Selection pills",
  "Rückmeldungen": "Feedback", "Smart Lists": "Smart lists", "Lernstufen": "Levels",
  "Ampel": "Traffic light", "Spalten und Wortarten": "Columns and parts of speech",
  "Sprachen": "Languages", "Sprachpille": "Language pill", "Voreinstellungen": "Defaults",
  "Gratis und Pro": "Free and Pro", "Kopfzeile": "Header",
  "Lerntipp-Einblendung": "Study tip popup", "Lateinische Sonderzeichen": "Latin special characters",
  "Startbild": "Splash screen", "Rahmen und Reiter": "Frame and tabs",
  "Beschriftungen in den Zeichnungen": "Labels in the drawings", "Anmeldung": "Sign-in",
  "Abgleich mit dem Konto": "Sync with the account", "Statistik (Auswertungen)": "Statistics (analyses)",
  "Latein": "Latin", "Lernmodell": "Learning model", "Rundensteuerung": "Round control",
  "Datenhaltung": "Data storage", "Umbauten an alten Daten": "Migrations of old data",
};
const bereichName = (g) => (EN ? (BEREICH_EN[g] || g) : g);
const gruppen = T.oberflaeche;
const rest = Object.keys(gruppen).filter(g => !ordnung.includes(g) && g !== "Nicht mehr verwendet").sort();
for (const g of [...ordnung, ...rest]) {
  const e = gruppen[g];
  if (!e || !e.length) continue;
  k.push(h(bereichName(g) + "  (" + e.length + ")", HeadingLevel.HEADING_2));
  k.push(tabelle(e.slice().sort((a, b) => a.localeCompare(b, "de"))));
  k.push(p("", { after: 200 }));
}

const doc = new Document({
  creator: "SmartVoc", title: "SmartVoc — alle deutschen Texte, Synthese",
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1300, right: 1300 } } },
              children: k }],
});
Packer.toBuffer(doc).then(b => {
  fs.writeFileSync(EN ? "SmartVoc-Texts-English.docx" : "SmartVoc-Texte-Deutsch_v3.docx", b);
  fs.writeFileSync(EN ? "texte-karte-en.json" : "texte-karte-v3.json", JSON.stringify(karte, null, 1));
  const geaendert = [...ERSATZ.keys()].length;
  console.log("Teil A:", nA, "| Teil B:", nB, "| geänderte Beschriftungen:", geaendert);
});
