/* Light shared types for Phase 0. Kept pragmatic (strict off) so the
 * extraction stays parity-focused; tighten in a later pass. */

/* "<fremd>-<mutter>", z. B. "en-de". Bewusst eine Zeichenkette und keine
 * feste Aufzaehlung: die Kennung steht gespeichert an jedem Wort, und neue
 * Paare kommen daneben, statt bestehende zu entwerten. */
export type PairId = string;
export type Verdict = "correct" | "almost" | "wrong";
export type Wortart = string;   // die erlaubten Werte stehen in lib/export.ts
export type LatinMode = "L2" | "L3";
export type ErrorType = "article" | "accent" | "typo" | "wrong" | null;
export type TipsFrequency = "off" | "occasional" | "frequent";
export type Scheme = "kladde" | "leinen" | "altpapier";
export type Appearance = "light" | "dark" | "auto";
export type CardStyle = "ruled" | "plain" | "recycled" | "linen";
export type CardFont = "serif" | "arial" | "handwriting";

export interface Pair {
  id: PairId;
  foreign: string;        // word field key for the foreign side (en / fr)
  foreignLabel: string;
  nativeLabel: string;
  short: string;
}

export interface Word {
  id: string;
  pair: PairId;
  /* Die Seite in der MUTTERSPRACHE. Der Feldname ist historisch und
   * bedeutet nicht "Deutsch": lernt jemand mit Spanisch als Muttersprache,
   * steht sein Spanisch hier. Ein Umbenennen waere die einzige Aenderung an
   * diesem Modell, die eine Datenmigration braeuchte -- also nicht
   * umbenennen. Die Sprache steht in der Beschriftung (`nativeLabel` des
   * Sprachpaars), nicht im Feldnamen. */
  de: string;
  en?: string;
  fr?: string;
  la?: string;            // generic Latin string (rarely used; forms below preferred)
  // Latin learning forms (only on la-de words)
  grundform?: string;     // Nominativ / 1. Pers. Sg. / m-Form
  lernform?: string;      // full stammformen, e.g. "video, videre, vidi, visum"
  wortart?: Wortart;
  /* Das Geschlecht des FREMDWORTS, als eigene Angabe -- "m", "f", "n" oder
   * eine der Plural-Formen. Siehe lib/export.ts: aus dem Artikel abzuleiten
   * geht nur im Deutschen. */
  genus?: string;
  examples?: string[];    // 1–2 example sentences IN THE FOREIGN LANGUAGE (school books print these)
  /* Their German translations, index-aligned with `examples`. A parallel array
   * rather than a restructure to {fgn, de} pairs: `examples` is read in a dozen
   * places, and every word that already exists carries the old shape. Both are
   * optional and each entry may be empty — a sentence without a translation
   * simply shows nothing on the German side. */
  examplesDe?: string[];
  phonetic?: string;      // optional pronunciation of the foreign word, e.g. "dɒɡ" or "dohg"
  /* Die Wortliste, in der dieses Wort steht -- GENAU EINE (V18).
   *
   * Das Feld ist ein Feld und heisst im Plural, weil es aus der Zeit davor
   * stammt: damals durfte ein Wort in mehreren Listen liegen. Die Form
   * umzubauen hiesse, den Speicher jedes Geraets und jedes Konto in der
   * Wolke anzufassen; das Feld bleibt deshalb, wie es ist.
   *
   * Es hat genau einen Eintrag. Wer hier anhaengt, bricht die Regel -- und
   * genau das ist schon passiert: beide Listen zeigten danach dieselben
   * Woerter, und ein Verschieben aus der einen nahm sie auch aus der
   * anderen, weil es dieselbe Id war. Durchgesetzt wird die Regel in
   * StoreProvider (eineListeJeWort): alles, was in den Bestand kommt,
   * laeuft dort durch. Ein leeres Feld ist ebenso ungueltig; solche Woerter
   * werden geloescht (Migration V28, deleteList). */
  lists?: string[];
  review?: boolean;
  source?: "seed" | "manual" | "import" | "none" | string;
  [key: string]: any;     // allows w[fk(pair)] and future form fields
}

export interface HistoryEntry { score: number; verdict: Verdict; ts: number; errorType?: ErrorType; }

export interface Stat {
  seen: number;
  scoreSum: number;
  correctCount: number;
  almostCount: number;
  wrongCount: number;
  firstTry: boolean;
  ema: number;
  streak: number;
  lastTs?: number;
  history: HistoryEntry[];
  fsrs?: import("./fsrs").SerializedCard;   // V8 — FSRS scheduler state (lazy warm-start)
}

export interface Meta {
  lastDate: string | null;
  streak: number;
  todayCount: number;
  newToday?: number;
  dailyGoal?: number;
  totalReviews: number;
}

