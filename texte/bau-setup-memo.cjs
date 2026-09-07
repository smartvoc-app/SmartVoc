/* Das Merkblatt zum technischen Aufbau. Kein Code, keine Funktionalität --
   nur: wo liegt was, bei wem, unter welchem Namen. Vorbild ist das
   Website-Setup-Memo der Geschäftsseite, dieselbe Machart. */
const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, AlignmentType } = d;

const p = (t, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 130, before: o.before ?? 0 },
  numbering: o.punkt ? { reference: "striche", level: 0 } : undefined,
  children: [new TextRun({ text: t, bold: o.bold, italics: o.kursiv,
                           size: o.size ?? 21, color: o.color, font: "Calibri" })],
});
const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } });

function tab(kopf, zeilen, breiten) {
  const B = breiten || kopf.map(() => Math.floor(9000 / kopf.length));
  const zelle = (t, i, fett) => new TableCell({
    width: { size: B[i], type: WidthType.DXA },
    shading: fett ? { type: ShadingType.CLEAR, fill: "6B7280" } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [p(t, { bold: fett, size: fett ? 19 : 19, after: 0, color: fett ? "FFFFFF" : undefined })],
  });
  return new Table({
    columnWidths: B, width: { size: 9000, type: WidthType.DXA },
    rows: [new TableRow({ tableHeader: true, children: kopf.map((t, i) => zelle(t, i, true)) }),
           ...zeilen.map((z) => new TableRow({ children: z.map((t, i) => zelle(t, i, false)) }))],
  });
}

const k = [];
k.push(new Paragraph({ text: "SmartVoc", heading: HeadingLevel.TITLE, spacing: { after: 60 } }));
k.push(p("Technisches Merkblatt — wo liegt was, bei wem, unter welchem Namen", { size: 26, color: "5A554C", after: 40 }));
k.push(p("Stand 7. September 2026", { size: 19, color: "9A958B", after: 260 }));
k.push(p("Dieses Dokument enthält bewusst keine Passwörter und keine Schlüssel. Alle Zugangsdaten liegen im Passwortmanager.", { kursiv: true, color: "5A554C", after: 240 }));

// ------------------------------------------------------------------ 1
k.push(h1("1  Architektur in einem Satz"));
k.push(p("Claude Code ändert Dateien im lokalen Repo → Push nach GitHub → GitHub Actions baut und liefert die Webfassung über GitHub Pages aus. Dieselbe Codebasis wird über Capacitor zur iOS-App gebündelt. Die Domain ist bei Infomaniak registriert, das DNS ebenfalls, die Mail auch. Konten und Lernstände liegen bei Supabase in Frankfurt."));
k.push(p("Anders als bei der Geschäftsseite ist hier KEIN Cloudflare im Spiel. Das DNS liegt direkt bei Infomaniak, das Hosting bei GitHub. Ein Dienst weniger.", { kursiv: true, color: "8A4B00" }));
k.push(tab(["Funktion", "Anbieter", "Wo verwaltet"], [
  ["Domainregistrierung", "Infomaniak", "manager.infomaniak.com"],
  ["DNS", "Infomaniak", "manager.infomaniak.com → Domain → DNS-Zone"],
  ["E-Mail", "Infomaniak Service Mail", "manager.infomaniak.com → kSuite"],
  ["Hosting der Webfassung", "GitHub Pages", "github.com → Repo → Settings → Pages"],
  ["Bauen und Ausliefern", "GitHub Actions", "github.com → Repo → Actions"],
  ["Quellcode", "GitHub (öffentlich)", "github.com/smartvoc-app/SmartVoc"],
  ["Konten und Abgleich", "Supabase", "supabase.com/dashboard"],
  ["iOS-App", "Xcode / Capacitor", "lokal, ios/App/App.xcodeproj"],
  ["Vertrieb iOS", "App Store Connect", "appstoreconnect.apple.com"],
  ["Bearbeitung", "Claude Code, Reiter «Code»", "Claude Desktop-App"],
], [2600, 3000, 3400]));

