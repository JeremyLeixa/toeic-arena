/* Home « une porte » (lib/homeAgenda.js, variante B du proto prototypes/home-focus/, 2026-09-23).
 *
 * POURQUOI CE TEST EXISTE. Home n'a plus qu'un bouton : ce que homeAgenda met en tête est ce que l'élève
 * fait en ouvrant l'appli. Rien ne casse le build si :
 *  · l'ordre glisse (un coffre qui passe derrière une quête reste fermé ; une quête avant la mission du
 *    jour prive l'élève des +15 XP et de la série) ;
 *  · la mission re-tirée (jeton daily_reroll, `pick` ≠ 0) n'est plus reconnue comme la mission ;
 *  · le Daily Challenge revient dans la liste (il est un bloc à part : il s'afficherait deux fois) ;
 *  · une quête faite reste le bouton, ou la journée finie ne se dit pas.
 *
 * Usage : node tests/check_home_agenda.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const A = require(path.join(ROOT, 'src', 'lib', 'homeAgenda.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};

// Élève minimal : une mission figée du jour à trois quêtes, un Mock déjà passé (pas de rappel).
const NOW = new Date();
const D = NOW.toISOString().slice(0, 10);
function student(o) {
  return Object.assign({
    name: 'Test', xp: 900, streak: 4, lastActive: D, moduleScores: {}, dailyModSessions: {},
    mockResults: { mock1: { score: 60, total: 100 } }, review: {},
    mission: { date: D, pick: 0, done: false, actId: 'drill', quests: [
      { kind: 'stake', mod: 'p7', part: 'p7', pts: 12, acc: 0.6, tgt: 0.8, n: 40, life: 0.6 },
      { kind: 'keep', mod: 'lisP2', part: 'p2', days: 9, acc: 0.85 },
      { kind: 'explore', mod: 'lisP4', part: 'p4' },
    ] },
  }, o || {});
}
const ids = (items) => items.map((x) => x.id);

// ── ordre ──
eq('sans coffre ni Mock : mission puis quêtes', ids(A.homeAgenda(student(), NOW, 0)), ['mission', 'q1', 'q2']);
eq('coffre en tête', ids(A.homeAgenda(student(), NOW, 2)), ['chest', 'mission', 'q1', 'q2']);
eq('libellé du coffre au pluriel', A.homeAgenda(student(), NOW, 2)[0].title, 'Open your 2 chests');
const rookie = student({ mockResults: {}, joinedAt: new Date(NOW - 5 * 864e5).toISOString() });
eq('Mock avant la mission, après le coffre', ids(A.homeAgenda(rookie, NOW, 1)), ['chest', 'mock', 'mission', 'q1', 'q2']);
eq('le Mock mène au Mock 1', A.homeAgenda(rookie, NOW, 0)[0].mod, 'mock1');

// ── mission re-tirée : c'est `pick` qui la désigne, et elle passe devant ──
const rr = student(); rr.mission.pick = 2;
const it = A.homeAgenda(rr, NOW, 0);
eq('re-tirage : la quête 2 est la mission, en tête', ids(it), ['mission', 'q0', 'q1']);
eq('re-tirage : la mission mène à son module', it[0].mod, 'lisP4');
eq('seule la mission porte +15 XP', it.map((x) => x.reward), ['+15 XP', '', '']);

// ── le Daily Challenge n'y entre jamais ──
eq('aucune entrée Daily', A.homeAgenda(student(), NOW, 3).some((x) => x.mod === 'daily' || x.id === 'daily'), false);

// ── ce qui est fait ne reste pas le bouton ──
const md = student(); md.mission.done = true; md.dailyModSessions['p7_' + D] = 1;
let f = A.homeFocus(md, NOW, 0);
eq('mission faite : le bouton passe à la quête suivante', f.hero && f.hero.id, 'q1');
eq('Also today : la suite', ids(f.also), ['q2']);
eq('pas de « +N »', f.more, 0);
const all = student(); all.mission.done = true;
['p7', 'lisP2', 'lisP4'].forEach((m) => { all.dailyModSessions[m + '_' + D] = 1; });
f = A.homeFocus(all, NOW, 0);
eq('journée finie : aucun bouton', f.hero, null);
eq('journée finie : chemin complet', f.pathDone, true);
f = A.homeFocus(all, NOW, 1);
eq('journée finie mais coffre : le coffre reste le bouton', f.hero && f.hero.id, 'chest');
eq('…et le chemin reste complet', f.pathDone, true);

// ── Also today : deux au plus, le reste compté ──
const big = student(); big.mission.quests.push({ kind: 'explore', mod: 'lisP3', part: 'p3' }, { kind: 'explore', mod: 'p6', part: 'p6' });
f = A.homeFocus(big, NOW, 1);
eq('bouton = coffre', f.hero.id, 'chest');
eq('deux lignes', ids(f.also), ['mission', 'q1']);
eq('le reste compté', f.more, 3);

// ── sans mission d'aujourd'hui ──
const stale = student(); stale.mission.date = '2020-01-01';
f = A.homeFocus(stale, NOW, 0);
eq('mission d\'un autre jour : ni bouton ni chemin', [f.hero, f.hasPath, f.pathDone], [null, false, false]);
const empty = student(); empty.mission.quests = [];
f = A.homeFocus(empty, NOW, 0);
eq('plan vide (« All steady ») : ni bouton ni chemin complet', [f.hero, f.hasPath, f.pathDone], [null, false, false]);

// ── bonus en une ligne ──
const mon = new Date('2026-09-21T10:00:00Z'), sat = new Date('2026-09-26T10:00:00Z');
eq('bonus : série et connexion', A.bonusLine({ streak: 8, lastActive: '2026-09-20' }, mon), '×1.5 streak · +10 login');
eq('bonus : week-end, série courte, déjà connecté', A.bonusLine({ streak: 3, lastActive: '2026-09-26' }, sat), '×2 weekend · ×1.2 streak');
eq('bonus : rien', A.bonusLine({ streak: 1, lastActive: '2026-09-21' }, mon), '');

console.log((checks - fails) + '/' + checks + ' vérifications Home au vert');
process.exit(fails ? 1 : 0);
