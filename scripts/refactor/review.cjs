#!/usr/bin/env node
'use strict';
/* Relecture mécanique d'un lot : prouve que le lot n'est QUE du déplacement
 * (REFACTOR_PLAN.md §4). `git diff --color-moved` ne sert à rien ici : chaque déclaration
 * déplacée gagne un préfixe `export `, donc git ne la reconnaît plus comme un bloc déplacé.
 *
 * Usage :
 *   node scripts/refactor/review.cjs [--base <ref>]     (défaut : HEAD)
 *
 * Compare l'arbre de travail à <ref> :
 *   - chaque ligne RETIRÉE de src/App.jsx doit réapparaître, à l'identique (préfixe
 *     `export ` toléré), dans un fichier src/ ajouté ou modifié par le lot ;
 *   - chaque ligne AJOUTÉE dans ces fichiers doit provenir d'une ligne retirée d'App.jsx,
 *     ou être une ligne d'import / d'en-tête ;
 *   - les lignes ajoutées à App.jsx doivent être des imports.
 * Tout le reste est listé : ce sont les retouches manuelles du lot, à relire une par une.
 * Le script ne juge pas ces retouches, il les rend visibles.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const bi = args.indexOf('--base');
const BASE = bi >= 0 ? args[bi + 1] : 'HEAD';
const git = (cmd) => execSync('git ' + cmd, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString('utf8');

const norm = (l) => l.replace(/\r$/, '');
const strip = (l) => norm(l).replace(/^export /, '');
const isImport = (l) => /^import\s/.test(l) || /^\/\/ Extrait de src\/App\.jsx/.test(l);

// fichiers src/ touchés par le lot (modifiés ou nouveaux, y compris non suivis)
const status = git('status --porcelain -- src').split('\n').filter(Boolean);
const files = status.map((l) => l.slice(3).trim().replace(/^"|"$/g, '')).filter((f) => /\.(js|jsx)$/.test(f));
if (!files.includes('src/App.jsx')) { console.log('src/App.jsx n\'a pas changé : rien à relire.'); process.exit(0); }

function diffLines(file) {
  let out;
  try { out = git('diff ' + BASE + ' -- "' + file + '"'); } catch (e) { out = ''; }
  const tracked = git('ls-files -- "' + file + '"').trim() !== '';
  const removed = [], added = [];
  if (!tracked) { // nouveau fichier : tout est ajouté
    for (const l of fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')) added.push(l);
    return { removed, added: added.filter((l, i, a) => !(i === a.length - 1 && l === '')) };
  }
  for (const l of out.split('\n')) {
    if (l.startsWith('+++') || l.startsWith('---')) continue;
    if (l.startsWith('-')) removed.push(l.slice(1));
    else if (l.startsWith('+')) added.push(l.slice(1));
  }
  return { removed, added };
}

const app = diffLines('src/App.jsx');
const others = files.filter((f) => f !== 'src/App.jsx').map((f) => ({ file: f, ...diffLines(f) }));

// multiset des lignes retirées d'App.jsx (normalisées)
const pool = new Map();
for (const l of app.removed) { const k = strip(l); pool.set(k, (pool.get(k) || 0) + 1); }
const unmatchedAdded = [];
for (const o of others) {
  for (const l of o.added) {
    const k = strip(l);
    if (k.trim() === '' || isImport(k)) continue;
    if (pool.get(k) > 0) pool.set(k, pool.get(k) - 1);
    else unmatchedAdded.push(o.file + ' : ' + k);
  }
}
const unmatchedRemoved = [];
for (const [k, n] of pool) if (n > 0 && k.trim() !== '') unmatchedRemoved.push(k + (n > 1 ? '  (×' + n + ')' : ''));
const appAddedNonImport = app.added.map(norm).filter((l) => l.trim() !== '' && !isImport(l));
const othersRemoved = [];
for (const o of others) for (const l of o.removed) if (norm(l).trim() !== '') othersRemoved.push(o.file + ' : ' + norm(l));

console.log('Lot relu contre ' + BASE + ' : App.jsx −' + app.removed.length + ' / +' + app.added.length + ' lignes ; ' + others.length + ' autre(s) fichier(s) src/');
const show = (title, arr) => { console.log('\n' + title + ' : ' + arr.length); for (const l of arr.slice(0, 40)) console.log('   ' + l.slice(0, 150)); if (arr.length > 40) console.log('   … ' + (arr.length - 40) + ' de plus'); };
show('Lignes retirées d\'App.jsx qui ne réapparaissent nulle part', unmatchedRemoved);
show('Lignes ajoutées ailleurs qui ne viennent pas d\'App.jsx (hors imports)', unmatchedAdded);
show('Lignes ajoutées à App.jsx qui ne sont pas des imports', appAddedNonImport);
show('Lignes retirées d\'autres fichiers src/', othersRemoved);
const manual = unmatchedRemoved.length + unmatchedAdded.length + appAddedNonImport.length + othersRemoved.length;
console.log('\n' + (manual === 0 ? 'Déplacement pur : rien d\'autre que des imports et des `export`.' : manual + ' ligne(s) hors déplacement pur : ce sont les retouches manuelles du lot, à relire.'));
