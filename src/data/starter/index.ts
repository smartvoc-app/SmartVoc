/* Bundled starter wordlists (CR). JSON files under <pair>/stufe<N>.json are
 * auto-discovered at build time, so dropping new levels later needs no code
 * change — the UI shows whatever the manifest contains. Everything is bundled
 * → works offline; activation creates normal user data (syncs via Phase 3). */
import { fk, isLatinPair, PAIRS } from "../../lib/pairs";
import { txt } from "../../lib/i18n";

const mods = import.meta.glob("./*/stufe*.json", { eager: true }) as Record<string, any>;

export interface StarterEntry {
  pair: string; stufe: number; count: number; key: string; words: any[];
}

const shortOf = (pair: string) => PAIRS[pair]?.short || pair.split("-")[0].toUpperCase();

export const STARTERS: StarterEntry[] = Object.entries(mods).map(([path, mod]) => {
  const data = (mod as any).default || mod;
  const m = path.match(/\.\/([^/]+)\/stufe(\d+)\.json$/);
  const pair = data.pair || (m ? m[1] : "");
  const stufe = data.stufe || (m ? parseInt(m[2], 10) : 1);
  const words = data.words || [];
  return { pair, stufe, count: words.length, key: `${pair}:${stufe}`, words };
}).sort((a, b) => a.pair.localeCompare(b.pair) || a.stufe - b.stufe);

/* Der Name entsteht ERST beim Anlegen, nicht beim Laden des Moduls.
 *
 * Das Verzeichnis oben wird gebaut, sobald die Datei importiert wird -- also
 * bevor App.tsx die Oberflaechensprache gesetzt hat. Ein hier gebildeter Name
 * waere immer deutsch, auch auf einer englischen Oberflaeche. Danach ist er
 * ein gewoehnlicher Listenname, also Nutzerdaten: eine bestehende Liste wird
 * nie nachtraeglich umbenannt. */
export const starterLabel = (e: StarterEntry) =>
  txt("Grundwortschatz {kuerzel} · Stufe {n}", { kuerzel: shortOf(e.pair), n: e.stufe });

export const starterKey = (pair: string, stufe: number) => `${pair}:${stufe}`;
export const getStarter = (pair: string, stufe: number) => STARTERS.find((s) => s.pair === pair && s.stufe === stufe);
export const isStarterActivated = (settings: any, pair: string, stufe: number) =>
  (settings.activatedStarters || []).includes(starterKey(pair, stufe));

/* Idempotent activation: maps the bundled words onto the internal model,
 * dedupes against the user's existing vocab (foreign|de, or grundform|de for
 * Latin), creates the list only when there is something new, and records the
 * activation flag so it isn't offered again. Re-activating duplicates nothing. */
export function activateStarter(store: any, pair: string, stufe: number) {
  const entry = getStarter(pair, stufe);
  if (!entry) return { added: 0, already: false, label: "" };
  const activated: string[] = store.settings.activatedStarters || [];
  const already = activated.includes(entry.key);
  const isLat = isLatinPair(pair);
  const foreign = fk(pair);

  /* Die mitgelieferten Listen tragen inzwischen alles, was ein Wort tragen
   * kann: zwei Beispielsaetze mit Uebersetzung und die Aussprache. Frueher
   * wurden hier nur Wort und Uebersetzung uebernommen -- der Rest lag in der
   * Datei und kam nie an. */
  const zusatz = (w: any) => {
    const bsp = (w.examples || []).map((x: any) => String(x || "").trim());
    const bspDe = (w.examplesDe || []).map((x: any) => String(x || "").trim());
    const o: any = {};
    if (bsp.some(Boolean)) o.examples = bsp;
    if (bspDe.some(Boolean)) o.examplesDe = bspDe;
    if (w.phonetic) o.phonetic = String(w.phonetic).trim();
    if (w.genus) o.genus = String(w.genus).trim();
    if (w.wortart) o.wortart = String(w.wortart).trim();
    /* Die Formen gibt es jetzt in jeder Sprache, nicht nur im Lateinischen --
     * dort trug sie das Feld `lernform` schon immer. */
    if (w.lernform) o.lernform = String(w.lernform).trim();
    return o;
  };
  const mapped = entry.words.map((w: any) => isLat
    ? { grundform: w.grundform || "", de: w.german || "", pair, ...zusatz(w) }
    : { [foreign]: w.foreign || "", de: w.german || "", pair, ...zusatz(w) });

  const keyOf = (w: any) => (isLat ? ((w.grundform || "") + "|" + (w.de || "")) : ((w[foreign] || "") + "|" + (w.de || ""))).toLowerCase();
  const existing = new Set(store.vocab.filter((w: any) => w.pair === pair).map(keyOf));
  const fresh = mapped.filter((w: any) => !existing.has(keyOf(w)));

  if (fresh.length) {
    const listId = store.addList(starterLabel(entry), pair, { herkunft: "grundwortschatz" });
    store.addWords(fresh.map((w: any) => ({ ...w, lists: [listId], source: "seed", review: false })));
  }
  if (!already) store.setSettings({ activatedStarters: [...activated, entry.key] });

  return { added: fresh.length, already, label: starterLabel(entry) };
}
