/* Couleurs de ligue et de titre en mode clair : lib/tone.js + règle .light{--tone-…} d'appCss.js.
 *
 * POURQUOI CE TEST EXISTE. Les couleurs de ligue (data/leagues.js) et de titre (data/chests.js
 * TITLES) sont des hex clairs pensés pour le fond sombre. En mode clair, le titre équipé et la
 * pastille de ligue tombaient à 1,1-1,3:1 (Gold #ffd700, Aldric's Chosen #e8d4a8). tone(hex) les
 * remplace par une variante foncée, en clair seulement. Rien ne casse au build quand ce contrat se
 * perd : la couleur se délave, en silence. Ce test fige :
 *   · tone() : forme « var(--tone-<hex>,<hex>) », hex d'origine en repli, le reste inchangé ;
 *   · chaque couleur de ligue et de titre a sa variante, aucune variante orpheline ;
 *   · chaque variante tient ≥ 4,5:1 sur --bg, --bg2 et --bg3 de .light ;
 *   · aucune variante hors mode clair (en sombre, le hex d'origine doit s'appliquer) ;
 *   · aucune couleur de ligue ou de titre affichée brute dans src/ (sans tone()), sauf sur un
 *     fond sombre fixe #1a1208 posé sur la même ligne (carte de coffre, vignette du Shop).
 * La remise à initial dans les cartes-nuit est gardée par check_skins_light.
 *
 * Prouvé mordant le 2026-09-16 : variante --tone-ffd700 retirée → rouge ; Gold passé à #9a8a40
 * (3,0:1) → rouge ; tone() retiré du titre de Home.jsx → rouge ; une couleur de titre #123456
 * ajoutée sans variante → rouge.
 *
 * Usage : node tests/check_tones.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { tone } = require(path.join(ROOT, 'src', 'lib', 'tone.js'));
const { LEAGUES } = require(path.join(ROOT, 'src', 'data', 'leagues.js'));
const { CSS } = require(path.join(ROOT, 'src', 'styles', 'appCss.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const check = (cond, m) => { checks++; if (!cond) fail(m); };

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const lum = (c) => c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// ── tone() ──
check(tone('#FFD700') === 'var(--tone-ffd700,#FFD700)', 'tone("#FFD700") doit rendre var(--tone-ffd700,#FFD700), obtenu ' + tone('#FFD700'));
check(tone('var(--gold)') === 'var(--gold)', 'tone() doit laisser passer ce qui n\'est pas un hex à 6 chiffres');
check(tone(undefined) === undefined, 'tone(undefined) doit rendre undefined (LeagueIcon retombe alors sur var(--gold))');

// ── Les couleurs à couvrir ──
// data/chests.js importe Supabase et n'est pas requérable : on lit le bloc TITLES en texte.
const chests = fs.readFileSync(path.join(ROOT, 'src', 'data', 'chests.js'), 'utf8');
const titlesBlock = (/export var TITLES\s*=\s*\{([\s\S]*?)\n\};/.exec(chests) || [])[1] || '';
const titleColors = [...titlesBlock.matchAll(/color:\s*"(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase());
check(titleColors.length >= 10, 'bloc TITLES de data/chests.js introuvable ou vide (' + titleColors.length + ' couleurs lues)');
const leagueColors = LEAGUES.map((l) => (l.color || '').toLowerCase());
const needed = new Set([...leagueColors, ...titleColors]);

// ── Les variantes du CSS ──
const lines = CSS.split(/\r?\n/);
const lightMain = lines.find((l) => l.startsWith('.light{--bg:'));
const tok = (line, name) => { const m = new RegExp('(?:^|[{;])' + name + ':(#[0-9a-fA-F]{6})').exec(line || ''); return m ? m[1] : null; };
const lightBgs = ['--bg', '--bg2', '--bg3'].map((n) => [n, tok(lightMain, n)]);
check(lightBgs.every(([, v]) => v), 'fonds --bg/--bg2/--bg3 de .light introuvables');
const tones = new Map();
for (const l of lines.filter((x) => x.startsWith('.light{'))) {
  for (const m of l.matchAll(/--tone-([0-9a-f]{6}):(#[0-9a-fA-F]{6})/g)) tones.set('#' + m[1], m[2]);
}
check(tones.size > 0, 'aucune variante --tone-* dans une règle .light{…}');
for (const hex of needed) {
  check(tones.has(hex), 'couleur ' + hex + ' (ligue ou titre) sans variante claire « --tone-' + hex.slice(1) + ' » dans .light{…} : elle se délave en mode clair');
}
for (const [hex, dark] of tones) {
  check(needed.has(hex), 'variante --tone-' + hex.slice(1) + ' orpheline : aucune ligue ni aucun titre n\'utilise ' + hex);
  for (const [n, bg] of lightBgs) {
    if (!bg) continue;
    const c = contrast(dark, bg);
    check(c >= 4.5, '--tone-' + hex.slice(1) + ':' + dark + ' à ' + c.toFixed(2) + ':1 sur ' + n + ' ' + bg + ' (< 4,5:1)');
  }
}
// En sombre, la variable ne doit pas exister : seules .light{…} (valeur) et la règle par défaut des
// cartes-nuit (initial) ont le droit de la poser.
for (const l of lines) {
  if (!/--tone-[0-9a-f]{6}\s*:/.test(l) || l.startsWith('.light{')) continue;
  const onlyInitial = [...l.matchAll(/--tone-[0-9a-f]{6}\s*:\s*([^;}]+)/g)].every((m) => m[1].trim() === 'initial');
  check(l.startsWith('.light:where(') && onlyInitial, 'variante --tone-* posée hors mode clair : « ' + l.slice(0, 80) + '… » (en sombre le hex d\'origine doit s\'appliquer)');
}

// ── Aucune couleur de ligue ou de titre affichée brute ──
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const RAW = /\b(lg|plLg|titleData|ti|TITLES\[[^\]]+\])\.color\b/g;
for (const file of walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.jsx'))) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(RAW)) {
      const wrapped = line.slice(Math.max(0, m.index - 5), m.index) === 'tone(';
      const darkFixed = /#1a1208/i.test(line);
      check(wrapped || darkFixed, path.relative(ROOT, file) + ':' + (i + 1) + ' : « ' + m[0] + ' » affiché sans tone() (délavé en mode clair ; brut permis seulement sur fond sombre fixe #1a1208 sur la même ligne)');
    }
  });
}

console.log('  ' + checks + ' vérifications, ' + needed.size + ' couleurs de ligue et de titre, ' + tones.size + ' variantes claires');
if (fails) { console.log('\n' + fails + ' problème(s). Rien ne casse au build : titres et pastilles de ligue se délavent en mode clair.'); process.exit(1); }
console.log('  ok');
