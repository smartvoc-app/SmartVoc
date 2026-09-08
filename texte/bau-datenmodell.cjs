/* Das Datenmodell zum Nachprüfen. Zwei Ebenen: die Tabellen bei Supabase
   und die JSON-Dokumente, die darin liegen. Der zweite Teil ist der, in
   dem die Fehler steckten. */
const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, LevelFormat, AlignmentType } = d;

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  numbering: o.punkt ? { reference: "striche", level: 0 } : undefined,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.kursiv,
                           size: o.size ?? 21, color: o.color, font: o.mono ? "Consolas" : "Calibri" })],
});
const pm = (stuecke, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  numbering: o.punkt ? { reference: "striche", level: 0 } : undefined,
  children: stuecke.map((s) => typeof s === "string"
    ? new TextRun({ text: s, size: 21, font: "Calibri" })
    : new TextRun({ text: s.t, bold: s.b, italics: s.k, size: s.size ?? 21,
                    color: s.c, font: s.mono ? "Consolas" : "Calibri" })),
});
const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 250, after: 90 } });

function tab(kopf, zeilen, breiten, mono) {
  const B = breiten || kopf.map(() => Math.floor(9000 / kopf.length));
  const zelle = (t, i, fett) => new TableCell({
    width: { size: B[i], type: WidthType.DXA },
    shading: fett ? { type: ShadingType.CLEAR, fill: "6B7280" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [p(String(t), { bold: fett, size: 18, after: 0,
      color: fett ? "FFFFFF" : undefined, mono: !fett && mono && mono.includes(i) })],
  });
  return new Table({
    columnWidths: B, width: { size: 9000, type: WidthType.DXA },
    rows: [new TableRow({ tableHeader: true, children: kopf.map((t, i) => zelle(t, i, true)) }),
           ...zeilen.map((z) => new TableRow({ children: z.map((t, i) => zelle(t, i, false)) }))],
  });
}

const k = [];
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p("Datenmodell — Tabellen, Felder, Verknüpfungen", { size: 26, color: "5A554C", after: 40 }));
k.push(p("Stand 8. September 2026 · Modellversion v2", { size: 19, color: "9A958B", after: 240 }));
k.push(p("Dieses Dokument enthält keine Schlüssel und keine Zugangsdaten. Was hier steht, wurde gegen die laufende Datenbank geprüft, nicht aus dem Gedächtnis aufgeschrieben — Abschnitt 7 zeigt, wie.", { kursiv: true, color: "5A554C", after: 240 }));

// ---------------------------------------------------------------- 1
k.push(h1("1  Das Wichtigste zuerst: zwei Ebenen"));
k.push(p("Das Modell hat zwei Ebenen, und fast alle bisherigen Fehler lagen auf der zweiten."));
k.push(pm([{ t: "Ebene 1 — die Tabellen bei Supabase. ", b: true },
  "Zwei Stück. Sie wissen nichts über Vokabeln, Listen oder Lernstände. Sie speichern pro Benutzer ein paar JSON-Dokumente und regeln, wer sie lesen darf."], { after: 110 }));
k.push(pm([{ t: "Ebene 2 — der Inhalt dieser Dokumente. ", b: true },
  "Hier stehen Wörter, Listen und Lernstände. Die Datenbank sieht davon nichts: für sie ist alles ein JSON-Klumpen. Sie kann deshalb auch nichts davon prüfen — kein Fremdschlüssel, keine Pflichtfelder, keine Eindeutigkeit."], { after: 110 }));
k.push(p("Das ist die eine Sache, die man beim Prüfen im Kopf behalten muss: Alles, was in Abschnitt 5 als „Regel“ steht, wird von der Datenbank NICHT durchgesetzt. Es hält, weil der Programmcode sich daran hält. Abschnitt 6 listet auf, wo das heute abgesichert ist und wo nicht.", { after: 160 }));

