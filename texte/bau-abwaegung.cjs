/* Die Beurteilung des externen Reviews -- getrennt von der Textsammlung.
   In das Textdokument gehoert Text, sonst nichts. */
const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType } = d;
const B = JSON.parse(fs.readFileSync("synthese-b.json", "utf8"));

const GRAU = "9A958B";
const p = (t, o = {}) => new Paragraph({ spacing: { after: o.after ?? 120, before: o.before ?? 0 },
  indent: o.einzug,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.kursiv, size: o.size ?? 21,
                           color: o.color, font: "Calibri" })] });
const h = (t, l) => new Paragraph({ text: t, heading: l, spacing: { before: 280, after: 120 } });

const SP = [900, 2600, 5500];
const zelle = (kinder, br, fill) => new TableCell({ width: { size: br, type: WidthType.DXA },
  shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
  margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: kinder });

function tabelle(zeilen, kopf) {
  const rows = [new TableRow({ tableHeader: true, children: kopf.map((t, i) =>
    zelle([p(t, { bold: true, size: 18, after: 0 })], SP[i], "EFEAE0")) })];
  for (const z of zeilen) rows.push(new TableRow({ children:
    z.map((t, i) => zelle([p(t, { after: 0, size: 19 })], SP[i])) }));
  return new Table({ columnWidths: SP, width: { size: 9000, type: WidthType.DXA }, rows });
}

const k = [];
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p("Beurteilung des externen Reviews — zwei Runden", { size: 26, color: "5A554C", after: 40 }));
k.push(p("7. September 2026 · Grundlage: die beiden Vorschlagsdokumente des Review-Chats", { size: 19, color: GRAU, after: 320 }));

k.push(p("Runde 1: 89 Vorschläge, Teil A1 vollständig neu geschrieben. Runde 2, nach Vorlage der Bildschirmaufnahmen: 21 weitere Vorschläge. Jeder Punkt wurde gegen den Programmtext geprüft. 84 Beschriftungen sind geändert, fünf Vorschläge abgelehnt, zwei anders gelöst als vorgeschlagen. Die Ergebnisse stehen in SmartVoc-Texte-Deutsch_v3.docx; dieses Papier begründet sie."));

k.push(h("Die Anleitung", HeadingLevel.HEADING_1));
k.push(h("Übernommen", HeadingLevel.HEADING_2));
for (const t of [
 "Der schnellste Weg steht jetzt zuerst. Kapitel 1 beginnt mit dem Grundwortschatz, der ohne jede Vorbereitung bereitliegt; erst danach kommt die eigene Liste. Das war der wichtigste Befund. Der Leerzustand der App behauptete bisher ausdrücklich das Gegenteil („Erfasse deine erste Wortliste, dann kann es losgehen“) — an vier Stellen, und zwar an der ersten, die jemand überhaupt zu sehen bekommt.",
 "Der Mechanismus wird erklärt, bevor seine Folgen beschrieben werden. Das neue Kapitel „Was SmartVoc anders macht“ steht an zweiter Stelle. Damit fällt der defensive Ton weg: Bisher tauchte die Wiederholungslogik nur als Antwort auf Beschwerden auf.",
 "Die beiden Farbskalen werden getrennt. Fünf Stufen je Wort, drei Farben je Liste — beides steht zusammen im Überblickskapitel, weil beides zur gemeinsamen Sprache der App gehört. Übungsplan und Statistik verweisen zurück.",
 "Fünf fehlende Themen sind ergänzt: wie eine Antwort bewertet wird, die Tagesgrenzen, die vier Smart Lists, die Einstellungen (eigenes Kapitel statt Halbsatz) und Latein.",
 "Die FAQ ist von acht auf sechs Fragen gekürzt. Vier waren Dubletten des Fliesstextes, zwei weitere dieselbe Frage.",
 "Sechs sachliche Fehler sind berichtigt: die Ampel ist keine Wahrscheinlichkeitsaussage; ein Fehler setzt den Zähler zurück, nicht das Ziel; der Rat bei Auffrischungen ging an der Frage vorbei; das Zieldatum lässt sich nicht im Plan setzen; der Verweis auf «Smart List» lief ins Leere; die Tagesgrenze stand ohne Zahl.",
]) k.push(p("· " + t, { einzug: { left: 340 } }));

