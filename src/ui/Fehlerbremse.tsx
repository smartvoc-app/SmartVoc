/* Die Fehlerbremse.
 *
 * Ohne sie beendet EINE Ausnahme beim Aufbauen der Oberflaeche die ganze
 * App: React raeumt den Baum ab, uebrig bleibt ein leerer Bildschirm. Auf
 * dem Telefon ist das endgueltig -- die Daten, die den Fehler ausloesen,
 * liegen ja weiterhin da, also passiert beim naechsten Start dasselbe.
 * Auch eine Neuinstallation hilft nicht, denn die ersetzt das Programm und
 * nicht den Speicher. Genau dieser Fall ist eingetreten.
 *
 * Jetzt steht statt des schwarzen Bildschirms eine Meldung da, die sagt,
 * was los ist, den Fehler zum Weitergeben anbietet und einen Ausweg laesst.
 */
import React from "react";
import { LS, save } from "../lib/storage";

interface Zustand { fehler: Error | null; info: string }

export class Fehlerbremse extends React.Component<{ children: React.ReactNode }, Zustand> {
  state: Zustand = { fehler: null, info: "" };

  static getDerivedStateFromError(fehler: Error): Partial<Zustand> {
    return { fehler };
  }

  componentDidCatch(fehler: Error, info: React.ErrorInfo) {
    /* In die Konsole, damit der Fehler ueber Safaris Webinspektor am Kabel
       zu sehen ist -- und in den Zustand, damit er auch ohne Kabel lesbar
       bleibt. */
    console.error("[Fehlerbremse]", fehler, info?.componentStack);
    this.setState({ info: String(info?.componentStack || "").slice(0, 900) });
  }

  /* Nur die Uebungsrunde und den zuletzt offenen Bereich wegwerfen. Das ist
     der haeufigste Grund, und es kostet nichts: beides wird beim naechsten
     Start neu gebildet. Woerter, Listen und Lernstaende bleiben. */
  private nurRundeVerwerfen = () => {
    try { save(LS.offeneRunde, null); } catch (e) { /* dann eben nicht */ }
    try { localStorage.removeItem("vt_v1_tab"); } catch (e) { /* dann eben nicht */ }
    location.reload();
  };

  render() {
    if (!this.state.fehler) return this.props.children;
    const text = `${this.state.fehler.name}: ${this.state.fehler.message}\n\n${this.state.info}`;
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 24, background: "#f2ece0", color: "#2f3437",
                    font: "16px/1.5 -apple-system, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 460, width: "100%" }}>
          <h1 style={{ fontSize: 21, margin: "0 0 10px" }}>SmartVoc kann gerade nicht starten</h1>
          <p style={{ margin: "0 0 8px", color: "#5a554c" }}>
            Beim Aufbauen der Oberfläche ist ein Fehler aufgetreten. Deine Wörter und Lernstände sind
            davon nicht betroffen — sie liegen unverändert auf dem Gerät.
          </p>
          <p style={{ margin: "0 0 16px", color: "#5a554c" }}>
            Am häufigsten liegt es an einer angefangenen Übungsrunde. Der erste Knopf wirft nur diese weg.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <button onClick={this.nurRundeVerwerfen}
              style={{ padding: "11px 18px", borderRadius: 999, border: "none",
                       background: "#2f3437", color: "#fff", font: "inherit", fontWeight: 600 }}>
              Übungsrunde verwerfen und neu starten
            </button>
            <button onClick={() => location.reload()}
              style={{ padding: "11px 18px", borderRadius: 999, border: "1px solid #cdc4b4",
                       background: "transparent", color: "inherit", font: "inherit" }}>
              Nur neu laden
            </button>
          </div>
          <details>
            <summary style={{ cursor: "pointer", color: "#5a554c", fontSize: 14 }}>Fehlermeldung anzeigen</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, lineHeight: 1.45,
                          background: "#e7dfd0", padding: 12, borderRadius: 10, marginTop: 8 }}>{text}</pre>
            <button onClick={() => navigator.clipboard?.writeText(text)}
              style={{ marginTop: 8, padding: "8px 14px", borderRadius: 999, border: "1px solid #cdc4b4",
                       background: "transparent", color: "inherit", font: "inherit", fontSize: 14 }}>
              Fehlermeldung kopieren
            </button>
          </details>
        </div>
      </div>
    );
  }
}
