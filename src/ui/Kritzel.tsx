/* Handgezeichnete Bilder für die Hilfe.
 *
 * Warum überhaupt Bilder: Die Hilfe erklärte bisher in Sätzen, was man auf
 * dem Bildschirm sieht — und beschrieb damit Dinge, die jeder ohnehin
 * bemerkt. Was ein Satz NICHT kann, ist eine Kurve zeigen oder vier
 * Antwortarten nebeneinanderstellen. Genau dafür sind diese Bilder da; wo
 * ein Satz reicht, steht keines.
 *
 * Warum gekritzelt: Eine saubere Nachzeichnung der Oberfläche wäre ein
 * zweites, schlechteres Abbild der App — und veraltet beim nächsten Umbau.
 * Eine Skizze behauptet gar nicht erst, die Wahrheit zu sein; sie zeigt die
 * Idee. Ausserdem ist die Zielgruppe vierzehn und nicht vierzig.
 *
 * Technisch: ein Rauschfilter verschiebt die Linien leicht, das ergibt den
 * Zittereffekt. Der Filter liegt NUR auf den Strichen, nie auf der Schrift
 * — verschobene Buchstaben sehen kaputt aus, nicht handgemacht. Alle Farben
 * kommen aus den Schema-Variablen, also folgen die Bilder Hell und Dunkel
 * und allen drei Farbschemata von selbst.
 */
import React from "react";
import { txt } from "../lib/i18n";

let lfd = 0;

/** Rahmen für ein Bild: eigener Filter je Figur (Kennungen müssen im
 *  Dokument eindeutig sein), Beschriftung darunter. */
function Figur({ vb, hoehe, titel, children }: {
  vb: string; hoehe?: number; titel?: string; children: (f: string) => React.ReactNode;
}) {
  const id = React.useMemo(() => `kr${++lfd}`, []);
  return (
    <figure className="kritzel">
      <svg viewBox={vb} style={{ height: hoehe }} role="img" aria-label={titel || ""}>
        <defs>
          <filter id={id} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="3" seed="7" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="1.7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {children(`url(#${id})`)}
      </svg>
      {titel && <figcaption>{titel}</figcaption>}
    </figure>
  );
}

/* ================================================================== UI */

