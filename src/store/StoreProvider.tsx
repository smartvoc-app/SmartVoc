/* React state layer over the pure lib/* logic: holds the five vt_v1_*
 * documents, persists them to localStorage, and exposes the store API
 * (recordAttempt updates stats + meta exactly as the prototype did). */
import React from "react";
import { LS, load, save } from "../lib/storage";
import { newId } from "../lib/ids";
import { RECOMMENDED } from "../lib/defaults";
import { stempelPlan } from "../lib/plan";
import { stempelAnzeige } from "../lib/anzeige";
import { deriveRating, gradeFromCard, initialCard, retentionFor, RETENTION, configure, deriveProfile, STUFE_ORDER, S2 } from "../lib/fsrs";
import type { SessionOutcome, SerializedCard } from "../lib/fsrs";
import type { Word, ListT } from "../lib/types";
import { fk, isLatinPair } from "../lib/pairs";

/* Frueher fuellte der erste Start eine Liste "Starter Words" mit einem
 * englischen Demo-Wortschatz. Das stammt aus dem Prototyp und ist seit dem
 * Grundwortschatz doppelt: der kommt von selbst, sobald eine Sprache
 * eingeschaltet ist, traegt Beispielsaetze und Lautschrift und heißt in
 * der Sprache der Oberflaeche. Die App faengt jetzt leer an und fuellt sich
 * ueber diesen einen Weg.
 *
 * DEFAULT_VOCAB bleibt bestehen -- es ist zugleich das mitgelieferte
 * Woerterbuch der Auto-Uebersetzung (siehe lib/translate.ts). */

const todayStr = () => new Date().toDateString();
const yesterdayStr = () => {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString();
};

/* One-time load + migration: guarantees a list exists and every word
 * carries a `lists` array. Legacy words are folded into a default list. */
export function initData() {
  let lists = load(LS.lists, null);
  let vocab = load(LS.vocab, null);
  if (!vocab) vocab = [];
  if (!lists || !lists.length) {
    lists = [];
  } else {
    lists = lists.map((l: ListT) => ({ ...l, pair: l.pair || "en-de" }));
    vocab = vocab.map((w: Word) => ({ ...w, pair: w.pair || "en-de" }));
  }
  return { vocab, lists };
}

