/* Account data portability + erasure (Phase 7, GDPR / store requirement). */
import { LS, load, clearAll } from "./storage";

/* Full account export: the five gespeicherten Dokumente als JSON-Download.
   Die Schluessel kommen aus LS und tragen damit die Modellversion mit. */
export function exportAllData(stamp: string) {
  const data = {
    app: "SmartVoc",
    schema: "vt_v2",
    exportedAt: stamp,
    vocab: load(LS.vocab, []),
    lists: load(LS.lists, []),
    stats: load(LS.stats, {}),
    meta: load(LS.meta, {}),
    settings: load(LS.settings, {}),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vokabeltrainer-export-${stamp.slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Alle lokalen Daten entfernen. Die App saet beim naechsten Start neu.
 * Die Anmeldung bei Supabase bleibt unangetastet.
 *
 * Der Filter greift den ganzen "vt_"-Namensraum, nicht eine einzelne
 * Modellversion. Sonst haette der Wechsel auf v2 diese Funktion still
 * ausgehebelt: sie suchte nach "vt_v1_", und die Daten lagen laengst unter
 * "vt_v2_". "Alles loeschen" haette dann nichts geloescht -- ein Versprechen,
 * das die App gegenueber dem Benutzer und dem App Store gibt. */
export async function deleteLocalData() {
  Object.keys(localStorage)
    // "vtbackup_" holds pre-merge snapshots kept outside the vt_ namespace —
    // "delete everything" has to take those too.
    .filter((k) => k.startsWith("vt_") || k.startsWith("vtbackup_"))
    .forEach((k) => localStorage.removeItem(k));
  /* Auf iOS liegt neben localStorage eine native Sicherung. Wer loescht,
   * meint beides -- sonst waere alles beim naechsten Start wieder da. */
  await clearAll();
}
