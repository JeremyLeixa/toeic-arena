/* HUD de session (lib/sessionHud.js, variante E, 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. Le combo joue un son et une bannière : décalé d'une réponse, il salue une
 * série qui vient de casser ; rejoué hors palier, il sonne à chaque question. Le fil d'encre dit ce qui
 * s'est passé question par question : un décalage d'index colore la mauvaise case. Rien ne casse le build.
 *
 * Usage : node tests/check_session_hud.cjs
 */
'use strict';
const path = require('path');
const H = require(path.join(__dirname, '..', 'src', 'lib', 'sessionHud.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};

// streakOf
eq('série vide', H.streakOf([]), 0);
eq('série finale seulement', H.streakOf([1, 1, 0, 1, 1, 1]), 3);
eq('faux en dernier → 0', H.streakOf([1, 1, 1, 0]), 0);
eq('neutre (examen) casse la série', H.streakOf([1, 1, null]), 0);
eq('undefined toléré', H.streakOf(undefined), 0);

// comboAt : uniquement quand la DERNIÈRE réponse tombe sur un palier
eq('paliers', H.COMBO_AT, [3, 5, 7, 10, 15, 20]);
eq('2 d\'affilée → rien', H.comboAt([1, 1]), null);
eq('3 → combo', H.comboAt([0, 1, 1, 1]), { n: 3, sound: 'combo' });
eq('4 → rien (entre deux paliers)', H.comboAt([1, 1, 1, 1]), null);
eq('5 → combo', H.comboAt([1, 1, 1, 1, 1]), { n: 5, sound: 'combo' });
eq('6 → rien', H.comboAt([1, 1, 1, 1, 1, 1]), null);
eq('7 → streak', H.comboAt([1, 1, 1, 1, 1, 1, 1]), { n: 7, sound: 'streak' });
eq('10 → streak', H.comboAt(Array(10).fill(1)), { n: 10, sound: 'streak' });
eq('11 → rien', H.comboAt(Array(11).fill(1)), null);
eq('15 et 20 → streak', [H.comboAt(Array(15).fill(1)), H.comboAt(Array(20).fill(1))], [{ n: 15, sound: 'streak' }, { n: 20, sound: 'streak' }]);
eq('série cassée juste après un palier → rien', H.comboAt([1, 1, 1, 0]), null);

// segMarks
eq('marques simples', H.segMarks(5, [1, 0], 2).map((x) => x.m), ['ok', 'ko', 'cur', '', '']);
eq('question courante déjà répondue : sa marque, pas cur', H.segMarks(3, [1, 1], 1).map((x) => x.m), ['ok', 'ok', '']);
eq('examen : réponses neutres', H.segMarks(4, [null, null], 2).map((x) => x.m), ['done', 'done', 'cur', '']);
eq('groupes P3 (3+3+3) : coupure au début des groupes 2 et 3', H.segMarks(9, [], 0, [3, 3, 3]).map((x) => x.brk), [false, false, false, true, false, false, true, false, false]);
eq('sans groupes : aucune coupure', H.segMarks(3, [], 0).some((x) => x.brk), false);
eq('longueur = n', H.segMarks(202, [], 0).length, 202);

// segDensity
eq('densité', [1, 10, 15, 16, 30, 31, 49, 202].map(H.segDensity), ['seg', 'seg', 'seg', 'tight', 'tight', 'bar', 'bar', 'bar']);

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) process.exit(1);
console.log('  ok');
