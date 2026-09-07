/* statistik.ts — der Rechenkern der Statistik.
 *
 * Alles hier ist eine reine Funktion über dem, was die App ohnehin schon
 * speichert. Es wird nichts Neues gesammelt: die Parameteranpassung bleibt
 * draußen, und mit ihr das Protokoll, das sie gebraucht hätte.
 *
 * Zwei Grenzen der Datenlage, die man kennen muss, weil sie die Zahlen
 * färben:
 *
 *  1. `stats[id].history` behält je Wort die letzten 30 Antworten. Wer ein
 *     Wort öfter geübt hat, verliert die ältesten. Über 7 und 30 Tage ist
 *     das praktisch nie ein Thema; über 90 Tage zählt ein vielgeübtes Wort
 *     zu wenig Antworten. Deshalb meldet jede Auswertung mit `gekappt`, wie
 *     viele Wörter am Anschlag stehen — die Oberfläche sagt es dann.
 *
 *  2. Ein Wort trägt keinen Anlagezeitpunkt und keinen Zeitpunkt, an dem es
 *     zum ersten Mal saß. „Wie viele Tage bis es sitzt" ist daher aus dem
 *     Bestand nicht rekonstruierbar — nur aus Zählern, die ab jetzt
 *     mitlaufen. Siehe `tageBisSitzt`.
 */
import { STUFE_ORDER } from "./fsrs";

export type Zeitraum = 7 | 30 | 90;
export const ZEITRAEUME: Zeitraum[] = [7, 30, 90];

export interface Antwort { ts: number; verdict: string; score: number; errorType?: string | null; id: string; }

const TAG = 86400000;
export const tagesSchluessel = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/* ------------------------------------------------------------------ Antworten
 * Alle Antworten im Zeitraum, über die gewählten Wörter, aufsteigend nach
 * Zeit. `gekappt` zählt die Wörter, deren Verlauf am 30er-Anschlag steht und
 * deren älteste Antworten deshalb fehlen könnten. */
export function sammleAntworten(stats: any, wortIds: string[], tage: number) {
  const von = Date.now() - tage * TAG;
  const alle: Antwort[] = [];
  let gekappt = 0;
  for (const id of wortIds) {
    const h = stats[id]?.history;
    if (!h || !h.length) continue;
    if (h.length >= 30 && h[0].ts > von) gekappt++;      // ältester Eintrag liegt IM Zeitraum → davor fehlt etwas
    for (const e of h) if (e.ts >= von) alle.push({ ...e, id });
  }
  alle.sort((a, b) => a.ts - b.ts);
  return { antworten: alle, gekappt };
}

/* -------------------------------------------------------------- Antwortbilanz
 * Zwei Klassen, nicht drei. Eine Antwort, bei der nur der Akzent oder ein
 * Buchstabe danebenlag, zählt als richtig — so rechnet der Planer intern
 * ohnehin, und „fast" als eigene Klasse konnte niemand einordnen. */
export function antwortBilanz(antworten: Antwort[]) {
  let richtig = 0, falsch = 0;
  for (const a of antworten) (a.verdict === "wrong" ? falsch++ : richtig++);
  const gesamt = richtig + falsch;
  return { richtig, falsch, gesamt, anteil: gesamt ? Math.round(richtig / gesamt * 100) : 0 };
}

/* ------------------------------------------------------------- Stolpersteine
 * Was danebenlag, nicht wie oft. Gezählt werden Antworten, die nicht auf
 * Anhieb saßen — die vier Arten kommen aus der Bewertung selbst. */
export const FEHLERART = {
  accent:  { name: "Akzente und Längenstriche", was: "zählt als Treffer",   gilt: "fast" },
  typo:    { name: "Tippfehler",                was: "zählt als Treffer",   gilt: "fast" },
  wrong:   { name: "Ganz daneben",              was: "ein anderes Wort",    gilt: "falsch" },
  article: { name: "Artikel",                   was: "der / die / das",     gilt: "falsch" },
} as const;
export type FehlerartKey = keyof typeof FEHLERART;

export function fehlerarten(antworten: Antwort[]) {
  const n: Record<string, number> = { accent: 0, typo: 0, wrong: 0, article: 0 };
  let gesamt = 0;
  for (const a of antworten) {
    if (a.verdict === "correct") continue;              // saß auf Anhieb
    gesamt++;
    const k = a.errorType && n[a.errorType] !== undefined ? a.errorType
      : (a.verdict === "wrong" ? "wrong" : "typo");     // ohne Art: nach Urteil einsortieren
    n[k]++;
  }
  const zeilen = (Object.keys(FEHLERART) as FehlerartKey[])
    .map((k) => ({ k, n: n[k], ...FEHLERART[k] }))
    .filter((z) => z.n > 0)
    .sort((a, b) => b.n - a.n);
  const max = zeilen.length ? zeilen[0].n : 0;
  return { zeilen: zeilen.map((z) => ({ ...z, breite: max ? Math.round(z.n / max * 100) : 0 })), gesamt };
}

