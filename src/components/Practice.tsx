import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { txt } from "../lib/i18n";
import { Capacitor } from "@capacitor/core";
import { useStore } from "../store/StoreProvider";
import { useToast } from "../ui/Toast";
import { Icon } from "../ui/Icon";
import { toneColor } from "../ui/Ring";
import { scoreAnswer, stripArticle } from "../lib/scoring";
import { LS, load, save } from "../lib/storage";
import { resolveList, resolveSmart, resolveToday } from "../lib/engine";
import { buildQueue, pick, record, outcomeOf, pendingGrades, progress, remaining } from "../lib/runqueue";
import { MasteryBar } from "../ui/MasteryBar";
import { LatinKeys } from "../ui/LatinKeys";
import { retrievabilityOf, isDueCard, retentionFor, initialCard, deriveProfile, STUFE, STUFE_ORDER, deriveRating, gradeFromCard, getCfg } from "../lib/fsrs";
import { PAIRS, NATIVE, practiceable, isLatinPair } from "../lib/pairs";
import { listReadiness, TONE_VAR, toneLegend } from "../lib/readiness";
import { PairPill } from "../ui/PairPill";
import { WahlPille } from "../ui/WahlPille";
import { zeigt, hatSchalter, BEISPIELE, PHONETIK, FORMEN, wortAnzeige } from "../lib/anzeige";
import { SMART_ACCESS, SMART_REFS } from "../lib/smartlists";
import { tapRichtig, tapFalsch } from "../lib/native";
import { latinHeadword, latinReveal, latinAnswerTarget, scoreLatinForm } from "../lib/latin";
import { TipPopup } from "./TipPopup";
import { lernTipps } from "./Help";

/* ===================================================================
 * practice.jsx — the flashcard trainer.
 * =================================================================== */
/* Die vier Antwortarten -- Beschriftung und Symbol an EINER Stelle, damit
 * Waehler und Pille nicht auseinanderlaufen. "Multiple-Choice" heißt so,
 * weil es so heißt; "Auswählen" war meine Erfindung. */
/* Der Merker fuer "nichts gewaehlt". Ein eigener Wert, kein leerer String:
 * so bleibt "noch nie etwas gewaehlt" (undefined) von "bewusst geleert"
 * unterscheidbar. */
export const LEER = "leer:";

const MODE_NAME: Record<string, string> = {
  type: "Eintippen", choice: "Multiple-Choice", recall: "Selbstkontrolle", memorize: "Nur durchblättern",
};
const MODE_ICON: Record<string, string> = {
  /* Das Durchblaettern trug das Karten-Zeichen -- also dasselbe wie "Ueben"
   * im Reiter darunter. Ein Auge sagt, was dort passiert: anschauen. */
  type: "edit", choice: "list", recall: "refresh", memorize: "eye",
};

const toneVarP = (t) => t === "green" ? "var(--green)" : t === "amber" ? "var(--amber)" : t === "red" ? "var(--red)" : t === "blue" ? "var(--blue)" : "var(--ink-faint)";

