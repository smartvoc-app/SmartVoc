/* Das Prüfprotokoll. Was geprüft wurde, wie, was dabei herauskam.
   Machart wie das Setup-Memo: Fliesstext, wo etwas zu erklären ist,
   Tabellen, wo etwas nachzuschlagen ist. */
const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, LevelFormat, AlignmentType } = d;

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  numbering: o.punkt ? { reference: "striche", level: 0 } : undefined,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.kursiv,
                           size: o.size ?? 21, color: o.color, font: "Calibri" })],
});
/* Ein Absatz aus mehreren Stücken -- für fett hervorgehobene Wörter im Satz. */
const pm = (stuecke, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  numbering: o.punkt ? { reference: "striche", level: 0 } : undefined,
  children: stuecke.map((s) => typeof s === "string"
    ? new TextRun({ text: s, size: 21, font: "Calibri" })
    : new TextRun({ text: s.t, bold: s.b, italics: s.k, size: s.size ?? 21,
                    color: s.c, font: s.mono ? "Consolas" : "Calibri" })),
});
const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 100 } });

function tab(kopf, zeilen, breiten) {
  const B = breiten || kopf.map(() => Math.floor(9000 / kopf.length));
  const zelle = (t, i, fett) => new TableCell({
    width: { size: B[i], type: WidthType.DXA },
    shading: fett ? { type: ShadingType.CLEAR, fill: "6B7280" } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [p(String(t), { bold: fett, size: 19, after: 0, color: fett ? "FFFFFF" : undefined })],
  });
  return new Table({
    columnWidths: B, width: { size: 9000, type: WidthType.DXA },
    rows: [new TableRow({ tableHeader: true, children: kopf.map((t, i) => zelle(t, i, true)) }),
           ...zeilen.map((z) => new TableRow({ children: z.map((t, i) => zelle(t, i, false)) }))],
  });
}

/* Ein Fund: Symptom, Ursache, Nachweis, Behebung -- immer dieselben vier Zeilen,
   damit man sie nebeneinander lesen kann. */
function fund(nr, titel, schwere, felder) {
  const raus = [];
  raus.push(new Paragraph({ text: `${nr}  ${titel}`, heading: HeadingLevel.HEADING_2,
                            spacing: { before: 280, after: 60 } }));
  raus.push(p(schwere.toUpperCase(), { bold: true, size: 17,
    color: schwere === "schwer" ? "9B2C2C" : schwere === "mittel" ? "8A4B00" : "5A554C", after: 110 }));
  for (const [name, text] of felder) raus.push(pm([{ t: name + "  ", b: true }, text], { after: 90 }));
  return raus;
}

const k = [];
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p("Prüfprotokoll — was geprüft wurde, wie, und was dabei herauskam", { size: 26, color: "5A554C", after: 40 }));
k.push(p("Stand 8. September 2026", { size: 19, color: "9A958B", after: 240 }));
k.push(p("Geprüft wurde ausschliesslich, was ohne Mitwirkung von aussen prüfbar ist: Rechenwege, Datenwege, beide Sprachfassungen, jeder Bildschirm und jedes Fenster. Was ein Gerät, einen echten Postversand oder ein Apple-Konto braucht, steht in Abschnitt 8 als offen.", { kursiv: true, color: "5A554C", after: 240 }));

// ---------------------------------------------------------------- 1
k.push(h1("1  Ergebnis in Kürze"));
k.push(p("Vierzehn Befunde, alle behoben. Zwei davon hätten Benutzer Daten gekostet, sechs betrafen die englische Fassung, drei waren falsche Erklärtexte, zwei eine Einstellung ohne Wirkung, einer ein Absturzweg."));
k.push(tab(["", "Befunde", "Behoben"], [
  ["Datenverlust", "2", "2"],
  ["Englische Fassung unvollständig oder gemischt", "6", "6"],
  ["Text erklärt etwas anderes, als der Code tut", "3", "3"],
  ["Einstellung ohne die versprochene Wirkung", "2", "2"],
  ["Absturz bei unvollständigen Daten", "1", "1"],
  ["Summe", "14", "14"],
], [4200, 2400, 2400]));
k.push(p("Die 149 automatisierten Prüffälle laufen alle durch. Der Durchlauf durch die Oberfläche meldet in beiden Sprachen keinen fehlenden Text mehr.", { after: 160 }));