// ------------------------------------------------------------------ 2
k.push(h1("2  Konten"));
k.push(tab(["Dienst", "Konto", "Bemerkung"], [
  ["Infomaniak", "martin.keller.private@gmail.com", "Domain, DNS, Mail, Rechnungen"],
  ["GitHub", "Organisation smartvoc-app", "Repo SmartVoc, öffentlich"],
  ["Supabase", "martin.keller.private@gmail.com", "Projekt SmartVoc, Free-Plan"],
  ["Apple Developer", "noch nicht eingerichtet", "99 USD im Jahr, Voraussetzung für den App Store"],
], [2200, 3400, 3400]));
k.push(p("Die GitHub-Organisation smartvoc-app wurde angelegt, um das Projekt vom privaten Konto zu trennen. Die alte Kennung martinkellerprivate-jpg gehört zur Geschäftsseite und hat mit SmartVoc nichts zu tun.", { color: "5A554C" }));

// ------------------------------------------------------------------ 3
k.push(h1("3  Adressen"));
k.push(tab(["Zweck", "Adresse"], [
  ["Webfassung (kanonisch)", "https://smartvoc.app"],
  ["Datenschutz und Impressum", "https://smartvoc.app/datenschutz.html"],
  ["Alte Adresse (leitet um)", "smartvoc-app.github.io/SmartVoc/"],
  ["Repo", "github.com/smartvoc-app/SmartVoc"],
  ["Repo lokal", "~/Library/CloudStorage/OneDrive-Persönlich/Claude-Directory/Claude-Code/Vokabeltrainer-iOS"],
  ["Kontakt- und Absenderadresse", "support@smartvoc.app"],
  ["Supabase-Projekt", "wpwrqjyljgrmhamupspz.supabase.co"],
], [3000, 6000]));
k.push(p("Die Datenschutzadresse ist zugleich die, die in App Store Connect als Privacy Policy URL hinterlegt wird. Sie trägt beide Sprachen auf einer Seite.", { color: "5A554C" }));

// ------------------------------------------------------------------ 4
k.push(h1("4  Domain"));
k.push(tab(["Domain", "Rolle", "Registriert", "Ablauf"], [
  ["smartvoc.app", "Hauptdomain — Webfassung und Mail", "07.09.2026", "im Manager prüfen"],
], [2400, 3400, 1600, 1600]));
k.push(p("Nur eine Domain, keine Varianten. Falls später Tippfehler-Adressen dazukommen sollen, werden sie bei Infomaniak als Web-Weiterleitung eingerichtet, nicht als eigene Zonen."));
k.push(p("Die Endung .app steht in der HSTS-Preload-Liste: Browser sprechen ausschliesslich HTTPS. Das Zertifikat stellt GitHub Pages automatisch über Let’s Encrypt aus und erneuert es selbst. Ausgestellt am 07.09.2026, gültig bis 06.12.2026, danach automatische Verlängerung.", { color: "5A554C" }));

// ------------------------------------------------------------------ 5
k.push(h1("5  DNS — die Werte, auf die es ankommt"));
k.push(p("Verwaltet bei Infomaniak. Wer hier etwas ändert, kann Website oder Mail unterbrechen."));
k.push(tab(["Eintrag", "Wert", "Wozu"], [
  ["A (@) ×4", "185.199.108.153 bis 185.199.111.153", "Webfassung auf GitHub Pages"],
  ["AAAA (@) ×4", "2606:50c0:8000::153 bis 8003::153", "dasselbe über IPv6"],
  ["CNAME www", "smartvoc-app.github.io.", "www auf dieselbe Seite"],
  ["MX", "5 mta-gw.infomaniak.ch", "Mailempfang"],
  ["TXT (@)", "v=spf1 include:spf.infomaniak.ch -all", "Absenderfreigabe"],
  ["TXT _dmarc", "v=DMARC1; p=reject;", "Missbrauchsschutz"],
  ["NS _domainkey", "ns11 / ns12.infomaniak.ch", "DKIM — Unterzone bei Infomaniak"],
  ["CNAME autoconfig / autodiscover", "infomaniak.com", "Automatische Mail-Einrichtung"],
  ["SRV (6 Stück)", "mail.infomaniak.com", "IMAP, POP3, SMTP"],
], [2600, 3600, 2800]));
k.push(p("Die Mail-Einträge hat Infomaniak selbst gesetzt, weil Domain und Postfach dort liegen. Von Hand ergänzt wurden nur die neun Einträge für GitHub Pages.", { color: "5A554C" }));
k.push(p("DMARC steht auf p=reject, der strengsten Stufe. Solange alle Mails über Infomaniak laufen, ist das richtig. Wer später über einen anderen Dienst versendet, muss ihn vorher in SPF und DKIM eintragen — sonst werden diese Mails hart abgewiesen, nicht bloss in den Spam sortiert.", { color: "8A4B00" }));

