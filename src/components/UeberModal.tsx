/* „Über SmartVoc" — ein Bildschirm für alles, was man einmal liest.
 *
 * Datenschutz und Impressum standen in den Einstellungen zwischen
 * Datenexport und Kontolöschung, also zwischen Handlungen. Es sind aber
 * Texte, keine Handlungen, und sie gehören auch nicht in die Nähe der
 * Knöpfe, die etwas löschen.
 *
 * Er beginnt mit dem Startbild. Das ist der zweite Ort, an dem die
 * Illustration atmen kann, ohne dass Text darauf liegt — und der einzige,
 * an dem man sie sich in Ruhe ansehen kann.
 */
import { Icon } from "../ui/Icon";
import { txt, getUiLang } from "../lib/i18n";
import bild from "../assets/intro.jpg";
import { DATENSCHUTZ, IMPRESSUM, DATENSCHUTZ_EN, IMPRESSUM_EN, DATENSCHUTZ_URL } from "../lib/recht";

export function UeberModal({ offen, onClose }: { offen: boolean; onClose: () => void }) {
  if (!offen) return null;
  /* Die Rechtstexte gehen NICHT durch txt(): sie stehen als ganze Fassung je
     Sprache in recht.ts. Ein Rechtstext satzweise zu uebersetzen erzeugt
     Bruchstuecke, und ausgerechnet hier darf nichts danebengehen. Bis hierher
     erschienen sie auch im englischen Modus deutsch. */
  const en = getUiLang() === "en";
  const datenschutz = en ? DATENSCHUTZ_EN : DATENSCHUTZ;
  const impressum = en ? IMPRESSUM_EN : IMPRESSUM;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal ueber-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head ueber-kopf">
          <div className="modal-title">{txt("Über SmartVoc")}</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="ueber-rumpf">
          <img className="ueber-bild" src={bild} alt="" />

          <p className="ueber-lead">
            {txt("Ein Vokabeltrainer, der ausrechnet, wann ein Wort wiederkommt, statt es zu raten. Für alle, die Vokabeln lernen, vom Schulunterricht bis zum Selbststudium.")}
          </p>

          {[[txt("Datenschutz"), datenschutz], [txt("Impressum"), impressum]].map(([titel, teile]: any) => (
            <div key={titel}>
              <h3 className="ueber-h">{titel}</h3>
              <div className="muted legal-body">
                {teile.map((a: any, k: number) => (
                  <div key={k}>
                    {a.h && <h4>{txt(a.h)}</h4>}
                    {a.p.map((t: string, m: number) => <p key={m}>{txt(t)}</p>)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Apple verlangt fuer den App Store eine frei erreichbare Adresse
              mit derselben Erklaerung. Der Verweis steht hier, damit man sie
              weitergeben kann, ohne die App zu oeffnen. */}
          <p className="ueber-web">
            {txt("Dieselbe Erklärung im Web:")}{" "}
            <a href={DATENSCHUTZ_URL} target="_blank" rel="noreferrer">{DATENSCHUTZ_URL.replace(/^https:\/\//, "")}</a>
          </p>
        </div>

        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>{txt("Schließen")}</button>
        </div>
      </div>
    </div>
  );
}
