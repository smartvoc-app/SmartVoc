import type { Settings } from "./types";

/* Research-backed default settings. Each is surfaced in the Settings
 * tab and labelled "Recommended" (best practice from learning psychology). */
export const RECOMMENDED: Partial<Settings> = {
  startAuswahl: "heute",  // womit die App aufmacht
  mode: "type",          // active recall (typing) beats recognition
  choicesCount: 4,        // multiple-choice options when in Choose mode
  /* Beispielsätze und Lautschrift: immer / nie / beim Üben wählbar.
     Empfohlen ist "wählbar" — es zeigt beides und legt die Entscheidung
     trotzdem dorthin, wo sie anfällt. Siehe lib/anzeige.ts. */
  beispieleModus: "waehlbar",
  phonetikModus: "waehlbar",
  formenModus: "waehlbar",
  beispieleAn: true,
  phonetikAn: true,
  formenAn: true,
  dailyGoal: 30,          // cards/day target (~15 min daily session)
  newPerDay: 10,          // new words introduced per day (8–12 is ideal)
  targetRetention: 0.9,    // V13: THE retention source (Lernintensität-Preset schreibt hierein)
  lernIntensity: "normal", // V8/V13: UI-Label-Hülle für targetRetention
  masteryCorrect: 3,      // internal default for classifyWord display (sliders removed in V8)
  lenientCase: false,     // Groß-/Kleinschreibung zaehlt: im Deutschen bedeutungstragend
  strictAccents: false,   // umlaut/accent slips = small mistake, not wrong
  articleMode: "required-partial", // missing der/die/das = small deduction
  acceptPartial: true,    // award partial credit for near-misses
  activePairs: ["en-de", "fr-de", "la-de"], // welche Sprachpaare sichtbar sind (reine Anzeige — Wörter bleiben erhalten)
  latinMacronsOptional: false, // Latein: Längenstriche standardmässig nötig (Punktabzug)
  latinMode: "L2",        // Latin: ask the Grundform, show the full Lernform
  tipsFrequency: "occasional", // sporadic study tips at natural pauses
  scheme: "kladde",       // Farbschema für die ganze App
  appearance: "auto",     // hell / dunkel / folgt dem Gerät
  readyGreen: 95,         // Ampel im Übungsplan — reine Darstellungsregel
  readyAmber: 70,
  cardStyle: "ruled",     // lined card + red margin (today's look)
  cardFont: "serif",      // card text font (today's look)
};
