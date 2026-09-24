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
// hunt (2026-09-18) : la chasse repose des questions déjà ratées, sa précision ne mesure rien de
// progressif — un coffre de maîtrise y récompenserait d'avoir beaucoup raté ailleurs.
// mimic y a été du 2026-09-18 au 2026-09-19, le temps que sa banque passe de 12 à 60 items
// (tests/check_mimic_items.cjs lie sa présence à la taille de la banque).
// mimic_listen y a été le 2026-09-19, le temps que le mode écoute passe de 21 à 45 sources parlées (même règle).
eq('liste noire = mocks, boss, daily, flashcards, chasse, Nine to Five (ses réponses font déjà avancer lisP3/lisP4/p7)', Object.keys(H.MASTERY_BLACKLIST).sort(), ['boss', 'csess', 'daily', 'hunt', 'mock1', 'mock2', 'mock3', 'office']);

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
eq('Bypass Token armé pour ce module → plein tarif', H.hubItemStatus(Object.assign({}, u, { boosts: { bypassArmedModule: 'pvdojo' } }), { id: 'pvdojo' }, ctx).xp, 'full');
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

// 6. Étagère (échelons, 2026-09-19) : un échelon par tuile à coffre, total des coffres gagnés. connsort est
// maîtrisé au sens du cumul mais sans `mt` : tant que le serveur n'a pas répondu, rien n'est acquis.
const sm = H.hubSummary(u, [{ id: 'csess' }, { id: 'wordfam' }, { id: 'connsort' }, { id: 'pvdojo' }, { id: 'matchE', game: 'matchEasy' }], ctx);
eq('étagère : échelons des tuiles à coffre seulement, tuiles à plein tarif', [sm.chests, sm.won, sm.fresh], [[0, 0, 0], 0, 2]);

// 8. Échelons de maîtrise (variante B, 2026-09-19). POURQUOI : le coffre ne tombait qu'une fois par module ;
// un seuil trop bas donne une pluie de coffres (Ariba), un délai oublié en donne deux en un week-end, une
// précision prise sur le cumul rend l'échelon II inatteignable à qui progresse, et un « déjà acquis » supposé
// sans réponse du serveur prive de coffre tout module maîtrisé après la mise en ligne.
const days = (n) => new Date(NOW.getTime() - n * 864e5).toISOString().split('T')[0];
function run(nSess, c, t, extra) {
  const hist = []; for (let i = 0; i < nSess; i++) hist.push({ date: TD, correct: c, total: t });
  return Object.assign({ total: nSess * t, correct: nSess * c, sessions: nSess, history: hist }, extra || {});
}
eq('échelons I, II, III puis +150', [1, 2, 3, 4, 5].map((n) => { const d = H.tierDef(n); return [d.q, d.acc, d.chest]; }),
  [[50, 0.8, 2], [150, 0.85, 2], [300, 0.85, 3], [450, 0.85, 2], [600, 0.85, 2]]);
eq('déclencheurs : l\'échelon I garde les noms d\'avant', [H.tierTrigger('tavern', 1), H.tierTrigger('tavern', 2), H.tierMarksKey('tavern', 1), H.tierMarksKey('tavern', 3)],
  ['mastery_tavern', 'mastery_tavern_2', 'mastery_marks_tavern', 'mastery_marks_tavern_3']);
eq('chiffres romains', [1, 2, 3, 4, 9, 14].map(H.roman), ['I', 'II', 'III', 'IV', 'IX', 'XIV']);
eq('rattrapage daté du jour de la mise en ligne', H.TIERS_EPOCH, '2026-09-19');
eq('précision récente : sessions entières jusqu\'à 50 Q', H.recentAcc([{ total: 15, correct: 0 }, { total: 15, correct: 15 }, { total: 15, correct: 15 }, { total: 15, correct: 15 }, { total: 15, correct: 12 }]),
  { q: 60, acc: 57 / 60 });
