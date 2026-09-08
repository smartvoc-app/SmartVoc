/* Der Link zu einer geteilten Liste, und der Weg, ihn jemandem zu schicken.
 *
 * Frueher standen hier zwei Wege nebeneinander: ein Code (VT-...) und ein
 * Link. Zwei Wege zum selben Ziel sind einer zu viel -- man muss sich
 * entscheiden, welchen man weitergibt, und der Empfaenger muss wissen, was
 * er damit tun soll. Der Link kann beides: anklicken oder einfuegen. */
import { useState } from "react";
import { txt } from "../lib/i18n";
import { Icon } from "../ui/Icon";
import { shareLink } from "../sync/share";
import { teilen, tapLeicht, istApp, perMail, perWhatsApp } from "../lib/native";

export function ShareModal({ open, token, listName, autor, onClose }: { open: boolean; token: string | null; listName: string; autor?: string; onClose: () => void }) {
  const [copied, setCopied] = useState("");
  if (!open || !token) return null;
  const link = shareLink(token);
  const copy = (text: string, which: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(which); setTimeout(() => setCopied(""), 1600); });
  };
  /* Auf dem Geraet gehoert Teilen ins Systemblatt -- dort liegen Nachrichten,
   * Mail und AirDrop, und der Empfaenger ist einen Tipp entfernt. Im Browser
   * bleibt es beim Kopieren, was die Knoepfe daneben ohnehin anbieten. */
  /* Die Nachricht sagt, von wem sie kommt, worum es geht und was zu tun ist.
     Ohne den ersten Teil steht beim Empfaenger ein nackter Link von einer
     unbekannten Adresse -- den klickt zu Recht niemand an. */
  const nachricht = autor
    ? txt("{wer} möchte die Wortliste „{liste}“ mit dir teilen. Öffne den Link, sieh sie dir an und übernimm sie, wenn du magst.",
        { wer: autor, liste: listName })
    : txt("Eine Wortliste für dich: „{liste}“. Öffne den Link, sieh sie dir an und übernimm sie, wenn du magst.",
        { liste: listName });
  const systemTeilen = async () => {
    tapLeicht();
    const wie = await teilen({ titel: txt("„{liste}“ teilen", { liste: listName }),
      text: nachricht, url: link || undefined });
    if (wie === "kopiert") { setCopied("nachricht"); setTimeout(() => setCopied(""), 1600); }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="modal-title">{txt("„{liste}“ teilen", { liste: listName })}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13.5, marginBottom: 14, lineHeight: 1.45 }}>
          {txt("Wer den Link öffnet, bekommt eine eigene Kopie der Liste. Was er daran ändert, wirkt sich nicht auf deine aus.")}
        </div>
        <div className="col" style={{ gap: 12 }}>
          {/* Ohne hinterlegte Webadresse laesst sich kein Link bauen. Seit der
              Code weg ist, gibt es dann gar nichts weiterzugeben -- also
              steht das da, statt eines leeren Fensters. */}
          {!link && (
            <div className="badge red" style={{ alignSelf: "flex-start" }}>
              <span className="dot" />{txt("Teilen ist gerade nicht möglich: Es fehlt die Adresse der Webfassung.")}
            </div>
          )}
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
        {/* Auf dem Geraet das Systemblatt -- dort stehen Nachrichten, Mail,
            AirDrop und WhatsApp, und der Empfaenger ist einen Tipp entfernt.
         *
         * Im Browser NICHT: Auf dem Mac zeigt das Blatt nur, was sich als
         * Erweiterung eingetragen hat, und WhatsApp und Outlook tun das
         * nicht -- man kann sie dort auch nicht hinzufuegen. Statt eines
         * Blattes, in dem der gesuchte Weg fehlt, stehen hier die Wege
         * selbst. Beide tragen den Begleittext von Anfang an. */}
        {link && (
          <div className="col" style={{ gap: 10, marginTop: 16 }}>
            <div className="diff-label" style={{ textAlign: "left" }}>{txt("Nachricht schicken")}</div>
            {istApp() ? (
              <button className="btn btn-primary" onClick={systemTeilen}>
                <Icon name="share" size={15} /> {txt("Nachricht schreiben …")}
              </button>
            ) : (
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => { tapLeicht(); perMail(txt("Wortliste „{liste}“", { liste: listName }), nachricht + "\n\n" + link); }}>
                  {txt("Per E-Mail")}
                </button>
                <button className="btn" onClick={() => { tapLeicht(); perWhatsApp(nachricht + "\n\n" + link); }}>
                  {txt("Per WhatsApp")}
                </button>
                <button className="btn" onClick={() => copy(nachricht + "\n\n" + link, "nachricht")}>
                  <Icon name={copied === "nachricht" ? "check" : "download"} size={15} />
                  {txt(copied === "nachricht" ? "Kopiert" : "Text kopieren")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="modal-foot">
          <span className="grow" />
          <button className="btn btn-primary" onClick={onClose}>{txt("Fertig")}</button>
        </div>
      </div>
    </div>
  );
}
