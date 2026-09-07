/* ===================================================================
 * Beispielsätze und Lautschrift: anzeigen oder nicht.
 *
 * Zwei Angaben auf der Karte, die manche immer sehen wollen, manche nie
 * und manche je nach Tag. Ein blosser Schalter in den Einstellungen kann
 * das nicht: wer ihn beim Üben umlegen will, muss den Bereich verlassen.
 * Ein blosser Schalter beim Üben kann es auch nicht: wer die Lautschrift
 * grundsätzlich nicht will, will den Schalter auch nicht sehen.
 *
 * Also beides, und die Einstellung entscheidet, welches gilt:
 *   immer    — steht auf der Karte, kein Schalter
 *   nie      — steht nicht auf der Karte, kein Schalter
 *   waehlbar — ein Schalter unter der Karte, seine Stellung wird gemerkt
 *
 * Die Stellung des Schalters ist eine eigene Angabe. Sie in denselben Wert
 * zu schreiben wie den Modus hiesse, dass ein Umlegen beim Üben die
 * Einstellung überschreibt -- und dann wäre "wählbar" nach dem ersten
 * Umlegen weg.
 * =================================================================== */
export type Anzeigemodus = "immer" | "nie" | "waehlbar";

export const ANZEIGE_NAME: Record<Anzeigemodus, string> = {
  immer: "Immer anzeigen",
  nie: "Nie anzeigen",
  waehlbar: "Beim Üben wählbar",
};

export const ANZEIGE_KURZ: Record<Anzeigemodus, string> = {
  immer: "steht immer auf der Karte",
  nie: "steht nie auf der Karte",
  waehlbar: "ein Schalter unter der Karte, du entscheidest je Übung",
};

export interface AnzeigeFeld {
  modus: keyof any;      // Schlüssel der Einstellung für den Modus
  an: keyof any;         // Schlüssel der Einstellung für die Schalterstellung
}

export const BEISPIELE: AnzeigeFeld = { modus: "beispieleModus", an: "beispieleAn" };
export const PHONETIK: AnzeigeFeld = { modus: "phonetikModus", an: "phonetikAn" };
export const FORMEN: AnzeigeFeld = { modus: "formenModus", an: "formenAn" };

export const modusVon = (settings: any, feld: AnzeigeFeld): Anzeigemodus =>
  (settings?.[feld.modus] as Anzeigemodus) || "waehlbar";

/* Wird es gerade gezeigt? Die eine Frage, die jede Anzeigestelle stellt. */
export function zeigt(settings: any, feld: AnzeigeFeld): boolean {
  const m = modusVon(settings, feld);
  if (m === "immer") return true;
  if (m === "nie") return false;
  return settings?.[feld.an] !== false;
}

/* Gibt es einen Schalter dafür? Nur im wählbaren Modus. */
export const hatSchalter = (settings: any, feld: AnzeigeFeld) => modusVon(settings, feld) === "waehlbar";

/* V25 — aus den beiden alten Ja/Nein-Werten einen Modus machen.
 *
 * `showExamples: true` hiess "immer sichtbar" -- also wird daraus "immer",
 * nicht "wählbar". Wer die Anzeige ausgeschaltet hatte, bekommt "nie".
 * Beides ist die genaue Fortsetzung dessen, was die Person eingestellt
 * hatte; "wählbar" wäre eine Änderung, die niemand verlangt hat. */
export function stempelAnzeige(settings: any): Partial<any> | null {
  const aus: any = {};
  if (!settings?.beispieleModus) aus.beispieleModus = settings?.showExamples === false ? "nie" : "immer";
  if (!settings?.phonetikModus) aus.phonetikModus = settings?.showPhonetic === false ? "nie" : "immer";
  /* Die Formen gab es vorher nur bei Latein und dort ohne Schalter -- also
   * gibt es keinen alten Wert fortzusetzen. "waehlbar" ist die Empfehlung. */
  if (!settings?.formenModus) aus.formenModus = "waehlbar";
  return Object.keys(aus).length ? aus : null;
}

/* ===================================================================
 * Wie ein Wort auf der Karte steht.
 *
 * Der Artikel ist Teil des gespeicherten Wortes ("der Stuhl", "l'école")
 * -- er muss dort stehen, weil er sich aus dem Geschlecht nicht
 * zurueckbauen liesse: "l'" sagt nichts ueber m oder f, und Italienisch
 * waehlt zwischen il, lo und l' nach dem Anlaut.
 *
 * Ob er auf der Karte ERSCHEINT, entscheidet dieselbe Einstellung, die
 * ueber seine Bewertung entscheidet: was gefragt ist, wird gezeigt.
 *
 *   Artikel zaehlt (voll oder teilweise)  ->  "der Stuhl"
 *   Artikel ist freiwillig                ->  "Stuhl" + leise ", m"
 *
 * Das Geschlecht steht dann daneben, weil die Auskunft sonst verloren
 * ginge -- im ersten Fall traegt sie ja der Artikel selbst.
 * =================================================================== */
import { stripArticle, hasArticle } from "./scoring";

/* Das Geschlecht der Muttersprachseite wird abgeleitet, nicht gespeichert:
 * im Deutschen ist der Artikel eindeutig. Die eine Luecke ist "die" beim
 * Pluralwort -- dort hilft die Angabe am Fremdwort weiter, denn was in der
 * einen Sprache nur im Plural vorkommt, tut es in der anderen so gut wie
 * immer auch. */
export function genusDeutsch(de: string, genusFremd?: string): string {
  const a = (de || "").trim().toLowerCase();
  if (a.startsWith("der ")) return "m";
  if (a.startsWith("das ")) return "n";
  if (!a.startsWith("die ")) return "";
  /* "die" ist die eine zweideutige Stelle: weiblich oder Plural. Aus dem
   * Fremdwort laesst sich das nicht schließen -- "trousers" ist Plural,
   * "die Hose" nicht; "parents" ist Plural, "die Eltern" auch. Wo die
   * Angabe unsicher ist, wird gar keine gemacht: nichts zu behaupten ist
   * besser, als etwas Falsches zu behaupten. */
  return /\bpl\b/.test(genusFremd || "") ? "" : "f";
}

export interface Wortanzeige { haupt: string; zusatz: string }

export function wortAnzeige(text: string, opts: {
  istMuttersprache: boolean;
  genus?: string;
  de?: string;
  articleMode?: string;
}): Wortanzeige {
  const roh = String(text || "").trim();
  const modus = opts.articleMode || "required-partial";
  if (modus !== "optional" || !hasArticle(roh)) return { haupt: roh, zusatz: "" };
  const g = opts.istMuttersprache ? genusDeutsch(opts.de ?? roh, opts.genus) : (opts.genus || "");
  return { haupt: stripArticle(roh), zusatz: g };
}
