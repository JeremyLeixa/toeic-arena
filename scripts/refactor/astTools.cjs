'use strict';
/* Outils AST partagés par le chantier de découpage d'App.jsx (REFACTOR_PLAN.md §4).
 *
 * Tout repose sur espree (déjà présent via eslint), JSX activé. Aucune réécriture de
 * code : on ne fait que localiser des déclarations top-level et lister les identifiants
 * qu'elles référencent, avec les règles de précision suivantes :
 *   - `a.load` ne référence pas `load` (propriété non calculée d'un MemberExpression) ;
 *   - `{load: 1}` non plus (clé de propriété), mais `{load}` oui (raccourci → value) ;
 *   - `<X name="…">` : l'attribut `name` n'est pas une référence, `<X/>` en est une ;
 *   - les labels, les spécificateurs d'import/export ne sont pas des références.
 * Une sur-approximation coûte un import inutile (lint le signale) ; une sous-approximation
 * coûte un ReferenceError au rendu. Les règles ci-dessus visent l'exactitude, pas l'une
 * ou l'autre dérive.
 */
const espree = require('espree');

function parse(code) {
  return espree.parse(code, {
    ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true },
    loc: true, range: true, comment: true,
  });
}

const SKIP_KEYS = new Set(['loc', 'range', 'parent', 'comments', 'tokens']);

function visitChildren(n, fn) {
  for (const k of Object.keys(n)) {
    if (SKIP_KEYS.has(k)) continue;
    const v = n[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') fn(c, n, k); }
    else if (v && typeof v.type === 'string') fn(v, n, k);
  }
}

/* Identifiants référencés dans `node` qui appartiennent à `names` (Set). */
function collectRefs(node, names) {
  const out = new Set();
  (function visit(n, parent, key) {
    if (n.type === 'Identifier') {
      if (parent) {
        if (parent.type === 'MemberExpression' && key === 'property' && !parent.computed) return;
        if (parent.type === 'Property' && key === 'key' && !parent.computed) return;
        if ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && key === 'label') return;
        if (/^(Import|Export)\w*Specifier$/.test(parent.type)) return;
      }
      if (names.has(n.name)) out.add(n.name);
      return;
    }
    if (n.type === 'JSXIdentifier') {
      if (parent && parent.type === 'JSXAttribute') return;
      if (parent && parent.type === 'JSXMemberExpression' && key === 'property') return;
      if (names.has(n.name)) out.add(n.name);
      return;
    }
    if (n.type === 'JSXAttribute') { if (n.value) visit(n.value, n, 'value'); return; }
    visitChildren(n, visit);
  })(node, null, null);
  return out;
}

/* Noms assignés (`x = …`, `x++`) dans `node`, parmi `names`. Sert à repérer les `var`
 * mutables de niveau module écrites depuis un autre fichier (liaison en lecture seule
 * une fois exportée). */
function collectWrites(node, names) {
  const out = new Set();
  (function visit(n) {
    if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && names.has(n.left.name)) out.add(n.left.name);
    if (n.type === 'UpdateExpression' && n.argument.type === 'Identifier' && names.has(n.argument.name)) out.add(n.argument.name);
    visitChildren(n, visit);
  })(node);
  return out;
}

/* Déclarations top-level d'un module. Une entrée par NOM (une `var a=1,b=2;` donne deux
 * entrées qui partagent le même `stmt`). Les imports donnent une entrée par spécificateur. */
function topLevelDecls(ast) {
  const out = [];
  for (const stmt of ast.body) {
    if (stmt.type === 'FunctionDeclaration') {
      out.push({ name: stmt.id.name, kind: 'function', stmt, names: [stmt.id.name] });
    } else if (stmt.type === 'VariableDeclaration') {
      const names = stmt.declarations.filter((d) => d.id.type === 'Identifier').map((d) => d.id.name);
      for (const name of names) out.push({ name, kind: stmt.kind, stmt, names });
    } else if (stmt.type === 'ExportDefaultDeclaration' && stmt.declaration.type === 'FunctionDeclaration' && stmt.declaration.id) {
      out.push({ name: stmt.declaration.id.name, kind: 'default-function', stmt, names: [stmt.declaration.id.name] });
    } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration) {
      const d = stmt.declaration;
      if (d.type === 'FunctionDeclaration') out.push({ name: d.id.name, kind: 'export-function', stmt, names: [d.id.name] });
      else if (d.type === 'VariableDeclaration') {
        const names = d.declarations.filter((x) => x.id.type === 'Identifier').map((x) => x.id.name);
        for (const name of names) out.push({ name, kind: 'export-' + d.kind, stmt, names });
      }
    } else if (stmt.type === 'ImportDeclaration') {
      for (const s of stmt.specifiers) {
        const imported = s.type === 'ImportDefaultSpecifier' ? 'default' : s.type === 'ImportNamespaceSpecifier' ? '*' : s.imported.name;
        out.push({ name: s.local.name, kind: 'import', stmt, names: stmt.specifiers.map((x) => x.local.name), source: stmt.source.value, imported });
      }
    }
  }
  return out;
}

/* Noms exportés par un module (déclarations exportées + `export { a, b }`). */
function exportedNames(ast) {
  const out = [];
  for (const stmt of ast.body) {
    if (stmt.type === 'ExportNamedDeclaration') {
      if (stmt.declaration) {
        const d = stmt.declaration;
        if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') out.push(d.id.name);
        else if (d.type === 'VariableDeclaration') for (const x of d.declarations) if (x.id.type === 'Identifier') out.push(x.id.name);
      }
      for (const s of stmt.specifiers || []) out.push(s.exported.name);
    } else if (stmt.type === 'ExportDefaultDeclaration') {
      out.push('default');
    }
  }
  return out;
}

/* Début du bloc à déplacer avec `stmt` : remonte sur les commentaires collés au-dessus
 * (aucune ligne vide entre eux et la déclaration, chacun seul sur sa ligne). */
function attachedStart(code, ast, stmt) {
  const comments = ast.comments || [];
  let s = stmt.range[0];
  for (;;) {
    let found = null;
    for (const c of comments) {
      if (c.range[1] > s) continue;
      const gap = code.slice(c.range[1], s);
      if (!/^\s*$/.test(gap)) continue;
      if ((gap.match(/\n/g) || []).length > 1) continue;           // ligne vide → pas collé
      const lineStart = code.lastIndexOf('\n', c.range[0] - 1) + 1;
      if (!/^\s*$/.test(code.slice(lineStart, c.range[0]))) continue; // commentaire de fin de ligne → pas à nous
      if (!found || c.range[0] < found.range[0]) found = c;
    }
    if (!found) return s;
    s = found.range[0];
  }
}

/* Fin du bloc : la déclaration, son éventuel commentaire de fin de ligne
 * (`var X=1; // …`, qui documente X et doit voyager avec lui), et le retour à la ligne. */
function blockEnd(code, stmt) {
  let e = stmt.range[1];
  const rest = code.slice(e).match(/^[ \t]*\/\/[^\r\n]*/);
  if (rest) e += rest[0].length;
  if (code.startsWith('\r\n', e)) e += 2; else if (code[e] === '\n') e += 1;
  return e;
}

module.exports = { parse, collectRefs, collectWrites, topLevelDecls, exportedNames, attachedStart, blockEnd, visitChildren };