export interface ListT {
  id: string;
  name: string;
  pair: PairId;
  createdAt: number;
  /* Wer sie angelegt hat, wann sie zuletzt angefasst wurde, und woher sie
   * stammt. `autor` ist der Anzeigename zum Zeitpunkt des Anlegens, nicht
   * eine Kennung: eine geteilte Liste soll auch dann noch sagen koennen,
   * von wem sie kam, wenn das Konto laengst weg ist. */
  autor?: string;
  updatedAt?: number;
  herkunft?: "selbst" | "geteilt" | "grundwortschatz";
}

// V9: lessons are ALWAYS static snapshots (a fixed set of word ids).
export interface Lesson {
  id: string;
  name: string;
  pair: PairId;
  members: string[];                  // the fixed snapshot of word ids
  createdAt?: number;
  updatedAt?: number;
  dueDate?: number;                   // optional exam deadline (V15)
  origin?: string;                    // provenance label only (e.g. "Liste: Tiere"), no auto-sync
  // legacy (pre-V9) — tolerated on read, migrated to members on load:
  kind?: string;
}

export interface DiffChar {
  ch: string;
  status: "ok" | "wrong" | "missing" | "extra";
}

export interface ScoreResult {
  score: number;
  verdict: Verdict;
  note: string;
  targetDiff: DiffChar[];
  userDiff: DiffChar[];
  errorType?: ErrorType;
}

export interface ScoreOpts {
  lenientCase?: boolean;
  strictAccents?: boolean;
  articleMode?: "optional" | "required-full" | "required-partial";
  acceptPartial?: boolean;
  macronsOptional?: boolean;   // Latin: length marks (ā ĕ) not required → still fully correct
}

export interface Settings {
  /* Was jemand darf. Wird beim ersten Start gestempelt und danach nie von
   * selbst geaendert -- siehe lib/plan.ts. Der Stempel ist die
   * Besitzstandswahrung: V2 kann die Voreinstellung fuer neue
   * Installationen aendern, ohne jemanden anzufassen, der schon einen hat. */
  /* Womit die App aufmacht: die Tagesliste, die zuletzt geuebte Liste
   * (weitermachen oder neu), oder nichts. */
  startAuswahl?: "heute" | "weiter" | "neu" | "leer";
  /* Die Muttersprache. Wird einmal gestempelt und danach nie von selbst
   * geaendert -- wie der Plan. Heute gibt es nur "de"; die Weiche steht,
   * damit eine spaetere Voreinstellung niemanden anfasst, der schon einen
   * Stempel hat. Siehe lib/pairs.ts. */
  muttersprache?: string;
  plan?: "gratis" | "pro";
  planQuelle?: "v1" | "bestandsschutz" | "apple" | "web" | "geschenk";
  planSeit?: number;
  mode: string;
  choicesCount: number;
  dailyGoal: number;
  newPerDay: number;
  targetRetention?: number;                            // V13 — THE retention source (0.85/0.90/0.95)
  lernIntensity?: "locker" | "normal" | "intensiv";   // V8 — UI shell that writes targetRetention
  missWeight?: number;       // V8: deprecated (FSRS internal), kept optional for old data
  spacingGap?: number;       // V8: deprecated
  masteryCorrect?: number;   // V8: deprecated
  lenientCase: boolean;
  strictAccents: boolean;
  articleMode: "optional" | "required-full" | "required-partial";
  acceptPartial: boolean;
  latinMode: LatinMode;   // L2 (ask Grundform) | L3 (ask full Lernform)
  tipsFrequency: TipsFrequency;
  uiLang?: "de" | "en";     // Oberflächensprache; leer = folgt dem Gerät
  scheme: Scheme;
  appearance: Appearance;
  readyGreen?: number;   // Ampel: ab wieviel Prozent gilt eine Liste als bereit
  readyAmber?: number;
  cardStyle: CardStyle;
  cardFont: CardFont;
  direction: "f2n" | "n2f";
  pair: PairId;
  selectedLists: string[];
  statLists: string[];
  statPair?: string | null;   // null = alle Sprachen (Standard der Statistik)
  practiceSel: string;     // "lesson:<id>" | "smart:due" | "smart:tricky" | ""
  // F-SETTINGS-ADVANCED: per-user CFG overrides (read by fsrs.configure). All optional;
  // undefined falls back to the named DEFAULTS in fsrs.ts.
  S1?: number; S2?: number; MIN_REPS?: number; D_LEECH?: number; LAPSE_LEECH?: number; PUFFER?: number;
  examRetention?: number; examWindowDays?: number; examRampDays?: number; learningSpeed?: number;
  [key: string]: any;
}