/** Eine Karteikarte, vorne und hinten. */
export function KritzelKarte({ titel }: { titel?: string }) {
  return (
    <Figur vb="0 0 300 116" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" stroke="var(--ink)" strokeWidth="1.6"
           strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="14" width="112" height="80" rx="5" fill="var(--card)" />
          <text x="66" y="52" textAnchor="middle" fill="var(--ink)" stroke="none"
                fontSize="15" fontFamily="var(--serif)">the tree</text>
          <text x="66" y="72" textAnchor="middle" fill="var(--ink-faint)" stroke="none"
                fontSize="9">The tree is tall.</text>
          <path d="M138 54h30M160 48l8 6-8 6" stroke="var(--amber)" strokeWidth="2" />
          <rect x="184" y="14" width="112" height="80" rx="5" fill="var(--card)" />
          <text x="240" y="52" textAnchor="middle" fill="var(--ink)" stroke="none"
                fontSize="15" fontFamily="var(--serif)">der Baum</text>
          <text x="240" y="72" textAnchor="middle" fill="var(--ink-faint)" stroke="none"
                fontSize="9">Der Baum ist hoch.</text>
          <text x="66" y="108" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("Frage")}</text>
          <text x="240" y="108" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("Lösung")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Die vier Antwortarten — drei zusammen, eine abgesetzt. */
/* Anmerkung: Diese Zeichnung bricht Woerter von Hand um ("Multiple-" /
 * "Choice"). Die Haelften sind deshalb NICHT uebersetzbar -- ein halbes Wort
 * ergibt keinen Schluessel. Sie steht in keiner Anleitung mehr; wer sie
 * wieder einsetzt, muss die Beschriftungen vorher ganz machen. */
export function KritzelAntwortarten({ titel }: { titel?: string }) {
  const K = (x: number, b: string, farbe: string) => (
    <g key={x}>
      <rect x={x} y="14" width="62" height="46" rx="5" fill="var(--card)" stroke={farbe} />
      <text x={x + 31} y={b.endsWith("-") ? 40 : 42} textAnchor="middle" fill="var(--ink)" stroke="none" fontSize="9">{b}</text>
    </g>
  );
  return (
    <Figur vb="0 0 300 92" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" stroke="var(--ink)" strokeWidth="1.5"
           strokeLinecap="round" strokeLinejoin="round">
          {K(6, "Eintippen", "var(--ink)")}
          {K(74, "Multiple-", "var(--ink)")}
          <text x="105" y="52" textAnchor="middle" fill="var(--ink)" stroke="none" fontSize="9">Choice</text>
          {K(142, "Selbst-", "var(--ink)")}
          <text x="173" y="52" textAnchor="middle" fill="var(--ink)" stroke="none" fontSize="9">kontrolle</text>
          <path d="M214 10v54" stroke="var(--line)" strokeDasharray="3 4" />
          <rect x="226" y="14" width="66" height="46" rx="5" fill="var(--bg-2)" stroke="var(--ink-faint)" strokeDasharray="4 3" />
          <text x="259" y="36" textAnchor="middle" fill="var(--ink-soft)" stroke="none" fontSize="9">Nur durch-</text>
          <text x="259" y="48" textAnchor="middle" fill="var(--ink-soft)" stroke="none" fontSize="9">blättern</text>
          <text x="80" y="80" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("zählen für deinen Lernstand")}</text>
          <text x="259" y="80" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("zählt nicht")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Drei Kalendertage mit Ampel. */
export function KritzelKalender({ titel }: { titel?: string }) {
  const Tag = (x: number, z: string, farbe: string, unten: string) => (
    <g key={x}>
      <rect x={x} y="14" width="76" height="58" rx="7"
            fill={`color-mix(in srgb, ${farbe} 22%, var(--card))`} stroke={farbe} strokeWidth="1.8" />
      <text x={x + 38} y="40" textAnchor="middle" fill="var(--ink)" stroke="none"
            fontSize="17" fontWeight="700">{z}</text>
      <rect x={x + 14} y="46" width="48" height="15" rx="4" fill="var(--card)" stroke="none" />
      <text x={x + 38} y="57" textAnchor="middle" fill="var(--ink-soft)" stroke="none" fontSize="9">{unten}</text>
    </g>
  );
  return (
    <Figur vb="0 0 300 100" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {Tag(6, "9", "var(--ok)", "1 Liste")}
          {Tag(112, "12", "var(--warn)", "2 Listen")}
          {Tag(218, "19", "var(--bad)", "1 Liste")}
          <text x="44" y="88" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("bereit")}</text>
          <text x="150" y="88" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("auf Kurs")}</text>
          <text x="256" y="88" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("im Rückstand")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Die fünf Stufen als Leiste. */
export function KritzelLeiste({ titel }: { titel?: string }) {
  const teile: [number, number, string, string][] = [
    [8, 96, "var(--ok)", "sitzt"], [104, 52, "var(--warn)", "fast"],
    [156, 40, "var(--bad)", "wackelt"], [196, 48, "var(--blue)", "neu"],
    [244, 48, "var(--ink-faint)", "ungeübt"],
  ];
  return (
    <Figur vb="0 0 300 66" titel={titel}>
      {(f) => (
        <g filter={f} strokeLinecap="round">
          {teile.map(([x, b, c]) => <rect key={x} x={x} y="14" width={b - 3} height="16" rx="4" fill={c} />)}
          {teile.map(([x, b, c, t]) => (
            <text key={t} x={x + (b - 3) / 2} y="48" textAnchor="middle" fill="var(--ink-faint)"
                  stroke="none" fontSize="8.5">{t}</text>
          ))}
        </g>
      )}
    </Figur>
  );
}

/** Zwei Ebenen einer Wortliste. */
export function KritzelListe({ titel }: { titel?: string }) {
  return (
    <Figur vb="0 0 300 120" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" stroke="var(--ink)" strokeWidth="1.5"
           strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="14" width="118" height="88" rx="6" fill="var(--card)" />
          <text x="16" y="30" fill="var(--ink)" stroke="none" fontSize="10" fontWeight="700">Unité 3</text>
          <path d="M16 40h98" stroke="var(--line)" />
          <rect x="16" y="48" width="98" height="18" rx="4" stroke="var(--line)" />
          <text x="24" y="61" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("Wörter ansehen")}</text>
          <rect x="16" y="72" width="98" height="18" rx="4" stroke="var(--line)" />
          <text x="24" y="85" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("zusammenführen")}</text>

          <path d="M136 58h28M156 52l8 6-8 6" stroke="var(--amber)" strokeWidth="2" />

          <rect x="176" y="14" width="118" height="88" rx="6" fill="var(--card)" />
          {[30, 48, 66, 84].map((y, i) => (
            <g key={y}>
              <path d={`M182 ${y - 6}v13`} stroke={["var(--ok)", "var(--warn)", "var(--bad)", "var(--ink-faint)"][i]} strokeWidth="3" />
              <rect x="188" y={y - 8} width="100" height="15" rx="4" stroke="var(--line)" />
              <text x="194" y={y + 3} fill="var(--ink)" stroke="none" fontSize="8">{["arbre", "maison", "chien", "fleur"][i]}</text>
              <text x="248" y={y + 3} fill="var(--ink-soft)" stroke="none" fontSize="8">{["Baum", "Haus", "Hund", "Blume"][i]}</text>
            </g>
          ))}
        </g>
      )}
    </Figur>
  );
}