k.push(h("Nicht übernommen: die Kapitelreihenfolge", HeadingLevel.HEADING_2));
k.push(p("Das Review will Wortlisten → Üben → Übungsplan → Statistik, weil die Schnellanleitung in die Wortlisten schickt und der Lesefluss dann ins falsche Kapitel läuft."));
k.push(p("Diese Begründung entfällt, sobald der erste Weg — unten auf Üben tippen — tatsächlich zuerst steht. Und die Reiterreihenfolge hat einen eigenen Wert: Wer die App offen hat und nachschlägt, sucht das Kapitel zu dem Reiter, den er gerade sieht. Die Kapitel folgen deshalb weiter der Reiterleiste."));

k.push(h("Offen: die Grafiken", HeadingLevel.HEADING_2));
k.push(p("Das Review hat recht, dass die Bilder bisher die Gliederung illustrieren statt den Mechanismus. Sieben Bildstellen sind vorgesehen, zwei davon neu und inhaltlich: wie die Abstände zwischen den Wiederholungen wachsen, und wie ein Zieldatum sie zusammenzieht. Was jedes Bild zeigen muss, steht in SmartVoc-Texte-Deutsch_v2.docx braun an Ort und Stelle. Gezeichnet ist noch keines."));

k.push(h("Fünf Vorschläge, die dem Programmtext widersprechen", HeadingLevel.HEADING_1));
k.push(p("Das Review konnte die App nicht aufrufen und hat aus der Spezifikation abgeleitet. An diesen Stellen führt das in die Irre. Die Nummern sind die des Review-Dokuments."));
k.push(tabelle([
 ["B-006", "„kommt in dieser Runde nochmal“", "Die Zeile steht auf der Rundenauswertung; die Zahl ist total − sitNow und meint künftige Sitzungen. „später“ bleibt richtig; nur die Doppelung „zur Wiederholung zurück“ fällt weg."],
 ["B-064", "„überfällig“ grossschreiben", "Die Zeichenkette steht mitten im Satz, hinter einem Mittelpunkt, neben „heute“ und „in {n} Tagen“ — beide klein (Practice.tsx:755)."],
 ["B-071", "„Wackeln noch“ → „Noch unsicher“", "Die Smart List filtert genau die Stufe „wackelt noch“ (engine.ts:240). Der fast gleiche Name ist der Inhalt, nicht ein Versehen."],
 ["B-153", "Export „Excel oder CSV“", "Import und Export sind zwei Funktionen. Der Import nimmt .xlsx, .xls und .csv, der Export schreibt nur .xlsx (WordList.tsx:873). Jetzt: „Excel-Datei (.xlsx)“."],
 ["B-672", "„Wörter ohne Liste“ streichen", "StoreProvider.tsx:343 legt je Sprachpaar eine Systemliste dieses Namens an — sie sorgt erst dafür, dass jedes Wort zu genau einer Liste gehört. Nicht der Text ist falsch, sondern die Spezifikation unvollständig."],
], ["Nr.", "Vorschlag", "Warum nicht"]));

k.push(h("Eine Abweichung wegen des Zielmarkts", HeadingLevel.HEADING_1));
k.push(p("B-236: „zu niedrig“ sollte laut Review zu „zu tief“ werden, der schweizerischen Fügung. Da der grösste Markt nach der Testphase Deutschland ist, bleibt es bei „zu niedrig“. Die Schweizer Rechtschreibung (ss statt ß) behalten wir — sie liest sich in Deutschland problemlos. Schweizerische Wortwahl liest sich dort dagegen als Fehler."));

k.push(h("Runde 2 — was die Aufnahmen zutage gefördert haben", HeadingLevel.HEADING_1));
k.push(p("Der Review-Chat konnte in Runde 1 die App nicht sehen. Mit den Bildschirmaufnahmen kamen drei Befunde, die aus den Texten allein nicht sichtbar waren."));

