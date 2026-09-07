/* Die Smart Lists an einer Stelle.
 *
 * Sie standen bisher in Practice.tsx und werden jetzt an zwei Orten
 * gebraucht: im Blatt des Üben-Bereichs und in der Wortlisten-Übersicht.
 * Zwei Kopien wären zwei Gelegenheiten, sie verschieden zu benennen —
 * und der abgenommene Entwurf zeigt in beiden Bereichen dieselben vier
 * Einträge unter derselben Überschrift.
 *
 * Die Beschriftungen laufen beim Rendern durch txt(); hier stehen sie
 * deutsch, weil der deutsche Text der Schlüssel ist.
 */
export interface SmartList { ref: string; label: string; icon: string; tone: string; kurz: string; }

export const SMART_ACCESS: SmartList[] = [
  { ref: "heute", label: "Heute dran", icon: "calendar", tone: "green",
    kurz: "Fälliges und Neues sinnvoll gemischt" },
  { ref: "due", label: "Fällige Wörter", icon: "target", tone: "amber",
    kurz: "Jetzt fällig — der beste Moment zum Auffrischen" },
  { ref: "wackeln", label: "Wackeln noch", icon: "flame", tone: "red",
    kurz: "Schon geübt, sitzt aber noch nicht sicher" },
  { ref: "baldfaellig", label: "Bald fällig", icon: "clock", tone: "amber",
    kurz: "Sitzt noch, wäre aber bald wieder dran" },
];

/* Sichtbar sind die vier oben. Diese Refs gelten zusätzlich als Umfang
 * einer Übung — die Statistik startet sie, sie haben aber keine eigene
 * Zeile in der Übersicht. */
export const SMART_REFS = ["heute", "due", "wackeln", "baldfaellig", "leech", "frischfragil", "kurzvorsitzt"];
