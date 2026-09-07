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
export const DATENSCHUTZ_URL = "https://smartvoc.app/datenschutz.html";

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
      "Sobald wir deine Daten für etwas anderes verwenden wollten, etwa für Auswertungen über mehrere Nutzer hinweg, für Forschung oder für Werbung, würden wir dich vorher fragen. Heute tun wir nichts davon.",
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
      "Du kannst Auskunft darüber verlangen, was über dich gespeichert ist, kannst es berichtigen lassen, und du kannst alles jederzeit selbst als Datei exportieren oder dein Konto vollständig löschen. Den Export findest du in den Einstellungen, das Löschen des Kontos im Kontofenster oben rechts. Beim Löschen verschwinden auch die Daten auf dem Server, und das lässt sich nicht rückgängig machen. Für alles andere genügt eine Nachricht an support@smartvoc.app.",
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
      "Martin Keller, Rebbergstrasse 7a, 8953 Dietikon, Schweiz.",
      "Fragen zum Datenschutz: support@smartvoc.app, Telefon +41 79 822 36 75.",
    ],
  },
];

export const IMPRESSUM: Abschnitt[] = [
  {
    h: "Herausgeber",
    p: [
      "Martin Keller",
      "Rebbergstrasse 7a",
      "8953 Dietikon",
      "Schweiz",
    ],
  },
  {
    h: "Kontakt",
    p: [
      "E-Mail: support@smartvoc.app",
      "Telefon: +41 79 822 36 75",
      "Fragen, Fehler und Rückmeldungen gehen an dieselbe Adresse.",
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

/* Englische Fassung. Sie muss sein, nicht weil die App zweisprachig ist,
 * sondern weil die Datenschutzerklaerung im App Store frei erreichbar und
 * lesbar sein muss -- und weil ein Rechtstext, den der Leser nicht versteht,
 * seinen Zweck verfehlt.
 *
 * Zwei Fassungen sind zwei Gelegenheiten auseinanderzulaufen. Wer hier etwas
 * aendert, aendert es oben mit. */
export const DATENSCHUTZ_EN: Abschnitt[] = [
  {
    p: [
      "In short: this app collects nothing about you that is not part of learning. It stores what you enter yourself, and how well you know your words. It needs no more than an email address, and only if you sign in.",
    ],
  },
  {
    h: "What is stored",
    p: [
      "Your words, word lists and settings. Along with that, your progress: for each word, when you last practised it, whether the answer was right, how often you have had it, and how firmly it currently sits according to the app's arithmetic. That is what determines when a word comes back.",
      "If you sign in, additionally your email address and a display name you choose yourself.",
    ],
  },
  {
    h: "Where it is kept",
    p: [
      "Without signing in, everything stays on this device, in your browser's storage or the app's. The app also stores its own program files there so it works without an internet connection. You can remove both by clearing the site data or deleting the app.",
      "If you sign in, everything is additionally stored on a server so you have the same state on several devices. That server is in Frankfurt am Main, Germany. It is operated by Supabase, Inc., a company based in the USA; the processing is covered by a data processing agreement with the European Commission's standard contractual clauses. The transfer is encrypted, and the database rules let only you reach your own data.",
      "When connecting to the server, the upstream service Cloudflare sets a technical cookie to fend off automated access. It lives for half an hour and serves security only.",
      "We run this database ourselves. That also means: as the publisher of the app we can in principle look at the stored data, like anyone who runs their own server. We only do so when it is necessary to operate the service, for example to track down a fault.",
    ],
  },
  {
    h: "Why we are allowed to",
    p: [
      "We do not ask your permission to store your progress, and there is a reason: it is the service you sign up for. Without it there would be nothing to sync. Consent would be the wrong basis here, because you could withdraw it and we would then have to stop the very service you had just signed up for. Legally we therefore rely on the performance of our contract with you.",
      "The moment we wanted to use your data for anything else, say for analyses across several users, for research or for advertising, we would ask you first. Today we do none of that.",
    ],
  },
  {
    h: "What does NOT happen",
    p: [
      "No advertising, no tracking pixels, no passing on to third parties, no selling, no analysis across several users. What the app knows about your progress serves one purpose only: showing you the right words at the right time. It does not evaluate how you behave otherwise, and the learning algorithm is not adapted to you; it uses the same values for everyone.",
    ],
  },
  {
    h: "Shared word lists",
    p: [
      "When you share a word list, its contents are stored under a random code. Whoever has the code can take a copy. Your name is not attached, and your progress is not passed on.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You can ask what is stored about you, have it corrected, and you can export everything yourself as a file or delete your account entirely at any time. The export is in the settings; deleting your account is in the account window at the top right. Deleting also removes the data on the server, and it cannot be undone. For anything else, a message to support@smartvoc.app is enough.",
    ],
  },
  {
    h: "Children",
    p: [
      "The app is for anyone learning vocabulary, from school lessons to studying on your own. It contains no advertising and no purchases.",
      "Without an account we collect no personal data at all. Anyone under 16 should only create an account with a parent's agreement; none is needed for learning.",
    ],
  },
  {
    h: "Responsible",
    p: [
      "Martin Keller, Rebbergstrasse 7a, 8953 Dietikon, Switzerland.",
      "Questions about data protection: support@smartvoc.app, phone +41 79 822 36 75.",
    ],
  },
];

export const IMPRESSUM_EN: Abschnitt[] = [
  {
    h: "Publisher",
    p: [
      "Martin Keller",
      "Rebbergstrasse 7a",
      "8953 Dietikon",
      "Switzerland",
    ],
  },
  {
    h: "Contact",
    p: [
      "Email: support@smartvoc.app",
      "Phone: +41 79 822 36 75",
      "Questions, faults and feedback go to the same address.",
    ],
  },
  {
    h: "Contents",
    p: [
      "The core vocabulary supplied with the app and all its texts come from the publisher. The words you enter yourself are yours.",
    ],
  },
  {
    h: "Work by others",
    p: [
      "The repetition intervals are computed by FSRS, a freely available memory model. The typefaces are Source Serif 4, Hanken Grotesk and Patrick Hand, all under the SIL Open Font License.",
    ],
  },
];
