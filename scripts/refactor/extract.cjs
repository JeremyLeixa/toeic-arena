#!/usr/bin/env node
'use strict';
/* Déplace des déclarations top-level de src/App.jsx vers de nouveaux modules, sans les
 * réécrire (REFACTOR_PLAN.md §4).
 *
 * Usage :
 *   node scripts/refactor/extract.cjs <manifeste.json> [--dry] [--show]
 *
 * Manifeste : { "src/lib/util.js": ["today", "weekId", "shuffle"], "src/lib/device.js": [...] }
 * Une entrée "stmt:<préfixe>" désigne une instruction top-level qui n'est pas une
 * déclaration (ex. "stmt:if(window.speechSynthesis)") : App.jsx en a trois, elles suivent
 * leur groupe sans `export`. Le préfixe doit être unique.
 * --show imprime le contenu des cibles (utile avec --dry).
 *
 * Pour chaque cible :
 *   1. copie le texte BRUT de chaque déclaration (commentaires collés inclus, CRLF inclus),
 *      préfixé par `export` ;
 *   2. calcule ses imports à partir des identifiants réellement référencés :
 *        - symbole déplacé dans ce run            → import depuis sa cible
 *        - symbole déjà exporté par un module src/ → import depuis ce module
 *        - symbole importé par App.jsx            → import recopié (chemin relatif ajusté)
 *        - symbole ENCORE dans App.jsx            → REFUS, rien n'est écrit
 *   3. retire les blocs d'App.jsx, y ajoute `import { … } from "<cible>"` pour ce qu'App.jsx
 *      utilise encore, et retire des imports d'App.jsx les spécificateurs que seul le code
 *      déplacé utilisait.
 *
 * Le refus du point 2 impose l'ordre feuilles → racine et interdit les cycles. Une cible
 * existante est refusée : un lot = un fichier, en une fois.
 */
