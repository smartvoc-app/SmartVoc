import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { txt, getUiLang } from "../lib/i18n";
import { useStore } from "../store/StoreProvider";
import { useToast } from "../ui/Toast";
import { Icon } from "../ui/Icon";
import { translateWord } from "../lib/translate";
import { deriveProfile, retentionFor } from "../lib/fsrs";
import { examPrognosis } from "../lib/engine";
import { STUFE_BADGE, STUFE_LANG, STUFE_FARBE, STUFE_KURZ, STUFE_ORDER } from "../lib/stufen";
import { readyPercent, readyTone, listReadiness, TONE_VAR } from "../lib/readiness";
import { MasteryBar } from "../ui/MasteryBar";
import { PAIRS, practiceable, isLatinPair } from "../lib/pairs";
import { latinHeadword } from "../lib/latin";
import { isConfigured } from "../lib/supabase";
import { istWeb, teilen } from "../lib/native";
import { spalten, alsText, wortNutzlast, wortZeile as exportZeile, WORTARTEN, GENUS } from "../lib/export";
import { useAuth } from "../sync/auth";
import { publishList } from "../sync/share";
import { ListPicker } from "./ListPicker";
import { ShareModal } from "./ShareModal";
import { ReviewModal } from "./ReviewModal";
import { PasteModal } from "./PasteModal";
import { WordDetailModal } from "./WordDetailModal";
import { LatinKeys } from "../ui/LatinKeys";
import { useImport } from "./importContext";
import { PairPill } from "../ui/PairPill";
import { useAlsUnterkopf } from "../ui/ScreenHead";
import { Bestaetigen } from "../ui/Bestaetigen";
import { FeldEingabe, FeldAuswahl } from "../ui/FeldZeile";
import { LernstandBlock } from "../ui/LernstandBlock";
import { SMART_ACCESS } from "../lib/smartlists";
import { resolveSmart, resolveToday } from "../lib/engine";


/* ===================================================================
 * Bereich "Wortlisten" (V16) — der eine Ort fuer Woerter und Listen.
 *
 * Frueher zwei Bereiche: "Lektionen" (Zieldatum, Beherrschungsstand,
 * Prognose) und "Woerter" (anlegen, suchen, bearbeiten). Beide meinten
 * dieselbe Sache, nur mit verschiedenen Mitteln. Jetzt traegt die Liste
 * beides: oben die Liste als Einheit mit Stand und Termin, darunter ihre
 * Woerter.
 * =================================================================== */
const findKey = (obj, re) => Object.keys(obj).find((k) => re.test(k));

