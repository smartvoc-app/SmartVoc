/* Was jemand darf — an genau einer Stelle.
 *
 * In V1 darf jeder alles: es gibt keinen Weg, Pro zu kaufen, also wäre eine
 * Grenze eine Sackgasse. Trotzdem steht der Mechanismus schon hier, und zwar
 * aus einem Grund: **Besitzstand**. Wer die App in V1 benutzt, muss in V2
 * behalten, was er hat. Das geht nur, wenn der Anspruch AUFGESCHRIEBEN ist,
 * nicht bei jedem Start neu ausgerechnet.
 *
 * Deshalb:
 *
 *   settings.plan        "gratis" | "pro"        — was gilt
 *   settings.planQuelle  woher er kommt          — bestandsschutz | apple | web | v1
 *   settings.planSeit    seit wann               — Zeitstempel
 *
 * Der Wert wird beim ersten Start gestempelt und danach nie von selbst
 * geändert. V2 kann die Voreinstellung für NEUE Installationen auf "gratis"
 * setzen, ohne irgendjemanden anzufassen, der schon einen Stempel trägt.
 * Das ist der ganze Trick, und er kostet heute nichts.
 *
 * Die Oberfläche fragt nie nach `settings.plan`. Sie fragt `darf(...)` oder
 * `grenze(...)`. Wenn V2 die Quelle wechselt — von den Einstellungen auf eine
 * Berechtigungstabelle vom Server —, ändert sich diese Datei, sonst nichts.
 */
import type { Settings } from "./types";

export type Plan = "gratis" | "pro";
export type PlanQuelle = "v1" | "bestandsschutz" | "apple" | "web" | "geschenk";

/** Was V1 einem frischen Start gibt. In V2 wird das "gratis". */
export const PLAN_NEU: Plan = "pro";
export const PLAN_QUELLE_NEU: PlanQuelle = "v1";

/** Die Grenzen der Gratis-Fassung. Der Grundwortschatz zählt NICHT mit --
 *  er ist mitgeliefert, nicht selbst gemacht; zählte er, wäre die App beim
 *  ersten Start sofort voll. */
export const GRENZEN = {
  gratis: { eigeneListenJeSprache: 1, woerterJeListe: 40, teilen: false },
  pro:    { eigeneListenJeSprache: Infinity, woerterJeListe: Infinity, teilen: true },
} as const;

export function planVon(settings: Partial<Settings> | any): Plan {
  const p = settings?.plan;
  return p === "gratis" || p === "pro" ? p : PLAN_NEU;
}

/** Die einzige Frage, die die Oberfläche stellt. */
export function darf(settings: any, was: "teilen" | "listeAnlegen" | "wortAnlegen",
                     zahl = 0): boolean {
  const g = GRENZEN[planVon(settings)];
  if (was === "teilen") return g.teilen;
  if (was === "listeAnlegen") return zahl < g.eigeneListenJeSprache;
  return zahl < g.woerterJeListe;
}

/** Für Texte wie „40 Wörter in der Gratis-Fassung". `Infinity` heißt: keine
 *  Zahl nennen, sondern gar nichts sagen. */
export function grenze(settings: any, was: "listen" | "woerter"): number {
  const g = GRENZEN[planVon(settings)];
  return was === "listen" ? g.eigeneListenJeSprache : g.woerterJeListe;
}

/* Der Stempel beim ersten Start. Läuft einmal; wer schon einen trägt, behält
 * ihn. `bestehend` heißt: auf diesem Gerät liegen bereits Wörter -- dann ist
 * es keine Neuinstallation, sondern jemand, der die App schon benutzt. */
export function stempelPlan(settings: any, bestehend: boolean): Partial<Settings> | null {
  if (settings?.plan) return null;
  return {
    plan: PLAN_NEU,
    planQuelle: bestehend ? "bestandsschutz" : PLAN_QUELLE_NEU,
    planSeit: Date.now(),
  } as any;
}
