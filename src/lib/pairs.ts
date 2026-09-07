/* ===================================================================
 * Sprachen und Sprachpaare.
 *
 * Ein Sprachpaar heißt "<fremd>-<mutter>", also "en-de". Diese Kennung
 * steht an jedem Wort und an jeder Wortliste und ist damit gespeicherte
 * Wirklichkeit -- sie darf sich nie ruecklaufend aendern. Sie darf aber
 * WACHSEN: ein spaeteres "en-es" macht keine einzige bestehende Zeile
 * ungueltig, es kommt daneben. Deshalb braucht eine weitere Fremd- oder
 * Muttersprache keine Migration und keinen Besitzstandsbruch.
 *
 * Die Muttersprachseite eines Wortes liegt IMMER im Feld `de`. Das ist ein
 * Feldname, keine Sprache: es bedeutet "die Seite in der Muttersprache".
 * Wer es je in `nativ` umbenennt, kauft sich die einzige Migration ein, die
 * dieses Modell sonst nicht kennt. Also nicht umbenennen -- die Sprache
 * steht in der Beschriftung (`nativeLabel`), nicht im Feldnamen.
 * =================================================================== */
import type { Pair, PairId, Word } from "./types";

export const SMART_TRICKY = "__tricky";

/* Der Feldschluessel der Muttersprachseite. Siehe oben: fest, absichtlich. */
export const NATIVE = "de";

export interface Sprache { code: string; label: string; short: string }

/* Alle Sprachen, die die App benennen kann -- als Mutter- wie als
 * Fremdsprache. Die Beschriftung steht in der Sprache selbst, weil das
 * jeder erkennt, unabhaengig davon, in welcher Sprache die Oberflaeche
 * gerade laeuft. Latein ist die Ausnahme: es gibt keine lateinische
 * Selbstbezeichnung, die ein Schueler wiedererkennt. */
export const SPRACHEN: Record<string, Sprache> = {
  de: { code: "de", label: "Deutsch",    short: "DE" },
  en: { code: "en", label: "Englisch",    short: "EN" },
  fr: { code: "fr", label: "Französisch",   short: "FR" },
  es: { code: "es", label: "Spanisch",    short: "ES" },
  it: { code: "it", label: "Italienisch",   short: "IT" },
  pt: { code: "pt", label: "Portugiesisch",  short: "PT" },
  la: { code: "la", label: "Latein",     short: "LA" },
};

/* Die Fremdsprachen in der Reihenfolge, in der sie ueberall erscheinen. */
export const FREMDSPRACHEN = ["en", "fr", "es", "it", "pt", "la"];

/* Die Muttersprachen, die es GIBT. Heute eine. Die Liste ist die Weiche:
 * eine zweite Zeile hier erzeugt alle zugehoerigen Paare, und alles
 * Bestehende bleibt unberuehrt. Was dann noch fehlt, ist der Waehler in den
 * Einstellungen und ein Grundwortschatz -- nicht das Datenmodell. */
export const MUTTERSPRACHEN = ["de"];

export const MUTTERSPRACHE_VORGABE = "de";

export const paarId = (fremd: string, mutter: string) => `${fremd}-${mutter}`;
export const fremdVon = (pair: string) => String(pair || "").split("-")[0];
export const mutterVon = (pair: string) => String(pair || "").split("-")[1] || MUTTERSPRACHE_VORGABE;

function bauePaare(): Record<string, Pair> {
  const out: Record<string, Pair> = {};
  for (const mutter of MUTTERSPRACHEN) {
    for (const fremd of FREMDSPRACHEN) {
      if (fremd === mutter) continue;
      const f = SPRACHEN[fremd], m = SPRACHEN[mutter];
      if (!f || !m) continue;
      out[paarId(fremd, mutter)] = {
        id: paarId(fremd, mutter) as PairId,
        foreign: fremd, foreignLabel: f.label,
        nativeLabel: m.label, short: f.short,
      };
    }
  }
  return out;
}

/* ALLE Paare, die es geben kann -- nicht die des Benutzers. Ein Nachschlagen
 * ueber eine gespeicherte Kennung muss immer gelingen, auch wenn das Paar
 * gerade ausgeschaltet ist; sonst verlieren Woerter ihre Beschriftung. */
export const PAIRS: Record<string, Pair> = bauePaare();

/* Welche Paare der Benutzer sehen will. Reiner Anzeigefilter: Woerter eines
 * ausgeblendeten Paares bleiben unberuehrt und kommen wieder, sobald es
 * eingeschaltet wird. Gibt nie eine leere Liste zurueck. */
export function activePairs(settings: any): Pair[] {
  const mutter = settings?.muttersprache || MUTTERSPRACHE_VORGABE;
  const meine = Object.values(PAIRS).filter((p) => mutterVon(p.id) === mutter);
  const want = Array.isArray(settings?.activePairs) ? settings.activePairs : null;
  const list = want ? meine.filter((p) => want.includes(p.id)) : meine;
  return list.length ? list : (meine.length ? [meine[0]] : [PAIRS["en-de"]]);
}

export const fk = (pair: PairId | string) => (PAIRS[pair] || PAIRS["en-de"]).foreign; // Feldschluessel der Fremdseite
export const isLatinPair = (pair: PairId | string) => fremdVon(pair as string) === "la";

/* Ein Wort ist ueb-bar, wenn beide Seiten da sind. Latein nutzt Lernformen
 * statt einer bloßen Zeichenkette. */
export const practiceable = (w: Word) =>
  !!(w && w.de && (isLatinPair(w.pair) ? (w.grundform || w.lernform) : w[fk(w.pair)]));
