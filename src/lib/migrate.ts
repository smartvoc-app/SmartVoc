/* One-time, versioned data migrations (run once per user on load).
 * Each migration is recorded in meta.migrations so it never repeats and
 * never loses words. */
import type { Word, ListT } from "./types";

/* V4 — rewrite the old English seed topic labels to German. Counts merge
 * automatically because words simply share the new topic string. */
export const TOPIC_DE: Record<string, string> = {
  Animals: "Tiere",
  Body: "Körper",
  Colours: "Farben",
  Family: "Menschen & Familie",
  Food: "Essen & Trinken",
  Home: "Haus",
  School: "Schule",
  Time: "Zeit",
  Words: "Kleine Wörter",
  Numbers: "Zahlen",
};

export function migrateTopics(vocab: Word[]): Word[] {
  return vocab.map((w) => (w.topic && TOPIC_DE[w.topic]) ? { ...w, topic: TOPIC_DE[w.topic] } : w);
}

/* V6 — give every existing list a dynamic "whole list" lesson so the Practice
 * screen is never empty after the lessons rebuild. Idempotent: skips lists that
 * already have a list-lesson (source.ref === list.id). */
/* V3 — Swiss orthography: rewrite ß → ss in stored German text so existing
 * users (whose vocab was seeded before this change) also see the Swiss spelling.
 * Touches the native German field and the Latin learning-form fields; the
 * foreign EN/FR side is left untouched. Idempotent (no ß left to convert). */
const ssText = (s?: string) => (s && s.indexOf("ß") >= 0) ? s.replace(/ß/g, "ss") : s;
export function swissifyVocab(vocab: Word[]): Word[] {
  return vocab.map((w) => {
    const de = ssText(w.de);
    const grundform = ssText((w as any).grundform);
    const lernform = ssText((w as any).lernform);
    if (de === w.de && grundform === (w as any).grundform && lernform === (w as any).lernform) return w;
    return { ...w, de, ...(grundform !== undefined ? { grundform } : {}), ...(lernform !== undefined ? { lernform } : {}) };
  });
}

export function lessonsForLists(lists: ListT[], existingLessons: any[], newId: () => string) {
  const covered = new Set(existingLessons.filter((l) => l.kind === "dynamic" && l.source?.type === "list").map((l) => l.source.ref));
  const added: any[] = [];
  for (const l of lists) {
    if (covered.has(l.id)) continue;
    added.push({ id: newId(), name: l.name, pair: l.pair, kind: "dynamic", source: { type: "list", ref: l.id } });
  }
  return added;
}

/* V9 — convert ALL lessons to static snapshots (kind/source removed). Runs exactly
 * once. FIX 3: the "list without a lesson → snapshot" fill happens ONLY in this
 * single pass, never as a standing rule, so a deliberately-deleted list-lesson is
 * not recreated on the next load. Empty FR/LA snapshots are skipped (no empties). */
function snap(vocab: Word[], pair: string, src: { type: string; ref: string }): string[] {
  const pv = vocab.filter((w) => w.pair === pair);
  const ws = src.type === "list" ? pv.filter((w) => (w.lists || []).includes(src.ref)) : pv.filter((w) => w.topic === src.ref);
  return Array.from(new Set(ws.map((w) => w.id)));
}
export function migrateLessonsStatic(lessons: any[], lists: ListT[], vocab: Word[], newId: () => string): any[] {
  const now = Date.now();
  const coveredLists = new Set<string>();
  const out = lessons.map((l) => {
    if (l.members && !l.source) return l;                 // already static
    const src = l.source || {};
    let members: string[] = l.members || [];
    let origin = l.origin;
    if (src.type === "list") { members = snap(vocab, l.pair, src); coveredLists.add(src.ref); origin = "Liste"; }
    else if (src.type === "topic") { members = snap(vocab, l.pair, src); origin = "Thema: " + src.ref; }
    const { kind, source, ...rest } = l;
    return { ...rest, members: Array.from(new Set(members)), createdAt: l.createdAt || now, updatedAt: now, origin };
  });
  const added: any[] = [];
  for (const list of lists) {                             // FIX 3: only in this one pass
    if (coveredLists.has(list.id)) continue;
    const members = snap(vocab, list.pair, { type: "list", ref: list.id });
    if (!members.length) continue;                        // no empty lessons (FR/LA)
    added.push({ id: newId(), name: list.name, pair: list.pair, members, createdAt: now, updatedAt: now, origin: "Liste" });
  }
  return [...out, ...added];
}