/* ----------------------------------------------------------------- Übungstage
 * Ein Punkt je Tag, gefüllt heißt geübt. Eine Serie wäre die schlechtere
 * Zahl: ein Krankheitstag setzt sie auf null, und danach sagt sie das
 * Gegenteil dessen, was wahr ist. */
export function uebungstage(antworten: Antwort[], tage: number) {
  const geuebt = new Set(antworten.map((a) => tagesSchluessel(a.ts)));
  const heute = Date.now();
  const punkte: boolean[] = [];
  for (let i = tage - 1; i >= 0; i--) punkte.push(geuebt.has(tagesSchluessel(heute - i * TAG)));
  return { punkte, anzahl: punkte.filter(Boolean).length, von: tage };
}

/* ------------------------------------------------------------------ Sitzungen
 * Aus den Zeitstempeln zusammengesetzt: was weniger als `luecke` auseinander
 * liegt, gehört zur selben Sitzung. Die Dauer ist der Abstand zwischen erster
 * und letzter Antwort — die Zeit vor der ersten Antwort ist nicht messbar,
 * also ist das eher eine Untergrenze. */
export function sitzungen(antworten: Antwort[], luecke = 10 * 60000) {
  const s: { von: number; bis: number; n: number }[] = [];
  for (const a of antworten) {
    const letzte = s[s.length - 1];
    if (letzte && a.ts - letzte.bis <= luecke) { letzte.bis = a.ts; letzte.n++; }
    else s.push({ von: a.ts, bis: a.ts, n: 1 });
  }
  /* Eine einzelne Antwort ist keine Sitzung von null Minuten — wir rechnen
   * ihr die halbe Lücke als Mindestdauer an, sonst zieht sie den Schnitt
   * künstlich nach unten. */
  const minuten = s.map((x) => Math.max(0.5, (x.bis - x.von) / 60000));
  const summe = minuten.reduce((a, b) => a + b, 0);
  return {
    sitzungen: s.map((x, i) => ({ ...x, minuten: minuten[i] })),
    anzahl: s.length,
    schnittMinuten: s.length ? summe / s.length : 0,
    maxMinuten: minuten.length ? Math.max(...minuten) : 0,
  };
}

/* --------------------------------------------------------------- Beste Zeit
 * Sechs Blöcke à vier Stunden. Feiner aufzulösen täuscht Genauigkeit vor,
 * die bei ein paar hundert Antworten nicht da ist. */
export const BLOECKE = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]] as const;

export function stundenprofil(antworten: Antwort[]) {
  const b = BLOECKE.map(([a, e]) => ({ von: a, bis: e, label: `${a}–${e}`, n: 0, richtig: 0 }));
  let außerhalb = 0;
  for (const a of antworten) {
    const h = new Date(a.ts).getHours();
    const treffer = b.find((x) => h >= x.von && h < x.bis);
    if (!treffer) { außerhalb++; continue; }            // 0–6 Uhr: zu selten für einen eigenen Block
    treffer.n++;
    if (a.verdict !== "wrong") treffer.richtig++;
  }
  const mit = b.map((x) => ({ ...x, anteil: x.n ? Math.round(x.richtig / x.n * 100) : 0 }));
  /* Ein Block mit drei Antworten ist kein Befund. Als „beste Zeit" gilt nur,
   * wer genug Antworten UND den höchsten Anteil hat. */
  const belastbar = mit.filter((x) => x.n >= 40).sort((a, b2) => b2.anteil - a.anteil);
  const beste = belastbar[0] || null;
  const zweiter = belastbar[1] || null;
  const schwaechste = belastbar.length ? belastbar[belastbar.length - 1] : null;
  /* Der Abstand muss zum ZWEITBESTEN gelten, nicht zum schwächsten Block.
   * Sonst gewinnt der Vergleich mit einem Ausreisser ganz unten, während die
   * beiden vorderen Blöcke praktisch gleichauf liegen -- und dann kippt die
   * Aussage von einem Zeitraum zum nächsten, ohne dass sich etwas geändert
   * hat. Fünf Prozentpunkte Vorsprung vor dem Nächstbesten sind die
   * Schwelle, ab der „deine beste Lernzeit" mehr ist als eine Laune der
   * Stichprobe. */
  const vorsprung = beste && zweiter ? beste.anteil - zweiter.anteil : 0;
  return { bloecke: mit, beste, schwaechste, außerhalb,
           belastbar: belastbar.length >= 2 && vorsprung >= 5 };
}

