import { useState } from "react";
import { txt } from "../lib/i18n";
import { useStore } from "../store/StoreProvider";
import { useToast } from "../ui/Toast";
import { Icon } from "../ui/Icon";
import { Bestaetigen } from "../ui/Bestaetigen";
import { UeberModal } from "./UeberModal";
import { RECOMMENDED } from "../lib/defaults";
import { useAuth } from "../sync/auth";
import { exportAllData, deleteLocalData } from "../lib/accountData";
import { deleteCloudAccount } from "../sync/share";
import { PAIRS, isLatinPair, mutterVon, MUTTERSPRACHE_VORGABE } from "../lib/pairs";
import { ANZEIGE_NAME, ANZEIGE_KURZ, modusVon, BEISPIELE, PHONETIK, FORMEN } from "../lib/anzeige";
import { DEFAULTS, previewStabilityGood, retentionFor } from "../lib/fsrs";
import { FsrsValuesModal } from "./FsrsValuesModal";
import { toneLegend, TONE_VAR } from "../lib/readiness";

/* ===================================================================
 * settingsTab.jsx — adjustable engine parameters with research-backed
 * ("Recommended") defaults from learning psychology.
 * =================================================================== */

function Toggle({ value, onChange }: any) {
  return (
    <button className={"switch" + (value ? " on" : "")} role="switch" aria-checked={value}
      onClick={() => onChange(!value)}><span className="knob" /></button>
  );
}

function Seg({ value, options, onChange }: any) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

function SliderControl({ value, min, max, step, onChange, fmt }: any) {
  return (
    <div className="set-slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="set-val">{fmt ? fmt(value) : value}</div>
    </div>
  );
}

/* Lebende Vorschau. Sie hängt an keinem eigenen Zustand: Schema, Erscheinungs-
 * bild, Kartentyp und Kartenschrift stehen als data-Attribute am <html>, also
 * zeigt dieselbe Auszeichnung wie beim Üben automatisch die aktuelle Wahl. */
function CardPreview() {
  return (
    <div className="set-preview" aria-hidden="true">
      <div className="set-preview-card">
        <div className="card-face">
          <span className="ruled-margin" />
          <div className="set-preview-word">le renard</div>
          <div className="set-preview-ex">Le renard traverse le jardin.</div>
        </div>
      </div>
    </div>
  );
}

/* Eine Einstellung als ZEILE: Name links, Wert rechts, Pfeil. Die Erklaerung
 * steht im Blatt, das sich beim Antippen oeffnet -- nicht darunter.
 *
 * Vorher trug jede Einstellung ihren ganzen Erklaertext auf der Seite. Das
 * war vollstaendig und unlesbar: zwanzig Einstellungen ergaben eine Wand aus
 * Absaetzen, durch die man scrollte, ohne etwas zu finden. Wer eine
 * Einstellung sucht, sucht ihren Namen; wer sie versteht, will den Wert
 * sehen; und nur wer zweifelt, braucht den Absatz.
 */
function ZeileWert({ titel, wert, atRec, onClick }: any) {
  return (
    <button className="setz" onClick={onClick}>
      <span className="setz-t">{titel}{atRec === false && <span className="setz-abw">{txt("geändert")}</span>}</span>
      <span className="setz-w">{wert}</span>
      <Icon name="arrowRight" size={14} />
    </button>
  );
}

/* Ein Schalter braucht kein Blatt -- an oder aus ist die ganze Auskunft.
 * Die Zeile darunter sagt, was er bewirkt, in fuenf Woertern. */
function ZeileSchalter({ titel, sub, value, onChange }: any) {
  return (
    <label className="setz setz-schalter">
      <span className="setz-t">{titel}{sub && <span className="setz-sub">{sub}</span>}</span>
      <Toggle value={value} onChange={onChange} />
    </label>
  );
}

/* Das Blatt zu einer Einstellung: Name, Erklaerung, Bedienelement, und die
 * Voreinstellung als Zeile darunter -- mit einem Knopf zurueck zu ihr. */
function Blatt({ offen, titel, desc, rec, atRec, onZuruecksetzen, onClose, children }: any) {
  if (!offen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="modal-title">{titel}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        {desc && <p className="said" style={{ marginTop: 0 }}>{desc}</p>}
        <div style={{ marginTop: 12 }}>{children}</div>
        {rec != null && (
          <div className="setz-rec">
            <span>{txt("Voreinstellung:")} <b>{rec}</b></span>
            {!atRec && onZuruecksetzen && (
              <button className="btn btn-ghost btn-sm" onClick={onZuruecksetzen}>
                <Icon name="refresh" size={13} /> {txt("Zurück zur Voreinstellung")}
              </button>
            )}
          </div>
        )}
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>{txt("Fertig")}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ title, desc, recLabel, atRec, children }: any) {
  return (
    <div className="set-row">
      <div className="set-info">
        <div className="set-title">{title}{atRec && <span className="rec-pill">{txt("✓ Voreinstellung")}</span>}</div>
        {desc && <div className="set-desc">{desc}</div>}
        {recLabel != null && !atRec && <div className="set-rec">{txt("Voreinstellung:")} <b>{recLabel}</b></div>}
      </div>
      <div className="set-control">{children}</div>
    </div>
  );

}

/* Drei Tempi statt eines Reglers von 3 bis 30. Die Zahl steht daneben --
 * wer sie kennt, findet sich zurecht; wer nicht, waehlt ein Wort. */
const TEMPI = [
  { n: 5,  name: "Gemächlich", sub: "wenig Neues, viel Wiederholung" },
  { n: 10, name: "Normal",     sub: "acht bis zwölf sind der belegte Normalwert" },
  { n: 20, name: "Zügig",      sub: "für Prüfungsphasen, dafür mehr Rückstau" },
];
const TEMPO_NAME = (n: number) => (TEMPI.find((t) => t.n === n) || { name: String(n) }).name;