k.push(p("Die Sprachnamen standen in der Fremdsprache, mitten im deutschen Satz.", { bold: true }));
k.push(p("„Auf English eintippen …“, „Deutsch → English“, „Español“, „Português“ — und dazwischen „Latein“, das die Regel schon brach. In einer deutschen Oberfläche gehören die deutschen Namen hin: Englisch, Französisch, Spanisch, Italienisch, Portugiesisch, Latein. Erst damit geht der Satz grammatisch auf. Übernommen."));
k.push(p("Nebenbefund: Diese sechs Namen fehlten im Textdokument vollständig — die Deutsch-Erkennung hielt „English“ und „Español“ für nicht deutsch und warf sie weg. Genau deshalb gehören sie hinein: Sie sind der Grund, warum dort „Auf English eintippen“ stand. Der Sammler liest sie jetzt gezielt aus."));

k.push(p("Die Kurzformen der Lernstandsleiste fehlten ebenfalls.", { bold: true }));
k.push(p("Unter jeder Karte steht „sitzt · fast · wackelt · neu · ungeübt“. Erfasst waren nur die Langformen. Ursache: Die Sperre gegen Programmbezeichner wirft einzelne Kleinbuchstabenwörter weg, und „sitzt“, „fast“, „wackelt“, „neu“ sehen für eine Heuristik genau so aus. Damit waren die sichtbarsten Wörter der App weder übersetzbar noch prüfbar. Behoben, indem der Sammler die beiden Beschriftungstabellen beim Namen liest — die Heuristik weiter aufzuweichen hätte Symbolnamen und Farbwerte hereingelassen."));

k.push(p("„Fast richtig“ verschwand zwischen den Bildschirmen.", { bold: true }));
k.push(p("Die Karte fällt drei Urteile, die Statistik zeigt zwei, und eine Zeile sagte bei Tippfehlern „zählt als richtig“, während die Einstellungen „zählt noch als fast richtig“ sagen. Jetzt einheitlich: auf der Karte fast richtig, in der Statistik Treffer. Die Anleitung sagt den Übergang ausdrücklich."));

k.push(h("Zwei Rückschritte in der Anleitung", HeadingLevel.HEADING_2));
k.push(p("Beide bestätigt und behoben: Der Satz „Beim Durchblättern fehlen beide“ war beim Umbau verlorengegangen — die Aufnahme zeigt, dass tatsächlich beide Anzeigen verschwinden. Und die FAQ nannte dreissig Karten als feste Zahl, obwohl sechs Absätze vorher steht, dass sie einstellbar ist; die Zahl ist dort jetzt weg."));

k.push(h("Offen: schweizerische oder deutsche Rechtschreibung", HeadingLevel.HEADING_1));
k.push(p("Der Review hält meiner Marktentscheidung entgegen, die beiden Hälften zögen gegeneinander: Über „zu tief“ stolpert ein deutscher Leser einmal, über fehlendes ß auf jeder Seite — an „heisst“, „grösste“, „ausserdem“ —, und die Zielgruppe sind Lernende, die im Deutschunterricht genau darauf trainiert werden."));
k.push(p("Das Argument trägt. Die Kosten sind unsymmetrisch: Ein ß kostet Schweizer Leser nichts, sie lesen es täglich in Büchern. Fehlendes ß kostet deutsche Leser bei einer Lern-App Glaubwürdigkeit, weil Rechtschreibung dort das Produktversprechen berührt. Wenn Deutschland der grössere Markt wird, ist die konsequente Antwort deutsche Rechtschreibung — beides schweizerisch oder beides deutsch, nicht gemischt."));
k.push(p("Entschieden ist das nicht. Es ist eine Marktfrage, keine Textfrage. v3 bleibt bei der schweizerischen Schreibung; die Umstellung liesse sich in einem Durchgang nachziehen, betrifft dann aber auch den KI-Prompt und die deutsche Seite der Wortlisten (Strasse / Straße), was in die Bewertung eingreift. Deshalb liegt sie dir hier als Entscheidung vor, nicht als erledigter Punkt.", { kursiv: true }));

