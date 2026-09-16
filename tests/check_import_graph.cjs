/* Graphe d'imports de src/ : pas de cycle, et les flèches vont dans un seul sens
 * (REFACTOR_PLAN.md §2, règle 3). Depuis la Phase 5 (2026-09-16), les `import()`
 * dynamiques des écrans lazy sont des arêtes comme les autres, avec deux contrôles en plus.
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
 * IMPORTS DYNAMIQUES (écrans lazy, `lazyNamed(() => import("./…"), "Nom")`). Rolldown ne
 * vérifie rien de ce qui suit, et chaque oubli ne se voit qu'au rendu, chez un élève :
 *   (a) le chemin doit exister — sinon 404 du chunk au clic ;
 *   (b) le NOM exporté doit exister dans la cible — sinon `lazy()` résout `undefined` et
 *       React lève « Element type is invalid » ;
 *   (c) la cible ne doit PAS être aussi importée statiquement (joignable depuis main.jsx
 *       par des imports statiques) — sinon le lazy est un no-op : le module reste dans le
 *       bundle principal et le chunk ne sort jamais, en silence. C'est le piège de l'import
 *       statique oublié au moment de lazifier.
 *
 * Prouvé mordant le 2026-09-15 : un import de src/App.jsx depuis src/sounds.js → rouge
 * (cycle + sens). Le 2026-09-16 : `import("./features/nope.jsx")` → rouge (a) ;
 * `lazyNamed(…, "BossTestt")` → rouge (b) ; lazy d'un module encore importé statiquement →
 * rouge (c).
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
// Parcours récursif de l'AST (visitChildren ne descend que d'un niveau).
function walkAst(node, fn) { fn(node); T.visitChildren(node, (c) => walkAst(c, fn)); }

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const files = walkDir(SRC, []);
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/');
const edges = new Map();       // rel → Set(rel), statiques ET dynamiques (cycles, sens)
const staticEdges = new Map(); // rel → Set(rel), statiques seuls (joignabilité depuis main.jsx)
const asts = new Map();        // rel → ast (pour lire les exports d'une cible lazy)
const dynamics = [];           // {from, to, name|null}

for (const f of files) {
  const r = rel(f);
  const lay = layerOf(r);
  if (lay < 0) { fail(r + ' est hors carte des couches : le ranger (data/lib/components/features) ou compléter la carte'); continue; }
  let ast;
  try { ast = T.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail(r + ' ne parse pas : ' + e.message); continue; }
  asts.set(r, ast);
  edges.set(r, new Set()); staticEdges.set(r, new Set());

  // Une arête, statique ou dynamique : existence, sens des couches, enregistrement.
  const addEdge = (spec, kind) => {
    if (!spec.startsWith('.')) return null; // paquet npm
    const target = resolve(f, spec);
    if (!target) { fail(r + ' importe ' + spec + ' (' + kind + ') qui n\'existe pas'); return null; }
    const t = rel(target);
    edges.get(r).add(t);
    if (kind === 'statique') staticEdges.get(r).add(t);
    const lt = layerOf(t);
    const ok = lt < lay || (lt === lay && (lay <= 2 || lay === 4 || (lay === 3 && featureOf(r) === featureOf(t))));
    if (!ok) fail(r + ' (couche ' + lay + ') importe ' + t + ' (couche ' + lt + ', ' + kind + ') : sens interdit');
    return t;
  };

  for (const s of ast.body) {
    const src = s.type === 'ImportDeclaration' ? s.source : (s.type === 'ExportNamedDeclaration' || s.type === 'ExportAllDeclaration') && s.source ? s.source : null;
    if (src) addEdge(src.value, 'statique');
  }

  // Dynamiques : d'abord les `lazyNamed(fn, "Nom")` (pour connaître le nom attendu), puis
  // tout `import("./…")` restant (préchargement, ou lazy sans passer par lazyNamed).
  const seenImportNodes = new Set();
  walkAst(ast, (n) => {
    if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== 'lazyNamed') return;
    const nameArg = n.arguments[1];
    const name = nameArg && nameArg.type === 'Literal' && typeof nameArg.value === 'string' ? nameArg.value : null;
    if (n.arguments[0]) walkAst(n.arguments[0], (m) => {
      if (m.type !== 'ImportExpression' || !m.source || m.source.type !== 'Literal') return;
      seenImportNodes.add(m);
      const t = addEdge(m.source.value, 'dynamique');
      if (t) dynamics.push({ from: r, to: t, name });
    });
    if (!name) fail(r + ' : lazyNamed(…) sans nom exporté littéral en 2e argument — le test ne peut pas vérifier l\'export');
  });
  walkAst(ast, (m) => {
    if (m.type !== 'ImportExpression' || seenImportNodes.has(m)) return;
    if (!m.source || m.source.type !== 'Literal' || typeof m.source.value !== 'string') return; // source calculée : hors portée
    const t = addEdge(m.source.value, 'dynamique');
    if (t) dynamics.push({ from: r, to: t, name: null });
  });
}

// cycles : DFS trois couleurs (arêtes statiques + dynamiques)
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

// Dynamiques : (b) le nom exporté existe ; (c) la cible n'est pas joignable statiquement.
const reach = new Set();
const queue = ['main.jsx'];
while (queue.length) {
  const n = queue.shift();
  if (reach.has(n)) continue;
  reach.add(n);
  for (const m of staticEdges.get(n) || []) queue.push(m);
}
for (const d of dynamics) {
  if (reach.has(d.to)) fail(d.from + ' charge ' + d.to + ' à la demande, mais ' + d.to + ' est aussi importé statiquement (joignable depuis main.jsx) : le chunk ne sortira pas du bundle principal — retirer l\'import statique');
  if (d.name) {
    const names = T.exportedNames(asts.get(d.to) || { body: [] });
    if (!names.includes(d.name)) fail(d.from + ' : lazyNamed(…, "' + d.name + '") mais ' + d.to + ' n\'exporte pas ce nom (exports : ' + (names.join(', ') || 'aucun') + ') → undefined au rendu');
  }
}

const nEdges = [...edges.values()].reduce((a, s) => a + s.size, 0);
console.log('  ' + edges.size + ' modules, ' + nEdges + ' imports internes dont ' + dynamics.length + ' dynamique(s), aucun cycle' + (fails ? '' : ', sens respecté'));
if (fails) { console.log('\n' + fails + ' problème(s).'); process.exit(1); }
console.log('  ok');