export function Practice() {
  const store = useStore();
  const toast = useToast();
  const { vocab, stats, settings, recordAttempt, meta } = store;
  const pair = settings.pair;
  const mode = settings.mode;                       // type | choice | recall | memorize

  /* ---- Richtung und Sprache gehoeren an die KARTE ----------------------
   *
   * Frueher galt beides fuer die ganze Runde: eine Sprache, eine Richtung.
   * Damit ließ sich weder gemischt abfragen noch der Uebungsplan ueber
   * Sprachgrenzen hinweg ueben.
   *
   * Jetzt entscheidet jede Karte fuer sich. Die Richtung "gemischt" wird
   * NICHT gewuerfelt, sondern aus Wort-Id und Rundennummer abgeleitet: eine
   * Neuzeichnung darf die Richtung nicht mitten in der Antwort umdrehen.
   * Der Waehler oben zeigt die Einstellung, die Karte immer ihre eigene
   * Richtung -- sonst tippt man in der falschen Sprache und bekommt zu
   * Unrecht Rot. */
  const runIdRef = useRef(0);   // von dirOf gelesen, deshalb hier oben
  const pairOf = (w: any) => PAIRS[(w && w.pair) || pair] || PAIRS["en-de"];
  /* FNV-1a mit Nachmischung. Die naheliegende Kurzfassung (h*31 + Zeichen,
   * dann das unterste Bit) verteilt schlecht: die Ids unterscheiden sich nur
   * in den letzten Zeichen, und das Ergebnis lag bei 38 zu 19 statt haelftig.
   * Die Nachmischung verteilt die oberen Bits nach unten. */
  const dirHash = (id: string, salt: number) => {
    let h = (2166136261 ^ salt) >>> 0;
    for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
    return ((h >>> 0) & 1) === 0;
  };
  const dirOf = (w: any) => settings.direction === "mixed"
    ? (dirHash(String(w?.id || ""), runIdRef.current) ? "f2n" : "n2f")
    : settings.direction;
  const srcKeyOf = (w: any) => dirOf(w) === "f2n" ? pairOf(w).foreign : NATIVE;
  const tgtKeyOf = (w: any) => dirOf(w) === "f2n" ? NATIVE : pairOf(w).foreign;
  const labelOfIn = (key: string, w: any) => (key === NATIVE ? pairOf(w).nativeLabel : pairOf(w).foreignLabel);

  // ---- Latin (L2/L3) text accessors -------------------------------
  const isLatOf = (w: any) => isLatinPair((w && w.pair) || pair);
  const latinMode = settings.latinMode || "L2";
  // text shown for a given side (prompt / reveal). For Latin the foreign
  // side is built from the learning forms, not a plain string.
  const sideText = (w, key) => key === NATIVE ? w.de : (isLatOf(w) ? latinHeadword(w) : w[key]);
  // the string the answer is scored against (Latin: grundform in L2, lernform in L3)
  /* Ist der Artikel freiwillig, gehoert er auch nicht in die Loesung, gegen
   * die verglichen wird -- sonst zeigte die Karte "der Stuhl" mit den ersten
   * vier Zeichen als fehlend an, obwohl "Stuhl" die volle Punktzahl bekam. */
  const roherTarget = (w, key) => key === NATIVE ? w.de : (isLatOf(w) ? latinAnswerTarget(w, latinMode) : w[key]);
  const scoreTarget = (w, key) => settings.articleMode === "optional"
    ? stripArticle(roherTarget(w, key)) : roherTarget(w, key);
  // the string revealed on the back as the solution (Latin: always full lernform)
  const revealText = (w, key) => key === NATIVE ? w.de : (isLatOf(w) ? latinReveal(w) : w[key]);
  // Latin lernform context line (shown under the prompt when Latin is the prompt)
  /* Die Formen -- bei Latein die Stammformen, sonst Singular und Plural oder
   * die unregelmaessigen Formen. Sie gehoeren zum Fremdwort und erscheinen
   * nur dort, wo dieses Wort steht: unter einer deutschen Frage waeren sie
   * ein Wink mit dem Zaunpfahl. */
  const formenVon = (w) => {
    if (!zeigt(settings, FORMEN)) return "";
    const f = String(w?.lernform || "").trim();
    if (!f) return "";
    return (isLatOf(w) && latinHeadword(w) === f) ? "" : f;
  };
  /* Wort und Geschlecht fuer die Anzeige. Steht der Artikel in der Antwort,
   * steht er auch auf der Karte; ist er freiwillig, tritt an seine Stelle
   * die leise Angabe des Geschlechts. Siehe lib/anzeige.ts. */
  const zeigeWort = (w, key, text) => wortAnzeige(text, {
    istMuttersprache: key === NATIVE, genus: w?.genus, de: w?.de, articleMode: settings.articleMode,
  });
  const WortMitGenus = ({ w, k, text }: any) => {
    const a = zeigeWort(w, k, text);
    return <>{a.haupt}{a.zusatz && <span className="wort-genus">, {a.zusatz}</span>}</>;
  };
  const latinL3AnswerFor = (w: any) => isLatOf(w) && tgtKeyOf(w) === pairOf(w).foreign && latinMode === "L3";

  // ---- Umfang: eine gewaehlte Wortliste ODER ein Schnellzugriff -------
  // V14: FSRS-based quick-access chips (one axis each). „Wackeln noch" = stufe
  // 'sitzt_schlecht' (S), replaces the old classifyWord-„Schwierige". Leeches (D)
  // live only in Stats, not here.
  const pairLists = useMemo(() => (store.lists || []).filter((l: any) => l.pair === pair), [store.lists, pair, vocab]);
  // F-NAV-2: multiselect is EPHEMERAL UI state — NOT persisted, NOT synced (FIX C:
  // practiceSel stays a single token; 2+ scopes drive a deduped union at runtime only).
  const [multiSel, setMultiSel] = useState<string[]>([]);
  useEffect(() => { setMultiSel([]); }, [pair]);   // pair switch resets a pair-foreign multiselect
  // V-PLAN: the Übungsplan dispatches a scope to practise (1 token → single+synced; 2+ → ephemeral union).
  useEffect(() => {
    const h = (e: any) => {
      const toks: string[] = e.detail || [];
      if (toks.length === 1) { setMultiSel([]); store.setSettings({ practiceSel: toks[0] }); }
      else if (toks.length > 1) setMultiSel(toks);
    };
    window.addEventListener("vt-practice-scope", h);
    return () => window.removeEventListener("vt-practice-scope", h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const parseSel = (sel) => { const i = (sel || "").indexOf(":"); return i < 0 ? { kind: "", ref: "" } : { kind: sel.slice(0, i), ref: sel.slice(i + 1) }; };
  const rawSel = parseSel(settings.practiceSel);
  const selValid = rawSel.kind === "smart" ? SMART_REFS.includes(rawSel.ref)
    : rawSel.kind === "list" ? pairLists.some((l: any) => l.id === rawSel.ref)
    : false;
  /* Nichts gewaehlt ist ein eigener Zustand, kein Rueckfall auf "Heute
   * dran". Vorher gab es ihn nicht: wer alles abwaehlte, bekam kommentarlos
   * wieder die Tagesliste, und "Übung abbrechen" tat sichtbar nichts. */
  const nichtsGewaehlt = settings.practiceSel === LEER;
  // V17: default learning path = "Heute dran"
  const effective = selValid ? rawSel : { kind: "smart", ref: "heute" };
  const tokValid = (tok: string) => { const i = tok.indexOf(":"); return pairLists.some((l: any) => l.id === tok.slice(i + 1)); };
  const validMulti = multiSel.filter(tokValid);
  const scopeTokens = nichtsGewaehlt ? [] : (validMulti.length ? validMulti : [effective.kind + ":" + effective.ref]);
  const selKey = scopeTokens.join("|");
  /* Die Auswahl ist EINE Menge. Was gewaehlt ist, steht in scopeTokens --
   * egal ob eines oder mehrere. Setzen heißt: diese Menge neu schreiben,
   * einmal fuer die Anzeige (multiSel) und einmal fuer die Dauer
   * (practiceSel, nur bei genau einem). */
  const setzeAuswahl = (toks: string[]) => {
    if (!toks.length) { setMultiSel([]); store.setSettings({ practiceSel: LEER }); return; }
    if (toks.length === 1) { setMultiSel([]); store.setSettings({ practiceSel: toks[0] }); return; }
    setMultiSel(toks);
  };
  const isActiveTok = (tok: string) => scopeTokens.includes(tok);
  /* Smart Lists und Wortlisten schließen einander aus: eine Smart List
   * rechnet die App taeglich neu, eine Wortliste steht fest. Beides
   * gleichzeitig zu meinen ergaebe keinen Umfang, den man beschreiben kann. */
  /* Auch eine Smart List laesst sich wieder abwaehlen. Vorher wurde sie nur
   * gesetzt: einmal angetippt, wurde man sie nur los, indem man zuerst eine
   * eigene Liste waehlte. Eigene Listen schalten seit jeher um, Smart Lists
   * nicht -- dasselbe Antippen mit zwei Bedeutungen. */
  const pickSmart = (ref: string) =>
    setzeAuswahl(isActiveTok("smart:" + ref) ? [] : ["smart:" + ref]);
  const toggleListe = (id: string) => {
    const tok = "list:" + id;
    const bisher = scopeTokens.filter((t) => t.startsWith("list:"));
    setzeAuswahl(bisher.includes(tok) ? bisher.filter((t) => t !== tok) : [...bisher, tok]);
  };
  const wordsForToken = (tok: string): any[] => {
    const i = tok.indexOf(":"); const kind = tok.slice(0, i), ref = tok.slice(i + 1);
    const pv = vocab.filter((w) => w.pair === pair);
    if (kind === "smart") {
      const ret = retentionFor(settings);
      if (ref === "heute") return resolveToday(pv, stats, store.lists, ret, settings.dailyGoal, settings.newPerDay);   // V17
      const opts: any = { retention: ret };
      if (ref === "due") opts.cap = settings.dailyGoal;
      return resolveSmart(ref, pv, stats, settings.masteryCorrect, opts).filter(practiceable);
    }
    /* Eine Wortliste bringt ihre eigene Sprache mit. Nur so kann der
     * Uebungsplan mehrere Listen ueber Sprachgrenzen hinweg zusammen ueben. */
    return vocab.filter((w) => (w.lists || []).includes(ref)).filter(practiceable);
  };
  // live resolution of the chosen scope(s) — deduped union over scopeTokens (one pair).
  const resolveScopeWords = () => {
    const seen = new Set<string>(); const out: any[] = [];
    for (const tok of scopeTokens) for (const w of wordsForToken(tok)) if (!seen.has(w.id)) { seen.add(w.id); out.push(w); }
    return out;
  };

  const [current, setCurrent] = useState(null);

  /* Alles, was "die Karte" betrifft, leitet sich hier einmal ab. Ohne eine
   * Karte gilt das aktive Sprachpaar -- fuer Ueberschriften und den leeren
   * Zustand, die es trotzdem anzeigen muessen. */
  const cardPair = (current && (current as any).pair) || pair;
  const P = PAIRS[cardPair] || PAIRS["en-de"];
  const foreign = P.foreign;
  const isLat = isLatinPair(cardPair);
  const fallbackDir = settings.direction === "n2f" ? "n2f" : "f2n";
  const srcKey = current ? srcKeyOf(current) : (fallbackDir === "f2n" ? foreign : NATIVE);
  const tgtKey = current ? tgtKeyOf(current) : (fallbackDir === "f2n" ? NATIVE : foreign);
  const srcLang = srcKey, tgtLang = tgtKey;
  const labelOf = (key: string) => (key === NATIVE ? P.nativeLabel : P.foreignLabel);
  const latinL3Answer = current ? latinL3AnswerFor(current) : false;
  const [face, setFace] = useState("front");   // front | back (only one in DOM)
  const [anim, setAnim] = useState("");        // '' | out | in
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [choices, setChoices] = useState([]);
  const [picked, setPicked] = useState(null);
  const [session, setSession] = useState([]); // recent verdicts
  const [tip, setTip] = useState(null);        // current study-tip popup (Phase 6)
  const [focus, setFocus] = useState(false);   // V2: zoom / focus card mode
  /* Zwei mal zwei Antworten heißt halb so breite Zellen. Ein langes Wort
   * ("die Geschwindigkeit") passt dann nicht mehr -- statt es abzuschneiden
   * oder die Kaesten unterschiedlich hoch werden zu lassen, verkleinert sich
   * die Schrift so weit wie noetig und nicht weiter. Gemessen wird nach dem
   * Zeichnen, weil vorher niemand weiß, wie breit "Geschwindigkeit" in der
   * gewaehlten Schrift ist. */
  const choicesRef = useRef<HTMLDivElement | null>(null);
  const [enoughAck, setEnoughAck] = useState(false);   // F-CARD-UI: "genug für heute" dismissed
  const [chipsHelp, setChipsHelp] = useState(false);   // FR3-5: smart-chip explainer popup
  /* Der Umfang-Wähler nimmt aufgeklappt gut 140 Pixel -- auf einem Handy ein
   * Drittel des Bildes, auf einem Laptop genau das, was der Handlungszone
   * unten fehlt. Gewählt wird einmal, geübt lange: also zeigt er nach der
   * Wahl nur noch eine Zeile und macht auf Wunsch wieder auf. */
  const [pickerOpen, setPickerOpen] = useState(false);
  const hiddenAtRef = useRef(0);                        // F-CARD-UI: stale-session detection
  const inputRef = useRef(null);
  const recentRef = useRef([]);                // recently shown ids (spacing)
  const answeredRef = useRef(0);               // scored answers this session (tip cadence)

  // ---- run snapshot (V5/V6/V8 + V-ENGINE): freeze the word set when scope/pair
  // changes, then build ONE weighted-pool queue over the frozen ids. Each word is
  // FSRS-graded exactly once per session (at graduation / session-end flush).
  const runWordsRef = useRef([]);
  const runRef = useRef(null);          // V8 RunState
  const gradedRef = useRef(new Set());  // V8 ids already FSRS-graded this run (once-only)
  const baseCardRef = useRef({});       // V8 pre-session FSRS baseline per word (grade from this)
  const growthRef = useRef([]);         // V14 stability jumps this run (ephemeral, for the end-card)
  const shownAtRef = useRef(0);         // V8 when the current card was shown
  const flushRef = useRef(() => {});    // V8 latest session-end flush
  const [doneIds, setDoneIds] = useState(() => new Set()); // V5: mastered ids this run
  const markDone = useCallback((id) => setDoneIds((prev) => prev.has(id) ? prev : new Set(prev).add(id)), []);
  const [runId, setRunId] = useState(0);
  runIdRef.current = runId;

  const beginRun = (ids, forceAll = false) => {
    flushRef.current();                 // grade unfinished words from the previous run first
    runWordsRef.current = ids;
    const retention = retentionFor(settings);
    const now = Date.now();
    const meta2 = {};
    const bases = {};
    for (const id of ids) {
      const st = stats[id];
      const r = retrievabilityOf(st, retention, now);
      const hasCard = !!(st && st.fsrs);
      // V-ENGINE: pool/goal come from the stufe (one source) + due (auffrisch-topf).
      meta2[id] = { stufe: deriveProfile(st?.fsrs, retention, now).stufe, retrievability: r, due: hasCard ? isDueCard(st, now, retention) : true };
      bases[id] = initialCard(st);   // frozen pre-session FSRS baseline (FIX 1)
    }
    baseCardRef.current = bases;
    growthRef.current = [];
    runRef.current = buildQueue(ids, meta2, getCfg(), Math.random, forceAll);
    gradedRef.current = new Set();
    setDoneIds(new Set());
    setEnoughAck(false);
    setRunId((n) => n + 1);
    setCurrent(null); setFace("front"); setAnim(""); setResult(null); setSession([]); setTip(null);
  };
  const startRun = () => beginRun(resolveScopeWords().map((w) => w.id));

  /* Was von dieser Runde noch offen ist -- nur die Kennungen. Daraus laesst
   * sich beim naechsten Start weitermachen, ohne irgendeinen Lernstand ueber
   * den Neustart zu schleppen. */
  const merkeOffene = () => {
    const st = runRef.current;
    if (!st) return;
    const offen = Object.values(st.words).filter((w: any) => !gradedRef.current.has(w.id)).map((w: any) => w.id);
    save(LS.offeneRunde, offen.length ? { pair, sel: selKey, ids: offen, zeit: Date.now() } : null);
  };
  // F-CARD-UI: leave the round any time — no dialog (FSRS is saved after each answer).
  /* Abbrechen heißt: Auswahl leeren. Vorher setzte es auf "Heute dran"
   * zurueck, und wer ohnehin dort war, sah gar nichts geschehen. */
  const leaveRun = () => {
    flushRef.current(); merkeOffene();
    setMultiSel([]); store.setSettings({ practiceSel: LEER });
  };
  // V10: re-drill only the words that were wrong/needed a hint this round.
  const startRoundRetry = () => {
    const st = runRef.current; if (!st) return;
    const failed = Object.values(st.words).filter((w: any) => w.failedOnce || w.usedHint).map((w: any) => w.id);
    if (failed.length) beginRun(failed);
  };
  /* Beim allerersten Zeichnen entscheidet die Einstellung, womit die App
   * aufmacht. Danach nie wieder -- sonst uebersteuerte sie jede Wahl, die
   * man von Hand trifft. */
  const startGetan = useRef(false);
  const weiterGetan = useRef(false);
  useEffect(() => {
    if (startGetan.current) return;
    startGetan.current = true;
    const wie = settings.startAuswahl || "heute";
    if (wie === "heute") { setMultiSel([]); store.setSettings({ practiceSel: "smart:heute" }); }
    else if (wie === "leer") { setMultiSel([]); store.setSettings({ practiceSel: LEER }); }
    // "weiter" und "neu" lassen die letzte Auswahl stehen; "weiter" nimmt
    // zusaetzlich die offenen Woerter auf (siehe unten).
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (nichtsGewaehlt) return;
    /* "Weitermachen": beginnt die Runde mit dem, was letztes Mal offen
     * blieb -- aber nur beim ersten Mal und nur, wenn die Auswahl dieselbe
     * ist. Danach ist der Merker verbraucht. */
    if ((settings.startAuswahl || "heute") === "weiter" && !weiterGetan.current) {
      weiterGetan.current = true;
      const m = load(LS.offeneRunde, null);
      if (m && m.pair === pair && m.sel === selKey && Array.isArray(m.ids) && m.ids.length) {
        const da = new Set(vocab.map((w: any) => w.id));
        const ids = m.ids.filter((id: string) => da.has(id));
        if (ids.length) { beginRun(ids, true); return; }
      }
    }
    startRun();
  }, [pair, selKey, nichtsGewaehlt]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Beim allerersten Start ist der Wortschatz noch leer, wenn die Runde oben
   * zusammengestellt wird: der Grundwortschatz wird eine Umdrehung spaeter
   * geladen. Die Bedingungen dort aendern sich dabei nicht, also blieb die
   * Runde leer -- und die App begruesste jeden neuen Benutzer mit "Hier gibt
   * es nichts zu ueben", bis er neu lud. Dieser Nachzieher greift genau
   * dann: nichts in der Runde, aber inzwischen Woerter da. */
  useEffect(() => {
    if (nichtsGewaehlt || runWordsRef.current.length) return;
    if (!vocab.some((w: any) => practiceable(w))) return;
    startRun();
  }, [vocab.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pool = useMemo(() => {
    // Kein Sprachfilter: der Umfang bestimmt den Vorrat, nicht das aktive Paar.
    const set = new Set(runWordsRef.current);
    return vocab.filter((w) => set.has(w.id) && practiceable(w));
  }, [vocab, runId]);
  const poolById = useMemo(() => { const m = {}; for (const w of pool) m[w.id] = w; return m; }, [pool]);
  // B1: multiple-choice distractors come from the WHOLE pair vocabulary, not the
  // (possibly tiny) run scope — so a 1-word scope still yields full options.
  const distractorPool = useMemo(() => vocab.filter((w) => practiceable(w)), [vocab]);

  // Show a single study tip at a natural pause, every N scored cards.
  const TIP_EVERY = { off: 0, occasional: 12, frequent: 6 };
  const maybeTip = useCallback(() => {
    const every = TIP_EVERY[settings.tipsFrequency || "occasional"] || 0;
    answeredRef.current += 1;
    if (!every || answeredRef.current % every !== 0) { setTip(null); return; } // clear any lingering tip
    let idx = 0;
    try { idx = (parseInt(localStorage.getItem("vt_v1_tipidx") || "-1", 10) + 1) % lernTipps().length; } catch (e) {}
    try { localStorage.setItem("vt_v1_tipidx", String(idx)); } catch (e) {}
    setTip(lernTipps()[idx]);
  }, [settings.tipsFrequency]);

  // Bulletproof flip: render a single face, animate edge-on, swap, animate back.
  const flip = useCallback((toFace, swapFn?) => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { if (swapFn) swapFn(); setFace(toFace); return; }
    setAnim("out");
    setTimeout(() => {
      if (swapFn) swapFn();
      setFace(toFace);
      setAnim("in");
      setTimeout(() => setAnim(""), 260);
    }, 200);
  }, []);

  const pickNext = useCallback(() => {
    const st = runRef.current;
    const id = st ? pick(st, getCfg()) : null;
    const w = id ? poolById[id] : null;
    if (!w) { setCurrent(null); return; }              // run complete (all mastered)
    setCurrent(w);
    shownAtRef.current = Date.now();
    setInput(""); setResult(null); setHintUsed(false); setPicked(null);
    // build multiple-choice options
    const nOpts = Math.max(2, Math.min(6, settings.choicesCount || 4));
    /* Die Ablenker muessen aus dem Vorrat DER SPRACHE DIESER KARTE kommen.
     * Wird gemischtsprachig geuebt, stuenden sonst franzoesische Woerter
     * unter einer lateinischen Frage. */
    const wTgt = tgtKeyOf(w);
    const others = distractorPool.filter((o) => o.id !== w.id && o.pair === w.pair);
    const distractors = [];
    const bag = [...others].sort(() => Math.random() - 0.5);
    for (const o of bag) {
      if (distractors.length >= nOpts - 1) break;
      if (!distractors.some((d) => scoreTarget(d, wTgt) === scoreTarget(o, wTgt)) && scoreTarget(o, wTgt) !== scoreTarget(w, wTgt))
        distractors.push(o);
    }
    setChoices([w, ...distractors].sort(() => Math.random() - 0.5));
    // Only on the web. There a focused field costs nothing; on a phone it
    // throws the keyboard over half the screen the moment a card appears —
    // at launch that lands on top of the welcome dialog. Focus after a
    // deliberate tap (see useHint) stays, since there the user asked for it.
    if (!Capacitor.isNativePlatform()) setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
  }, [poolById, distractorPool, settings.direction, runId, settings.choicesCount]);

  // V8: record the current word's resolution into the runqueue; fire ONE FSRS
  // grade at graduation. Memorize = pure exposition → seen, never graded.
  const resolveWord = useCallback((rawCorrect, usedHint) => {
    const st = runRef.current;
    if (!st || !st.current) return;
    const id = st.current;
    const w = st.words[id];
    if (w) w.mode = mode;
    if (mode === "memorize") {
      if (w) { w.attempts++; w.mastered = true; w.graded = true; }   // seen; no grade
      st.lastId = id; st.current = null;
      markDone(id);
      return;
    }
    const elapsed = Date.now() - (shownAtRef.current || Date.now());
    const { graduated } = record(st, { correct: !!rawCorrect, usedHint: !!usedHint, elapsedMs: elapsed });
    if (graduated) {
      markDone(id);
      if (!gradedRef.current.has(id)) {
        gradedRef.current.add(id);
        st.words[id].graded = true;
        const outcome = outcomeOf(st.words[id]);
        store.gradeWord(id, outcome, mode, baseCardRef.current[id]);
        // V14: collect the stability jump for the bundled end-card nugget (ephemeral).
        const base = baseCardRef.current[id];
        const rating = deriveRating(outcome, mode);
        if (rating !== "no-grade" && base) {
          const after = gradeFromCard(base, rating as number, retentionFor(settings));
          if ((after.stability || 0) > (base.stability || 0) + 0.1) growthRef.current.push({ id, before: base.stability || 0, after: after.stability || 0 });
        }
      }
    }
  }, [mode, markDone, store]);

  // V8: session-end flush — grade started-but-ungraded words once. Fires on
  // unmount, scope/pair change (via startRun), AND mobile backgrounding.
  flushRef.current = () => {
    const st = runRef.current;
    if (!st) return;
    for (const w of pendingGrades(st)) {
      if (gradedRef.current.has(w.id)) continue;
      gradedRef.current.add(w.id); w.graded = true;
      store.gradeWord(w.id, outcomeOf(w), w.mode || mode, baseCardRef.current[w.id]);
    }
  };
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") { flushRef.current(); hiddenAtRef.current = Date.now(); }
      else if (document.visibilityState === "visible" && hiddenAtRef.current) {
        // F-CARD-UI: stale session → rebuild the pool fresh (no dialog, nothing lost;
        // FSRS was already flushed on hide).
        const staleMs = (getCfg().STALE_MIN || 45) * 60000;
        if (Date.now() - hiddenAtRef.current > staleMs) startRun();
        hiddenAtRef.current = 0;
      }
    };
    const onHide = () => { flushRef.current(); merkeOffene(); hiddenAtRef.current = Date.now(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
      flushRef.current(); merkeOffene();   // unmount = session end
    };
  }, []);

  // First card whenever the (frozen) pool appears, or self-heal if `current`
  // became stale (e.g. an async cloud sync swapped vocab under the initial
  // pick). The freeze effect above already did the B1 reset, so Practice never
  // stays blank — on mount or on any pair/scope change.
  useEffect(() => {
    if (anim) return;                           // eine laufende Drehung nie unterbrechen
    if (face === "back" && current) return;     // ein offenes Ergebnis auch nicht
    const st = runRef.current; if (!st) return;
    const stale = current && !poolById[current.id];
    if ((!current || stale) && remaining(st) > 0) pickNext();
  }, [runId, current, poolById, pickNext, face, anim]);

  const finish = useCallback((res, rawCorrect) => {
    if (mode === "memorize") return;   // F-MEMORIZE: browse-only never scores/mutates
    const st = stats[current.id];
    const isNew = !st || !st.seen;
    setResult(res);
    if (res.verdict === "correct") tapRichtig(); else tapFalsch();
    recordAttempt(current.id, res.score, res.verdict, isNew, res.errorType ?? null);  // legacy stats
    resolveWord(rawCorrect, hintUsed);   // V8: runqueue + single FSRS grade at graduation
    setSession((s) => [...s, res.verdict].slice(-12));
    maybeTip();
    flip("back");
  }, [current, recordAttempt, flip, stats, maybeTip, hintUsed, resolveWord, mode]);

  const answerOpts = () => ({ lenientCase: settings.lenientCase, strictAccents: settings.strictAccents, articleMode: settings.articleMode, acceptPartial: settings.acceptPartial, macronsOptional: isLat && !!settings.latinMacronsOptional });

  const check = useCallback(() => {
    if (!current || face === "back" || anim) return;
    if (mode === "type" && !input.trim()) return;
    let res = latinL3Answer
      ? scoreLatinForm(input, current.lernform || "", answerOpts())
      : scoreAnswer(input, scoreTarget(current, tgtKey), answerOpts());
    const rawCorrect = res.verdict === "correct";    // V8: true correctness before hint downgrade
    if (hintUsed && res.verdict === "correct") {
      res = { ...res, verdict: "almost", score: Math.min(res.score, 0.85), note: "Correct — with a hint" };
    }
    finish(res, rawCorrect);
  }, [current, face, anim, input, mode, tgtKey, hintUsed, finish, settings]);

  const choose = useCallback((opt) => {
    if (!current || face === "back" || anim) return;
    setPicked(opt.id);
    const correct = scoreTarget(opt, tgtKey) === scoreTarget(current, tgtKey);
    let res = scoreAnswer(scoreTarget(opt, tgtKey), scoreTarget(current, tgtKey), answerOpts());
    if (!correct) res = { ...res, score: 0, verdict: "wrong" };
    if (hintUsed && res.verdict === "correct")
      res = { ...res, verdict: "almost", score: 0.85, note: "Correct — with a hint" };
    finish(res, correct);
  }, [current, face, anim, tgtKey, hintUsed, finish, settings]);

  const next = useCallback(() => { flip("front", () => pickNext()); }, [pickNext, flip]);

  /* Wer die Richtung oder die Antwortart wechselt, faengt eine Karte neu an.
   * Sonst bliebe eine aufgedeckte Loesung liegen, waehrend unten schon die
   * naechste Antwortart bedient werden will -- und bei "gemischt" stuende
   * die alte Richtung ueber einem Wort, das jetzt anders gefragt wird. */
  const restartCard = useCallback(() => {
    setFace("front"); setAnim(""); setResult(null); setInput("");
    setHintUsed(false); setPicked(null); setCurrent(null);
  }, []);

  // Recall / Memorize: reveal the answer without scoring yet
  const reveal = useCallback(() => {
    if (!current || face === "back" || anim) return;
    if (mode === "memorize") resolveWord(true, false);   // V5/V8: Memorize = seen, no grade
    flip("back");
  }, [current, face, anim, flip, mode, resolveWord]);

  // Recall: self-graded (got it / missed it)
  const grade = useCallback((correct) => {
    if (!current || anim) return;
    const st = stats[current.id];
    const isNew = !st || !st.seen;
    if (correct) tapRichtig(); else tapFalsch();
    recordAttempt(current.id, correct ? 1 : 0, correct ? "correct" : "wrong", isNew);  // legacy
    resolveWord(correct, false);   // V8: runqueue + grade at graduation
    setSession((s) => [...s, correct ? "correct" : "wrong"].slice(-12));
    maybeTip();
    flip("front", () => pickNext());
  }, [current, anim, stats, recordAttempt, flip, pickNext, maybeTip, resolveWord]);

  const useHint = useCallback(() => {
    if (!current || face === "back" || anim) return;
    setHintUsed(true);
    if (mode === "type") {
      const tgt = scoreTarget(current, tgtKey);
      const first = tgt.replace(/^(der|die|das)\s+/i, "")[0] || "";
      const art = (tgt.match(/^(der|die|das)\s+/i) || [""])[0];
      setInput(art + first);
      inputRef.current && inputRef.current.focus();
    } else {
      // remove one wrong choice
      setChoices((cs) => {
        const wrong = cs.find((c) => scoreTarget(c, tgtKey) !== scoreTarget(current, tgtKey));
        return wrong ? cs.filter((c) => c.id !== wrong.id) : cs;
      });
    }
  }, [current, face, anim, mode, tgtKey]);


  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" && e.target !== inputRef.current) return;
      if (anim) return;
      if (face === "back") {
        if (result || mode === "memorize") { if (e.key === "Enter") { e.preventDefault(); next(); } }
        else if (mode === "recall") {
          const k = e.key.toLowerCase();
          if (k === "j" || k === "2") { e.preventDefault(); grade(true); }
          else if (k === "f" || k === "1") { e.preventDefault(); grade(false); }
        }
        return;
      }
      if (mode === "type") {
        if (e.key === "Enter") { e.preventDefault(); check(); }
      } else if (mode === "choice") {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) { e.preventDefault(); choose(choices[n - 1]); }
      } else {
        if (e.key === "Enter") { e.preventDefault(); reveal(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [face, anim, mode, result, choices, check, choose, next, reveal, grade]);

  /* ---- Die Karte muss passen, nicht scrollen ---------------------------
   *
   * Eine Karteikarte, in der man blättern muss, ist keine Karteikarte. Der
   * Inhalt wird deshalb so lange verkleinert, bis er in die Karte passt --
   * in Schritten, nicht stufenlos, damit die Schrift nicht bei jeder Karte
   * eine andere Größe hat. Erst wenn selbst die kleinste Stufe nicht
   * reicht (sehr lange Beispielsätze in einer sehr flachen Karte), darf
   * innen gescrollt werden. Das ist der Ausnahmefall, nicht die Regel. */
  const centerRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const card = el.closest(".flashcard") as HTMLElement | null;
    card?.classList.remove("grow");
    let f = 1;
    el.style.setProperty("--fit", "1");
    for (let i = 0; i < 12 && el.scrollHeight > el.clientHeight + 1; i++) {
      f = Math.max(0.5, +(f - 0.05).toFixed(2));
      el.style.setProperty("--fit", String(f));
      if (f <= 0.5) break;
    }
    /* Reicht auch die kleinste Stufe nicht, gibt das Format nach, nicht der
     * Inhalt: die Karte wird hoeher als 8:5. Ein Balken auf der Karte waere
     * schlimmer als eine Karte, die nicht ganz wie eine Karteikarte aussieht. */
    if (el.scrollHeight > el.clientHeight + 1) card?.classList.add("grow");
    el.classList.toggle("overflows", !card && el.scrollHeight > el.clientHeight + 1);
  }, [current?.id, face, result, focus, settings.cardFont, settings.beispieleModus, settings.beispieleAn]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onEsc = (e: any) => { if (e.key === "Escape") setPickerOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [pickerOpen]);

  /* Schrift der Antwortkaesten an die Laenge anpassen. Erst auf 1 zuruecksetzen,
   * damit ein kurzes Wort nach einem langen wieder groß wird, dann in Schritten
   * verkleinern, solange etwas ueberlaeuft -- hoechstens bis 0.72, darunter
   * waere es nicht mehr angenehm zu lesen. */
  useLayoutEffect(() => {
    const box = choicesRef.current;
    if (!box || mode !== "choice") return;
    const zellen = Array.from(box.querySelectorAll<HTMLElement>(".choice"));
    if (!zellen.length) return;
    box.style.setProperty("--fit", "1");
    let f = 1;
    for (let i = 0; i < 8; i++) {
      const passtNicht = zellen.some((z) => {
        const lab = z.querySelector<HTMLElement>(".lab");
        return lab ? lab.scrollWidth > lab.clientWidth + 1 : false;
      });
      if (!passtNicht) break;
      f = Math.max(0.72, +(f - 0.06).toFixed(2));
      box.style.setProperty("--fit", String(f));
      if (f <= 0.72) break;
    }
  }, [choices, mode, current?.id, settings.cardFont]);

  // V2: leave focus mode on Escape (iOS can't force rotation — we only react).
  useEffect(() => {
    if (!focus) return;
    const onEsc = (e) => { if (e.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [focus]);

  // ---- scope bar (V6): smart quick-access chips + lesson selector ----
  const pairVocabAll = vocab.filter((w) => w.pair === pair);
  const smartCountOf = (ref) => ref === "heute"
    ? resolveToday(pairVocabAll, stats, store.lists, retentionFor(settings), settings.dailyGoal, settings.newPerDay).length
    : resolveSmart(ref, pairVocabAll, stats, settings.masteryCorrect, { retention: retentionFor(settings) }).filter(practiceable).length;
  // FR3-5: kindgerechte Erklärung der vier Schnellzugriffe (als Möglichkeit formuliert).
  const CHIP_HELP = [
    { label: "Heute dran", text: "Deine Tagesportion: fällige Wörter, dazu ein paar neue." },
    { label: "Fällige Wörter", text: "Diese Wörter hast du länger nicht geübt. Frischst du sie jetzt auf, bleiben sie sitzen." },
    { label: "Wackeln noch", text: "Wörter, die du schon geübt hast, die aber noch nicht sicher sitzen." },
    { label: "Bald fällig", text: "Die sitzen noch. Jetzt aufzufrischen kostet wenig und hält sie fest." },
  ];
  const chipsHelpEl = chipsHelp ? (
    <div className="modal-backdrop" onClick={() => setChipsHelp(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="modal-title">{txt("Die vier Smart Lists")}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setChipsHelp(false)}><Icon name="x" size={16} /></button>
        </div>
        <div className="col" style={{ gap: 12 }}>
          {CHIP_HELP.map((c) => (
            <div key={c.label}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{txt(c.label)}</div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{txt(c.text)}</div>
            </div>
          ))}
        </div>
        <div className="modal-foot" style={{ marginTop: 14 }}><button className="btn btn-primary" onClick={() => setChipsHelp(false)}>{txt("Verstanden")}</button></div>
      </div>
    </div>
  ) : null;
  // Nach Zieldatum sortiert (naechstes zuerst), mit Ampelpunkt.
  const listRetention = retentionFor(settings);
  const dotTone = (t) => t === "green" ? "var(--green)" : t === "amber" ? "var(--amber)" : t === "red" ? "var(--red)" : "var(--ink-faint)";
  const listsSorted = [...pairLists].sort((a: any, b: any) => (a.dueDate || Infinity) - (b.dueDate || Infinity) || (a.createdAt || 0) - (b.createdAt || 0));
  // Der Waehler kennt nur noch Wortlisten. Mehrfachwahl, "alle"/"keine" oben.
  const listCountOf = (id: string) => pairVocabAll.filter((w: any) => (w.lists || []).includes(id)).length;
  /* Der Waehler als Blatt statt als aufklappender Bereich.
   *
   * Die anderen beiden Pillen oeffnen ein Menue, das sich ueber die Seite
   * legt und beim Klick daneben wieder schließt. Der Umfang tat etwas
   * anderes: er schob die Seite auseinander und blieb offen. Gleiche Form
   * fuer gleiche Handlung -- also auch hier ein Blatt.
   *
   * Wortlisten stehen oben: sie sind die Wahl, die man selbst getroffen
   * hat. Beide Gruppen sind offen; eine davon zugeklappt und die andere
   * nicht waere wieder ein Unterschied ohne Bedeutung. */
  const listRetentionW = retentionFor(settings);
  const waehlerEl = pickerOpen ? (
    <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
      <div className="modal scope-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{txt("Was möchtest du üben?")}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setPickerOpen(false)}><Icon name="x" size={16} /></button>
        </div>

        <div className="scope-sheet-body">
          {pairLists.length > 0 && (
            <>
              <div className="grp">{txt("Wortlisten")} <span className="hint">— {txt("mehrere möglich")}</span></div>
              <div className="list">
                {listsSorted.map((l: any) => {
                  const { pct, farbe, tone } = listReadiness(l, vocab, stats, listRetentionW, settings);
                  const stand = (toneLegend(settings).find((t) => t.tone === tone) || {}).label || "";
                  const an = isActiveTok("list:" + l.id);
                  const days = l.dueDate ? Math.ceil((l.dueDate - Date.now()) / 86400000) : null;
                  return (
                    /* Gleiche Bauart wie die Smart Lists darunter: die Zahl
                       steht rechts. Der Ampelpunkt wandert in die zweite
                       Zeile und nimmt seine Beschriftung mit -- ein Punkt
                       allein am rechten Rand sagt niemandem, was er meint. */
                    <button key={l.id} className={"li" + (an ? " sel" : "")} onClick={() => toggleListe(l.id)}>
                      <span className="g">{l.name}
                        <div className="m">
                          <span className="stand-punkt" style={{ background: farbe }} />{txt(stand)}
                          {" · " + txt("{p} % sitzen ganz oder fast", { p: pct })}
                          {days != null && " · " + (days < 0 ? txt("überfällig") : days === 0 ? txt("heute") : txt("in {n} Tagen", { n: days }))}
                        </div>
                      </span>
                      <span className="lchip-n">{listCountOf(l.id)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="grp">
            {txt("Smart Lists")} <span className="hint">— {txt("eine davon")}</span>
            <button className="chips-help" title={txt("Was bedeuten diese?")} aria-label={txt("Erklärung")}
              onClick={() => setChipsHelp(true)} style={{ marginLeft: "auto" }}>?</button>
          </div>
          <div className="list">
            {SMART_ACCESS.map((sm) => {
              const n = smartCountOf(sm.ref);
              return (
              /* Ein leerer Topf ist eine Sackgasse: waehlbar, aber danach
                 gibt es nichts zu ueben. Dieselbe Regel wie bei den
                 Schnellzugriffen in der Statistik. */
              <button key={sm.ref} className={"li" + (isActiveTok("smart:" + sm.ref) ? " sel" : "")}
                disabled={!n && !isActiveTok("smart:" + sm.ref)}
                onClick={() => pickSmart(sm.ref)}>
                <Icon name={sm.icon as any} size={14} />
                <span className="g">{txt(sm.label)}<div className="m">{txt(sm.kurz)}</div></span>
                <span className="lchip-n">{n}</span>
              </button>
            ); })}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-primary" onClick={() => setPickerOpen(false)}>{txt("Fertig")}</button>
        </div>
      </div>
    </div>
  ) : null;

  // V-PLAN: the 7-day outlook is gone — replaced by the "Übungsplan" panel (header).
  /* Was gerade geübt wird, in einer Zeile. Mehrere Wortlisten werden gezählt,
   * nicht aufgezählt -- eine Zeile, die umbricht, ist keine Zeile mehr. */
  const scopeSummary = (() => {
    if (nichtsGewaehlt) return txt("Wortliste wählen");
    if (scopeTokens.length > 1) return txt("{n} Wortlisten", { n: scopeTokens.length });
    const tok = scopeTokens[0] || "";
    const i = tok.indexOf(":"); const kind = tok.slice(0, i), ref = tok.slice(i + 1);
    if (kind === "smart") return txt((SMART_ACCESS.find((a) => a.ref === ref) || {}).label || "Schnellzugriff");
    return (pairLists.find((l: any) => l.id === ref) || {}).name || "Übung";
  })();
  /* Die Ruestzeile: was geuebt wird und in welche Richtung -- eine Reihe
   * direkt unter dem Kopf, wie im Entwurf. Vorher war die Richtung ein
   * beschrifteter Waehler weiter unten und der Umfang eine Textzeile; beides
   * gehoert zusammen, weil man beides vor dem Start entscheidet. */
  /* Geschlossen zeigt die Pille nur die Kürzel -- sie steht neben zwei
   * weiteren Elementen in einer Zeile, die auf ein Handy passen muss.
   * Gemischt bekommt den Doppelpfeil: keine Richtung, sondern beide. */
  const kurzF = P.short, kurzN = "DE";
  const richtungKurz = settings.direction === "mixed" ? `${kurzF} ⇄ ${kurzN}`
    : settings.direction === "n2f" ? `${kurzN} → ${kurzF}`
    : `${kurzF} → ${kurzN}`;
  const scopeBar = (
    <div className="lchips-wrap scope-bar">
      <div className="ruest">
        <PairPill />
        {/* Aufgeklappt in Worten, geschlossen als Kürzel: die Wahl braucht
            Klarheit, die Anzeige braucht Platz. */}
        <WahlPille
          titel={txt("Richtung")}
          kurz={<span className="dir-kurz">{richtungKurz}</span>}
          wert={settings.direction}
          optionen={[
            { wert: "f2n", label: `${P.foreignLabel} → ${P.nativeLabel}` },
            { wert: "n2f", label: `${P.nativeLabel} → ${P.foreignLabel}` },
            { wert: "mixed", label: `${txt(P.nativeLabel)} ⇄ ${txt(P.foreignLabel)}`, sub: txt("zufällig gemischt") },
          ]}
          onWahl={(v) => { store.setSettings({ direction: v }); restartCard(); }}
        />
        {/* Ohne Auswahl steht dort kein Name und keine Zahl -- die Pille
            sagte sonst „Übung 30", wo gerade nichts gewählt ist. */}
        <button className="pill pill-on" onClick={() => setPickerOpen((o) => !o)}>
          <Icon name="calendar" size={15} />
          <span>{scopeSummary}</span>
          {!nichtsGewaehlt && <span className="pill-n">{pool.length}</span>}
        </button>
      </div>
      {waehlerEl}{chipsHelpEl}
    </div>
  );

  /* Im Endspurt hebt die App die Tagesgrenze fuer die Pruefungsliste auf.
   * Das ist richtig, aber es erklaert sich nicht von selbst: die Zahl
   * springt ploetzlich von 30 auf 60. Also sagen, warum. */
  const endspurtListe = useMemo(() => {
    const fenster = getCfg().examWindowDays;
    for (const l of (store.lists || [])) {
      if (l.pair !== pair || !l.dueDate) continue;
      const tage = Math.ceil((l.dueDate - Date.now()) / 86400000);
      if (tage < 0 || tage > fenster) continue;
      const n = vocab.filter((w: any) => (w.lists || []).includes(l.id)).length;
      if (n) return { name: l.name, tage, n };
    }
    return null;
  }, [store.lists, pair, vocab]);

  /* Nichts gewaehlt: die Buehne bleibt leer, und es steht da, was zu tun
   * ist. Vorher fiel die App still auf "Heute dran" zurueck. */
  if (nichtsGewaehlt) {
    return (
      <div className="practice-wrap">
        {scopeBar}
        <div className="empty">
          {pairLists.length ? (
            <>
              <div className="big">{txt("Keine Wortliste gewählt")}</div>
              <div>{txt("Wähle oben eine Wortliste oder eine Smart List.")}</div>
            </>
          ) : (
            <>
              <div className="big">{txt("Noch keine eigene Wortliste")}</div>
              <div>{txt("Du kannst sofort üben: Für jede eingeschaltete Sprache liegen hundert Wörter bereit. Eigene Wörter fügst du hier hinzu.")}</div>
              <button className="btn btn-primary" style={{ marginTop: 14 }}
                onClick={() => window.dispatchEvent(new CustomEvent("vt-tab", { detail: "lists" }))}>
                <Icon name="plus" size={15} /> {txt("Wortliste anlegen")}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!pool.length) {
    return (
      <div className="practice-wrap">
        {scopeBar}
        <div className="empty">
          <div className="big">{txt("Hier gibt es nichts zu üben")}</div>
          <div>{txt(pairLists.length ? "Wähle oben eine andere Wortliste oder eine Smart List." : "Du kannst sofort mit dem Grundwortschatz üben. Eigene Wörter legst du unter „Wortlisten“ an.")}</div>
        </div>
      </div>
    );
  }

  if (!current) {
    // B3: three distinct reasons there's no current card.
    const st = runRef.current;
    const remainingN = st ? remaining(st) : 0;
    const total = st ? st.total : 0;
    if (remainingN > 0) {   // transient: first card about to be picked
      return <div className="practice-wrap">{scopeBar}<div className="empty"><div className="big">{txt("Bereit")}</div><div>{txt("Einen Moment …")}</div></div></div>;
    }
    if (total === 0) {     // nothing was due / everything already sits
      return (
        <div className="practice-wrap">
          {scopeBar}
          <div className="empty">
            <div className="big">{txt("Alles sitzt, nichts fällig")}</div>
            <div>{txt("Hier ist gerade nichts fällig. Wähle oben eine andere Wortliste oder komm später wieder.")}</div>
          </div>
        </div>
      );
    }
    // F-MEMORIZE: browse-only has no round/FSRS balance — neutral end-card.
    if (mode === "memorize") {
      return (
        <div className="practice-wrap">
          {scopeBar}
          <div className="empty round-done">
            <div className="big">{txt("Durchgeblättert")}</div>
            <div className="round-tally">{txt("Du hast alle Karten dieser Auswahl angesehen. Angesehen ist noch nicht gelernt. Wechsle zu einer Antwortart, die zählt.")}</div>
            <div className="round-actions">
              <button className="btn btn-primary" onClick={leaveRun}>{txt("Fertig")}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => beginRun(runWordsRef.current, true)}><Icon name="refresh" size={14} /> {txt("Nochmal durchblättern")}</button>
            </div>
          </div>
        </div>
      );
    }
    // V10: round finished → end-card with honest tally + targeted re-drill.
    const ret = retentionFor(settings);
    const sitNow = (st ? Object.keys(st.words) : []).filter((id) => deriveProfile(stats[id]?.fsrs, ret).stufe === "sitzt").length;
    const back = total - sitNow;
    const failedCount = st ? Object.values(st.words).filter((w: any) => w.failedOnce || w.usedHint).length : 0;
    // V14 nugget (bundled): words that gained stability this round (ephemeral).
    const grown = growthRef.current.filter((g: any) => g.after > g.before + 0.1);
    const topGrow = [...grown].sort((a: any, b: any) => (b.after - b.before) - (a.after - a.before)).slice(0, 2);
    const wlbl = (id: string) => { const w = vocab.find((x: any) => x.id === id); return w ? (isLat ? latinHeadword(w) : (w[foreign] || w.de)) : ""; };
    /* Der Abschluss zeigt die Woerter selbst, nicht nur ihre Anzahl. Zwei
     * Gruppen, zwei Zeichen: Daumen hoch fuer das, was sitzt, Flamme fuer
     * das, was noch Arbeit braucht. Eine Zahl allein sagt einem 13-jaehrigen
     * Benutzer nicht, WELCHES Wort noch wackelt. */
    const failedIds = st ? Object.values(st.words).filter((w: any) => w.failedOnce || w.usedHint).map((w: any) => w.id) : [];
    const sitIds = (st ? Object.keys(st.words) : []).filter((id) => deriveProfile(stats[id]?.fsrs, ret).stufe === "sitzt");
    const chips = (ids: string[], tone: string) => (
      <div className="round-chips">
        {ids.slice(0, 12).map((id) => <span key={id} className="round-chip" style={{ borderColor: tone }}>{wlbl(id)}</span>)}
        {ids.length > 12 && <span className="round-chip round-chip-more">{txt("und {n} weitere", { n: ids.length - 12 })}</span>}
      </div>
    );
    return (
      <div className="practice-wrap">
        {scopeBar}
        <div className="empty round-done">
          <div className="big">{txt("Runde geschafft")}</div>

          {sitIds.length > 0 && (
            <div className="round-group">
              <div className="round-group-head" style={{ color: "var(--ok)" }}>
                <Icon name="check" size={17} /> {sitIds.length === 1 ? txt("Richtig") : txt("{n} richtig", { n: sitIds.length })}
              </div>
              {chips(sitIds, "var(--ok)")}
            </div>
          )}

          {failedIds.length > 0 && (
            <div className="round-group">
              <div className="round-group-head" style={{ color: "var(--warn)" }}>
                <Icon name="x" size={17} /> {failedIds.length === 1 ? txt("Falsch") : txt("{n} falsch", { n: failedIds.length })}
              </div>
              {chips(failedIds, "var(--warn)")}
            </div>
          )}

          {back > 0 && (
            <div className="round-tally">{txt(back === 1 ? "{n} Wort kommt später wieder" : "{n} Wörter kommen später wieder", { n: back })}</div>
          )}

          {grown.length > 0 && (
            <div className="round-grow">
              {topGrow.map((g: any, i: number) => { const y = Math.round(g.after), z = Math.round(g.before); return (
                <div key={i} className="faint" style={{ fontSize: 12.5 }}>{wlbl(g.id)} hält jetzt etwa {y} {y === 1 ? "Tag" : "Tage"}{z >= 1 ? ` statt ${z}` : ""}</div>
              ); })}
            </div>
          )}

          <div className="round-actions">
            {failedIds.length > 0 && (
              <button className="btn btn-amber btn-h" onClick={startRoundRetry}>
                <Icon name="flame" size={15} /> {txt("Die {n} nochmal üben", { n: failedIds.length })}
              </button>
            )}
            <button className="btn btn-primary btn-h" onClick={leaveRun}>{txt("Für heute fertig")}</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => beginRun(runWordsRef.current, true)}>
            <Icon name="refresh" size={14} /> {txt("Ganze Übung nochmal")}
          </button>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>{txt("Am besten morgen wieder, dann sitzt es dauerhaft")}</div>
        </div>
      </div>
    );
  }

  /* Beispielsätze gibt es jetzt paarweise: `examples` in der Fremdsprache,
   * `examplesDe` mit den Übersetzungen, gleicher Index. Gezeigt wird immer die
   * Sprache des Worts, das gerade groß auf der Karte steht — sonst stünde eine
   * Übersetzung neben einem Wort, das man erst noch übersetzen soll.
   *
   * Unverändert bleibt: nur auf der LÖSUNGSSEITE. Ein Beispielsatz enthält das
   * Wort und verrät damit die Antwort; das galt für die fremdsprachigen und
   * gilt für die deutschen genauso. */
  const exFgn = (current?.examples || []).map((s: any) => String(s || "").trim());
  const exDe = (current?.examplesDe || []).map((s: any) => String(s || "").trim());
  const examplesIn = (lang: string) => (lang === NATIVE ? exDe : exFgn).filter(Boolean);
  // Pronunciation belongs to the FOREIGN word, so it may only appear where that
  // word itself is shown — otherwise it would hint at the answer.
  /* Bei Latein steht in dieser Spalte die Grundform mit Laengenzeichen. Hat
   * ein Wort keine langen Vokale, ist sie mit dem Wort selbst identisch --
   * dann sagt "[familia]" unter "familia" nichts und faellt weg. */
  const phonRoh = (zeigt(settings, PHONETIK) && current?.phonetic) ? String(current.phonetic).trim() : "";
  const phon = (phonRoh && current && phonRoh === String(sideText(current, isLatOf(current) ? pairOf(current).foreign : "")).trim()) ? "" : phonRoh;
  const phoneticEl = phon ? <div className="card-phonetic">[{phon.replace(/^\[|\]$/g, "")}]</div> : null;
  /* Beide Seiten tragen ihre eigenen Beispielsaetze -- die Fremdseite die
   * fremdsprachigen, die deutsche die Uebersetzungen. So sieht die Karte in
   * beiden Richtungen gleich aus, und der Satz auf der Frageseite verraet
   * nichts: er steht in derselben Sprache wie die Frage. */
  const examplesFor = (key: string) => {
    const list = examplesIn(key);
    if (!zeigt(settings, BEISPIELE) || !list.length) return null;
    return <div className="card-examples">{list.map((x: string, i: number) => <p key={i}>{x}</p>)}</div>;
  };

  /* Das Urteil steht UEBER der Karte, nicht darauf: auf einer Karteikarte
   * steht das Wort, nicht die Bewertung. Und es steht deutlich da -- Farbe
   * UND Zeichen, denn Farbe allein liest niemand, der sie nicht
   * unterscheiden kann. "Nicht ganz" statt "falsch": der Ton gehoert einem
   * 13-jaehrigen Benutzer, nicht einem Pruefungsprotokoll. */
  const verdictMeta: Record<string, { tone: string; label: string; icon: string }> = {
    correct: { tone: "ok", label: "RICHTIG", icon: "check" },
    almost: { tone: "warn", label: "FAST RICHTIG", icon: "check" },
    wrong: { tone: "bad", label: "NICHT GANZ", icon: "x" },   // durch txt() beim Rendern
  };

  /* Zwei getrennte Anzeigen, beide NEBEN der Karte, nicht darauf:
   * (1) Übungsfortschritt dieser Runde, oben.
   * (2) Beherrschungsstand des ganzen Umfangs, unten. */
  const masteryRetention = retentionFor(settings);
  const scopeIds = runWordsRef.current;
  const scopeTotal = scopeIds.length;
  const scopeDist: Record<string, number> = { sitzt: 0, sitzt_fast: 0, sitzt_schlecht: 0, neu: 0, noch_nicht_geuebt: 0 };
  for (const id of scopeIds) { const st = deriveProfile(stats[id]?.fsrs, masteryRetention).stufe; scopeDist[st] = (scopeDist[st] || 0) + 1; }
  const roundProg = runRef.current ? progress(runRef.current) : null;

  /* Wie viele Schichten hinter der Karte liegen. Der Entwurf: eine je
   * verbleibende Karte, grafisch bei vier gekappt -- also hoechstens fuenf
   * Karten im Bild. Bei der letzten Karte liegt nichts mehr dahinter. */
  const schichten = Math.max(0, Math.min(4, (runRef.current ? remaining(runRef.current) : 1) - 1));


  const roundProgressEl = mode === "memorize" ? (
    /* Durchblättern zählt nicht -- dann darf dort auch kein Fortschritt
     * stehen, der etwas anderes behauptet. */
    <div className="round-progress round-progress-off"><Icon name="eye" size={13} /> {txt("Nur durchblättern, zählt für nichts")}</div>
  ) : (roundProg && roundProg.total > 0) ? (
    <div className="round-progress">
      <span className="round-progress-label">{txt("Übungsfortschritt")}</span>
      <span className="round-progress-track"><i style={{ width: roundProg.pct + "%" }} /></span>
      <span className="round-progress-pct">{roundProg.pct} %</span>
    </div>
  ) : null;

  /* Beim Durchblaettern faellt der Farbbalken weg, wie der Fortschritt
   * darueber. Er zeigt den Lernstand des Umfangs -- und der aendert sich
   * beim Durchblaettern nicht. Eine Leiste, die sich nicht bewegt, waehrend
   * man arbeitet, behauptet stillschweigend, es passiere nichts. Der Satz
   * ueber der Karte sagt schon, warum. */
  const masteryBar = (scopeTotal > 0 && mode !== "memorize") ? (
    <div className="mastery-strip"><MasteryBar dist={scopeDist} total={scopeTotal} /></div>
  ) : null;

  // Sprachkennzeichnung: die volle Seite ist die, auf der man gerade steht.
  const srcShort = srcKey === NATIVE ? "DE" : P.short;
  const tgtShort = tgtKey === NATIVE ? "DE" : P.short;
  /* Gefuellt ist die Seite, auf der man GERADE steht: vorne die Frage, hinten
   * die Loesung. Vorher war immer die Fragesprache gefuellt -- dann sagte die
   * Kennzeichnung zwar, in welche Richtung es geht, aber nicht, wo man ist. */
  const dirMark = (aufLoesung: boolean) => (
    <div className="card-dir" aria-label={`${srcShort} → ${tgtShort}`}>
      <span className={"card-dir-chip" + (aufLoesung ? "" : " on")}>{srcShort}</span>
      <span className="card-dir-arrow">→</span>
      <span className={"card-dir-chip" + (aufLoesung ? " on" : "")}>{tgtShort}</span>
    </div>
  );

  const cardIsFlippable = mode === "recall" || mode === "memorize";

  return (
    <div className={"practice-wrap" + (focus ? " focus-on" : "")}
      onClick={focus ? (e) => { if (e.target === e.currentTarget) setFocus(false); } : undefined}>
      {/* Im Vollbild steht der Ausgang außerhalb der Bühne. Er kann dort
          nicht als Teil der Karte gelesen werden -- und `position: fixed`
          hilft nicht: die Bühne setzt `perspective`, und das macht sie zum
          Bezugsrahmen für alles Feste darin. */}
      {focus && (
        <button className="focus-exit" title={txt("Vollbild verlassen (Esc)")} onClick={() => setFocus(false)}>
          <Icon name="x" size={18} />
        </button>
      )}
      {scopeBar}


      {runRef.current && runRef.current.cards >= (getCfg().GENUG_KARTEN || 40) && !enoughAck && (
        <div className="enough-hint">
          <span>{txt("Genug für heute? Du hast schon {n} Karten geübt.", { n: runRef.current.cards })}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setEnoughAck(true)}>{txt("Weiter")}</button>
        </div>
      )}

      {/* Karte: Fortschritt darüber, Beherrschung darunter — beide NEBEN der
          Karte. Auf der Karte steht nur, was auf einer Karteikarte steht. */}
      <div className="practice-stage">
      <div className="card-scene p-card">
        {roundProgressEl}
        {endspurtListe && (
          <div className="endspurt">
            <Icon name="target" size={13} />
            {txt(endspurtListe.tage === 0 ? "„{liste}“ ist heute dran. Alle {n} Wörter sind im Programm, die Tagesgrenze ist ausgesetzt."
              : endspurtListe.tage === 1 ? "„{liste}“ ist morgen dran. Alle {n} Wörter sind im Programm, die Tagesgrenze ist ausgesetzt."
              : "„{liste}“ ist in {t} Tagen dran. Alle {n} Wörter sind im Programm, die Tagesgrenze ist ausgesetzt.",
              { liste: endspurtListe.name, n: endspurtListe.n, t: endspurtListe.tage })}
          </div>
        )}
        {result && (
          <div className="urteil" style={{ ["--u" as any]: TONE_VAR[verdictMeta[result.verdict].tone] }}>
            <Icon name={verdictMeta[result.verdict].icon as any} size={15} />
            {txt(verdictMeta[result.verdict].label)}
          </div>
        )}
        <div className="card-frame">
          {schichten > 0 && (
            <div className="card-stapel" aria-hidden="true">
              {Array.from({ length: schichten }, (_, i) => (
                <span key={i} style={{ ["--i" as any]: schichten - i }} />
              ))}
            </div>
          )}
          {!focus && (
            <button className="card-expand" title={txt("Karte groß zeigen")} onClick={() => setFocus(true)}>
              <Icon name="expand" size={16} />
            </button>
          )}
          <div className={"flashcard" + (anim ? " " + anim : "")}>
            {face === "front" ? (
              <div className="card-face" onClick={cardIsFlippable ? reveal : undefined}
                style={cardIsFlippable ? { cursor: "pointer" } : undefined}>
                <span className="ruled-margin" />
                <div className="card-top">{dirMark(false)}</div>
                <div className="card-center" ref={centerRef}>
                  <div className="prompt-word"><WortMitGenus w={current} k={srcKey} text={sideText(current, srcKey)} /></div>
                  {srcKey !== NATIVE && phoneticEl}
                  {srcKey !== NATIVE && formenVon(current) && (
                    <div className="card-sub">{formenVon(current)}</div>
                  )}
                  {examplesFor(srcKey)}
                </div>
                {/* Der Tipp sitzt als Gluehbirne IN der Karte, unten rechts --
                    ohne das Wort "Tipp". Unter der Karte war er ein Knopf
                    unter vielen; hier gehoert er zur Frage. */}
                {mode !== "memorize" && (
                  <button className={"card-bulb" + (hintUsed ? " used" : "")} title={txt("Tipp")}
                    aria-label={txt("Tipp")} disabled={hintUsed}
                    onClick={(e) => { e.stopPropagation(); useHint(); }}>
                    <Icon name="hint" size={17} />
                  </button>
                )}
              </div>
            ) : (
              <div className="card-face">
                <span className="ruled-margin" />
                <div className="card-top">{dirMark(true)}</div>
                <div className="card-center" ref={centerRef}>
                  {result ? (
                    <>
                      <div className="prompt-word">
                        {result.targetDiff.map((c, i) => <span key={i} className={"ch " + c.status}>{c.ch}</span>)}
                      </div>
                      {tgtKey !== NATIVE && phoneticEl}
                      {tgtKey !== NATIVE && formenVon(current) && (
                        <div className="card-sub">{formenVon(current)}</div>
                      )}
                      {result.verdict !== "correct" && input.trim() && (
                        <div className="card-yours">{txt("Du hast {wort} geschrieben", { wort: input.trim() })}</div>
                      )}
                      {examplesFor(tgtKey)}
                    </>
                  ) : (
                    <>
                      {/* Nur die Loesung. Die Frage stand hier darunter -- damit
                          trug eine Seite beide Sprachen, und die Karte war
                          keine Karteikarte mehr. Wer die Frage nochmal sehen
                          will, dreht zurueck. */}
                      <div className="prompt-word"><WortMitGenus w={current} k={tgtKey} text={revealText(current, tgtKey)} /></div>
                      {tgtKey !== NATIVE && phoneticEl}
                      {tgtKey !== NATIVE && formenVon(current) && (
                        <div className="card-sub">{formenVon(current)}</div>
                      )}
                      {examplesFor(tgtKey)}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Das Urteil unter der Karte: so bleibt die Karte an ihrem Platz,
            wenn es erscheint. Darueber haette es sie beim Antworten nach
            unten geschoben -- genau in dem Moment, in dem man sie liest. */}
        {result && (
          <div className="urteil" style={{ ["--u" as any]: TONE_VAR[verdictMeta[result.verdict].tone] }}>
            <Icon name={verdictMeta[result.verdict].icon as any} size={15} />
            {txt(verdictMeta[result.verdict].label)}
          </div>
        )}
        {masteryBar}
      </div>

      {/* Die Handlungszone folgt dem ZUSTAND DER KARTE, nicht dem Modus.
          Liegt die Lösung offen, fordert unten nichts mehr zum Tippen auf. */}
      <div className="answer-zone p-answer">
        {face === "front" ? (
          mode === "type" ? (
            <>
              {isLat && tgtKey !== NATIVE && <LatinKeys />}
              <div className="answer-row">
                <input ref={inputRef} className="field field-h" placeholder={txt("Auf {sprache} eintippen …", { sprache: labelOf(tgtKey) })}
                  value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off"
                  autoCorrect="off" autoCapitalize="off" spellCheck="false" />
                {/* Im Vollbild nur der Pfeil: dort ist die Karte groß und alles
                    andere soll klein sein. Ausserhalb steht das Wort dabei --
                    wer die App zum ersten Mal oeffnet, soll nicht raten. */}
                <button className={"btn btn-primary btn-h" + (focus ? " btn-rund" : "")}
                  onClick={check} disabled={!input.trim()}
                  aria-label={focus ? txt("Prüfen") : undefined} title={focus ? txt("Prüfen") : undefined}>
                  {!focus && txt("Prüfen")} <Icon name="arrowRight" size={focus ? 18 : 16} />
                </button>
              </div>

            </>
          ) : mode === "choice" ? (
            <>
              <div className="choices" ref={choicesRef}>
                {choices.map((opt, i) => (
                  <button key={opt.id} className="choice" onClick={() => choose(opt)}>
                    <span className="key">{i + 1}</span>
                    <span className="lab">{scoreTarget(opt, tgtKey)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="answer-row">
                <button className="btn btn-primary btn-h grow-btn" onClick={reveal}>
                  {txt(mode === "recall" ? "Lösung zeigen" : "Umdrehen")} <Icon name="arrowRight" size={16} />
                </button>
              </div>
              {/* Beim Durchblättern stand hier ein zweiter Hinweis, während
                  das Band über der Karte schon "Nur durchblättern, zählt für
                  nichts" sagte -- zweimal dieselbe Auskunft auf einem
                  Bildschirm. Der Hinweis zur Selbstkontrolle bleibt: der
                  sagt etwas anderes. */}
              {mode === "recall" && (
                <div className="toolbelt">
                  <span className="faint">{txt("Erst selber überlegen, dann aufdecken")}</span>
                </div>
              )}
            </>
          )
        ) : result ? (
          <>
            <div className="answer-row">
              {/* Nach einer falschen Antwort zurueck auf die Frage schauen
                  duerfen -- ohne neue Bewertung. Steht so im Entwurf. */}
              {result.verdict !== "correct" && (
                <button className="btn btn-h" onClick={() => flip("front")}>{txt("Nochmal zeigen")}</button>
              )}
              <button className="btn btn-amber btn-h grow-btn" onClick={next} autoFocus>
                {txt("Nächste Karte")} <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <div className="toolbelt"><span className="faint">{txt("Mit Enter geht es weiter")}</span></div>
          </>
        ) : mode === "recall" ? (
          <>
            {/* Daumen hoch links, Flamme rechts. Beide in Worten beschriftet --
                ein Symbol allein ist eine Vermutung, kein Satz. */}
            <div className="answer-row">
              <button className="btn btn-h grade-got grow-btn" onClick={() => grade(true)}>
                <Icon name="check" size={17} /> {txt("Richtig")}
              </button>
              <button className="btn btn-h grade-miss grow-btn" onClick={() => grade(false)}>
                <Icon name="x" size={17} /> {txt("Falsch")}
              </button>
            </div>
            <div className="toolbelt"><span className="faint">{txt("Sei ehrlich, davon hängt ab, wann das Wort wiederkommt")}</span></div>
          </>
        ) : (
          <>
            <div className="answer-row">
              <button className="btn btn-amber btn-h grow-btn" onClick={next} autoFocus>
                {txt("Nächste Karte")} <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <div className="toolbelt"><span className="faint">{txt("Nur durchblättern: kein Lernstand, keine Statistik")}</span></div>
          </>
        )}
      </div>

      </div>

      {/* Die Antwortart steht UNTER der Karte: sie ist eine Einstellung zum
          Ueben, keine Frage, die vor der Karte beantwortet werden muss. */}
      <div className="practice-controls p-controls">
        <WahlPille
          titel={txt("Antwortart")}
          icon={MODE_ICON[mode] || "edit"}
          ton={mode === "memorize" ? "quiet" : undefined}
          kurz={txt(MODE_NAME[mode] || "Eintippen")}
          wert={mode}
          optionen={Object.keys(MODE_NAME).map((v) => ({ wert: v, label: txt(MODE_NAME[v]) }))}
          onWahl={(v) => { store.setSettings({ mode: v }); restartCard(); }}
        />
        {/* Die zwei Schalter stehen NEBEN der Antwortart, weil sie dasselbe
            sind: Einstellungen zum Üben, die man mitten in der Übung
            umlegen will. Sie erscheinen nur, wenn die Einstellung sie
            wählbar lässt -- wer die Lautschrift grundsätzlich nicht will,
            soll auch den Schalter nicht sehen. */}
        {hatSchalter(settings, BEISPIELE) && (
          <button className={"pill" + (zeigt(settings, BEISPIELE) ? " pill-an" : "")}
            aria-pressed={zeigt(settings, BEISPIELE)}
            onClick={() => store.setSettings({ beispieleAn: !zeigt(settings, BEISPIELE) })}>
            <Icon name={zeigt(settings, BEISPIELE) ? "check" : "eye"} size={15} />
            <span>{txt("Beispielsätze")}</span>
          </button>
        )}
        {hatSchalter(settings, FORMEN) && (
          <button className={"pill" + (zeigt(settings, FORMEN) ? " pill-an" : "")}
            aria-pressed={zeigt(settings, FORMEN)}
            onClick={() => store.setSettings({ formenAn: !zeigt(settings, FORMEN) })}>
            <Icon name={zeigt(settings, FORMEN) ? "check" : "eye"} size={15} />
            <span>{txt("Formen")}</span>
          </button>
        )}
        {hatSchalter(settings, PHONETIK) && (
          <button className={"pill" + (zeigt(settings, PHONETIK) ? " pill-an" : "")}
            aria-pressed={zeigt(settings, PHONETIK)}
            onClick={() => store.setSettings({ phonetikAn: !zeigt(settings, PHONETIK) })}>
            <Icon name={zeigt(settings, PHONETIK) ? "check" : "eye"} size={15} />
            <span>{txt("Lautschrift")}</span>
          </button>
        )}
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={leaveRun}>{txt("Übung abbrechen")}</button>
      </div>

      <TipPopup tip={tip} onClose={() => setTip(null)} />
    </div>
  );
}
