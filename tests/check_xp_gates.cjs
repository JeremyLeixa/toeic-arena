/* Portes XP : les règles produit (accuracy, anti-farming, Focus, boosts, bonus du jour)
 * restent celles de CLAUDE.md, « XP System ».
 *
 * POURQUOI CE TEST EXISTE. Jusqu'au 2026-09-16, applyXpGates et addXp étaient des closures
 * dans App() : la seule mécanique critique du produit sans aucun filet. Un `<` changé en
 * `<=`, un palier 0.40 devenu 0.5, un plancher retiré, un bonus Focus qui ne crédite plus les
 * Darics — rien de tout ça ne casse le build, et un élève ne s'en plaint que des semaines
 * plus tard (« j'ai eu 0 XP »). La Phase 5 du découpage a sorti le calcul dans lib/xp.js,
 * pur, pour pouvoir l'écrire ici, cas par cas, avec les valeurs de CLAUDE.md.
 *
 * Ce que ce test NE prouve PAS : que App.jsx orchestre bien les effets (sons, toast,
 * coffres, grantMarks) à partir de ces retours. C'est scripts/refactor/xp_equivalence.cjs
 * (hors suite, sha épinglé) qui a comparé l'ancien App.jsx à celui-ci sur 2 000 profils.
 *
 * Les instants sont injectés (ctx.now) : today() est en UTC, le week-end en heure LOCALE
 * (historique). Les cas utilisent 10:00Z, donc le même jour civil de l'Atlantique à Moscou.
 *
 * Prouvé mordant le 2026-09-16 : `acc<0.30` → `<=0.30` rouge ; mock `0.40` → `0.5` rouge ;
 * `focusHit` figé à false rouge ; plancher `Math.max(0,…)` retiré rouge ; `settleXp` mutant
 * `u` au lieu du clone rouge.
 *
 * Usage : node tests/check_xp_gates.cjs
 */
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Import natif du module pur. S'il casse ici, c'est que quelqu'un a rendu xp.js impur
// (import de sounds.js, supabase.js, league.js…) : le remettre pur, pas contourner.
const XP = require(path.join(ROOT, 'src', 'lib', 'xp.js'));
const { getLevel } = require(path.join(ROOT, 'src', 'data', 'helpers.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};

// ══════════════════════════════════════════════════════════════════════════
// 1. accuracyGate — <30 % → 10 % (plancher 5) ; 30-49 % → 50 % ; ≥50 % → intact ; tot=0 → intact
// ══════════════════════════════════════════════════════════════════════════
eq('acc 29 % → 10 %', XP.accuracyGate(100, 29, 100), 10);
eq('acc 29 % base 30 → plancher 5 (10 % = 3)', XP.accuracyGate(30, 0, 10), 5);
eq('acc 30 % → 50 %', XP.accuracyGate(100, 30, 100), 50);
eq('acc 49 % → 50 %', XP.accuracyGate(100, 49, 100), 50);
eq('acc 50 % → 100 %', XP.accuracyGate(100, 50, 100), 100);
eq('tot 0 → aucune porte', XP.accuracyGate(100, 0, 0), 100);

// ══════════════════════════════════════════════════════════════════════════
// 2. farmMult — trois familles, boss dans la générique
// ══════════════════════════════════════════════════════════════════════════
eq('générique 0..3,7', [0, 1, 2, 3, 7].map((n) => XP.farmMult('drill', n)), [1, 0.5, 0.15, 0, 0]);
for (const m of ['mock1', 'mock2', 'mock3']) eq(m + ' 0..2', [0, 1, 2].map((n) => XP.farmMult(m, n)), [1, 0.4, 0]);
eq('csess 0..3', [0, 1, 2, 3].map((n) => XP.farmMult('csess', n)), [1, 0.6, 0.3, 0]);
eq('boss = générique, pas mock', [0, 1, 2].map((n) => XP.farmMult('boss', n)), [1, 0.5, 0.15]);

// ══════════════════════════════════════════════════════════════════════════
// 3. Événements
// ══════════════════════════════════════════════════════════════════════════
const spotDrill = { type: 'spotlight', config: { module: 'drill', multiplier: 3 } };
const spotP6 = { type: 'spotlight', config: { module: 'p6' } };
eq('boosted : null / []', [XP.isBoostedByEvents('drill', null), XP.isBoostedByEvents('drill', [])], [false, false]);
eq('boosted : spotlight sur ce module', XP.isBoostedByEvents('drill', [spotDrill]), true);
eq('boosted : spotlight ailleurs', XP.isBoostedByEvents('drill', [spotP6]), false);
eq('boosted : flash_hour / underdog (globaux)', [XP.isBoostedByEvents('drill', [{ type: 'flash_hour' }]), XP.isBoostedByEvents('drill', [{ type: 'underdog' }])], [true, true]);
eq('spotlightMult : sans événements', [XP.spotlightMult('drill', undefined), XP.spotlightMult('drill', [])], [1, 1]);
eq('spotlightMult : ×3 déclaré', XP.spotlightMult('drill', [spotDrill]), 3);
eq('spotlightMult : défaut ×2', XP.spotlightMult('p6', [spotP6]), 2);
eq('spotlightMult : autre module → 1', XP.spotlightMult('p7', [spotDrill, spotP6]), 1);

// ══════════════════════════════════════════════════════════════════════════
// 4. gateXp — composition des piliers
// ══════════════════════════════════════════════════════════════════════════
const NOW = new Date('2026-09-15T10:00:00Z'); // mardi
const TD = '2026-09-15';
const base = (extra) => Object.assign({ xp: 100, weeklyXp: 50, streak: 2, lastActive: '2026-09-14', stats: { totalQ: 0 }, moduleScores: {}, dailyModSessions: {} }, extra || {});
const g = (baseXp, sc, tot, modId, u, events) => XP.gateXp(baseXp, sc, tot, modId, { u, now: NOW, events });

eq('composition : base 33, acc 40 %, 2e session → round(round(16.5)×.5)=9', g(33, 4, 10, 'drill', base({ dailyModSessions: { ['drill_' + TD]: 1 } })), { xp: 9, focusHit: false });
eq('4e session → 0', g(100, 10, 10, 'drill', base({ dailyModSessions: { ['drill_' + TD]: 3 } })), { xp: 0, focusHit: false });
eq('compteur d\'un AUTRE jour ignoré', g(100, 10, 10, 'drill', base({ dailyModSessions: { 'drill_2026-09-14': 3 } })), { xp: 100, focusHit: false });
eq('mock1 2e session → 40 %', g(100, 10, 10, 'mock1', base({ dailyModSessions: { ['mock1_' + TD]: 1 } })), { xp: 40, focusHit: false });
eq('bypass armé : courbe sautée, accuracy toujours active', g(100, 2, 10, 'drill', base({ bypassArmedModule: 'drill', dailyModSessions: { ['drill_' + TD]: 3 } })), { xp: 10, focusHit: false });
eq('bypass armé : retour anticipé, PAS de Module Booster ensuite', g(100, 10, 10, 'drill', base({ bypassArmedModule: 'drill', boosts: { moduleBoostArmed: 'drill' } })), { xp: 100, focusHit: false });
eq('bypass armé sur un autre module : courbe appliquée', g(100, 10, 10, 'drill', base({ bypassArmedModule: 'p6', dailyModSessions: { ['drill_' + TD]: 3 } })), { xp: 0, focusHit: false });
eq('spotlight sur ce module : courbe sautée', g(100, 10, 10, 'drill', base({ dailyModSessions: { ['drill_' + TD]: 3 } }), [spotDrill]), { xp: 100, focusHit: false });
eq('spotlight ailleurs : courbe appliquée', g(100, 10, 10, 'drill', base({ dailyModSessions: { ['drill_' + TD]: 3 } }), [spotP6]), { xp: 0, focusHit: false });
eq('flash_hour : courbe sautée', g(100, 10, 10, 'drill', base({ dailyModSessions: { ['drill_' + TD]: 3 } }), [{ type: 'flash_hour' }]), { xp: 100, focusHit: false });
eq('modId absent : accuracy seule', g(40, 0, 10, null, base()), { xp: 5, focusHit: false });
eq('plancher 0 sur base négative', g(-20, 10, 10, 'drill', base()), { xp: 0, focusHit: false });

// Focus : u dont la Part 2 est la plus faible (n≥10, acc<.85) → lisP2 vise p2.
const uFocus = base({ stats: { totalQ: 40 }, moduleScores: { lisP2: { correct: 2, total: 10 }, drill: { correct: 9, total: 10 } } });
eq('focus : lisP2 ×1.25 + focusHit', g(40, 10, 10, 'lisP2', uFocus), { xp: 50, focusHit: true });
eq('focus : arrondi après la courbe (2e session : 20×1.25)', g(40, 10, 10, 'lisP2', Object.assign({}, uFocus, { dailyModSessions: { ['lisP2_' + TD]: 1 } })), { xp: 25, focusHit: true });
eq('focus : module hors partie faible → rien', g(40, 10, 10, 'drill', uFocus), { xp: 40, focusHit: false });
eq('focus : module sans partie (game_x) → rien', g(40, 10, 10, 'game_x', uFocus), { xp: 40, focusHit: false });

// Boosts Daric
eq('Module Booster ×1.5 sur le module armé', g(40, 10, 10, 'drill', base({ boosts: { moduleBoostArmed: 'drill' } })), { xp: 60, focusHit: false });
eq('Module Booster : autre module → rien', g(40, 10, 10, 'p6', base({ boosts: { moduleBoostArmed: 'drill' } })), { xp: 40, focusHit: false });
eq('Mock Multiplier : mock1', g(40, 10, 10, 'mock1', base({ boosts: { mockMultArmed: true } })), { xp: 60, focusHit: false });
eq('Mock Multiplier : boss', g(40, 10, 10, 'boss', base({ boosts: { mockMultArmed: true } })), { xp: 60, focusHit: false });
eq('Mock Multiplier : drill → rien', g(40, 10, 10, 'drill', base({ boosts: { mockMultArmed: true } })), { xp: 40, focusHit: false });

// ══════════════════════════════════════════════════════════════════════════
// 5. settleXp — streak, multiplicateurs, +10, planchers, ligue, niveau, coffres
// ══════════════════════════════════════════════════════════════════════════
const LEAGUES = [{ id: 'a', min: 0 }, { id: 'b', min: 200 }, { id: 'c', min: 600 }];
const leagueOf = (xp) => { let L = LEAGUES[0]; for (const l of LEAGUES) if (xp >= l.min) L = l; return L; };
const s = (u, amt, extra) => XP.settleXp(u, amt, Object.assign({ now: NOW, events: [], classMedianXp: 0, leagueOf }, extra || {}));
const SAT = new Date('2026-09-19T10:00:00Z');

(() => {
  const u = base(); const snap = JSON.stringify(u);
  const r = s(u, 50);
  eq('entrée non mutée', JSON.stringify(u), snap);
  eq('hier → streak +1 (2→3), ×1.2, +10 : round(50×1.2)+10', r.amt, 70);
  eq('lastActive posé à aujourd\'hui', [r.c.streak, r.c.lastActive, r.isFirstToday], [3, TD, true]);
  eq('toast', r.toast, { total: 70, base: 50, bonuses: [{ label: 'Streak x1.2 (3d)', color: '#ff8c42' }, { label: '+10 daily login', color: '#00e676' }] });
  eq('xp / weeklyXp crédités', [r.c.xp, r.c.weeklyXp], [170, 120]);
  eq('pas de ligue (120 < 200), niveau 1→2 (150 franchi), aucun coffre', [r.leagueUp, r.levelUp, r.chests], [null, { from: 1, to: 2 }, []]);
})();
eq('trou de plusieurs jours → streak 1', s(base({ lastActive: '2026-09-10', streak: 9 }), 50).c.streak, 1);
(() => {
  const r = s(base({ lastActive: TD }), 50);
  eq('déjà actif aujourd\'hui : streak inchangé, pas de +10, ×1', [r.c.streak, r.isFirstToday, r.amt, r.toast.bonuses], [2, false, 50, []]);
})();
eq('streak 1 → 2 : pas de multiplicateur', s(base({ streak: 1 }), 50).amt, 60);
eq('streak 6 → 7 : ×1.5', s(base({ streak: 6 }), 50).amt, 85);
eq('week-end ×2 (samedi, jour local)', s(base({ lastActive: '2026-09-19' }), 50, { now: SAT }).amt, 100);
eq('mardi : pas de week-end', s(base({ lastActive: TD }), 50).amt, 50);
eq('flash_hour ×3 déclaré', s(base({ lastActive: TD }), 50, { events: [{ type: 'flash_hour', config: { multiplier: 3 } }] }).amt, 150);
eq('flash_hour défaut ×2', s(base({ lastActive: TD }), 50, { events: [{ type: 'flash_hour' }] }).amt, 100);
eq('underdog : xp 100 < médiane 500 → ×2', s(base({ lastActive: TD }), 50, { events: [{ type: 'underdog' }], classMedianXp: 500 }).amt, 100);
eq('underdog : xp 100 ≥ médiane 50 → rien', s(base({ lastActive: TD }), 50, { events: [{ type: 'underdog' }], classMedianXp: 50 }).amt, 50);
eq('Daily Doubler actif ×2', s(base({ lastActive: TD, boosts: { dailyDoublerUntil: NOW.getTime() + 1000 } }), 50).amt, 100);
eq('Daily Doubler expiré → rien', s(base({ lastActive: TD, boosts: { dailyDoublerUntil: NOW.getTime() - 1000 } }), 50).amt, 50);
eq('cumul : samedi + streak 7 + flash ×2 = ×6, puis +10', s(base({ streak: 6, lastActive: '2026-09-18' }), 50, { now: SAT, events: [{ type: 'flash_hour' }] }).amt, 310);
(() => {
  const r = s(base(), -30);
  eq('négatif : jamais multiplié, pas de +10, streak quand même mis à jour', [r.amt, r.c.streak, r.toast], [-30, 3, { total: -30, base: -30, bonuses: [] }]);
  eq('négatif : xp/weeklyXp décrémentés', [r.c.xp, r.c.weeklyXp], [70, 20]);
})();
eq('planchers 0', (() => { const r = s(base({ xp: 10, weeklyXp: 5, lastActive: TD }), -30); return [r.c.xp, r.c.weeklyXp]; })(), [0, 0]);

// Ligue : franchissement de 200 avec weeklyXp > min précédent
(() => {
  const r = s(base({ weeklyXp: 190, lastActive: TD }), 50);
  eq('leagueUp a→b', r.leagueUp, { from: 'a', to: 'b' });
  eq('coffre league_up_b guerrier', r.chests, [{ trigger: 'league_up_b', type: 'guerrier' }]);
})();
eq('pas de leagueUp sans franchissement', s(base({ weeklyXp: 250, lastActive: TD }), 50).leagueUp, null);
eq('leagueOf manquant → erreur explicite', (() => { try { XP.settleXp(base(), 10, { now: NOW }); return 'pas d\'erreur'; } catch (e) { return /leagueOf/.test(e.message); } })(), true);

// Niveau : getLevel réel — niveau 1 jusqu'à 149 XP
eq('getLevel réel : 149 → niveau 1, 151 → niveau 2', [getLevel(149).level, getLevel(151).level], [1, 2]);
eq('levelUp 1→2', s(base({ xp: 149, lastActive: TD }), 2).levelUp, { from: 1, to: 2 });
eq('pas de levelUp', s(base({ xp: 100, lastActive: TD }), 10).levelUp, null);

// Paliers XP
// (weeklyXp placé DANS la ligue haute pour isoler le palier du passage de ligue)
eq('900 → 1100 : xp_1k novice', s(base({ xp: 900, weeklyXp: 700, lastActive: TD }), 200).chests, [{ trigger: 'xp_1k', type: 'novice' }]);
eq('9 000 → 21 000 : xp_10k puis xp_20k', s(base({ xp: 9000, weeklyXp: 700, lastActive: TD }), 12000).chests, [{ trigger: 'xp_10k', type: 'guerrier' }, { trigger: 'xp_20k', type: 'guerrier' }]);
eq('1 100 → 1 200 : rien', s(base({ xp: 1100, weeklyXp: 700, lastActive: TD }), 100).chests, []);
eq('table des paliers', XP.XP_MILESTONES.map((m) => m[0]), [1000, 3000, 5000, 10000, 20000, 30000, 50000]);

// Streaks
eq('streak 6 → 7 le jour même : coffre streak_7 + haptic', s(base({ streak: 6 }), 10).chests, [{ trigger: 'streak_7', type: 'novice', haptic: 'streak' }]);
eq('streak 7 déjà actif aujourd\'hui : pas de coffre', s(base({ streak: 7, lastActive: TD }), 10).chests, []);
eq('streak 29 → 30 : guerrier', s(base({ streak: 29 }), 10).chests, [{ trigger: 'streak_30', type: 'guerrier', haptic: 'streak' }]);

// Ordre : paliers, puis streak, puis ligue
(() => {
  const r = s(base({ xp: 900, weeklyXp: 190, streak: 6 }), 200); // streak 7 → ×1.5 → 300 +10 = 310
  eq('ordre des coffres', r.chests.map((c) => c.trigger), ['xp_1k', 'streak_7', 'league_up_b']);
  eq('montant du cas combiné', [r.amt, r.c.xp, r.c.weeklyXp], [310, 1210, 500]);
})();

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) { console.log('\nLes portes XP ont bougé : c\'est une décision produit (CLAUDE.md, XP System), pas un ajustement de test.'); process.exit(1); }
console.log('  ok');
