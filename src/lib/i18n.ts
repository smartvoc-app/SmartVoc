/* ===================================================================
 * Oberflächensprache (Stufe 7) — Deutsch und Englisch.
 *
 * Der deutsche Text IST der Schlüssel. Das ist ungewöhnlich: üblich wären
 * erfundene Schlüssel wie "practice.card.hint". Hier wäre das ein Verlust.
 * Die deutschen Formulierungen sind über viele Runden verhandelt worden;
 * stünde im Code nur noch ein Schlüssel, wäre beim Lesen nicht mehr zu
 * sehen, was auf dem Bildschirm steht — und die nächste Änderung würde am
 * Text vorbei gemacht.
 *
 * Fehlt eine Übersetzung, erscheint der deutsche Satz. Das ist die richtige
 * Ausfallart: lieber ein deutscher Satz in einer englischen Oberfläche als
 * ein nackter Schlüssel oder eine leere Stelle. Fehlende Übersetzungen
 * meldet `missingTranslations()` — im Entwicklungsmodus schreibt sie die
 * Konsole voll, damit sie nicht unbemerkt bleiben.
 *
 * Platzhalter: txt("{n} Wörter", { n: 5 }). Bewusst keine Pluralregeln im
 * Rahmen — die wenigen Stellen, an denen es darauf ankommt, entscheiden
 * selbst und übergeben den fertigen Satz.
 * =================================================================== */
import { EN } from "./i18n.en";

export type UiLang = "de" | "en";

const TABLES: Record<UiLang, Record<string, string>> = { de: {}, en: EN };

let current: UiLang = "de";
const missing = new Set<string>();

/** Wird beim Rendern der Schale gesetzt, bevor Kinder rendern. */
export function setUiLang(lang: UiLang) { current = lang === "en" ? "en" : "de"; }
export function getUiLang(): UiLang { return current; }

/** Voreinstellung aus dem Gerät: alles außer Deutsch bekommt Englisch. */
export function detectUiLang(): UiLang {
  try {
    const l = (navigator.language || "de").toLowerCase();
    return l.startsWith("de") ? "de" : "en";
  } catch { return "de"; }
}

/* Heisst txt und nicht t, weil t in diesem Code an einem Dutzend Stellen
 * eine Laufvariable ist -- ein stiller Namenskonflikt waere genau die Art
 * Fehler, die erst beim Benutzer auffaellt. */
export function txt(de: string, vars?: Record<string, string | number>): string {
  let s = de;
  if (current !== "de") {
    const hit = TABLES[current][de];
    if (hit) s = hit;
    else if (!missing.has(de)) {
      missing.add(de);
      if (import.meta.env?.DEV) console.warn("[i18n] keine Übersetzung:", JSON.stringify(de));
    }
  }
  if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
  return s;
}

export function missingTranslations(): string[] { return [...missing].sort(); }
