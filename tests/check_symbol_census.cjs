/* Recensement des symboles : rien ne se perd, rien ne se dédouble pendant le découpage
 * d'App.jsx (REFACTOR_PLAN.md §4).
 *
 * POURQUOI CE TEST EXISTE. Un composant oublié à l'import ne casse PAS le build : Rolldown
 * laisse passer un identifiant inconnu (ce pourrait être un global) et c'est un
 * ReferenceError au rendu qui le révèle — sur l'écran d'un étudiant. Et un symbole laissé
 * dans App.jsx ET copié dans son nouveau module donne deux copies d'une même fonction, ou
 * pire, d'une même `var` mutable (deux singletons). Aucun des deux cas ne sort au build.
 *
 * Ce test compare la liste des symboles top-level d'App.jsx figée au départ du chantier
 * (tests/appjsx_symbols_baseline.json) avec l'ensemble de src/ : chaque nom doit
 * exister EXACTEMENT une fois, en comptant toute déclaration top-level d'App.jsx et toute
 * déclaration EXPORTÉE ailleurs. Un helper privé homonyme dans un autre module (le
 * `shuffle` de scanEngine.js) n'est pas une copie : il ne compte pas. Un symbole supprimé
 * volontairement (code mort) passe dans `removed` avec sa raison, jamais en silence.
 *
 * Prouvé mordant le 2026-09-15 : dupliquer `today` dans un second fichier → rouge ;
 * retirer `haptic` → rouge.
 *
 * Usage : node tests/check_symbol_census.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('../scripts/refactor/astTools.cjs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
// Pas dans tests/data/ : ce dossier est gitignoré (exports de cohorte).
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'appjsx_symbols_baseline.json'), 'utf8'));

function walkDir(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const where = new Map(); // nom → [fichiers]
let appHasDefault = false;
for (const file of walkDir(SRC, [])) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  let ast;
  try { ast = T.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.log('  FAIL ' + rel + ' ne parse pas : ' + e.message); process.exit(1); }
  for (const d of T.topLevelDecls(ast)) {
    if (d.kind === 'import') continue;
    // Hors App.jsx : une déclaration privée ne compte pas dans un module historique (le
    // `shuffle` de scanEngine.js n'est pas une copie), mais compte dans les dossiers créés
    // par le découpage : un helper déplacé sans export ("~nom" dans le manifeste) y vit.
    const splitDir = /^src\/(lib|components|features|styles)\//.test(rel);
    if (rel !== 'src/App.jsx' && !splitDir && !/^export-/.test(d.kind)) continue;
    if (!where.has(d.name)) where.set(d.name, []);
    if (!where.get(d.name).includes(rel)) where.get(d.name).push(rel);
    if (rel === 'src/App.jsx' && d.kind === 'default-function' && d.name === 'App') appHasDefault = true;
  }
}

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
let inApp = 0, elsewhere = 0;
for (const name of BASE.names) {
  if (BASE.removed[name]) {
    if (where.has(name)) fail(name + ' est marqué supprimé (' + BASE.removed[name] + ') mais existe encore dans ' + where.get(name).join(', '));
    continue;
  }
  const files = where.get(name) || [];
  if (files.length === 0) fail(name + ' a disparu de src/ (perdu au déplacement ? le déclarer dans `removed` si c\'est voulu)');
  else if (files.length > 1) fail(name + ' est déclaré dans ' + files.length + ' fichiers : ' + files.join(', '));
  else if (files[0] === 'src/App.jsx') inApp++; else elsewhere++;
}
if (!appHasDefault) fail('src/App.jsx n\'exporte plus App par défaut (main.jsx en dépend)');

const removed = Object.keys(BASE.removed).length;
console.log('  ' + BASE.names.length + ' symboles de référence (commit ' + BASE.commit + ') : ' + inApp + ' encore dans App.jsx, ' + elsewhere + ' déplacés' + (removed ? ', ' + removed + ' supprimés volontairement' : ''));
if (fails) { console.log('\n' + fails + ' problème(s). Un symbole perdu ou dédoublé ne sort pas au build : corriger avant de continuer.'); process.exit(1); }
console.log('  ok');
