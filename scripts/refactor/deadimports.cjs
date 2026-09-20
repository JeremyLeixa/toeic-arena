'use strict';
/* Imports nommés jamais réutilisés dans leur fichier.
 *
 * Pourquoi un script à part : la règle eslint `no-unused-vars` du dépôt porte un
 * `varsIgnorePattern: /^[A-Z_]/`, donc elle ignore TOUT nom à majuscule initiale —
 * c'est-à-dire tous les composants React et toutes les constantes. Aucun import de
 * composant mort ne peut donc faire rougir eslint, ni la porte qui le relit.
 * Le câblage du HUD de session (lots 2 à 7, 2026-09-20) a laissé trois `Bar` morts
 * et deux imports d'icônes derrière lui sans que rien ne le dise.
 *
 * Lecture du SOURCE : un nom compte comme utilisé dès qu'il réapparaît en mot entier
 * ailleurs que sur sa propre ligne d'import. Volontairement grossier (un nom cité dans
 * un commentaire suffit à le sauver) : le but est de n'avoir aucun faux positif.
 *
 * Usage : node scripts/refactor/deadimports.cjs   (ou require() depuis lintgate.cjs)
 */
const fs = require('fs');
const path = require('path');

var ROOT = path.join(__dirname, '..', '..');
var IMPORT_RE = /^import\s*\{([^}]+)\}\s*from\s*["'][^"']+["'];?/gm;

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function scanFile(abs) {
  var out = [];
  var src = fs.readFileSync(abs, 'utf8');
  var rel = path.relative(ROOT, abs).split(path.sep).join('/');
  IMPORT_RE.lastIndex = 0;
  var m;
  while ((m = IMPORT_RE.exec(src)) !== null) {
    var body = src.slice(0, m.index) + src.slice(m.index + m[0].length);
    var names = m[1].split(',');
    for (var i = 0; i < names.length; i++) {
      var parts = names[i].trim().split(/\s+as\s+/);
      var nm = parts[parts.length - 1].trim();
      if (!nm) continue;
      if (!new RegExp('\\b' + esc(nm) + '\\b').test(body))
        out.push(rel + "  '" + nm + "' importé et jamais utilisé");
    }
  }
  return out;
}

function deadNamedImports(dir) {
  var out = [];
  (function walk(d) {
    var entries = fs.readdirSync(d, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      var p = path.join(d, entries[i].name);
      if (entries[i].isDirectory()) { walk(p); continue; }
      if (!/\.(jsx?|mjs)$/.test(entries[i].name)) continue;
      out = out.concat(scanFile(p));
    }
  })(dir || path.join(ROOT, 'src'));
  return out.sort();
}

module.exports = { deadNamedImports: deadNamedImports };

if (require.main === module) {
  var dead = deadNamedImports();
  for (var i = 0; i < dead.length; i++) console.log('   ' + dead[i]);
  console.log(dead.length ? dead.length + ' import(s) nommé(s) mort(s)' : 'aucun import nommé mort');
  process.exit(dead.length ? 1 : 0);
}
