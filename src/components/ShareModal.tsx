/* Shows the share code + link after a list has been published. */
import { useState } from "react";
import { txt } from "../lib/i18n";
import { Icon } from "../ui/Icon";
import { shareLink, shareCode } from "../sync/share";
import { teilen, tapLeicht, istApp } from "../lib/native";

export function ShareModal({ open, token, listName, onClose }: { open: boolean; token: string | null; listName: string; onClose: () => void }) {
  const [copied, setCopied] = useState("");
  if (!open || !token) return null;
  const code = shareCode(token);
  const link = shareLink(token);
  const copy = (text: string, which: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(which); setTimeout(() => setCopied(""), 1600); });
  };
  /* Auf dem Geraet gehoert Teilen ins Systemblatt -- dort liegen Nachrichten,
   * Mail und AirDrop, und der Empfaenger ist einen Tipp entfernt. Im Browser
   * bleibt es beim Kopieren, was die Knoepfe daneben ohnehin anbieten. */
  const systemTeilen = async () => {
    tapLeicht();
    const wie = await teilen({ titel: txt("„{liste}“ teilen", { liste: listName }),
      text: txt("Übernimm meine Wortliste „{liste}“ in SmartVoc:", { liste: listName }) + " " + (link || code),
      url: link || undefined });
    if (wie === "kopiert") { setCopied("link"); setTimeout(() => setCopied(""), 1600); }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="modal-title">{txt("„{liste}“ teilen", { liste: listName })}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13.5, marginBottom: 14, lineHeight: 1.45 }}>
          {txt("Wer den Code oder Link öffnet, bekommt eine eigene Kopie der Liste. Änderungen daran wirken sich nicht auf deine Liste aus.")}
        </div>
        <div className="col" style={{ gap: 12 }}>
          <div>
            <div className="diff-label" style={{ textAlign: "left", marginBottom: 6 }}>{txt("Code")}</div>
            <div className="row" style={{ gap: 8 }}>
              <input className="field" readOnly value={code} onFocus={(e) => e.target.select()} style={{ fontFamily: "var(--mono)" }} />
              <button className="btn" onClick={() => copy(code, "code")}><Icon name={copied === "code" ? "check" : "download"} size={15} /> {txt(copied === "code" ? "Kopiert" : "Kopieren")}</button>
            </div>
          </div>
          {/* Ohne hinterlegte Webadresse gibt es keinen brauchbaren Link.
              Dann steht hier nichts -- der Code daneben reicht zum Teilen. */}
          {link && (
            <div>
              <div className="diff-label" style={{ textAlign: "left", marginBottom: 6 }}>{txt("Link")}</div>
              <div className="row" style={{ gap: 8 }}>
                <input className="field" readOnly value={link} onFocus={(e) => e.target.select()} />
                <button className="btn" onClick={() => copy(link, "link")}><Icon name={copied === "link" ? "check" : "download"} size={15} /> {txt(copied === "link" ? "Kopiert" : "Kopieren")}</button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {/* Nur auf dem Geraet. Dort oeffnet der Knopf das Systemblatt mit
              Nachrichten, Mail und AirDrop -- der Empfaenger ist einen Tipp
              entfernt. Im Browser kopierte er bloss, und das tun die beiden
              Knoepfe darueber schon. Ein Knopf, der dasselbe wie der Knopf
              daneben tut, kostet nur Ueberlegung. */}
          {istApp() && <button className="btn" onClick={systemTeilen}><Icon name="share" size={15} /> {txt("Teilen …")}</button>}
          <span className="grow" />
          <button className="btn btn-primary" onClick={onClose}>{txt("Fertig")}</button>
        </div>
      </div>
    </div>
  );
}
