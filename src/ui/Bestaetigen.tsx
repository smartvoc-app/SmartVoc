/* Die Rückfrage vor einem Schritt, der sich nicht rückgängig machen lässt.
 *
 * Sie stand zuerst in den Einstellungen, weil dort drei solche Schritte
 * nebeneinander liegen. Gebraucht wird sie überall: eine Wortliste löschen,
 * dreißig Wörter löschen, ein einzelnes Wort löschen. Vorher fragten die
 * einen mit `confirm()` — dem Systemdialog, der in der App fremd aussieht
 * und in einer WebView auch ausbleiben kann —, die anderen gar nicht.
 *
 * Eine Bauart: Titel, ein Satz, was passiert, Abbrechen und die Handlung.
 * `gefahr` färbt die Handlung rot; sonst ist sie die normale Hauptaktion.
 */
import { Icon } from "./Icon";
import { txt } from "../lib/i18n";

export function Bestaetigen({ offen, titel, text, knopf, gefahr, aus, tun, onClose, children }: any) {
  if (!offen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="modal-title">{titel}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{text}</div>
        {children}
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{txt("Abbrechen")}</button>
          <button className={"btn " + (gefahr ? "" : "btn-primary")}
            style={gefahr ? { borderColor: "var(--bad)", color: "var(--bad)" } : undefined}
            disabled={!!aus} onClick={tun}>{knopf}</button>
        </div>
      </div>
    </div>
  );
}
