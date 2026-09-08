/* ===================================================================
 * Hilfe (V16) — ein „?“ in der Kopfzeile, drei Teile dahinter.
 *
 * Vorher waren es zwei Knöpfe („Anleitung“, „Lerntipps“) mit zwei eigenen
 * Fenstern, und die Anleitung beschrieb eine Oberfläche, die es so nicht
 * mehr gibt. Jetzt ein Ort mit drei Teilen:
 *
 *   Anleitung   — wie man die App bedient
 *   Lerntipps   — was beim Lernen hilft, unabhängig von der App
 *   Lerntheorie — warum die App so rechnet, wie sie rechnet
 *
 * Die Trennung ist keine Kosmetik: das Erste beantwortet „wo klicke ich?“,
 * das Zweite „wie lerne ich?“, das Dritte „warum kommt das Wort erst in
 * neun Tagen wieder?". Wer das eine sucht, will das andere gerade nicht.
 *
 * Die Texte selbst stehen in help.de.tsx und help.en.tsx — als zwei
 * vollständige Fassungen, nicht als Wörterliste. Prosa lässt sich nicht
 * satzweise übersetzen: die Hervorhebungen sitzen an anderen Stellen, und
 * die Sätze bauen sich anders auf. Eine Übersetzungstabelle hätte hier
 * Bruchstücke erzeugt.
 * =================================================================== */
import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";
import { txt, getUiLang } from "../lib/i18n";
import { TIPPS_DE, ANLEITUNG_DE, THEORIE_DE, THEORIE_LEAD_DE } from "./help.de";
import { TIPPS_EN, ANLEITUNG_EN, THEORIE_EN, THEORIE_LEAD_EN } from "./help.en";

/* Auch die Einblendung während des Übens greift hierauf zu. */
export const lernTipps = () => (getUiLang() === "en" ? TIPPS_EN : TIPPS_DE);

/* Eine Zeile, die sich aufklappt. Vorher gab es zwei Bauarten: die Anleitung
 * oeffnete ein Fenster mit Zurueck-Knopf und Blaettern, die Lerntipps klappten
 * an Ort auf. Das Aufklappen ist besser -- man behaelt die Uebersicht und
 * springt zwischen Kapiteln, ohne den Weg zurueck zu suchen.
 *
 * Das Zeichen ist ein Dreieck, das sich dreht. Ein Pfeil nach rechts
 * verspricht einen Ortswechsel, den es hier nicht gibt. */
function Klapp({ nr, titel, offen, aufKlick, children }: any) {
  return (
    <div className={"help-klapp" + (offen ? " open" : "")}>
      <button className="help-klapp-kopf" onClick={aufKlick} aria-expanded={offen}>
        <span className="help-num">{nr}</span>
        <span className="grow">{titel}</span>
        <svg className="help-dreieck" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
          <path d="M0 0h10L5 6z" fill="currentColor" />
        </svg>
      </button>
      {offen && <div className="help-klapp-rumpf">{children}</div>}
    </div>
  );
}

export function Help() {
  const [open, setOpen] = useState(false);
  const [teil, setTeil] = useState("anleitung");
  const [kapitel, setKapitel] = useState<number | null>(null);
  // Der erste Eintrag steht offen da -- eine Liste aus lauter zugeklappten
  // Zeilen sieht aus wie eine Datenbankausgabe, nicht wie ein Ratgeber.
  const [tipp, setTipp] = useState<number | null>(0);

  /* Ein Verweis von aussen oeffnet die Anleitung: smartvoc.app/#hilfe
   *
   * Das ist die Adresse, die im App Store als Support-Adresse steht. Ohne
   * das landet dort jemand mit einem Problem in der App und muss erst das
   * Fragezeichen finden -- Apple erwartet an dieser Stelle eine Seite, die
   * tatsaechlich hilft. Die Marke wird danach aus der Adresse genommen,
   * damit ein Neuladen nicht wieder die Anleitung aufreisst. */
  useEffect(() => {
    if (!/^#(hilfe|help)\b/i.test(location.hash)) return;
    setOpen(true);
    setTeil("anleitung");
    history.replaceState(null, "", location.pathname + location.search);
  }, []);
  const [satz, setSatz] = useState<number | null>(0);

  const en = getUiLang() === "en";
  const ANLEITUNG = en ? ANLEITUNG_EN : ANLEITUNG_DE;
  const TIPPS = en ? TIPPS_EN : TIPPS_DE;
  const THEORIE = en ? THEORIE_EN : THEORIE_DE;
  const THEORIE_LEAD = en ? THEORIE_LEAD_EN : THEORIE_LEAD_DE;
  const TEILE = [
    { id: "anleitung", label: txt("Anleitung") },
    { id: "tipps", label: txt("Lerntipps") },
    { id: "theorie", label: txt("Dahinter") },
  ];

  return (
    <>
      <button className="hbtn" onClick={() => setOpen(true)} title={txt("Hilfe")} aria-label={txt("Hilfe")}>?</button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{txt("Hilfe")}</div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setOpen(false)}><Icon name="x" size={16} /></button>
            </div>

            <div className="seg help-seg" role="tablist">
              {TEILE.map((teilE) => (
                <button key={teilE.id} aria-pressed={teil === teilE.id} onClick={() => { setTeil(teilE.id); setKapitel(null); }}>{teilE.label}</button>
              ))}
            </div>

            <div className="help-body">
              {teil === "anleitung" && (
                <div className="help-klapper">
                  {ANLEITUNG.map((k, i) => (
                    <Klapp key={i} nr={i + 1} titel={k.titel} offen={kapitel === i}
                      aufKlick={() => setKapitel(kapitel === i ? null : i)}>{k.text}</Klapp>
                  ))}
                </div>
              )}

              {teil === "tipps" && (
                <div className="help-klapper">
                  {TIPPS.map((tp, i) => (
                    <Klapp key={i} nr={i + 1} titel={tp.h} offen={tipp === i}
                      aufKlick={() => setTipp(tipp === i ? null : i)}><p>{tp.b}</p></Klapp>
                  ))}
                </div>
              )}

              {teil === "theorie" && (
                <>
                  {/* Ein Satz voraus, dann Kapitel. Vorher war es ein einziger
                      langer Text, durch den man scrollte. */}
                  <p className="help-lead">{THEORIE_LEAD}</p>
                  <div className="help-klapper">
                    {THEORIE.map((k, i) => (
                      <Klapp key={i} nr={i + 1} titel={k.titel} offen={satz === i}
                        aufKlick={() => setSatz(satz === i ? null : i)}>{k.text}</Klapp>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