// ---------------------------------------------------------------- 2
k.push(h1("2  Ebene 1 — die Tabellen"));
k.push(h2("2.1  user_documents"));
k.push(p("Der Speicher für alles, was einem Konto gehört. Eine Zeile je Benutzer und Dokumentart."));
k.push(tab(["Feld", "Typ", "Regel"], [
  ["user_id", "uuid", "Teil des Primärschlüssels. Verweist auf auth.users(id), löscht mit dem Konto mit."],
  ["doc_key", "text", "Teil des Primärschlüssels. Welche Art Dokument (siehe 2.3)."],
  ["data", "jsonb", "Der Inhalt. Pflichtfeld."],
  ["updated_at", "timestamptz", "Setzt der Server bei jedem Schreiben. Clients senden es nie."],
], [1800, 1700, 5500], [0, 1]));
k.push(pm([{ t: "Primärschlüssel: ", b: true }, { t: "(user_id, doc_key)", mono: true },
  " — je Konto und Dokumentart genau eine Zeile. Ein zweiter Vokabelbestand desselben Kontos ist nicht speicherbar."], { after: 90 }));
k.push(pm([{ t: "Zugriff: ", b: true }, "Zeilenschutz (RLS) ist an. Eine Regel für alles: lesen und schreiben nur, wo ",
  { t: "user_id = auth.uid()", mono: true }, ". Fremde Zeilen sind weder sicht- noch schreibbar."], { after: 90 }));
k.push(pm([{ t: "Zeitstempel: ", b: true }, "Ein Auslöser (Trigger) setzt ", { t: "updated_at", mono: true },
  " bei jedem Einfügen und Ändern serverseitig. Das ist Absicht: der Abgleich entscheidet danach, welche Fassung neuer ist, und eine falsch gestellte Uhr auf einem Gerät darf diese Entscheidung nicht kippen."], { after: 150 }));

k.push(h2("2.2  shared_lists"));
k.push(p("Geteilte Wortlisten. Wer teilt, legt hier eine Momentaufnahme ab und gibt den Code weiter."));
k.push(tab(["Feld", "Typ", "Regel"], [
  ["token", "text", "Primärschlüssel. Der Code, den der Empfänger eingibt (VT-…)."],
  ["owner_id", "uuid", "Wer geteilt hat. Vorgabe auth.uid(), löscht mit dem Konto mit."],
  ["payload", "jsonb", "{ name, pair, words: […] } — eine Kopie, kein Verweis."],
  ["created_at", "timestamptz", "Anlagezeitpunkt."],
], [1800, 1700, 5500], [0, 1]));
k.push(pm([{ t: "Zugriff — hier steckt eine Absicht: ", b: true },
  "Es gibt bewusst KEINE Leseregel. Ein direktes Abfragen der Tabelle liefert deshalb nichts, auch mit gültigem anonymem Schlüssel. Gelesen wird ausschliesslich über die Funktion ",
  { t: "get_shared_list(token)", mono: true },
  ", die genau die eine passende Zeile zurückgibt. Sonst könnte jemand mit dem öffentlichen Schlüssel die Tabelle durchblättern und alle geteilten Listen aller Benutzer einsammeln."], { after: 90 }));
k.push(p("Schreiben und Löschen: nur die eigenen Zeilen (owner_id = auth.uid()).", { after: 150 }));

k.push(h2("2.3  Die Dokumentarten"));
k.push(p("Fünf Arten, und der Schlüssel trägt seit dem Umbau die Modellversion."));
k.push(tab(["doc_key", "Inhalt"], [
  ["vocab_v2", "Alle Wörter, als Array"],
  ["lists_v2", "Alle Wortlisten, als Array"],
  ["stats_v2", "Lernstände, als Objekt: Wort-Id → Lernstand"],
  ["meta_v2", "Tagesstand, Serie, Verlaufskurven"],
  ["settings_v2", "Alle Einstellungen"],
], [2200, 6800], [0]));
k.push(pm([{ t: "Warum das Kürzel: ", b: true },
  "Ändert sich die Form der Dokumente, ändert sich der Schlüssel. Ein Gerät mit der neuen Fassung liest die alten Dokumente dann gar nicht erst, statt sie misszuverstehen. Die Dokumente der Vorgängerversion liegen unangetastet unter ",
  { t: "vocab", mono: true }, ", ", { t: "lists", mono: true }, " und so weiter daneben."], { after: 150 }));

