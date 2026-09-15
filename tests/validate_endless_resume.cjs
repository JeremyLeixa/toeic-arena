/* Valide la reprise de session de l'Endless Arena.
 *
 * Le bug corrige : `test` etait regenere a chaque montage (useMemo) alors que la
 * session ne sauvegardait QUE les reponses, la position et le temps. Reprendre une
 * session rebranchait donc les reponses sur un test entierement different.
 *
 * Ce n'etait pas seulement du scoring faux : la GRILLE de reponses epouse la forme
 * du test, et la Part 7 n'a pas une forme fixe (les passages sont collectes jusqu'a
 * ~54 questions, donc 14 ou 15 passages de longueurs variables). Un `ans.p7` a 14
 * entrees rebranche sur un test a 15 passages fait exploser `ans.p7[qi][sqi]` en
 * pleine epreuve, apres deux heures de travail.
 *
 * Lancement :  node tests/validate_endless_resume.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// ── On requiert le VRAI module lib/endless.js (découpage d'App.jsx, 2026-09-15) ──
// require(esm) : Node >= 22.12 et package.json "type": "module". Le module importe les
// pools de data/ lui-même : plus de transpilation à la main, plus de découpage de texte.
const { generateEndlessTest, freshAnsFor, endlessAnsFitsTest } =
  require(path.join(ROOT, "src", "lib", "endless.js"));

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log("  FAIL " + msg); } };

// ── 1. Le probleme existe bien : deux tirages n'ont pas la meme forme ──
console.log("=== pourquoi la reprise devait persister le test ===");
const shapes = new Set();
for (let i = 0; i < 20; i++) {
  const t = generateEndlessTest();
  shapes.add(t.p7.length + ":" + t.p7.map(ps => ps.questions.length).join(","));
}
console.log("  20 tirages -> " + shapes.size + " formes de Part 7 differentes");
check(shapes.size > 1, "les tirages ont tous la meme forme : le test ne prouve plus rien");

// ── 2. Une grille construite pour un test colle a CE test ──
console.log("\n=== garde-fou endlessAnsFitsTest ===");
let selfOk = 0, crossRejected = 0, crossTotal = 0, wouldHaveCrashed = 0;
for (let i = 0; i < 40; i++) {
  const t1 = generateEndlessTest(), t2 = generateEndlessTest();
  const ans1 = freshAnsFor(t1);
  if (endlessAnsFitsTest(ans1, t1)) selfOk++;

  // Grille de t1 rebranchee sur t2 = exactement l'ancien bug.
  crossTotal++;
  if (!endlessAnsFitsTest(ans1, t2)) crossRejected++;

  // Est-ce que l'ancien code aurait plante ? (acces ans.p7[qi][sqi] sur t2)
  for (let qi = 0; qi < t2.p7.length; qi++) {
    if (!ans1.p7[qi]) { wouldHaveCrashed++; break; }
  }
}
console.log("  grille acceptee sur son propre test : " + selfOk + "/40");
console.log("  grille refusee sur un autre test    : " + crossRejected + "/" + crossTotal);
console.log("  tirages ou l'ancien code aurait jete un TypeError en Part 7 : " + wouldHaveCrashed + "/40");
check(selfOk === 40, "une grille fraiche est refusee par son propre test");
check(crossRejected === crossTotal, "une grille etrangere a ete ACCEPTEE : le garde-fou ne protege rien");

// ── 3. Aller-retour localStorage : le test survit a la serialisation ──
console.log("\n=== aller-retour JSON (ce que fait localStorage) ===");
const t = generateEndlessTest();
const ans = freshAnsFor(t);
// on repond a quelques questions, comme un eleve a mi-parcours
ans.p1[0] = 2; ans.p2[7] = 1; ans.p3[3][1] = 0; ans.p5[11] = 3;
ans.p7[t.p7.length - 1][0] = 2;

const storedTest = JSON.stringify({ date: "2026-09-15", test: t });
const storedSess = JSON.stringify({ date: "2026-09-15", ans: ans, sec: "p5", qi: 11, sqi: 0, timeLeft: 3600 });
const rt = JSON.parse(storedTest).test;
const rs = JSON.parse(storedSess);

console.log("  poids du test serialise : " + Math.round(storedTest.length / 1024) + " Ko" +
  "   session : " + Math.round(storedSess.length / 1024) + " Ko");
check(endlessAnsFitsTest(rs.ans, rt), "apres aller-retour JSON, la grille ne colle plus au test");
check(JSON.stringify(rt.p7.map(ps => ps.questions.length)) ===
  JSON.stringify(t.p7.map(ps => ps.questions.length)), "la forme de la Part 7 a change a la serialisation");
check(rs.ans.p1[0] === 2 && rs.ans.p3[3][1] === 0 && rs.ans.p7[rt.p7.length - 1][0] === 2,
  "des reponses ont ete perdues a l'aller-retour");
// le contenu doit etre identique, pas seulement la forme
check(rt.p2[0].opts.join("|") === t.p2[0].opts.join("|"), "les options P2 ont change a la serialisation");
check(JSON.stringify(rt.p1[0].aud) === JSON.stringify(t.p1[0].aud), "la permutation audio n'a pas survecu");
check(storedTest.length < 300 * 1024, "le test serialise depasse 300 Ko : trop lourd pour localStorage");

// ── 4. Un test restaure vide/casse doit etre refuse, pas plante ──
console.log("\n=== entrees degradees ===");
check(endlessAnsFitsTest(null, t) === false, "ans null accepte");
check(endlessAnsFitsTest(ans, null) === false, "test null accepte");
check(endlessAnsFitsTest({}, t) === false, "grille vide acceptee");
const truncated = JSON.parse(JSON.stringify(ans)); truncated.p7.pop();
check(endlessAnsFitsTest(truncated, t) === false, "grille tronquee en Part 7 acceptee");
const shortRow = JSON.parse(JSON.stringify(ans)); shortRow.p3[0] = [-1];
check(endlessAnsFitsTest(shortRow, t) === false, "ligne P3 trop courte acceptee");
console.log("  toutes les entrees degradees sont refusees proprement");

console.log(fails === 0 ? "\nOK - la reprise rejoue bien le meme test" : "\n" + fails + " ECHEC(S)");
process.exit(fails === 0 ? 0 : 1);