const fs = require('fs');
const path = require('path');
const T = require('./astTools.cjs');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const APP = path.join(SRC, 'App.jsx');
const posix = (p) => p.split(path.sep).join('/');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const SHOW = args.includes('--show');
const manifestPath = args.find((a) => !a.startsWith('--'));
if (!manifestPath) { console.error('usage : node scripts/refactor/extract.cjs <manifeste.json> [--dry]'); process.exit(2); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function die(msg) { console.error('\nREFUS : ' + msg + '\nRien n\'a été écrit.'); process.exit(1); }

// ── App.jsx ──────────────────────────────────────────────────────────────────
const code = fs.readFileSync(APP, 'utf8');
const EOL = code.includes('\r\n') ? '\r\n' : '\n';
const ast = T.parse(code);
const decls = T.topLevelDecls(ast);
const byName = new Map();
for (const d of decls) { if (byName.has(d.name)) die('nom top-level déclaré deux fois dans App.jsx : ' + d.name); byName.set(d.name, d); }
const known = new Set(byName.keys());
// instructions top-level hors déclaration, adressées par "stmt:<préfixe>"
const looseStmts = ast.body.filter((s) => !/Declaration$/.test(s.type));
function findLoose(prefix) {
  const hits = looseStmts.filter((s) => code.slice(s.range[0], s.range[1]).startsWith(prefix));
  if (hits.length !== 1) die('"stmt:' + prefix + '" correspond à ' + hits.length + ' instruction(s) top-level, il en faut exactement une');
  return hits[0];
}

// ── Registre : ce que src/ exporte déjà (hors App.jsx) ───────────────────────
function walkDir(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const registry = new Map(); // nom exporté → chemin relatif à ROOT (posix)
for (const file of walkDir(SRC, [])) {
  if (file === APP) continue;
  let names;
  try { names = T.exportedNames(T.parse(fs.readFileSync(file, 'utf8'))); } catch (e) { die('impossible de parser ' + file + ' : ' + e.message); }
  for (const n of names) {
    if (n === 'default') continue;
    if (registry.has(n) && registry.get(n) !== posix(path.relative(ROOT, file))) console.warn('avertissement : ' + n + ' exporté par ' + registry.get(n) + ' ET ' + posix(path.relative(ROOT, file)));
    registry.set(n, posix(path.relative(ROOT, file)));
  }
}

// ── Validation du manifeste ──────────────────────────────────────────────────
const targets = Object.keys(manifest);
const targetOf = new Map(); // nom → cible
for (const t of targets) {
  if (!t.startsWith('src/')) die('cible hors src/ : ' + t);
  if (fs.existsSync(path.join(ROOT, t))) die('la cible existe déjà : ' + t + ' (un lot = un fichier, en une fois)');
  for (const n of manifest[t]) {
    if (targetOf.has(n)) die(n + ' listé deux fois');
    if (n.startsWith('stmt:')) { findLoose(n.slice(5)); targetOf.set(n, t); continue; }
    const d = byName.get(n);
    if (!d) die(n + ' n\'est pas un symbole top-level d\'App.jsx');
    if (d.kind === 'import') die(n + ' est un import d\'App.jsx, pas une déclaration');
    if (d.kind === 'default-function') die(n + ' est l\'export par défaut, il reste dans App.jsx');
    targetOf.set(n, t);
  }
}
for (const [n, t] of targetOf) {
  if (n.startsWith('stmt:')) continue;
  const d = byName.get(n);
  for (const sibling of d.names) if (targetOf.get(sibling) !== t) die(n + ' et ' + sibling + ' sont déclarés dans la même instruction `var` : même cible obligatoire');
}
const symbolNames = new Set([...targetOf.keys()].filter((n) => !n.startsWith('stmt:')));

// ── Résolution des imports d'un bloc ─────────────────────────────────────────
function relImport(fromFile, toFile) {
  let r = posix(path.relative(path.dirname(path.join(ROOT, fromFile)), path.join(ROOT, toFile)));
  if (!r.startsWith('.')) r = './' + r;
  return r;
}
function resolveDep(name, target) {
  if (targetOf.has(name)) return targetOf.get(name) === target ? null : { file: targetOf.get(name), local: name, imported: name };
  const d = byName.get(name);
  if (d.kind === 'import') {
    let source = d.source;
    if (source.startsWith('.')) source = relImport(target, posix(path.normalize(path.join('src', source))));
    return { bare: source, local: name, imported: d.imported };
  }
  if (registry.has(name)) return { file: registry.get(name), local: name, imported: name };
  return { unresolved: name };
}

// ── Composition des cibles ───────────────────────────────────────────────────
const stamp = new Date().toISOString().slice(0, 10);
const outputs = [];       // {target, text, names, lines, imports}
const removeRanges = [];  // [start, end] dans App.jsx
const problems = [];
for (const target of targets) {
  const stmts = [];
  for (const n of manifest[target]) { const s = n.startsWith('stmt:') ? findLoose(n.slice(5)) : byName.get(n).stmt; if (!stmts.includes(s)) stmts.push(s); }
  stmts.sort((a, b) => a.range[0] - b.range[0]);
  const ownNames = new Set(manifest[target]);
  const isLoose = (s) => looseStmts.includes(s);
  const imports = new Map(); // clé source → {source, specs:Map(local→imported)}
  const pieces = [];
  for (const s of stmts) {
    const start = T.attachedStart(code, ast, s);
    const end = T.blockEnd(code, s);
    removeRanges.push([start, end]);
    const head = code.slice(start, s.range[0]);
    let body = code.slice(s.range[0], end);
    if (isLoose(s)) { pieces.push(head + body); }
    else {
      if (!/^(async\s+)?function\b|^(var|let|const)\b/.test(body)) die('déclaration inattendue pour ' + manifest[target].join(',') + ' : ' + body.slice(0, 40));
      pieces.push(head + 'export ' + body);
    }
    for (const ref of T.collectRefs(s, known)) {
      if (ownNames.has(ref)) continue;
      const r = resolveDep(ref, target);
      if (!r) continue;
      if (r.unresolved) { problems.push({ target, name: ref, neededBy: manifest[target].filter((n) => (n.startsWith('stmt:') ? findLoose(n.slice(5)) : byName.get(n).stmt) === s) }); continue; }
      const key = r.bare || relImport(target, r.file);
      if (!imports.has(key)) imports.set(key, { source: key, specs: new Map() });
      imports.get(key).specs.set(r.local, r.imported);
    }
  }
  const importLines = [];
  for (const { source, specs } of [...imports.values()].sort((a, b) => a.source.localeCompare(b.source))) {
    const def = [...specs].find(([, imp]) => imp === 'default');
    const ns = [...specs].find(([, imp]) => imp === '*');
    const named = [...specs].filter(([, imp]) => imp !== 'default' && imp !== '*').map(([loc, imp]) => (loc === imp ? loc : imp + ' as ' + loc));
    const parts = [];
    if (def) parts.push(def[0]);
    if (ns) parts.push('* as ' + ns[0]);
    if (named.length) parts.push('{ ' + named.join(', ') + ' }');
    importLines.push('import ' + parts.join(', ') + ' from "' + source + '";');
  }
  const header = '// Extrait de src/App.jsx le ' + stamp + ' (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.';
  let text = [header, ...importLines].join(EOL) + EOL + EOL + pieces.join('');
  if (!text.endsWith(EOL)) text += EOL;
  outputs.push({ target, text, names: manifest[target].filter((n) => !n.startsWith('stmt:')), lines: pieces.join('').split('\n').length - 1, imports: importLines });
}

if (problems.length) {
  for (const p of problems) console.error('  ' + p.target + ' a besoin de `' + p.name + '` (via ' + p.neededBy.join(',') + ') qui est encore dans App.jsx');
  die('dépendances non déplacées. Les ajouter au manifeste (même cible ou une autre), ou les déplacer dans un lot précédent.');
}

// ── Nouveau App.jsx ──────────────────────────────────────────────────────────
removeRanges.sort((a, b) => b[0] - a[0]);
for (let i = 1; i < removeRanges.length; i++) if (removeRanges[i][1] > removeRanges[i - 1][0]) die('blocs à retirer qui se chevauchent');
let app = code;
for (const [s, e] of removeRanges) app = app.slice(0, s) + app.slice(e);

let appAst;
try { appAst = T.parse(app); } catch (e) { die('App.jsx ne parse plus après retrait : ' + e.message); }

// imports à ajouter : ce qu'App.jsx référence encore parmi les noms déplacés
const stillUsed = T.collectRefs(appAst, symbolNames);
const addLines = [];
for (const target of targets) {
  const need = manifest[target].filter((n) => stillUsed.has(n));
  if (need.length) addLines.push('import { ' + need.join(', ') + ' } from "' + relImport('src/App.jsx', target) + '";');
}
// imports d'App.jsx devenus inutiles (utilisés AVANT uniquement par le code déplacé)
const importLocals = new Set(decls.filter((d) => d.kind === 'import').map((d) => d.name));
const usedBefore = T.collectRefs(ast, importLocals);
const usedAfter = T.collectRefs(appAst, importLocals);
const dropSpecs = new Set([...usedBefore].filter((n) => !usedAfter.has(n)));
const importStmts = appAst.body.filter((s) => s.type === 'ImportDeclaration');
const edits = []; // [start, end, replacement] sur `app`
for (const s of importStmts) {
  const keep = s.specifiers.filter((sp) => !dropSpecs.has(sp.local.name));
  if (keep.length === s.specifiers.length) continue;
  const end = T.blockEnd(app, s);
  if (keep.length === 0) { edits.push([s.range[0], end, '']); continue; }
  const def = keep.find((sp) => sp.type === 'ImportDefaultSpecifier');
  const ns = keep.find((sp) => sp.type === 'ImportNamespaceSpecifier');
  const named = keep.filter((sp) => sp.type === 'ImportSpecifier').map((sp) => (sp.imported.name === sp.local.name ? sp.local.name : sp.imported.name + ' as ' + sp.local.name));
  const parts = [];
  if (def) parts.push(def.local.name);
  if (ns) parts.push('* as ' + ns.local.name);
  if (named.length) parts.push('{ ' + named.join(', ') + ' }');
  edits.push([s.range[0], end, 'import ' + parts.join(', ') + ' from ' + app.slice(s.source.range[0], s.source.range[1]) + ';' + EOL]);
}
// Insertion après le dernier import du bloc de TÊTE (App.jsx a aussi un import mid-fichier,
// auth.js vers la l. 768 : y accrocher les nouveaux imports serait légal mais illisible).
let lastImport = null;
for (const s of appAst.body) { if (s.type === 'ImportDeclaration') lastImport = s; else if (lastImport) break; }
if (addLines.length) edits.push([T.blockEnd(app, lastImport), T.blockEnd(app, lastImport), addLines.join(EOL) + EOL]);
edits.sort((a, b) => b[0] - a[0]);
for (const [s, e, rep] of edits) app = app.slice(0, s) + rep + app.slice(e);
try { T.parse(app); } catch (e) { die('App.jsx ne parse plus après réécriture des imports : ' + e.message); }

// ── Compte rendu, puis écriture ──────────────────────────────────────────────
const before = code.split('\n').length, after = app.split('\n').length;
console.log((DRY ? '[dry-run] ' : '') + 'App.jsx : ' + before + ' → ' + after + ' lignes (−' + (before - after) + ')');
for (const o of outputs) {
  console.log('  ' + o.target + ' : ' + o.names.length + ' symboles, ' + o.lines + ' lignes');
  for (const l of o.imports) console.log('      ' + l);
}
if (addLines.length) { console.log('  App.jsx importe désormais :'); for (const l of addLines) console.log('      ' + l); }
if (dropSpecs.size) console.log('  App.jsx n\'importe plus : ' + [...dropSpecs].join(', '));
if (SHOW) for (const o of outputs) { console.log('\n════ ' + o.target + ' ════'); process.stdout.write(o.text); }
if (DRY) process.exit(0);

for (const o of outputs) { fs.mkdirSync(path.dirname(path.join(ROOT, o.target)), { recursive: true }); fs.writeFileSync(path.join(ROOT, o.target), o.text); }
fs.writeFileSync(APP, app);
console.log('\nécrit. Ensuite : npm run build && npm test && npx eslint ' + targets.join(' '));