export function WordList() {
  const store = useStore();
  const toast = useToast();
  const auth = useAuth();
  const { openImport } = useImport();
  const { vocab, stats, lists, settings } = store;
  const pair = settings.pair;
  const P = PAIRS[pair] || PAIRS["en-de"];
  const foreign = P.foreign;
  const isLat = isLatinPair(pair);
  // display string for the foreign column (Latin = grundform headword)
  const fgnOf = (w) => isLat ? latinHeadword(w) : (w[foreign] || "");

  /* Zwei Ebenen, wie im Entwurf: `offen === null` ist die Uebersicht,
   * sonst die geoeffnete Liste. Eine Reiterleiste aller Listen gab es hier
   * einmal -- sie vermischte die Wahl der Liste mit der Arbeit an den
   * Woertern, und genau darin verlor man sich. */
  const [offen, setOffen] = useState<{ art: "liste" | "smart" | "alle"; ref: string } | null>(null);
  /* Die Woerter einer Liste sind eine eigene Ebene: der Bildschirm davor
   * zeigt die Liste selbst, dieser hier nur ihre Woerter. */
  const [woerterOffen, setWoerterOffen] = useState(false);
  const [loeschFrage, setLoeschFrage] = useState(false);
  const [listeLoeschen, setListeLoeschen] = useState(false);
  const [wortLoeschen, setWortLoeschen] = useState<string | null>(null);
  /* Woher die Woerter kommen -- dasselbe Blatt an zwei Stellen: beim
   * Anlegen einer Liste und beim Ergaenzen einer bestehenden. */
  const [quellenBlatt, setQuellenBlatt] = useState<"neu" | "dazu" | null>(null);
  const [exportBlatt, setExportBlatt] = useState(false);
  const [mergeWahl, setMergeWahl] = useState(false);
  const [mergeZiel, setMergeZiel] = useState<string | null>(null);
  const [datumOffen, setDatumOffen] = useState(false);
  const activeList = offen?.art === "liste" ? offen.ref : "__all";
  const [listMenu, setListMenu] = useState(false);
  const [neueListe, setNeueListe] = useState(false);
  const [nlName, setNlName] = useState("");
  const [nlDatum, setNlDatum] = useState("");
  const [smartHilfe, setSmartHilfe] = useState(false);
  /* Auswahl in der geoeffneten Liste. Hervorgehoben wird wie ueberall sonst
   * in der App: Tintenrand, keine Farbflaeche. Loeschen und Bearbeiten
   * stehen ausgegraut bereit und werden scharf, sobald etwas gewaehlt ist --
   * Bearbeiten nur bei genau einem, denn zwei Woerter lassen sich nicht in
   * einem Formular aendern. */
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [listenSuche, setListenSuche] = useState("");
  const toggleWort = (id: string) => setGewaehlt((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ fgn: "", de: "", lists: [] as any[], lernform: "", genus: "", wortart: "", ex1: "", ex2: "", ex1de: "", ex2de: "", phon: "" });
  const [adding, setAdding] = useState({ fgn: "", de: "", listId: "", lernform: "", genus: "", wortart: "", ex1: "", ex1de: "", phon: "" });
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [editingListId, setEditingListId] = useState(null);
  const [listName, setListName] = useState("");
  const [shareToken, setShareToken] = useState(null);
  const [shareName, setShareName] = useState("");
  const [reviewRows, setReviewRows] = useState(null);   // P5: shared review screen
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteSeed, setPasteSeed] = useState("");   // V12: scan → paste seeded text
  const [detailWord, setDetailWord] = useState(null);   // V16: word-detail popup
  const canShare = isConfigured && !!auth.user;
  /* Tabellen gibt es nur im Web -- die Bibliothek dahinter waere im
   * App-Paket 429 kB fuer eine Funktion, die das Telefon nicht hat.
   *
   * Eine Anmeldung wird NICHT verlangt. Sie wurde es einmal, und das war
   * falsch: Excel einlesen und die leere Vorlage herunterladen sind seit
   * dem Prototyp die Arbeitsweise am Schreibtisch, und eigene Woerter in
   * die eigene App zu bringen hat mit einem Konto nichts zu tun. Dieselbe
   * Ueberlegung gilt beim Exportieren. */
  const tabellen = istWeb();
  const dateiRef = useRef<any>(null);

  const leseTabelle = useCallback(async (file: any) => {
    if (!file) return;
    setBusy(true);
    try {
      const XLSX = await import("xlsx");            // eigenes Buendelstueck
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const parsed: any[] = [];
      for (const row of rows) {
        /* Zu jedem Beispielsatz gehoert seine Uebersetzung, und die beiden
         * muessen denselben Index bekommen -- sonst steht die deutsche
         * Fassung unter dem falschen Satz. Deshalb werden sie als Paar
         * gelesen und erst zum Schluss in zwei Felder getrennt.
         *
         * "Beispielsatz 1" und "Beispielsatz 1 deutsch" fangen gleich an,
         * also entscheidet ein zweiter Blick, welche der beiden Spalten
         * gemeint ist. */
        const istDeutsch = (k: string) => /deutsch|german|übersetz|uebersetz/i.test(k);
        const spalte = (re: RegExp, deutsch: boolean) =>
          Object.keys(row).find((k) => re.test(k) && istDeutsch(k) === deutsch);
        const RE1 = /beispiel.*1|example.*1|satz.*1/i, RE2 = /beispiel.*2|example.*2|satz.*2/i;
        const ex1K = spalte(RE1, false), ex1deK = spalte(RE1, true);
        const ex2K = spalte(RE2, false), ex2deK = spalte(RE2, true);
        const deK = findKey(row, /germ|deut|^de$/i);
        const phK = findKey(row, /ausspr|phonet|lautschr|pronunc|ipa/i);
        const lfK = findKey(row, /lernform|stammform|formen/i);
        const waK = findKey(row, /wortart|wort.?art|^art$|pos/i);
        const geK = findKey(row, /^genus$|geschlecht|gender/i);
        const phonetic = (phK ? String(row[phK]) : "").trim();
        const lernform = (lfK ? String(row[lfK]) : "").trim();
        const wortart = (waK ? String(row[waK]) : "").trim();
        const genus = (geK ? String(row[geK]) : "").trim();
        const exK = ex1K ? null : spalte(/beispiel|example|satz|phrase/i, false);
        const paare: string[][] = [[ex1K, ex1deK], [ex2K, ex2deK]]
          .filter(([a]) => a)
          .map(([a, b]) => [String(row[a as string] ?? "").trim(), b ? String(row[b] ?? "").trim() : ""]);
        if (!paare.length && exK) {
          for (const z of String(row[exK]).split(/\r?\n/)) { const t = z.trim(); if (t) paare.push([t, ""]); }
        }
        const behalten = paare.filter(([a, b]) => a || b);
        const examples = behalten.map((x) => x[0]);
        const examplesDe = behalten.map((x) => x[1]);

        /* Die erste Spalte traegt das Wort. Ihre Ueberschrift ist der Name
         * der Sprache ("Spanisch", "Latein"), also wird zuerst danach
         * gesucht; sonst nach den bekannten Bezeichnungen, und zuletzt
         * bleibt die erste Spalte uebrig, die noch keine Rolle hat. */
        const belegt = new Set([deK, ex1K, ex1deK, ex2K, ex2deK, exK, phK, lfK, waK, geK].filter(Boolean) as string[]);
        const kopfK = Object.keys(row).find((k) => k.trim().toLowerCase() === P.foreignLabel.toLowerCase())
          || findKey(row, /grundform|fremdsprache|^wort$|eng|fran|fren|espa|itali|portug|latein|^fr$|^en$|^es$|^it$|^pt$|^la$/i)
          || Object.keys(row).find((k) => !belegt.has(k));
        const kopf = (kopfK ? String(row[kopfK]) : "").trim();
        const de = (deK ? String(row[deK]) : "").trim();
        if (isLat) {
          if (kopf || lernform || de) parsed.push({ grundform: kopf, lernform, genus, wortart, de, examples, examplesDe, phonetic });
          continue;
        }
        if (kopf || de) parsed.push({ fgn: kopf, lernform, genus, wortart, de, examples, examplesDe, phonetic });
      }
      setBusy(false);
      if (!parsed.length) { toast(txt("In dieser Datei stehen keine Wörter"), "x"); return; }
      setReviewRows(parsed);          // derselbe Weg wie beim Einfügen: erst ansehen, dann übernehmen
    } catch (e) { setBusy(false); toast(txt("Diese Datei ließ sich nicht lesen"), "x"); }
  }, [toast, isLat]);

  const ladeVorlage = async () => {
    const XLSX = await import("xlsx");
    /* Die Vorlage hatte eigene Spalten: die deutschen Beispielsaetze fehlten
     * ganz, und die Aussprache stand an einer anderen Stelle als im
     * KI-Prompt. Wer beides nacheinander benutzte, bekam zwei Formate.
     * Jetzt kommt die Reihenfolge von einer Stelle. */
    const head = spalten(pair, P.foreignLabel);
    const ws = XLSX.utils.aoa_to_sheet([head, ...exampleRows.map((r: any[]) => r.slice(0, head.length))]);
    ws["!cols"] = head.map((_, i) => ({ wch: i === 0 ? 18 : i === 1 ? 24 : 26 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wortschatz");
    /* Die Sprache gehoert in den Dateinamen. Zwei Vorlagen hiessen beide
     * "smartvoc-vorlage.xlsx", lagen als "…" und "…-2" nebeneinander im
     * Download-Ordner und waren nicht zu unterscheiden. */
    XLSX.writeFile(wb, `smartvoc-vorlage-${dateiname(P.foreignLabel).replace(/^smartvoc-/, "")}.xlsx`);
    toast(txt("Vorlage geladen, ausfüllen und wieder einlesen"), "download");
  };

  const pairLists = useMemo(() => lists.filter((l) => l.pair === pair), [lists, pair]);
  /* Welche Sprachen zugeschaltet sind -- die Suche geht ueber alle. */
  const aktivePaare: string[] = Array.isArray(settings.activePairs) ? settings.activePairs : Object.keys(PAIRS);
  const activeListObj = lists.find((l: any) => l.id === activeList);
  /* Der Stand JEDER Liste -- nicht nur der offenen. Wo kein Platz fuer
   * Balken und Prozent ist, steht der Ampelpunkt; das ist dieselbe Zahl in
   * der knapperen Darstellung. */
  const listenStand = useMemo(() => {
    const ret = retentionFor(settings);
    const m: Record<string, any> = {};
    for (const l of pairLists) m[l.id] = listReadiness(l, vocab, stats, ret, settings);
    return m;
  }, [pairLists, vocab, stats, settings]);

  /* Stand der offenen Liste. Nur rechnen, wenn eine offen ist -- ueber alle
   * Woerter zu mitteln waere eine andere Aussage als "diese Liste sitzt". */
  const activeListStand = useMemo(() => {
    if (activeList === "__all" || !activeListObj) return null;
    const st = listReadiness(activeListObj, vocab, stats, retentionFor(settings), settings);
    return { ...st, pg: examPrognosis(activeListObj, vocab, stats) };
  }, [activeList, activeListObj, vocab, stats, settings]);
  const setListDue = (id: string, val: string) =>
    store.updateList(id, { dueDate: val ? new Date(val + "T08:00:00").getTime() : undefined });
  const practiseList = (id: string) => {
    store.setSettings({ practiceSel: "list:" + id });
    window.dispatchEvent(new CustomEvent("vt-tab", { detail: "practice" }));
  };
  const activeIsNoList = lists.find((l) => l.id === activeList)?.system === "nolist";
  const pairVocab = useMemo(() => vocab.filter((w) => w.pair === pair), [vocab, pair]);

  useEffect(() => { setOffen(null); }, [pair]);
  useEffect(() => { setWoerterOffen(false); setGewaehlt([]); }, [offen]);
  useEffect(() => {
    setAdding((a) => ({ ...a, listId: (activeList !== "__all" ? activeList : (pairLists[0] && pairLists[0].id)) || "" }));
  }, [activeList, pairLists]);
  useEffect(() => { if (offen?.art === "liste" && !lists.some((l) => l.id === offen.ref)) setOffen(null); }, [lists, offen]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return pairVocab.filter((w) =>
      (activeList === "__all" || (w.lists || []).includes(activeList)) &&
      (!q || fgnOf(w).toLowerCase().includes(q) || (w.lernform || "").toLowerCase().includes(q) || (w.de || "").toLowerCase().includes(q)));
  }, [pairVocab, query, activeList, foreign, isLat]);

  /* Mit Termin zuerst und der naechste oben -- was bald dran ist, soll man
   * nicht suchen muessen. Der Rest alphabetisch. */
  const listsSortiert = useMemo(() => [...pairLists].sort((a: any, b: any) => {
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return String(a.name).localeCompare(String(b.name), "de");
  }), [pairLists]);

  const listNameOf = (id) => { const l = lists.find((x) => x.id === id); return l ? l.name : ""; };

  /* ---- add a word (auto-complete the missing side) ---- */
  const addWord = useCallback(async () => {
    const listId = adding.listId;
    const examples = [(adding.ex1 || "").trim()];
    const examplesDe = [(adding.ex1de || "").trim()];
    const phonetic = (adding.phon || "").trim();
    if (isLat) {
      // Latin: no auto-translation; store the learning forms directly.
      const grundform = adding.fgn.trim();
      const lernform = adding.lernform.trim();
      const de = adding.de.trim();
      if (!grundform && !lernform && !de) return;
      store.addWord({ grundform, lernform, genus: adding.genus, wortart: adding.wortart, de, examples, examplesDe, phonetic, pair, lists: listId ? [listId] : [] });
      setAdding((a) => ({ ...a, fgn: "", de: "", lernform: "", ex1: "", ex1de: "", phon: "" }));
      return;
    }
    let fgn = adding.fgn.trim(), de = adding.de.trim();
    if (!fgn && !de) return;
    let review = false;
    if (fgn && !de) {
      setBusy(true);
      const r = await translateWord(fgn, foreign, "de"); de = r.text; review = true;
      toast(r.source === "none" ? "Couldn't translate — please fill it in" : `Auto-filled “${de}” — please review`, r.source === "none" ? "x" : "sparkle");
      setBusy(false);
    } else if (de && !fgn) {
      setBusy(true);
      const r = await translateWord(de, "de", foreign); fgn = r.text; review = true;
      toast(r.source === "none" ? "Couldn't translate — please fill it in" : `Auto-filled “${fgn}” — please review`, r.source === "none" ? "x" : "sparkle");
      setBusy(false);
    }
    store.addWord({ [foreign]: fgn, genus: adding.genus, wortart: adding.wortart, de, examples, examplesDe, phonetic, review, pair, lists: listId ? [listId] : [] });
    setAdding((a) => ({ ...a, fgn: "", de: "", ex1: "", ex1de: "", phon: "" }));
  }, [adding, store, toast, foreign, pair, isLat]);

  /* „Einzelnes Wort eintippen" fuehrte ins Leere: `neuesWortOffen` wurde
   * gesetzt, aber nirgends mehr gezeichnet -- der Eingabeblock war beim
   * Umbau der Wortlisten entfallen. Es braucht ihn auch nicht zweimal: die
   * Maske zum Bearbeiten ist genau die, die hier gefragt ist. Sie oeffnet
   * jetzt auch leer, und dann legt "Speichern" ein Wort an. */
  const NEU = "__neu";
  const startNeu = (listId: string) => {
    setDraft({ fgn: "", de: "", lists: listId && listId !== "__all" ? [listId] : [],
      lernform: "", genus: "", wortart: "", ex1: "", ex2: "", ex1de: "", ex2de: "", phon: "" });
    setEditingId(NEU);
  };
  const startEdit = (w) => { setEditingId(w.id); setDraft({ fgn: isLat ? (w.grundform || "") : (w[foreign] || ""), de: w.de, lists: w.lists || [], lernform: w.lernform || "", genus: w.genus || "", wortart: w.wortart || "", ex1: (w.examples || [])[0] || "", ex2: (w.examples || [])[1] || "", ex1de: (w.examplesDe || [])[0] || "", ex2de: (w.examplesDe || [])[1] || "", phon: w.phonetic || "" }); };
  const saveEdit = (id) => {
    /* Index-treu speichern: examples[i] und examplesDe[i] gehören zusammen.
     * Deshalb hier KEIN filter(Boolean) — sonst rutscht die zweite Übersetzung
     * unter den ersten Satz, sobald einer davon leer bleibt. */
    const examples = [draft.ex1, draft.ex2].map((s) => (s || "").trim());
    const examplesDe = [draft.ex1de, draft.ex2de].map((s) => (s || "").trim());
    const phonetic = (draft.phon || "").trim();
    const patch = isLat
      ? { grundform: draft.fgn.trim(), lernform: draft.lernform.trim(), genus: draft.genus, wortart: draft.wortart, de: draft.de.trim(), examples, examplesDe, phonetic, lists: draft.lists, review: false }
      : { [foreign]: draft.fgn.trim(), lernform: draft.lernform.trim(), genus: draft.genus, wortart: draft.wortart, de: draft.de.trim(), examples, examplesDe, phonetic, lists: draft.lists, review: false };
    if (id === NEU) {
      if (!draft.fgn.trim() && !draft.de.trim() && !draft.lernform.trim()) { setEditingId(null); return; }
      store.addWord({ ...patch, pair, source: "manual", createdAt: Date.now() });
      toast(txt("Wort hinzugefügt"), "check");
    } else store.updateWord(id, patch);
    setEditingId(null);
  };
  const toggleDraftList = (lid) => setDraft((d) => ({ ...d, lists: d.lists.includes(lid) ? d.lists.filter((x) => x !== lid) : [...d.lists, lid] }));

  /* ---- list management ---- */
  /* Anlegen laeuft ueber das Blatt "Neue Liste": Name und Zieldatum werden
   * dort gesetzt, bevor die Liste entsteht. Vorher bekam sie einen
   * Platzhalternamen und man benannte sie hinterher um. */
  const legeListeAn = (name: string, dueDate?: number) => {
    const id = store.addList(name.trim() || txt("Neue Wortliste"), pair,
      { autor: auth.username || auth.email || undefined });
    if (dueDate) store.updateList(id, { dueDate });
    setOffen({ art: "liste", ref: id });
    return id;
  };
  const LOCALE = () => (getUiLang() === "en" ? "en-GB" : "de-CH");
  /* Ein Datum, wie man es sagt: „heute", „gestern", sonst ausgeschrieben. */
  const datumLang = (t?: number) => {
    if (!t) return txt("unbekannt");
    const tage = Math.floor((Date.now() - t) / 86400000);
    if (tage <= 0) return txt("heute");
    if (tage === 1) return txt("gestern");
    return new Date(t).toLocaleDateString(LOCALE(), { day: "numeric", month: "long", year: "numeric" });
  };
  const commitRename = () => { if (editingListId) store.renameList(editingListId, listName.trim() || "Untitled"); setEditingListId(null); };
  /* `confirm()` ist der Systemdialog: er sieht in der App fremd aus, und in
   * einer WebView kann er auch ganz ausbleiben -- dann loescht der Knopf
   * ohne Rueckfrage. Alle drei Loeschwege fragen jetzt mit demselben
   * Bauteil und melden danach zurueck. */
  const deleteActiveList = () => {
    const l = lists.find((x) => x.id === activeList); if (!l) return;
    store.deleteList(activeList);
    setListeLoeschen(false); setOffen(null);
    toast(txt("Wortliste „{name}“ gelöscht", { name: l.name }), "trash");
  };

  /* ---- share the active list (copy-on-import snapshot) ---- */
  const shareActiveList = async () => {
    const l = lists.find((x) => x.id === activeList); if (!l) return;
    const members = pairVocab.filter((w) => (w.lists || []).includes(activeList));
    if (!members.length) { toast("Diese Liste hat noch keine Wörter", "x"); return; }
    /* Frueher standen hier nur Wort und Uebersetzung -- Beispielsaetze und
     * Aussprache blieben beim Teilen zurueck, obwohl die Gegenseite sie
     * einlesen kann. Jetzt geht die volle Nutzlast mit. */
    const words = members.map((w) => wortNutzlast(w, pair, foreign));
    try {
      const token = await publishList({ name: l.name, pair, words });
      setShareName(l.name); setShareToken(token);
    } catch (e) { toast("Teilen hat nicht geklappt. Zum Teilen brauchst du ein Konto.", "x"); }
  };

  /* Beispielsaetze und ihre Uebersetzungen gehoeren paarweise zusammen und
   * werden ueber den Index verbunden. Ein `filter(Boolean)` auf nur einer
   * der beiden Listen verschiebt diese Zuordnung -- danach steht die
   * deutsche Fassung unter dem falschen Satz. Deshalb wird gemeinsam
   * gefiltert. `examplesDe` fiel hier bisher ganz weg: eingelesen wurde es,
   * gespeichert nicht. */
  const beispielePaar = (r: any) => {
    const a = (r.examples || []).map((x: any) => String(x ?? "").trim());
    const b = (r.examplesDe || []).map((x: any) => String(x ?? "").trim());
    const n = Math.max(a.length, b.length);
    const behalten: string[][] = [];
    for (let i = 0; i < n; i++) if ((a[i] || "") || (b[i] || "")) behalten.push([a[i] || "", b[i] || ""]);
    return { examples: behalten.map((x) => x[0]), examplesDe: behalten.map((x) => x[1]) };
  };

  /* ---- commit an import / scan into a chosen list ---- */
  const commitImport = useCallback(async (pairs, listId, name) => {
    setBusy(true);
    let filled = 0;
    const result = [];
    if (isLat) {
      // Latin: dedup on grundform|de, no auto-translation.
      for (const r of pairs) {
        const grundform = (r.grundform || r.fgn || "").trim();
        const lernform = (r.lernform || "").trim();
        const wortart = (r.wortart || "").trim();
        const de = (r.de || "").trim();
        const { examples, examplesDe } = beispielePaar(r);
        const phonetic = (r.phonetic || "").trim();
        const genus = (r.genus || "").trim();
        if (grundform || lernform || de) result.push({ grundform, lernform, genus, wortart, de, examples, examplesDe, phonetic, review: false, pair, lists: [listId] });
      }
      const key = (w) => ((w.grundform || "") + "|" + (w.de || "")).toLowerCase();
      const existing = new Set(pairVocab.map(key));
      const fresh = result.filter((w) => !existing.has(key(w)));
      store.addWords(fresh);
      setOffen({ art: "liste", ref: listId });
      setBusy(false);
      toast(`Added ${fresh.length} word${fresh.length === 1 ? "" : "s"} to “${name}”`, "check");
      return;
    }
    for (const r of pairs) {
      let fgn = (r.fgn || "").trim(), de = (r.de || "").trim();
      let review = false;
      if (fgn && !de) { const tr = await translateWord(fgn, foreign, "de"); de = tr.text; review = true; if (tr.text) filled++; }
      else if (de && !fgn) { const tr = await translateWord(de, "de", foreign); fgn = tr.text; review = true; if (tr.text) filled++; }
      const { examples, examplesDe } = beispielePaar(r);
      const phonetic = (r.phonetic || "").trim();
      const wortart = (r.wortart || "").trim();
      if (fgn || de) result.push({ [foreign]: fgn, lernform: (r.lernform || "").trim(), genus: (r.genus || "").trim(), wortart, de, examples, examplesDe, phonetic, review, pair, lists: [listId] });
    }
    const existing = new Set(pairVocab.map((w) => ((w[foreign] || "") + "|" + w.de).toLowerCase()));
    const fresh = result.filter((w) => !existing.has(((w[foreign] || "") + "|" + w.de).toLowerCase()));
    store.addWords(fresh);
    setOffen({ art: "liste", ref: listId });
    setBusy(false);
    toast(`Added ${fresh.length} word${fresh.length === 1 ? "" : "s"}${filled ? ` · ${filled} auto-filled` : ""} to “${name}”`, "check");
  }, [pairVocab, store, toast, foreign, pair, isLat]);

  /* ---- excel ---- */

  // Two explicit example columns instead of one delimited cell: a sentence may
  // contain any punctuation, and "|" / ";" are already column separators here.
/* Beispielzeilen der Vorlage, im EINEN Spaltensatz:
     Fremdsprache | Lernform | Wortart | Deutsch | Bsp1 | Bsp1 dt | Bsp2 | Bsp2 dt | Aussprache
   Die Lernform bleibt außerhalb des Lateinischen leer -- genau so, wie es
   auch ausgefuellt aussehen soll. Die letzte Zeile zeigt absichtlich eine
   halb leere: nur die Uebersetzung, den Rest holt die App oder man traegt
   ihn spaeter nach. */
/* Beispielzeilen der Vorlage, im EINEN Spaltensatz:
     Fremdsprache | Formen | Genus | Wortart | Deutsch |
     Bsp1 | Bsp1 dt | Bsp2 | Bsp2 dt | Aussprache
   Die letzte Zeile ist absichtlich halb leer: nur die Uebersetzung, den
   Rest traegt man spaeter nach. */
  const exampleRows = isLat
    ? [["canis", "canis, canis m", "m", "Nomen", "der Hund", "Canis in horto currit.", "Der Hund läuft im Garten.", "", "", "canis"],
       ["video", "video, videre, vidi, visum", "", "Verb", "sehen", "Puellam video.", "Ich sehe das Mädchen.", "Nihil videre possum.", "Ich kann nichts sehen.", "videō"],
       ["ruber", "ruber, rubra, rubrum", "", "Adjektiv", "rot", "Rosa rubra est.", "Die Rose ist rot.", "", "", "ruber"]]
    : pair === "fr-de"
    ? [["le chien", "le chien, les chiens", "m", "Nomen", "der Hund", "Le chien court dans le jardin.", "Der Hund läuft im Garten.", "", "", "ʃjɛ̃"],
       ["aller", "aller: je vais, tu vas, il va", "", "Verb", "gehen", "Je vais à l'école.", "Ich gehe zur Schule.", "", "", "ale"],
       ["", "", "", "", "das Buch", "", "", "", "", ""]]
    : pair === "es-de"
    ? [["el perro", "el perro, los perros", "m", "Nomen", "der Hund", "El perro corre por el jardín.", "Der Hund läuft durch den Garten.", "", "", "ˈpe.ro"],
       ["ir", "ir: voy, vas, va", "", "Verb", "gehen", "Voy a la escuela.", "Ich gehe zur Schule.", "", "", "iɾ"],
       ["", "", "", "", "das Buch", "", "", "", "", ""]]
    : pair === "it-de"
    ? [["il cane", "il cane, i cani", "m", "Nomen", "der Hund", "Il cane corre nel giardino.", "Der Hund läuft im Garten.", "", "", "ˈkaːne"],
       ["andare", "andare: vado, vai, va", "", "Verb", "gehen", "Vado a scuola.", "Ich gehe zur Schule.", "", "", "anˈdaːre"],
       ["", "", "", "", "das Buch", "", "", "", "", ""]]
    : pair === "pt-de"
    ? [["o cão", "o cão, os cães", "m", "Nomen", "der Hund", "O cão corre no jardim.", "Der Hund läuft im Garten.", "", "", "ˈkɐ̃w"],
       ["ir", "ir: vou, vais, vai", "", "Verb", "gehen", "Vou à escola.", "Ich gehe zur Schule.", "", "", "iɾ"],
       ["", "", "", "", "das Buch", "", "", "", "", ""]]
    : [["child", "child, children", "", "Nomen", "das Kind", "The child opens the door.", "Das Kind öffnet die Tür.", "Every child gets an apple.", "Jedes Kind bekommt einen Apfel.", "tʃaɪld"],
       ["go", "go, went, gone", "", "Verb", "gehen", "I go to school.", "Ich gehe zur Schule.", "", "", "ɡəʊ"],
       ["", "", "", "", "das Buch", "", "", "", "", ""]];

  const catBadge = (w: any) => {
    if (!practiceable(w)) return <span className="badge red"><span className="dot" />{txt("Übersetzung fehlt")}</span>;
    const stufe = deriveProfile(stats[w.id]?.fsrs, retentionFor(settings)).stufe;
    return <span className={"badge " + STUFE_BADGE[stufe]}><span className="dot" />{txt(STUFE_LANG[stufe])}</span>;
  };

  /* Die Fenster gelten auf beiden Ebenen, also stehen sie einmal hier. */
  /* Die Wege, auf denen Woerter in die App kommen. Sie standen in den
   * Angaben einer einzelnen Liste -- dort gehoeren sie nicht hin: eine
   * geteilte Liste zu uebernehmen legt eine NEUE Liste an, und eine Tabelle
   * einzulesen fuellt irgendeine. Es sind Wege zum Anlegen und Ergaenzen,
   * also stehen sie dort, wo man anlegt und ergaenzt. */
  const quellenZeilen = (
    <>
      {/* Der KI-Prompt stand hier als eigene Zeile und fuehrte in genau
          dasselbe Fenster -- zwei Wege, ein Ziel. Er gehoert dorthin, wo man
          ihn braucht: in das Fenster selbst, als Knopf neben dem Textfeld. */}
      <button className="li" onClick={() => { setQuellenBlatt(null); setPasteSeed(""); setPasteOpen(true); }}>
        <Icon name="list" size={15} />
        <span className="g">{txt("Liste einfügen")}<div className="m">{txt("abtippen, einfügen oder von deiner KI-App aus einem Foto erstellen lassen")}</div></span>
        <Icon name="arrowRight" size={14} />
      </button>
      {isConfigured && (
        <button className="li" onClick={() => { setQuellenBlatt(null); openImport(); }}>
          <Icon name="shareIn" size={15} />
          <span className="g">{txt("Geteilte Liste übernehmen")}<div className="m">{txt("jemand hat dir einen Link geschickt")}</div></span>
          <Icon name="arrowRight" size={14} />
        </button>
      )}
      {tabellen && (
        <button className="li" onClick={() => { setQuellenBlatt(null); dateiRef.current?.click(); }}>
          <Icon name="upload" size={15} />
          <span className="g">{txt("Tabelle einlesen")}<div className="m">{txt("Excel oder CSV, nur in der Webversion")}</div></span>
          <Icon name="arrowRight" size={14} />
        </button>
      )}
      {/* Die leere Vorlage. Sie war eine Weile nur noch Programmtext: die
          Funktion stand da, der Knopf dazu war beim Umbau der Ebenen
          verschwunden. Sie gehoert direkt unter das Einlesen -- erst die
          Vorlage holen, ausfuellen, dann wieder hineingeben. */}
      {tabellen && (
        <button className="li" onClick={() => { setQuellenBlatt(null); ladeVorlage(); }}>
          <Icon name="download" size={15} />
          <span className="g">{txt("Leere Vorlage herunterladen")}<div className="m">{txt("Excel-Datei mit allen Spalten, zum Ausfüllen")}</div></span>
          <Icon name="arrowRight" size={14} />
        </button>
      )}
    </>
  );

  const modale = (
    <>
      {/* Woher die Wörter kommen. Oben steht, was sich unterscheidet: beim
          Anlegen eine leere Liste, beim Ergänzen ein einzelnes Wort. */}
      {quellenBlatt && (
        <div className="modal-backdrop" onClick={() => setQuellenBlatt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <div className="modal-title">{quellenBlatt === "neu" ? txt("Neue Wortliste") : txt("Wörter hinzufügen")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setQuellenBlatt(null)}><Icon name="x" size={16} /></button>
            </div>
            <p className="said" style={{ marginTop: 0 }}>
              {quellenBlatt === "neu" ? txt("Woher kommen die Wörter?") : txt("Am Ende fragt die App, in welche Liste die Wörter kommen sollen.")}
            </p>
            <div className="list">
              {quellenBlatt === "neu" ? (
                <button className="li" onClick={() => { setQuellenBlatt(null); setNeueListe(true); }}>
                  <Icon name="plus" size={15} />
                  <span className="g">{txt("Leere Liste anlegen")}<div className="m">{txt("Name und Zieldatum, Wörter später")}</div></span>
                  <Icon name="arrowRight" size={14} />
                </button>
              ) : (
                <button className="li" onClick={() => { setQuellenBlatt(null); startNeu(activeList); }}>
                  <Icon name="plus" size={15} />
                  <span className="g">{txt("Einzelnes Wort eintippen")}<div className="m">{txt("dieselbe Maske wie beim Bearbeiten")}</div></span>
                  <Icon name="arrowRight" size={14} />
                </button>
              )}
              {quellenZeilen}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setQuellenBlatt(null)}>{txt("Abbrechen")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Zusammenführen: erst die Zielliste wählen, dann die Rückfrage. */}
      {mergeWahl && (
        <div className="modal-backdrop" onClick={() => setMergeWahl(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <div className="modal-title">{txt("Listen zusammenführen")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setMergeWahl(false)}><Icon name="x" size={16} /></button>
            </div>
            <p className="said" style={{ marginTop: 0 }}>
              {txt("In welche Liste sollen die Wörter von „{name}“ wandern? Danach gibt es diese Liste nicht mehr.",
                { name: lists.find((x: any) => x.id === activeList)?.name || "" })}
            </p>
            <div className="list">
              {lists.filter((l: any) => l.pair === pair && l.id !== activeList && l.system !== "nolist").map((l: any) => (
                <button key={l.id} className="li" onClick={() => { setMergeWahl(false); setMergeZiel(l.id); }}>
                  <span className="g">{l.name}
                    <div className="m">{txt("{n} Wörter", { n: pairVocab.filter((w: any) => (w.lists || []).includes(l.id)).length })}</div></span>
                  <Icon name="arrowRight" size={14} />
                </button>
              ))}
              {!lists.some((l: any) => l.pair === pair && l.id !== activeList && l.system !== "nolist") && (
                <div className="quiet links">{txt("Es gibt in dieser Sprache keine zweite Liste.")}</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setMergeWahl(false)}>{txt("Abbrechen")}</button>
            </div>
          </div>
        </div>
      )}

      <Bestaetigen offen={!!mergeZiel} titel={txt("Listen zusammenführen")}
        text={txt("Die Wörter von „{a}“ wandern nach „{b}“, danach gibt es „{a}“ nicht mehr. Wörter, die es in „{b}“ schon gibt, werden nicht doppelt angelegt.",
          { a: lists.find((x: any) => x.id === activeList)?.name || "", b: lists.find((x: any) => x.id === mergeZiel)?.name || "" })}
        knopf={txt("Zusammenführen")} onClose={() => setMergeZiel(null)}
        tun={() => {
          const ziel = mergeZiel as string;
          const r = store.mergeLists(activeList, ziel);
          setMergeZiel(null); setOffen({ art: "liste", ref: ziel });
          toast(r.doppelt
            ? txt("{n} Wörter übernommen · {d} Doppelte weggelassen", { n: r.verschoben, d: r.doppelt })
            : txt("{n} Wörter übernommen", { n: r.verschoben }), "check");
        }} />

      {/* Die drei Rueckfragen vor dem Loeschen -- eine Bauart, an einer
          Stelle, damit keine davon vergessen wird. */}
      <Bestaetigen offen={listeLoeschen} titel={txt("Wortliste löschen")} gefahr
        text={txt("Die Wortliste „{name}“ wird gelöscht. Die Wörter selbst bleiben erhalten und verlassen nur diese Liste.",
          { name: lists.find((x: any) => x.id === activeList)?.name || "" })}
        knopf={txt("Löschen")} onClose={() => setListeLoeschen(false)} tun={deleteActiveList} />

      <Bestaetigen offen={loeschFrage} titel={gewaehlt.length === 1 ? txt("Wort löschen") : txt("Wörter löschen")} gefahr
        text={gewaehlt.length === 1
          ? txt("Das Wort wird endgültig gelöscht, mitsamt seinem Lernstand. Das lässt sich nicht rückgängig machen.")
          : txt("{n} Wörter werden endgültig gelöscht, mitsamt ihrem Lernstand. Das lässt sich nicht rückgängig machen.", { n: gewaehlt.length })}
        knopf={txt("Löschen")} onClose={() => setLoeschFrage(false)}
        tun={() => {
          const n = gewaehlt.length;
          gewaehlt.forEach((id) => store.deleteWord(id));
          setGewaehlt([]); setLoeschFrage(false);
          toast(txt(n === 1 ? "Wort gelöscht" : "{n} Wörter gelöscht", { n }), "trash");
        }} />

      <Bestaetigen offen={!!wortLoeschen} titel={txt("Wort löschen")} gefahr
        text={txt("Das Wort wird endgültig gelöscht, mitsamt seinem Lernstand. Das lässt sich nicht rückgängig machen.")}
        knopf={txt("Löschen")} onClose={() => setWortLoeschen(null)}
        tun={() => {
          store.deleteWord(wortLoeschen);
          setWortLoeschen(null); setEditingId(null);
          toast(txt("Wort gelöscht"), "trash");
        }} />

      <PasteModal open={pasteOpen} pair={pair} initialText={pasteSeed}
        onClose={() => setPasteOpen(false)}
        onParsed={(rows: any) => { setPasteOpen(false); setReviewRows(rows); }} />
      <WordDetailModal open={!!detailWord} word={detailWord} onClose={() => setDetailWord(null)} onEdit={(w: any) => { setDetailWord(null); startEdit(w); }} />
      <ReviewModal open={!!reviewRows} rows={reviewRows} pair={pair}
        onClose={() => setReviewRows(null)}
        onConfirm={(rows: any) => { setReviewRows(null); setPendingImport(rows); }} />
      <ListPicker open={!!pendingImport} pair={pair} title={txt("In welche Liste?")}
        subtitle={pendingImport ? txt((pendingImport as any).length === 1 ? "{n} Wort bereit zum Import" : "{n} Wörter bereit zum Import", { n: (pendingImport as any).length }) : ""}
        onClose={() => setPendingImport(null)}
        onPick={(id: string, name: string) => { const p = pendingImport; setPendingImport(null); commitImport(p, id, name); }} />
      <ShareModal open={!!shareToken} token={shareToken} listName={shareName} onClose={() => setShareToken(null)} />

      {/* Zieldatum setzen und entfernen an einer Stelle. */}
      {datumOffen && (() => {
        const l = lists.find((x: any) => x.id === activeList);
        if (!l) return null;
        return (
          <div className="modal-backdrop" onClick={() => setDatumOffen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-head">
                <div className="modal-title">{txt("Zieldatum")}</div>
                <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setDatumOffen(false)}><Icon name="x" size={16} /></button>
              </div>
              <p className="said" style={{ marginTop: 0 }}>
                {txt("Meist der Tag der Prüfung. Je näher er rückt, desto häufiger kommen die Wörter dieser Liste. Ohne Datum wird die Liste normal abgefragt.")}
              </p>
              <input type="date" className="field" style={{ width: "100%" }}
                value={l.dueDate ? new Date(l.dueDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => setListDue(l.id, e.target.value)} aria-label={txt("Zieldatum")} />
              <div className="modal-foot">
                {l.dueDate ? (
                  <button className="btn btn-ghost" onClick={() => {
                    setListDue(l.id, ""); setDatumOffen(false); toast(txt("Zieldatum entfernt"), "calendar");
                  }}><Icon name="trash" size={14} /> {txt("Zieldatum entfernen")}</button>
                ) : <span />}
                <button className="btn btn-primary" onClick={() => setDatumOffen(false)}>{txt("Fertig")}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Das Dateifeld fuer "Tabelle einlesen". Es lag frueher in der Zeile
          neben dem Knopf und ist beim Umbau der Wortlisten mit ihr
          verschwunden -- der Knopf rief seither ins Leere. Jetzt steht es
          bei den anderen Fenstern: die werden immer gezeichnet, egal auf
          welcher Ebene man ist. */}
      <input ref={dateiRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) leseTabelle(f); e.target.value = ""; }} />

      {/* Bearbeiten: dieselben Felder wie im Wort-Detail, nur beschreibbar. */}
      {editingId && (() => {
        const neu = editingId === NEU;
        const w = neu ? { id: NEU } : vocab.find((x: any) => x.id === editingId);
        if (!w) return null;
        return (
          <div className="modal-backdrop" onClick={() => setEditingId(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "86vh", overflowY: "auto" } as any}>
              <div className="modal-head">
                <div className="modal-title">{neu ? txt("Neues Wort") : txt("Wort bearbeiten")}</div>
                <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setEditingId(null)}><Icon name="x" size={16} /></button>
              </div>
              {/* Dieselben Zeilen wie im Wort-Detail, nur beschreibbar: Feldname
                  links, Inhalt rechts. Vorher war es ein Stapel leerer Felder,
                  bei dem man am Platzhalter erkannte, was hineingehoert -- und
                  sobald etwas drinstand, gar nicht mehr. */}
              <div className="fz-block">
                <FeldEingabe feld={isLat ? txt("Grundform") : txt(P.foreignLabel)}
                  wert={draft.fgn} onChange={(v) => setDraft({ ...draft, fgn: v })} />
                {/* Stammformen kennt nur Latein. Die Wortart kennt jede
                    Sprache -- ein englisches "under" ist genauso eine
                    Praeposition, und die Angabe steht in den Angaben zum
                    Wort wie jede andere. */}
                {/* Die Formen kennt jede Sprache -- bei Latein die Stammformen,
                    sonst Singular und Plural oder die unregelmaessigen Formen.
                    Sie werden nie abgefragt, sie stehen nur da. */}
                <FeldEingabe feld={txt("Formen")} hinweis={isLat ? txt("Stammformen") : txt("optional")}
                  wert={draft.lernform} onChange={(v) => setDraft({ ...draft, lernform: v })} />
                <FeldAuswahl feld={txt("Geschlecht")} hinweis={txt("nur bei Nomen")} wert={draft.genus} werte={GENUS}
                  onChange={(v) => setDraft({ ...draft, genus: v })} />
                <FeldAuswahl feld={txt("Wortart")} hinweis={txt("optional")} wert={draft.wortart} werte={WORTARTEN}
                  onChange={(v) => setDraft({ ...draft, wortart: v })} />
                <FeldEingabe feld={txt(P.nativeLabel)} wert={draft.de}
                  onChange={(v) => setDraft({ ...draft, de: v })} />
                <FeldEingabe feld={txt("Lautschrift")} hinweis={txt("optional")} wert={draft.phon}
                  onChange={(v) => setDraft({ ...draft, phon: v })} />
                <FeldEingabe feld={txt("Beispielsatz 1")} hinweis={txt(P.foreignLabel)} wert={draft.ex1}
                  mehrzeilig onChange={(v) => setDraft({ ...draft, ex1: v })} />
                <FeldEingabe feld={txt("Beispielsatz 1")} hinweis={txt(P.nativeLabel)} wert={draft.ex1de}
                  mehrzeilig onChange={(v) => setDraft({ ...draft, ex1de: v })} />
                <FeldEingabe feld={txt("Beispielsatz 2")} hinweis={txt(P.foreignLabel)} wert={draft.ex2}
                  mehrzeilig onChange={(v) => setDraft({ ...draft, ex2: v })} />
                <FeldEingabe feld={txt("Beispielsatz 2")} hinweis={txt(P.nativeLabel)} wert={draft.ex2de}
                  mehrzeilig onChange={(v) => setDraft({ ...draft, ex2de: v })} />
              </div>
              {/* Der Lernstand -- derselbe Block wie in der Statistik. */}
              {!neu && (() => { const wv = vocab.find((x: any) => x.id === editingId); return wv ? <LernstandBlock word={wv} /> : null; })()}
              {isLat && <LatinKeys hint={txt("Feld antippen, dann Zeichen wählen")} />}
              <div className="modal-foot">
                {neu ? (
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>{txt("Abbrechen")}</button>
                ) : (
                  <button className="btn btn-ghost" onClick={() => setWortLoeschen(editingId)}>
                    <Icon name="trash" size={14} /> {txt("Wort löschen")}
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => saveEdit(editingId)}>{txt("Speichern")}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Neue Liste: Name, dann das Zieldatum als bewusste Wahl. Vorher
          entstand die Liste sofort mit Platzhalternamen. */}
      {neueListe && (
        <div className="modal-backdrop" onClick={() => setNeueListe(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <div className="modal-title">{txt("Neue Liste")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setNeueListe(false)}><Icon name="x" size={16} /></button>
            </div>
            <input className="field" style={{ width: "100%" }} autoFocus placeholder={txt("Name der Liste …")}
              value={nlName} onChange={(e) => setNlName(e.target.value)} />
            {/* Nur ein Datumsfeld. Zwei Wahlzeilen fuer "mit" und "ohne"
                waren eine Frage, die das leere Feld schon beantwortet:
                nichts eingetragen heißt kein Zieldatum. */}
            <div className="grp">{txt("Zieldatum")} <span className="hint">— {txt("optional")}</span></div>
            <div className="row" style={{ gap: 8 }}>
              <input type="date" className="field grow" value={nlDatum}
                onChange={(e) => setNlDatum(e.target.value)} aria-label={txt("Zieldatum")} />
              {nlDatum && (
                <button className="icon-btn" title={txt("Zieldatum entfernen")} onClick={() => setNlDatum("")}>
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>
              {txt("Leer lassen heißt: die Liste läuft nebenher.")}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setNeueListe(false)}>{txt("Abbrechen")}</button>
              <button className="btn btn-primary" onClick={() => {
                legeListeAn(nlName, nlDatum ? new Date(nlDatum + "T08:00:00").getTime() : undefined);
                setNeueListe(false); setNlName(""); setNlDatum("");
              }}>{txt("Anlegen")}</button>
            </div>
          </div>
        </div>
      )}

      {smartHilfe && (
        <div className="modal-backdrop" onClick={() => setSmartHilfe(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <div className="modal-title">{txt("Smart Lists")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setSmartHilfe(false)}><Icon name="x" size={16} /></button>
            </div>
            <p className="said">{txt("Die vier Smart Lists stellt die App jeden Tag neu zusammen, quer über deine Wortlisten. Du kannst sie nicht ändern, nur ansehen und üben.")}</p>
            <div className="list">
              {SMART_ACCESS.map((sm) => (
                <div className="li" key={sm.ref}>
                  <Icon name={sm.icon as any} size={15} />
                  <span className="g">{txt(sm.label)}<div className="m">{txt(sm.kurz)}</div></span>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={() => setSmartHilfe(false)}>{txt("Verstanden")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
  /* ---------------------------------------------------------- Wörter im Blick */
  const woerterImBlick = useMemo(() => {
    if (!offen) return [];
    if (offen.art === "alle") return pairVocab;
    if (offen.art === "liste") return pairVocab.filter((w: any) => (w.lists || []).includes(offen.ref));
    const ret = retentionFor(settings);
    return offen.ref === "heute"
      ? resolveToday(pairVocab, stats, lists, ret, settings.dailyGoal, settings.newPerDay)
      : resolveSmart(offen.ref, pairVocab, stats, settings.masteryCorrect, { retention: ret });
  }, [offen, pairVocab, stats, lists, settings]);

  const standImBlick = useMemo(() => {
    const dist: Record<string, number> = { sitzt: 0, sitzt_fast: 0, sitzt_schlecht: 0, neu: 0, noch_nicht_geuebt: 0 };
    const ret = retentionFor(settings);
    for (const w of woerterImBlick) {
      const stufe = !practiceable(w) ? "noch_nicht_geuebt" : deriveProfile(stats[w.id]?.fsrs, ret).stufe;
      dist[stufe]++;
    }
    return { dist, total: woerterImBlick.length };
  }, [woerterImBlick, stats, settings]);

  const smartZahl = (ref: string) => {
    const ret = retentionFor(settings);
    return ref === "heute"
      ? resolveToday(pairVocab, stats, lists, ret, settings.dailyGoal, settings.newPerDay).length
      : resolveSmart(ref, pairVocab, stats, settings.masteryCorrect, { retention: ret }).filter(practiceable).length;
  };

  const titelImBlick = !offen ? ""
    : offen.art === "alle" ? txt("Alle Wörter")
    : offen.art === "smart" ? txt((SMART_ACCESS.find((s) => s.ref === offen.ref) || {}).label || "Auswahl")
    : listNameOf(offen.ref);

  /* ============================================== Wörter herausgeben
   *
   * Hinein ging es auf drei Wegen, hinaus auf keinem. Das ist nicht nur
   * unbequem, es ist auch die falsche Haltung: was jemand eingetippt hat,
   * gehoert ihm, und er muss es wieder mitnehmen koennen.
   *
   * Ausgegeben wird in genau dem Format, das die App auch einliest -- die
   * Spalten stehen dafuer an einer Stelle (lib/export.ts). Damit ist der
   * Weg hinaus und wieder hinein verlustfrei, und die Textform ist
   * zugleich das, was man in eine KI wirft, wenn man die Liste erweitern
   * lassen will.
   *
   * Absichtlich OHNE Konto: der Tabellen-Import verlangt eine Anmeldung,
   * das Herausgeben eigener Daten darf das nicht. */
  const dateiname = (t: string) =>
    ("smartvoc-" + (t || "wortliste")).toLowerCase()
      .replace(/[äàâ]/g, "a").replace(/[öô]/g, "o").replace(/[üû]/g, "u").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

  const exportText = async () => {
    if (!woerterImBlick.length) { toast(txt("Hier stehen noch keine Wörter"), "x"); return; }
    const wie = await teilen({
      titel: titelImBlick,
      text: alsText(woerterImBlick, pair, foreign),
    });
    setExportBlatt(false);
    if (wie === "gescheitert") { toast(txt("Das hat nicht geklappt. Versuch es nochmal."), "x"); return; }
    toast(wie === "geteilt" ? txt("Geteilt") : txt("In die Zwischenablage kopiert"), "check");
  };

  const exportTabelle = async () => {
    if (!woerterImBlick.length) { toast(txt("Hier stehen noch keine Wörter"), "x"); return; }
    try {
      const XLSX = await import("xlsx");
      const head = spalten(pair, P.foreignLabel);
      const ws = XLSX.utils.aoa_to_sheet([head, ...woerterImBlick.map((w: any) => exportZeile(w, pair, foreign))]);
      ws["!cols"] = head.map((_, i) => ({ wch: i < 2 ? 22 : 30 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Wortschatz");
      XLSX.writeFile(wb, dateiname(titelImBlick) + ".xlsx");
      setExportBlatt(false);
      toast(txt("Tabelle heruntergeladen"), "download");
    } catch (e) { toast(txt("Das hat nicht geklappt. Versuch es nochmal."), "x"); }
  };

  /* Dasselbe Blatt wie beim Hineinholen, nur andersherum -- gleiche Form,
   * gleiche Zeilen, damit man nicht zweimal lernen muss, wie es geht. */
  const exportFenster = exportBlatt && (
    <div className="modal-backdrop" onClick={() => setExportBlatt(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="modal-title">{txt("Wörter exportieren")}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setExportBlatt(false)}><Icon name="x" size={16} /></button>
        </div>
        <p className="said" style={{ marginTop: 0 }}>
          {txt("{n} Wörter aus „{name}“, im selben Format, das die App auch wieder einliest.", { n: String(woerterImBlick.length), name: titelImBlick })}
        </p>
        <div className="list">
          <button className="li" onClick={() => exportText()}>
            <Icon name="share" size={15} />
            <span className="g">{txt("Als Text")}<div className="m">{istWeb() ? txt("in die Zwischenablage, zum Einfügen oder Aufbewahren") : txt("teilen oder in die Zwischenablage, eine Zeile je Wort")}</div></span>
            <Icon name="arrowRight" size={14} />
          </button>
          {istWeb() && (
            <button className="li" onClick={() => exportTabelle()}>
              <Icon name="download" size={15} />
              <span className="g">{txt("Als Tabelle")}<div className="m">{txt("Excel-Datei (.xlsx), nur in der Webversion")}</div></span>
              <Icon name="arrowRight" size={14} />
            </button>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setExportBlatt(false)}>{txt("Abbrechen")}</button>
        </div>
      </div>
    </div>
  );

  /* Eine Zeile, nicht eine Karte. Hier werden Wortlisten gebaut, nicht
   * Statistik gelesen: zwei Spalten, die zwei Woerter, und als einziges
   * Zeichen des Lernstands die Farbe der Zeile -- dieselbe Farbe wie in der
   * Leiste darueber. Die Zahlen pro Wort standen hier doppelt und anders als
   * in der Statistik; sie stehen jetzt nur noch im Detail. */
  const wortZeile = (w: any) => {
    const nurLesen = offen?.art === "smart";
    const ret = retentionFor(settings);
    const stufe = !practiceable(w) ? "noch_nicht_geuebt" : deriveProfile(stats[w.id]?.fsrs, ret).stufe;
    const an = gewaehlt.includes(w.id);
    return (
      <button key={w.id} className={"wz" + (an ? " sel" : "") + (nurLesen ? " ro" : "")}
        onClick={() => { if (!nurLesen) toggleWort(w.id); }} disabled={nurLesen}
        style={{ ["--stufe" as any]: STUFE_FARBE[stufe] }}
        aria-pressed={an} title={txt(STUFE_LANG[stufe])}>
        <span className="wz-f">{fgnOf(w) || <span className="faint">—</span>}</span>
        <span className="wz-d">{w.de || <span className="faint">—</span>}</span>
      </button>
    );
  };

  /* Der Titel steht in der einen Kopfzeile der App, und der Zurueck-Knopf
   * fuehrt EINE Ebene zurueck: von den Woertern zur Liste, von der Liste
   * zur Uebersicht. */
  useAlsUnterkopf(offen ? titelImBlick : null,
    () => { if (woerterOffen) setWoerterOffen(false); else setOffen(null); });

  /* =============================================== Eine Liste geöffnet
   *
   * Zwei Ebenen statt einer. Vorher stand alles auf einem Bildschirm: die
   * Angaben zur Liste, die Werkzeuge, der Spaltenkopf und darunter die
   * Wörter -- und weil beides zugleich sichtbar bleiben sollte, brauchte es
   * zwei Rollbereiche übereinander. Das war eine Bauart, die man erklären
   * muss, und auf dem Handy sah man sechs Wörter.
   *
   * Jetzt: die Liste selbst (Termin, Fortschritt, Wege zum Füllen) auf der
   * einen Ebene, ihre Wörter hinter einem Knopf auf der nächsten. Dort ist
   * der Bildschirm nackt -- Suche, Auswahl, Spaltenkopf, Wörter -- und die
   * Wörter rollen, wie eine Liste rollt.
   */
  if (offen) {
    const l = offen.art === "liste" ? lists.find((x: any) => x.id === offen.ref) : null;
    const istSystemliste = l?.system === "nolist";
    /* Eine Smart List ist ein Blick, keine Ablage: die App stellt sie jeden
     * Tag neu zusammen. Wer darin ein Wort loeschte, loeschte es aus seiner
     * echten Liste -- ohne zu sehen, aus welcher. Also nur ansehen.
     * "Alle Woerter" ist dagegen ein echter Bestand und bleibt bearbeitbar. */
    const bearbeitbar = offen.art === "liste" || offen.art === "alle";

    /* ------------------------------------------- Ebene 3: die Wörter */
    if (woerterOffen) {
      const q = listenSuche.toLowerCase().trim();
      const sichtbar = q
        ? woerterImBlick.filter((w: any) => fgnOf(w).toLowerCase().includes(q)
            || (w.lernform || "").toLowerCase().includes(q) || (w.de || "").toLowerCase().includes(q))
        : woerterImBlick;
      const nurEines = gewaehlt.length === 1;
      return (
        <div className="wl wl-liste">
          {/* Alles bis und mit Spaltenkopf ist EIN Block -- er rollt lautlos
              mit, wenn der Bildschirm zu kurz wird. Die Wörter rollen
              getrennt davon, mit sichtbarem Balken. */}
          <div className="wl-fest">
            <div className="ruest wl-werkzeug">
              <div className="search">
                <Icon name="search" size={16} />
                <input className="field" placeholder={txt("In dieser Liste suchen …")}
                  value={listenSuche} onChange={(e) => setListenSuche(e.target.value)} />
              </div>
            </div>

            {!bearbeitbar ? (
              <div className="quiet links" style={{ paddingTop: 8 }}>
                {txt("Diese Liste stellt die App täglich neu zusammen. Ändern lässt sich hier nichts.")}
              </div>
            ) : (
              /* Drei Knoepfe derselben Form: was man mit der Liste tun kann.
                 „Hinzufuegen" war vorher eine Pille neben der Suche und hiess
                 „Wort" -- eine andere Form fuer dieselbe Art Handlung, und ein
                 Name, der nur einen der fuenf Wege nannte. */
              <div className="ruest wl-auswahl">
                <button className="btn btn-sm" onClick={() => setQuellenBlatt("dazu")}>
                  <Icon name="plus" size={14} /> {txt("Hinzufügen")}
                </button>
                <button className="btn btn-sm" disabled={!nurEines}
                  onClick={() => { const w = vocab.find((x: any) => x.id === gewaehlt[0]); if (w) startEdit(w); }}>
                  <Icon name="edit" size={14} /> {txt("Bearbeiten")}
                </button>
                <button className="btn btn-sm" disabled={!gewaehlt.length} onClick={() => setLoeschFrage(true)}>
                  <Icon name="trash" size={14} /> {txt("Löschen")}
                </button>
              </div>
            )}
            {bearbeitbar && (
              <div className="wl-nsel">{gewaehlt.length ? txt("{n} gewählt", { n: gewaehlt.length }) : txt("Zeile antippen zum Auswählen")}</div>
            )}

            {bearbeitbar && sichtbar.length > 0 && (
              <div className="wl-alle">
                <button onClick={() => setGewaehlt(sichtbar.map((w: any) => w.id))}
                  disabled={gewaehlt.length === sichtbar.length}>{txt("Alle auswählen")}</button>
                <button onClick={() => setGewaehlt([])} disabled={!gewaehlt.length}>{txt("Auswahl aufheben")}</button>
              </div>
            )}

            {sichtbar.length > 0 && (
              <div className="wz-kopf">
                <span className="wz-f">{txt(P.foreignLabel)}</span>
                <span className="wz-d">{txt(P.nativeLabel)}</span>
              </div>
            )}
          </div>

          <div className="wl-roll wl-roll-sichtbar">
            {sichtbar.length ? sichtbar.map(wortZeile) : (
              <div className="empty">
                <div className="big">{q ? txt("Nichts gefunden") : txt("Noch keine Wörter")}</div>
                <div>{q ? txt("Anderer Suchbegriff, oder das Feld leeren") : txt("Zurück zur Liste. Dort stehen die Wege, sie zu füllen.")}</div>
              </div>
            )}
          </div>

          {modale}
        </div>
      );
    }

    /* ------------------------------------------- Ebene 2: die Liste */
    return (
      <div className="wl">
        {/* Neben dem Datum stand ein Papierkorb. Er loeschte das Datum, sah
            aber aus, als loeschte er die Liste -- ein Zeichen ohne Satz
            daneben sagt nicht, worauf es sich bezieht. Das Entfernen steht
            jetzt dort, wo man das Datum ohnehin setzt. */}
        {/* Eine Werkzeugzeile auf jeder Ebene-2-Ansicht. Zieldatum, Umbenennen
            und Teilen gelten nur fuer eine echte Liste; Exportieren gilt fuer
            alles, was hier zu sehen ist -- auch fuer "Alle Wörter" und fuer
            eine Smart List, denn das sind genauso Wörter, die jemand
            mitnehmen will. */}
        {(l || standImBlick.total > 0) && (
          <div className="ruest">
            {l && (
              <button className="pill pill-on" onClick={() => setDatumOffen(true)}>
                <Icon name="calendar" size={14} />
                <span>{l.dueDate ? new Date(l.dueDate).toLocaleDateString(LOCALE(), { weekday: "short", day: "numeric", month: "numeric" }) : txt("Kein Zieldatum")}</span>
              </button>
            )}
            {l && !istSystemliste && (
              <button className="pill" onClick={() => { setEditingListId(l.id); setListName(l.name); }}>
                <Icon name="edit" size={14} /> {txt("Umbenennen")}
              </button>
            )}
            {canShare && l && !istSystemliste && (
              <button className="pill" onClick={shareActiveList}><Icon name="share" size={14} /> {txt("Teilen")}</button>
            )}
            {standImBlick.total > 0 && (
              <button className="pill" onClick={() => setExportBlatt(true)}><Icon name="download" size={14} /> {txt("Exportieren")}</button>
            )}
          </div>
        )}
        {editingListId === offen.ref && (
          <input className="mini-input" style={{ marginTop: 8, fontFamily: "var(--serif)", fontSize: 17 }} autoFocus
            value={listName} onChange={(e) => setListName(e.target.value)} onBlur={commitRename}
            onKeyDown={(e) => e.key === "Enter" && commitRename()} />
        )}

        {standImBlick.total > 0 && (
          <div className="wl-stand">
            <MasteryBar dist={standImBlick.dist} total={standImBlick.total} />
            <button className="wl-statlink" onClick={() => {
              store.setSettings({ statPair: pair, statLists: offen.art === "liste" ? [offen.ref] : [] });
              window.dispatchEvent(new CustomEvent("vt-tab", { detail: "stats" }));
            }}><Icon name="chart" size={12} /> {txt("Statistik")}</button>
          </div>
        )}

        {/* Der Weg zu den Wörtern -- eine Zeile wie jede andere, mit der
            Zahl daneben, damit man weiß, was einen erwartet. */}
        <button className="li li-woerter" onClick={() => { setListenSuche(""); setGewaehlt([]); setWoerterOffen(true); }}>
          <Icon name="list" size={15} />
          <span className="g">{txt("Wörter ansehen und bearbeiten")}
            <div className="m">{txt("suchen, ändern, löschen")}</div></span>
          <span className="lchip-n">{standImBlick.total}</span>
          <Icon name="arrowRight" size={14} />
        </button>

        {/* Zwei Wortlisten zu einer machen -- „Unité 3" und „Unité 3 Teil 2"
            gehören meist ohnehin zusammen. */}
        {l && !istSystemliste && (
          <button className="li" onClick={() => setMergeWahl(true)}>
            <Icon name="swap" size={15} />
            <span className="g">{txt("Mit einer anderen Liste zusammenführen")}
              <div className="m">{txt("die Wörter wandern hinüber, diese Liste verschwindet")}</div></span>
            <Icon name="arrowRight" size={14} />
          </button>
        )}

        {/* Woher die Liste kommt und wann sie zuletzt angefasst wurde. Reine
            Anzeige, deshalb ohne Kasten -- dieselbe Regel wie beim
            Lernstand: Anzeige steht hell und ohne Linie. */}
        {l && (
          <div className="listen-meta">
            <div className="fz"><span className="fz-name">{txt("Herkunft")}</span>
              <span className="fz-wert">{txt({
                geteilt: "Von jemandem übernommen",
                grundwortschatz: "Mitgeliefert",
              }[l.herkunft] || "Selbst angelegt")}</span></div>
            {l.autor && (
              <div className="fz"><span className="fz-name">{txt("Angelegt von")}</span>
                <span className="fz-wert">{l.autor}</span></div>
            )}
            <div className="fz"><span className="fz-name">{txt("Angelegt")}</span>
              <span className="fz-wert">{datumLang(l.createdAt)}</span></div>
            <div className="fz"><span className="fz-name">{txt("Zuletzt geändert")}</span>
              <span className="fz-wert">{datumLang(l.updatedAt || l.createdAt)}</span></div>
          </div>
        )}

        {l && !istSystemliste && (
          <button className="wl-loeschen" onClick={() => setListeLoeschen(true)}>
            <Icon name="trash" size={13} /> {txt("Diese Wortliste löschen")}
          </button>
        )}

        {exportFenster}
        {modale}
      </div>
    );
  }

  /* ==================================================== Die Übersicht */
  /* Die Suche geht ueber ALLE zugeschalteten Sprachen, nicht nur die
   * aktuelle. Erst dadurch traegt die Zeile "Liste · Sprachpaar" eine
   * Auskunft: stuende dort immer dasselbe Paar, waere sie ueberfluessig.
   * Und wer sucht, weiß oft nicht mehr, in welcher Sprache das Wort lag --
   * genau deshalb sucht er ja. */
  const treffer = query.trim()
    ? vocab.filter((w: any) => {
        const q = query.toLowerCase().trim();
        if (!aktivePaare.includes(w.pair || "en-de")) return false;
        const pp = PAIRS[w.pair || "en-de"] || PAIRS["en-de"];
        const fgn = isLatinPair(w.pair) ? (w.grundform || "") : (w[pp.foreign] || "");
        return fgn.toLowerCase().includes(q) || (w.lernform || "").toLowerCase().includes(q) || (w.de || "").toLowerCase().includes(q);
      })
    : null;

  return (
    <div className="wl">
      {/* Die Suche stand hier oben, zwischen Sprachwahl und "Neue Liste" --
          an der prominentesten Stelle des Bildschirms. Sie versprach damit
          eine zentrale Handlung, die sie nicht ist: gesucht wird, um ein Wort
          zu berichtigen oder nachzusehen, ob es schon da ist. Beides ist
          Wartung. Sie steht jetzt unten, nach den Listen. */}
      <div className="ruest">
        <PairPill />
        <button className="pill pill-on" onClick={() => setQuellenBlatt("neu")}>
          <Icon name="plus" size={14} /> {txt("Neue Liste")}
        </button>
      </div>

      {treffer ? (
        <>
          <div className="grp">{txt("{n} Treffer", { n: treffer.length })}</div>
          {/* Ein Treffer sagt, WO das Wort liegt -- Liste und Sprachpaar --
              und fuehrt beim Antippen genau dorthin: in die Woerter dieser
              Liste, mit dem Suchbegriff im Feld, damit man es sofort sieht.
              Vorher landete man auf der Liste und suchte von vorne. */}
          <div className="list">{treffer.map((w: any) => {
            const wp = w.pair || "en-de";
            const stufe = !practiceable(w) ? "noch_nicht_geuebt" : deriveProfile(stats[w.id]?.fsrs, retentionFor(settings)).stufe;
            const lid = (w.lists || [])[0];
            const pp = PAIRS[wp] || PAIRS["en-de"];
            const fgn = isLatinPair(wp) ? (w.grundform || "") : (w[pp.foreign] || "");
            /* Ein Wort kann auf eine Liste zeigen, die es nicht mehr gibt.
             * Dann ist der Name leer, und " · Français ⇄ Deutsch" faengt
             * mit einem Trennzeichen an, das nichts trennt. */
            const listenname = (lid && listNameOf(lid)) || txt("Ohne Liste");
            return (
              <button key={w.id} className="wz wz-fund" style={{ ["--stufe" as any]: STUFE_FARBE[stufe] }}
                onClick={() => {
                  const begriff = query;
                  setQuery("");
                  if (wp !== pair) store.setSettings({ pair: wp });
                  setListenSuche(begriff); setGewaehlt([]);
                  setOffen(lid ? { art: "liste", ref: lid } : { art: "alle", ref: "" });
                  setWoerterOffen(true);
                }}>
                <span className="wz-f">{fgn || <span className="faint">—</span>}</span>
                <span className="wz-d">{w.de || <span className="faint">—</span>}</span>
                <span className="wz-her">{listenname} · {pp.foreignLabel} ⇄ {pp.nativeLabel}</span>
              </button>
            );
          })}</div>
          {!treffer.length && <div className="empty"><div className="big">{txt("Nichts gefunden")}</div><div>{txt("Anderer Suchbegriff, oder das Feld leeren")}</div></div>}
        </>
      ) : (
        <div className="list">
          <div className="grp">{txt("Deine Listen")}</div>
          {pairLists.length ? listsSortiert.map((l: any) => {
            const st = listenStand[l.id];
            const tage = l.dueDate ? Math.ceil((l.dueDate - Date.now()) / 86400000) : null;
            const sub = [txt("{n} Wörter", { n: st?.total ?? 0 })];
            if (l.dueDate) sub.push(txt("Zieldatum {d}", { d: new Date(l.dueDate).toLocaleDateString(LOCALE(), { day: "numeric", month: "numeric" }) })
              + (tage != null && tage >= 0 && tage <= 14 ? " · " + (tage === 0 ? txt("heute") : tage === 1 ? txt("morgen") : txt("in {n} Tagen", { n: tage })) : ""));
            return (
              <button key={l.id} className="li" onClick={() => setOffen({ art: "liste", ref: l.id })}>
                <span className="g">{l.name}
                  <div className="m">{sub.join(" · ")}</div>
                  {st && st.total > 0 && (
                    <span className="standline">
                      <MasteryBar dist={st.prof.dist} total={st.total} showLegend={false} />
                    </span>
                  )}
                </span>
                <Icon name="arrowRight" size={14} />
              </button>
            );
          }) : (
            <div className="quiet">{txt("Noch keine eigene Wortliste. Lege oben eine an, oder üb mit dem Grundwortschatz.")}</div>
          )}

          {pairLists.length > 0 && (
            <div className="wl-legende">
              {STUFE_ORDER.map((k) => (
                <span key={k}><i style={{ background: STUFE_FARBE[k] }} />{txt(STUFE_KURZ[k])}</span>
              ))}
            </div>
          )}

          <div className="grp">{txt("Smart Lists")}
            <button className="chips-help" title={txt("Was bedeuten diese?")} onClick={() => setSmartHilfe(true)}>?</button>
          </div>
          {SMART_ACCESS.map((sm) => {
            const n = smartZahl(sm.ref);
            return (
              <button key={sm.ref} className="li" disabled={!n} onClick={() => setOffen({ art: "smart", ref: sm.ref })}>
                <Icon name={sm.icon as any} size={15} />
                <span className="g">{txt(sm.label)}<div className="m">{txt(sm.kurz)}</div></span>
                <span className="lchip-n">{n}</span>
              </button>
            );
          })}

          {/* „Alle Wörter“ ist der Rückfall, nicht der Einstieg — deshalb
              zuletzt und abgesetzt. Als Reiter an erster Stelle stand es
              vor den Listen, um die es eigentlich geht.

              Eine Trennlinie allein genügte nicht: Die Zeile stand weiter
              unter der Überschrift „Smart Lists“, und wer vier Listen liest
              und fünf Zeilen sieht, zählt nach. Eine eigene Überschrift
              beendet den Block eindeutig. */}
          <div className="grp">{txt("Gesamtbestand")}</div>
          <button className="li li-alle" onClick={() => setOffen({ art: "alle", ref: "" })}>
            <Icon name="list" size={15} />
            <span className="g">{txt("Alle Wörter")}</span>
            <span className="lchip-n">{pairVocab.length}</span>
            <Icon name="arrowRight" size={14} />
          </button>
        </div>
      )}

      {/* Das Feld steht AUSSERHALB der Verzweigung. Stand es drin, verschwand
          es beim ersten Tastendruck mit dem Zweig, in dem es lag -- und der
          Rest des Suchbegriffs ging ins Leere. Es bleibt also stehen, unten,
          und die Treffer erscheinen darueber. */}
      <div className="search wl-suche">
        <Icon name="search" size={17} />
        <input className="field" placeholder={txt("Wort suchen, über alle Sprachen")}
          value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button className="such-x" onClick={() => setQuery("")} aria-label={txt("Suche leeren")}>
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {modale}
    </div>
  );
}
