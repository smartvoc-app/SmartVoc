/* Liest das Fehlerbuch und gibt seine Zeilen als JSON aus.
 * Gegenstueck zu bau-fehlerbuch.py, das aus demselben JSON die Mappe wieder
 * schreibt. Zwei Sprachen, weil `xlsx` alles LESEN kann, was Excel je
 * gespeichert hat, aber weder Klapplisten noch Formate SCHREIBT. */
const XLSX = require("xlsx");
const wb = XLSX.readFile(process.argv[2]);
const ws = wb.Sheets["Fehler und Änderungen"] || wb.Sheets[wb.SheetNames[0]];
const r = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false, raw: true });
const iso = (v) => {
  if (typeof v === "number") {                       // Excel-Tageszahl
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return String(v || "");
};
const zeilen = r.slice(1).filter((z) => z[5]).map((z) => ({
  datum: iso(z[1]), von: z[2], typ: z[3], bereich: z[4], titel: z[5],
  ist: z[6], soll: z[7], geraet: z[8], schwere: z[9], prio: z[10],
  status: z[11], build: z[12], notiz: z[13],
}));
process.stdout.write(JSON.stringify(zeilen, null, 1));