/** Der Weg von der Heftseite zur ersten Karte.
 *
 *  Der erste Pfeil traegt eine Beschriftung, und das ist kein Schmuck: Ohne
 *  sie liest sich das Bild, als lese die App das Foto selbst ein. Sie tut
 *  es nicht -- sie gibt einen Auftrag heraus, den man in seine eigene
 *  KI-App legt. Genau diese Verwechslung stand vorher auch im Text. */
export function KritzelStart({ titel }: { titel?: string }) {
  const pfeil = (x: number, was?: string) => (
    <g>
      <path d={`M${x} 52h22M${x + 14} 46l8 6-8 6`} stroke="var(--amber)" strokeWidth="2" />
      {was && <text x={x + 11} y="40" textAnchor="middle" fill="var(--amber)" stroke="none"
                    fontSize="7">{was}</text>}
    </g>
  );
  return (
    <Figur vb="0 0 300 116" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" stroke="var(--ink)" strokeWidth="1.5"
           strokeLinecap="round" strokeLinejoin="round">
          {/* Heftseite */}
          <rect x="6" y="16" width="76" height="72" rx="4" fill="var(--card)" />
          <path d="M22 16v72" stroke="var(--bad)" strokeWidth="1" opacity="0.5" />
          {[30, 42, 54, 66].map((y) => <path key={y} d={`M28 ${y}h48`} stroke="var(--line)" />)}
          <text x="44" y="102" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8.5">{txt("Foto")}</text>

          {pfeil(88, "KI-App")}

          {/* Prüfen-Fenster: eine Zeile ist sichtbar korrigiert */}
          <rect x="118" y="16" width="76" height="72" rx="4" fill="var(--card)" />
          {[32, 46, 60].map((y, i) => (
            <g key={y}>
              <rect x="126" y={y - 8} width="60" height="13" rx="3" stroke="var(--line)" />
              {i === 1 && <rect x="126" y={y - 8} width="60" height="13" rx="3" stroke="var(--amber)" strokeWidth="1.6" />}
            </g>
          ))}
          <text x="156" y="80" textAnchor="middle" fill="var(--amber)" stroke="none" fontSize="8">{txt("korrigiert")}</text>
          <text x="156" y="102" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8.5">{txt("prüfen")}</text>

          {pfeil(200)}

          {/* Fertige Karte */}
          <rect x="230" y="16" width="64" height="72" rx="4" fill="var(--card)" />
          <text x="262" y="50" textAnchor="middle" fill="var(--ink)" stroke="none"
                fontSize="12" fontFamily="var(--serif)">la clé</text>
          <text x="262" y="66" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8">der Schlüssel</text>
          <text x="262" y="102" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8.5">{txt("üben")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Wachsende Abstände — und was ein Fehler daran ändert. Das ist der Kern
 *  der App, und er war bisher nur in Sätzen erklärt. */
export function KritzelAbstaende({ titel }: { titel?: string }) {
  const gut: [number, string][] = [[24, ""], [58, "1 Tag"], [104, "3 Tage"], [170, "8 Tage"], [268, "3 Wochen"]];
  const schlecht: [number, boolean][] = [[24, false], [58, false], [104, true], [134, false], [180, false], [252, false]];
  return (
    <Figur vb="0 0 300 128" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* obere Reihe: alles richtig */}
          <path d="M14 34h276" stroke="var(--line)" strokeWidth="1.3" />
          {gut.map(([x], i) => (
            <circle key={x} cx={x} cy="34" r={i === 0 ? 3.5 : 4} fill="var(--ok)" stroke="none" />
          ))}
          {gut.slice(1).map(([x, t]) => (
            <text key={t} x={x} y="24" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="7.5">{t}</text>
          ))}
          <text x="14" y="50" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("immer richtig")}</text>

          {/* untere Reihe: ein Fehler in der Mitte */}
          <path d="M14 92h276" stroke="var(--line)" strokeWidth="1.3" />
          {schlecht.map(([x, fehler]) => (
            <circle key={x} cx={x} cy="92" r="4"
                    fill={fehler ? "var(--bad)" : "var(--ok)"} stroke="none" />
          ))}
          <path d="M104 74v10" stroke="var(--bad)" strokeWidth="1.6" />
          <text x="104" y="70" textAnchor="middle" fill="var(--bad)" stroke="none" fontSize="7.5">{txt("Fehler")}</text>
          <path d="M110 104h22M126 100l6 4-6 4" stroke="var(--bad)" strokeWidth="1.4" />
          <text x="150" y="110" fill="var(--ink-faint)" stroke="none" fontSize="7.5">{txt("wieder von vorn")}</text>
          <text x="14" y="108" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("mit Fehler")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Die vier Bereiche, jeder mit der Frage, die er beantwortet. */
export function KritzelBereiche({ titel }: { titel?: string }) {
  const B: [string, string][] = [
    ["Üben", "Was jetzt?"], ["Übungsplan", "Rechtzeitig?"],
    ["Wortlisten", "Woher?"], ["Statistik", "Wo stehe ich?"],
  ];
  return (
    <Figur vb="0 0 300 104" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" stroke="var(--ink)" strokeWidth="1.4"
           strokeLinecap="round" strokeLinejoin="round">
          {B.map(([name, frage], i) => {
            const x = 8 + i * 73;
            return (
              <g key={name}>
                {/* Sprechblase mit der Frage */}
                <rect x={x} y="10" width="66" height="24" rx="7" fill="var(--card)" stroke="var(--line)" />
                <path d={`M${x + 28} 34l5 7 5-7`} fill="var(--card)" stroke="var(--line)" />
                <text x={x + 33} y="26" textAnchor="middle" fill="var(--ink-soft)" stroke="none" fontSize="8">{frage}</text>
                {/* Reiter */}
                <rect x={x} y="52" width="66" height="34" rx="6"
                      fill={i === 0 ? "color-mix(in srgb, var(--ok) 16%, var(--card))" : "var(--card)"} />
                <text x={x + 33} y="73" textAnchor="middle" fill="var(--ink)" stroke="none"
                      fontSize="9" fontWeight={i === 0 ? "700" : "400"}>{name}</text>
              </g>
            );
          })}
        </g>
      )}
    </Figur>
  );
}