const ARTIKEL: Record<string,string> = {
  "required-full": "Nötig, voller Abzug",
  "required-partial": "Nötig, kleiner Abzug",
  "optional": "Freiwillig. Wird nicht geprüft",
};

/* Dieselben Namen wie in Practice (MODE_NAME). „Auswählen" stand nur hier
 * und hiess im Übungsbildschirm längst Multiple-Choice -- und die
 * Einstellung darunter fragt nach „Vorschlägen bei Multiple-Choice". */
/* Womit die App aufmacht. „Weitermachen" nimmt die Woerter auf, die beim
 * letzten Mal offen blieben; die Runde selbst wird neu gebaut, damit kein
 * Lernstand ueber den Neustart geschleppt wird. */
const START: Record<string,string> = {
  heute: "Heute dran",
  weiter: "Zuletzt geübte Liste, weitermachen",
  neu: "Zuletzt geübte Liste, neu beginnen",
  leer: "Nichts vorwählen",
};

const MODUS: Record<string,string> = { type: "Eintippen", choice: "Multiple-Choice", recall: "Selbstkontrolle", memorize: "Nur durchblättern" };

export function SettingsTab() {
  const store = useStore();
  const toast = useToast();
  const auth = useAuth();
  const { settings, setSettings, resetSettings } = store;
  const R = RECOMMENDED;
  const set = (k, v) => setSettings({ [k]: v });

  // Konto & Daten (Phase 7)
  const [ueberOffen, setUeberOffen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [voreinstOpen, setVoreinstOpen] = useState(false);
  const [blatt, setBlatt] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const cloudActive = auth.configured && !!auth.user;
  const doExport = () => { exportAllData(new Date().toISOString()); toast("Daten exportiert", "download"); };
  const doDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "LÖSCHEN") return;
    setDelBusy(true); setDelErr("");
    try {
      if (cloudActive) await deleteCloudAccount();
      deleteLocalData();
      if (cloudActive) await auth.signOut();
      location.reload();
    } catch (e: any) {
      setDelBusy(false);
      setDelErr("Löschen fehlgeschlagen: " + (e?.message || e));
    }
  };
  // Language visibility. Purely a display filter — switching a language off
  // hides it everywhere but leaves its words untouched in the database.
  const activeIds: string[] = Array.isArray(settings.activePairs) ? settings.activePairs : Object.keys(PAIRS);
  const togglePair = (id: string) => {
    const next = activeIds.includes(id) ? activeIds.filter((x) => x !== id) : [...activeIds, id];
    if (!next.length) { toast("Mindestens eine Sprache muss aktiv bleiben", "x"); return; }
    setSettings({ activePairs: next });
  };

  /* Latein zeigt seine Zeile nur, wenn es zugeschaltet ist. */
  const lateinAktiv = activeIds.some((id) => isLatinPair(id));
  /* Die beiden alten Beige-Schemata heißen jetzt anders; wer sie
     gespeichert hat, sieht den Nachfolger ausgewaehlt statt gar nichts. */
  const SCHEMA_ALT: Record<string, string> = { leinen: "tinte", altpapier: "graphit" };
  const schemaJetzt = SCHEMA_ALT[settings.scheme] || settings.scheme || "kladde";

  const atR = (k) => settings[k] === R[k];
  const onOff = (b) => (b ? "On" : "Off");

  // F-SETTINGS-ADVANCED
  const [advOpen, setAdvOpen] = useState(false);
  const [fsrsOpen, setFsrsOpen] = useState(false);
  const cfgVal = (k: string) => (typeof settings[k] === "number" && isFinite(settings[k]) ? settings[k] : (DEFAULTS as any)[k]);
  const resetCfg = (k: string) => set(k, (DEFAULTS as any)[k]);
  const advRet = retentionFor(settings);
  const speed = cfgVal("learningSpeed");
  const haeltAtSpeed = previewStabilityGood(speed, advRet, 3);
  const haeltBase = previewStabilityGood(1, advRet, 3);
  /* Uebersetzt wird hier, nicht an den sechzehn Aufrufstellen: die Texte
   * gehoeren zum Regler, und ein vergessenes txt() an einer von sechzehn
   * Stellen faellt niemandem auf, bis die Oberflaeche auf Englisch steht
   * und zwei Absaetze deutsch bleiben. */
  const advParam = (k: string, title: string, desc: string, min: number, max: number, step: number, fmt?: any) => (
    <Field title={txt(title)} desc={txt(desc)} recLabel={fmt ? fmt((DEFAULTS as any)[k]) : (DEFAULTS as any)[k]} atRec={cfgVal(k) === (DEFAULTS as any)[k]}>
      <div className="col" style={{ gap: 6, width: "100%" }}>
        <SliderControl value={cfgVal(k)} min={min} max={max} step={step} onChange={(v: number) => set(k, v)} fmt={fmt} />
        {cfgVal(k) !== (DEFAULTS as any)[k] && <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-end" }} onClick={() => resetCfg(k)}><Icon name="refresh" size={13} /> {txt("Auf Voreinstellung")}</button>}
      </div>
    </Field>
  );

  return (
    <div className="settings">
      {/* Der Knopf „Auf die Voreinstellungen zurücksetzen" stand hier oben
          rechts als dreizeiliger Klotz neben dem Einleitungstext. Er gehört
          zu den Handlungen, die man nicht rückgängig machen kann — also
          nach unten zu den anderen, und mit einer Rückfrage davor. */}
      <div className="set-head">
        <div>
          <div className="section-title">{txt("Einstellungen")}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4, maxWidth: 540 }}>
            {txt("Die Voreinstellungen folgen der Lernpsychologie: verteiltes Üben, aktives Abrufen und wenige neue Wörter pro Tag. Du darfst alles ändern. Was du verstellt hast, ist markiert.")}
          </div>
        </div>
      </div>

      {/* Practice */}
      {/* Üben — als Zeilenliste wie im Entwurf. Name links, Wert rechts;
          die Erklärung öffnet sich als Blatt. Schalter bleiben in der Zeile,
          denn an oder aus ist die ganze Auskunft. */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="cards" size={16} /> {txt("Üben")}</div>
        <div className="set-body">

        <ZeileWert titel={txt("Wortliste beim Öffnen")} atRec={(settings.startAuswahl || "heute") === "heute"}
          wert={txt(START[settings.startAuswahl || "heute"])} onClick={() => setBlatt("start")} />
        <ZeileWert titel={txt("Antwortart")} atRec={atR("mode")}
          wert={txt(MODUS[settings.mode] || settings.mode)} onClick={() => setBlatt("mode")} />
        <ZeileWert titel={txt("Höchstens pro Tag")} atRec={atR("dailyGoal")}
          wert={txt("{n} Karten", { n: settings.dailyGoal })} onClick={() => setBlatt("dailyGoal")} />
        <ZeileWert titel={txt("Neue Wörter pro Tag")} atRec={atR("newPerDay")}
          wert={txt("{name} · {n} pro Tag", { name: txt(TEMPO_NAME(settings.newPerDay)), n: settings.newPerDay })}
          onClick={() => setBlatt("newPerDay")} />
        <ZeileWert titel={txt("Vorschläge bei Multiple-Choice")} atRec={atR("choicesCount")}
          wert={String(settings.choicesCount)} onClick={() => setBlatt("choicesCount")} />
        <ZeileWert titel={txt("Lernintensität")} atRec={(settings.targetRetention ?? 0.9) === 0.9}
          wert={txt({ locker: "Locker", normal: "Normal", intensiv: "Intensiv" }[
            (settings.targetRetention ?? 0.9) >= 0.95 ? "intensiv" : (settings.targetRetention ?? 0.9) <= 0.85 ? "locker" : "normal"])}
          onClick={() => setBlatt("intensity")} />
        {/* Aus zwei Ja/Nein-Schaltern sind zwei Zeilen mit drei Moeglichkeiten
            geworden: immer, nie, oder wählbar -- dann steht beim Üben ein
            Schalter unter der Karte. Damit gilt fuer beide Angaben dieselbe
            Bauart wie fuer jede andere Wahl in den Einstellungen. */}
        <ZeileWert titel={txt("Beispielsätze")} atRec={modusVon(settings, BEISPIELE) === "waehlbar"}
          wert={txt(ANZEIGE_NAME[modusVon(settings, BEISPIELE)])} onClick={() => setBlatt("beispiele")} />
        <ZeileWert titel={txt("Lautschrift")} atRec={modusVon(settings, PHONETIK) === "waehlbar"}
          wert={txt(ANZEIGE_NAME[modusVon(settings, PHONETIK)])} onClick={() => setBlatt("phonetik")} />
        <ZeileWert titel={txt("Formen")} atRec={modusVon(settings, FORMEN) === "waehlbar"}
          wert={txt(ANZEIGE_NAME[modusVon(settings, FORMEN)])} onClick={() => setBlatt("formen")} />
        <ZeileWert titel={txt("Lerntipp-Einblendungen")} atRec={atR("tipsFrequency")}
          wert={txt({ off: "Aus", occasional: "Gelegentlich", frequent: "Häufig" }[settings.tipsFrequency] || "Gelegentlich")}
          onClick={() => setBlatt("tips")} />
        {/* Latein hatte eine eigene Box für zwei Einstellungen. Zwei Zeilen
            rechtfertigen keinen Abschnitt — und wer kein Latein lernt, sah
            eine Box für etwas, das ihn nichts angeht. Jetzt eine Zeile
            unter „Üben", und nur, wenn Latein zugeschaltet ist. */}
        {lateinAktiv && (
          <ZeileWert titel={txt("Latein")}
            wert={txt(settings.latinMode === "L3" ? "L3 · volle Lernform" : "L2 · Grundform")}
            onClick={() => setBlatt("latein")} />
        )}
        </div>
      </div>

      <Blatt offen={blatt === "start"} titel={txt("Wortliste beim Öffnen")} onClose={() => setBlatt(null)}
        desc={txt("Womit die App aufmacht, wenn du sie startest. Du kannst oben jederzeit etwas anderes wählen.")}
        rec={txt("Heute dran")} atRec={(settings.startAuswahl || "heute") === "heute"}
        onZuruecksetzen={() => set("startAuswahl", "heute")}>
        <div className="list">
          {Object.keys(START).map((v) => (
            <button key={v} className={"li" + ((settings.startAuswahl || "heute") === v ? " sel" : "")}
              onClick={() => set("startAuswahl", v)}>
              <span className="g">{txt(START[v])}
                <div className="m">{txt({
                  heute: "Die Tagesliste. Fälliges und Neues, sinnvoll gemischt.",
                  weiter: "Dieselbe Liste wie zuletzt, und zwar mit den Wörtern, die noch offen waren.",
                  neu: "Dieselbe Liste wie zuletzt, aber von vorn.",
                  leer: "Nichts. Du wählst jedes Mal selbst.",
                }[v])}</div></span>
            </button>
          ))}
        </div>
      </Blatt>

      <Blatt offen={blatt === "mode"} titel={txt("Antwortart")} onClose={() => setBlatt(null)}
        desc={txt("Eintippen prägt am stärksten ein. Selbstkontrolle heißt: umdrehen und selbst beurteilen. Durchblättern zählt nicht für den Lernstand.")}
        rec={txt("Eintippen")} atRec={atR("mode")} onZuruecksetzen={() => set("mode", R.mode)}>
        <div className="list">
          {Object.keys(MODUS).map((v) => (
            <button key={v} className={"li" + (settings.mode === v ? " sel" : "")} onClick={() => set("mode", v)}>
              <span className="g">{txt(MODUS[v])}</span>
            </button>
          ))}
        </div>
      </Blatt>

      <Blatt offen={blatt === "dailyGoal"} titel={txt("Höchstens pro Tag")} onClose={() => setBlatt(null)}
        desc={txt("So viele Karten schlägt „Heute dran“ höchstens vor. Die Grenze verhindert, nach einer längeren Lernpause von zu vielen fälligen Wörtern erschlagen zu werden.")}
        rec={txt("{n} Karten", { n: R.dailyGoal })} atRec={atR("dailyGoal")} onZuruecksetzen={() => set("dailyGoal", R.dailyGoal)}>
        <SliderControl value={settings.dailyGoal} min={10} max={80} step={5} onChange={(v: number) => set("dailyGoal", v)} />
      </Blatt>

      {/* Worte statt einer Zahl: „wie viele neue Woerter pro Tag" kann
          niemand beantworten, der sich nicht selbst gut kennt. Drei Tempi mit
          der Zahl daneben beantworten dieselbe Frage in einer Sprache, die
          man ohne Selbstversuch versteht. */}
      <Blatt offen={blatt === "newPerDay"} titel={txt("Neue Wörter pro Tag")} onClose={() => setBlatt(null)}
        desc={txt("Wie viele ganz neue Wörter höchstens dazukommen. Das ist dein einziger Hebel auf die Menge: Die App plant jede Karte für sich und kennt kein Tagespensum. Weniger neue Wörter heißt also weniger Rückstau, nicht langsameres Lernen.")}
        rec={txt(TEMPO_NAME(R.newPerDay))} atRec={atR("newPerDay")} onZuruecksetzen={() => set("newPerDay", R.newPerDay)}>
        <div className="list">
          {TEMPI.map((t) => (
            <button key={t.n} className={"li" + (settings.newPerDay === t.n ? " sel" : "")} onClick={() => set("newPerDay", t.n)}>
              <span className="g">{txt(t.name)}<div className="m">{txt(t.sub)}</div></span>
              <span className="lchip-n">{t.n}</span>
            </button>
          ))}
        </div>
      </Blatt>

      <Blatt offen={blatt === "choicesCount"} titel={txt("Vorschläge bei Multiple-Choice")} onClose={() => setBlatt(null)}
        desc={txt("Wie viele Möglichkeiten beim Auswählen zur Wahl stehen.")}
        rec={String(R.choicesCount)} atRec={atR("choicesCount")} onZuruecksetzen={() => set("choicesCount", R.choicesCount)}>
        <SliderControl value={settings.choicesCount} min={2} max={6} step={1} onChange={(v: number) => set("choicesCount", v)} />
      </Blatt>

      <Blatt offen={blatt === "intensity"} titel={txt("Lernintensität")} onClose={() => setBlatt(null)}
        desc={txt("Wie gut die App ein Wort im Gedächtnis halten will, bevor sie es zur Wiederholung bringt. Intensiver heißt häufiger üben und sicherer behalten. Alles Weitere regelt die App.")}
        rec={txt("Normal")} atRec={(settings.targetRetention ?? 0.9) === 0.9}
        onZuruecksetzen={() => setSettings({ lernIntensity: "normal", targetRetention: 0.9 })}>
        <Seg value={(settings.targetRetention ?? 0.9) >= 0.95 ? "intensiv" : (settings.targetRetention ?? 0.9) <= 0.85 ? "locker" : "normal"}
          onChange={(v: string) => setSettings({ lernIntensity: v, targetRetention: { locker: 0.85, normal: 0.9, intensiv: 0.95 }[v] })}
          options={[{ v: "locker", label: "Locker" }, { v: "normal", label: "Normal" }, { v: "intensiv", label: "Intensiv" }]} />
      </Blatt>

      <Blatt offen={blatt === "tips"} titel={txt("Lerntipp-Einblendungen")} onClose={() => setBlatt(null)}
        desc={txt("Kurze Lerntipps tauchen an natürlichen Pausen auf (nie mitten in der Antwort) und lassen sich wegklicken.")}
        rec={txt("Gelegentlich")} atRec={atR("tipsFrequency")} onZuruecksetzen={() => set("tipsFrequency", R.tipsFrequency)}>
        <div className="list">
          {[["off", "Aus"], ["occasional", "Gelegentlich"], ["frequent", "Häufig"]].map(([v, l]) => (
            <button key={v} className={"li" + (settings.tipsFrequency === v ? " sel" : "")} onClick={() => set("tipsFrequency", v)}>
              <span className="g">{txt(l)}</span>
            </button>
          ))}
        </div>
      </Blatt>

      <Blatt offen={blatt === "ready"} titel={txt("Ampel der Wortlisten")} onClose={() => setBlatt(null)}
        desc={txt("Jede Wortliste trägt einen farbigen Punkt: bereit, auf Kurs oder im Rückstand. Hier legst du fest, wie viele Wörter einer Liste dafür sitzen müssen.")}
        rec={txt("bereit ab {g} %, auf Kurs ab {a} %", { g: 95, a: 70 })}
        atRec={atR("readyGreen") && atR("readyAmber")}
        onZuruecksetzen={() => setSettings({ readyGreen: 95, readyAmber: 70 })}>
        <div className="col" style={{ gap: 14 }}>
          <div>
            <div className="setz-t" style={{ marginBottom: 6 }}>{txt("«bereit» ab")}</div>
            <SliderControl value={settings.readyGreen ?? 95} min={80} max={100} step={1}
              onChange={(v: number) => set("readyGreen", Math.max(v, (settings.readyAmber ?? 70) + 1))} fmt={(v: number) => v + " %"} />
          </div>
          <div>
            <div className="setz-t" style={{ marginBottom: 6 }}>{txt("«auf Kurs» ab")}</div>
            <SliderControl value={settings.readyAmber ?? 70} min={40} max={94} step={1}
              onChange={(v: number) => set("readyAmber", Math.min(v, (settings.readyGreen ?? 95) - 1))} fmt={(v: number) => v + " %"} />
          </div>
        </div>
      </Blatt>

      {/* Antwortprüfung — dieselbe Zeilenform wie „Üben". Zwei Layouts auf
          einem Bildschirm waeren schlimmer als das alte allein. */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="check" size={16} /> {txt("Antwortprüfung")}</div>
        <div className="set-body">
        {/* Umgedreht gefragt: der Schalter heißt jetzt, was er tut, wenn er
            an ist — und an ist er ab Werk. Groß- und Kleinschreibung ist im
            Deutschen bedeutungstragend („das Essen" gegen „das essen"), und
            eine Rechtschreibung, die man nicht übt, lernt man nicht. */}
        <ZeileSchalter titel={txt("Groß- und Kleinschreibung zählt")} sub={txt("„hund“ statt „Hund“ ist ein Fehler")}
          value={!settings.lenientCase} onChange={(v: boolean) => set("lenientCase", !v)} />
        <ZeileSchalter titel={txt("Fast richtig zulassen")} sub={txt("ein Tippfehler zählt noch als fast richtig")}
          value={settings.acceptPartial} onChange={(v: boolean) => set("acceptPartial", v)} />
        <ZeileSchalter titel={txt("Umlaute und Akzente streng")} sub={txt("„grun“ statt „grün“ gilt dann als falsch")}
          value={settings.strictAccents} onChange={(v: boolean) => set("strictAccents", v)} />
        <ZeileWert titel={txt("Artikel (der/die/das)")} atRec={atR("articleMode")}
          wert={txt(ARTIKEL[settings.articleMode] || settings.articleMode)} onClick={() => setBlatt("artikel")} />
        </div>
      </div>

      {/* Übungsplan — die Ampel der Wortlisten gehört nicht unter „Üben":
          sie regelt nichts am Abfragen, sondern was der Übungsplan als
          bereit anzeigt. Eigener Abschnitt, eigener Name. */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="calendar" size={16} /> {txt("Übungsplan")}</div>
        <div className="set-body">
        <ZeileWert titel={txt("Ampel der Wortlisten")} atRec={atR("readyGreen") && atR("readyAmber")}
          wert={txt("bereit ab {g} %", { g: settings.readyGreen ?? 95 })}
          onClick={() => setBlatt("ready")} />
        </div>
      </div>

      <Blatt offen={blatt === "artikel"} titel={txt("Artikel (der/die/das)")} onClose={() => setBlatt(null)}
        desc={txt("Wie ein fehlender oder falscher Artikel bewertet wird. Nötig heißt: er muss stehen. Freiwillig heißt: er wird gar nicht angeschaut.")}
        rec={txt(ARTIKEL[R.articleMode])} atRec={atR("articleMode")} onZuruecksetzen={() => set("articleMode", R.articleMode)}>
        <div className="list">
          {Object.keys(ARTIKEL).map((v) => (
            <button key={v} className={"li" + (settings.articleMode === v ? " sel" : "")} onClick={() => set("articleMode", v)}>
              <span className="g">{txt(ARTIKEL[v])}</span>
            </button>
          ))}
        </div>
      </Blatt>

      {/* Sprachen — die Kontrollkästchen sind entfallen. Eine Auswahl sieht
          in dieser App überall gleich aus: dunklerer Grund und ein Rahmen in
          Schriftfarbe. Hier standen Kästchen, in den Wortlisten eine
          Hervorhebung — dieselbe Handlung in zwei Sprachen. */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="swap" size={16} /> {txt("Sprachen")} <span className="set-section-hint">{txt("zu- und abschaltbar")}</span></div>
        <div className="set-body">
        {/* Nur die Paare zur eigenen Muttersprache. Heute sind das alle,
            weil es nur eine gibt -- die Bedingung steht trotzdem hier, damit
            eine zweite Muttersprache spaeter nicht fremde Paare einblendet. */}
        {Object.values(PAIRS).filter((pp: any) => mutterVon(pp.id) === (settings.muttersprache || MUTTERSPRACHE_VORGABE)).map((pp: any) => {
          const an = activeIds.includes(pp.id);
          const n = store.vocab.filter((w: any) => w.pair === pp.id).length;
          return (
            <button key={pp.id} className={"li" + (an ? " sel" : "")} onClick={() => togglePair(pp.id)} aria-pressed={an}>
              <span className="g">{pp.foreignLabel} ⇄ {pp.nativeLabel}
                <div className="m">{n ? txt("{n} Wörter", { n }) : txt("noch keine Wörter")}</div>
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {([[ "beispiele", BEISPIELE, "Beispielsätze", "Die Beispielsätze eines Wortes stehen auf der Lösungsseite der Karte — der Satz in der Fremdsprache und darunter seine Übersetzung."],
         [ "phonetik", PHONETIK, "Lautschrift", "Die Lautschrift steht klein unter dem Fremdwort und sagt, wie man es ausspricht."],
         [ "formen", FORMEN, "Formen", "Die Formen, die man zum Wort mitlernt: bei Latein die Stammformen, sonst Singular und Plural oder die unregelmäßigen Formen. Sie stehen klein unter dem Fremdwort und werden nie abgefragt."]] as any[]).map(([schl, feld, titel, desc]) => (
        <Blatt key={schl} offen={blatt === schl} titel={txt(titel)} onClose={() => setBlatt(null)}
          desc={txt(desc)}
          rec={txt(ANZEIGE_NAME.waehlbar)} atRec={modusVon(settings, feld) === "waehlbar"}
          onZuruecksetzen={() => set(feld.modus, "waehlbar")}>
          <div className="list">
            {(["immer", "waehlbar", "nie"] as const).map((m) => (
              <button key={m} className={"li" + (modusVon(settings, feld) === m ? " sel" : "")}
                onClick={() => set(feld.modus, m)}>
                <span className="g">{txt(ANZEIGE_NAME[m])}<div className="m">{txt(ANZEIGE_KURZ[m])}</div></span>
              </button>
            ))}
          </div>
        </Blatt>
      ))}

      {/* Das Blatt zu Latein trägt beide Einstellungen: eine eigene Box für
          zwei Zeilen war zu viel Gehäuse für zu wenig Inhalt. */}
      <Blatt offen={blatt === "latein"} titel={txt("Latein")} onClose={() => setBlatt(null)}
        desc={txt("Gilt nur für Latein. L2: Die Karte zeigt die volle Lernform, abgefragt wird nur die Grundform. L3: Du gibst die vollständigen Stammformen ein, die Reihenfolge ist egal.")}
        rec={txt("L2 · Grundform")} atRec={atR("latinMode")} onZuruecksetzen={() => set("latinMode", R.latinMode)}>
        <div className="grp" style={{ paddingTop: 0 }}>{txt("Antwortart")}</div>
        {[["L2", "L2 · Grundform"], ["L3", "L3 · volle Lernform"]].map(([v, l]) => (
          <button key={v} className={"li" + (settings.latinMode === v ? " sel" : "")} onClick={() => set("latinMode", v)}>
            <span className="g">{txt(l)}</span>
          </button>
        ))}
        <div style={{ marginTop: 10 }}>
          <ZeileSchalter titel={txt("Längenstriche nicht nötig")} sub={txt("ā ē ī ō ū dürfen fehlen")}
            value={!!settings.latinMacronsOptional} onChange={(v: boolean) => set("latinMacronsOptional", v)} />
        </div>
      </Blatt>

      {/* Bedienung — was die App als Ganzes betrifft: ihre Sprache und ihr
          Aussehen. Vorher zwei Abschnitte nebeneinander, beide über die
          Oberfläche, keiner über das Lernen. Die Sprache ist eine Zeile wie
          jede andere; das Aussehen bleibt offen, weil man dort sehen will,
          was man wählt, und die Vorschau darunter hängt. */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="swatch" size={16} /> {txt("Bedienung")}</div>
        <div className="set-body">

        <ZeileWert titel={txt("Sprache der App")}
          wert={settings.uiLang === "de" ? "Deutsch" : settings.uiLang === "en" ? "Englisch" : txt("Gerätesprache")}
          onClick={() => setBlatt("uiLang")} />

        <div className="grp">{txt("Erscheinungsbild")} <span className="hint">— {txt("folgt dem Gerät")}</span></div>
        <div className="seg seg-voll">
          {[["auto", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(([v, l]) => (
            <button key={v} aria-pressed={settings.appearance === v} onClick={() => set("appearance", v)}>{txt(l)}</button>
          ))}
        </div>

        <div className="grp">{txt("Farbschema")} <span className="hint">— {txt("gilt für die ganze App")}</span></div>
        <div className="seg seg-voll">
          {[["kladde", "Kladde"], ["tinte", "Tinte"], ["graphit", "Graphit"]].map(([v, l]) => (
            <button key={v} aria-pressed={schemaJetzt === v} onClick={() => set("scheme", v)}>{txt(l)}</button>
          ))}
        </div>

        <div className="grp">{txt("Karte")} <span className="hint">— {txt("nur die Übungskarte")}</span></div>
        <div className="seg seg-voll">
          {[["ruled", "Liniert"], ["plain", "Blanko"], ["recycled", "Altpapier"], ["linen", "Leinen"]].map(([v, l]) => (
            <button key={v} aria-pressed={settings.cardStyle === v} onClick={() => set("cardStyle", v)}>{txt(l)}</button>
          ))}
        </div>

        <div className="grp">{txt("Kartenschrift")} <span className="hint">— {txt("nur die Übungskarte")}</span></div>
        <div className="seg seg-voll">
          {[["serif", "Serif"], ["arial", "Grotesk"], ["handwriting", "Handschrift"]].map(([v, l]) => (
            <button key={v} aria-pressed={settings.cardFont === v} onClick={() => set("cardFont", v)}>{txt(l)}</button>
          ))}
        </div>

        <CardPreview />

        {!(atR("appearance") && schemaJetzt === "kladde" && atR("cardStyle") && atR("cardFont")) && (
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: "center" }}
            onClick={() => { set("appearance", "auto"); set("scheme", "kladde"); set("cardStyle", "ruled"); set("cardFont", "serif"); }}>
            <Icon name="refresh" size={13} /> {txt("Zurück zum voreingestellten Aussehen")}
          </button>
        )}
        </div>
      </div>

      <Blatt offen={blatt === "uiLang"} titel={txt("Sprache der App")} onClose={() => setBlatt(null)}
        desc={txt("Die Sprache der Bedienung. Deine Wörter und Wortlisten bleiben davon unberührt.")}>
        {[["de", "Deutsch", ""], ["en", "Englisch", ""], ["", "Gerätesprache", "folgt der Einstellung des Telefons"]].map(([v, l, sub]) => (
          <button key={v || "auto"} className={"li" + ((settings.uiLang || "") === v ? " sel" : "")}
            onClick={() => set("uiLang", v || undefined)} aria-pressed={(settings.uiLang || "") === v}>
            <span className="g">{l === "Gerätesprache" ? txt(l) : l}{sub && <div className="m">{txt(sub)}</div>}</span>
          </button>
        ))}
      </Blatt>

      {/* Der Grundwortschatz hatte hier eine Box mit drei Zeilen „Aktiviert".
          Er kommt ohnehin von selbst, sobald eine Sprache zugeschaltet ist
          (siehe App.tsx) — die Box zeigte also nur an, dass etwas bereits
          geschehen war, und bot einen Knopf, den niemand mehr drücken kann. */}

      {/* F-SETTINGS-ADVANCED: collapsible expert section */}
      <div className="set-section">
        <button className="set-section-h set-section-toggle" onClick={() => setAdvOpen((o) => !o)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="gear" size={16} /> Erweiterte Einstellungen
          <span className="grow" />
          <span className="faint" style={{ fontSize: 12 }}>{advOpen ? "einklappen ▾" : "ausklappen ▸"}</span>
        </button>
        {advOpen && (
          <>
            <div className="muted" style={{ fontSize: 13, padding: "12px 18px 0", maxWidth: 560 }}>
              {txt("Für Neugierige. Mit den Voreinstellungen läuft die App gut. Alles hier ist freiwillig und jederzeit zurückzustellen.")}
            </div>

            <Field title={txt("Lernintensität")} atRec={cfgVal("learningSpeed") === DEFAULTS.learningSpeed}
              recLabel={txt("1,0× (normal)")}
              desc={txt("Wie schnell ein Wort an Festigkeit gewinnt, wenn du es richtig hast. Höher heißt: Die App nimmt schnellere Fortschritte an und fragt seltener nach — das ist riskanter. Niedriger heißt vorsichtiger und häufiger.")}>
              <div className="col" style={{ gap: 6, width: "100%" }}>
                <SliderControl value={speed} min={0.6} max={1.6} step={0.05} onChange={(v: number) => set("learningSpeed", v)} fmt={(v: number) => v.toFixed(2) + "×"} />
                <div className="set-rec" style={{ fontSize: 12.5 }}>{txt("Beispiel: 3× richtig hintereinander → hält")} <b>~{Math.round(haeltAtSpeed)} statt ~{Math.round(haeltBase)} Tage</b>.</div>
                {speed !== DEFAULTS.learningSpeed && <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-end" }} onClick={() => resetCfg("learningSpeed")}><Icon name="refresh" size={13} /> {txt("Auf Voreinstellung")}</button>}
              </div>
            </Field>

            {advParam("S2", "Schwelle „sitzt“ (Tage)", "Ab wie vielen Tagen erwarteter Haltbarkeit ein Wort als „sitzt“ (grün) gilt.", 7, 30, 1, (v: number) => `${v} T`)}
            {advParam("S1", "Schwelle „sitzt fast“ (Tage)", "Ab wie vielen Tagen Haltbarkeit ein Wort von „wackelt noch“ (rot) auf „sitzt fast“ (orange) wechselt.", 1, 10, 1, (v: number) => `${v} T`)}
            {advParam("MIN_REPS", "Wiederholungen bis „nicht mehr neu“", "Wie oft ein neues Wort richtig sein muss, bevor es aus der Stufe „neu / frisch“ herauswächst.", 1, 5, 1)}
            {advParam("PUFFER", "Vorlauf „bald fällig“ (Tage)", "Wie viele Tage vor dem eigentlichen Fälligkeitstag ein Wort schon als „bald fällig“ markiert wird.", 0, 7, 1, (v: number) => `${v} T`)}
            {advParam("D_LEECH", "Schwelle „hartnäckig“ (Zähigkeit)", "Ab welcher Schwierigkeit (0 bis 10) ein oft vergessenes Wort als „hartnäckig“ gilt. Die Fehleranzahl muss zusätzlich erreicht sein.", 4, 10, 1)}
            {advParam("LAPSE_LEECH", "Hartnäckig ab Fehlern", "Wie viele Rückfälle ein Wort braucht, um zusätzlich als „hartnäckig“ zu zählen.", 1, 8, 1)}
            {advParam("examWindowDays", "Prüfungs-Fenster (Tage)", "So viele Tage vor dem Zieldatum gilt für die Wörter dieser Liste das erhöhte Behaltensziel aus der nächsten Zeile. Ein höheres Ziel verkürzt den Abstand bis zur nächsten Abfrage, dadurch werden die Wörter früher fällig und kommen öfter dran.", 1, 7, 1, (v: number) => `${v} T`)}
            {advParam("examRetention", "Prüfungs-Sicherheit", "Das Behaltensziel, das innerhalb des Prüfungs-Fensters gilt. Es ersetzt dort das gewöhnliche Ziel aus der Lernintensität, solange der Termin nah ist.", 0.9, 0.99, 0.01, (v: number) => `${Math.round(v * 100)} %`)}

            <div className="set-subhead">{txt("Übungsrunde: wie oft welche Wörter drankommen")}</div>
            {advParam("W_ROT", "Gewicht: wackelnde Wörter", "Wie oft rote (wackelnde) Wörter in einer Runde drankommen. Höher heißt häufiger. Sie sollten zusammen mit den fälligen am meisten geübt werden.", 1, 10, 1)}
            {advParam("W_FAELLIG", "Gewicht: fällige Wörter", "Wie oft fällige (zur Auffrischung anstehende) Wörter drankommen.", 1, 10, 1)}
            {advParam("W_GRAU", "Gewicht: noch nie geübt", "Wie oft ganz neue, noch nie geübte Wörter drankommen.", 1, 10, 1)}
            {advParam("W_BLAU", "Gewicht: frisch gelernt", "Wie oft frisch gelernte Wörter drankommen.", 1, 10, 1)}
            {advParam("W_ORANGE", "Gewicht: sitzt fast", "Wie oft fast sitzende Wörter drankommen. Die brauchen am wenigsten.", 1, 10, 1)}
            {advParam("ZIEL_WACKELT", "Runden-Ziel: wackelnde Wörter", "Wie oft du ein wackelndes Wort in einer Runde richtig haben musst (mit Abstand), bis es als „für heute erledigt“ gilt.", 1, 5, 1, (v: number) => `${v}×`)}
            {advParam("ZIEL_NEU", "Runden-Ziel: frisch gelernt", "Wie oft ein frisch gelerntes Wort in einer Runde richtig sein muss.", 1, 5, 1, (v: number) => `${v}×`)}
            {advParam("ZIEL_NEU_NIE", "Runden-Ziel: noch nie geübt", "Wie oft ein ganz neues Wort in einer Runde richtig sein muss.", 1, 5, 1, (v: number) => `${v}×`)}
            {advParam("ZIEL_FAST", "Runden-Ziel: sitzt fast", "Wie oft ein fast sitzendes Wort in einer Runde richtig sein muss.", 1, 5, 1, (v: number) => `${v}×`)}
            {advParam("ZIEL_FAELLIG", "Runden-Ziel: fällige Wörter", "Wie oft ein fälliges Wort zur Auffrischung richtig sein muss.", 1, 5, 1, (v: number) => `${v}×`)}
            {advParam("STALE_MIN", "Pause bis Neustart (Minuten)", "Nach so vielen Minuten Pause beginnt die App die Übungsrunde frisch, damit sie zum aktuellen Stand passt.", 10, 120, 5, (v: number) => `${v} min`)}
            {advParam("GENUG_KARTEN", "Hinweis „Genug für heute“ ab", "Ab so vielen Karten in einer Runde schlägt die App eine Pause vor.", 10, 100, 5)}

            <Field title={txt("Das Gedächtnis-Modell")}
              desc={txt("Womit die App rechnet: das Behaltensziel, die abgeleiteten Schwellen und die 19 Modell-Gewichte. Nur zum Ansehen. Die App passt diese Werte nicht an dich an und zeichnet dafür auch nichts auf.")}>
              <button className="btn btn-ghost btn-sm" onClick={() => setFsrsOpen(true)}><Icon name="chart" size={13} /> {txt("Werte ansehen")}</button>
            </Field>
          </>
        )}
      </div>

      <FsrsValuesModal open={fsrsOpen} onClose={() => setFsrsOpen(false)} settings={settings} />

      {/* Konto & Daten */}
      <div className="set-section">
        <div className="set-section-h"><Icon name="download" size={16} /> {txt("Konto & Daten")}</div>
        <Field title={txt("Daten exportieren")} desc={txt("Lädt alle deine Wörter, Listen, Fortschritte und Einstellungen als Sicherungsdatei herunter (Format JSON).")}>
          <button className="btn btn-sm" onClick={doExport}><Icon name="download" size={15} /> {txt("Exportieren")}</button>
        </Field>
        <Field title={txt("Einstellungen zurücksetzen")} desc={txt("Setzt alle Einstellungen auf die Voreinstellungen zurück. Deine Wörter, Listen und Lernstände bleiben.")}>
          <button className="btn btn-sm btn-ghost" onClick={() => setVoreinstOpen(true)}><Icon name="refresh" size={15} /> {txt("Zurücksetzen")}</button>
        </Field>
        <Field title={txt("Fortschritt zurücksetzen")} desc={txt("Löscht Punkte und Verlauf. Deine Wörter und Wortlisten bleiben.")}>
          <button className="btn btn-sm btn-ghost" onClick={() => setResetOpen(true)}><Icon name="refresh" size={15} /> {txt("Zurücksetzen")}</button>
        </Field>
        <Field title={txt("Konto löschen")} desc={cloudActive ? txt("Löscht deine Daten endgültig, lokal und in der Cloud. Das kann nicht rückgängig gemacht werden.") : txt("Löscht alle Daten auf diesem Gerät. Das kann nicht rückgängig gemacht werden.")}>
          <button className="btn btn-sm" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={() => { setConfirmText(""); setDelErr(""); setDelOpen(true); }}>
            <Icon name="trash" size={15} /> Löschen
          </button>
        </Field>
      </div>

      <Bestaetigen offen={voreinstOpen} titel={txt("Einstellungen zurücksetzen")}
        text={txt("Alle Einstellungen gehen auf die Voreinstellungen zurück, auch das Aussehen und die erweiterten Werte. Deine Wörter, Listen und Lernstände bleiben unberührt.")}
        knopf={txt("Zurücksetzen")} onClose={() => setVoreinstOpen(false)}
        tun={() => { resetSettings(); setVoreinstOpen(false); toast(txt("Auf die Voreinstellungen zurückgesetzt"), "refresh"); }} />

      <Bestaetigen offen={resetOpen} titel={txt("Fortschritt zurücksetzen")}
        text={txt("Das löscht Punkte, Verlauf und die Tagesserie, und zwar in allen Sprachen. Deine Wörter und Wortlisten bleiben. Rückgängig machen lässt es sich nicht.")}
        knopf={txt("Zurücksetzen")} gefahr onClose={() => setResetOpen(false)}
        tun={() => { store.resetStats(); setResetOpen(false); toast(txt("Lernstand zurückgesetzt"), "refresh"); }} />

      <Bestaetigen offen={delOpen} titel={txt("Konto löschen")} gefahr
        text={<>
          {cloudActive
            ? txt("Das löscht deine Daten endgültig, auf diesem Gerät und in der Cloud. Danach wirst du abgemeldet.")
            : txt("Das löscht alle Vokabeln, Listen und Fortschritte auf diesem Gerät.")}
          {" "}{txt("Tippe LÖSCHEN zum Bestätigen")} <b style={{ color: "var(--ink)" }}>{txt("LÖSCHEN")}</b>.
        </>}
        knopf={txt("Endgültig löschen")} aus={delBusy || confirmText.trim().toUpperCase() !== "LÖSCHEN"}
        onClose={() => !delBusy && setDelOpen(false)} tun={doDelete}>
        <input className="field" style={{ marginTop: 12 }} placeholder={txt("LÖSCHEN")} value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)} autoFocus />
        {delErr && <div className="badge red" style={{ marginTop: 10 }}><span className="dot" />{delErr}</div>}
      </Bestaetigen>

      {/* Datenschutz und Impressum standen zwischen Datenexport und
          Kontoloeschung, also zwischen Handlungen -- dabei sind es Texte,
          die man einmal liest. Sie haben jetzt einen eigenen Ort. */}
      <button className="li li-ueber" onClick={() => setUeberOffen(true)}>
        <Icon name="book" size={15} />
        <span className="g">{txt("Über SmartVoc")}
          <div className="m">{txt("Datenschutz und Impressum")}</div></span>
        <Icon name="arrowRight" size={14} />
      </button>

      <UeberModal offen={ueberOffen} onClose={() => setUeberOffen(false)} />

      <div className="muted" style={{ fontSize: 11.5, textAlign: "center", padding: "4px 0 10px" }}>
        Settings are saved on this device and apply to both language tracks.
      </div>
    </div>
  );
}
