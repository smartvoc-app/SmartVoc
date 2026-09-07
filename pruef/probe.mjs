import { scoreAnswer } from "../src/lib/scoring.ts";
const z = (u,c,o={}) => { const r = scoreAnswer(u,c,o);
  console.log(`  "${u}" gegen "${c}" ${JSON.stringify(o)} -> ${r.verdict}/${r.score} [${r.errorType}] ${r.note}`); };
console.log("Gross/klein:");
z("haus","Haus"); z("Haus","haus"); z("hund","Hund"); z("la maison","La Maison");
console.log("Akzente streng gegen nachsichtig:");
z("ecole","école"); z("ecole","école",{strictAccents:true});
z("grun","grün"); z("grun","grün",{strictAccents:true});
z("gedaechtnis","gedächtnis"); z("gedaechtnis","gedächtnis",{strictAccents:true});