// ---------------------------------------------------------------- 2
k.push(h1("2  Wie geprüft wurde"));
k.push(p("Drei Verfahren, weil jedes etwas anderes findet."));
k.push(h2("2.1  Rechnen gegen Erwartung"));
k.push(p("Sieben Skripte im Ordner «pruef» rufen den echten Code der App auf — nicht eine Nachbildung — und vergleichen das Ergebnis mit einer von Hand hingeschriebenen Erwartung. Sie benutzen dabei die echten Voreinstellungen aus defaults.ts, damit kein Prüffall etwas misst, das im Betrieb nie vorkommt."));
k.push(pm([{ t: "Eine Warnung an mich selbst: ", b: true }, "Im ersten Anlauf habe ich der Bewertungsfunktion ein leeres Einstellungsobjekt übergeben. Sie schaltet dann auf nachsichtige Gross- und Kleinschreibung, die App tut das nie. Beinahe hätte ich einen Fehler gemeldet, den es nicht gibt. Seither übergibt jeder Prüffall die echten Voreinstellungen."], { after: 150 }));
k.push(h2("2.2  Durchlauf durch die Oberfläche"));
k.push(p("Die App wurde im Entwicklungsmodus gestartet und mit gesätem Übungsverlauf gefüllt — 270 Wörter über alle fünf Stufen verteilt, eine Liste mit Termin. Dann jeder Bildschirm, jedes Fenster und jede Antwortart einmal angefahren, zuerst auf Englisch, danach auf Deutsch."));
k.push(p("Dabei half ein Melder, den die App selbst mitbringt: Läuft ein Text durch die Übersetzung, ohne dass eine englische Fassung hinterlegt ist, schreibt sie das in die Entwicklerkonsole. Am Ende des Durchlaufs war diese Liste leer."));
k.push(h2("2.3  Lesen gegen Lesen"));
k.push(p("Der Textsammler zieht alle Oberflächentexte aus dem Quelltext und stellt sie den Einträgen der englischen Tabelle gegenüber. Er findet auch die umgekehrte Lücke: Texte, für die eine Übersetzung bereitliegt, die aber ohne Übersetzungsaufruf ausgegeben werden. Genau dort lagen mehrere Befunde."));

// ---------------------------------------------------------------- 3
k.push(h1("3  Die Befunde im Einzelnen"));

k.push(...fund("3.1", "Das eigene Exportformat war nicht wieder einlesbar", "schwer", [
  ["Symptom", "Ein Wort ohne Aussprache verlor beim Wiedereinlesen seine deutsche Bedeutung. Die Übersetzung landete im Feld für die Aussprache, die Wortart verschwand. Betroffen war fast jedes Wort, denn die Aussprache füllt kaum jemand aus."],
  ["Wege", "Alle drei Befüllungswege über Text: Liste exportieren und wieder einfügen, ausgefüllte Excel-Vorlage als Text, Tabelle aus einer KI-App."],
  ["Ursache", "Der Einleser erkennt das vollständige Format an seiner Spaltenzahl. Vorher wurden aber leere Felder am Zeilenende weggeschnitten — gedacht für von Hand getippte Zeilen mit einem überzähligen Trennstrich. Eine exportierte Zeile ohne Aussprache verlor dadurch ihre letzten Spalten, unterschritt die Zahl und wurde als Kurzformat gelesen."],
  ["Nachweis", "pruef/04-rundlauf.mjs, sechs von siebzehn Fällen schlugen fehl. Zusätzlich in der laufenden App durchgespielt: die Zeile «cloud |  |  | Nomen | die Wolke |  |  |  |  | » legt «die Wolke» jetzt im Feld Deutsch ab."],
  ["Behebung", "Hat eine Zeile genau so viele Spalten wie das Vollformat, bleibt sie unangetastet. Die Zahl wird aus der einen Spaltenliste gezählt, nicht von Hand geführt."],
]));