/* V16 — EIN Begriff: Wortlisten.
 *
 * Bisher gab es zwei Dinge, die dasselbe taten: "Listen" (Mitgliedschaft ueber
 * w.lists, Ziel des Imports) und "Lektionen" (feste Mitgliederliste, dazu
 * Pruefungstermin und Prognose). Fuer den Benutzer war das ein Unterschied ohne
 * Bedeutung — und die Frage "wo lege ich meine Woerter hin?" hatte zwei
 * richtige Antworten.
 *
 * Ab jetzt zaehlt nur die Liste. Jede Lektion wird zu einer Liste, ihre
 * Mitglieder bekommen die Listen-Id in w.lists, der Pruefungstermin wandert
 * mit. Doppel werden ueber Sprachpaar + Name erkannt: V6 hatte zu jeder Liste
 * eine gleichnamige Lektion angelegt, die hier wieder mit ihr verschmilzt —
 * sonst stuende nach der Migration alles zweimal da.
 *
 * Gibt einen Plan zurueck statt fertiger Daten, damit der Aufruf ihn mit
 * funktionalen Updates einspielen kann und nicht mit den Migrationen davor
 * kollidiert. */
const norm = (s: string) => (s || "").trim().toLowerCase();

export function planWortlisten(lessons: any[], lists: ListT[], vocab: Word[]) {
  const now = Date.now();
  const out: any[] = lists.map((l) => ({ ...l }));
  const byName = new Map<string, any>();
  for (const l of out) byName.set(l.pair + " " + norm(l.name), l);

  const memberships: Record<string, string[]> = {};   // wordId -> hinzuzufuegende Listen-Ids
  const tokenMap: Record<string, string> = {};        // alte lesson:<id> -> neue Listen-Id
  const known = new Set(vocab.map((w) => w.id));

  for (const les of lessons || []) {
    const key = les.pair + " " + norm(les.name);
    let target = byName.get(key);
    if (!target) {
      /* Die Id der Lektion wird zur Id der Liste. Das haelt gespeicherte
       * Auswahlen und geteilte Verweise gueltig, wo es nur um die Id geht. */
      target = { id: les.id, name: les.name, pair: les.pair, createdAt: les.createdAt || now };
      out.push(target);
      byName.set(key, target);
    }
    if (les.dueDate && !target.dueDate) target.dueDate = les.dueDate;
    tokenMap[les.id] = target.id;
    for (const wid of les.members || []) {
      if (!known.has(wid)) continue;                  // tote Verweise still uebergehen
      (memberships[wid] ||= []).push(target.id);
    }
  }
  return { lists: out, memberships, tokenMap };
}

/* Gespeicherte Auswahlen zeigen als "lesson:<id>" auf die alte Welt. */
export function retokenSettings(settings: any, tokenMap: Record<string, string>) {
  /* Zwei Schreibweisen, weil sie zwei Dinge bedeuten: practiceSel traegt genau
   * eine Wahl und praefixt sie ("list:" / "smart:"), selectedLists und statLists
   * tragen mehrere und fuehren Listen als bloße Id. */
  const mapped = (id: string) => tokenMap[id] || id;
  const sel = (t: string) => (typeof t === "string" && t.startsWith("lesson:")) ? "list:" + mapped(t.slice(7)) : t;
  const many = (t: string) => (typeof t === "string" && t.startsWith("lesson:")) ? mapped(t.slice(7)) : t;
  return {
    practiceSel: sel(settings.practiceSel || ""),
    selectedLists: (settings.selectedLists || []).map(many),
    statLists: (settings.statLists || []).map(many),
  };
}