// ---------------------------------------------------------------- 3
k.push(h1("3  Die Funktionen"));
k.push(tab(["Funktion", "Wer darf", "Was sie tut"], [
  ["get_shared_list(p_token)", "anonym, angemeldet", "Gibt die Momentaufnahme zu genau diesem Code zurück, sonst nichts. Läuft mit erhöhten Rechten, weil die Tabelle selbst keine Leseregel hat."],
  ["delete_account()", "nur angemeldet", "Löscht die eigenen Dokumente, die eigenen geteilten Listen und das Konto — in dieser Reihenfolge und ausdrücklich, nicht über eine angenommene Kaskade."],
  ["set_updated_at()", "Auslöser", "Setzt den Zeitstempel serverseitig."],
], [2500, 1900, 4600], [0]));
k.push(pm([{ t: "Gehärtet: ", b: true }, { t: "delete_account", mono: true },
  " läuft mit leerem Suchpfad und voll qualifizierten Namen, damit ihr niemand eine untergeschobene Tabelle unterjubeln kann. Ausführungsrecht ist anonymen Aufrufern ausdrücklich entzogen."], { after: 150 }));

// ---------------------------------------------------------------- 4
k.push(h1("4  Verknüpfungen"));
k.push(p("Echte Fremdschlüssel gibt es nur zum Konto. Alles andere sind Verweise INNERHALB der JSON-Dokumente — die Datenbank kennt sie nicht."));
k.push(tab(["Von", "Nach", "Art", "Wird geprüft von"], [
  ["user_documents.user_id", "auth.users.id", "Fremdschlüssel, löscht mit", "der Datenbank"],
  ["shared_lists.owner_id", "auth.users.id", "Fremdschlüssel, löscht mit", "der Datenbank"],
  ["Wort.listId", "Liste.id", "Verweis im JSON", "nur dem Programm"],
  ["Lernstand-Schlüssel", "Wort.id", "Verweis im JSON", "nur dem Programm"],
  ["Wort.pair", "Liste.pair", "muss übereinstimmen", "nur dem Programm"],
], [2500, 1900, 2300, 2300], [0, 1]));

// ---------------------------------------------------------------- 5
k.push(h1("5  Ebene 2 — der Inhalt der Dokumente"));

k.push(h2("5.1  Wort"));
k.push(tab(["Feld", "Typ", "Pflicht", "Bedeutung"], [
  ["id", "string", "ja", "Eindeutig über den ganzen Bestand"],
  ["pair", "string", "ja", "Sprachpaar, z. B. en-de"],
  ["listId", "string", "ja", "Die eine Wortliste. Siehe 6.1"],
  ["de", "string", "ja", "Die Seite in der Muttersprache"],
  ["en / fr / es / it / pt / la", "string", "eines", "Das Fremdwort, unter dem Kürzel seiner Sprache"],
  ["grundform", "string", "Latein", "Nominativ / 1. Person Singular"],
  ["lernform", "string", "nein", "Stammformen, z. B. „video, videre, vidi, visum“"],
  ["wortart", "string", "nein", "Nomen, Verb, … (Werte in lib/export.ts)"],
  ["genus", "string", "nein", "m, f, n, m pl, f pl, n pl, pl"],
  ["examples", "string[]", "nein", "1–2 Beispielsätze in der Fremdsprache"],
  ["examplesDe", "string[]", "nein", "Ihre Übersetzungen, nach Index zugeordnet"],
  ["phonetic", "string", "nein", "Lautschrift des Fremdworts"],
  ["review", "boolean", "nein", "Wurde maschinell übersetzt, bitte nachsehen"],
  ["source", "string", "nein", "seed, manual, import, kopie"],
], [2100, 1300, 900, 4700], [0, 1]));

