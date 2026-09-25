// Honneurs du parchemin compactés (lib/honors.js, 2026-09-25, proto prototypes/honors-compact/).
// La vague rétroactive des trophées du Gauntlet a mis 7 trophées et 7 lignes « +30 Darics · Achievement » sur un seul
// parchemin. Garde : les Darics se regroupent par source SANS perdre un Daric, les trophées se replient au-delà de 4
// sans en perdre un, le cas courant (1 trophée) ne change pas, et SessionResult passe bien par ces fonctions.
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const H = require(path.join(ROOT, 'src', 'lib', 'honors.js'));

let checks = 0, fails = 0;
function ok(c, msg) { checks++; if (!c) { fails++; console.log('  FAIL ' + msg); } }

// Darics par source.
const wave = [30, 30, 30, 30, 30, 30, 30].map(function (a) { return { amount: a, label: 'Achievement' }; });
const g1 = H.groupMarks(wave);
ok(g1.length === 1 && g1[0].amount === 210 && g1[0].label === '7 achievements', 'vague : une ligne « +210 Darics · 7 achievements »');
const g2 = H.groupMarks([{ amount: 25, label: "Today's Focus" }, { amount: 30, label: 'Achievement' }, { amount: 30, label: 'Achievement' }, { amount: 10, label: 'Hunt' }, { amount: 10, label: 'Hunt' }]);
ok(g2.map(function (m) { return m.label; }).join('|') === "Today's Focus|2 achievements|Hunt ×2", 'sources distinctes gardées, dans l\'ordre d\'arrivée');
ok(g2.reduce(function (a, m) { return a + m.amount; }, 0) === 25 + 60 + 20, 'aucun Daric perdu au regroupement');
const g3 = H.groupMarks([{ amount: 30, label: 'Achievement' }]);
ok(g3.length === 1 && g3[0].amount === 30 && g3[0].label === 'Achievement', 'un seul octroi : ligne inchangée (« +30 Darics · Achievement »)');
ok(H.groupMarks(null).length === 0 && H.groupMarks([{ amount: 0, label: 'x' }, null]).length === 0, 'rien à afficher sans Darics');

// Trophées repliés.
const seven = [1, 2, 3, 4, 5, 6, 7].map(function (i) { return { name: 'T' + i }; });
const f1 = H.foldTrophies(seven, false);
ok(f1.shown.length === H.FOLD_SHOW && f1.hidden === 7 - H.FOLD_SHOW && f1.shown.length + f1.hidden === 7, '7 trophées : 3 montrés, 4 repliés, aucun perdu');
ok(H.foldTrophies(seven, true).shown.length === 7 && H.foldTrophies(seven, true).hidden === 0, 'déplié : tous les trophées');
ok(H.foldTrophies(seven.slice(0, 4), false).hidden === 0 && H.foldTrophies(seven.slice(0, 1), false).shown.length === 1, 'jusqu\'à 4 trophées : rien de replié');
ok(H.foldTrophies(undefined, false).shown.length === 0, 'aucun trophée : liste vide');

// Câblage.
const SR = fs.readFileSync(path.join(ROOT, 'src', 'components', 'SessionResult.jsx'), 'utf8');
ok(/var trophies = foldTrophies\(s\.achievements, honorsOpen\), markRows = groupMarks\(s\.marks\);/.test(SR), 'SessionResult : trophées et Darics passent par lib/honors.js');
ok(/trophies\.shown\.map\(/.test(SR) && /markRows\.map\(/.test(SR) && !/\(s\.marks \|\| \[\]\)\.map\(/.test(SR) && !/\(s\.achievements \|\| \[\]\)\.map\(/.test(SR), 'SessionResult : plus aucune liste brute de trophées ou de Darics');
ok(/onClick=\{function \(e\) \{ stop\(e\); setHonorsOpen\(true\); \}\}/.test(SR), 'SessionResult : « +N more » déplie sans déclencher le saut de l\'animation (stopPropagation)');
ok(!/^import /m.test(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'honors.js'), 'utf8')), 'lib/honors.js pur, sans import');

console.log((fails ? 'ÉCHEC' : 'OK') + ' — honneurs du parchemin : ' + checks + ' contrôles' + (fails ? ', ' + fails + ' en échec' : ''));
process.exit(fails ? 1 : 0);
