/* Couleurs en dur en mode clair : lib/tone.js + règle .light{--tone-…} d'appCss.js.
 *
 * POURQUOI CE TEST EXISTE. Beaucoup de couleurs du JSX et des données sont des hex clairs pensés
 * pour le fond sombre : ligues (data/leagues.js), titres et raretés (data/chests.js), mais aussi
 * pastilles de Home, en-têtes des fiches de grammaire, niveaux CECRL, textes du Gauntlet… En mode
 * clair elles tombaient à 1,0-2,9:1 (Gold #ffd700 à 1,07:1, « +10 Login bonus » #00e676 à 1,40:1).
 * tone(hex) les remplace par une variante foncée, en clair seulement. Rien ne casse au build quand
 * ce contrat se perd : la couleur se délave, en silence. Ce test fige :
 *   · tone() : forme « var(--tone-<hex>,<hex>) », hex d'origine en repli, le reste inchangé ;
 *   · une variante pour chaque couleur de ligue, de titre et de rareté, et pour chaque couleur
 *     passée à tone() (littérale ou venue d'une source de données déclarée ci-dessous) qui tient
 *     moins de 4,5:1 en clair ; aucune variante orpheline ;
 *   · chaque variante tient ≥ 4,5:1 sur --bg, --bg2 et --bg3 de .light ;
 *   · aucune variante hors mode clair (en sombre, le hex d'origine doit s'appliquer) ;
 *   · lg/plLg.color, titleData/ti/TITLES[…].color, rarity.color, shopRarColor(…) jamais bruts ;
 *   · AUCUNE couleur hex écrite en dur dans une expression color: / color= du JSX qui tienne moins
 *     de 4,5:1 (AA) sur les fonds clairs, sauf : passée par tone() ; fond posé sur la même ligne qui la
 *     rend lisible (≥ 4,5:1, ternaires et jetons du mode clair compris : lettre blanche sur la pastille
 *     verte/rouge d'une réponse, icône blanche sur tuile dégradée, badge sur noir) ; ou précédée du
 *     marqueur « /*fond local*\/ » (fond sombre ou coloré en dur posé sur une autre ligne : aide des
 *     Flashcards, popup du Duel, bannières Endless, tuile Boss de Train, parchemin du narrateur).
 *     Les lignes de données
 *     déclarées (DATA_SOURCES) sont lues comme sources, pas comme styles.
 * Hors périmètre : Onboard.jsx (l'onboarding reste sombre, le thème s'applique après connexion),
 * TeacherDash.jsx (interface interne), Chests.jsx (coffres sur fonds sombres fixes). La remise à
 * initial dans les cartes-nuit est gardée par check_skins_light.
 *
 * Prouvé mordant le 2026-09-16 : variante --tone-ffd700 retirée → rouge ; Gold passé à #9a8a40
 * (3,0:1) → rouge ; tone() retiré du titre de Home.jsx → rouge ; une couleur de titre #123456
 * ajoutée sans variante → rouge. Raretés : variante --tone-3ecc78 retirée → rouge ; tone() retiré
 * d'un nom de rareté de Profile.jsx → rouge ; tone() retiré de shopRarColor dans Shop.jsx → rouge.
 * Couleurs en dur (lot B, même jour) : tone() retiré de « Convert duplicates » (Profile.jsx) →
 * rouge ; marqueur /*fond local*\/ retiré de l'aide des Flashcards (Cards.jsx) → rouge ; variante
 * --tone-7fb8e8 retirée → rouge ; « color:tone(p.col) » des pastilles de Home remis brut → rouge ;
 * fond conditionnel vert/rouge retiré sous la lettre blanche d'une réponse (ClueHunter.jsx) → rouge.
 * Seuil des couleurs en dur monté de 3:1 à 4,5:1 (même jour), mutations qui passaient à 3:1 :
 * tone() retiré du score du Weaver #7c3aed (4,35:1, Gauntlet.jsx) → rouge ; marqueur retiré du
 * sous-titre du parchemin #8a6530 (4,02:1, NarratorOverlay.jsx) → rouge ; fond de même ligne à
 * 3,59:1 (#c026d3 sur #e8e0d2) → rouge ; tone() retiré de la propriété color= d'un GIcon
 * (ModalCouncil.jsx) → rouge ; variante --tone-c4587a retirée → rouge.
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

const hex6 = (h) => { h = h.toLowerCase(); return h.length === 4 ? '#' + h.slice(1).split('').map((c) => c + c).join('') : h; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(hex6(h).substr(i, 2), 16));
const lum = (c) => c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrastRgb = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const contrast = (a, b) => contrastRgb(rgb(a), rgb(b));
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ── tone() ──
check(tone('#FFD700') === 'var(--tone-ffd700,#FFD700)', 'tone("#FFD700") doit rendre var(--tone-ffd700,#FFD700), obtenu ' + tone('#FFD700'));
check(tone('var(--gold)') === 'var(--gold)', 'tone() doit laisser passer ce qui n\'est pas un hex à 6 chiffres');
check(tone(undefined) === undefined, 'tone(undefined) doit rendre undefined (LeagueIcon retombe alors sur var(--gold))');

// ── Les fonds clairs ──
const lines = CSS.split(/\r?\n/);
const lightMain = lines.find((l) => l.startsWith('.light{--bg:'));
const tok = (line, name) => { const m = new RegExp('(?:^|[{;])' + name + ':(#[0-9a-fA-F]{6})').exec(line || ''); return m ? m[1] : null; };
const lightBgs = ['--bg', '--bg2', '--bg3'].map((n) => [n, tok(lightMain, n)]);
check(lightBgs.every(([, v]) => v), 'fonds --bg/--bg2/--bg3 de .light introuvables');
const worstLight = (h) => Math.min(...lightBgs.filter(([, v]) => v).map(([, v]) => contrast(h, v)));

// ── Les couleurs à couvrir ──
// data/chests.js importe Supabase et n'est pas requérable : on lit les blocs en texte.
const chests = read('src/data/chests.js');
const titlesBlock = (/export var TITLES\s*=\s*\{([\s\S]*?)\n\};/.exec(chests) || [])[1] || '';
const titleColors = [...titlesBlock.matchAll(/color:\s*"(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase());
check(titleColors.length >= 10, 'bloc TITLES de data/chests.js introuvable ou vide (' + titleColors.length + ' couleurs lues)');
const raritiesBlock = (/export var RARITIES\s*=\s*\[([\s\S]*?)\n\];/.exec(chests) || [])[1] || '';
const rarityColors = [...raritiesBlock.matchAll(/color:\s*"(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase());
check(rarityColors.length >= 5, 'bloc RARITIES de data/chests.js introuvable ou incomplet (' + rarityColors.length + ' couleurs lues)');
const leagueColors = LEAGUES.map((l) => (l.color || '').toLowerCase());
// Ligues, titres, raretés : variante exigée quelle que soit la couleur (historique du chantier).
const strict = new Set([...leagueColors, ...titleColors, ...rarityColors]);

// Sources de données dont les couleurs sont affichées via tone(<var>) : le fichier, les lignes qui
// portent les couleurs, la propriété, et le rendu qui DOIT rester passé par tone().
const DATA_SOURCES = [
  { file: 'src/features/home/Home.jsx', line: /pills\.push/, prop: 'col', render: /color:tone\(p\.col\)/, what: 'pastilles de bonus de Home' },
  { file: 'src/features/train/strategy.jsx', line: /cefr:"/, prop: 'col', render: /color:tone\(r\.col\)/, what: 'niveaux CECRL de What is the TOEIC?' },
  { file: 'src/data/grammarSheets.js', line: /title:"/, prop: 'color', render: null, what: 'en-têtes des fiches de grammaire' },
  { file: 'src/features/profile/Profile.jsx', line: /arena:"/, prop: 'color', render: /color:tone\(a\.color\)/, what: 'jauges des arènes du Profil' },
  { file: 'src/features/modals/ModalCouncil.jsx', line: /\{id:"[a-z]+",label:"[^"]+",icon:"/, prop: 'color', render: /color:tone\(correctBucket\.color\)/, what: 'familles de modaux du Modal Council' },
];
const registry = new Set();
for (const s of DATA_SOURCES) {
  const text = read(s.file);
  const found = text.split(/\r?\n/).filter((l) => s.line.test(l)).flatMap((l) => [...l.matchAll(new RegExp('\\b' + s.prop + ':\\s*"(#[0-9a-fA-F]{3,8})"', 'g'))].map((m) => m[1]));
  check(found.length > 0, s.what + ' : aucune couleur lue dans ' + s.file + ' (le test ne suit plus la source)');
  for (const h of found) {
    check(/^#[0-9a-fA-F]{6}$/.test(h), s.what + ' : ' + h + ' dans ' + s.file + ' — tone() ne gère que #rrggbb, écrire la couleur sur 6 chiffres');
    if (worstLight(h) < 4.5) registry.add(h.toLowerCase());
  }
  if (s.render) check(s.render.test(text), s.what + ' : le rendu ' + s.render + ' a disparu de ' + s.file + ' (couleur affichée brute, délavée en clair)');
}
const grammarRender = [read('src/features/train/grammar.jsx'), read('src/features/train/reading.jsx'), read('src/components/GrammarSheet.jsx')].join('\n');
check(!/color:\s*g\.color\b/.test(grammarRender), 'fiches de grammaire : « color:g.color » brut dans grammar.jsx, reading.jsx ou components/GrammarSheet.jsx (passer par tone(g.color))');
// Toute couleur littérale passée à tone() dans src/.
const srcFiles = walk(path.join(ROOT, 'src')).filter((f) => /\.(jsx?|mjs)$/.test(f));
for (const f of srcFiles) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\btone\(\s*["'](#[0-9a-fA-F]+)["']\s*\)/g)) {
    check(/^#[0-9a-fA-F]{6}$/.test(m[1]), rel(f) + ' : tone("' + m[1] + '") — tone() ne gère que #rrggbb');
    if (worstLight(m[1]) < 4.5) registry.add(m[1].toLowerCase());
  }
}
const needed = new Set([...strict, ...registry]);

// ── Les variantes du CSS ──
const tones = new Map();
for (const l of lines.filter((x) => x.startsWith('.light{'))) {
  for (const m of l.matchAll(/--tone-([0-9a-f]{6}):(#[0-9a-fA-F]{6})/g)) tones.set('#' + m[1], m[2]);
}
check(tones.size > 0, 'aucune variante --tone-* dans une règle .light{…}');
for (const h of needed) {
  check(tones.has(h), 'couleur ' + h + ' (' + (strict.has(h) ? 'ligue, titre ou rareté' : 'passée à tone(), ' + worstLight(h).toFixed(2) + ':1 en clair') + ') sans variante claire « --tone-' + h.slice(1) + ' » dans .light{…} : elle se délave en mode clair');
}
for (const [h, dark] of tones) {
  check(needed.has(h), 'variante --tone-' + h.slice(1) + ' orpheline : aucune ligue, aucun titre, aucune rareté ni aucun tone() ne l\'utilise');
  for (const [n, bg] of lightBgs) {
    if (!bg) continue;
    const c = contrast(dark, bg);
    check(c >= 4.5, '--tone-' + h.slice(1) + ':' + dark + ' à ' + c.toFixed(2) + ':1 sur ' + n + ' ' + bg + ' (< 4,5:1)');
  }
}
// En sombre, la variable ne doit pas exister : seules .light{…} (valeur) et la règle par défaut des
// cartes-nuit (initial) ont le droit de la poser.
for (const l of lines) {
  if (!/--tone-[0-9a-f]{6}\s*:/.test(l) || l.startsWith('.light{')) continue;
  const onlyInitial = [...l.matchAll(/--tone-[0-9a-f]{6}\s*:\s*([^;}]+)/g)].every((m) => m[1].trim() === 'initial');
  check(l.startsWith('.light:where(') && onlyInitial, 'variante --tone-* posée hors mode clair : « ' + l.slice(0, 80) + '… » (en sombre le hex d\'origine doit s\'appliquer)');
}

// ── Aucune couleur de ligue, de titre ou de rareté affichée brute ──
const jsxFiles = srcFiles.filter((f) => f.endsWith('.jsx'));
const RAW = /\b(?:(?:lg|plLg|titleData|ti|rarity|TITLES\[[^\]]+\])\.color\b|shopRarColor\([^)]*\))/g;
for (const file of jsxFiles) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(RAW)) {
      const wrapped = line.slice(Math.max(0, m.index - 5), m.index) === 'tone(';
      const darkFixed = /#1a1208/i.test(line);
      check(wrapped || darkFixed, rel(file) + ':' + (i + 1) + ' : « ' + m[0] + ' » affiché sans tone() (délavé en mode clair ; brut permis seulement sur fond sombre fixe #1a1208 sur la même ligne)');
    }
  });
}

// ── Aucune couleur en dur délavée en clair dans une expression color: / color= du JSX ──
const OUT_OF_SCOPE = /features\/(onboarding\/Onboard|teacher\/TeacherDash|chests\/Chests)\.jsx$/;
// Découpe l'expression qui suit « color: » (jusqu'à la virgule ou l'accolade de niveau 0) ou
// « color= » (chaîne ou accolades équilibrées).
function segmentAfter(line, start, isProp) {
  let depth = 0, q = null, i = start;
  if (isProp && line[i] === '"') { const end = line.indexOf('"', i + 1); return line.slice(i, end < 0 ? line.length : end + 1); }
  for (; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === q && line[i - 1] !== '\\') q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; continue; }
    if (line.startsWith('/*', i)) { const end = line.indexOf('*/', i); i = end < 0 ? line.length : end + 1; continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { if (depth === 0) break; depth--; if (isProp && depth === 0) { i++; break; } }
    else if (ch === ',' && depth === 0 && !isProp) break;
  }
  return line.slice(start, i);
}
const stripTone = (s) => { let out = '', i = 0; while (i < s.length) { const k = s.indexOf('tone(', i); if (k < 0) { out += s.slice(i); break; } out += s.slice(i, k); let d = 0, j = k + 4; for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (d === 0) break; } } i = j + 1; } return out; };
// Jetons du mode clair (repli sur :root) pour résoudre var(--x) dans un fond.
const rootLine = lines.find((l) => l.startsWith(':root{')) || '';
const tokenValue = (name) => tok(lightMain, name) || tok(rootLine, name);
// Couleurs de fond posées sur la ligne, ternaires compris : hex, rgb/rgba d'opacité ≥ 0,5, jetons.
function lineBackgrounds(line) {
  const bgs = [];
  for (const m of line.matchAll(/background(?:Color)?\s*:\s*/g)) {
    const seg = segmentAfter(line, m.index + m[0].length, false);
    for (const h of seg.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) bgs.push(rgb(h[0]));
    for (const r of seg.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/g)) if (r[4] === undefined || parseFloat(r[4]) >= 0.5) bgs.push([+r[1], +r[2], +r[3]]);
    for (const v of seg.matchAll(/var\((--[\w-]+)\)/g)) { const val = tokenValue(v[1]); if (val) bgs.push(rgb(val)); }
  }
  return bgs;
}
let literalCount = 0;
for (const file of jsxFiles) {
  if (OUT_OF_SCOPE.test(rel(file))) continue;
  const dataLines = DATA_SOURCES.filter((s) => s.file === rel(file)).map((s) => s.line);
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (dataLines.some((re) => re.test(line))) return; // déclaration de données, rendue via tone()
    // « color: » dans un objet de style ; « color= » seulement comme propriété JSX (suivi de { ou ").
    for (const m of line.matchAll(/(?<![\w-])color\s*(:|=(?=\s*[{"]))\s*/g)) {
      const seg = stripTone(segmentAfter(line, m.index + m[0].length, m[1] !== ':'));
      for (const h of seg.matchAll(/(\/\*fond local\*\/\s*)?["'](#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})["']/g)) {
        literalCount++;
        if (h[1] || worstLight(h[2]) >= 4.5) continue;
        const onLocalBg = lineBackgrounds(line).some((bg) => contrastRgb(rgb(h[2]), bg) >= 4.5);
        check(onLocalBg, rel(file) + ':' + (i + 1) + ' : couleur en dur ' + h[2] + ' à ' + worstLight(h[2]).toFixed(2) + ':1 sur les fonds clairs (passer par tone("' + hex6(h[2]) + '") ; fond sombre ou coloré posé sur une autre ligne : marqueur /*fond local*/)');
      }
    }
  });
}

console.log('  ' + checks + ' vérifications, ' + needed.size + ' couleurs à variante (' + strict.size + ' ligue/titre/rareté, ' + registry.size + ' via tone()), ' + tones.size + ' variantes claires, ' + literalCount + ' couleurs en dur lues dans le JSX');
if (fails) { console.log('\n' + fails + ' problème(s). Rien ne casse au build : ces couleurs se délavent en mode clair.'); process.exit(1); }
console.log('  ok');