k.push(...fund("3.2", "Leere Beispielsätze wurden als leere Sätze gespeichert", "mittel", [
  ["Symptom", "Ein Wort ohne Beispielsätze bekam zwei leere Sätze zugewiesen statt keiner."],
  ["Ursache", "Die Kurzformen des Einlesers filtern leere Felder heraus, das Vollformat tat es nicht."],
  ["Behebung", "Satz und Übersetzung werden als Paar geführt und gemeinsam verworfen, wenn der Satz fehlt. So kann die Übersetzung nicht beim falschen Satz landen."],
]));

k.push(...fund("3.3", "Die Bewertung meldete auf Deutsch", "schwer", [
  ["Symptom", "In der englischen Fassung stand nach jeder Antwort «RICHTIG», «FAST RICHTIG» oder «NICHT GANZ» — also bei jeder einzelnen Karte."],
  ["Ursache", "Der Aufruf der Übersetzung war vorhanden, die drei Einträge fehlten in der englischen Tabelle."],
  ["Behebung", "RIGHT, ALMOST, NOT QUITE ergänzt und in der laufenden App bestätigt."],
]));

k.push(...fund("3.4", "Sprachnamen und Datum standen deutsch in der englischen Fassung", "mittel", [
  ["Symptom", "«Englisch ⇄ Deutsch» im Sprachwähler, «ENGLISCH / DEUTSCH» über der Wörterliste, «Deutsch» fest verdrahtet in drei Fenstertiteln, und das Zieldatum als «Fr., 11.9.» statt «Fri, 11/09»."],
  ["Ursache", "Die Sprachnamen sind übersetzt, wurden aber nicht abgerufen. Beim Datum umgingen zwei Stellen die vorhandene Sprachweiche und schrieben «de-CH» hin."],
  ["Behebung", "Beides an die vorhandenen Mittel angeschlossen. Gegenprobe auf Deutsch: dort steht wieder «11.9.»."],
]));

k.push(...fund("3.5", "Der Darstellungsbereich der Einstellungen war ganz deutsch", "mittel", [
  ["Symptom", "Automatisch/Hell/Dunkel, Kladde/Tinte/Graphit, Liniert/Blanko/Altpapier/Leinen, Serif/Grotesk/Handschrift, dazu «Erweiterte Einstellungen» und «aus-/einklappen»."],
  ["Ursache", "Teils fehlende Einträge, teils Text ohne Übersetzungsaufruf."],
  ["Behebung", "24 Einträge ergänzt, drei Stellen angeschlossen."],
]));

k.push(...fund("3.6", "Zwei Fenster gaben Text ohne Übersetzung aus", "mittel", [
  ["Symptom", "Beim Übernehmen einer geteilten Liste erschienen die drei Fehlermeldungen, der Vorgabename und der Hinweistext deutsch; ebenso die Hilfe zu den vier Schnellzugriffen im Üben-Bereich."],
  ["Ursache", "Die Übersetzungen lagen bereit und wurden nicht abgerufen."],
  ["Behebung", "Angeschlossen. Zusätzlich baute das Fenster die Mehrzahl selbst zusammen («Wört» + «er»); das läuft jetzt über dasselbe Muster wie überall sonst."],
]));

k.push(...fund("3.7", "«3 Worter erkannt»", "leicht", [
  ["Symptom", "Beim Prüfen eingefügter Wörter fehlte der Umlaut."],
  ["Ursache", "Die Mehrzahl wurde durch Anhängen von «er» an «Wort» gebildet. Derselbe Satz lief ausserdem ohne Übersetzungsaufruf."],
  ["Behebung", "Beides behoben. Zwei Zeilen weiter unten benutzt dieselbe Datei längst das richtige Muster."],
]));

k.push(...fund("3.8", "«Umlaute und Akzente streng» hatte keine Wirkung", "mittel", [
  ["Symptom", "Der Schalter verspricht: «grun» statt «grün» gilt dann als falsch. Tatsächlich kam weiterhin «fast richtig» zurück."],
  ["Ursache", "Bei eingeschaltetem Schalter wurde der Akzentzweig übersprungen — und die Regel für Tippfehler eine Zeile weiter fing denselben Fall wieder auf. Ein fehlender Umlaut ist ein Zeichen Abstand."],
  ["Nachweis", "pruef/07-akzente.mjs. Vier Wortpaare, locker und streng gegenübergestellt, dazu drei Gegenproben, dass sonst nichts kippt."],
  ["Behebung", "Ist der einzige Unterschied ein diakritisches Zeichen und der Schalter an, gilt die Antwort als falsch."],
]));