/** Wie ein Zieldatum die Wiederholungen zusammenzieht. */
export function KritzelEndspurt({ titel }: { titel?: string }) {
  const ohne = [22, 52, 96, 156, 232];
  const mit = [22, 52, 92, 130, 162, 188, 210, 228];
  return (
    <Figur vb="0 0 300 128" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Prüfungstag */}
          <path d="M246 14v100" stroke="var(--amber)" strokeWidth="2" strokeDasharray="4 3" />
          <text x="246" y="10" textAnchor="middle" fill="var(--amber)" stroke="none" fontSize="8" fontWeight="700">{txt("Prüfung")}</text>

          <path d="M14 40h276" stroke="var(--line)" strokeWidth="1.3" />
          {ohne.map((x) => <circle key={x} cx={x} cy="40" r="4" fill="var(--ok)" stroke="none" />)}
          <text x="14" y="56" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("ohne Zieldatum")}</text>

          <path d="M14 92h276" stroke="var(--line)" strokeWidth="1.3" />
          {mit.map((x) => <circle key={x} cx={x} cy="92" r="4" fill="var(--ok)" stroke="none" />)}
          <path d="M162 106h66" stroke="var(--amber)" strokeWidth="1.4" />
          <path d="M162 103v6M228 103v6" stroke="var(--amber)" strokeWidth="1.4" />
          <text x="195" y="120" textAnchor="middle" fill="var(--amber)" stroke="none" fontSize="7.5">{txt("Endspurt")}</text>
          <text x="14" y="108" fill="var(--ink-soft)" stroke="none" fontSize="8.5">{txt("mit Zieldatum")}</text>
        </g>
      )}
    </Figur>
  );
}

