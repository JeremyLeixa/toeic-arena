/* Révélation des coffres (v3) : ce que l'élève voit, et dans quel ordre.
 *
 * POURQUOI CE TEST EXISTE. src/lib/chestReveal.js décide de l'ordre des cartes, de leur
 * regroupement et de la couleur annoncée par la lumière du coffre. Rien ne casse au build
 * quand ça dérive : une récompense disparaît de l'écran (l'élève croit n'avoir rien reçu,
 * alors qu'elle est bien en base), le légendaire revient au milieu du paquet, un « +700
 * Darics » reprend un badge de rareté, ou la lumière annonce Epic sur un coffre qui
 * contient un Legendary. Ce test fige :
 *   · RARITY_ORDER = l'ordre de RARITIES (data/chests.js, lu en texte : le module importe
 *     Supabase et ne se requiert pas en Node) ;
 *   · aucun objet perdu ni dédoublé par groupRewards, repli XP (`fallback`) compris ;
 *   · monnaies puis tokens, chacun sur UNE carte sans rareté ; puis un objet à rareté par
 *     carte, rareté croissante, cheat sheet avant cosmétique à rareté égale ;
 *   · rareté lue sur l'objet (chaîne), jamais celle du coffre ; `duplicate` conservé ;
 *   · bestRarity = max des objets, -1 sans objet rare ;
 *   · tellSteps : 3 marches, jamais décroissantes, la dernière = bestRarity ; [-1,-1,-1] sans.
 *
 * Prouvé mordant le 2026-09-16 : tri des objets inversé (b.t - a.t) → rouge ; repli XP
 * rangé hors des monnaies → rouge ; dernière marche du tell à best - 1 → rouge.
 *
 * Usage : node tests/check_chest_reveal.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Import natif du module pur. S'il casse ici, quelqu'un a rendu chestReveal.js impur.
const R = require(path.join(ROOT, 'src', 'lib', 'chestReveal.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const ok = (label, cond) => { checks++; if (!cond) fail(label); };

// 1. Ordre des raretés = RARITIES de data/chests.js
const chestsSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'chests.js'), 'utf8');
const block = (chestsSrc.match(/export var RARITIES\s*=\s*\[([\s\S]*?)\];/) || [])[1] || '';
eq('RARITY_ORDER = RARITIES', R.RARITY_ORDER, [...block.matchAll(/id:"(\w+)"/g)].map((m) => m[1]));
eq('rarityTier', ['common', 'rare', 'legend', 'nope', undefined].map(R.rarityTier), [0, 2, 4, -1, -1]);

// 2. Coffre Légendaire tel que pickRewards le sort (ordre des slots de DROP_TABLES)
const legend = [
  { type: 'daric', amount: 700 },
  { type: 'xp', id: null, xp: 1240 },
  { type: 'avatar', id: 'pourfendeur', rarity: 'legend' },
  { type: 'title', id: 'wordsmith', rarity: 'epic', duplicate: true },
  { type: 'token', id: 'daily_reroll', tokenType: 'daily_reroll' },
  { type: 'token', id: 'boss_reset', tokenType: 'boss_reset' },
  { type: 'xp', id: null, xp: 50, fallback: 'tokens_capped' },
  { type: 'cheat_sheet', id: 'part5_conjunctions', rarity: 'epic' },
  { type: 'token', id: 'insight_token', tokenType: 'insight_token' },
];
const g = R.groupRewards(legend);
const flat = g.flatMap((x) => x.items);
eq('aucun objet perdu ni dédoublé', flat.length, legend.length);
ok('chaque objet présent une seule fois', legend.every((r) => flat.filter((f) => f === r).length === 1));
eq('ordre des cartes', g.map((x) => x.kind + ':' + x.rarity), ['currencies:null', 'tokens:null', 'item:3', 'item:3', 'item:4']);
eq('monnaies, repli XP compris', g[0].items.map((r) => r.type + (r.fallback ? '*' : '')), ['daric', 'xp', 'xp*']);
eq('tokens sur une carte', g[1].items.map((r) => r.id), ['daily_reroll', 'boss_reset', 'insight_token']);
eq('cheat sheet avant cosmétique à rareté égale', g.slice(2).map((x) => x.items[0].type), ['cheat_sheet', 'title', 'avatar']);
ok('duplicate conservé', g[3].items[0].duplicate === true);
eq('bestRarity', R.bestRarity(legend), 4);

// 3. Novice : rien de rare
const novice = [{ type: 'daric', amount: 30 }, { type: 'xp', xp: 90 }, { type: 'token', id: 'streak_shield' }];
eq('Novice : deux cartes sans rareté', R.groupRewards(novice).map((x) => x.kind + ':' + x.rarity), ['currencies:null', 'tokens:null']);
eq('Novice : bestRarity', R.bestRarity(novice), -1);
eq('Novice : lumière neutre', R.tellSteps(-1), [-1, -1, -1]);
eq('vide', R.groupRewards([]), []);

// 4. tellSteps : 3 marches croissantes, la dernière = best, pour les deux branches du hasard
for (let best = 0; best <= 4; best++) {
  for (const roll of [0, 0.39, 0.4, 0.99]) {
    const s = R.tellSteps(best, () => roll);
    ok('tell best=' + best + ' roll=' + roll + ' : 3 marches', s.length === 3);
    ok('tell best=' + best + ' roll=' + roll + ' : jamais décroissant ' + JSON.stringify(s), s[0] <= s[1] && s[1] <= s[2]);
    ok('tell best=' + best + ' roll=' + roll + ' : finit sur best ' + JSON.stringify(s), s[2] === best);
    ok('tell best=' + best + ' roll=' + roll + ' : raretés valides', s.every((v) => v >= 0 && v <= 4));
  }
}
eq('saut Legendary (roll < 0,4)', R.tellSteps(4, () => 0.1), [1, 1, 4]);
eq('montée Legendary (roll ≥ 0,4)', R.tellSteps(4, () => 0.5), [2, 3, 4]);

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) { console.log('\nLa révélation des coffres a dérivé : un objet peut disparaître de l\'écran ou le tell mentir.'); process.exit(1); }
console.log('  ok');
