import { useState, useMemo } from "react";
import { txt } from "../lib/i18n";
import { useStore } from "../store/StoreProvider";
import { Icon } from "../ui/Icon";
import { wordsForSelection } from "../lib/engine";
import { deriveProfile, retentionFor, STUFE_ORDER } from "../lib/fsrs";
import { PAIRS, NATIVE, practiceable, isLatinPair } from "../lib/pairs";
import { latinHeadword } from "../lib/latin";
import { MasteryBar } from "../ui/MasteryBar";
import { listReadiness } from "../lib/readiness";
import { useAlsUnterkopf } from "../ui/ScreenHead";
import { WordDetailModal } from "./WordDetailModal";
import {
  ZEITRAEUME, type Zeitraum, sammleAntworten, antwortBilanz, fehlerarten,
  uebungstage, sitzungen, stundenprofil, neuErlernt, zuwachsVergleich,
  versucheBisSitzt, haltedauer, verteilungJeSprache, tageBisSitzt,
} from "../lib/statistik";

import { STUFE_FARBE as STUFE_TONE, STUFE_LANG as STUFE_LABEL } from "../lib/stufen";
const ZEITRAUM_NAME: Record<number, string> = { 7: "7 Tage", 30: "30 Tage", 90: "3 Monate" };

/* Eine Kennzahl: groß die Zahl mit ihrer Einheit, klein die Bedingung
 * darunter. Die Einheit gehört zur Zahl — „4" allein ist keine Aussage. */
const Kennzahl = ({ zahl, einheit, satz }: any) => (
  <div className="kpi"><b>{zahl}{einheit && <u>{einheit}</u>}</b><span>{satz}</span></div>
);

/* Liegende Balken: die Klassenbezeichnung muss mitgelesen werden, und quer
 * unter einer stehenden Säule ist sie bei dieser Schriftgrösse nicht lesbar. */
const LiegendeBalken = ({ klassen }: any) => (
  <div className="hbars">
    {klassen.map((k: any) => (
      <div key={k.label} className={"hb" + (k.istMedian ? " med" : "")}>
        <span className="hl">{k.label}</span>
        <span className="ht"><i style={{ width: k.breite + "%" }} /></span>
        <span className="hn">{k.n}</span>
      </div>
    ))}
  </div>
);

const StehendeBalken = ({ klassen, feld = "hoehe" }: any) => (
  <>
    <div className="bars">{klassen.map((k: any) => <i key={k.label} style={{ height: Math.max(3, k[feld]) + "%" }} />)}</div>
    <div className="barlab">{klassen.map((k: any) => <span key={k.label}>{k.label}</span>)}</div>
  </>
);