/* V17 — ein Anlagedatum für den Altbestand.
 *
 * Wörter trugen bisher keinen Zeitpunkt ihrer Anlage. Ohne ihn kann die
 * Statistik nicht sagen, wie viele Wörter im gewählten Zeitraum dazukamen.
 * Neue Wörter bekommen ihn ab jetzt beim Anlegen; was schon da ist, bekommt
 * einen festen Stichtag. Der ist bewusst ein Datum und keine Schätzung: eine
 * gerechnete Näherung sähe aus wie eine Messung und wäre keine.
 */
export const ALTBESTAND_STICHTAG = Date.parse("2026-08-01T00:00:00Z");

export function datiereAltbestand(vocab: any[]): any[] {
  let geaendert = false;
  const next = vocab.map((w) => {
    if (w.createdAt) return w;
    geaendert = true;
    return { ...w, createdAt: ALTBESTAND_STICHTAG };
  });
  return geaendert ? next : vocab;
}

/* V18 — ein Wort gehört in genau eine Wortliste.
 *
 * Bisher war `lists` ein Feld mit beliebig vielen Einträgen: „Lektion 4"
 * und „Unregelmässige Verben" konnten beide wahr sein. Das klang gut und
 * kostete an jeder Stelle etwas — beim Bearbeiten brauchte es einen Wähler
 * mit Kästchen, beim Zählen musste man aufpassen, ein Wort nicht zweimal zu
 * zählen, und beim Löschen einer Liste war nie klar, ob das Wort mitgeht.
 *
 * Jetzt gilt: genau eine Liste. Wörter, die in mehreren lagen, behalten die
 * ERSTE — das ist die, in die sie hineingelegt wurden, denn das Feld wächst
 * am Ende. Die anderen Zugehörigkeiten fallen weg; die Wörter selbst
 * bleiben unangetastet.
 */
export function einListeJeWort(vocab: any[]): { vocab: any[]; geaendert: number } {
  let geaendert = 0;
  const next = vocab.map((w) => {
    const l = w.lists || [];
    if (l.length <= 1) return w;
    geaendert++;
    return { ...w, lists: [l[0]] };
  });
  return { vocab: geaendert ? next : vocab, geaendert };
}


/* V20 — die Muttersprache stempeln.
 *
 * Heute gibt es nur Deutsch, und genau deshalb wird sie JETZT geschrieben:
 * wer den Stempel hat, behaelt ihn, auch wenn die Vorgabe fuer neue
 * Installationen spaeter eine andere ist. Dieselbe Ueberlegung wie beim
 * Plan -- ein Zustand, den man spaeter nur raten koennte, wird nicht
 * gerechnet, sondern aufgeschrieben.
 */
export function stempelMuttersprache(settings: any, vorgabe = "de"): Partial<any> | null {
  if (settings?.muttersprache) return null;
  return { muttersprache: vorgabe };
}

/* V22 — die mitgelieferten Wortlisten austauschen.
 *
 * Die drei Grundwortschatzlisten stammten aus der Zeit vor den
 * Beispielsaetzen und der Lautschrift und trugen nur Wort und
 * Uebersetzung. Dazu kam "Starter Words": ein englischer Demo-Wortschatz
 * aus dem Prototyp, den der erste Start in jede Installation schrieb.
 * Beides geht.
 *
 * Ohne diesen Schritt bekaeme die neuen Listen nur, wer die App zum ersten
 * Mal oeffnet -- `activatedStarters` merkt sich, dass schon geladen wurde.
 * Der Merker wird deshalb mit geleert.
 *
 * Die Erkennung laeuft NICHT nur ueber `herkunft`: das Feld gibt es erst
 * seit V16, und genau die alten Listen, um die es hier geht, haben es
 * nicht. Deshalb zaehlt auch der Name. Ein erster Anlauf (V21) sah nur auf
 * `herkunft`, fand nichts und hakte sich trotzdem ab -- daher die neue
 * Nummer statt einer Korrektur an Ort und Stelle.
 *
 * Entfernt werden nur diese Listen und die Woerter, die NUR dort liegen und
 * die niemand angefasst hat (`source: "seed"`). Ein selbst angelegtes oder
 * bearbeitetes Wort bleibt; es faellt aus der Liste, aber nicht aus der App.
 */
