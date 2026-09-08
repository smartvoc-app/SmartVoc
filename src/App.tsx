/* ===================================================================
 * app.tsx — shell: header (streak / daily goal), tabs, pair switcher.
 * =================================================================== */
import { useState, useEffect } from "react";
import { useStore } from "./store/StoreProvider";
import { useAuth } from "./sync/auth";
import { useSync } from "./sync/SyncBridge";
import { Icon } from "./ui/Icon";
import { useUnterkopf } from "./ui/ScreenHead";
import { Ring } from "./ui/Ring";
import { Startbild } from "./ui/Startbild";
import { PAIRS, activePairs } from "./lib/pairs";
import { setUiLang, detectUiLang, txt } from "./lib/i18n";
import markUrl from "./assets/mark.svg";
import { STARTERS, activateStarter, isStarterActivated } from "./data/starter";
import { AccountModal } from "./components/AccountModal";
import { ImportShareModal } from "./components/ImportShareModal";
import { ImportContext } from "./components/importContext";
import { Help } from "./components/Help";
import { Practice } from "./components/Practice";
import { PlanTab } from "./components/PlanTab";
import { WordList } from "./components/WordList";
import { Stats } from "./components/Stats";
import { SettingsTab } from "./components/SettingsTab";

const SYNC_DOT: Record<string, string> = {
  local: "var(--ink-faint)", syncing: "var(--amber)", synced: "var(--green)", offline: "var(--ink-faint)", error: "var(--red)",
};

function Header({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const { meta, vocab, settings } = useStore();
  const auth = useAuth();
  const { status } = useSync();
  const [accountOpen, setAccountOpen] = useState(false);
  const pair = settings.pair;
  const p = PAIRS[pair] || PAIRS["en-de"];
  const nWords = vocab.filter((w: any) => w.pair === pair).length;
  const unterkopf = useUnterkopf();
  /* Ein Unterbildschirm ersetzt die Kopfzeile, er baut keine zweite darunter.
   * Dort steht nur Zurueck und der Name -- kein Zeichen, kein Zahnrad: wer
   * eine Ebene tiefer arbeitet, soll nicht aus Versehen in die
   * Einstellungen springen. */
  if (unterkopf) {
    return (
      <div className="topbar topbar-sub">
        <button className="hbtn" onClick={unterkopf.zurueck} aria-label={txt("Zurück")}>
          <Icon name="chevronLeft" size={17} />
        </button>
        <div className="screen-title">{unterkopf.titel}</div>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="brand">
        <img className="brand-mark" src={markUrl} alt="" />
        {/* Nur der Name. Sprachpaar und Wortzahl standen darunter -- beides
            sagt die Rüstzeile schon, und auf dem Handy wurde die Zeile
            ohnehin auf Breite null gedrückt. */}
        <div className="brand-name">{txt("SmartVoc")}</div>
      </div>
      <div className="topbar-spacer" />
      {auth.configured && (
        <>
          <button className="tipbtn" title={txt("Konto & Abgleich")} onClick={() => setAccountOpen(true)} style={{ gap: 8 }}>
            <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_DOT[status] }} />
            {auth.user ? (auth.username || txt("Konto")) : txt("Anmelden")}
          </button>
          <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
        </>
      )}
      <Help />
      {/* Einstellungen verlassen die Leiste: sie sind kein Bereich, in dem man
          arbeitet, sondern etwas, das man einmal einstellt. */}
      <button className={"hbtn" + (tab === "settings" ? " active" : "")} title={txt("Einstellungen")}
        aria-pressed={tab === "settings"} onClick={() => setTab(tab === "settings" ? "practice" : "settings")}>
        <Icon name="gear" size={16} />
      </button>
    </div>
  );
}

/* Vier Bereiche in der Reihenfolge des Tuns: üben, planen, verwalten,
 * nachschauen. Die Einstellungen sind kein Bereich mehr — sie sitzen als
 * Zahnrad in der Kopfzeile, wo man sie einmal aufsucht. */
const TABS = [
  { id: "practice", label: "Üben", icon: "cards" },
  { id: "plan", label: "Übungsplan", icon: "calendar" },
  { id: "lists", label: "Wortlisten", icon: "list" },
  { id: "stats", label: "Statistik", icon: "chart" },
];   // Beschriftung laeuft beim Rendern durch txt()

