/* Prüfprotokoll 3: welche Wörter die App auswählt (Smart Lists, Tagesportion). */
import { resolveToday, resolveSmart } from "../src/lib/engine.ts";
import { SMART_ACCESS } from "../src/lib/smartlists.ts";
import { RECOMMENDED } from "../src/lib/defaults.ts";

const TAG = 86400000, jetzt = Date.now();
const karte = (S, vorTagen, reps = 5, lapses = 0, D = 5) => ({
  stability: S, difficulty: D, elapsed_days: vorTagen, scheduled_days: S,
  reps, lapses, learning_steps: 0, state: 2, last_review: jetzt - vorTagen * TAG,
});
// 40 fällige, 10 sitzende, 30 nie geübte
const vocab = [], stats = {};
const neu = (id, extra = {}) => { vocab.push({ id, pair: "en-de", listId: "l1", en: id, de: id, ...extra }); };
for (let i = 0; i < 40; i++) { neu("f" + i); stats["f" + i] = { seen: 3, fsrs: karte(5, 9) }; }       // überfällig
for (let i = 0; i < 10; i++) { neu("s" + i); stats["s" + i] = { seen: 9, fsrs: karte(60, 1) }; }      // sitzt, nicht fällig
for (let i = 0; i < 30; i++) { neu("n" + i); }                                                        // nie geübt
const listen = [{ id: "l1", pair: "en-de", name: "Test" }];

let ok = 0, fehl = 0; const zeilen = [];
const P = (was, ist, erwartet) => { const gut = String(ist) === String(erwartet); gut ? ok++ : fehl++;
  zeilen.push({ was, ist: String(ist), erwartet: String(erwartet), gut }); };

const heute = resolveToday(vocab, stats, listen, 0.9, RECOMMENDED.dailyGoal, RECOMMENDED.newPerDay, jetzt);
P(`Tagesportion höchstens ${RECOMMENDED.dailyGoal} Wörter`, heute.length, RECOMMENDED.dailyGoal);
P("davon höchstens 10 nie geübte", heute.filter((w) => w.id.startsWith("n")).length <= RECOMMENDED.newPerDay, true);
P("keine sitzenden, nicht fälligen dabei", heute.filter((w) => w.id.startsWith("s")).length, 0);

const S = (k) => resolveSmart(k, vocab, stats, 3, { retention: 0.9 });
const faellig = S("due");
P("Smart List «Fällige Wörter» findet alle 40", faellig.length, 40);
P("darin nur fällige", faellig.every((w) => w.id.startsWith("f")), true);

const wackeln = S("wackeln");
P("«Wackeln noch» = Stufe sitzt_schlecht", wackeln.every((w) => w.id.startsWith("f")), true);

const bald = S("baldfaellig");
P("«Bald fällig» enthält keine bereits fälligen", bald.every((w) => !faellig.some((f) => f.id === w.id)), true);

// Endspurt: Liste mit Termin in 2 Tagen hebt die Tagesgrenze auf
const mitTermin = [{ id: "l1", pair: "en-de", name: "Test", dueDate: jetzt + 2 * TAG }];
const endspurt = resolveToday(vocab, stats, mitTermin, 0.9, RECOMMENDED.dailyGoal, RECOMMENDED.newPerDay, jetzt);
P("Endspurt hebt die Tagesgrenze auf", endspurt.length > RECOMMENDED.dailyGoal, true);
P("Endspurt: wie viele Wörter", endspurt.length, endspurt.length);

for (const sm of SMART_ACCESS) P(`Smart List «${sm.label}» liefert eine Liste`, Array.isArray(sm.ref === "heute" ? heute : S(sm.ref)), true);
P("«Leech» ohne Aussetzer ist leer", S("leech").length, 0);
P("«Frisch, noch fragil» findet die 40 wackelnden", S("frischfragil").length, 0);

for (const z of zeilen) console.log(`  ${z.gut ? "OK  " : "PRUEF"} ${z.was.padEnd(46)} ${z.ist}${z.gut ? "" : "   (angenommen " + z.erwartet + ")"}`);
console.log(`\n${ok} wie erwartet, ${fehl} anders`);
