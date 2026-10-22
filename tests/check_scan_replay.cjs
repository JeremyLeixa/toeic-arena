/* Reprise du Battle Scan (src/scanEngine.js, 2026-10-22).
 *
 * POURQUOI CE TEST EXISTE. L'onboarding garde en sessionStorage la graine de chaque section et les réponses
 * données, et rejoue (replayCatController) après une interruption : appel, changement d'appli sur iPhone,
 * rechargement. Rien ne casse le build si :
 *  · un tirage repasse par Math.random sans la graine → la reprise sert une AUTRE question que celle qui
 *    était à l'écran, et le niveau adaptatif déraille (une réponse « juste » rejouée sur une autre question) ;
 *  · le rejeu ne rend pas un contrôleur au même point → question sautée ou servie deux fois ;
 *  · le score d'une section rejouée diffère de celui de la section jouée d'une traite.
 *
 * Usage : node tests/check_scan_replay.cjs
 */
'use strict';
const path = require('path');
const S = require(path.join(__dirname, '..', 'src', 'scanEngine.js'));
const { SCAN_SECTION_ORDER } = require(path.join(__dirname, '..', 'src', 'data', 'placement.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};
// Identité d'une question servie (texte compris : deux items différents peuvent partager un id d'une banque à l'autre).
const qid = (q) => q && [q.sectionId, q.lvl, q.item && (q.item.id || q.item.q || q.item.s), q.qIdx, q.blankIndex, q.refId].join('|');

// Joue une section d'une traite, avec des réponses données par motif, et note la suite des questions.
function playThrough(sec, seed, pattern) {
  const c = S.createCatController(sec, seed), seen = [], answers = [];
  for (let i = 0, q; (q = c.next()); i++) { seen.push(qid(q)); const ok = pattern[i % pattern.length]; answers.push(ok); c.record(ok); }
  return { seen, answers, score: c.score() };
}

const PATTERNS = [[true], [false], [true, false], [false, true, true]];
SCAN_SECTION_ORDER.forEach(function (sec) {
  [11, 2026, 987654321].forEach(function (seed) {
    PATTERNS.forEach(function (pat) {
      const ref = playThrough(sec, seed, pat), tag = sec + ' graine ' + seed + ' motif ' + pat.join('');
      eq(tag + ' : même graine, mêmes questions', playThrough(sec, seed, pat).seen, ref.seen);
      // Interruption après k réponses : le rejeu sert la question k+1, puis la suite à l'identique.
      for (let k = 0; k < ref.answers.length; k++) {
        const c = S.replayCatController(sec, seed, ref.answers.slice(0, k)), rest = [];
        for (let i = k, q; (q = c.next()); i++) { rest.push(qid(q)); c.record(ref.answers[i]); }
        eq(tag + ' : reprise après ' + k + ' réponse(s)', rest, ref.seen.slice(k));
        if (k === ref.answers.length - 1) eq(tag + ' : score rejoué', c.score().acc, ref.score.acc);
      }
    });
  });
});

// La graine compte vraiment : sur 20 graines, la grammaire ne sert pas toujours la même première question.
const firsts = new Set();
for (let s = 1; s <= 20; s++) firsts.add(qid(S.createCatController('grammar', s).next()));
eq('des graines différentes donnent des tirages différents', firsts.size > 1, true);

console.log(fails ? fails + '/' + checks + ' vérifications en échec' : checks + '/' + checks + ' vérifications de reprise du scan au vert');
process.exit(fails ? 1 : 0);