const ts = (m) => H.tierStatus(m, NOW);
eq('sans mt, 60 Q à 83 % : rien d\'acquis, I prêt (le serveur tranchera)', (({ won, state }) => ({ won, state }))(ts(run(4, 12.5, 15))), { won: 0, state: 'ready' });
eq('sans mt, 60 Q à 70 % : précision sous 80 %', ts(run(4, 10.5, 15)).state, 'acclow');
eq('I gagné il y a 10 j, 165 Q à 93 % : II prêt', ts(run(11, 14, 15, { mt: { n: 1, date: days(10) } })).state, 'ready');
const w = ts(run(11, 14, 15, { mt: { n: 1, date: days(3) } }));
eq('I gagné il y a 3 j : II attend 4 jours', [w.state, w.wait], ['wait', 4]);
const drop = run(11, 14, 15, { mt: { n: 1, date: days(10) } });
drop.history = drop.history.slice(0, 7).concat([12, 12, 12, 12].map(() => ({ date: TD, total: 15, correct: 12 })));
eq('II : la précision RÉCENTE compte (80 % récents < 85 %, malgré un cumul plus haut)', [ts(drop).state, Math.round(ts(drop).acc * 100)], ['acclow', 80]);
eq('au volume : 100 Q entre I (50) et II (150) = moitié', ts(run(10, 9, 10, { mt: { n: 1, date: days(20) } })).vol, 0.5);
const leg = ts(run(21, 14, 15, { mt: { n: 2, date: days(30) } }));
eq('III : Légendaire', [leg.next.n, leg.next.chest, leg.state], [3, 3, 'ready']);
const renown = ts(run(31, 14, 15, { mt: { n: 3, date: days(30) } }));
eq('au-delà de III : IV à 450 Q, Champion', [renown.next.n, renown.next.q, renown.next.chest, renown.state], [4, 450, 2, 'ready']);
const hubT = H.hubTierStatus({ a: run(4, 14, 15, { mt: { n: 2, date: days(40) } }), b: run(4, 14, 15, { mt: { n: 1, date: days(40) } }), c: run(1, 5, 10) }, ['a', 'b', 'c'], NOW);
eq('hub : vise l\'échelon de l\'épreuve la moins avancée, compte tous les coffres', [hubT.won, hubT.next.n, hubT.at, hubT.chests], [0, 1, 2, 3]);
const u2 = { moduleScores: { tavern: run(8, 14, 15, { mt: { n: 1, date: days(2) } }), clue: run(9, 14, 15, { mt: { n: 1, date: days(30) } }), sbuild: run(2, 12, 15) } };
const sm2 = H.hubSummary(u2, [{ id: 'tavern', n: 'Word Tavern' }, { id: 'clue', n: 'Clue Hunter' }, { id: 'sbuild', n: 'Sentence Builder' }], ctx);
eq('étagère : total, coffre le plus proche', [sm2.chests, sm2.won, sm2.near && sm2.near.id, sm2.near && sm2.near.left], [[1, 1, 0], 2, 'clue', 15]);
const u3 = { moduleScores: { tavern: run(11, 14, 15, { mt: { n: 1, date: days(2) } }) } };
eq('étagère : sinon le coffre qui attend son délai', (H.hubSummary(u3, [{ id: 'tavern', n: 'Word Tavern' }], ctx).wait || {}).wait, 5);

// recordModule reconstruit moduleScores[mod] avec des clés fixes : sans recopie, chaque partie effacerait
// l'échelon, et le délai de 7 jours repartirait de zéro.
const { recordModule } = require(path.join(ROOT, 'src', 'lib', 'progress.js'));
const keep = { moduleScores: { tavern: run(2, 12, 15, { mt: { n: 2, date: '2026-09-10' } }) } };
recordModule(keep, 'tavern', 13, 15);
eq('recordModule garde l\'échelon atteint', keep.moduleScores.tavern.mt, { n: 2, date: '2026-09-10' });

// Câblage du watcher d'App.jsx (lu dans le source) : état « ready » de tierStatus, déclencheur par échelon,
// échelon mémorisé sur TOUTE réponse du serveur (accordé ou déjà servi), I déjà servi daté TIERS_EPOCH.
const APP = require('fs').readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
checks++; if (!/var t=tierStatus\(m,now\);\s*if\(t\.state!=="ready"\)return;/.test(APP)) { fails++; console.log('  FAIL watcher : doit partir de tierStatus(m).state === "ready"'); }
checks++; if (!/grantChestLocal\(tierTrigger\(modId,n\),t\.next\.chest===3\?"legendaire":"champion"/.test(APP)) { fails++; console.log('  FAIL watcher : déclencheur par échelon, Légendaire au III'); }
checks++; if (!/if\(r&&r\.ok\)markTier\(modId,n,r\.granted\?today\(now\):\(n===1\?TIERS_EPOCH:today\(now\)\)\)/.test(APP)) { fails++; console.log('  FAIL watcher : échelon posé sur toute réponse du serveur, I déjà servi daté TIERS_EPOCH'); }
checks++; if (!/masteryRef\.current\[key\]/.test(APP) || !/key=modId\+"_"\+n/.test(APP)) { fails++; console.log('  FAIL watcher : garde anti-boucle par module ET par échelon'); }

// 7. Libellé de date
eq('agoLabel', [H.agoLabel(TD, NOW), H.agoLabel(Y, NOW), H.agoLabel(D3, NOW), H.agoLabel(null, NOW)], ['today', 'yesterday', '3 days ago', '']);

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) process.exit(1);
console.log('  ok');
