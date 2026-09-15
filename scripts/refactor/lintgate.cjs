#!/usr/bin/env node
'use strict';
/* Porte de lint d'un lot (REFACTOR_PLAN.md §5, dette lint).
 *
 * Le lint du dépôt est rouge depuis longtemps (330 problèmes dans App.jsx au départ du
 * chantier : catch vides, variables inutilisées, deps de hooks). Ces problèmes MIGRENT
 * avec le code déplacé ; un `npx eslint <nouveau fichier>` rouge ne dit donc rien.
 * Ce qui compte pour le découpage, et que ce script isole :
 *   1. `no-undef`  → un import MANQUANT (passe le build, ReferenceError au rendu) ;
 *   2. `no-unused-vars` sur une ligne `import` → un import INUTILE (bruit, ou symptôme
 *      d'un déplacement raté) ;
 *   3. le total des problèmes sur src/ ne doit pas dépasser la référence figée.
 *
 * Usage :
 *   node scripts/refactor/lintgate.cjs            → vérifie 1, 2, 3 sur src/
 *   node scripts/refactor/lintgate.cjs --freeze   → fige le total courant comme référence
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const REF = path.join(__dirname, 'lint_baseline.json');
const FREEZE = process.argv.includes('--freeze');

let json;
try {
  json = execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js'), 'src', '-f', 'json'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
} catch (e) { json = e.stdout ? e.stdout.toString('utf8') : ''; }
const results = JSON.parse(json);

let total = 0;
const undef = [], unusedImports = [];
for (const f of results) {
  const rel = path.relative(ROOT, f.filePath).split(path.sep).join('/');
  const lines = fs.readFileSync(f.filePath, 'utf8').split('\n');
  for (const m of f.messages) {
    total++;
    if (m.ruleId === 'no-undef') undef.push(rel + ':' + m.line + '  ' + m.message);
    if (m.ruleId === 'no-unused-vars' && /^\s*import\b/.test(lines[m.line - 1] || '')) unusedImports.push(rel + ':' + m.line + '  ' + m.message);
  }
}

// Les imports inutilisés PRÉEXISTANTS (8 dans App.jsx au départ : playCombo, rollRarity,
// getAuthUser…) sont figés par nom, pas par ligne (les lignes bougent à chaque lot).
// Seul un import inutilisé NOUVEAU fait rougir la porte.
const key = (s) => s.replace(/:\d+\s+'/, " '").replace(/'\s.*$/, "'");
if (FREEZE) {
  fs.writeFileSync(REF, JSON.stringify({ frozenAt: new Date().toISOString().slice(0, 10), totalSrc: total, unusedImports: unusedImports.map(key).sort() }, null, 2) + '\n');
  console.log('référence figée : ' + total + ' problèmes sur src/, ' + unusedImports.length + ' import(s) inutilisé(s) préexistant(s)');
  process.exit(0);
}
const ref = fs.existsSync(REF) ? JSON.parse(fs.readFileSync(REF, 'utf8')) : null;
const known = new Set((ref && ref.unusedImports) || []);
const newUnused = unusedImports.filter((s) => !known.has(key(s)));
let fails = 0;
const show = (title, arr) => { console.log(title + ' : ' + arr.length); for (const l of arr) console.log('   ' + l); if (arr.length) fails++; };
show('no-undef (import manquant)', undef);
show('imports inutilisés nouveaux (' + (unusedImports.length - newUnused.length) + ' préexistants ignorés)', newUnused);
console.log('total src/ : ' + total + (ref ? ' (référence ' + ref.totalSrc + ', figée le ' + ref.frozenAt + ')' : ' (pas de référence : --freeze)'));
if (ref && total > ref.totalSrc) { fails++; console.log('   le total a AUGMENTÉ de ' + (total - ref.totalSrc)); }
process.exit(fails ? 1 : 0);
