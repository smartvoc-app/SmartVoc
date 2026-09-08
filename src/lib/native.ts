/* ===================================================================
 * Die native Schicht — Haptik und System-Teilen.
 *
 * Beides ist auf dem Web nicht vorhanden und darf dort nichts kaputt
 * machen. Deshalb kapselt diese Datei die Unterscheidung an genau einer
 * Stelle: die aufrufenden Bauteile fragen nie nach der Plattform, sie
 * rufen einfach auf, und auf dem Web passiert eben nichts (Haptik) oder
 * es wird auf die Zwischenablage ausgewichen (Teilen).
 * =================================================================== */
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Share } from "@capacitor/share";

const nativ = () => Capacitor.isNativePlatform();

/* Die Plattform-Frage gehoert hierher, wie alles andere Geraetenahe auch.
 * Bauteile fragen `istWeb()`, nicht Capacitor -- so gibt es einen Begriff
 * und eine Quelle. Bewusst NICHT ueber import.meta.env: das waere ein
 * zweiter Wahrheitswert neben isNativePlatform(), und die zwei koennen im
 * Entwicklungsserver auseinanderfallen. */
export const istApp = () => Capacitor.isNativePlatform();
export const istWeb = () => !Capacitor.isNativePlatform();

/* Die Adresse, unter der die Webfassung erreichbar ist.
 *
 * Im Browser ist das die eigene Herkunft. In der App waere es
 * "capacitor://localhost/" -- die interne Adresse, unter der Capacitor die
 * App im WebView ausliefert. Ein Link darauf oeffnet bei niemandem etwas:
 * nicht im Browser, nicht auf einem anderen Geraet, nicht einmal auf
 * demselben Telefon. Deshalb zeigt die App auf die Webfassung. Beide
 * benutzen dasselbe Supabase-Projekt, der Empfaenger landet also an der
 * richtigen Stelle.
 *
 * Ohne VITE_WEB_URL gibt es keine stille Ersatzadresse: lieber gar kein
 * Link als einer, der aussieht, als wuerde er funktionieren. */
export function webBasis(): string | null {
  if (!Capacitor.isNativePlatform()) return window.location.origin + import.meta.env.BASE_URL;
  const web = (import.meta.env.VITE_WEB_URL as string | undefined)?.trim();
  return web ? web.replace(/\/*$/, "/") : null;
}

/* Haptik sparsam: nur dort, wo das Gerät eine Rückmeldung gibt, die der
 * Bildschirm nicht geben kann — beim Bewerten einer Antwort. Nicht bei
 * jedem Knopfdruck; ein dauernd vibrierendes Gerät ist ermüdend. */
export function tapRichtig() {
  if (nativ()) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
export function tapFalsch() {
  if (nativ()) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}
export function tapLeicht() {
  if (nativ()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/* Teilen: auf dem Gerät das Systemblatt, im Browser die Zwischenablage.
 * Gibt zurück, welcher Weg genommen wurde, damit der Aufrufer die richtige
 * Rückmeldung zeigen kann — „geteilt" und „kopiert" sind nicht dasselbe. */
export async function teilen(opts: { titel: string; text: string; url?: string }): Promise<"geteilt" | "kopiert" | "gescheitert"> {
  if (nativ()) {
    try {
      await Share.share({ title: opts.titel, text: opts.text, url: opts.url, dialogTitle: opts.titel });
      return "geteilt";
    } catch (e) {
      return "gescheitert";   // der Benutzer hat abgebrochen, oder es ging nicht
    }
  }
  /* Im Browser: das Systemblatt, wo es das gibt (Safari und Chrome auf dem
   * Telefon, Safari auf dem Mac -- immer nur über HTTPS). Dort liegen
   * dieselben Wege wie in der App: Mail, WhatsApp, Nachrichten.
   *
   * Wo es das nicht gibt, bleibt die Zwischenablage. Ein Abbruch durch den
   * Benutzer ist KEIN Grund, ersatzweise zu kopieren: wer abbricht, will
   * nicht teilen, und eine stille Kopie in der Zwischenablage wäre eine
   * Handlung, die er nicht verlangt hat. */
  const kann = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";
  if (kann) {
    try {
      await (navigator as any).share({ title: opts.titel, text: opts.text, url: opts.url });
      return "geteilt";
    } catch (e: any) {
      if (e && e.name === "AbortError") return "gescheitert";
      /* Sonst hat der Browser abgelehnt (kein HTTPS, keine Nutzergeste) --
         dann doch kopieren. */
    }
  }
  try {
    await navigator.clipboard.writeText([opts.text, opts.url].filter(Boolean).join("\n"));
    return "kopiert";
  } catch (e) {
    return "gescheitert";
  }
}