// ------------------------------------------------------------------ 6
k.push(h1("6  Supabase"));
k.push(tab(["Angabe", "Wert"], [
  ["Projektkennung", "wpwrqjyljgrmhamupspz"],
  ["Region", "eu-central-1 — Frankfurt am Main, Deutschland"],
  ["Tarif", "Free"],
  ["Betreiberin", "Supabase, Inc., USA — Auftragsverarbeitungsvertrag mit EU-Standardvertragsklauseln"],
], [2800, 6200]));
k.push(h2("Tabellen und Funktionen"));
k.push(tab(["Name", "Art", "Wozu"], [
  ["user_documents", "Tabelle", "Wörter, Listen, Lernstände, Einstellungen je Nutzer"],
  ["shared_lists", "Tabelle", "geteilte Wortlisten, über Zufallscode abrufbar"],
  ["get_shared_list", "Funktion", "liest eine geteilte Liste über den Code"],
  ["delete_account", "Funktion", "löscht Zeilen und Konto, vom angemeldeten Nutzer aufrufbar"],
  ["set_updated_at", "Funktion", "Zeitstempel beim Schreiben"],
], [2600, 1600, 4800]));
k.push(p("Zeilenschutz (RLS) ist auf beiden Tabellen aktiv: Anonyme Abfragen liefern nichts, jeder Nutzer sieht nur seine eigenen Zeilen. Die Schemadefinition liegt im Repo unter schema.sql.", { color: "5A554C" }));
k.push(h2("Einstellungen, die zu kennen sind"));
k.push(p("Bestätigungsmail beim Anlegen eines Kontos ist eingeschaltet. Der Versand läuft über eigenes SMTP (Abschnitt 7) — der eingebaute Versand von Supabase ist auf wenige Mails pro Stunde begrenzt und nur zum Entwickeln gedacht.", { punkt: true }));
k.push(p("Site URL und Redirect URLs müssen auf https://smartvoc.app zeigen, sonst führen die Links aus Bestätigungs- und Zurücksetzen-Mails ins Leere.", { punkt: true }));

// ------------------------------------------------------------------ 7
k.push(h1("7  Mail"));
k.push(tab(["Einstellung", "Wert"], [
  ["Adresse", "support@smartvoc.app"],
  ["Posteingang (IMAP)", "mail.infomaniak.com, Port 993, SSL"],
  ["Postausgang (SMTP)", "mail.infomaniak.com, Port 465, SSL"],
  ["Benutzername", "die vollständige Adresse"],
  ["Passwort", "separat generiertes Kennwort für Mailprogramme"],
  ["Webzugang", "ksuite.infomaniak.com/mail"],
], [2800, 6200]));
k.push(p("Dieselben SMTP-Angaben stehen in Supabase unter Project Settings → Authentication → SMTP Settings. Absendername „SmartVoc“, Absenderadresse support@smartvoc.app. Die Absenderadresse muss die des angemeldeten Postfachs sein; ein abweichendes noreply@ lehnt der Server ab."));
k.push(p("Ein Postfach, drei Aufgaben: Absender der Systemmails, Kontaktadresse im Impressum, Anlaufstelle bei Problemen.", { color: "5A554C" }));