/* --------------------------------------------------------------- Neu erlernt
 * Aus den täglichen Schnappschüssen: wie viele Wörter mehr heute auf „sitzt"
 * oder „sitzt fast" stehen als am Anfang des Zeitraums. Ein Zuwachs, kein
 * Bestand — deshalb kann er auch negativ sein. */
/* Wie viele Wörter an einem Stichtag saßen. Nimmt den jüngsten
 * Schnappschuss, der nicht nach dem Stichtag liegt. */
function sitztAn(trends: any, pairs: string[], tag: string) {
  let n = 0, belegt = false;
  for (const p of pairs) {
    const t = trends?.[p]; if (!t) continue;
    const tage = Object.keys(t).sort();
    const d = tage.filter((x) => x <= tag).pop();
    if (!d) continue;
    const c = t[d]?.c || [];
    n += (c[0] || 0) + (c[1] || 0); belegt = true;
  }
  return { n, belegt };
}

/* Der Zuwachs dieses Zeitraums gegen den davor. Nur damit die Jubelzeile
 * etwas Wahres sagen kann -- ohne Vergleich wäre sie eine Behauptung. */
export function zuwachsVergleich(trends: any, pairs: string[], tage: number) {
  const heute = Date.now();
  const t0 = tagesSchluessel(heute - 2 * tage * TAG);
  const t1 = tagesSchluessel(heute - tage * TAG);
  const a = sitztAn(trends, pairs, t0), b = sitztAn(trends, pairs, t1), c = sitztAn(trends, pairs, tagesSchluessel(heute));
  return { jetzt: c.n - b.n, davor: b.n - a.n, belegt: a.belegt && b.belegt && c.belegt };
}

export function neuErlernt(trends: any, pairs: string[], tage: number) {
  const heute = Date.now();
  const startTag = tagesSchluessel(heute - tage * TAG);
  let jetzt = 0, damals = 0, belegt = false;
  for (const p of pairs) {
    const t = trends?.[p];
    if (!t) continue;
    const tageSortiert = Object.keys(t).sort();
    if (!tageSortiert.length) continue;
    const letzter = tageSortiert[tageSortiert.length - 1];
    /* Der jüngste Schnappschuss vor dem Zeitraumsbeginn; gibt es keinen,
     * reicht die Aufzeichnung nicht so weit zurück. */
    const frueher = tageSortiert.filter((d) => d <= startTag).pop();
    const sitzt = (d: string) => { const c = t[d]?.c || []; return (c[0] || 0) + (c[1] || 0); };
    jetzt += sitzt(letzter);
    if (frueher) { damals += sitzt(frueher); belegt = true; }
    else damals += sitzt(tageSortiert[0]);              // so weit reicht die Aufzeichnung
  }
  return { zuwachs: jetzt - damals, belegt };
}

/* --------------------------------------------------- Versuche, bis es sitzt
 * Über die Wörter, die heute sitzen. `seen` zählt alle Antworten des Wortes,
 * auch die nach dem Punkt, an dem es saß — die Zahl ist also eher zu hoch.
 * Wo FSRS `reps` führt, nehmen wir das: es zählt dasselbe, aber sauber. */
export const VERSUCH_KLASSEN = [
  { label: "1–2", min: 1, max: 2 }, { label: "3–4", min: 3, max: 4 },
  { label: "5–6", min: 5, max: 6 }, { label: "7–9", min: 7, max: 9 },
  { label: "10+", min: 10, max: Infinity },
];

export function versucheBisSitzt(zeilen: { w: any; seen: number; stufe: string; prof: any }[], stats: any) {
  const werte: number[] = [];
  for (const z of zeilen) {
    if (z.stufe !== "sitzt" && z.stufe !== "sitzt_fast") continue;
    const reps = stats[z.w.id]?.fsrs?.reps;
    const n = reps || z.seen;
    if (n > 0) werte.push(n);
  }
  werte.sort((a, b) => a - b);
  const median = werte.length ? werte[Math.floor((werte.length - 1) / 2)] : 0;
  const klassen = VERSUCH_KLASSEN.map((k) => ({
    ...k, n: werte.filter((v) => v >= k.min && v <= k.max).length,
    istMedian: median >= k.min && median <= k.max,
  }));
  const max = Math.max(1, ...klassen.map((k) => k.n));
  return { klassen: klassen.map((k) => ({ ...k, breite: Math.round(k.n / max * 100) })), median, n: werte.length };
}