k.push(...fund("3.9", "Die Ampel wurde an drei Stellen falsch erklärt", "mittel", [
  ["Symptom", "Anleitung und Einstellungstext sagten, die Ampel zähle nur Wörter auf der Stufe «sitzt». Sie zählt «sitzt» und «sitzt fast»."],
  ["Ursache", "Ein Erklärtext, der dem Code nie nachgezogen wurde. Der Code selbst begründet seine Zählweise im Kopfkommentar: Ein Wort, das zwei Wochen hält, ist für eine Prüfung in drei Tagen bereit."],
  ["Bemerkung", "Die dritte Stelle, die Beschriftung «{p} % sitzen», hatte ich in einem früheren Durchgang selbst aus «% bereit» gemacht — auf Vorschlag des Textreviews und im Vertrauen auf denselben falschen Satz."],
  ["Behebung", "Alle drei sagen jetzt «sitzt ganz oder fast», in beiden Sprachen."],
]));

k.push(...fund("3.10", "Die Anmeldung prüfte die Adresse nicht", "leicht", [
  ["Symptom", "Mit «pruef» als E-Mail-Adresse war der Knopf freigegeben; der Fehler kam erst vom Server zurück. Beim Passwort daneben zeigt die App längst vor dem Absenden an, was fehlt."],
  ["Behebung", "Die Adresse steht jetzt als dritte Regel neben den beiden Passwortregeln, mit denselben drei Zuständen. Geprüft wird grob auf die Form, nicht darauf, welche Adressen es gibt."],
]));

k.push(...fund("3.11", "Ein halber Statistikeintrag beendete die App", "mittel", [
  ["Symptom", "Weisser Bildschirm mitten in der Übung, sobald eine Antwort auf ein Wort fiel, dessen Statistikeintrag kein Verlaufsfeld hatte."],
  ["Ehrlichkeitshalber", "Ausgelöst durch meine eigenen Prüfdaten, nicht durch die App. Das Feld steht seit dem allerersten Commit im Code, kein ausgelieferter Stand schreibt Einträge ohne es."],
  ["Warum trotzdem behoben", "Der Vorgabewert daneben greift nur, wenn der Eintrag ganz fehlt — ein halber Eintrag lief ungeprüft durch. Sicherungsdateien sind von Hand änderbar, und der Ausfall ist der denkbar unangenehmste: die App ist weg, mitten im Lernen."],
]));

k.push(...fund("3.12", "Ein Beispielsatz verglich eine Zahl mit sich selbst", "leicht", [
  ["Symptom", "Bei der Lernintensität stand «hält ~46 statt ~46 Tage» — und «statt … Tage» blieb auch in der englischen Fassung deutsch."],
  ["Behebung", "Der Vergleich erscheint nur noch, wenn tatsächlich etwas verstellt ist. Der ganze Satz läuft jetzt durch die Übersetzung."],
]));

k.push(...fund("3.13", "Die Ampel-Legende wurde zweimal übersetzt", "leicht", [
  ["Symptom", "Kein sichtbarer Schaden, aber die englischen Wörter «Ready», «On track», «Behind» tauchten als fehlende Übersetzungen auf."],
  ["Ursache", "Die Legende liefert bereits übersetzten Text, das Rendern übersetzte ein zweites Mal."],
  ["Behebung", "Der zweite Aufruf ist weg."],
]));

k.push(...fund("3.14", "Zwei veraltete Kommentare an der einen Quelle der Spalten", "leicht", [
  ["Symptom", "Die Datei, die ausdrücklich die eine Quelle für alle Spalten sein soll, zählte in ihrem Kopf neun statt zehn und liess «Genus» aus. Derselbe Fehler im Einleser."],
  ["Warum das zählt", "Der Kommentar wird gelesen, wenn jemand das Format ändern will. Der KI-Prompt daneben zählt die Spalten selbst und war korrekt."],
  ["Behebung", "Beide Kommentare berichtigt."],
]));

