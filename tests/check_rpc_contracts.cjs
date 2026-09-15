/* Contrats RPC : ce que le client appelle doit exister en base, avec les bons paramètres.
 *
 * POURQUOI CE TEST EXISTE. Le 2026-09-15, en basculant les coffres sur RPC, j'ai laissé
 * un paramètre fantôme dans l'appel :
 *
 *     supabase.rpc("grant_pending_chest", {
 *       p_user_name: undefined,   // <- n'existe pas dans la signature SQL
 *       p_name: userName, ...
 *     })
 *
 * PostgREST refuse l'appel entier dans ce cas (il ne trouve aucune fonction dont la
 * signature accepte cet ensemble de paramètres) : plus aucun coffre attribué, en
 * production, sans que rien ne casse visiblement. Rattrapé à la relecture, par chance.
 *
 * Depuis le verrou du 2026-09-15, TOUT passe par des RPC (voir CLAUDE.md, « Modèle d'accès
 * Supabase ») : cette classe de bug est devenue la plus probable du projet, et la moins
 * visible. Le client et le SQL vivent dans deux fichiers que rien ne relie.
 *
 * Ce test les confronte, sans réseau ni base : il lit le source.
 *
 * Usage : node tests/check_rpc_contracts.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');

let fails = 0;
const fail = (msg) => { fails++; console.log('  FAIL ' + msg); };

// ══════════════════════════════════════════════════════════════════════════
// Outils de lecture
// ══════════════════════════════════════════════════════════════════════════

function walk(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

// Extrait les clés de PREMIER NIVEAU d'un littéral objet, en ignorant ce qui est
// imbriqué et ce qui est dans une chaîne. Écrit à la main plutôt qu'en regex :
// `p_payload:{week_id:...}` contient des accolades et des deux-points imbriqués,
// une regex naïve remonterait `week_id` comme paramètre de la RPC.
function topLevelKeys(src, openIdx) {
  const keys = [];
  let depth = 0, i = openIdx, quote = null, keyStart = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{' || c === '[' || c === '(') {
      depth++;
      if (depth === 1) keyStart = i + 1;
      continue;
    }
    if (c === '}' || c === ']' || c === ')') {
      depth--;
      if (depth === 0) {
        const tail = src.slice(keyStart, i);
        if (tail.trim()) keys.push(tail);
        return { keys: splitKeys(keys), end: i };
      }
      continue;
    }
    if (depth === 1 && c === ',') { keys.push(src.slice(keyStart, i)); keyStart = i + 1; }
  }
  return { keys: splitKeys(keys), end: -1 };
}

// Chaque fragment est `nom: valeur` ou `nom` (raccourci) ou `...spread`.
function splitKeys(fragments) {
  const out = [];
  for (const frag of fragments) {
    const t = frag.trim();
    if (!t) continue;
    if (t.startsWith('...')) { out.push({ name: '...', spread: true }); continue; }
    const m = t.match(/^["']?([A-Za-z_$][\w$]*)["']?\s*:/) || t.match(/^([A-Za-z_$][\w$]*)$/);
    out.push({ name: m ? m[1] : t.slice(0, 30), spread: false });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════
// 1. Les appels du client
// ══════════════════════════════════════════════════════════════════════════

function collectCalls() {
  const calls = [];
  for (const file of walk(SRC)) {
    const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const re = /supabase\.rpc\(\s*(['"])([A-Za-z_][\w]*)\1/g;
    let m;
    while ((m = re.exec(src))) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const line = src.slice(0, m.index).split('\n').length;
      // Après le nom : soit `)` (aucun paramètre), soit `,` puis l'objet.
      let j = m.index + m[0].length;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === ')') { calls.push({ file: rel, line, rpc: m[2], keys: [], hasObj: false }); continue; }
      if (src[j] !== ',') { calls.push({ file: rel, line, rpc: m[2], keys: [], hasObj: false }); continue; }
      j++;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] !== '{') {
        // Objet passé par variable : on ne peut rien vérifier statiquement.
        calls.push({ file: rel, line, rpc: m[2], keys: null, hasObj: true });
        continue;
      }
      const { keys } = topLevelKeys(src, j);
      calls.push({ file: rel, line, rpc: m[2], keys, hasObj: true });
    }
  }
  return calls;
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Les définitions SQL
// ══════════════════════════════════════════════════════════════════════════
// Les migrations sont préfixées par date et rejouées dans l'ordre : un
// CREATE OR REPLACE ultérieur écrase le précédent. On garde donc la DERNIÈRE
// définition rencontrée, pas la première (grant_token, par exemple, est défini
// en avril puis redéfini en septembre avec la garde de propriété).

function collectDefs() {
  const defs = {};
  const files = fs.readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, f), 'utf8').replace(/\r\n/g, '\n');
    const re = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z_][\w]*)\s*\(/gi;
    let m;
    while ((m = re.exec(sql))) {
      const open = re.lastIndex - 1;
      let depth = 0, i = open, close = -1;
      for (; i < sql.length; i++) {
        if (sql[i] === '(') depth++;
        else if (sql[i] === ')') { depth--; if (depth === 0) { close = i; break; } }
      }
      if (close < 0) continue;
      const argsRaw = sql.slice(open + 1, close).trim();
      const params = [];
      if (argsRaw) {
        let depth2 = 0, start = 0;
        const parts = [];
        for (let k = 0; k < argsRaw.length; k++) {
          const c = argsRaw[k];
          if (c === '(') depth2++;
          else if (c === ')') depth2--;
          else if (c === ',' && depth2 === 0) { parts.push(argsRaw.slice(start, k)); start = k + 1; }
        }
        parts.push(argsRaw.slice(start));
        for (const p of parts) {
          const t = p.trim().replace(/\n/g, ' ');
          if (!t) continue;
          const nm = t.match(/^([a-z_][\w]*)\s/i);
          params.push({ name: nm ? nm[1] : t, hasDefault: /\bDEFAULT\b/i.test(t) });
        }
      }
      defs[m[1]] = { file: f, params };
    }
  }
  return defs;
}

// ══════════════════════════════════════════════════════════════════════════
// Vérifications
// ══════════════════════════════════════════════════════════════════════════

const calls = collectCalls();
const defs = collectDefs();

console.log('Contrats RPC — ' + calls.length + ' appels client, '
  + Object.keys(defs).length + ' fonctions définies dans les migrations\n');

if (calls.length === 0) fail('aucun appel supabase.rpc trouvé dans src/ — le parseur est cassé');
if (Object.keys(defs).length === 0) fail('aucune fonction trouvée dans supabase/migrations/ — le parseur est cassé');

let dynamic = 0;

for (const c of calls) {
  const where = c.file + ':' + c.line + ' → ' + c.rpc + '()';

  // 1. La fonction existe-t-elle ?
  const def = defs[c.rpc];
  if (!def) {
    fail(where + ' : aucune définition dans supabase/migrations/. '
      + 'Soit la migration manque au dépôt, soit le nom est mal orthographié.');
    continue;
  }

  if (c.keys === null) { dynamic++; continue; } // paramètres passés par variable

  const sent = c.keys.filter(k => !k.spread).map(k => k.name);
  const hasSpread = c.keys.some(k => k.spread);
  const known = def.params.map(p => p.name);

  // 2. Chaque clé envoyée existe-t-elle dans la signature ?
  //    C'est cette assertion qui attrape le p_user_name fantôme.
  for (const k of sent) {
    if (known.indexOf(k) < 0) {
      fail(where + ' : paramètre « ' + k + ' » inconnu de la signature SQL. '
        + 'Attendus : ' + (known.join(', ') || '(aucun)') + '. '
        + 'PostgREST refuse l\'appel ENTIER dans ce cas.');
    }
  }

  // 3. Chaque paramètre obligatoire (sans DEFAULT) est-il fourni ?
  if (!hasSpread) {
    for (const p of def.params) {
      if (!p.hasDefault && sent.indexOf(p.name) < 0) {
        fail(where + ' : paramètre obligatoire « ' + p.name + ' » non fourni '
          + '(pas de DEFAULT dans ' + def.file + ').');
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Information : fonctions définies mais jamais appelées
// ══════════════════════════════════════════════════════════════════════════
// PAS une erreur — certaines sont des helpers internes appelés depuis d'autres
// fonctions SQL (student_guard, teacher_role_of, norm_name) et leur EXECUTE est
// justement révoqué. Mais une fonction orpheline qui n'est NI un helper NI
// appelée est une surface d'attaque gratuite : c'est ainsi que get_pity_count et
// les deux is_*_trigger_available ont été repérées et supprimées le 2026-09-15.
const called = new Set(calls.map(c => c.rpc));
const HELPERS = ['student_guard', 'teacher_role_of', 'norm_name'];
const orphans = Object.keys(defs).filter(n => !called.has(n) && HELPERS.indexOf(n) < 0);
if (orphans.length) {
  console.log('  note — définies mais jamais appelées par le client : ' + orphans.join(', '));
  console.log('         (vérifier que chacune est bien un helper SQL, sinon c\'est du mort à droper)\n');
}
if (dynamic) console.log('  note — ' + dynamic + ' appel(s) avec paramètres dynamiques, non vérifiables\n');

console.log(fails === 0
  ? 'OK — tous les contrats RPC sont cohérents.'
  : '\n' + fails + ' problème(s).');
process.exit(fails === 0 ? 0 : 1);
