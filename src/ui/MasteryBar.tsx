/* FR3-2 — ONE shared distribution bar for the practice card AND Stats.
 * 5 segments (STUFE_ORDER); underneath, a colour-coded legend listing ONLY the
 * levels that actually occur, each as "● count label" in the segment's colour.
 * Labelling segments in place fails on real data — the narrow segments (the
 * interesting ones) collide — so count and label live together in the legend,
 * where colour + order + number make the mapping unambiguous at any width. */
import { STUFE_ORDER } from "../lib/fsrs";
import { txt } from "../lib/i18n";

import { STUFE_FARBE as TONE, STUFE_KURZ as LEG } from "../lib/stufen";

/* „Ungeübt" ist keine Leistung, sondern deren Abwesenheit -- in der Leiste
 * traegt es deshalb die Farbe der leeren Bahn, nicht eine eigene Fuellung.
 * Vorher fuellte es grau, und eine Liste mit 220 ungeuebten Woertern zeigte
 * einen randvollen Balken: das liest sich als "fertig" und heißt das
 * Gegenteil. Seit die Prozentzahl daneben weggefallen ist, widerspricht dem
 * auch nichts mehr. Der Punkt in der Legende bleibt grau -- dort muss man
 * die Stufe erkennen koennen. */
const BALKEN = (k: string) => k === "noch_nicht_geuebt" ? "var(--bg-2)" : TONE[k];

export function MasteryBar({ dist, total, onSegment, activeFilter, showLegend = true }:
  { dist: Record<string, number>; total: number; onSegment?: (k: string) => void; activeFilter?: string; showLegend?: boolean }) {
  if (!total) return null;
  const present = STUFE_ORDER.filter((k) => dist[k]);

  return (
    <div className="mbar">
      {/* In Miniansichten steht die Gesamtzahl schon in der Zeile darueber --
          zweimal dieselbe Zahl liest sich wie zwei verschiedene. */}
      {showLegend && <div className="mbar-total">{txt(total === 1 ? "{n} Wort insgesamt" : "{n} Wörter insgesamt", { n: total })}</div>}
      <div className="mbar-band">
        {present.map((k) => (
          <i key={k} className={onSegment ? "clickable" : ""} onClick={onSegment ? () => onSegment(k) : undefined}
            style={{ flex: dist[k], background: BALKEN(k), opacity: activeFilter && activeFilter !== k ? 0.35 : 1 }}
            title={`${txt(LEG[k])}: ${dist[k]}`} />
        ))}
      </div>
      {showLegend && (
        <div className="mbar-legend">
          {present.map((k) => (
            <span key={k} className={"mbar-leg" + (onSegment ? " clickable" : "")} style={{ color: TONE[k], opacity: activeFilter && activeFilter !== k ? 0.45 : 1 }}
              onClick={onSegment ? () => onSegment(k) : undefined}>
              <span className="mbar-leg-dot" style={{ background: TONE[k] }} />
              <b>{dist[k]}</b> {txt(LEG[k])}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* FR3-2 — Stats trend: stacked daily snapshots (honest "baut sich auf"). */
export function MasteryTrend({ days }: { days: { d: string; c: number[] }[] }) {
  const recent = days.slice(-21);
  return (
    <div className="mtrend">
      <div className="mtrend-head">{txt("Verlauf")} <span className="faint">{txt("baut sich auf — ab heute füllt sich diese Linie")}</span></div>
      {recent.length === 0 ? (
        <div className="muted" style={{ fontSize: 12.5 }}>{txt("Noch kein Verlauf. Ab heute merkt sich die App jeden Tag deinen Stand.")}</div>
      ) : (
        <div className="mtrend-cols">
          {recent.map((day) => {
            const tot = day.c.reduce((a, b) => a + b, 0) || 1;
            return (
              <div key={day.d} className="mtrend-col" title={day.d}>
                {STUFE_ORDER.map((k, i) => day.c[i] ? <i key={k} style={{ height: (day.c[i] / tot) * 100 + "%", background: BALKEN(k) }} /> : null)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