// ---------------------------------------------------------------- 4
k.push(h1("4  Was geprüft wurde — Rechnen"));
k.push(p("Die Skripte liegen im Ordner «pruef» und lassen sich einzeln starten, zum Beispiel mit «npx tsx pruef/01-bewertung.mjs»."));
k.push(tab(["Skript", "Prüft", "Fälle"], [
  ["01-bewertung", "Antwortbewertung: genau richtig, ß gegen ss, Artikel in allen vier Modi, Akzente, Längenzeichen, Tippfehler, ganz daneben", "21"],
  ["02-stufen", "Stufeneinteilung, Fälligkeit, hartnäckige Wörter, Ampelschwellen", "24"],
  ["03-auswahl", "Tagesportion mit Obergrenze, Anteil neuer Wörter, alle Schnellzugriffe, Endspurt vor einem Termin", "15"],
  ["04-rundlauf", "Was die App ausgibt, liest sie wieder ein: voll ausgefüllt, knapp, ohne Aussprache, Latein, Trennzeichen im Inhalt", "17"],
  ["05-tabelle-sprachen", "Erkennt der Excel-Einleser jede Spalte der eigenen Vorlage — für alle sechs Sprachpaare", "72"],
  ["06-sprachen", "Vollständigkeit der englischen Fassung, deutsche Reste, Platzhalter, Texte ohne Übersetzungsaufruf", "—"],
  ["07-akzente", "Wirkung des strengen Schalters, mit Gegenproben", "7"],
], [2100, 5300, 1600]));
k.push(p("Summe: 149 Prüffälle, alle wie erwartet.", { bold: true, after: 160 }));

k.push(h2("4.1  Bewertung von Antworten"));
k.push(p("Geprüft wurde die ganze Kette in der Reihenfolge, in der die App sie durchläuft: genaue Übereinstimmung mit ß und ss als gleichwertig, dann der Artikel, dann Längenzeichen, dann Akzente, dann die Ähnlichkeit für Tippfehler, sonst falsch."));
k.push(pm([{ t: "Zum ß: ", b: true }, "In beschreibenden Texten gilt die deutsche Rechtschreibung mit ß. Bei der Abfrage werden ß und ss beide als richtig gewertet — «Fuss» und «Fuß» sind derselbe Treffer. So festgelegt und so geprüft."], { after: 140 }));

k.push(h2("4.2  Stufen und Fälligkeit"));
k.push(p("Die fünf Stufen und ihre Schwellen, der Fälligkeitstag aus der Haltedauer, die Erkennung hartnäckiger Wörter über Schwierigkeit und Rückfälle, und die drei Ampelfarben an ihren Schwellen."));

k.push(h2("4.3  Welche Wörter drankommen"));
k.push(p("Die Tagesportion hält ihre Obergrenze ein und nimmt nicht mehr neue Wörter auf als eingestellt. Sitzende, noch nicht fällige Wörter kommen nicht vor. Vor einem Termin hebt der Endspurt die Tagesgrenze auf — im Prüffall von 30 auf 70 Karten."));

k.push(h2("4.4  Die Excel-Vorlage über alle Sprachen"));
k.push(p("Für jedes der sechs Sprachpaare wurde die Vorlage erzeugt und geprüft, ob der Einleser jede ihrer zehn Spalten wiederfindet. Der heikle Fall ist «Deutsch», das auch in «Beispielsatz 1 deutsch» steckt — die Unterscheidung hält in allen sechs Fällen."));

// ---------------------------------------------------------------- 5
k.push(h1("5  Was geprüft wurde — Oberfläche"));
k.push(tab(["Bereich", "Geprüft", "Ergebnis"], [
  ["Üben", "Alle vier Antwortarten, Karte, Rückmeldung, Rundenfortschritt, Beispielsätze, Lautschrift, Stammformen", "Befund 3.3"],
  ["Schnellzugriffe", "Alle vier, ihre Zahlen und das Hilfefenster", "Befund 3.6"],
  ["Übungsplan", "Kalender, Terminliste, Sprachfilter, Ampellegende", "Befund 3.4, 3.13"],
  ["Wortlisten", "Übersicht, Liste öffnen, Wörter ansehen und bearbeiten, Vorlage, Zusammenführen", "Befund 3.4"],
  ["Statistik", "Verteilung, Zeiträume, hartnäckige Wörter, Tabelle, erweiterte Werte", "Befund 3.5"],
  ["Einstellungen", "Jeder Abschnitt, alle Blätter, erweiterte Einstellungen ausgeklappt", "Befund 3.5, 3.12"],
  ["Konto", "Anmelden, Registrieren mit Regelanzeige, Passwort vergessen", "Befund 3.10"],
  ["Anleitung", "Alle zehn Kapitel, Lerntipps, Hintergrund", "ohne Befund"],
  ["Rechtstexte", "Datenschutz und Impressum in beiden Sprachen", "ohne Befund"],
], [1900, 5100, 2000]));