const MITGELIEFERT = (l: any) =>
  l?.herkunft === "grundwortschatz"
  || /^Grundwortschatz\b/.test(l?.name || "")
  || l?.name === "Starter Words";

export function tauscheGrundwortschatz(lists: any[], vocab: any[]):
  { lists: any[]; vocab: any[]; listen: number; woerter: number } {
  const alte = new Set(lists.filter(MITGELIEFERT).map((l) => l.id));
  if (!alte.size) return { lists, vocab, listen: 0, woerter: 0 };
  const bleibtListe = lists.filter((l) => !alte.has(l.id));
  let weg = 0;
  const bleibtVocab: any[] = [];
  for (const w of vocab) {
    const drin = (w.lists || []).some((id: string) => alte.has(id));
    if (drin && w.source === "seed") { weg++; continue; }
    bleibtVocab.push(drin ? { ...w, lists: (w.lists || []).filter((id: string) => !alte.has(id)) } : w);
  }
  return { lists: bleibtListe, vocab: bleibtVocab, listen: alte.size, woerter: weg };
}

/* V23 — die Waisen des mitgelieferten Wortschatzes.
 *
 * Mitgelieferte Woerter, deren Wortliste es nicht mehr gibt. Sie entstehen
 * auf zwei Wegen: der aelteste Demo-Wortschatz lag in gar keiner Liste, und
 * eine geloeschte Grundwortschatzliste laesst Woerter mit einer Kennung
 * zurueck, die ins Leere zeigt. Beide sind in keiner Liste mehr zu finden,
 * zaehlen aber ueberall mit -- 172 unsichtbare Woerter in "Alle Woerter"
 * sind kein Bestand, sondern ein Zaehlfehler.
 *
 * Nur `source: "seed"`. Ein selbst angelegtes Wort ohne Liste ist eine
 * bewusste Entscheidung und bleibt.
 */
export function entferneWaisenSaat(vocab: any[], lists: any[]): { vocab: any[]; weg: number } {
  const da = new Set((lists || []).map((l: any) => l.id));
  const bleibt = vocab.filter((w) =>
    w.source !== "seed" || (w.lists || []).some((id: string) => da.has(id)));
  return { vocab: bleibt, weg: vocab.length - bleibt.length };
}

/* V26 — der Schnitt vor dem Start.
 *
 * Alle Woerter, alle Wortlisten und alle Lernstaende gehen hinaus, in jeder
 * Sprache. Das ist kein Aufraeumen, sondern ein Schnitt: der mitgelieferte
 * Wortschatz wird ersetzt, und ein halb alter, halb neuer Bestand waere
 * schlimmer als ein leerer. Die App fuellt sich danach ueber den einen Weg
 * neu -- der Grundwortschatz kommt, sobald eine Sprache eingeschaltet ist.
 *
 * Bewusst NICHT betroffen: die Einstellungen. Farbschema, Sprachwahl,
 * Antwortart und Lernintensitaet sind Entscheidungen ueber die App, nicht
 * ueber ihren Inhalt.
 *
 * Diese Migration laeuft genau einmal je Installation und ist danach fuer
 * immer erledigt. Sie stammt aus der Zeit vor der Veroeffentlichung; bei
 * einer frischen Installation gibt es nichts zu loeschen, sie tut also
 * nichts.
 */
export function leerRaeumen(settings: any) {
  return {
    vocab: [] as any[],
    lists: [] as any[],
    stats: {} as Record<string, any>,
    settings: {
      ...settings,
      /* Die Merker der mitgelieferten Listen mit -- sonst kaeme der neue
       * Grundwortschatz nie, weil die App den alten fuer geladen haelt. */
      activatedStarters: [],
      /* Auswahlen zeigen auf Listen, die es nicht mehr gibt. */
      practiceSel: "",
      selectedLists: [],
      statLists: [],
    },
  };
}