/* ------------------------------------------------------- Haltedauer (Stabilität)
 * Wie viele Tage ein Wort nach der letzten richtigen Antwort noch sitzt. */
export const HALTE_KLASSEN = [
  { label: "< 1 Wo.", max: 7 }, { label: "1–4 Wo.", max: 28 },
  { label: "1–6 Mt.", max: 182 }, { label: "länger", max: Infinity },
];

export function haltedauer(zeilen: { w: any }[], stats: any) {
  const werte: number[] = [];
  for (const z of zeilen) {
    const s = stats[z.w.id]?.fsrs?.stability;
    if (s && s > 0) werte.push(s);
  }
  let untere = 0;
  const klassen = HALTE_KLASSEN.map((k) => {
    const n = werte.filter((v) => v > untere && v <= k.max).length;
    untere = k.max; return { ...k, n };
  });
  const max = Math.max(1, ...klassen.map((k) => k.n));
  const schnitt = werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : 0;
  return { klassen: klassen.map((k) => ({ ...k, hoehe: Math.round(k.n / max * 100) })), schnitt, n: werte.length };
}

/* ------------------------------------------------------ Verteilung je Sprache
 * Dieselbe Leiste wie oben, nur je Sprache eine Zeile. Nur an dieser einen
 * Stelle aufgeschlüsselt — sonst verdoppelt sich die ganze Seite. */
export function verteilungJeSprache(zeilen: { w: any; stufe: string }[]) {
  const je: Record<string, Record<string, number>> = {};
  for (const z of zeilen) {
    const p = z.w.pair || "en-de";
    if (!je[p]) je[p] = { sitzt: 0, sitzt_fast: 0, sitzt_schlecht: 0, neu: 0, noch_nicht_geuebt: 0 };
    je[p][z.stufe]++;
  }
  return Object.keys(je).map((p) => {
    const d = je[p];
    const gesamt = STUFE_ORDER.reduce((a, k) => a + (d[k] || 0), 0);
    return { pair: p, dist: d, gesamt };
  }).sort((a, b) => b.gesamt - a.gesamt);
}

/* --------------------------------------------------------- Tage, bis es sitzt
 * Die zweite Achse neben den Versuchen: nicht wie viel Arbeit ein Wort war,
 * sondern wie viel Geduld. Vier Versuche an vier Tagen sind etwas anderes
 * als vier Versuche über drei Wochen.
 *
 * Rechenbar erst, seit `firstTs` und `sitztSeitTs` am Wort mitlaufen. Aus
 * dem Altbestand ist es nicht zu rekonstruieren -- der Verlauf hält je Wort
 * nur die letzten 30 Antworten, und der Tag des ersten Erfolgs stand
 * nirgends. Solange zu wenige Wörter beides tragen, meldet die Funktion
 * `belegt: false` und die Oberfläche zeigt die Karte nicht. Eine geschätzte
 * Zahl sähe aus wie eine Messung und wäre keine.
 */
export const TAGE_KLASSEN = [
  { label: "1–3 T", max: 3 }, { label: "4–7 T", max: 7 },
  { label: "1–2 Wo.", max: 14 }, { label: "2–4 Wo.", max: 28 },
  { label: "länger", max: Infinity },
];
const MIN_BELEGT = 12;   // unter einem Dutzend Wörtern ist eine Verteilung Zierrat

export function tageBisSitzt(zeilen: { w: any }[], stats: any) {
  const werte: number[] = [];
  for (const z of zeilen) {
    const s = stats[z.w.id];
    if (!s || !s.firstTs || !s.sitztSeitTs) continue;
    const tage = (s.sitztSeitTs - s.firstTs) / TAG;
    if (tage >= 0) werte.push(Math.max(1, tage));
  }
  if (werte.length < MIN_BELEGT) {
    return { belegt: false as const, schnitt: 0, n: werte.length,
             klassen: [] as { label: string; n: number; hoehe: number }[] };
  }
  let untere = 0;
  const klassen = TAGE_KLASSEN.map((k) => {
    const n = werte.filter((v) => v > untere && v <= k.max).length;
    untere = k.max; return { ...k, n };
  });
  const max = Math.max(1, ...klassen.map((k) => k.n));
  return {
    belegt: true as const, n: werte.length,
    schnitt: werte.reduce((a, b) => a + b, 0) / werte.length,
    klassen: klassen.map((k) => ({ ...k, hoehe: Math.round(k.n / max * 100) })),
  };
}