k.push(h2("5.2  Wortliste"));
k.push(tab(["Feld", "Typ", "Pflicht", "Bedeutung"], [
  ["id", "string", "ja", "Eindeutig"],
  ["name", "string", "ja", "Angezeigter Name. Eindeutig je Sprachpaar (siehe 6.2)"],
  ["pair", "string", "ja", "Sprachpaar"],
  ["createdAt", "number", "ja", "Anlagezeitpunkt"],
  ["updatedAt", "number", "nein", "Zuletzt angefasst"],
  ["dueDate", "number", "nein", "Zieldatum. Nur Listen damit erscheinen im Übungsplan"],
  ["herkunft", "string", "nein", "selbst, geteilt, grundwortschatz"],
  ["autor", "string", "nein", "Anzeigename dessen, der geteilt hat"],
], [2100, 1300, 900, 4700], [0, 1]));

k.push(h2("5.3  Lernstand"));
k.push(p("Ein Objekt, dessen Schlüssel die Wort-Ids sind. Kein Array — die Zuordnung läuft über den Schlüssel."));
k.push(tab(["Feld", "Typ", "Bedeutung"], [
  ["seen", "number", "Wie oft abgefragt"],
  ["scoreSum", "number", "Summe aller Punktzahlen"],
  ["correctCount / almostCount / wrongCount", "number", "Zähler je Urteil"],
  ["firstTry", "boolean", "Beim allerersten Mal richtig"],
  ["ema", "number", "Gleitender Durchschnitt der Punktzahlen"],
  ["streak", "number", "Richtige in Folge"],
  ["lastTs", "number", "Letzte Abfrage"],
  ["history", "HistoryEntry[]", "Die letzten 30 Antworten (Punktzahl, Urteil, Zeit, Fehlerart)"],
  ["fsrs", "SerializedCard", "Der Zustand des Gedächtnismodells, siehe 5.4"],
], [2900, 1800, 4300], [0, 1]));

k.push(h2("5.4  Der FSRS-Zustand"));
k.push(p("Was das Gedächtnismodell je Wort mitführt. Aus diesen Zahlen wird alles andere gerechnet — Stufe, Fälligkeit, Ampel."));
k.push(tab(["Feld", "Typ", "Bedeutung"], [
  ["stability", "number", "Haltedauer in Tagen. Bestimmt die Stufe"],
  ["difficulty", "number", "0 bis 10. Ab 7 zusammen mit Rückfällen: hartnäckig"],
  ["reps", "number", "Wiederholungen"],
  ["lapses", "number", "Rückfälle"],
  ["state", "number", "0 = nie geübt"],
  ["last_review", "number", "Zeitpunkt der letzten Abfrage"],
  ["elapsed_days / scheduled_days / learning_steps", "number", "Zwischenwerte des Modells"],
  ["due", "number", "NICHT gespeichert — wird aus last_review und stability gerechnet"],
], [3100, 1400, 4500], [0, 1]));
k.push(pm([{ t: "Warum due nicht gespeichert wird: ", b: true },
  "Der Fälligkeitstag hängt vom eingestellten Behaltensziel ab. Wäre er gespeichert, zeigte eine Änderung dieser Einstellung erst bei der nächsten Abfrage Wirkung — und alte Daten trügen einen Termin, der nicht mehr zur Einstellung passt."], { after: 150 }));

k.push(h2("5.5  Tagesstand und Einstellungen"));
k.push(pm([{ t: "meta", b: true, mono: true },
  ": lastDate, streak, todayCount, newToday, dailyGoal, totalReviews sowie trends — je Sprachpaar und Tag eine Momentaufnahme der Stufenverteilung, gekappt auf 180 Tage."], { after: 90 }));
