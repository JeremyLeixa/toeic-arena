/* Graphe d'imports de src/ : pas de cycle, et les flèches vont dans un seul sens
 * (REFACTOR_PLAN.md §2, règle 3).
 *
 * POURQUOI CE TEST EXISTE. En ESM, un cycle d'imports ne casse pas le build. Il fait
 * qu'une constante calculée au chargement du module (`BOSS_P2_SHUF`, `SEASONS`…) peut
 * être lue AVANT d'être initialisée par un module qui participe au cycle : `undefined`
 * silencieux, ou TDZ. Le monolithe n'avait pas ce problème (un seul module) ; le
 * découpage le crée. La parade : un sens de dépendance imposé, vérifié ici.
 *
 * Couches, de la plus basse à la plus haute :
 *   0 data/          1 lib/, styles/, et les modules historiques (sounds, supabase, auth,
 *                      narrator, scanEngine)
 *   2 components/    3 features/        4 App.jsx, routes.jsx        5 main.jsx
 *
 * Un fichier n'importe que des couches inférieures, ou sa propre couche si elle est ≤ 2
 * (lib → lib, composant → composant), ou son propre dossier de feature. Un fichier hors
 * carte est refusé : la carte doit rester exhaustive.
 *
 * Prouvé mordant le 2026-09-15 : un import de src/App.jsx depuis src/sounds.js → rouge
 * (cycle + sens).
 *
 * Usage : node tests/check_import_graph.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('../scripts/refactor/astTools.cjs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LEGACY_LIB = new Set(['sounds.js', 'supabase.js', 'auth.js', 'narrator.js', 'scanEngine.js']);
// data/chests.js mélange données (CHEST_TYPES, DROP_TABLES…) et accès Supabase (grant/open).
// Préexistant au chantier : rangé en couche 1 pour ne pas mentir sur ses imports. À scinder
// (données pures vers data/, logique vers lib/) quand on y touchera, pas avant.
const LAYER_OVERRIDES = { 'data/chests.js': 1 };

function layerOf(rel) {
  if (LAYER_OVERRIDES[rel] !== undefined) return LAYER_OVERRIDES[rel];
  if (rel.startsWith('data/')) return 0;
  if (rel.startsWith('lib/') || rel.startsWith('styles/') || LEGACY_LIB.has(rel)) return 1;
  if (rel.startsWith('components/')) return 2;
  if (rel.startsWith('features/')) return 3;
  if (rel === 'App.jsx' || rel === 'routes.jsx') return 4;
  if (rel === 'main.jsx') return 5;
  return -1;
}
function featureOf(rel) { const m = rel.match(/^features\/([^/]+)\//); return m ? m[1] : null; }

function walkDir(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
function resolve(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base, base + '.js', base + '.jsx', path.join(base, 'index.js'), path.join(base, 'index.jsx')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const files = walkDir(SRC, []);
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/');
const edges = new Map(); // rel → Set(rel)
for (const f of files) {
  const r = rel(f);
  const lay = layerOf(r);
  if (lay < 0) { fail(r + ' est hors carte des couches : le ranger (data/lib/components/features) ou compléter la carte'); continue; }
  let ast;
  try { ast = T.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail(r + ' ne parse pas : ' + e.message); continue; }
  edges.set(r, new Set());
  for (const s of ast.body) {
    const src = s.type === 'ImportDeclaration' ? s.source : (s.type === 'ExportNamedDeclaration' || s.type === 'ExportAllDeclaration') && s.source ? s.source : null;
    if (!src) continue;
    if (!src.value.startsWith('.')) continue; // paquet npm
    const target = resolve(f, src.value);
    if (!target) { fail(r + ' importe ' + src.value + ' qui n\'existe pas'); continue; }
    const t = rel(target);
    edges.get(r).add(t);
    const lt = layerOf(t);
    const ok = lt < lay || (lt === lay && (lay <= 2 || lay === 4 || (lay === 3 && featureOf(r) === featureOf(t))));
    if (!ok) fail(r + ' (couche ' + lay + ') importe ' + t + ' (couche ' + lt + ') : sens interdit');
  }
}

// cycles : DFS trois couleurs
const color = new Map();
const stack = [];
function dfs(n) {
  color.set(n, 1); stack.push(n);
  for (const m of edges.get(n) || []) {
    if (!color.has(m)) dfs(m);
    else if (color.get(m) === 1) fail('cycle : ' + stack.slice(stack.indexOf(m)).concat(m).join(' → '));
  }
  stack.pop(); color.set(n, 2);
}
for (const n of edges.keys()) if (!color.has(n)) dfs(n);

const nEdges = [...edges.values()].reduce((a, s) => a + s.size, 0);
console.log('  ' + edges.size + ' modules, ' + nEdges + ' imports internes, aucun cycle' + (fails ? '' : ', sens respecté'));
if (fails) { console.log('\n' + fails + ' problème(s).'); process.exit(1); }
console.log('  ok');
