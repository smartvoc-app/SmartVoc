/* ===================================================================
 * Übungsplan (V16) — eigener Bereich statt Aufklappfenster im Kopf.
 *
 * Drei Entscheide, die die Form bestimmen:
 *
 * 1. SPRACHÜBERGREIFEND. Das alte Fenster zeigte nur das aktive Sprachpaar
 *    und verschwieg damit zwei Drittel der Termine. Ein Plan, der nicht alle
 *    Termine kennt, ist kein Plan.
 *
 * 2. FARBE HEISST BEHERRSCHUNG, NICHT SPRACHE. Der Kalender hat genau eine
 *    Farbachse — grün/gelb/rot nach Bereitschaft, mit Legende. Die Sprache
 *    steht als Kürzel daneben. Zwei Bedeutungen in einer Farbe wären wieder
 *    der Fehler, den --amber schon einmal gemacht hat.
 *
 * 3. EIN TAG KANN MEHRERE LISTEN TRAGEN. Der Tag zeigt die schlechteste
 *    Ampel (was zuerst Arbeit braucht), der Klick öffnet alle Listen dieses
 *    Tages einzeln.
 * =================================================================== */
import { useState, useMemo } from "react";
import { txt } from "../lib/i18n";
import { useStore } from "../store/StoreProvider";
import { Icon } from "../ui/Icon";
import { MasteryBar } from "../ui/MasteryBar";
import { PAIRS, activePairs } from "../lib/pairs";

import { retentionFor } from "../lib/fsrs";
import { toneLegend, listReadiness, TONE_KLASSE, ampelSatz } from "../lib/readiness";
import { getUiLang } from "../lib/i18n";

const DAY = 86400000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
/* Monats- und Wochentagsnamen kommen vom Gerät, nicht aus einer eigenen
 * Liste: sonst müsste jede Oberflächensprache hier zweimal gepflegt werden,
 * und die Schreibweisen wichen von denen des Datumsfelds daneben ab. */
const LOCALE = () => (getUiLang() === "en" ? "en-GB" : "de-CH");
const MONTH_NAME = (m: number) =>
  new Date(2021, m, 1).toLocaleDateString(LOCALE(), { month: "long" });
const WEEKDAY_NAMES = () => Array.from({ length: 7 }, (_, i) =>
  // 4. Januar 2021 war ein Montag.
  new Date(2021, 0, 4 + i).toLocaleDateString(LOCALE(), { weekday: "short" }));