/* ============================================================= Theorie */

/** Die Vergessenskurve, und was Wiederholen daran ändert. */
export function KritzelVergessen({ titel }: { titel?: string }) {
  return (
    <Figur vb="0 0 300 140" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 12v96h258" stroke="var(--ink-faint)" strokeWidth="1.3" />
          <path d="M28 18C60 74 92 96 150 102s90 4 132 4" stroke="var(--bad)" strokeWidth="2"
                strokeDasharray="5 4" />
          <path d="M28 18C48 56 66 70 92 74" stroke="var(--ink)" strokeWidth="2" />
          <path d="M92 74V20" stroke="var(--ok)" strokeWidth="1.3" strokeDasharray="3 3" />
          <path d="M92 20C118 50 140 62 166 66" stroke="var(--ink)" strokeWidth="2" />
          <path d="M166 66V22" stroke="var(--ok)" strokeWidth="1.3" strokeDasharray="3 3" />
          <path d="M166 22C204 44 240 52 286 56" stroke="var(--ink)" strokeWidth="2" />
          <circle cx="92" cy="20" r="3.4" fill="var(--ok)" stroke="none" />
          <circle cx="166" cy="22" r="3.4" fill="var(--ok)" stroke="none" />
          <text x="16" y="16" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("alles")}</text>
          <text x="8" y="106" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("weg")}</text>
          <text x="286" y="124" textAnchor="end" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("Zeit →")}</text>
          <text x="186" y="98" fill="var(--bad)" stroke="none" fontSize="9">{txt("ohne Wiederholen")}</text>
          <text x="176" y="14" fill="var(--ok)" stroke="none" fontSize="9">{txt("mit")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Zu früh, gerade richtig, zu spät. */
export function KritzelFenster({ titel }: { titel?: string }) {
  return (
    <Figur vb="0 0 300 116" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="112" y="14" width="76" height="62" rx="6"
                fill="color-mix(in srgb, var(--ok) 18%, var(--card))" stroke="var(--ok)" strokeWidth="1.8" />
          <path d="M20 46h268" stroke="var(--ink-faint)" strokeWidth="1.3" />
          <path d="M28 18C56 60 84 76 288 82" stroke="var(--ink)" strokeWidth="2" />
          <text x="66" y="96" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("zu früh")}</text>
          <text x="150" y="96" textAnchor="middle" fill="var(--ok)" stroke="none" fontSize="9" fontWeight="700">{txt("jetzt")}</text>
          <text x="240" y="96" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("zu spät")}</text>
          <text x="66" y="34" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8.5">{txt("weißt du noch")}</text>
          <text x="240" y="34" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="8.5">{txt("ist weg")}</text>
        </g>
      )}
    </Figur>
  );
}

/** Lesen gegen Abfragen. */
export function KritzelTesteffekt({ titel }: { titel?: string }) {
  return (
    <Figur vb="0 0 300 116" titel={titel}>
      {(f) => (
        <g filter={f} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="62" width="72" height="30" rx="5" fill="var(--bg-2)" stroke="var(--ink-faint)" strokeWidth="1.5" />
          <rect x="192" y="20" width="72" height="72" rx="5"
                fill="color-mix(in srgb, var(--ok) 20%, var(--card))" stroke="var(--ok)" strokeWidth="1.8" />
          <path d="M20 92h268" stroke="var(--ink-faint)" strokeWidth="1.3" />
          <text x="70" y="108" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("5× durchlesen")}</text>
          <text x="228" y="108" textAnchor="middle" fill="var(--ink)" stroke="none" fontSize="9">{txt("1× lesen, 4× abfragen")}</text>
          <text x="70" y="52" textAnchor="middle" fill="var(--ink-faint)" stroke="none" fontSize="9">{txt("fühlt sich sicher an")}</text>
          <text x="228" y="12" textAnchor="middle" fill="var(--ok)" stroke="none" fontSize="9">{txt("bleibt hängen")}</text>
        </g>
      )}
    </Figur>
  );
}
