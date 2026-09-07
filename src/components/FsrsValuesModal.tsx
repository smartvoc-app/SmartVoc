/* Der Nur-Lese-Blick auf das Gedächtnis-Modell.
 *
 * Hier standen die Werte unter ihren Kürzeln aus dem Papier: S1, S2,
 * MIN_REPS, w[0] bis w[18]. Wer die Kürzel kennt, braucht diesen Bildschirm
 * nicht; wer sie nicht kennt, liest neunzehn Zahlen ohne Bedeutung. Jeder
 * Wert trägt jetzt einen Namen, der sagt, was er tut.
 *
 * Zwei Spalten gibt es nur noch dort, wo sie etwas bedeuten: bei den
 * Schwellen, die man selbst verstellen kann. Die neunzehn Gewichte sind für
 * alle gleich — die App passt sie nicht an und zeichnet dafür nichts auf.
 */
import { Icon } from "../ui/Icon";
import { txt } from "../lib/i18n";
import { defaultWeights, getCfg, RETENTION } from "../lib/fsrs";

/* Die neunzehn Gewichte in Worten. Reihenfolge und Bedeutung folgen dem
 * FSRS-Modell; die Formulierung folgt dem, was ein Mensch davon wissen will.
 * Vier Gruppen: womit ein Wort startet, wie zäh es eingeschätzt wird, wie
 * die Haltedauer wächst, und was nach einem Fehler übrig bleibt. */
const GEWICHT: { name: string; erklaerung: string }[] = [
  { name: "Erster Halt: gar nicht gewusst", erklaerung: "Tage, die ein neues Wort hält, wenn du es beim ersten Mal nicht konntest" },
  { name: "Erster Halt: mit Mühe",          erklaerung: "dasselbe, wenn du lange überlegen musstest" },
  { name: "Erster Halt: gewusst",           erklaerung: "dasselbe, wenn du es konntest" },
  { name: "Erster Halt: leicht",            erklaerung: "dasselbe, wenn es dir leichtfiel" },
  { name: "Anfangs-Zähigkeit",               erklaerung: "wie schwer die App ein Wort einschätzt, bevor sie dich kennt" },
  { name: "Zähigkeit: Abflachen",           erklaerung: "wie schnell diese erste Einschätzung nachgibt" },
  { name: "Zähigkeit: Ausschlag",           erklaerung: "wie stark eine einzelne Antwort die Einschätzung verschiebt" },
  { name: "Zähigkeit: Zug zur Mitte",       erklaerung: "wie stark sie langfristig zum Mittelwert zurückwandert" },
  { name: "Zuwachs beim Halten",             erklaerung: "wie stark die Haltedauer nach einer richtigen Antwort wächst" },
  { name: "Bremse bei langem Halt",          erklaerung: "je länger ein Wort schon hält, desto weniger kommt dazu" },
  { name: "Bonus fürs knappe Erinnern",      erklaerung: "je knapper du es noch wusstest, desto mehr bringt die Wiederholung" },
  { name: "Nach einem Fehler: Grundwert",   erklaerung: "wie viel Haltedauer ein Wort behält, das du wieder vergessen hast" },
  { name: "Nach einem Fehler: Zähigkeit",   erklaerung: "wie stark die Zähigkeit dabei mitspricht" },
  { name: "Nach einem Fehler: bisheriger Halt", erklaerung: "wie stark zählt, wie lange es vorher schon hielt" },
  { name: "Nach einem Fehler: Vergessensgrad", erklaerung: "wie stark zählt, wie weit es schon weg war" },
  { name: "Abschlag für „mit Mühe“",         erklaerung: "wie viel weniger es bringt, wenn du lange überlegen musstest" },
  { name: "Zuschlag für „leicht“",           erklaerung: "wie viel mehr es bringt, wenn es dir leichtfiel" },
  { name: "Am selben Tag: Zuwachs",         erklaerung: "was eine zweite Abfrage am selben Tag noch bringt" },
  { name: "Am selben Tag: Dämpfung",        erklaerung: "wie schnell dieser Zuwachs abnimmt" },
];