// ------------------------------------------------------------------ 8
k.push(h1("8  App und Vertrieb"));
k.push(tab(["Angabe", "Wert"], [
  ["Anzeigename", "SmartVoc"],
  ["Bundle-Kennung", "ch.smartvoc.app"],
  ["Version / Build", "1.0 / 1"],
  ["Mindest-iOS", "siehe Xcode-Projekt"],
  ["Rahmen", "Capacitor 8.5 mit Swift Package Manager"],
  ["Plugins", "Preferences, Haptics, Share"],
  ["Datenschutz-Manifest", "ios/App/App/PrivacyInfo.xcprivacy — UserDefaults, Grund CA92.1"],
], [2800, 6200]));
k.push(p("Die Bundle-Kennung lässt sich nach der ersten Veröffentlichung NIE mehr ändern — für Apple wäre eine andere Kennung eine andere App. Die alte Kennung ch.drkeller.smartvoc stammt aus der Zeit vor dem Umzug und ist tot; auf Testgeräten kann sie noch installiert sein und beide heissen auf dem Home-Bildschirm gleich.", { color: "8A4B00" }));
k.push(h2("Was App Store Connect verlangt"));
k.push(p("Datenschutz-URL: https://smartvoc.app/datenschutz.html", { punkt: true }));
k.push(p("Support-URL: https://smartvoc.app", { punkt: true }));
k.push(p("Trader-Angaben nach dem Digital Services Act für den Vertrieb in der EU: Name, Adresse, Telefon, E-Mail. Sie erscheinen öffentlich auf der Produktseite.", { punkt: true }));
k.push(p("Demokonto in den Review-Notizen, damit der Prüfer sich nicht selbst registrieren muss.", { punkt: true }));

// ------------------------------------------------------------------ 9
k.push(h1("9  Repository und Auslieferung"));
k.push(tab(["Pfad", "Inhalt"], [
  ["src/", "Anwendung — Komponenten, Bibliothek, Speicher, Abgleich"],
  ["src/data/starter/", "mitgelieferter Grundwortschatz, sechs Sprachpaare zu je 100 Wörtern"],
  ["public/", "wird unverändert ausgeliefert, darin CNAME und datenschutz.html"],
  ["ios/", "Xcode-Projekt"],
  ["texte/", "Werkzeuge für die Textdokumente und dieses Merkblatt"],
  ["scripts/", "Hilfsskripte, u. a. gen-datenschutz.mjs"],
  ["schema.sql", "Datenbankschema für Supabase"],
  ["CLAUDE.md", "Projektkontext für Claude Code"],
], [3000, 6000]));
k.push(h2("Befehle"));
k.push(tab(["Befehl", "Was er tut"], [
  ["npm run dev", "Entwicklungsserver"],
  ["npm run build", "Webfassung nach dist/"],
  ["npm run build:ios", "iOS-Bündel nach dist-ios/"],
  ["npx cap copy ios", "Bündel ins Xcode-Projekt kopieren"],
  ["npm run texte", "Textdokumente aus dem Programmtext erzeugen"],
], [3200, 5800]));
k.push(p("Push auf main → GitHub Actions baut und liefert aus, nach rund einer Minute live. Kein manueller Schritt."));
k.push(p("Für iOS genügt das Kopieren NICHT: Die im Simulator installierte App behält ihr altes Bündel, bis Xcode neu baut und neu installiert.", { color: "8A4B00" }));
k.push(p("public/CNAME hält die Domain fest. Ohne diese Datei verlöre GitHub Pages die eigene Domain bei der nächsten Auslieferung.", { color: "8A4B00" }));

// ------------------------------------------------------------------ 10
k.push(h1("10  Umgebungsvariablen"));
k.push(tab(["Name", "Wozu"], [
  ["VITE_SUPABASE_URL", "Adresse des Supabase-Projekts"],
  ["VITE_SUPABASE_ANON_KEY", "öffentlicher Schlüssel, liegt ohnehin im ausgelieferten Bündel"],
  ["VITE_WEB_URL", "Rücksprungpunkt für Bestätigungs- und Zurücksetzen-Mails aus der iOS-App"],
], [3400, 5600]));
k.push(p("Liegen in .env.local, nicht im Repo. .env.example zeigt die Namen ohne Werte. Der anon key ist kein Geheimnis — der Schutz liegt im Zeilenschutz der Datenbank, nicht in der Verborgenheit des Schlüssels.", { color: "5A554C" }));

