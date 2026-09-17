/* Bestiaire des erreurs (lib/review.js, 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. C'est la première mémoire des erreurs de l'appli : jusqu'ici une erreur
 * disparaissait à la fin de la session. Quatre règles s'y jouent, toutes silencieuses si elles dérivent :
 *   1. les intervalles 1-3-7 jours et la mort à la TROISIÈME réussite espacée. Un intervalle en plus et
 *      une créature ne tombe plus jamais dans la fenêtre d'une promo (11 semaines) ;
 *   2. la FORCE d'une créature ne monte que si elle fait retomber une réussite. Compter tous les échecs
 *      rendait les créatures d'un élève assidu plus fortes que celles d'un élève qui ne chasse jamais ;
 *   3. une question ratée trois fois se repose 2 jours (et la chasse ouvre la fiche avant) : sinon elle
 *      revient chaque jour à l'identique — 11 fois de suite dans la simulation du proto ;
 *   4. une chasse garde ensemble les questions d'un même support (le passage Part 7 est lu une fois).
 * Plus la garde de fond : le module "hunt" ne doit JAMAIS entrer dans l'estimation TOEIC — sinon
 * reposer des questions déjà vues gonfle le score.
 *
 * Prouvé mordant le 2026-09-17 : BOX_DAYS + [21] rouge ; `if (it.box > 0) it.miss++` → `it.miss++`
 * rouge ; repos des Wyrm retiré rouge ; XP par créature 5 → 20 rouge ; regroupement par catégorie
 * neutralisé rouge.
 *
 * Usage : node tests/check_review.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const R = require(path.join(ROOT, 'src', 'lib', 'review.js'));
const { estimateTOEICScore } = require(path.join(ROOT, 'src', 'lib', 'toeic.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const D = (s) => new Date(s + 'T10:00:00Z');
const item = (rv, k) => rv.items.find((x) => x.k === k);

// ── 1. Les trois boîtes, et la mort à la troisième réussite espacée ────────────────────────────
let rv = R.newReview();
R.reviewMiss(rv, { k: 'drill:g326', cat: 'Conditionals', part: 'p5' }, D('2026-09-01'));
eq('ratée : elle revient demain', [item(rv, 'drill:g326').due, item(rv, 'drill:g326').box], ['2026-09-02', 0]);
eq('réussie : 3 jours', [R.reviewHit(rv, 'drill:g326', D('2026-09-02')), item(rv, 'drill:g326').due], ['hit', '2026-09-05']);
eq('réussie : 7 jours', [R.reviewHit(rv, 'drill:g326', D('2026-09-05')), item(rv, 'drill:g326').due], ['hit', '2026-09-12']);
eq('3e réussite espacée : vaincue', R.reviewHit(rv, 'drill:g326', D('2026-09-12')), 'slain');
eq('… elle quitte le bestiaire', [rv.items.length, rv.slain], [0, 1]);
eq('onze jours entre la capture et la mort', R.BOX_DAYS.reduce((a, b) => a + b, 0), 11);
eq('réussir une question qui n\'est pas une créature ne fait rien', R.reviewHit(rv, 'drill:g999', D('2026-09-12')), null);

// ── 2. La force ne monte que sur une retombée ──────────────────────────────────────────────────
rv = R.newReview();
R.reviewMiss(rv, { k: 'drill:g1', cat: 'Tenses' }, D('2026-09-01'));
R.reviewMiss(rv, { k: 'drill:g1', cat: 'Tenses' }, D('2026-09-02'));
R.reviewMiss(rv, { k: 'drill:g1', cat: 'Tenses' }, D('2026-09-03'));
eq('trois échecs d\'affilée : elle n\'a jamais fait retomber une réussite', [item(rv, 'drill:g1').fails, item(rv, 'drill:g1').miss], [3, 1]);
eq('… donc elle reste un Trickster', R.tierOf(item(rv, 'drill:g1')), 'trickster');
eq('… mais elle se repose 2 jours', item(rv, 'drill:g1').due, '2026-09-05');
R.reviewHit(rv, 'drill:g1', D('2026-09-05'));
R.reviewMiss(rv, { k: 'drill:g1', cat: 'Tenses' }, D('2026-09-08'));
eq('retombée après une réussite : la créature se renforce', item(rv, 'drill:g1').miss, 2);
eq('… elle devient un Stalker', R.tierOf(item(rv, 'drill:g1')), 'stalker');

// ── 3. Ce qui est dû, et dans quel ordre ───────────────────────────────────────────────────────
rv = R.newReview();
R.reviewMiss(rv, { k: 'p7:p7p12:0', part: 'p7' }, D('2026-09-18'));
R.reviewMiss(rv, { k: 'p7:p7p12:2', part: 'p7' }, D('2026-09-19'));
R.reviewMiss(rv, { k: 'lisP2:p2_68', part: 'p2' }, D('2026-09-19'));
R.reviewMiss(rv, { k: 'drill:g5', cat: 'Connectors' }, D('2026-09-25'));
const u3 = { review: rv };
eq('seules les échéances passées comptent', R.dueItems(u3, D('2026-09-21')).map((x) => x.k), ['p7:p7p12:0', 'p7:p7p12:2', 'lisP2:p2_68']);
eq('une échéance future attend', R.dueItems(u3, D('2026-09-21')).some((x) => x.k === 'drill:g5'), false);

// ── 4. Une chasse garde les questions d'un même support ensemble ───────────────────────────────
// (le passage Part 7 est relu une fois : décision du 2026-09-17)
eq('groupe par catégorie pour la grammaire', R.groupKey({ k: 'drill:g5', cat: 'Connectors' }), 'cat:Connectors');
eq('groupe par support pour un passage', R.groupKey({ k: 'p7:p7p12:2', part: 'p7' }), 'doc:p7:p7p12');
eq('groupe par partie pour une question isolée', R.groupKey({ k: 'lisP2:p2_68', part: 'p2' }), 'part:p2');
const queue = R.huntQueue(u3, D('2026-09-21'), 2);
eq('le plafond ne coupe pas un support en deux', queue.map((x) => x.k), ['p7:p7p12:0', 'p7:p7p12:2']);
eq('plafond par défaut', R.HUNT_CAP, 10);

// ── 5. Ce que rapporte une chasse ──────────────────────────────────────────────────────────────
// On paie la créature VAINCUE, rien pour une simple réussite : rater exprès une question de Drill
// coûte 7 XP tout de suite contre 5 XP au mieux onze jours plus tard.
eq('aucune créature vaincue', R.huntReward(0), { xp: 5, darics: 0 });
eq('deux créatures vaincues', R.huntReward(2), { xp: 15, darics: 2 });
eq('le gain par créature reste sous le coût d\'une erreur volontaire (7 XP en Drill)', R.HUNT_PER_SLAIN < 7, true);

// ── 6. Compteurs du bestiaire ──────────────────────────────────────────────────────────────────
const b = R.bestiary(u3, D('2026-09-21'));
eq('créatures présentes', b.lurking, 4);
eq('créatures dues', b.due, 3);
eq('groupes, le plus urgent d\'abord', b.groups.map((g) => g.key), ['doc:p7:p7p12', 'part:p2', 'cat:Connectors']);
eq('vaincues cette semaine', R.bestiary({ review: { items: [], slain: 2, log: [{ d: '2026-09-20', k: 'a', e: 'slain' }, { d: '2026-08-01', k: 'b', e: 'slain' }] } }, D('2026-09-21')).slainWeek, 1);

// ── 7. La file est bornée avant la sauvegarde ──────────────────────────────────────────────────
const big = R.newReview();
for (let i = 0; i < R.MAX_ITEMS + 30; i++) big.items.push({ k: 'drill:g' + i, due: '2026-10-' + String((i % 28) + 1).padStart(2, '0'), miss: 1, fails: 1, box: 0 });
for (let i = 0; i < R.MAX_LOG + 20; i++) big.log.push({ d: '2026-09-01', k: 'drill:g' + i, e: 'miss' });
R.boundReview(big);
eq('nombre de créatures plafonné', big.items.length, R.MAX_ITEMS);
eq('journal plafonné', big.log.length, R.MAX_LOG);
eq('les échéances les plus proches sont gardées', big.items[0].due, '2026-10-01');

// ── 8. La chasse ne touche jamais l'estimation TOEIC ───────────────────────────────────────────
// Reposer des questions déjà vues, avec leur explication, gonflerait le score sans rien prouver.
const base = {
  drill: { correct: 60, total: 100 }, p6: { correct: 30, total: 50 }, p7: { correct: 40, total: 80 },
  lisP2: { correct: 30, total: 50 }, lisP3: { correct: 20, total: 40 },
};
const withHunt = Object.assign({}, base, { hunt: { correct: 40, total: 40 } });
eq('même estimation avec et sans chasse', estimateTOEICScore(withHunt).total, estimateTOEICScore(base).total);

console.log(fails === 0 ? '  OK ' + checks + ' vérifications' : '  ' + fails + ' échec(s) sur ' + checks);
process.exit(fails === 0 ? 0 : 1);