export function FsrsValuesModal({ open, onClose, settings }: any) {
  if (!open) return null;
  const gewichte = defaultWeights();
  const ret = settings.targetRetention ?? RETENTION;
  const cfg = getCfg();

  /* Eine Schwelle: Name, Erklärung, dein Wert, der Standard. Zwei Spalten,
   * weil man diese Werte selbst verstellen kann und dann sehen will, wie
   * weit man vom Standard weg ist. */
  const Schwelle = ({ name, erklaerung, wert, standard }: any) => (
    <div className="wertzeile">
      <span className="wz-name">{txt(name)}<span className="wz-erk">{txt(erklaerung)}</span></span>
      <span className="wz-zahl">{wert}</span>
      <span className="wz-zahl wz-std">{standard}</span>
    </div>
  );

  /* Ein Gewicht: Name, Erklärung, Wert. Nur eine Zahl — es gibt keinen
   * zweiten Wert, mit dem man vergleichen könnte. */
  const Gewicht = ({ name, erklaerung, wert }: any) => (
    <div className="wertzeile">
      <span className="wz-name">{txt(name)}<span className="wz-erk">{txt(erklaerung)}</span></span>
      <span className="wz-zahl">{wert.toFixed(2)}</span>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "84vh", overflowY: "auto" } as any}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{txt("Womit die App rechnet")}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {txt("Das Gedächtnis-Modell heißt FSRS. Nur zum Ansehen, hier lässt sich nichts verstellen.")}
            </div>
          </div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="panel" style={{ padding: "10px 13px", marginBottom: 12 }}>
          <div className="wertkopf">
            <span className="section-title" style={{ fontSize: 12.5 }}>{txt("Deine Schwellen")}</span>
            <span className="wz-zahl faint" style={{ fontSize: 10.5 }}>{txt("deine")}</span>
            <span className="wz-zahl faint" style={{ fontSize: 10.5 }}>{txt("Voreinstellung")}</span>
          </div>
          <Schwelle name="Behaltensziel" erklaerung="wie sicher du ein Wort können sollst, wenn es wiederkommt"
            wert={`${Math.round(ret * 100)} %`} standard="90 %" />
          <Schwelle name="Grenze zu „sitzt fast“" erklaerung="ab so vielen Tagen Haltedauer wackelt ein Wort nicht mehr"
            wert={`${cfg.S1} T`} standard="3 T" />
          <Schwelle name="Grenze zu „sitzt“" erklaerung="ab so vielen Tagen Haltedauer gilt es als sicher"
            wert={`${cfg.S2} T`} standard="14 T" />
          <Schwelle name="Richtige bis „nicht mehr neu“" erklaerung="so oft muss ein frisches Wort sitzen, bevor es die Stufe verlässt"
            wert={`${cfg.MIN_REPS}×`} standard="2×" />
          <Schwelle name="Lernintensität" erklaerung="wie schnell die App annimmt, dass ein Wort fester wird"
            wert={`${cfg.learningSpeed}×`} standard="1×" />
          <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
            {txt("Diese fünf kannst du in den erweiterten Einstellungen verstellen.")}
          </div>
        </div>

        <div className="panel" style={{ padding: "10px 13px" }}>
          <div className="section-title" style={{ fontSize: 12.5, marginBottom: 2 }}>{txt("Die neunzehn Stellschrauben des Modells")}</div>
          <div className="faint" style={{ fontSize: 11.5, marginBottom: 8 }}>
            {txt("Mit diesen Zahlen rechnet das Modell aus, wie lange ein Wort hält. Sie stammen aus der Forschung und sind für alle gleich. Die App passt sie nicht an dich an und zeichnet dafür auch nichts auf.")}
          </div>
          {gewichte.map((w: number, i: number) => (
            <Gewicht key={i} name={GEWICHT[i]?.name || `Wert ${i + 1}`}
              erklaerung={GEWICHT[i]?.erklaerung || ""} wert={w} />
          ))}
        </div>

        <div className="modal-foot" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={onClose}>{txt("Schließen")}</button>
        </div>
      </div>
    </div>
  );
}