k.push(pm([{ t: "settings", b: true, mono: true },
  ": 34 Felder. Die wichtigsten für eine Prüfung: dailyGoal, newPerDay, targetRetention, examRetention, masteryCorrect, lenientCase, strictAccents, articleMode, acceptPartial, latinMode, readyGreen, readyAmber, pair, uiLang."], { after: 150 }));

// ---------------------------------------------------------------- 6
k.push(h1("6  Die Regeln, die kein Feldtyp erzwingt"));
k.push(p("Der eigentliche Prüfstoff. Jede dieser Regeln hält, weil der Code sich daran hält — die Datenbank kann sie nicht durchsetzen. Daneben steht, was heute dafür sorgt."));

k.push(h2("6.1  Ein Wort gehört in genau eine Liste"));
k.push(pm([{ t: "Gesichert durch das Modell. ", b: true }, "Das Feld heisst ", { t: "listId", mono: true },
  " und ist eine einzelne Pflichtangabe. Zwei Listen an einem Wort sind nicht mehr hinschreibbar."], { after: 80 }));
k.push(p("Bis vor Kurzem hiess das Feld „lists“ und war ein Array. Die Regel stand nur als Kommentar daneben. Drei Fehler gingen darauf zurück: verwaiste Wörter nach dem Löschen einer Liste, zwei Listen mit denselben Wortobjekten nach dem Import, und ein Verschieben, das beide Listen traf.", { after: 80 }));
k.push(pm([{ t: "Nicht gesichert: ", b: true }, "dass die ", { t: "listId", mono: true },
  " auf eine Liste zeigt, die es gibt. Löschen nimmt die Wörter mit, also entsteht der Fall im Betrieb nicht — geprüft wird er von ", { t: "pruef/09-datenmodell.mjs", mono: true }, "."], { after: 130 }));

k.push(h2("6.2  Listennamen sind je Sprachpaar eindeutig"));
k.push(p("Beim Anlegen hängt die App eine Nummer an, wenn der Name schon vergeben ist. Nötig, weil eine übernommene Liste so heisst wie das Original — und zwei gleich benannte Listen lassen sich hinterher nicht auseinanderhalten. Umbenennen prüft das NICHT: von Hand lassen sich zwei Listen weiterhin gleich nennen.", { after: 130 }));

k.push(h2("6.3  Wort und Liste gehören zum selben Sprachpaar"));
k.push(p("Die Oberfläche bietet beim Verschieben nur Listen desselben Paars an. Erzwungen ist es nicht. Ein Wort in einer Liste des falschen Paars wäre unsichtbar, weil überall zuerst nach Sprachpaar gefiltert wird.", { after: 130 }));

k.push(h2("6.4  Beispielsatz und Übersetzung gehören über den Index zusammen"));
k.push(pm([{ t: "examples[0]", mono: true }, " gehört zu ", { t: "examplesDe[0]", mono: true },
  ". Wer eine der beiden Listen filtert, ohne die andere gleich zu behandeln, schiebt die Übersetzungen unter die falschen Sätze. Das ist zweimal passiert und steht deshalb an beiden Stellen im Quelltext als Warnung."], { after: 130 }));

k.push(h2("6.5  Der Abgleich ersetzt ganze Dokumente"));
k.push(p("Kein Zusammenführen einzelner Wörter: Es gewinnt das Dokument mit dem jüngeren Zeitstempel, und zwar ganz. Wer auf zwei Geräten ohne Netz je ein Wort hinzufügt, verliert eines davon."));
k.push(p("Das ist eine bewusste Entscheidung, keine Lücke — ein Zusammenführen je Wort bräuchte Änderungsprotokolle und eine Konfliktbehandlung. Es gehört aber auf den Zettel, weil es sich beim Benutzer als Datenverlust anfühlt.", { kursiv: true, color: "5A554C", after: 130 }));