k.push(h("Befunde am Programm, nicht am Text", HeadingLevel.HEADING_1));
k.push(p("Erledigt — die „n“ mitten im Text (B-523 und acht weitere).", { bold: true }));
k.push(p("Ursache war nicht die App, sondern der Textsammler: Er übernahm das Zeichen hinter einem Backslash unverändert, aus \\n wurde der Buchstabe n („der Hundnliber“). Behoben in texte/sammle-texte.mjs; die Zeilen stehen jetzt richtig."));
k.push(p("Erledigt — 23 Programmbezeichner und zwei Migrationsreste.", { bold: true }));
k.push(p("card-dir, ./fsrs, var(--blue), beispieleModus und so fort kamen durch, weil CSS-Klassen wie „card-dir“ an der Wortgrenze auf „dir“ passen und die Deutsch-Erkennung deshalb ansprang. Der Filter greift jetzt. Teil B enthält 649 statt 674 Einträge."));
k.push(p("Achtung beim Quervergleich: Die B-Nummern haben sich dadurch verschoben. B-021 des Reviews ist in der neuen Fassung B-018.", { kursiv: true }));
k.push(p("Offen für die Bauphase — gerade Anführungszeichen im KI-Prompt.", { bold: true }));
k.push(p("In PasteModal.tsx steht „ss\" statt „ß\" mit geraden statt typografischen Anführungszeichen. Daran ist der Textsammler abgeschnitten (B-536). Im Dokument steht der gemeinte Text; die Quelle wird beim Bauen umgestellt."));
k.push(p("Zu klären — das Zieldatum im Übungsplan.", { bold: true }));
k.push(p("Der Widerspruch ist echt, und die Beschriftung hat recht: PlanTab.tsx hat kein Eingabefeld für ein Datum, vergeben wird es unter Wortlisten. Der Anleitungstext ist entsprechend korrigiert. Ob der Übungsplan ein Datum setzen können soll, ist eine Frage an die Funktion, nicht an den Text."));

k.push(h("Was beim Bauen am Programm zu ändern ist", HeadingLevel.HEADING_1));
k.push(p("Diese Punkte sind keine Textänderungen; sie stehen hier, damit sie nicht verlorengehen."));
for (const t of [
 "Die sechs Sprachnamen in lib/pairs.ts auf die deutschen Bezeichnungen umstellen. Der Austauschformat-Kopf trägt diesen Namen ebenfalls; das Einlesen wertet ihn nicht aus, ist also unkritisch.",
 "„Alle Wörter“ steht unter der Überschrift SMART LISTS, ist aber keine. Optisch absetzen — eigener Block oder Trennlinie. Bleibt es dort, muss der Anleitungstext es mitzählen; die jetzige Fassung nennt es getrennt.",
 "Von drei Durchblätter-Hinweisen sind zwei gleichzeitig sichtbar. Den auf der Karte streichen, das Band darüber genügt.",
 "Der Wert bei „Neue Wörter pro Tag“ zeigt „Normal“, die Zeile darüber „30 Karten“. Die Zahl aufnehmen: „Normal · 10 pro Tag“.",
 "Im KI-Prompt in PasteModal.tsx stehen gerade statt typografischer Anführungszeichen. Daran ist der Textsammler abgeschnitten.",
 "Die Datenschutzabschnitte um Frankfurt, den lokalen Speicher und die Rechtsgrundlage ergänzen.",
 "Zu entscheiden: ob der Übungsplan ein Zieldatum setzen können soll. Heute geht das nur unter Wortlisten.",
]) k.push(p("· " + t, { einzug: { left: 340 } }));

const doc = new Document({ creator: "SmartVoc", title: "SmartVoc — Beurteilung des Reviews",
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1300, right: 1300 } } }, children: k }] });
Packer.toBuffer(doc).then(b => { fs.writeFileSync("SmartVoc-Review-Beurteilung.docx", b);
  console.log("Beurteilung geschrieben"); });
