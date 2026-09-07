/* Platzhalter für `xlsx` im iOS-Bündel.
 *
 * Tabellen einlesen und Vorlage herunterladen gibt es nur im Web und nur
 * angemeldet — auf dem Telefon werden die beiden Knöpfe gar nicht erst
 * gezeichnet. Die Bibliothek dahinter wiegt 429 kB.
 *
 * Der dynamische Import sorgt schon dafür, dass sie nie GELADEN wird. Sie
 * läge aber trotzdem als eigene Datei im App-Paket und machte den Download
 * größer, für eine Funktion, die die App nicht hat. Deshalb zeigt der
 * iOS-Build `xlsx` auf diese Datei (siehe resolve.alias in vite.config.ts).
 *
 * Wirft absichtlich statt still nichts zu tun: sollte je ein Aufruf hierher
 * gelangen, ist das ein Fehler in der Bedingung und soll auffallen.
 */
const nichtHier = (): never => {
  throw new Error("xlsx ist im iOS-Bündel nicht enthalten. Tabellen gibt es nur im Web");
};

export const read = nichtHier;
export const writeFile = nichtHier;
export const utils = {
  sheet_to_json: nichtHier,
  aoa_to_sheet: nichtHier,
  book_new: nichtHier,
  book_append_sheet: nichtHier,
};
