/* Mock 3 et Boss : oubliés à plusieurs endroits jusqu'au 2026-09-24 (relevé de l'audit du 10/06).
 *
 * POURQUOI CE TEST EXISTE. Le Mock 3 est arrivé après les Mocks 1 et 2, le Boss passe par son propre
 * circuit (bossDone, pas mockDone). Chaque liste écrite à la main « mock1, mock2 » l'a oublié, sans rien
 * casser au build :
 *  · l'estimateur TOEIC ignorait le Mock 3 (pas de déblocage de l'estimation, pas de bonus) ;
 *  · le trophée « TOEIC Master » (400+ à un Mock) ignorait le Mock 3 ;
 *  · le coffre Légendaire du Boss n'était accordé que dans mockDone, que le Boss n'emprunte jamais.
 *
 * Usage : node tests/check_mock_coverage.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const T = require(path.join(ROOT, 'src', 'lib', 'toeic.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};

// ── estimateur : chaque Mock (1, 2, 3), le Boss et Endless comptent comme un examen complet ──
const thin = { drill: { correct: 30, total: 50 }, lisP2: { correct: 20, total: 30 } }; // sous les seuils A.1
eq('sans examen : pas d\'estimation complète', T.estimateTOEICScore(thin).estimable !== true, true);
['mock1', 'mock2', 'mock3', 'boss', 'endless'].forEach((id) => {
  const ms = Object.assign({}, thin, { [id]: { correct: 40, total: 48 } });
  const r = T.estimateTOEICScore(ms);
  eq(id + ' débloque l\'estimation', r.estimable, true);
  eq(id + ' compte comme examen fait', r.evidence.mocksDone, 1);
});

console.log((checks - fails) + '/' + checks + ' vérifications Mock 3 / Boss au vert');
process.exit(fails ? 1 : 0);
