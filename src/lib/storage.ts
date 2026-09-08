/* ===================================================================
 * Speicher — localStorage als Arbeitsspeicher, nativ als Sicherung.
 *
 * Das Problem: iOS darf den Speicher einer WKWebView jederzeit räumen,
 * wenn der Platz knapp wird. Für eine Webseite ist das verschmerzbar, für
 * eine App nicht: dann wären Vokabeln und Lernstand weg, ohne dass der
 * Benutzer etwas falsch gemacht hätte.
 *
 * Die naheliegende Lösung — alles auf Capacitor Preferences umstellen —
 * scheitert an der Form: Preferences ist asynchron, und `load()` wird in
 * `useState`-Anfangswerten aufgerufen, also mitten im Rendern. Der ganze
 * Laden müsste asynchron werden.
 *
 * Deshalb zwei Schichten statt einer. localStorage bleibt der synchrone
 * Arbeitsspeicher; jedes `save()` schreibt zusätzlich in den nativen
 * Speicher, den iOS nicht räumt. Beim Start — vor dem ersten Rendern —
 * füllt `hydrateFromNative()` fehlende Schlüssel aus der Sicherung nach.
 * Im Browser passiert nichts davon; dort ist localStorage alles, was es
 * gibt, und das ist dort auch richtig so.
 * =================================================================== */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/* v2: Ein Wort traegt `listId`, nicht mehr `lists`. Die Schluessel tragen
 * die Modellversion, damit ein alter Bestand gar nicht erst gelesen wird --
 * eine Umrechnung waere aufwendiger als ein sauberer Neuanfang, und der war
 * ausdruecklich gewuenscht. Die alten vt_v1_* bleiben unangetastet liegen. */
export const LS = {
  vocab: "vt_v2_vocab",
  stats: "vt_v2_stats",
  meta: "vt_v2_meta",
  settings: "vt_v2_settings",
  lists: "vt_v2_lists",
  lessons: "vt_v2_lessons",   // nur noch zum Lesen: V16 löst sie in Wortlisten auf
  /* Was von der letzten Runde offen blieb. Nur die Wort-Kennungen und die
   * Auswahl, nicht der Zustand der Warteschlange: aus Kennungen laesst sich
   * eine Runde neu bauen, und die Lernstaende kommen dabei frisch aus den
   * Statistiken. Den eingefrorenen FSRS-Zustand ueber einen Neustart zu
   * schleppen waere die Art Abkuerzung, die Lerndaten beschaedigt. */
  offeneRunde: "vt_v2_offene_runde",
};

const nativ = () => Capacitor.isNativePlatform();

export const load = (key: string, fallback: any) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const save = (key: string, val: any) => {
  const raw = JSON.stringify(val);
  try { localStorage.setItem(key, raw); } catch (e) {}
  /* Die Sicherung läuft nebenher. Schlägt sie fehl, ist der Arbeitsspeicher
   * trotzdem geschrieben — ein verlorener Schreibvorgang in die Sicherung
   * darf die Anwendung nicht anhalten. */
  if (nativ()) Preferences.set({ key, value: raw }).catch(() => {});
};

/** Vor dem ersten Rendern aufrufen. Im Browser ein sofortiges Nichts. */
export async function hydrateFromNative(): Promise<void> {
  if (!nativ()) return;
  for (const key of Object.values(LS)) {
    try {
      if (localStorage.getItem(key) != null) continue;   // Arbeitsspeicher gewinnt
      const { value } = await Preferences.get({ key });
      if (value != null) localStorage.setItem(key, value);
    } catch (e) { /* ein einzelner Schlüssel darf den Start nicht verhindern */ }
  }
}

/** Beim Löschen der lokalen Daten muss auch die Sicherung weg. */
/* Einmalig: das alte Antwort-Protokoll wegräumen.
 *
 * Bis heute schrieb die App bei jeder bewerteten Antwort einen Eintrag mit
 * Wort, Zeitpunkt, Bewertung und Kartenzustand -- als Vorbereitung für eine
 * Anpassung der Modell-Parameter, die es in V1 nicht geben wird. Der
 * Schreiber ist weg; was schon auf dem Gerät liegt, muss aber ebenfalls
 * verschwinden, sonst bliebe eine Aufzeichnung zurück, für die es keinen
 * Zweck mehr gibt. Läuft beim Start, kostet nichts, wenn nichts da ist.
 *
 * Die Kopie in der Cloud kann von hier aus niemand löschen -- das steht in
 * HANDOFF-iOS.md als eigener Schritt.
 */
export async function entferneAltesProtokoll(): Promise<void> {
  const alt = "vt_v2_reviews";
  try { if (localStorage.getItem(alt) === null) return; } catch (e) { return; }
  try { localStorage.removeItem(alt); } catch (e) {}
  if (nativ()) { try { await Preferences.remove({ key: alt }); } catch (e) {} }
}

export async function clearAll(): Promise<void> {
  for (const key of Object.values(LS)) {
    try { localStorage.removeItem(key); } catch (e) {}
    if (nativ()) { try { await Preferences.remove({ key }); } catch (e) {} }
  }
}