export function App() {
  const store = useStore();
  const { vocab, settings, setSettings } = store;
  /* Die Sprache wird beim Rendern gesetzt, nicht in einem Effekt: t() liest
   * sie beim Aufbau der Kinder, und ein Effekt liefe erst danach -- der erste
   * Aufbau stuende dann in der falschen Sprache. */
  setUiLang(settings.uiLang || detectUiLang());
  const nWords = vocab.filter((w: any) => w.pair === settings.pair).length;
  /* Alte gespeicherte Bereiche auf die neuen abbilden — sonst startet die App
   * nach dem Umbau auf einem Bereich, den es nicht mehr gibt. */
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem("vt_v1_tab") || "practice";
    return ({ lessons: "lists", words: "lists" } as Record<string, string>)[saved] || saved;
  });
  useEffect(() => { localStorage.setItem("vt_v1_tab", tab); }, [tab]);
  // V14: let other tabs (Stats insight lists) jump to a tab programmatically.
  useEffect(() => {
    const go = (e: any) => e?.detail && setTab(e.detail);
    window.addEventListener("vt-tab", go);
    return () => window.removeEventListener("vt-tab", go);
  }, []);

  /* Der Grundwortschatz erscheint von selbst, sobald eine Sprache
   * eingeschaltet ist -- statt hinter einem Willkommen-Dialog, den man
   * wegklickt, bevor man ihn gelesen hat. Die Aktivierung ist wiederhol-
   * sicher (activatedStarters) und legt eine ganz normale Wortliste an,
   * die sich loeschen laesst wie jede andere. Damit bleibt sie fuer eine
   * spaetere Bezahlfassung technisch abtrennbar. */
  useEffect(() => {
    if (!store.migriert) return;   // erst aufraeumen, dann fuellen
    for (const p of activePairs(settings)) {
      for (const s of STARTERS.filter((x) => x.pair === p.id)) {
        if (!isStarterActivated(settings, s.pair, s.stufe)) { activateStarter(store, s.pair, s.stufe); return; }
      }
    }
  }, [store.migriert, settings.activatedStarters, settings.activePairs]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the active pair was switched off in settings, move to the first one
  // that is still visible — otherwise the app would show a hidden language.
  useEffect(() => {
    const shown = activePairs(settings);
    if (!shown.some((p: any) => p.id === settings.pair)) setSettings({ pair: shown[0].id, selectedLists: [], statLists: [] });
  }, [settings.activePairs, settings.pair]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Aussehen: zwei getrennte Achsen am Wurzelelement. Das Farbschema gilt für
   * die ganze App, das Erscheinungsbild folgt der Tageszeit — deshalb verliert
   * ein Wechsel von hell auf dunkel das gewählte Schema nicht. */
  useEffect(() => {
    const r = document.documentElement.dataset;
    /* Die alten Beige-Schemata heißen jetzt anders. Wer „leinen" oder
     * „altpapier" gespeichert hat, bekommt das nachfolgende Schema statt
     * eines Bildschirms ohne Farben. */
    const ALT: Record<string, string> = { leinen: "tinte", altpapier: "graphit" };
    const gewaehlt = settings.scheme || "kladde";
    r.scheme = ALT[gewaehlt] || gewaehlt;
    r.appearance = settings.appearance || "auto";
    r.cardStyle = settings.cardStyle || "ruled";
    r.cardFont = settings.cardFont || "serif";
  }, [settings.scheme, settings.appearance, settings.cardStyle, settings.cardFont]);

  // V1: hide the fixed mobile bottom-nav while typing so the iOS keyboard
  // doesn't collide with it. Uses both focus events and the visualViewport API.
  useEffect(() => {
    const setTyping = (on: boolean) => document.body.classList.toggle("typing", on);
    const onFocusIn = (e: any) => { if (e.target?.matches?.("input,textarea")) setTyping(true); };
    const onFocusOut = () => setTyping(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    const vv = window.visualViewport;
    const onVV = () => { if (vv) document.body.classList.toggle("kbd-open", (window.innerHeight - vv.height) > 140); };
    vv?.addEventListener("resize", onVV);
    return () => { document.removeEventListener("focusin", onFocusIn); document.removeEventListener("focusout", onFocusOut); vv?.removeEventListener("resize", onVV); };
  }, []);

  // shared-list import: top-level modal, opened by the toolbar or a #share= link
  const [importOpen, setImportOpen] = useState(false);
  const [importToken, setImportToken] = useState<string | null>(null);
  const openImport = (token?: string | null) => { setImportToken(token ?? null); setImportOpen(true); };
  useEffect(() => {
    const m = location.hash.match(/#share=([A-Za-z0-9]+)/);
    if (m) {
      openImport(m[1]);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);

  return (
    <ImportContext.Provider value={{ openImport }}>
    <Startbild />
    <div className="app">
      <Header tab={tab} setTab={setTab} />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} className="tab" role="tab" aria-selected={tab === t.id && tab !== "settings"} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={17} />
            <span className="tab-full">{txt(t.label)}</span>
            {/* Hier stand die Zahl aller Woerter des Sprachpaars -- unbeschriftet,
                neben einem Reiter, der Listen verspricht. Wer zwei Listen mit je
                100 Woertern sah und oben 233 las, hielt das fuer einen Fehler.
                Dieselbe Zahl steht auf der Seite selbst unter "Gesamtbestand",
                dort beschriftet und mit Erklaerung daneben. Zweimal dieselbe
                Zahl, einmal ohne Auskunft, hilft niemandem. */}
          </button>
        ))}
      </div>
      {/* Ein eigener Rollbereich fuer den Inhalt. Vorher rollte das ganze
          Dokument, und damit half kein `height: 100%` weiter: die Wortliste
          konnte ihren Kopf nicht ueber den rollenden Zeilen festhalten,
          weil es keine begrenzte Hoehe gab, an der sie sich haette
          festmachen koennen. Jetzt begrenzt die Huelle die Hoehe, und ein
          Bereich darf seinen eigenen Rollbalken fuehren. */}
      <div className="app-body">
        {tab === "practice" && <Practice />}
        {tab === "plan" && <PlanTab />}
        {tab === "lists" && <WordList />}
        {tab === "stats" && <Stats />}
        {tab === "settings" && <SettingsTab />}
      </div>
      <ImportShareModal open={importOpen} initialToken={importToken} onClose={() => setImportOpen(false)} />
    </div>
    </ImportContext.Provider>
  );
}
