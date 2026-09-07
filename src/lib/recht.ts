/* Datenschutz und Impressum als Daten, nicht als Auszeichnung.
 *
 * Beide Texte erscheinen an zwei Orten: im Fenster „Über SmartVoc" und als
 * öffentliche Seite im Web. Apple verlangt für den App Store eine frei
 * erreichbare Adresse mit der Datenschutzerklärung; in der App allein
 * genügt sie nicht.
 *
 * Zwei Fassungen desselben Textes wären zwei Gelegenheiten, ihn
 * auseinanderlaufen zu lassen — und ausgerechnet bei einem Rechtstext ist
 * das keine Kleinigkeit. Deshalb steht er einmal hier, und beide Seiten
 * lesen daraus: die App in `UeberModal`, die Web-Seite über
 * `scripts/gen-datenschutz.mjs` beim Bauen.
 */
/* Die oeffentliche Adresse der Datenschutzerklaerung. Sie steht in der
 * App, in App Store Connect und spaeter womoeglich auf einer eigenen
 * Domain -- deshalb an genau einer Stelle. */
export const DATENSCHUTZ_URL = "https://smartvoc-app.github.io/SmartVoc/datenschutz.html";

export interface Abschnitt { h?: string; p: string[] }

export const DATENSCHUTZ: Abschnitt[] = [
  {
    p: [
      "Kurz: Diese App sammelt nichts über dich, was nicht zum Lernen gehört. Sie speichert, was du selbst einträgst, und wie gut du deine Wörter kannst. Mehr als eine E-Mail-Adresse braucht sie nicht, und die nur, wenn du dich anmeldest.",
    ],
  },
  {
    h: "Was gespeichert wird",
    p: [
      "Deine Wörter, Wortlisten und Einstellungen. Dazu dein Lernstand: zu jedem Wort, wann du es zuletzt geübt hast, ob die Antwort richtig war, wie oft du es schon hattest und wie sicher es nach der Rechnung der App gerade sitzt. Daraus ergibt sich, wann ein Wort wiederkommt.",
      "Meldest du dich an, zusätzlich deine E-Mail-Adresse und ein selbst gewählter Anzeigename.",
    ],
  },
  {
    h: "Wo es liegt",
    p: [
      "Ohne Anmeldung bleibt alles auf diesem Gerät, im Speicher deines Browsers oder der App. Dazu legt die App ihre eigenen Programmdateien ab, damit sie ohne Internet funktioniert. Beides kannst du löschen, indem du die Websitedaten löschst oder die App entfernst.",
      "Mit Anmeldung wird alles zusätzlich auf einem Server gespeichert, damit du auf mehreren Geräten denselben Stand hast. Dieser Server steht in Frankfurt am Main, Deutschland. Betrieben wird er von Supabase, Inc., einem Unternehmen mit Sitz in den USA; für die Verarbeitung gilt ein Auftragsverarbeitungsvertrag mit den Standardvertragsklauseln der EU-Kommission. Die Übertragung ist verschlüsselt, und die Regeln der Datenbank lassen nur dich an deine eigenen Daten.",
      "Beim Verbinden mit dem Server setzt der vorgeschaltete Dienst Cloudflare einen technischen Cookie zur Abwehr automatisierter Zugriffe. Er lebt eine halbe Stunde und dient nur der Sicherheit.",
      "Wir betreiben diese Datenbank selbst. Das heißt auch: als Herausgeber der App können wir die gespeicherten Daten grundsätzlich einsehen, so wie jeder, der einen eigenen Server betreibt. Wir tun das nur, wenn es zum Betrieb nötig ist, etwa um einen Fehler zu finden.",
    ],
  },
  {
    h: "Warum wir das dürfen",
    p: [
      "Wir fragen dich nicht um Erlaubnis, deinen Lernstand zu speichern, und das hat einen Grund: er ist die Leistung, für die du dich anmeldest. Ohne ihn gäbe es nichts abzugleichen. Eine Einwilligung wäre hier die falsche Grundlage, weil du sie widerrufen könntest und wir dann den Dienst einstellen müssten, für den du dich gerade angemeldet hast. Rechtlich stützen wir uns deshalb auf die Erfüllung des Vertrags mit dir.",
      "Sobald wir deine Daten für etwas anderes verwenden wollten — Auswertungen über mehrere Nutzer hinweg, Forschung, Werbung —, würden wir dich vorher fragen. Heute tun wir nichts davon.",
    ],
  },
  {
    h: "Was NICHT passiert",
    p: [
      "Keine Werbung, keine Zählpixel, keine Weitergabe an Dritte, kein Verkauf, keine Auswertung über mehrere Nutzer hinweg. Was die App über deinen Lernstand weiß, dient ausschließlich dazu, dir die richtigen Wörter zur richtigen Zeit zu zeigen. Sie wertet nicht aus, wie du dich sonst verhältst, und der Lernalgorithmus wird nicht an dich angepasst: er rechnet für alle mit denselben Werten.",
    ],
  },
  {
    h: "Geteilte Wortlisten",
    p: [
      "Teilst du eine Wortliste, wird ihr Inhalt unter einem zufälligen Code abgelegt. Wer den Code hat, kann eine Kopie übernehmen. Dein Name steht nicht dabei, und dein Lernstand wird nicht mitgeteilt.",
    ],
  },
  {
    h: "Deine Rechte",
    p: [
      "Du kannst Auskunft darüber verlangen, was über dich gespeichert ist, kannst es berichtigen lassen, und du kannst alles jederzeit selbst als Datei exportieren oder dein Konto vollständig löschen. Export und Löschung findest du in den Einstellungen unter „Konto & Daten“. Beim Löschen verschwinden auch die Daten auf dem Server, und das lässt sich nicht rückgängig machen. Für alles andere genügt eine Nachricht an die im Impressum genannte Adresse.",
    ],
  },
  {
    h: "Kinder",
    p: [
      "Die App richtet sich an alle, die Vokabeln lernen, vom Schulunterricht bis zum Selbststudium. Sie enthält keine Werbung und keine Käufe.",
      "Ohne Konto erheben wir überhaupt keine personenbezogenen Daten. Wer jünger als 16 ist, sollte ein Konto nur mit Einverständnis der Eltern anlegen; zum Lernen braucht es keines.",
    ],
  },
  {
    h: "Verantwortlich",
    p: [
      "Martin Keller, Schweiz. Fragen zum Datenschutz gehen an die im Impressum genannte Adresse.",
    ],
  },
];

export const IMPRESSUM: Abschnitt[] = [
  {
    h: "Herausgeber",
    p: [
      "Martin Keller, Schweiz",
    ],
  },
  {
    h: "Kontakt",
    p: [
      "Fragen, Fehler und Rückmeldungen gehen an die im App Store hinterlegte Adresse.",
    ],
  },
  {
    h: "Inhalte",
    p: [
      "Der mitgelieferte Grundwortschatz und alle Texte dieser App stammen vom Herausgeber. Die Wörter, die du selbst einträgst, gehören dir.",
    ],
  },
  {
    h: "Verwendete Arbeit anderer",
    p: [
      "Die Wiederholungsabstände berechnet FSRS, ein frei verfügbares Gedächtnismodell. Die Schriften sind Source Serif 4, Hanken Grotesk und Patrick Hand, alle unter der SIL Open Font License.",
    ],
  },
];
