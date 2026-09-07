/* Die fünf Stufen, wie sie aussehen und heißen — an einer Stelle.
 *
 * `STUFE` in fsrs.ts sagt, WAS eine Stufe ist. Hier steht, wie sie erscheint:
 * welche Farbe, welches Wort. Das war vorher viermal aufgeschrieben — in
 * MasteryBar, in Stats, in WordList und in fsrs.ts selbst — und die Kopien
 * waren bereits auseinandergelaufen: „sitzt fast" trug in der Wortliste
 * Rostrot, überall sonst Gelb.
 *
 * Rostrot (`--amber`) ist in dieser App die Farbe der Hauptaktion. Eine
 * Beherrschungsstufe darf sie deshalb nicht tragen, sonst heißt dieselbe
 * Farbe an zwei Orten Verschiedenes. Grün, Gelb und Rot gehören den Stufen,
 * Rostrot gehört den Handlungen.
 */
import { STUFE_ORDER } from "./fsrs";

export { STUFE_ORDER };

/** Farbe je Stufe — als CSS-Variable, damit sie dem Farbschema folgt. */
export const STUFE_FARBE: Record<string, string> = {
  sitzt: "var(--ok)",
  sitzt_fast: "var(--warn)",
  sitzt_schlecht: "var(--bad)",
  neu: "var(--blue)",
  noch_nicht_geuebt: "var(--ink-faint)",
};

/** Kurzform für Legenden und Pillen — steht unter jeder Leiste und darf
 *  nicht umbrechen. */
export const STUFE_KURZ: Record<string, string> = {
  sitzt: "sitzt", sitzt_fast: "fast", sitzt_schlecht: "wackelt",
  neu: "neu", noch_nicht_geuebt: "ungeübt",
};

/** Ausgeschrieben, wo Platz ist — in Tabellen und an einzelnen Wörtern. */
export const STUFE_LANG: Record<string, string> = {
  sitzt: "sitzt", sitzt_fast: "sitzt fast", sitzt_schlecht: "wackelt noch",
  neu: "neu", noch_nicht_geuebt: "ungeübt",
};

/** Der Klassenname für `.badge` — dieselbe Zuordnung, nur als Klasse. */
export const STUFE_BADGE: Record<string, string> = {
  sitzt: "green", sitzt_fast: "warn", sitzt_schlecht: "red",
  neu: "blue", noch_nicht_geuebt: "slate",
};
