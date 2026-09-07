/* Baut die oeffentliche Datenschutz- und Impressumsseite.
 *
 * Apple verlangt fuer den App Store eine frei erreichbare Adresse mit der
 * Datenschutzerklaerung; in der App allein genuegt sie nicht. Die Seite
 * liest denselben Text wie das Fenster "Ueber SmartVoc" -- zwei Fassungen
 * eines Rechtstextes waeren zwei Gelegenheiten, ihn auseinanderlaufen zu
 * lassen.
 *
 * Laeuft vor dem Web-Build und schreibt nach public/, von wo Vite die
 * Datei unveraendert nach dist/ kopiert.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quelle = fs.readFileSync(path.join(wurzel, "src/lib/recht.ts"), "utf8");

/* Die Datei ist reines TypeScript ohne Ausdruecke -- der Inhalt laesst sich
   also lesen, ohne TypeScript zu uebersetzen. */
function abschnitte(name) {
  const anfang = quelle.indexOf(`export const ${name}: Abschnitt[] = [`);
  const ende = quelle.indexOf("\n];", anfang);
  const roh = quelle.slice(anfang, ende);
  const aus = [];
  for (const m of roh.matchAll(/\{\s*(?:h:\s*"((?:[^"\\]|\\.)*)",\s*)?p:\s*\[([\s\S]*?)\],\s*\}/g)) {
    const p = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => entschluepft(x[1]));
    aus.push({ h: m[1] ? entschluepft(m[1]) : "", p });
  }
  return aus;
}
const entschluepft = (t) => t.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
const sicher = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const teil = (titel, liste) =>
  `<h2>${sicher(titel)}</h2>\n` +
  liste.map((a) =>
    (a.h ? `<h3>${sicher(a.h)}</h3>\n` : "") +
    a.p.map((t) => `<p>${sicher(t).replace(/\n/g, "<br>")}</p>`).join("\n")
  ).join("\n");

const heute = new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });

const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartVoc – Datenschutz und Impressum · Privacy and imprint</title>
<meta name="description" content="Datenschutzerklärung und Impressum der Vokabeltrainer-App SmartVoc.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Hanken+Grotesk:wght@400;600;700&display=swap">
<style>
  :root { --grund:#eae0cc; --papier:#f7f1e2; --tinte:#2b2620; --matt:#585144;
          --linie:#dbcdb1; --rost:#8a4a32; }
  @media (prefers-color-scheme: dark) {
    :root { --grund:#221f1a; --papier:#2b2721; --tinte:#efe6d4; --matt:#b3a891;
            --linie:#413b31; --rost:#c8815e; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--grund); color:var(--tinte);
         font-family:"Hanken Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
         font-size:16px; line-height:1.6; -webkit-font-smoothing:antialiased; }
  .blatt { max-width:680px; margin:0 auto; padding:44px 20px 80px; }
  .karte { background:var(--papier); border:1px solid var(--linie); border-radius:18px;
           padding:34px 30px 40px; }
  h1 { font-family:"Source Serif 4",Georgia,serif; font-size:clamp(28px,6vw,38px);
       font-weight:600; margin:0 0 6px; letter-spacing:-.015em; }
  .unter { color:var(--matt); margin:0 0 6px; }
  .stand { color:var(--matt); font-size:14px; margin:0 0 30px; }
  h2 { font-family:"Source Serif 4",Georgia,serif; font-size:24px; font-weight:600;
       margin:38px 0 10px; padding-top:24px; border-top:1px solid var(--linie); }
  h2:first-of-type { border-top:none; padding-top:0; margin-top:0; }
  h3 { font-size:16px; font-weight:700; margin:22px 0 6px; }
  p { margin:0 0 12px; color:var(--matt); }
  a { color:var(--rost); }
  .zurueck { display:inline-block; margin-top:34px; color:var(--rost);
             text-decoration:none; font-weight:600; }
  .zurueck:hover { text-decoration:underline; }
  /* Die englische Fassung steht auf derselben Seite, nicht unter einer
     eigenen Adresse: Apple hinterlegt EINE Adresse, und die muss fuer jeden
     Pruefer lesbar sein. */
  .sprachwechsel { margin-top:38px; padding-top:24px; border-top:1px solid var(--linie); }
  .sprachwechsel a { font-weight:600; text-decoration:none; }
  .sprachwechsel a:hover { text-decoration:underline; }
  #english h2:first-of-type { border-top:none; padding-top:0; margin-top:22px; }
</style>
</head>
<body>
  <div class="blatt">
    <div class="karte">
      <h1>SmartVoc</h1>
      <p class="unter">Datenschutz und Impressum</p>
      <p class="stand">Stand: ${heute}</p>
${teil("Datenschutz", abschnitte("DATENSCHUTZ"))}
${teil("Impressum", abschnitte("IMPRESSUM"))}
      <div class="sprachwechsel"><a href="#english">In English</a></div>
      <div id="english" lang="en">
${teil("Privacy", abschnitte("DATENSCHUTZ_EN"))}
${teil("Imprint", abschnitte("IMPRESSUM_EN"))}
      </div>
      <a class="zurueck" href="./">Zurück zu SmartVoc</a>
    </div>
  </div>
</body>
</html>
`;

fs.mkdirSync(path.join(wurzel, "public"), { recursive: true });
fs.writeFileSync(path.join(wurzel, "public/datenschutz.html"), seite);
console.log("datenschutz.html geschrieben:", seite.length, "Zeichen");