export function PlanTab() {
  const store = useStore();
  const { vocab, stats, lists, settings } = store;
  const retention = retentionFor(settings);
  const today = startOfDay(Date.now());

  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  /* Der Plan zeigt zunächst ALLE Sprachen — das ist sein Zweck. Wer nur eine
   * sehen will, wählt sie hier; „Alle Sprachen" ist die Voreinstellung. */
  const [nurPair, setNurPair] = useState<string>("");
  /* Zwei Ansichten auf dieselben Daten. Der Kalender zeigt WANN, die Liste
   * zeigt WAS — mit „Ohne Termin", die im Raster keinen Platz hat. */
  const [ansicht, setAnsicht] = useState<"kalender" | "liste">("kalender");

  // Nur sichtbare Sprachen — eine abgeschaltete Sprache ist auch im Plan weg.
  const sichtbar = useMemo(() => activePairs(settings), [settings.activePairs]);
  const shownPairs = useMemo(
    () => new Set(sichtbar.filter((p: any) => !nurPair || p.id === nurPair).map((p: any) => p.id)),
    [sichtbar, nurPair]);

  /* Jede Liste mit Zieldatum wird ein Termin. Der Stand wird einmal gerechnet
   * und überall weiterverwendet — Tagesfarbe, Zeile und Balken zeigen
   * garantiert dieselbe Zahl. */
  const termine = useMemo(() => (lists || [])
    .filter((l: any) => l.dueDate && shownPairs.has(l.pair))
    .map((l: any) => {
      const st = listReadiness(l, vocab, stats, retention, settings);
      return {
        list: l, day: startOfDay(l.dueDate), ...st,
        daysLeft: Math.round((startOfDay(l.dueDate) - today) / DAY),
      };
    })
    .sort((a, b) => a.day - b.day || a.pct - b.pct),
    [lists, vocab, stats, retention, settings, shownPairs, today]);

  const ohneTermin = useMemo(() => (lists || [])
    .filter((l: any) => !l.dueDate && shownPairs.has(l.pair))
    .map((l: any) => {
      return { list: l, ...listReadiness(l, vocab, stats, retention, settings), daysLeft: null as any };
    })
    .filter((t) => t.prof.total > 0),
    [lists, vocab, stats, retention, settings, shownPairs]);

  const byDay = useMemo(() => {
    const m = new Map<number, typeof termine>();
    for (const t of termine) { const arr = m.get(t.day) || []; arr.push(t); m.set(t.day, arr); }
    return m;
  }, [termine]);

  /* Die schlechteste Ampel des Tages gewinnt: sie zeigt, was zuerst Arbeit
   * braucht. Ein Mittelwert würde eine rote Liste hinter einer grünen
   * verstecken. */
  const dayTone = (day: number) => {
    const arr = byDay.get(day);
    if (!arr || !arr.length) return null;
    if (arr.some((t) => t.tone === "bad")) return "bad";
    if (arr.some((t) => t.tone === "warn")) return "warn";
    return "ok";
  };

  // Gitter: Wochen ab Montag, immer volle Zeilen.
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7;                 // Mo = 0
    const start = startOfDay(first.getTime()) - lead * DAY;
    const days = Math.ceil((lead + new Date(cursor.y, cursor.m + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: days }, (_, i) => start + i * DAY);
  }, [cursor]);

  const shiftMonth = (d: number) => setCursor((c) => {
    const m = c.m + d;
    return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });
  const toThisMonth = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };

  const openList = openDay != null ? (byDay.get(openDay) || []) : termine.filter((t) => t.daysLeft >= 0);
  const openTitle = openDay != null
    ? new Date(openDay).toLocaleDateString(LOCALE(), { weekday: "long", day: "numeric", month: "long" })
    : txt("Alle kommenden Termine");

  /* Die Auswahl darf Sprachen mischen. Seit die Karte ihre Sprache und
   * Richtung selbst trägt, ist eine gemischtsprachige Runde kein Sonderfall
   * mehr — auch die Ablenker beim Multiple-Choice folgen der Karte. */
  const toggle = (id: string) => setPicked((p) =>
    p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const practise = (ids: string[]) => {
    if (!ids.length) return;
    // Beim Üben einer Liste aus einer anderen Sprache mitwechseln, sonst
    // stünde die Auswahl auf einem Vorrat, den die Oberfläche gar nicht zeigt.
    const first = (lists || []).find((l: any) => l.id === ids[0]);
    if (first && first.pair !== settings.pair) store.setSettings({ pair: first.pair });
    window.dispatchEvent(new CustomEvent("vt-practice-scope", { detail: ids.map((id) => "list:" + id) }));
    window.dispatchEvent(new CustomEvent("vt-tab", { detail: "practice" }));
  };
  const showStats = (l: any) => {
    store.setSettings({ statPair: l.pair, statLists: [l.id] });
    window.dispatchEvent(new CustomEvent("vt-tab", { detail: "stats" }));
  };
  /* Zwei Verben je Zeile, dieselben zwei fuer die Mehrfachauswahl -- sonst
   * kann man mehrere Listen zwar zusammen ueben, aber nicht zusammen
   * anschauen. */
  const showStatsMany = (ids: string[]) => {
    const erste = (lists || []).find((l: any) => l.id === ids[0]);
    store.setSettings({ statPair: erste ? erste.pair : settings.pair, statLists: ids });
    window.dispatchEvent(new CustomEvent("vt-tab", { detail: "stats" }));
  };

  /* Die Zeile sagt, was zu tun ist, nicht bloß einen Prozentsatz: „in 11
   * Tagen · 9 von 24 sitzen noch nicht". */
  const zeilenText = (t: any) => {
    const offen = t.prof.total - ((t.prof.dist.sitzt || 0) + (t.prof.dist.sitzt_fast || 0));
    const stand = offen === 0
      ? txt("alle {n} sitzen", { n: t.prof.total })
      : txt("{a} von {b} sitzen noch nicht", { a: offen, b: t.prof.total });
    return (t.daysLeft == null ? txt("läuft nebenher") : countdown(t.daysLeft)) + " · " + stand;
  };
  const planZeile = (t: any) => {
    const Pp = PAIRS[t.list.pair] || PAIRS["en-de"];
    const gewaehlt = picked.includes(t.list.id);
    return (
      <div key={t.list.id} className={"planrow" + (gewaehlt ? " picked" : "")}>
        {/* Hier stand ein Kontrollkaestchen -- die dritte Bauart fuer
            dieselbe Handlung, nach den Kaestchen in den Sprachen und der
            Hervorhebung in den Wortlisten. Es gilt eine: die Zeile
            antippen, die Auswahl zeigt sich am dunkleren Grund. */}
        <button className="planrow-main" onClick={() => toggle(t.list.id)} aria-pressed={gewaehlt}
          aria-label={txt("{name} auswählen", { name: t.list.name })}>
          <div className="planrow-top">
            <span className="planrow-name">{t.list.name}</span>
            <span className="planrow-lang">{Pp.short}</span>
          </div>
          <div className="planrow-sub">{zeilenText(t)}</div>
          {/* Miniansicht: Balken ohne Legende — die Legende steht im Kalender. */}
          <MasteryBar dist={t.prof.dist} total={t.prof.total} showLegend={false} />
        </button>
        {/* Beschriftet, nicht nur bezeichnet. Zwei Knoepfe, die nebeneinander
            die Zeile fuellen, muessen sagen was sie tun -- ein Zeichen allein
            in einem handbreiten Klotz ist ein Raetsel. */}
        <div className="planrow-acts">
          <button className="btn btn-sm btn-primary" onClick={() => practise([t.list.id])}>
            <Icon name="cards" size={14} /> {txt("Üben")}
          </button>
          <button className="btn btn-sm" onClick={() => showStats(t.list)}>
            <Icon name="chart" size={14} /> {txt("Statistik")}
          </button>
        </div>
      </div>
    );
  };

  const countdown = (d: number) =>
    d < 0 ? txt(-d === 1 ? "vor {n} Tag" : "vor {n} Tagen", { n: -d })
    : d === 0 ? txt("heute")
    : d === 1 ? txt("morgen")
    : txt("in {n} Tagen", { n: d });

  return (
    <div className="plantab">
      {/* Eine Überschrift, bevor irgendetwas gezeigt wird. Der Kalender stand
          ohne ein Wort da: wer die App zum ersten Mal öffnet, sieht farbige
          Tage und weiß nicht, wovon sie handeln. Der Name des Reiters unten
          in der Leiste ist keine Erklärung. */}
      <div className="tab-kopf">
        <div className="section-title">{txt("Übungsplan")}</div>
        <div className="muted">{txt("Welche Wortliste wann sitzen muss, und wie weit du bist. Nur Listen mit Zieldatum.")}</div>
      </div>

      <div className="ruest">
        <div className="seg seg-view" role="group" aria-label={txt("Ansicht")}>
          <button aria-pressed={ansicht === "kalender"} onClick={() => setAnsicht("kalender")}>
            <Icon name="calendar" size={14} /> {txt("Kalender")}
          </button>
          <button aria-pressed={ansicht === "liste"} onClick={() => { setAnsicht("liste"); setOpenDay(null); }}>
            <Icon name="list" size={14} /> {txt("Liste")}
          </button>
        </div>
        {sichtbar.length > 1 && (
          <label className="pill pill-sel">
            <Icon name="swap" size={15} />
            <span>{nurPair ? (PAIRS[nurPair]?.foreignLabel || nurPair) : txt("Alle Sprachen")}</span>
            <select value={nurPair} aria-label={txt("Sprache")} onChange={(e) => { setNurPair(e.target.value); setPicked([]); }}>
              <option value="">{txt("Alle Sprachen")}</option>
              {sichtbar.map((pp: any) => <option key={pp.id} value={pp.id}>{pp.foreignLabel} ⇄ {pp.nativeLabel}</option>)}
            </select>
          </label>
        )}
      </div>

      {ansicht === "kalender" && <div className="cal">
        <div className="cal-head">
          <button className="icon-btn" title={txt("Vorangegangener Monat")} onClick={() => shiftMonth(-1)}><Icon name="chevron-left" size={16} /></button>
          <button className="cal-title" onClick={toThisMonth} title={txt("Zum heutigen Monat")}>
            {MONTH_NAME(cursor.m)} {cursor.y}
          </button>
          <button className="icon-btn" title={txt("Nächster Monat")} onClick={() => shiftMonth(1)}><Icon name="chevron-right" size={16} /></button>
        </div>

        <div className="cal-grid cal-weekdays">
          {WEEKDAY_NAMES().map((w) => <div key={w} className="cal-wd">{w}</div>)}
        </div>
        <div className="cal-grid">
          {grid.map((day) => {
            const d = new Date(day);
            const inMonth = d.getMonth() === cursor.m;
            const tone = dayTone(day);
            const n = (byDay.get(day) || []).length;
            return (
              <button key={day}
                className={"cal-day" + (inMonth ? "" : " out") + (day === today ? " today" : "") + (day === openDay ? " open" : "") + (n ? " has" : "") + (tone ? " " + TONE_KLASSE[tone] : "")}
                onClick={() => { setOpenDay(day === openDay ? null : day); setPicked([]); }}
                disabled={!n && day !== today}
                aria-label={`${d.getDate()}. ${MONTH_NAME(d.getMonth())}${n ? " · " + txt(n === 1 ? "{n} Wortliste" : "{n} Wortlisten", { n }) : ""}`}>
                <span className="cal-num">{d.getDate()}</span>
                {/* Ausgeschrieben unter dem Datum, nicht als Zahl in der
                    Ecke: eine nackte 2 muss man erklaeren, „2 Listen" nicht.
                    Der ganze Tag traegt die Ampelfarbe -- bei mehreren
                    Listen die der schwaechsten. */}
                {n > 0 && <span className="cal-listen">{txt(n === 1 ? "{n} Liste" : "{n} Listen", { n })}</span>}
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          {toneLegend(settings).map((t) => (
            <span key={t.tone} className="cal-leg">
              <span className={"cal-leg-feld " + TONE_KLASSE[t.tone]} />{txt(t.label)}
            </span>
          ))}
        </div>
        <div className="cal-legend-satz">{ampelSatz(settings)}</div>
      </div>}

      <div className="plan-day">
        {ansicht === "kalender" ? (
          <>
            <div className="plan-day-head">
              <div className="grp">{openDay != null ? openTitle : txt("Anstehend")}
                {openDay == null && <span className="hint">— {txt("alle Termine")}</span>}
              </div>
              {openDay != null && <button className="btn btn-ghost btn-sm" onClick={() => { setOpenDay(null); setPicked([]); }}>{txt("Alle Termine")}</button>}
            </div>
            {openList.length === 0 ? (
              <div className="empty">
                <div className="big">{txt("Kein Termin")}</div>
                <div>{txt("Du kannst einer Wortliste unter „Wortlisten“ ein Zieldatum geben, dann erscheint sie hier.")}</div>
              </div>
            ) : <div className="col" style={{ gap: 8 }}>{openList.map(planZeile)}</div>}
          </>
        ) : (
          /* Listenansicht: dieselben Daten ohne Raster — dafür mit „Ohne
             Termin", die im Kalender keinen Platz hat. */
          <>
            {termine.filter((t) => t.daysLeft >= 0 && t.daysLeft <= 7).length > 0 && (
              <>
                <div className="grp">{txt("Diese Woche")}</div>
                <div className="col" style={{ gap: 8 }}>{termine.filter((t) => t.daysLeft >= 0 && t.daysLeft <= 7).map(planZeile)}</div>
              </>
            )}
            {termine.filter((t) => t.daysLeft > 7).length > 0 && (
              <>
                <div className="grp">{txt("Später")}</div>
                <div className="col" style={{ gap: 8 }}>{termine.filter((t) => t.daysLeft > 7).map(planZeile)}</div>
              </>
            )}
            {ohneTermin.length > 0 && (
              <>
                <div className="grp">{txt("Ohne Termin")}</div>
                <div className="col" style={{ gap: 8 }}>{ohneTermin.map(planZeile)}</div>
              </>
            )}
            {!termine.length && !ohneTermin.length && (
              <div className="empty"><div className="big">{txt("Kein Termin")}</div>
                <div>{txt("Du kannst einer Wortliste unter „Wortlisten“ ein Zieldatum geben, dann erscheint sie hier.")}</div></div>
            )}
          </>
        )}

        {termine.length > 1 && (
          <div className="quiet">{txt("Wörter aus der Liste mit dem näheren Termin kommen öfter dran")}</div>
        )}

        {picked.length > 1 && (
          <div className="plan-multi">
            <span>{txt("{n} Wortlisten ausgewählt", { n: picked.length })}</span>
            <button className="btn btn-sm btn-primary" onClick={() => practise(picked)}>
              <Icon name="cards" size={14} /> {txt("Gemeinsam üben")}
            </button>
            <button className="btn btn-sm" onClick={() => showStatsMany(picked)}>
              <Icon name="chart" size={14} /> {txt("Statistik")}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setPicked([])}>{txt("Auswahl aufheben")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