// ------------------------------------------------------------------ 11
k.push(h1("11  Wenn etwas nicht funktioniert"));
k.push(tab(["Symptom", "Wahrscheinliche Ursache", "Erster Schritt"], [
  ["Änderung im Browser nicht sichtbar", "Dienst-Arbeiter liefert die alte Fassung", "Tab schliessen und neu öffnen"],
  ["Änderung im Simulator nicht sichtbar", "Nur kopiert, nicht neu gebaut", "Xcode-Build und App neu starten"],
  ["Zwei SmartVoc-Symbole auf dem Gerät", "alte Kennung ch.drkeller.smartvoc noch installiert", "alte App löschen"],
  ["Website nicht erreichbar, andere sehen sie", "lokaler DNS-Zwischenspeicher", "warten oder WLAN kurz aus"],
  ["Bestätigungsmail kommt nicht", "Ratenlimit des eingebauten Supabase-Versands", "eigenes SMTP prüfen (Abschnitt 7)"],
  ["Mail landet im Spam", "SPF oder DKIM verändert", "DNS gegen Abschnitt 5 prüfen"],
  ["Link aus der Mail führt ins Leere", "Site URL in Supabase oder VITE_WEB_URL falsch", "beide auf smartvoc.app prüfen"],
  ["Domain nach Auslieferung weg", "public/CNAME fehlt", "Datei wiederherstellen"],
], [2800, 3100, 3100]));

// ------------------------------------------------------------------ 12
k.push(h1("12  Offen und wiederkehrend"));
k.push(h2("Offen"));
k.push(p("Apple Developer Program lösen — Voraussetzung für jede Veröffentlichung.", { punkt: true }));
k.push(p("Eigenes SMTP in Supabase eintragen und die Vorlage der Bestätigungsmail anpassen.", { punkt: true }));
k.push(p("Kontolöschung mit einem echten Konto von Anfang bis Ende durchspielen. Die Datenbankfunktion ist vorhanden und die Rechte stimmen; ob sie aus auth.users löschen darf, ist ungeprüft.", { punkt: true }));
k.push(p("Sign in with Apple — verlangt Apple, sobald eine andere Anmeldung über Dritte angeboten wird. Derzeit gibt es nur E-Mail und Passwort, also noch nicht nötig.", { punkt: true }));
k.push(h2("Wiederkehrend"));
k.push(p("September 2027: Verlängerung von smartvoc.app.", { punkt: true }));
k.push(p("Vor dem aktiven Markteintritt in Deutschland: EU-Vertreter nach Art. 27 DSGVO benennen und in der Datenschutzerklärung nennen.", { punkt: true }));
k.push(p("Bei jeder neuen Datenbearbeitung: Datenschutzerklärung ergänzen. Sie liegt an einer Stelle, in src/lib/recht.ts, und speist Fenster und Webseite zugleich.", { punkt: true }));
k.push(p("Bei Wechsel des Mailversands: SPF und DKIM anpassen, bevor umgestellt wird — DMARC steht auf reject.", { punkt: true }));
k.push(p("Impressum und Datenschutzerklärung sind sorgfältig erstellt, aber juristisch nicht geprüft.", { kursiv: true, color: "5A554C", before: 200 }));

const doc = new Document({
  creator: "SmartVoc", title: "SmartVoc — Technisches Merkblatt",
  numbering: { config: [{ reference: "striche", levels: [{ level: 0, format: "bullet", text: "·", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 340, hanging: 200 } } } }] }] },
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1300, right: 1300 } } }, children: k }],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync("SmartVoc-Setup-Memo.docx", b);
  console.log("SmartVoc-Setup-Memo.docx geschrieben");
});
