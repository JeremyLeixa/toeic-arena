/* Valide la randomisation de la position des bonnes reponses en listening.
 *
 * Contexte : les pools listening etaient rediges avec un biais positionnel fort
 * (B = 43% en P2, 55% en P4). Un etudiant iabd2627 l'a signale le 2026-09-15 :
 * "toutes les bonnes reponses sont B, pas besoin d'ecouter". On permute donc les
 * options au runtime, ce qui cree deux invariants fragiles a proteger :
 *
 *   I1  AUDIO      opts[i] doit etre l'option dont le MP3 est {id}_{aud[i]}.mp3.
 *                  Si ca casse, l'eleve entend A et l'app score C (P1/P2 sont en
 *                  aveugle dans l'Endless : le bug serait invisible a l'oeil nu).
 *   I2  EXPLICATION Les lettres citees dans `x` doivent suivre la permutation,
 *                  sans jamais toucher l'article anglais "A" ("A laptop is...").
 *
 * Lancement :  node tests/validate_listening_shuffle.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// CRLF normalise : les marqueurs d'extraction ci-dessous utilisent "\n".
const src = fs.readFileSync(path.join(ROOT, "src", "App.jsx"), "utf8").replace(/\r\n/g, "\n");

// ── On evalue le VRAI bloc helper extrait d'App.jsx, pas une copie ──
function extract(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error("helper block not found in App.jsx: " + startMarker);
  return src.slice(a, b);
}
const helperSrc =
  "function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}\n" +
  extract("function shufListeningOpts(", "// Permute un item listening complet") +
  extract("function shufListeningItem(", "\n}\n", 1) +
  "\n}\n" +
  "module.exports={shufListeningItem:shufListeningItem,remapOptLetters:remapOptLetters};";

const mod = { exports: {} };
new Function("module", "exports", helperSrc)(mod, mod.exports);
const { shufListeningItem, remapOptLetters } = mod.exports;

let fails = 0;
function check(cond, msg) {
  if (!cond) { fails++; console.log("  FAIL " + msg); }
}

// ── Chargement des pools (ESM -> on transpile a la main le strict necessaire) ──
const lisSrc = fs.readFileSync(path.join(ROOT, "src", "data", "listening.js"), "utf8")
  .replace(/^export var /gm, "var ");
const pools = new Function(lisSrc + ";return{P1:LISTENING_P1,P2:LISTENING_P2,P3:LISTENING_P3,P4:LISTENING_P4};")();

const flat = {
  P1: pools.P1,
  P2: pools.P2,
  P3: [].concat.apply([], pools.P3.map(c => c.qs)),
  P4: [].concat.apply([], pools.P4.map(t => t.qs)),
};

console.log("=== I1 : l'option affichee en position i est bien celle du MP3 aud[i] ===");
for (const name of Object.keys(flat)) {
  let n = 0;
  for (const orig of flat[name]) {
    for (let trial = 0; trial < 5; trial++) {
      const it = shufListeningItem(orig);
      // aud est une permutation complete
      const seen = it.aud.slice().sort((a, b) => a - b);
      check(seen.length === orig.opts.length && seen.every((v, k) => v === k),
        name + " " + orig.id + ": aud n'est pas une permutation (" + it.aud + ")");
      // INVARIANT AUDIO : texte en position i <-> audio d'index aud[i]
      for (let i = 0; i < it.opts.length; i++) {
        check(it.opts[i] === orig.opts[it.aud[i]],
          name + " " + orig.id + ": opts[" + i + "] ne correspond pas a l'audio aud[" + i + "]");
      }
      // La bonne reponse reste le meme TEXTE qu'a l'origine
      check(it.opts[it.c] === orig.opts[orig.c],
        name + " " + orig.id + ": la bonne reponse a change de texte");
      n++;
    }
  }
  console.log("  " + name.padEnd(3) + " " + n + " permutations verifiees");
}

console.log("\n=== I2 : lettres des explications ===");
// P2 : aucune occurrence de A/B/C n'est un article (verifie sur les 230 items),
// donc apres permutation AUCUNE lettre d'origine ne doit subsister a l'identique
// quand la permutation deplace cette lettre.
let p2checked = 0;
for (const orig of flat.P2) {
  const aud = [2, 0, 1];                       // permutation fixe: A->C, B->A, C->B
  const x2 = remapOptLetters(orig.x, aud);
  const expect = orig.x
    .replace(/(^|[^A-Za-z'])A(?![A-Za-z'])/g, "$1<1>")
    .replace(/(^|[^A-Za-z'])B(?![A-Za-z'])/g, "$1<2>")
    .replace(/(^|[^A-Za-z'])C(?![A-Za-z'])/g, "$1<0>")
    .replace(/<0>/g, "A").replace(/<1>/g, "B").replace(/<2>/g, "C");
  check(x2 === expect, "P2 " + orig.id + "\n      got: " + x2 + "\n      exp: " + expect);
  p2checked++;
}
console.log("  P2  " + p2checked + " explications remappees integralement");

// P1 : l'article "A" doit rester intact.
const ARTICLES = ["A laptop", "A woman", "A man", "A yellow", "A small", "A mechanic",
  "A TSA", "A hand", "A group", "A large", "A cashier", "A single", "A stone"];
let artOk = 0;
for (const orig of flat.P1) {
  const x2 = remapOptLetters(orig.x, [3, 2, 1, 0]);
  for (const art of ARTICLES) {
    if (orig.x.indexOf(art) >= 0) {
      check(x2.indexOf(art) >= 0, "P1 " + orig.id + ": l'article \"" + art + "\" a ete remappe");
      artOk++;
    }
  }
}
console.log("  P1  " + artOk + " articles anglais preserves");

console.log("\n=== distribution apres permutation (attendu ~uniforme) ===");
for (const name of Object.keys(flat)) {
  const n = flat[name][0].opts.length;
  const tally = new Array(n).fill(0);
  let total = 0;
  for (const orig of flat[name]) {
    for (let t = 0; t < 40; t++) { tally[shufListeningItem(orig).c]++; total++; }
  }
  const pct = tally.map(v => (v / total * 100).toFixed(1) + "%");
  const worst = Math.max.apply(null, tally.map(v => Math.abs(v / total - 1 / n)));
  check(worst < 0.02, name + ": distribution non uniforme (" + pct.join(" ") + ")");
  console.log("  " + name.padEnd(3) + " " + pct.join("  ") + "   (ecart max " + (worst * 100).toFixed(2) + " pts)");
}

console.log(fails === 0 ? "\nOK - tous les invariants tiennent" : "\n" + fails + " ECHEC(S)");
process.exit(fails === 0 ? 0 : 1);