export const StoreContext = React.createContext<any>(null);
export const useStore = () => React.useContext(StoreContext);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  /* Sind die Migrationen durch? Der Grundwortschatz darf erst DANACH
   * geladen werden. Vorher lief beides im selben Durchlauf: die Migration
   * setzte den Merker `activatedStarters` zurueck, nachdem die Aktivierung
   * ihn gerade gesetzt hatte. Der Grundwortschatz wurde daraufhin ein
   * zweites Mal geladen, hielt seine eigenen Woerter fuer Doppel, legte
   * folgerichtig keine Liste an -- und die Woerter der ersten Sprache lagen
   * ohne Liste da, sichtbar nur noch in "Alle Woerter". */
  /* Sagt App.tsx, dass der Bestand steht und der Grundwortschatz gesaet
     werden darf. Frueher wurde es nach den Datenumbauten gesetzt; die gibt es
     nicht mehr, also gilt es von Anfang an. */
  const [migriert] = React.useState(true);
  const initRef = React.useRef<any>(null);
  if (!initRef.current) initRef.current = initData();
  const [vocab, setVocabState] = React.useState(initRef.current.vocab);
  const [lists, setListsState] = React.useState(initRef.current.lists);
  const [stats, setStats] = React.useState(() => load(LS.stats, {}));
  const [meta, setMeta] = React.useState(() => load(LS.meta, {
    lastDate: null, streak: 0, todayCount: 0, dailyGoal: 20, totalReviews: 0,
  }));
  const [settings, setSettings] = React.useState(() => {
    // Addendum §2: default direction is German → foreign (n2f).
    const loaded = load(LS.settings, {});
    const s = { direction: "n2f", pair: "en-de", selectedLists: [], statLists: [], statPair: null, practiceSel: "", ...RECOMMENDED, ...loaded };
    if (s.direction === "en2de") s.direction = "f2n";
    if (s.direction === "de2en") s.direction = "n2f";
    if (s.articleMode == null) s.articleMode = s.requireArticle ? "required-full" : "required-partial";
    // V13: targetRetention is the source. Migrate an existing lernIntensity choice
    // into it once (so a user on "intensiv" keeps 0.95, not the default 0.9).
    if (loaded.targetRetention == null && loaded.lernIntensity) s.targetRetention = RETENTION[loaded.lernIntensity] ?? 0.9;
    configure(s);   // F-SETTINGS-ADVANCED: seed FSRS thresholds from settings at startup
    return s;
  });

  // --- sync glue (Phase 3) ----------------------------------------
  // applyRemote() writes a doc from the cloud WITHOUT marking it dirty.
  // registerSync() lets the sync bridge hear local (user-driven) changes.
  const remoteKeys = React.useRef<Set<string>>(new Set());
  const onLocalChange = React.useRef<((key: string) => void) | null>(null);
  const setterFor: Record<string, (v: any) => void> = {
    vocab: setVocabState, lists: setListsState, stats: setStats, meta: setMeta, settings: setSettings,
  };
  const applyRemote = React.useCallback((key: string, data: any) => {
    remoteKeys.current.add(key);
    setterFor[key]?.(data);
  }, []);
  const registerSync = React.useCallback((cb: ((key: string) => void) | null) => { onLocalChange.current = cb; }, []);
  const persist = (key: string, lsKey: string, value: any) => {
    save(lsKey, value);
    if (remoteKeys.current.has(key)) { remoteKeys.current.delete(key); return; }
    onLocalChange.current?.(key);
  };

  React.useEffect(() => persist("vocab", LS.vocab, vocab), [vocab]);
  React.useEffect(() => persist("lists", LS.lists, lists), [lists]);
  React.useEffect(() => persist("stats", LS.stats, stats), [stats]);
  React.useEffect(() => persist("meta", LS.meta, meta), [meta]);
  React.useEffect(() => persist("settings", LS.settings, settings), [settings]);
  React.useEffect(() => { configure(settings); }, [settings]);   // FSRS thresholds follow settings live

  /* Frueher lief hier eine Reihe einmaliger Datenumbauten. Mit dem Wechsel
   * auf das Modell v2 (ein Wort traegt `listId`) haben sie keinen Gegenstand
   * mehr: die alten Bestaende liegen unter den alten Schluesseln und werden
   * nicht mehr gelesen. Ein Umrechnen waere aufwendiger gewesen als ein
   * sauberer Neuanfang -- und der war ausdruecklich gewuenscht. */

  // FR3-2: one daily distribution snapshot per pair (first app contact of the day).
  // PFLICHT 1: merge trends[pair][today] only — NEVER replace the whole trends object
  // (else LWW-sync would wipe the history, not just one day). Cap 180 days per pair.
  const trendRef = React.useRef(false);
  React.useEffect(() => {
    if (trendRef.current) return; trendRef.current = true;
    const today = new Date().toISOString().slice(0, 10);
    const ret = retentionFor(settings);
    const pairs = Array.from(new Set(vocab.map((w: any) => w.pair || "en-de"))) as string[];
    setMeta((prev: any) => {
      const trends = prev.trends || {};
      let changed = false;
      const next: any = { ...trends };
      for (const p of pairs) {
        const existing = next[p] || {};
        if (existing[today]) continue;                       // already snapshotted today
        const c = [0, 0, 0, 0, 0];
        for (const w of vocab) {
          if ((w.pair || "en-de") !== p) continue;
          const idx = STUFE_ORDER.indexOf(deriveProfile(stats[w.id]?.fsrs, ret).stufe);
          if (idx >= 0) c[idx]++;
        }
        const merged: any = { ...existing, [today]: { c } };  // only add today's key
        const keys = Object.keys(merged).sort();
        if (keys.length > 180) for (const d of keys.slice(0, keys.length - 180)) delete merged[d];
        next[p] = merged; changed = true;
      }
      return changed ? { ...prev, trends: next } : prev;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordAttempt = React.useCallback((wordId: string, score: number, verdict: string, isNew: boolean, errorType: any = null) => {
    setStats((prev: any) => {
      const s = prev[wordId] || {
        seen: 0, scoreSum: 0, correctCount: 0, almostCount: 0, wrongCount: 0,
        firstTry: false, ema: 0, streak: 0, history: [],
      };
      const seen = s.seen + 1;
      const firstTry = s.seen === 0 ? score >= 1 : s.firstTry;
      const a = 0.4;
      const ema = s.seen === 0 ? score : s.ema * (1 - a) + score * a;
      const streak = verdict === "correct" ? (s.streak || 0) + 1 : 0;
      /* s.history kann fehlen: der Vorgabewert oben greift nur, wenn der
       * Eintrag GANZ fehlt. Ein halber Eintrag kommt aus einer von Hand
       * bearbeiteten Sicherungsdatei oder von einem Geraet mit aelterem
       * Stand -- und ein Spread ueber undefined beendet die App mit einem
       * weissen Bildschirm, mitten in der Uebung. */
      const bisher = Array.isArray(s.history) ? s.history : [];
      const history = [...bisher, { score, verdict, ts: Date.now(), errorType }].slice(-30);
      const firstTs = s.firstTs || Date.now();   // erstes Mal gesehen
      return {
        ...prev,
        [wordId]: {
          firstTs,
          seen,
          scoreSum: s.scoreSum + score,
          correctCount: s.correctCount + (verdict === "correct" ? 1 : 0),
          almostCount: s.almostCount + (verdict === "almost" ? 1 : 0),
          wrongCount: s.wrongCount + (verdict === "wrong" ? 1 : 0),
          firstTry, ema, streak, history, lastTs: Date.now(),
        },
      };
    });
    setMeta((prev: any) => {
      const today = todayStr();
      let { streak, todayCount, lastDate, newToday } = prev;
      newToday = newToday || 0;
      if (lastDate === today) {
        todayCount += 1;
      } else {
        streak = lastDate === yesterdayStr() ? streak + 1 : 1;
        todayCount = 1;
        newToday = 0;
        lastDate = today;
      }
      if (isNew) newToday += 1;
      return { ...prev, streak, todayCount, lastDate, newToday, totalReviews: prev.totalReviews + 1 };
    });
  }, []);

  // V8 — fire exactly ONE FSRS grade per word per session (at graduation / first
  // resolution). recordAttempt keeps the legacy per-attempt fields; this only
  // touches stat.fsrs. Memorize → deriveRating returns "no-grade" → no-op.
  /* Hier lag ein Antwort-Protokoll: je bewerteter Antwort ein Eintrag mit
   * Wort, Zeitpunkt, Bewertung und dem Kartenzustand davor, gepuffert und
   * nach 1,5 Sekunden lokal gespeichert und zu Supabase synchronisiert. Es
   * war die Vorbereitung fuer eine spaetere Anpassung der Modell-Parameter
   * an den einzelnen Nutzer. Diese Anpassung ist fuer V1 ausgeschlossen --
   * also faellt auch das Sammeln weg. Was man nicht braucht, erhebt man
   * nicht: das erspart der App eine Erklaerung im App Store und dem Nutzer
   * eine Aufzeichnung seines Lernverhaltens, die ihm nichts bringt.
   */
  const gradeWord = React.useCallback((wordId: string, outcome: SessionOutcome, mode: string, baseCard?: SerializedCard) => {
    const rating = deriveRating(outcome, mode);
    if (rating === "no-grade") return;
    let base: any = baseCard;
    setStats((prev: any) => {
      const s = prev[wordId];
      if (!s) return prev;   // recordAttempt runs first, so a legacy stat exists
      // grade from the run-start baseline so exactly one increment happens per
      // session (FIX 1) — not from the live stat already mutated this session.
      base = baseCard || initialCard(s);
      const fsrsCard = gradeFromCard(base, rating as number, retentionFor(settings));
      /* Der Tag, an dem ein Wort zum ersten Mal saß. Wird einmal gesetzt und
       * nie wieder -- faellt das Wort spaeter zurueck, bleibt der erste
       * Erfolg trotzdem der erste Erfolg. */
      const sitztSeitTs = s.sitztSeitTs || (fsrsCard.stability >= S2 ? Date.now() : undefined);
      return { ...prev, [wordId]: { ...s, fsrs: fsrsCard, ...(sitztSeitTs ? { sitztSeitTs } : {}) } };
    });
  }, [settings.targetRetention, settings.lernIntensity]);

  const api = {
    vocab, stats, meta, settings, lists, migriert,
    setVocab: setVocabState,
    setSettings: (patch: any) => setSettings((p: any) => ({ ...p, ...patch })),
    setMeta: (patch: any) => setMeta((p: any) => ({ ...p, ...patch })),
    recordAttempt,
    gradeWord,
    addWord: (w: any) => setVocabState((v: any) => [{ id: newId(), review: false, source: "manual", pair: "en-de", createdAt: Date.now(), ...w }, ...v]),
    addWords: (arr: any[]) => setVocabState((v: any) => { const t = Date.now(); return [...arr.map((w) => ({ id: newId(), review: false, source: "import", pair: "en-de", createdAt: t, ...w })), ...v]; }),
    updateWord: (id: string, patch: any) => setVocabState((v: any) => v.map((w: any) => (w.id === id ? { ...w, ...patch } : w))),
    /* Mit dem Wort geht sein Lernstand. Vorher blieb der Eintrag in `stats`
     * stehen -- fuer immer, denn er wird nur ueber die Wort-Id gefunden, und
     * die gibt es nicht mehr. Sichtbar war das nie; abgeglichen wurde es
     * trotzdem, und mit jedem geloeschten Wort wuchs es. */
    deleteWord: (id: string) => {
      setVocabState((v: any) => v.filter((w: any) => w.id !== id));
      setStats((prev: any) => { if (!(id in prev)) return prev; const next = { ...prev }; delete next[id]; return next; });
    },
    replaceVocab: (list: any[]) => setVocabState(
      list.map((w) => ({ id: w.id || newId(), review: false, source: "import", pair: "en-de", ...w }))),
    resetStats: () => { setStats({}); setMeta({ lastDate: null, streak: 0, todayCount: 0, newToday: 0, totalReviews: 0 }); },
    resetStatsForWords: (ids: string[]) => { setStats((prev: any) => { const next = { ...prev }; ids.forEach((id) => { delete next[id]; }); return next; }); },
    resetSettings: () => setSettings((p: any) => ({ ...p, ...RECOMMENDED })),
    // ---- Wortlisten (V16: der einzige Behaelter fuer Woerter) ----
    addList: (name: string, pair: string, mehr: any = {}) => {
      /* Zwei Listen mit demselben Namen sind hinterher nicht auseinander-
       * zuhalten: man oeffnet die eine und meint die andere, exportiert die
       * eine und glaubt, es sei die andere. Beim Uebernehmen einer geteilten
       * Liste ist der Namensgleichstand der Normalfall, denn sie heisst wie
       * das Original. Deshalb bekommt der Name eine Nummer, sobald er im
       * selben Sprachpaar schon vergeben ist. */
      const pr = pair || "en-de";
      const basis = (name || "Neue Wortliste").trim();
      const belegt = new Set(lists.filter((x: any) => x.pair === pr)
        .map((x: any) => String(x.name || "").trim().toLowerCase()));
      let endgueltig = basis;
      for (let n = 2; belegt.has(endgueltig.toLowerCase()); n++) endgueltig = `${basis} (${n})`;
      const l = { id: newId(), name: endgueltig, pair: pr,
                  createdAt: Date.now(), updatedAt: Date.now(), herkunft: "selbst", ...mehr };
      setListsState((ls: any) => [...ls, l]);
      return l.id;
    },
    renameList: (id: string, name: string) => {
      setListsState((ls: any) => ls.map((l: any) => (l.id === id ? { ...l, name, updatedAt: Date.now() } : l)));
    },
    /* Zieldatum an jeder Wortliste (V16). undefined entfernt es wieder --
     * ein natives Datumsfeld laesst sich auf iOS nicht zuverlaessig leeren. */
    updateList: (id: string, patch: any) =>
      setListsState((ls: any) => ls.map((l: any) => (l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l))),
    /* Zwei Wortlisten zusammenfuehren. Die Woerter der einen wandern in die
     * andere, dann verschwindet die leere Huelle.
     *
     * Ein Wort gehoert seit V18 in genau eine Liste, also kann es beim
     * Zusammenfuehren nicht in beiden stehen -- wohl aber DASSELBE Wort
     * zweimal, einmal je Liste, mit zwei getrennten Lernstaenden. Das waere
     * nach dem Zusammenfuehren eine Liste mit "dog" auf Zeile 3 und "dog"
     * auf Zeile 40. Solche Doppel bleiben deshalb zurueck und werden
     * geloescht; behalten wird der Eintrag der Zielliste, weil der Rest der
     * Liste an ihm haengt. Wie viele es waren, sagt der Rueckgabewert -- die
     * Oberflaeche meldet es, damit es niemandem stillschweigend passiert. */
    mergeLists: (vonId: string, nachId: string) => {
      const von = lists.find((l: any) => l.id === vonId);
      if (!von || vonId === nachId) return { verschoben: 0, doppelt: 0 };
      const schluessel = (w: any) => {
        const pr = w.pair || "en-de";
        const f = isLatinPair(pr) ? (w.grundform || "") : (w[fk(pr)] || "");
        return (f + "|" + (w.de || "")).toLowerCase().trim();
      };
      const schonDa = new Set(vocab.filter((w: any) => w.listId === nachId).map(schluessel));
      const quelle = vocab.filter((w: any) => w.listId === vonId);
      const doppelt = new Set(quelle.filter((w: any) => schonDa.has(schluessel(w))).map((w: any) => w.id));
      setVocabState((v: any) => v
        .filter((w: any) => !doppelt.has(w.id))
        .map((w: any) => (w.listId === vonId ? { ...w, listId: nachId } : w)));
      setListsState((ls: any) => ls.filter((l: any) => l.id !== vonId));
      return { verschoben: quelle.length - doppelt.size, doppelt: doppelt.size };
    },
    deleteList: (id: string) => {
      const weg = lists.find((l: any) => l.id === id);
      if (!weg) return;
      /* Ein Wort gehoert in GENAU EINE Liste (V18, siehe einListeJeWort).
       * Also gehen mit der Liste ihre Woerter -- wer nur die Liste loswerden
       * will, raeumt sie vorher leer.
       *
       * Frueher blieben die Woerter stehen und standen danach in keiner
       * Liste: unsichtbar, nicht zu bearbeiten, nicht zu loeschen, und
       * trotzdem weiter mitgezaehlt und weiter abgefragt. Genau diese
       * Unklarheit ("geht das Wort mit?") war der Grund fuer V18. */
      const mit = vocab.filter((w: any) => w.listId === id);
      setListsState((ls: any) => ls.filter((l: any) => l.id !== id));
      setVocabState((v: any) => v.filter((w: any) => w.listId !== id));
      /* Der Lernstand gehoert zum Wort und hat ohne es keinen Sinn. */
      if (mit.length) setStats((prev: any) => {
        const next = { ...prev };
        for (const w of mit) delete next[w.id];
        return next;
      });
    },
    /* Woerter in eine andere Liste bringen.
     *
     * Ein Wort traegt genau eine Listen-Id, also ist das ein VERSCHIEBEN:
     * die alte wird ersetzt. Rueckgaengig macht man es, indem man
     * zurueckverschiebt -- deshalb braucht es keine Rueckfrage. */
    moveWordsToList: (wordIds: string[], zielId: string) => {
      const set = new Set(wordIds);
      setVocabState((v: any) => v.map((w: any) => (set.has(w.id) ? { ...w, listId: zielId } : w)));
    },
    newId,
    // sync glue
    applyRemote,
    registerSync,
  };

  return React.createElement(StoreContext.Provider, { value: api }, children);
}
