#!/usr/bin/env node
'use strict';
/* Relecture mécanique d'un lot : prouve que le lot n'est QUE du déplacement
 * (REFACTOR_PLAN.md §4). `git diff --color-moved` ne sert à rien ici : chaque déclaration
 * déplacée gagne un préfixe `export `, donc git ne la reconnaît plus comme un bloc déplacé.
 *
 * Usage :
 *   node scripts/refactor/review.cjs [--base <ref>]            arbre de travail contre <ref> (défaut : HEAD)
 *   node scripts/refactor/review.cjs --base <ref> --head <ref>  un lot déjà commité
 *
 * MÉTHODE : comparaison de MULTI-ENSEMBLES de lignes, pas de hunks git. Les hunks de
 * `git diff` alignent les lignes comme ils peuvent : sur le lot 31 (deux composants au
 * JSX voisin), git a présenté 74 lignes du composant RESTANT comme retirées — fausse
 * alerte. Ici : les lignes de l'ancien App.jsx moins celles du nouveau (avec multiplicité)
 * doivent toutes réapparaître dans les fichiers du lot, à `export ` près (indentation
 * tolérée) ; et rien d'autre ne doit apparaître, hors imports et en-tête.
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
const hi = args.indexOf('--head');
const HEAD = hi >= 0 ? args[hi + 1] : null; // null = arbre de travail
const git = (cmd) => execSync('git ' + cmd, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
// null si le fichier n'existe pas dans <ref> (fichier nouveau) : cas normal, sans bruit.
const gitShow = (ref, file) => { try { return git('show ' + ref + ':"' + file + '"'); } catch (e) { return null; } };

const norm = (l) => l.replace(/\r$/, '').replace(/^(\s*)export /, '$1');
const isImport = (l) => /^\s*import\s/.test(l) || /^\/\/ Extrait de src\/App\.jsx/.test(l);
const lines = (text) => (text || '').split('\n').map(norm).filter((l) => l.trim() !== '' && !isImport(l));

// fichiers src/ touchés par le lot (modifiés ou nouveaux, y compris non suivis)
let files;
if (HEAD) {
  files = git('diff --name-only ' + BASE + ' ' + HEAD + ' -- src').split('\n').filter(Boolean);
} else {
  files = git('status --porcelain -uall -- src').split('\n').filter(Boolean).map((l) => l.slice(3).trim().replace(/^"|"$/g, ''));
}
files = files.filter((f) => /\.(js|jsx)$/.test(f));
if (!files.includes('src/App.jsx')) { console.log('src/App.jsx n\'a pas changé : rien à relire.'); process.exit(0); }

const contentOld = (f) => gitShow(BASE, f);
const contentNew = (f) => (HEAD ? gitShow(HEAD, f) : (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : null));

// multi-ensemble : ligne → multiplicité
function bag(arr) { const m = new Map(); for (const l of arr) m.set(l, (m.get(l) || 0) + 1); return m; }
function minus(a, b) { const out = new Map(); for (const [k, n] of a) { const d = n - (b.get(k) || 0); if (d > 0) out.set(k, d); } return out; }

const oldApp = bag(lines(contentOld('src/App.jsx')));
const newApp = bag(lines(contentNew('src/App.jsx')));
const removedFromApp = minus(oldApp, newApp);   // à retrouver ailleurs
const addedToApp = minus(newApp, oldApp);       // doit être vide (les imports sont déjà exclus)

const others = files.filter((f) => f !== 'src/App.jsx');
const unmatchedAdded = [];
const removedElsewhere = [];
let movedIn = 0;
for (const f of others) {
  const o = bag(lines(contentOld(f)));
  const n = bag(lines(contentNew(f)));
  for (const [l, cnt] of minus(n, o)) {
    const have = removedFromApp.get(l) || 0;
    const take = Math.min(have, cnt);
    if (take) { removedFromApp.set(l, have - take); movedIn += take; }
    if (cnt > take) unmatchedAdded.push(f + ' : ' + l + (cnt - take > 1 ? '  (×' + (cnt - take) + ')' : ''));
  }
  for (const [l, cnt] of minus(o, n)) removedElsewhere.push(f + ' : ' + l + (cnt > 1 ? '  (×' + cnt + ')' : ''));
}
const unmatchedRemoved = [];
for (const [l, cnt] of removedFromApp) if (cnt > 0) unmatchedRemoved.push(l + (cnt > 1 ? '  (×' + cnt + ')' : ''));
const appAddedNonImport = [];
for (const [l, cnt] of addedToApp) appAddedNonImport.push(l + (cnt > 1 ? '  (×' + cnt + ')' : ''));

console.log('Lot relu contre ' + BASE + (HEAD ? ' → ' + HEAD : ' (arbre de travail)') + ' : ' + movedIn + ' lignes déplacées d\'App.jsx vers ' + others.length + ' fichier(s) src/');
const show = (title, arr) => { console.log('\n' + title + ' : ' + arr.length); for (const l of arr.slice(0, 40)) console.log('   ' + l.slice(0, 150)); if (arr.length > 40) console.log('   … ' + (arr.length - 40) + ' de plus'); };
show('Lignes retirées d\'App.jsx qui ne réapparaissent nulle part', unmatchedRemoved);
show('Lignes ajoutées ailleurs qui ne viennent pas d\'App.jsx (hors imports)', unmatchedAdded);
show('Lignes ajoutées à App.jsx qui ne sont pas des imports', appAddedNonImport);
show('Lignes retirées d\'autres fichiers src/', removedElsewhere);
const manual = unmatchedRemoved.length + unmatchedAdded.length + appAddedNonImport.length + removedElsewhere.length;
console.log('\n' + (manual === 0 ? 'Déplacement pur : rien d\'autre que des imports et des `export`.' : manual + ' ligne(s) hors déplacement pur : ce sont les retouches manuelles du lot, à relire.'));
