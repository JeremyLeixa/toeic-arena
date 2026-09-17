/* État des tuiles de hub (lib/hubStatus.js, variante C « Coffre », 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. La tuile promet un coffre (Champion + 50 Darics) et annonce le tarif
 * de la prochaine partie. Si le seuil affiché diverge de celui du watcher d'App.jsx, l'élève voit
 * « Won » sans coffre, ou joue pour un coffre déjà inaccessible ; si le palier d'XP ment, il
 * farme en croyant gagner. Rien de tout ça ne casse le build.
 *
 * Usage : node tests/check_hub_status.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const H = require(path.join(ROOT, 'src', 'lib', 'hubStatus.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};

const NOW = new Date('2026-09-17T10:00:00Z');
const TD = '2026-09-17', Y = '2026-09-16', D3 = '2026-09-14';
function ms(total, correct, last) {
  return { total, correct, sessions: 1, lastDate: last ? last[0] : Y, catStats: {}, history: last ? [{ date: last[0], total: last[1], correct: last[2] }] : [] };
}
const u = {
  moduleScores: {
    wordfam: ms(34, 29, [Y, 15, 12]),
    falsefr: ms(58, 41, [D3, 10, 7]),
    connsort: ms(62, 55, [TD, 15, 13]),
    edge50: ms(50, 40), under50: ms(49, 49), under80: ms(50, 39),
    first: ms(5, 1),
    gauntlet_irregular: ms(60, 52, [Y, 15, 13]),
    gauntlet_tense: ms(75, 59, [TD, 15, 11]),
    gauntlet_passive: ms(15, 12, [D3, 15, 12]),
    drill: ms(160, 118, [TD, 10, 8]),
  },
  gameScores: { matchEasy: { time: 23.4, moves: 13 }, wordFall: { score: 85 }, duel: { wins: 1, played: 2 } },
  dailyModSessions: { ['connsort_' + TD]: 1, ['gerinf_' + TD]: 2, ['pvdojo_' + TD]: 3, ['gauntlet_tense_' + TD]: 1, ['game_wordFall_' + TD]: 2, ['drill_' + Y]: 3 },
};
const ctx = { now: NOW };
const st = (it, c) => H.hubItemStatus(u, it, c || ctx);

// 1. Seuils de maîtrise : les mêmes que le watcher d'App.jsx (50 Q, 80 %, bornes incluses)
eq('seuils', [H.MASTERY_Q, H.MASTERY_ACC], [50, 0.8]);
eq('50 Q à 80 % pile → maîtrisé', H.isMastered(ms(50, 40)), true);
eq('49 Q à 100 % → non', H.isMastered(ms(49, 49)), false);
eq('50 Q à 78 % → non', H.isMastered(ms(50, 39)), false);
eq('absent → non', H.isMastered(undefined), false);
eq('liste noire = mocks, boss, daily, flashcards', Object.keys(H.MASTERY_BLACKLIST).sort(), ['boss', 'csess', 'daily', 'mock1', 'mock2', 'mock3']);

// 2. Module
const wf = st({ id: 'wordfam' });
eq('en route : volume, précision, pas maîtrisé', [wf.vol, Math.round(wf.acc * 100), wf.mastered, wf.accLow], [0.68, 85, false, false]);
eq('dernier score = dernière entrée de history', wf.last, { date: Y, total: 15, correct: 12 });
const ff = st({ id: 'falsefr' });
eq('volume atteint, précision 71 % → accLow, volume plafonné à 1', [ff.vol, ff.accLow, ff.mastered], [1, true, false]);
eq('maîtrisé', st({ id: 'connsort' }).mastered, true);
eq('moins de 10 Q : pas d\'alerte de précision', st({ id: 'first' }).accLow, false);
eq('jamais joué', (({ total, vol, last, mastered }) => ({ total, vol, last, mastered }))(st({ id: 'bforge' })), { total: 0, vol: 0, last: null, mastered: false });

// 3. XP du jour (nextRunMult)
eq('paliers 0/1/2/3 parties', ['bforge', 'connsort', 'gerinf', 'pvdojo'].map((id) => st({ id }).xp), ['full', 'half', 'low', 'none']);
eq('parties d\'hier ne comptent pas', st({ id: 'drill' }).xp, 'full');
eq('événement global → plein tarif', st({ id: 'pvdojo' }, { now: NOW, events: [{ type: 'flash_hour' }] }).xp, 'full');
eq('Bypass Token armé pour ce module → plein tarif', H.hubItemStatus(Object.assign({}, u, { bypassArmedModule: 'pvdojo' }), { id: 'pvdojo' }, ctx).xp, 'full');
eq('xpTier mock 0,4 et flashcards 0,6 → half', [H.xpTier(0.4), H.xpTier(0.6), H.xpTier(0.15), H.xpTier(0)], ['half', 'half', 'low', 'none']);

// 4. Tuiles sans coffre
eq('liste noire → plain', [st({ id: 'csess' }), st({ id: 'daily' })], [{ plain: true }, { plain: true }]);
eq('plain explicite', st({ id: 'gramref', plain: true }), { plain: true });
eq('jeux : record et tarif', [st({ id: 'matchE', game: 'matchEasy' }), st({ id: 'wfall', game: 'wordFall' }), st({ id: 'duel', game: 'duel' })].map((s) => [s.record, s.xp]),
  [['23.4s', 'full'], ['85 pts', 'low'], ['1 win', 'full']]);
eq('jeu jamais joué : pas de record', H.hubItemStatus({}, { id: 'x', game: 'matchEasy' }, ctx).record, null);

// 5. Hub à épreuves
const gt = st({ id: 'gauntlet', subs: ['gauntlet_irregular', 'gauntlet_tense', 'gauntlet_passive', 'gauntlet_relative'] });
eq('hub : 1/4 maîtrisée, pas toutes', [gt.n, gt.mastered, gt.allMastered, gt.started], [4, 1, false, true]);
eq('hub : volume = maîtrisée 1 + autres plafonnées à 0,95', Math.round(gt.vol * 1000) / 1000, Math.round(((1 + 0.95 + 0.3 + 0) / 4) * 1000) / 1000);
eq('hub : dernier score = le plus récent', gt.last, { date: TD, total: 15, correct: 11 });
eq('hub : meilleur tarif disponible + nombre d\'épreuves à ce tarif', [gt.xp, gt.atBest], ['full', 3]);
const allDone = H.hubItemStatus({ moduleScores: { a: ms(60, 55), b: ms(50, 45) } }, { id: 'h', subs: ['a', 'b'] }, ctx);
eq('hub : toutes maîtrisées → allMastered, volume 1', [allDone.allMastered, allDone.vol], [true, 1]);

// 6. Étagère
const sm = H.hubSummary(u, [{ id: 'csess' }, { id: 'wordfam' }, { id: 'connsort' }, { id: 'pvdojo' }, { id: 'matchE', game: 'matchEasy' }], ctx);
eq('étagère : coffres des tuiles à coffre seulement, tuiles à plein tarif', [sm.chests, sm.won, sm.fresh], [[false, true, false], 1, 2]);

// 7. Libellé de date
eq('agoLabel', [H.agoLabel(TD, NOW), H.agoLabel(Y, NOW), H.agoLabel(D3, NOW), H.agoLabel(null, NOW)], ['today', 'yesterday', '3 days ago', '']);

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) process.exit(1);
console.log('  ok');
