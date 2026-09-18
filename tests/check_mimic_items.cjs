/* Items de Mimic Hunt (src/data/mimicHunt.js, 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. Tout le jeu tient sur des FRAGMENTS de texte : le pont
 * (source → bonne réponse), les mots gardés, et ce que chaque Mimic recopie. Le module les
 * retrouve par recherche en mots entiers, sans casse. Une virgule dans le fragment, un mot
 * réécrit dans la source, un index de Mimic décalé après une réécriture d'options : rien ne
 * casse au build, le surlignage disparaît simplement — et c'est là que se trouve toute la
 * leçon (« voilà ce que le Mimic a recopié »). Le reste protège l'équilibre de rédaction :
 * position de la bonne réponse, au moins un Mimic par item (le retour en démasque un : c'est la
 * leçon), jamais de Mimic déclaré sur la bonne réponse, une explication et un piège partout.
 *
 * Usage : node tests/check_mimic_items.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'src', 'data', 'mimicHunt.js'));
const ITEMS = D.MIMIC_ITEMS, TIERS = D.MIMIC_TIERS;

let fails = 0, checks = 0;
function ok(cond, label) { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } }

// Même recherche que le module (features/games/MimicHunt.jsx) : sans casse, en mots entiers.
function isWordChar(ch) { return /[A-Za-z0-9]/.test(ch || ''); }
function found(text, frag) {
  const t = String(text).toLowerCase(), f = String(frag).toLowerCase();
  let i = t.indexOf(f);
  while (i !== -1) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + f.length])) return true;
    i = t.indexOf(f, i + 1);
  }
  return false;
}
function pairOf(f) { return typeof f === 'string' ? [f, f] : f; }

console.log('\n── Mimic Hunt : ' + ITEMS.length + ' items ──');

const pos = [0, 0, 0, 0], ids = {};
ITEMS.forEach(function (it) {
  const L = it.id + ' ';
  ok(!ids[it.id], L + ': id unique'); ids[it.id] = 1;
  ok(TIERS[it.tier], L + ': palier connu (' + it.tier + ')');
  ok(Array.isArray(it.opts) && it.opts.length === 4, L + ': 4 options');
  ok(it.c >= 0 && it.c <= 3, L + ': index de bonne réponse dans 0-3');
  ok(!!it.q && !!it.src && !!it.ctx, L + ': source, question et étiquette présentes');
  ok(!!it.exp && !!it.trap, L + ': explication et analyse du piège présentes');
  if (it.c >= 0 && it.c <= 3) pos[it.c]++;

  // Le pont : chaque moitié doit exister là où le module la cherchera.
  ok(Array.isArray(it.bridge) && it.bridge.length > 0, L + ': au moins une reformulation');
  (it.bridge || []).forEach(function (b) {
    ok(found(it.src, b[0]), L + ': "' + b[0] + '" présent dans la source');
    ok(found(it.opts[it.c], b[1]), L + ': "' + b[1] + '" présent dans la bonne réponse');
  });
  (it.echo || []).forEach(function (w) {
    ok(found(it.src, w) && found(it.opts[it.c], w), L + ': mot gardé "' + w + '" présent des deux côtés');
  });

  const keys = Object.keys(it.mimics || {});
  ok(keys.length > 0, L + ': au moins un Mimic (le retour en démasque un : c\'est la leçon)');
  ok(keys.indexOf(String(it.c)) === -1, L + ': aucun Mimic déclaré sur la bonne réponse');
  keys.forEach(function (k) {
    const i = Number(k);
    ok(i >= 0 && i <= 3 && i !== it.c, L + ': index de Mimic valide (' + k + ')');
    ok(Array.isArray(it.mimics[k]) && it.mimics[k].length > 0, L + ': le Mimic ' + k + ' recopie au moins un fragment');
    (it.mimics[k] || []).forEach(function (f) {
      const p = pairOf(f);
      ok(found(it.src, p[0]), L + ': Mimic ' + k + ' — "' + p[0] + '" présent dans la source');
      ok(found(it.opts[i] || '', p[1]), L + ': Mimic ' + k + ' — "' + p[1] + '" présent dans l\'option');
    });
  });
});

// Équilibre de rédaction : une bonne réponse qui tombe toujours au même endroit s'apprend sans
// lire. Les options sont permutées à l'exécution, mais un déséquilibre de la source signale
// surtout une série rédigée à la chaîne.
const spread = Math.max.apply(null, pos) - Math.min.apply(null, pos);
ok(spread <= 1, 'bonne réponse répartie sur A/B/C/D (' + pos.join('/') + ')');

// Les paliers sont la progression pédagogique : chacun doit exister et être servi.
[1, 2, 3].forEach(function (t) {
  const n = ITEMS.filter(function (it) { return it.tier === t; }).length;
  ok(n >= 3, 'palier ' + t + ' : au moins 3 items (' + n + ')');
  const T = TIERS[t] || {};
  ok(!!T.roman && !!T.name && !!T.lead && !!T.tip && Array.isArray(T.ex) && T.ex.length === 2,
    'palier ' + t + ' : chiffre romain, nom, accroche, conseil et exemple');
});

// Coffre de maîtrise (lib/hubStatus.js MASTERY_BLACKLIST) : exclu tant que la banque est trop courte
// pour ne pas s'apprendre par cœur (moins de 45 items, chaque partie rejoue tout), rendu dès qu'elle
// l'est — sinon le module resterait sans coffre après l'arrivée du contenu.
const { MASTERY_BLACKLIST } = require(path.join(ROOT, 'src', 'lib', 'hubStatus.js'));
const BANK_MIN = 45;
ok(ITEMS.length < BANK_MIN ? !!MASTERY_BLACKLIST.mimic : !MASTERY_BLACKLIST.mimic,
  ITEMS.length < BANK_MIN
    ? 'coffre de maîtrise : mimic doit rester dans MASTERY_BLACKLIST tant que la banque a moins de ' + BANK_MIN + ' items (' + ITEMS.length + ')'
    : 'coffre de maîtrise : la banque a ' + ITEMS.length + ' items, retirer mimic de MASTERY_BLACKLIST (lib/hubStatus.js)');

console.log(fails === 0
  ? '\n✅ ' + checks + ' vérifications, aucun problème.\n'
  : '\n❌ ' + fails + ' problème(s) sur ' + checks + ' vérifications.\n');
process.exit(fails === 0 ? 0 : 1);