export function Stats() {
  const store = useStore();
  const { vocab, stats, meta, settings, lists } = store;

  const [zeitraum, setZeitraum] = useState<Zeitraum>(30);
  const [filter, setFilter] = useState("all");
  const [schirm, setSchirm] = useState<null | "woerter" | "hartnaeckig" | "erweitert">(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [sort, setSort] = useState({ key: "priority", dir: 1 });

  /* Der Umfang gilt für alles darunter und steht im Standard auf allen
   * Sprachen. Eine Sprache zu wählen heißt: alle ihre Listen. Einzelne
   * Listen wählt man nur, wenn man es ausdrücklich tut. */
  const statPair: string | null = settings.statPair || null;
  const ret = retentionFor(settings);
  const fgnOf = (w: any) => isLatinPair(w.pair) ? latinHeadword(w) : (w[(PAIRS[w.pair] || PAIRS["en-de"]).foreign] || "");

  const rows = useMemo(() => {
    const imUmfang = vocab.filter((w: any) => !statPair || w.pair === statPair);
    return wordsForSelection(imUmfang, stats, settings.statLists, settings.masteryCorrect).map((w: any) => {
      const s = stats[w.id];
      const seen = s ? s.seen : 0;
      const prof = deriveProfile(s?.fsrs, ret);
      const stufe = !practiceable(w) ? "noch_nicht_geuebt" : prof.stufe;
      const priority = stufe === "sitzt_schlecht" ? 0 : stufe === "noch_nicht_geuebt" ? 1 : stufe === "sitzt_fast" ? 2 : 3;
      return { w, seen, stufe, prof, priority };
    });
  }, [vocab, stats, settings.statLists, settings.masteryCorrect, statPair, ret]);

  const counts = useMemo(() => {
    const c: any = { sitzt: 0, sitzt_fast: 0, sitzt_schlecht: 0, neu: 0, noch_nicht_geuebt: 0 };
    rows.forEach((r: any) => c[r.stufe]++);
    return c;
  }, [rows]);

  const pairsImUmfang = useMemo(() => Array.from(new Set(rows.map((r: any) => r.w.pair || "en-de"))) as string[], [rows]);

  /* ---------------------------------------------------------- Der Zeitraum */
  const { antworten, gekappt } = useMemo(
    () => sammleAntworten(stats, rows.map((r: any) => r.w.id), zeitraum),
    [stats, rows, zeitraum]);

  const bilanz   = useMemo(() => antwortBilanz(antworten), [antworten]);
  const fehler   = useMemo(() => fehlerarten(antworten), [antworten]);
  const tage     = useMemo(() => uebungstage(antworten, zeitraum), [antworten, zeitraum]);
  const sitz     = useMemo(() => sitzungen(antworten), [antworten]);
  const stunden  = useMemo(() => stundenprofil(antworten), [antworten]);
  const erlernt  = useMemo(() => neuErlernt(meta.trends, pairsImUmfang, zeitraum), [meta.trends, pairsImUmfang, zeitraum]);
  const vergleich = useMemo(() => zuwachsVergleich(meta.trends, pairsImUmfang, zeitraum), [meta.trends, pairsImUmfang, zeitraum]);
  const versuche = useMemo(() => versucheBisSitzt(rows, stats), [rows, stats]);
  const halte    = useMemo(() => haltedauer(rows, stats), [rows, stats]);
  const tageSitzt = useMemo(() => tageBisSitzt(rows, stats), [rows, stats]);
  const jeSprache = useMemo(() => verteilungJeSprache(rows), [rows]);

  const geuebteWoerter = useMemo(() => new Set(antworten.map((a) => a.id)).size, [antworten]);
  /* „Neu in deinen Listen" braucht den Anlagezeitpunkt. Den tragen erst
   * Wörter, die ab jetzt dazukommen — für den Altbestand gibt es ihn nicht,
   * und eine geschätzte Zahl wäre schlechter als gar keine. */
  const neueWoerter = useMemo(() => {
    const von = Date.now() - zeitraum * 86400000;
    const mitDatum = rows.filter((r: any) => r.w.createdAt);
    if (!mitDatum.length) return null;
    return mitDatum.filter((r: any) => r.w.createdAt >= von).length;
  }, [rows, zeitraum]);

  const hartnaeckig = useMemo(() => rows.filter((r: any) => r.prof.istLeech), [rows]);

  const umfangName = settings.statLists.length
    ? (settings.statLists.length > 1 ? txt("{n} Wortlisten", { n: settings.statLists.length })
      : ((lists.find((l: any) => l.id === settings.statLists[0]) || {}).name || txt("Auswahl")))
    : statPair ? (PAIRS[statPair]?.foreignLabel || statPair) : txt("Alles");

  const setzeUmfang = (p: string | null, ls: string[]) => {
    store.setSettings({ statPair: p, statLists: ls });
    setPickerOpen(false);
  };

  /* ================================================== Eigene Bildschirme */
  if (schirm === "woerter") {
    return <AlleWoerter rows={rows} stats={stats} fgnOf={fgnOf} filter={filter} setFilter={setFilter}
      sort={sort} setSort={setSort} counts={counts}
      onWort={setDetail} detail={detail} onZurueck={() => setSchirm(null)} />;
  }
  if (schirm === "hartnaeckig") {
    return <HartnaeckigListe rows={hartnaeckig} stats={stats} fgnOf={fgnOf} onZurueck={() => setSchirm(null)} />;
  }
  if (schirm === "erweitert") {
    return <Erweitert settings={settings} tageSitzt={tageSitzt} halte={halte} onZurueck={() => setSchirm(null)} />;
  }

  const mehrsprachig = jeSprache.length > 1;

  return (
    <div className="statstab">
      {/* 1 — Umfang. Eine Pille, die alles darunter bestimmt. */}
      <div className="ruest">
        <button className="pill pill-on" onClick={() => setPickerOpen((o) => !o)}>
          <Icon name="list" size={15} />
          <span>{umfangName}</span>
          <span className="pill-n">{rows.length}</span>
        </button>
      </div>
      {pickerOpen && (
        <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="modal scope-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{txt("Worüber soll gerechnet werden?")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setPickerOpen(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="scope-sheet-body">
              <div className="grp">{txt("Sprache")}</div>
              <div className="list">
                <button className={"li" + (!statPair ? " sel" : "")} onClick={() => setzeUmfang(null, [])}>
                  <span className="g">{txt("Alles")}<div className="m">{txt("alle Sprachen, alle Wortlisten")}</div></span>
                </button>
                {(Array.from(new Set(vocab.map((w: any) => w.pair || "en-de"))) as string[]).map((p) => (
                  <button key={p} className={"li" + (statPair === p && !settings.statLists.length ? " sel" : "")}
                    onClick={() => setzeUmfang(p, [])}>
                    <span className="g">{PAIRS[p]?.foreignLabel || p}<div className="m">{txt("alle Wortlisten dieser Sprache")}</div></span>
                  </button>
                ))}
              </div>
              {statPair && (
                <>
                  <div className="grp">{txt("Einzelne Wortlisten")} <span className="hint">— {txt("mehrere möglich")}</span></div>
                  <div className="list">
                    {lists.filter((l: any) => l.pair === statPair).map((l: any) => {
                      const an = settings.statLists.includes(l.id);
                      const st = listReadiness(l, vocab, stats, ret, settings);
                      return (
                        <button key={l.id} className={"li" + (an ? " sel" : "")}
                          onClick={() => setzeUmfang(statPair, an ? settings.statLists.filter((x: string) => x !== l.id) : [...settings.statLists, l.id])}>
                          <span className="g">{l.name}
                            {st.total > 0 && <div className="m">{txt("{n} Wörter", { n: st.total })} · {txt("{p} % sitzen ganz oder fast", { p: st.pct })}</div>}
                          </span>
                          {st.total > 0 && <span className="ltab-dot" style={{ background: st.farbe, marginRight: 0, alignSelf: "center" }} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!rows.length ? (
        <div className="empty"><div className="big">{txt("Noch keine Wörter")}</div><div>{txt("In dieser Auswahl ist noch nichts")}</div></div>
      ) : (
        <>
          <MasteryBar dist={counts} total={rows.length}
            onSegment={(k: string) => { setFilter(k); setSchirm("woerter"); }} />
          {mehrsprachig && (
            <div className="langrows">
              {jeSprache.map((s) => {
                const bereit = s.gesamt ? Math.round(((s.dist.sitzt || 0) + (s.dist.sitzt_fast || 0)) / s.gesamt * 100) : 0;
                return (
                  <div className="langrow" key={s.pair}>
                    <span className="lg">{(PAIRS[s.pair]?.short || s.pair).toUpperCase()}</span>
                    <span className="band">
                      {STUFE_ORDER.map((k) => {
                        const w = s.gesamt ? (s.dist[k] || 0) / s.gesamt * 100 : 0;
                        return w > 0 ? <i key={k} style={{ width: w + "%", background: STUFE_TONE[k] }} /> : null;
                      })}
                    </span>
                    <span className="pc">{bereit} %</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="quiet">{txt("Eintrag der Legende antippen zeigt diese Wörter")}</div>

          {/* 2 — Fortschritt: ein Umschalter für alles darunter. */}
          <div className="grp"><Icon name="chart" size={14} />{txt("Fortschritt")}</div>
          <div className="seg">
            {ZEITRAEUME.map((z) => (
              <button key={z} aria-pressed={z === zeitraum} onClick={() => setZeitraum(z)}>{txt(ZEITRAUM_NAME[z])}</button>
            ))}
          </div>

          <div className="facts">
            {neueWoerter != null && (
              <div className="fact">
                <span className="ic"><Icon name="plus" size={14} /></span>
                <b>+{neueWoerter}</b><span>{txt("neu in deinen Listen")}</span>
              </div>
            )}
            <div className="fact">
              <span className="ic"><Icon name="list" size={14} /></span>
              <b>{geuebteWoerter}</b><span>{txt("Wörter geübt")}</span>
            </div>
            {erlernt.belegt && (
              <div className="fact grow">
                <span className="ic"><Icon name="target" size={14} /></span>
                <b>{erlernt.zuwachs >= 0 ? "+" : ""}{erlernt.zuwachs}</b><span>{txt("neu erlernt")}</span>
              </div>
            )}
            <div className="fact">
              <span className="ic"><Icon name="chart" size={14} /></span>
              <b>{bilanz.gesamt}</b><span>{txt("Antworten gegeben")}</span>
            </div>
            <div className="fact wide">
              <span className="ic"><Icon name="calendar" size={14} /></span>
              <b><span className="klein">{txt("an")} </span>{tage.anzahl}<span className="klein"> {txt("von")} {tage.von}</span></b>
              <span>{txt("Tagen geübt")}</span>
              <div className="days">{tage.punkte.map((an, i) => <i key={i} className={an ? "on" : ""} />)}</div>
            </div>
          </div>

          {vergleich.belegt && vergleich.jetzt > vergleich.davor && (
            <div className="cheer">
              <Icon name="target" size={15} />
              <span>{txt((vergleich.jetzt - vergleich.davor) === 1
                ? "1 Wort mehr als im Zeitraum davor. Es geht aufwärts."
                : "{n} Wörter mehr als im Zeitraum davor. Es geht aufwärts.",
                { n: vergleich.jetzt - vergleich.davor })}</span>
            </div>
          )}

          {/* 3 — Kennzahlen */}
          {bilanz.gesamt > 0 ? (
            <>
              <div className="grp"><Icon name="chart" size={14} />{txt("Im gewählten Zeitraum")} <em>— {txt(ZEITRAUM_NAME[zeitraum])}</em></div>

              <div className="card">
                <h4><Icon name="target" size={14} />{txt("Wie deine Antworten ausgehen")}</h4>
                <div className="donut">
                  <Donut anteil={bilanz.anteil} />
                  <div className="dlist">
                    <span><u style={{ background: "var(--ok)" }} /><b>{bilanz.richtig}</b> {txt("richtig")}</span>
                    <span><u style={{ background: "var(--bad)" }} /><b>{bilanz.falsch}</b> {txt("falsch")}</span>
                    <span className="faint">{txt("Nur der Akzent daneben zählt als Treffer")}</span>
                  </div>
                </div>
              </div>

              {versuche.n > 0 && (
                <div className="card">
                  <h4><Icon name="target" size={14} />{txt("Wie schnell etwas sitzt")}</h4>
                  <Kennzahl zahl={versuche.median} einheit={txt("Versuche")}
                    satz={txt("oder weniger, bis die Hälfte deiner Wörter sitzt")} />
                  <LiegendeBalken klassen={versuche.klassen} />
                  {hartnaeckig.length > 0 && (
                    <p className="said faint">{txt(hartnaeckig.length === 1
                      ? "Gezählt sind nur Wörter, die heute sitzen. Dazu kommt {n} Wort, das trotz vieler Versuche nicht sitzt. Es steht unten unter „Hartnäckig“."
                      : "Gezählt sind nur Wörter, die heute sitzen. Dazu kommen {n} Wörter, die trotz vieler Versuche nicht sitzen. Sie stehen unten unter „Hartnäckig“.",
                      { n: hartnaeckig.length })}</p>
                  )}
                </div>
              )}

              {sitz.anzahl > 0 && (
                <div className="card">
                  <h4><Icon name="clock" size={14} />{txt("Wie lange du übst")}</h4>
                  <Kennzahl zahl={Math.round(sitz.schnittMinuten)} einheit={txt("Minuten")}
                    satz={txt("je Sitzung, {n} Sitzungen im Zeitraum", { n: sitz.anzahl })} />
                  <div className="bars mins">
                    {sitz.sitzungen.map((x, i) => (
                      <i key={i} style={{ height: Math.max(4, Math.round(x.minuten / (sitz.maxMinuten || 1) * 100)) + "%" }} />
                    ))}
                    <span className="avgline" style={{ bottom: Math.round(sitz.schnittMinuten / (sitz.maxMinuten || 1) * 100) + "%" }}>
                      <b>{txt("Schnitt")}</b>
                    </span>
                  </div>
                  <div className="barlab">
                    <span style={{ textAlign: "left" }}>{txt("früher")}</span>
                    <span style={{ textAlign: "right" }}>{txt("zuletzt")}</span>
                  </div>
                </div>
              )}

              {stunden.belastbar && stunden.beste && (
                <div className="card">
                  <h4><Icon name="clock" size={14} />{txt("Deine beste Lernzeit")}</h4>
                  <div className="bars">
                    {stunden.bloecke.map((b) => (
                      <i key={b.label} style={{ height: Math.max(3, b.anteil) + "%", opacity: b.n >= 20 ? .85 : .3 }} />
                    ))}
                  </div>
                  <div className="barlab">{stunden.bloecke.map((b) => <span key={b.label}>{b.label}</span>)}</div>
                  <p className="said">{txt("Zwischen {zeit} Uhr triffst du am besten: {a} % richtig, gegenüber {b} % zu deiner schwächsten Zeit.",
                    { zeit: stunden.beste.label, a: stunden.beste.anteil, b: stunden.schwaechste?.anteil ?? 0 })}</p>
                </div>
              )}

              {/* Stolpersteine: die Zahl groß links, dann der Balken. Nichts
                  daran ist anzutippen — welche Wörter es waren, hilft nicht. */}
              {fehler.gesamt > 0 && (
                <>
                  <div className="grp"><Icon name="flame" size={14} />{txt("Deine Stolpersteine")} <em>— {txt("woran es scheitert")}</em></div>
                  <div className="card">
                  <div className="quiet links">{txt("{n} deiner {g} Antworten saßen nicht auf Anhieb. Das war der Grund:", { n: fehler.gesamt, g: bilanz.gesamt })}</div>
                  <div className="stumble">
                    {fehler.zeilen.map((z) => (
                      <div className="st" key={z.k}>
                        <b>{z.n}</b>
                        <div className="sg">
                          <span className="sl">{txt(z.name)} <em>— {txt(z.was)}</em></span>
                          <span className="sbar"><i style={{ width: z.breite + "%", background: z.gilt === "fast" ? "var(--warn)" : "var(--bad)" }} /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="quiet">{txt("In diesem Zeitraum wurde noch nicht geübt.")}</div>
          )}

          {/* Hartnäckige als fortlaufende Linsen, nicht als Liste. */}
          {hartnaeckig.length > 0 && (
            <>
              <div className="grp"><Icon name="flame" size={14} />{txt("Hartnäckig")} <em>— {txt("oft geübt, immer wieder vergessen")}</em></div>
              <div className="card">
                <div className="lenses">
                  {hartnaeckig.slice(0, 12).map((r: any) => (
                    <span key={r.w.id} className={"lens" + ((r.prof.lapses || 0) >= 5 ? " hot" : "")}>{fgnOf(r.w)}</span>
                  ))}
                </div>
                {hartnaeckig.length > 12 && (
                  <button className="li" style={{ marginTop: 10, width: "100%" }} onClick={() => setSchirm("hartnaeckig")}>
                    <span className="g">{txt("Alle {n} ansehen", { n: hartnaeckig.length })}</span>
                    <Icon name="arrowRight" size={14} />
                  </button>
                )}
              </div>
            </>
          )}

          <div className="grp"><Icon name="list" size={14} />{txt("Nachschauen")}</div>
          <div className="list">
            <button className="li" onClick={() => { setFilter("all"); setSchirm("woerter"); }}>
              <Icon name="list" size={14} />
              <span className="g">{txt("Alle Wörter mit Lernstand")}<div className="m">{txt("Tabelle, sortierbar")}</div></span>
              <Icon name="arrowRight" size={14} />
            </button>
            <button className="li" onClick={() => setSchirm("erweitert")}>
              <Icon name="target" size={14} />
              <span className="g">{txt("Erweitert")}<div className="m">{txt("Behaltensziel und Haltedauer")}</div></span>
              <Icon name="arrowRight" size={14} />
            </button>
          </div>

          {gekappt > 0 && zeitraum === 90 && (
            <div className="quiet">{txt("Bei {n} oft geübten Wörtern reicht der gespeicherte Verlauf nicht 3 Monate zurück. Die Zahlen sind dort eher zu niedrig.", { n: gekappt })}</div>
          )}
        </>
      )}

      <WordDetailModal open={!!detail} word={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

/* Zwei Felder, kein drittes: richtig und falsch. */
const Donut = ({ anteil }: { anteil: number }) => {
  const u = 2 * Math.PI * 42;
  const gut = u * anteil / 100;
  return (
    <svg viewBox="0 0 110 110" width="96" height="96" role="img"
      aria-label={txt("{p} Prozent richtig", { p: anteil })}>
      <circle cx="55" cy="55" r="42" fill="none" stroke="var(--bg-2)" strokeWidth="15" />
      <circle cx="55" cy="55" r="42" fill="none" stroke="var(--bad)" strokeWidth="15"
        strokeDasharray={`${u - gut} ${gut}`} transform={`rotate(${-90 + anteil * 3.6} 55 55)`} />
      <circle cx="55" cy="55" r="42" fill="none" stroke="var(--ok)" strokeWidth="15"
        strokeDasharray={`${gut} ${u - gut}`} transform="rotate(-90 55 55)" />
      <text x="55" y="52" textAnchor="middle" className="donut-n">{anteil} %</text>
      <text x="55" y="67" textAnchor="middle" className="donut-l">{txt("richtig")}</text>
    </svg>
  );
};

/* ==================================================== Alle Wörter (Bildschirm) */
function AlleWoerter({ rows, stats, fgnOf, filter, setFilter, sort, setSort, counts, onWort, detail, onZurueck }: any) {
  useAlsUnterkopf(txt("Alle Wörter"), onZurueck);
  /* Die Erklaerzeile unter der Tabelle sagt, was die Spalten bedeuten. Das
   * Fragezeichen an "Treffer" sagt zusaetzlich, was gezaehlt wird -- die
   * Feinheit, dass ein fehlender Akzent als Treffer gilt, passt in keine
   * Legende und ueberrascht sonst genau die, die nachrechnen. */
  const [trefferInfo, setTrefferInfo] = useState(false);
  const view = useMemo(() => {
    let l = rows.filter((r: any) => filter === "all" || r.stufe === filter);
    l = [...l].sort((a: any, b: any) => {
      if (sort.key === "word") { const av = fgnOf(a.w).toLowerCase(), bv = fgnOf(b.w).toLowerCase(); return av < bv ? -sort.dir : av > bv ? sort.dir : 0; }
      if (sort.key === "haelt") return ((a.prof.haeltTage || 0) - (b.prof.haeltTage || 0)) * sort.dir;
      if (sort.key === "treffer") return (treffer(stats, a) - treffer(stats, b)) * sort.dir;
      return (a.priority - b.priority) * sort.dir;
    });
    return l;
  }, [rows, filter, sort]);

  const sortiere = (key: string) => setSort((s: any) => s.key === key ? { key, dir: -s.dir } : { key, dir: key === "word" ? 1 : -1 });

  return (
    <div className="statstab">
      <div className="ruest">
        <button className={"pill" + (filter === "all" ? " pill-on" : "")} onClick={() => setFilter("all")}>
          {txt("Alles")}<span className="pill-n">{rows.length}</span>
        </button>
        {STUFE_ORDER.filter((k) => counts[k] > 0).map((k) => (
          <button key={k} className={"pill" + (filter === k ? " pill-on" : "")} onClick={() => setFilter(filter === k ? "all" : k)}>
            {txt(STUFE_LABEL[k])}<span className="pill-n">{counts[k]}</span>
          </button>
        ))}
      </div>

      {trefferInfo && (
        <div className="infonote">{txt("Als Treffer zählt jede Antwort, die nicht ganz daneben war. Ein fehlender Akzent oder ein Buchstabendreher zählt also auch. Ein Wort, das noch nie abgefragt wurde, zeigt einen Strich.")}</div>
      )}

      <table className="wtable">
        <thead><tr>
          <th onClick={() => sortiere("word")}>{txt("Wort")}</th>
          <th>{txt("Stufe")}</th>
          <th onClick={() => sortiere("haelt")}>{txt("hält")}</th>
          <th>{txt("dran am")}</th>
          <th onClick={() => sortiere("treffer")}>{txt("Treffer")}
            <span className="info" role="button" tabIndex={0} aria-label={txt("Was zählt als Treffer?")}
              onClick={(e) => { e.stopPropagation(); setTrefferInfo((o) => !o); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); setTrefferInfo((o) => !o); } }}>?</span>
          </th>
        </tr></thead>
        <tbody>
          {view.map((r: any) => (
            <tr key={r.w.id} onClick={() => onWort(r.w)}>
              <td className="w">{fgnOf(r.w)}<div className="w-de">{r.w[NATIVE]}</div></td>
              <td><span className="dot" style={{ background: STUFE_TONE[r.stufe] }} />{txt(STUFE_LABEL[r.stufe])}</td>
              <td>{r.prof.haeltTage ? txt("{n} Tage", { n: Math.round(r.prof.haeltTage) }) : "—"}</td>
              <td>{dranAm(r.prof)}</td>
              <td>{r.seen ? treffer(stats, r) + " %" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!view.length && <div className="empty"><div className="big">{txt("Nichts in dieser Stufe")}</div><div>{txt("Oben eine andere Stufe wählen")}</div></div>}

      <div className="legendline">
        <b>{txt("hält")}</b> — {txt("wie viele Tage das Wort im Moment sitzt, bevor es wiederkommt.")}{" "}
        <b>{txt("dran am")}</b> — {txt("wann die App es das nächste Mal zeigt.")}{" "}
        <b>{txt("Treffer")}</b> — {txt("Anteil richtiger Antworten bei diesem Wort.")}
      </div>

      <WordDetailModal open={!!detail} word={detail} onClose={() => onWort(null)} />
    </div>
  );
}

const treffer = (stats: any, r: any) => {
  const s = stats[r.w.id]; if (!s || !s.seen) return 0;
  return Math.round(((s.correctCount || 0) + (s.almostCount || 0)) / s.seen * 100);
};
const dranAm = (p: any) => {
  if (p.due == null) return "—";
  const t = Math.round((p.due - Date.now()) / 86400000);
  return t < 0 ? txt("jetzt") : t === 0 ? txt("heute") : t === 1 ? txt("morgen") : txt("in {n} Tagen", { n: t });
};

/* =============================================== Hartnäckig (Bildschirm) */
function HartnaeckigListe({ rows, stats, fgnOf, onZurueck }: any) {
  useAlsUnterkopf(txt("Hartnäckig"), onZurueck);
  const gruppen = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const r of rows) { const p = r.w.pair || "en-de"; (g[p] = g[p] || []).push(r); }
    return Object.keys(g).map((p) => ({
      pair: p,
      woerter: g[p].sort((a, b) => (b.prof.lapses || 0) - (a.prof.lapses || 0)),
    })).sort((a, b) => b.woerter.length - a.woerter.length);
  }, [rows]);

  return (
    <div className="statstab">
      <p className="said">{txt("Diese Wörter konntest du schon und hast sie danach wieder vergessen. Mehr Wiederholung hilft hier weniger als eine Eselsbrücke.")}</p>
      {gruppen.map((g) => (
        <div key={g.pair}>
          <div className="grp">{PAIRS[g.pair]?.foreignLabel || g.pair} <em>— {txt("{n} Wörter", { n: g.woerter.length })}</em></div>
          <div className="list">
            {g.woerter.map((r: any) => (
              <div className="li" key={r.w.id}>
                <span className="g">{fgnOf(r.w)}
                  <div className="m">{r.w[NATIVE]} · {txt("{n}-mal wieder vergessen", { n: r.prof.lapses || 0 })}</div>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================ Erweitert (Bildschirm) */
function Erweitert({ settings, tageSitzt, halte, onZurueck }: any) {
  useAlsUnterkopf(txt("Erweitert"), onZurueck);
  const ziel = Math.round(retentionFor(settings) * 100);
  return (
    <div className="statstab">

      <div className="grp"><Icon name="target" size={14} />{txt("Dein Behaltensziel")}</div>
      <div className="card">
        <Kennzahl zahl={ziel + " %"} satz={txt("so sicher sollst du ein Wort können, wenn es wiederkommt")} />
        <p className="said faint">{txt("Bei 90 Prozent plant die App so, dass du von zehn wiederkehrenden Wörtern etwa neun noch weißt. Ein höheres Ziel verkürzt die Abstände: mehr Karten pro Tag, dafür vergisst du weniger. Ein tieferes Ziel verlängert sie: weniger Karten, dafür rutscht mehr weg. Einstellbar unter „Lernintensität“.")}</p>
      </div>

      {tageSitzt.belegt && (
        <>
          <div className="grp"><Icon name="target" size={14} />{txt("Bis ein Wort sitzt")}</div>
          <div className="card">
            <Kennzahl zahl={Math.round(tageSitzt.schnitt)} einheit={txt("Tage")}
              satz={txt("im Schnitt, vom ersten Mal bis „sitzt“")} />
            <StehendeBalken klassen={tageSitzt.klassen} />
            <p className="said faint">{txt("Gezählt wird vom ersten Mal, als du ein Wort gesehen hast, bis zu dem Tag, an dem es zum ersten Mal saß. Erst danach ist die zweite Frage sinnvoll: wie lange ein Wort dann hält.")}</p>
          </div>
        </>
      )}

      {halte.n > 0 && (
        <>
          <div className="grp"><Icon name="clock" size={14} />{txt("Wie lange deine Wörter halten")}</div>
          <div className="card">
            <Kennzahl zahl={Math.round(halte.schnitt)} einheit={txt("Tage")} satz={txt("im Schnitt")} />
            <StehendeBalken klassen={halte.klassen} />
            <p className="said faint">{txt("Die Haltedauer ist die Zahl der Tage, die ein Wort nach der letzten richtigen Antwort statistisch gesehen noch sitzt. Danach fragt die App es wieder. Mit jeder richtigen Antwort wächst sie. Das ist die Vergessenskurve, die flacher wird. Kurz heißt nicht schlecht: jedes neue Wort fängt bei einem Tag an.")}</p>
          </div>
        </>
      )}
    </div>
  );
}
