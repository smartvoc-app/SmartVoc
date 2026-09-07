/* React state layer over the pure lib/* logic: holds the five vt_v1_*
 * documents, persists them to localStorage, and exposes the store API
 * (recordAttempt updates stats + meta exactly as the prototype did). */
import React from "react";
import { LS, load, save } from "../lib/storage";
import { newId } from "../lib/ids";
import { RECOMMENDED } from "../lib/defaults";
import { stempelPlan } from "../lib/plan";
import { stempelAnzeige } from "../lib/anzeige";
import { migrateTopics, lessonsForLists, swissifyVocab, migrateLessonsStatic, planWortlisten, retokenSettings, datiereAltbestand, einListeJeWort, stempelMuttersprache, tauscheGrundwortschatz, entferneWaisenSaat, leerRaeumen } from "../lib/migrate";
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
    vocab = vocab.map((w: Word) => ({ ...w, pair: w.pair || "en-de", lists: Array.isArray(w.lists) ? w.lists : [] }));
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
  const [migriert, setMigriert] = React.useState(false);
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

  // One-time, versioned data migrations (recorded in meta.migrations).
  const migratedRef = React.useRef(false);
  React.useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const done = (meta.migrations || {}) as Record<string, boolean>;
    const applied: Record<string, boolean> = {};
    if (!done.topicsDe) { setVocabState((v: any) => migrateTopics(v)); applied.topicsDe = true; } // V4
    if (!done.swissV3) { setVocabState((v: any) => swissifyVocab(v)); applied.swissV3 = true; } // V3 — ß → ss
    /* V16 — Lektionen werden Wortlisten. Der Plan wird aus den geladenen Daten
     * gerechnet und dann funktional eingespielt, damit er die Migrationen
     * darueber (die ebenfalls am Vokabular arbeiten) nicht ueberschreibt. */
    if (!done.wortlistenV16) {
      /* Die Vorstufen V6 und V9 laufen hier als reine Funktionen mit, statt
       * eigenen Zustand zu schreiben: erst fehlende Listen-Lektionen ergaenzen,
       * dann alle auf feste Mitglieder bringen -- und was dabei herauskommt,
       * wird in Wortlisten aufgeloest. */
      const stored = load(LS.lessons, []);
      const withLists = [...stored, ...lessonsForLists(initRef.current.lists, stored, newId)];
      const les = migrateLessonsStatic(withLists, initRef.current.lists, initRef.current.vocab || [], newId);
      const plan = planWortlisten(les, initRef.current.lists, initRef.current.vocab || []);
      setListsState(plan.lists);
      setVocabState((v: any) => v.map((w: any) => {
        const add = plan.memberships[w.id];
        if (!add) return w;
        return { ...w, lists: Array.from(new Set([...(w.lists || []), ...add])) };
      }));
      setSettings((prev: any) => ({ ...prev, ...retokenSettings(prev, plan.tokenMap) }));
      applied.wortlistenV16 = true;
    }
    // V18 — ein Wort gehört in genau eine Wortliste.
    if (!done.eineListeV18) { setVocabState((v: any) => einListeJeWort(v).vocab); applied.eineListeV18 = true; }
    // V17 — Anlagedatum für Wörter, die noch keines haben.
    if (!done.anlagedatumV17) { setVocabState((v: any) => datiereAltbestand(v)); applied.anlagedatumV17 = true; }
    /* V19 — den Plan stempeln. Muss VOR jeder Grenze existieren, sonst gibt
     * es später niemanden, dessen Besitzstand man wahren könnte: wer schon
     * Wörter auf dem Gerät hat, ist kein neuer Nutzer. */
    if (!done.planV19) {
      setSettings((prev: any) => {
        const stempel = stempelPlan(prev, (initRef.current.vocab || []).length > 0);
        return stempel ? { ...prev, ...stempel } : prev;
      });
      applied.planV19 = true;
    }
    /* V20 — die Muttersprache stempeln. */
    if (!done.mutterspracheV20) {
      setSettings((prev: any) => {
        const stempel = stempelMuttersprache(prev);
        return stempel ? { ...prev, ...stempel } : prev;
      });
      applied.mutterspracheV20 = true;
    }
    /* V21 — die alten mitgelieferten Wortlisten hinauswerfen und die
     * Merker loeschen, damit die neuen beim naechsten Durchlauf geladen
     * werden. Beides gehoert zusammen: nur loeschen hiesse, ohne
     * Grundwortschatz dazustehen. */
    /* V24 — die mitgelieferten Listen austauschen. Drei Schritte, und die
     * Reihenfolge ist der ganze Punkt:
     *   1. alte mitgelieferte Listen samt ihrer Woerter hinaus,
     *   2. die Waisen hinterher -- Woerter aus Listen, die es laengst nicht
     *      mehr gibt und die in keiner Ansicht mehr auftauchen,
     *   3. erst DANN den Merker leeren, damit der neue Grundwortschatz
     *      geladen wird.
     * Ein frueherer Anlauf raeumte in der umgekehrten Folge auf: der neue
     * Grundwortschatz kam, waehrend die Waisen noch dalagen, hielt vierzehn
     * seiner Woerter fuer Doppel und ließ sie weg -- und gleich darauf
     * wurden die Waisen entfernt. Vierzehn Woerter fehlten. */
    if (!done.grundwortschatzV24) {
      const t = tauscheGrundwortschatz(initRef.current.lists || [], initRef.current.vocab || []);
      const w = entferneWaisenSaat(t.vocab, t.lists);
      if (t.listen || w.weg) {
        setListsState(t.lists);
        setVocabState(w.vocab);
        setSettings((prev: any) => ({ ...prev, activatedStarters: [] }));
      }
      applied.grundwortschatzV24 = true;
    }
    /* V25 — aus "Beispielsätze anzeigen: ja/nein" wird ein Modus
     * (immer / nie / beim Ueben waehlbar). Wer sie eingeschaltet hatte,
     * bekommt "immer" -- das ist genau, was er hatte. */
    if (!done.anzeigeV25) {
      setSettings((prev: any) => {
        const stempel = stempelAnzeige(prev);
        return stempel ? { ...prev, ...stempel } : prev;
      });
      applied.anzeigeV25 = true;
    }
    /* V26 — der Schnitt: Woerter, Wortlisten und Lernstaende raus, in jeder
     * Sprache. Steht bewusst NACH allen anderen: was hier weggeht, muss
     * vorher nicht mehr migriert werden, aber die Reihenfolge der
     * Migrationsnummern soll trotzdem stimmen. */
    if (!done.schnittV26) {
      setVocabState([]);
      setListsState([]);
      setStats({});
      setSettings((prev: any) => leerRaeumen(prev).settings);
      try { localStorage.removeItem(LS.offeneRunde); } catch (e) {}
      applied.schnittV26 = true;
    }
    /* V27 — der Grundwortschatz-Austausch noch einmal.
     *
     * V22, V24 und der Schnitt (V26) sollten "Starter Words" und die alten
     * Listen abraeumen. Auf Geraeten, die einen dieser Merker gesetzt
     * hatten, BEVOR die Erkennung stimmte, blieb der Altbestand liegen: ein
     * erledigter Merker wird nie wieder angefasst. Das Ergebnis sah man am
     * Zaehler -- 229 Woerter, aber nur eine Liste mit 57; die uebrigen 172
     * waren Waisen aus geloeschten Listen, und der neue Grundwortschatz kam
     * nie nach, weil `activatedStarters` ihn fuer erledigt hielt.
     *
     * Deshalb dieselben drei Schritte wie in V24, mit eigenem Merker und in
     * derselben Reihenfolge: erst die mitgelieferten Listen, dann die
     * Waisen, erst DANN den Merker leeren. Eigene Listen und eigene Woerter
     * bleiben unberuehrt -- entfernt wird nur, was `herkunft` oder Name als
     * mitgeliefert ausweist, und nur Woerter mit `source: "seed"`. */
    if (!done.grundwortschatzV27) {
      const t = tauscheGrundwortschatz(initRef.current.lists || [], initRef.current.vocab || []);
      const w = entferneWaisenSaat(t.vocab, t.lists);
      if (t.listen || w.weg) {
        setListsState(t.lists);
        setVocabState(w.vocab);
        setSettings((prev: any) => ({ ...prev, activatedStarters: [] }));
      }
      applied.grundwortschatzV27 = true;
    }
    if (Object.keys(applied).length) {
      setMeta((prev: any) => ({ ...prev, migrations: { ...(prev.migrations || {}), ...applied } }));
    }
    setMigriert(true);
  }, []);

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
      const history = [...s.history, { score, verdict, ts: Date.now(), errorType }].slice(-30);
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
    addWord: (w: any) => setVocabState((v: any) => [{ id: newId(), review: false, source: "manual", pair: "en-de", lists: [], createdAt: Date.now(), ...w }, ...v]),
    addWords: (arr: any[]) => setVocabState((v: any) => { const t = Date.now(); return [...arr.map((w) => ({ id: newId(), review: false, source: "import", pair: "en-de", lists: [], createdAt: t, ...w })), ...v]; }),
    updateWord: (id: string, patch: any) => setVocabState((v: any) => v.map((w: any) => (w.id === id ? { ...w, ...patch } : w))),
    deleteWord: (id: string) => setVocabState((v: any) => v.filter((w: any) => w.id !== id)),
    replaceVocab: (list: any[]) => setVocabState(list.map((w) => ({ id: w.id || newId(), review: false, source: "import", pair: "en-de", lists: [], ...w }))),
    resetStats: () => { setStats({}); setMeta({ lastDate: null, streak: 0, todayCount: 0, newToday: 0, totalReviews: 0 }); },
    resetStatsForWords: (ids: string[]) => { setStats((prev: any) => { const next = { ...prev }; ids.forEach((id) => { delete next[id]; }); return next; }); },
    resetSettings: () => setSettings((p: any) => ({ ...p, ...RECOMMENDED })),
    // ---- Wortlisten (V16: der einzige Behaelter fuer Woerter) ----
    addList: (name: string, pair: string, mehr: any = {}) => {
      const l = { id: newId(), name: name || "Neue Wortliste", pair: pair || "en-de",
                  createdAt: Date.now(), updatedAt: Date.now(), herkunft: "selbst", ...mehr };
      setListsState((ls: any) => [...ls, l]);
      return l.id;
    },
    // FR3-6: the per-pair "Wörter ohne Liste" collection (system list). Auto-created,
    // never duplicated. PFLICHT 2: not shareable/exportable-as-list, not deletable.
    addLooseWord: (word: any, p: string) => {
      const pr = p || "en-de";
      let listId = lists.find((l: any) => l.system === "nolist" && l.pair === pr)?.id;
      if (!listId) { listId = newId(); setListsState((ls: any) => [...ls, { id: listId, name: "Wörter ohne Liste", pair: pr, system: "nolist", createdAt: Date.now() }]); }
      const wid = newId();
      setVocabState((v: any) => [{ id: wid, review: false, source: "manual", pair: pr, lists: [listId], ...word }, ...v]);
      return wid;
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
      if (!von || von.system === "nolist" || vonId === nachId) return { verschoben: 0, doppelt: 0 };
      const schluessel = (w: any) => {
        const pr = w.pair || "en-de";
        const f = isLatinPair(pr) ? (w.grundform || "") : (w[fk(pr)] || "");
        return (f + "|" + (w.de || "")).toLowerCase().trim();
      };
      const schonDa = new Set(vocab.filter((w: any) => (w.lists || []).includes(nachId)).map(schluessel));
      const quelle = vocab.filter((w: any) => (w.lists || []).includes(vonId));
      const doppelt = new Set(quelle.filter((w: any) => schonDa.has(schluessel(w))).map((w: any) => w.id));
      setVocabState((v: any) => v
        .filter((w: any) => !doppelt.has(w.id))
        .map((w: any) => ((w.lists || []).includes(vonId) ? { ...w, lists: [nachId] } : w)));
      setListsState((ls: any) => ls.filter((l: any) => l.id !== vonId));
      return { verschoben: quelle.length - doppelt.size, doppelt: doppelt.size };
    },
    deleteList: (id: string) => {
      if (lists.find((l: any) => l.id === id)?.system === "nolist") return;   // PFLICHT 2: nolist not deletable
      setListsState((ls: any) => ls.filter((l: any) => l.id !== id));
      setVocabState((v: any) => v.map((w: any) => ({ ...w, lists: (w.lists || []).filter((x: string) => x !== id) })));
    },
    toggleWordList: (wordId: string, listId: string) => setVocabState((v: any) => v.map((w: any) => w.id === wordId
      ? { ...w, lists: (w.lists || []).includes(listId) ? w.lists.filter((x: string) => x !== listId) : [...(w.lists || []), listId] }
      : w)),
    /* Mitgliedschaft steht am Wort. Ein Wort darf in mehreren Listen liegen --
     * "Lektion 4" und "Unregelmaessige Verben" sind beide wahr. */
    beruehreListe: (id: string) =>
      setListsState((ls: any) => ls.map((l: any) => (l.id === id ? { ...l, updatedAt: Date.now() } : l))),
    addWordsToList: (listId: string, wordIds: string[]) => {
      const set = new Set(wordIds);
      setVocabState((v: any) => v.map((w: any) => (set.has(w.id) && !(w.lists || []).includes(listId)
        ? { ...w, lists: [...(w.lists || []), listId] } : w)));
    },
    removeWordFromList: (listId: string, wordId: string) =>
      setVocabState((v: any) => v.map((w: any) => (w.id === wordId
        ? { ...w, lists: (w.lists || []).filter((x: string) => x !== listId) } : w))),
    newId,
    // sync glue
    applyRemote,
    registerSync,
  };

  return React.createElement(StoreContext.Provider, { value: api }, children);
}
