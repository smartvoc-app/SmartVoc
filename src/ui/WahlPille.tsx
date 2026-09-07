/* ===================================================================
 * Eine Pille, die eine Wahl trifft.
 *
 * Vorher lag ueber jeder dieser Pillen ein unsichtbares <select> mit
 * `opacity: 0`. Der Griff saß richtig, aber das aufgeklappte Menue nicht:
 * Browser setzen das Klappmenue eines unsichtbar gemachten Auswahlfeldes
 * nicht zuverlaessig an dessen Stelle, und auf breiten Bildschirmen sprang
 * es quer ueber die Seite. Der Trick war noetig, weil die Pille geschlossen
 * die Kuerzel zeigen soll ("EN · DE") und aufgeklappt die ausgeschriebenen
 * Namen -- das kann ein echtes Auswahlfeld nicht.
 *
 * Also kein Auswahlfeld mehr, sondern das Blatt, das die App fuer jede
 * andere Wahl ohnehin benutzt: eine Liste mit einer Zeile je Moeglichkeit,
 * die gewaehlte hervorgehoben. Gleiche Wahl, gleiche Form -- und keine
 * Abhaengigkeit mehr davon, wie ein Browser ein Klappmenue platziert.
 * =================================================================== */
import React from "react";
import { Icon } from "./Icon";
import { txt } from "../lib/i18n";

export interface Wahl { wert: string; label: string; sub?: string }

export function WahlPille({ kurz, titel, desc, wert, optionen, onWahl, icon, ton, className }: {
  kurz: React.ReactNode;
  titel: string;
  desc?: string;
  wert: string;
  optionen: Wahl[];
  onWahl: (w: string) => void;
  icon?: string;
  ton?: "on" | "quiet";
  className?: string;
}) {
  const [offen, setOffen] = React.useState(false);

  React.useEffect(() => {
    if (!offen) return;
    const esc = (e: any) => { if (e.key === "Escape") setOffen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [offen]);

  const waehle = (v: string) => { setOffen(false); if (v !== wert) onWahl(v); };

  return (
    <>
      <button type="button" aria-label={titel} aria-haspopup="dialog"
        className={"pill" + (ton === "on" ? " pill-on" : ton === "quiet" ? " pill-quiet" : "") + (className ? " " + className : "")}
        onClick={() => setOffen(true)}>
        {icon && <Icon name={icon} size={15} />}
        <span>{kurz}</span>
      </button>
      {offen && (
        <div className="modal-backdrop" onClick={() => setOffen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }} role="dialog" aria-label={titel}>
            <div className="modal-head">
              <div className="modal-title">{titel}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setOffen(false)}><Icon name="x" size={16} /></button>
            </div>
            {desc && <p className="said" style={{ marginTop: 0 }}>{desc}</p>}
            <div className="list" style={{ marginTop: 12 }}>
              {optionen.map((o) => (
                <button key={o.wert} className={"li" + (o.wert === wert ? " sel" : "")} onClick={() => waehle(o.wert)}>
                  <span className="g">{o.label}{o.sub && <div className="m">{o.sub}</div>}</span>
                  {o.wert === wert && <Icon name="check" size={15} />}
                </button>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setOffen(false)}>{txt("Abbrechen")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