k.push(h2("5.1  Wortlisten anlegen und befüllen"));
k.push(p("Alle fünf angebotenen Wege wurden angesehen, der Einfügeweg vollständig durchgespielt: drei Zeilen im Vollformat eingefügt, im Prüffenster kontrolliert, eine neue Liste angelegt, Wörter übernommen und anschliessend im Speicher nachgesehen."));
k.push(tab(["Weg", "Geprüft", "Ergebnis"], [
  ["Leere Liste anlegen", "Name, Zieldatum", "in Ordnung"],
  ["Liste einfügen", "Vollformat, Kurzformat, Prüffenster, Listenwahl, Speicherung", "Befund 3.1, 3.2, 3.7"],
  ["Tabelle einlesen", "Spaltenerkennung über alle sechs Sprachen", "in Ordnung"],
  ["Leere Vorlage", "Erzeugung, Spaltenzahl, Dateiname je Sprache", "in Ordnung"],
  ["Geteilte Liste", "Fenster, Fehlermeldungen, Vorgabename", "Befund 3.6"],
], [2300, 4400, 2300]));
k.push(p("Nachgesehen wurde im Speicher, nicht nur auf dem Bildschirm: «cloud» hat die Bedeutung im Feld Deutsch, ein leeres Aussprachefeld und keine Beispielsätze. «to run» hat beide Satzpaare richtig zugeordnet.", { after: 150 }));

k.push(h2("5.2  Beide Sprachen"));
k.push(p("Der Durchlauf lief zweimal, einmal je Sprache. Deutscher Karteninhalt bleibt dabei absichtlich deutsch: die Wörter selbst, die Beispielsätze, die Formatbeispiele im KI-Prompt. Denn die Muttersprache ist in dieser App immer Deutsch — die englische Fassung betrifft die Bedienung, nicht den Lernstoff."));
k.push(tab(["Kennzahl", "Wert"], [
  ["Oberflächentexte deutsch", "697"],
  ["Einträge in der englischen Tabelle", "762"],
  ["Ohne englische Fassung", "23 — alle bewusst deutscher Karteninhalt"],
  ["Englische Werte mit deutschen Spuren", "2 — beide gewollt (deutsche Artikel als Lernstoff)"],
  ["Platzhalter, die nicht übereinstimmen", "0"],
  ["Vom Melder gefundene Lücken nach der Behebung", "0"],
], [4000, 5000]));

// ---------------------------------------------------------------- 6
k.push(h1("6  Was ohne Befund blieb"));
k.push(p("Damit klar ist, was geprüft und für richtig befunden wurde, nicht bloss ausgelassen:"));
[
  "Die Bewertungskette in allen vier Artikelmodi und mit beiden Einstellungen zur Gross- und Kleinschreibung.",
  "Die Fälligkeitsrechnung und alle fünf Stufen, auch an ihren Schwellen.",
  "Die Zusammenstellung der Tagesportion samt Obergrenzen und Endspurt.",
  "Der Excel-Weg für alle sechs Sprachpaare, einschliesslich der heiklen Spaltennamen.",
  "Latein: Grundform, Stammformen, Längenzeichen, die Modi L2 und L3.",
  "Die Anleitung in beiden Sprachen, alle zehn Kapitel.",
  "Die Rechtstexte in beiden Sprachen.",
  "Die deutsche Fassung nach allen Änderungen — sie ist unverändert vollständig.",
].forEach((t) => k.push(p(t, { punkt: true, after: 60 })));

