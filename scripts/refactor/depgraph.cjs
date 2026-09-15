#!/usr/bin/env node
'use strict';
/* Graphe de dépendances des déclarations top-level de src/App.jsx (REFACTOR_PLAN.md §1, §4).
 *
 * Usage :
 *   node scripts/refactor/depgraph.cjs                 → rapport markdown sur stdout
 *   node scripts/refactor/depgraph.cjs --md out.md     → rapport dans un fichier
 *   node scripts/refactor/depgraph.cjs --baseline tests/appjsx_symbols_baseline.json
 *                                                       → fige la liste des symboles (census)
 *   node scripts/refactor/depgraph.cjs --who NOM       → qui référence NOM, et ce que NOM référence
 *
 * Le rapport sert à composer les manifestes d'extraction : pour chaque symbole, ses
 * dépendances (à déplacer avant ou avec lui), ses utilisateurs, et les `var` de niveau
 * module qu'il assigne (voir la règle sur les liaisons en lecture seule).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const T = require('./astTools.cjs');

const ROOT = path.join(__dirname, '..', '..');
const APP = path.join(ROOT, 'src', 'App.jsx');

const args = process.argv.slice(2);
const opt = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

const code = fs.readFileSync(APP, 'utf8');
const ast = T.parse(code);
const decls = T.topLevelDecls(ast);
const names = new Set(decls.map((d) => d.name));
const byName = new Map(decls.map((d) => [d.name, d]));
const isComponent = (d) => /function/.test(d.kind) && /^[A-Z]/.test(d.name);

for (const d of decls) {
  d.deps = new Set(); d.writes = new Set(); d.usedBy = new Set();
  d.start = d.stmt.loc.start.line; d.end = d.stmt.loc.end.line;
  if (d.kind === 'import') continue;
  const node = d.kind === 'function' || d.kind === 'default-function' ? d.stmt : d.stmt.declarations.find((x) => x.id.name === d.name);
  for (const x of T.collectRefs(node, names)) if (x !== d.name) d.deps.add(x);
  for (const x of T.collectWrites(node, names)) d.writes.add(x);
  d.hooks = { useState: 0, useEffect: 0, useRef: 0, useMemo: 0 };
  T.visitChildren(node, function count(n) {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && d.hooks[n.callee.name] !== undefined) d.hooks[n.callee.name]++;
    T.visitChildren(n, count);
  });
}
for (const d of decls) for (const x of d.deps) byName.get(x).usedBy.add(d.name);

if (opt('--baseline')) {
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { /* hors git */ }
  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    commit,
    note: 'Symboles top-level de src/App.jsx au départ du chantier. Chacun doit exister exactement une fois dans src/ (tests/check_symbol_census.cjs). Un symbole supprimé volontairement passe dans `removed` avec sa raison.',
    names: decls.filter((d) => d.kind !== 'import').map((d) => d.name).filter((n, i, a) => a.indexOf(n) === i),
    removed: {},
  };
  fs.writeFileSync(opt('--baseline'), JSON.stringify(out, null, 2) + '\n');
  console.log(out.names.length + ' symboles figés dans ' + opt('--baseline') + ' (commit ' + commit + ')');
  process.exit(0);
}

if (opt('--who')) {
  const d = byName.get(opt('--who'));
  if (!d) { console.error('inconnu : ' + opt('--who')); process.exit(1); }
  console.log(d.name + ' (' + d.kind + ', l.' + d.start + '-' + d.end + ')');
  console.log('  dépend de : ' + [...d.deps].join(', '));
  console.log('  utilisé par : ' + [...d.usedBy].join(', '));
  if (d.writes.size) console.log('  ASSIGNE : ' + [...d.writes].join(', '));
  process.exit(0);
}

const L = [];
const comps = decls.filter(isComponent);
const helpers = decls.filter((d) => !isComponent(d) && d.kind !== 'import');
L.push('# src/App.jsx — ' + code.split('\n').length + ' lignes, ' + (decls.length - decls.filter((d) => d.kind === 'import').length) + ' déclarations top-level, ' + comps.length + ' composants');
L.push('');
L.push('## Composants');
L.push('nom | lignes | taille | useState/Effect/Ref/Memo | rendu par | dépend de (hors composants)');
for (const d of comps) {
  const deps = [...d.deps].filter((x) => !isComponent(byName.get(x)));
  L.push(`${d.name} | ${d.start}-${d.end} | ${d.end - d.start + 1} | ${d.hooks.useState}/${d.hooks.useEffect}/${d.hooks.useRef}/${d.hooks.useMemo} | ${[...d.usedBy].join(',') || '-'} | ${deps.join(',')}`);
}
L.push('');
L.push('## Helpers et constantes');
L.push('nom | kind | lignes | taille | utilisé par | dépend de | assigne');
for (const d of helpers) {
  L.push(`${d.name} | ${d.kind} | ${d.start}-${d.end} | ${d.end - d.start + 1} | ${[...d.usedBy].join(',') || '-'} | ${[...d.deps].join(',')} | ${[...d.writes].join(',')}`);
}
L.push('');
L.push('## Variables de niveau module assignées depuis ailleurs (liaison en lecture seule après export)');
for (const d of helpers) {
  if (!/^(var|let)$/.test(d.kind)) continue;
  const writers = decls.filter((x) => x.writes.has(d.name)).map((x) => x.name);
  const readers = [...d.usedBy].filter((x) => !writers.includes(x));
  if (writers.length) L.push(`${d.name} — écrite par : ${writers.join(', ')}${readers.length ? ' ; lue par : ' + readers.join(', ') : ''}`);
}
const md = L.join('\n') + '\n';
if (opt('--md')) { fs.writeFileSync(opt('--md'), md); console.log('rapport : ' + opt('--md')); }
else process.stdout.write(md);
