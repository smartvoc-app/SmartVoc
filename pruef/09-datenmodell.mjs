/* Prüfprotokoll 9: Die Regel «ein Wort, eine Liste» im Bestand.
 * Prüft die Daten, nicht die Absicht: ein Wort ohne Liste oder mit zweien
 * ist ungültig, egal wie es dorthin kam. */
const pruefe = (vocab, lists, was, sollGesund = true) => {
  const gueltig = new Set(lists.map((l) => l.id));
  const ohne = vocab.filter((w) => !(w.lists || []).some((id) => gueltig.has(id)));
  const mehrere = vocab.filter((w) => (w.lists || []).filter((id) => gueltig.has(id)).length > 1);
  const doppelteIds = vocab.map((w) => w.id).filter((id, i, a) => a.indexOf(id) !== i);
  const summe = lists.reduce((n, l) => n + vocab.filter((w) => (w.lists || []).includes(l.id)).length, 0);
  const ok = !ohne.length && !mehrere.length && !doppelteIds.length && summe === vocab.length;
  const wieErwartet = ok === sollGesund;
  console.log(`  ${wieErwartet ? "OK   " : "FEHLER"} ${was.padEnd(46)} ${vocab.length} Wörter, Summe der Listen ${summe}` +
    (ohne.length ? `, ${ohne.length} ohne Liste` : "") +
    (mehrere.length ? `, ${mehrere.length} in mehreren` : "") +
    (doppelteIds.length ? `, ${doppelteIds.length} doppelte Ids` : ""));
  return wieErwartet;
};

/* Die Trennung, wie StoreProvider sie vornimmt. */
let n = 0;
const neueId = () => "neu" + (++n);
const eineListeJeWort = (v) => {
  if (!Array.isArray(v) || !v.some((w) => ((w && w.lists) || []).length > 1)) return v;
  const raus = [];
  for (const w of v) {
    const ls = (w && w.lists) || [];
    if (ls.length <= 1) { raus.push(w); continue; }
    raus.push({ ...w, lists: [ls[0]] });
    for (const weitere of ls.slice(1)) raus.push({ ...w, id: neueId(), lists: [weitere], source: "kopie" });
  }
  return raus;
};

const listen = [{ id: "L1" }, { id: "L2" }];
let ok = 0, fehl = 0; const zaehl = (g) => g ? ok++ : fehl++;

/* So sah der gemeldete Zustand aus */
const krank = Array.from({ length: 100 }, (_, i) => ({ id: "w" + i, lists: ["L1", "L2"] }));
zaehl(pruefe(krank, listen, "kranker Zustand wird erkannt", false));
zaehl(pruefe(eineListeJeWort(krank), listen, "nach der Trennung"));

/* Gemischt: einige einfach, einige doppelt */
const gemischt = [...Array.from({ length: 30 }, (_, i) => ({ id: "a" + i, lists: ["L1"] })),
                  ...Array.from({ length: 20 }, (_, i) => ({ id: "b" + i, lists: ["L1", "L2"] }))];
zaehl(pruefe(eineListeJeWort(gemischt), listen, "gemischt: 30 einfach, 20 doppelt"));

/* Bereits sauber: die Funktion darf nichts anfassen */
const sauber = Array.from({ length: 10 }, (_, i) => ({ id: "s" + i, lists: [i % 2 ? "L1" : "L2"] }));
const nachher = eineListeJeWort(sauber);
zaehl(pruefe(nachher, listen, "bereits sauber, bleibt unberührt"));
console.log(`  ${nachher === sauber ? "OK   " : "FEHLER"} ${"unveränderter Bestand wird nicht kopiert".padEnd(46)} ${nachher === sauber}`);
nachher === sauber ? ok++ : fehl++;

console.log(`\n${ok} in Ordnung, ${fehl} fehlerhaft`);