k.push(h2("6.6  Lernstände ohne Wort"));
k.push(p("Der Lernstand wird über die Wort-Id gefunden. Verschwindet das Wort, ist sein Eintrag unerreichbar. Löschen einer Liste und Löschen einzelner Wörter räumen ihn heute mit weg; das Zweite wurde beim Erstellen dieses Dokuments nachgetragen — vorher blieb bei jedem einzeln gelöschten Wort ein Eintrag zurück, unsichtbar und trotzdem abgeglichen.", { after: 130 }));

// ---------------------------------------------------------------- 7
k.push(h1("7  Wie das hier geprüft wurde"));
k.push(p("Nicht aus dem Gedächtnis: gegen die laufende Datenbank, mit dem öffentlichen Schlüssel und ohne Anmeldung. Jede Sonde hat eine Gegenprobe, damit „existiert“ und „existiert nicht“ unterscheidbar sind."));
k.push(tab(["Sonde", "Antwort", "Was das zeigt"], [
  ["user_documents lesen", "200, leer", "Tabelle existiert; fremde Zeilen sind unsichtbar"],
  ["user_documents einfügen", "401, Code 42501", "Zeilenschutz greift beim Schreiben"],
  ["shared_lists lesen", "200, leer", "Keine Leseregel — Tabelle nicht durchblätterbar"],
  ["shared_lists einfügen", "401, Code 42501", "Zeilenschutz greift"],
  ["get_shared_list(unbekannt)", "200, null", "Funktion existiert, gibt nur Passendes heraus"],
  ["delete_account()", "401, Code 42501", "Existiert, anonym nicht ausführbar"],
  ["erfundene Funktion", "404, PGRST202", "Gegenprobe: fehlende Funktionen sehen anders aus"],
], [2600, 1900, 4500], [0]));
k.push(p("Das Schema selbst liegt im Projekt unter schema.sql und ist die Quelle für Abschnitt 2 und 3. Die Sonden zeigen, dass es auch tatsächlich so angewandt ist.", { after: 160 }));

// ---------------------------------------------------------------- 8
k.push(h1("8  Was vor der Freigabe zu entscheiden ist"));
k.push(tab(["Punkt", "Heute", "Zu entscheiden"], [
  ["Abgleich ersetzt ganze Dokumente (6.5)", "So gebaut", "So lassen oder je Wort zusammenführen"],
  ["Umbenennen prüft den Namen nicht (6.2)", "Ungeprüft", "Prüfen wie beim Anlegen?"],
  ["Sprachpaar von Wort und Liste (6.3)", "Nur die Oberfläche achtet darauf", "Beim Schreiben erzwingen?"],
  ["Alte Dokumente in der Wolke", "Bleiben unter den alten Schlüsseln liegen", "Löschen oder liegen lassen"],
  ["Alte Daten auf dem Gerät", "Bleiben unter vt_v1_* liegen", "Löschen oder als Rückweg behalten"],
  ["schema.sql trägt noch den alten Projektnamen", "Kosmetisch", "Beim nächsten Anfassen berichtigen"],
], [3000, 2800, 3200]));

const doc = new Document({
  numbering: { config: [{ reference: "striche", levels: [{ level: 0, format: LevelFormat.BULLET,
    text: "–", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  styles: { default: {
    heading1: { run: { size: 30, bold: true, color: "2F3437", font: "Calibri" } },
    heading2: { run: { size: 23, bold: true, color: "4A4F54", font: "Calibri" } },
    title: { run: { size: 46, bold: true, color: "1F2328", font: "Calibri" } },
  } },
  sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
              children: k }],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(__dirname + "/SmartVoc-Datenmodell.docx", b);
  console.log("geschrieben: texte/SmartVoc-Datenmodell.docx");
});