// ---------------------------------------------------------------- 7
k.push(h1("7  Nebenbefunde ohne Handlungsbedarf"));
k.push(p("Auffälligkeiten, die geprüft und als unbedenklich eingestuft wurden. Sie stehen hier, damit sie beim nächsten Mal nicht erneut Zeit kosten."));
k.push(tab(["Beobachtung", "Warum unbedenklich"], [
  ["Die Bewertung erzeugt einen Erklärtext, der teils deutsch, teils englisch ist",
   "Das Feld wird nirgends angezeigt. Kein sichtbarer Schaden — aber eine Falle, falls es später einmal angezeigt wird."],
  ["Die ältere Reihe der Schnellzugriffe trägt englische Beschriftungen",
   "Sie werden nie gerendert; sichtbar ist die neuere Reihe mit deutschen Schlüsseln."],
  ["Die Bewertung schaltet ohne Einstellungsobjekt auf nachsichtige Schreibweise",
   "Alle Aufrufer übergeben die Einstellungen. Im Betrieb kann der Fall nicht eintreten."],
  ["86 englische Einträge ohne deutsches Gegenstück",
   "Rückstände umbenannter Texte. Sie kosten nichts ausser Platz."],
], [4000, 5000]));

// ---------------------------------------------------------------- 8
k.push(h1("8  Was offen bleibt"));
k.push(p("Diese Punkte lassen sich nur mit Mitwirkung von aussen prüfen. Sie sind keine Befunde, sondern offene Prüfschritte."));
k.push(tab(["Offen", "Weshalb", "Wer"], [
  ["Postversand der Bestätigungsmail", "Braucht einen echten Empfang; der Weg über Infomaniak ist eingerichtet, aber nur einmal von Hand bestätigt", "Martin"],
  ["Abgleich zwischen zwei Geräten", "Braucht zwei angemeldete Geräte", "Martin"],
  ["Verhalten auf echtem iPhone", "Simulator zeigt weder Tastaturverhalten noch Sonderzeichen vollständig", "Martin"],
  ["Kontolöschung durch einen zweiten Benutzer", "Einmal Ende zu Ende bestätigt, nicht wiederholt", "—"],
  ["Ladezeit und Verhalten ohne Netz", "Braucht ein Gerät und eine gedrosselte Verbindung", "—"],
  ["App Store: Bundle-Kennung, Vertrieb, Prüfung", "Apple-Konto war während der Prüfung noch nicht überall sichtbar", "Martin"],
  ["Vertretung in der EU nach Artikel 27", "Erst nötig, wenn Deutschland aktiv bedient wird", "Martin"],
], [2600, 4600, 1800]));

// ---------------------------------------------------------------- 9
k.push(h1("9  Wie man das wiederholt"));
k.push(p("Die Skripte sind so gebaut, dass sie sich vor jeder Auslieferung erneut ausführen lassen."));
k.push(pm([{ t: "Alle Rechenprüfungen: ", b: true },
           { t: "for f in pruef/0*.mjs; do npx tsx $f; done", mono: true }], { after: 90 }));
k.push(pm([{ t: "Sprachvergleich neu erstellen: ", b: true },
           { t: "node texte/sammle-texte.mjs && npx tsx pruef/06-sprachen.mjs", mono: true }], { after: 90 }));
k.push(pm([{ t: "Durchlauf durch die Oberfläche: ", b: true },
           "App im Entwicklungsmodus starten, Sprache auf Englisch stellen, jeden Bildschirm einmal anfahren und die Entwicklerkonsole auf Meldungen mit «keine Übersetzung» ansehen. Ist die Liste leer, fehlt kein Text."], { after: 150 }));
k.push(p("Der letzte Punkt ist der wirksamste, weil er das findet, was kein Skript sieht: Text, der überhaupt nicht durch die Übersetzung läuft.", { kursiv: true, color: "5A554C" }));

const doc = new Document({
  numbering: { config: [{ reference: "striche", levels: [{ level: 0, format: LevelFormat.BULLET,
    text: "–", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  styles: { default: {
    heading1: { run: { size: 30, bold: true, color: "2F3437", font: "Calibri" } },
    heading2: { run: { size: 24, bold: true, color: "4A4F54", font: "Calibri" } },
    title: { run: { size: 46, bold: true, color: "1F2328", font: "Calibri" } },
  } },
  sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
              children: k }],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(__dirname + "/SmartVoc-Pruefprotokoll.docx", b);
  console.log("geschrieben: texte/SmartVoc-Pruefprotokoll.docx");
});
