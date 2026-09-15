'use strict';
/* Relève, dans le SOURCE, tout ce que le client demande à Supabase : les lectures
 * directes (`supabase.from(table).select(colonnes)`) et les RPC (`supabase.rpc(nom)`),
 * plus la dernière définition SQL de chaque fonction dans supabase/migrations/.
 *
 * Sert à scripts/check-security.mjs pour vérifier que chaque chemin que l'application
 * emprunte répond encore après une migration — dérivé du code, jamais d'une liste tenue
 * à la main : c'est une liste à la main qui a laissé passer la régression du 2026-09-15
 * (lecture de `groups` coupée, « Code not found » pour toutes les promos).
 */
const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

/* Lectures directes : [{table, cols, where}] dédupliquées par (table, cols). */
function collectReads(srcDir, root) {
  const seen = new Map();
  for (const file of walk(srcDir)) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /supabase\s*\.\s*from\(\s*(['"])([A-Za-z_]\w*)\1\s*\)\s*\.\s*select\(\s*(['"])([^'"]*)\3/g;
    let m;
    while ((m = re.exec(src))) {
      const key = m[2] + '|' + m[4];
      const line = src.slice(0, m.index).split('\n').length;
      const where = path.relative(root, file).split(path.sep).join('/') + ':' + line;
      if (!seen.has(key)) seen.set(key, { table: m[2], cols: m[4], where: [where] });
      else seen.get(key).where.push(where);
    }
  }
  return [...seen.values()];
}

/* Noms des RPC appelées par le client, avec leurs sites d'appel. */
function collectRpcNames(srcDir, root) {
  const seen = new Map();
  for (const file of walk(srcDir)) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /supabase\s*\.\s*rpc\(\s*(['"])([A-Za-z_]\w*)\1/g;
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split('\n').length;
      const where = path.relative(root, file).split(path.sep).join('/') + ':' + line;
      if (!seen.has(m[2])) seen.set(m[2], []);
      seen.get(m[2]).push(where);
    }
  }
  return seen;
}

/* Dernière définition de chaque fonction dans les migrations (rejouées dans l'ordre,
 * un CREATE OR REPLACE ultérieur écrase le précédent) : paramètres typés + corps. */
function collectDefs(migrationsDir) {
  const defs = {};
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8').replace(/\r\n/g, '\n');
    const re = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z_][\w]*)\s*\(/gi;
    let m;
    while ((m = re.exec(sql))) {
      const open = re.lastIndex - 1;
      let depth = 0, close = -1;
      for (let i = open; i < sql.length; i++) {
        if (sql[i] === '(') depth++;
        else if (sql[i] === ')') { depth--; if (depth === 0) { close = i; break; } }
      }
      if (close < 0) continue;
      const params = [];
      const argsRaw = sql.slice(open + 1, close).trim();
      if (argsRaw) {
        let d = 0, start = 0; const parts = [];
        for (let k = 0; k < argsRaw.length; k++) {
          const c = argsRaw[k];
          if (c === '(') d++; else if (c === ')') d--;
          else if (c === ',' && d === 0) { parts.push(argsRaw.slice(start, k)); start = k + 1; }
        }
        parts.push(argsRaw.slice(start));
        for (const p of parts) {
          const t = p.trim().replace(/\s+/g, ' ');
          if (!t) continue;
          const mm = t.match(/^(?:(?:IN|OUT|INOUT)\s+)?([a-z_][\w]*)\s+([a-z_][\w\[\]]*(?:\s+with time zone|\s+without time zone)?)/i);
          params.push({ name: mm ? mm[1] : t, type: mm ? mm[2].toLowerCase() : 'text', hasDefault: /\bDEFAULT\b/i.test(t) });
        }
      }
      // corps : jusqu'au prochain $$ … $$ (ou $function$), sans chercher plus loin
      const bodyM = sql.slice(close).match(/AS\s+(\$[\w]*\$)([\s\S]*?)\1/i);
      defs[m[1]] = { file: f, params, body: bodyM ? bodyM[2] : '' };
    }
  }
  return defs;
}

/* Valeur factice par type SQL : assez bien typée pour que PostgREST trouve la fonction
 * et l'exécute (une garde de propriété refuse alors un compte qui n'existe pas). */
function dummyFor(type) {
  if (/\[\]$/.test(type)) return [];
  if (/^(jsonb?|json)$/.test(type)) return {};
  if (/^(int|integer|bigint|smallint|numeric|real|double|float)/.test(type)) return 0;
  if (/^bool/.test(type)) return false;
  if (/^uuid$/.test(type)) return '00000000-0000-0000-0000-000000000000';
  if (/^(timestamp|date)/.test(type)) return '2000-01-01T00:00:00Z';
  return 'zz-sweep';
}

module.exports = { walk, collectReads, collectRpcNames, collectDefs, dummyFor };
