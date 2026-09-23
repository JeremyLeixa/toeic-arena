/* Banque Part 7 (src/data/part7.js) : forme des items et types de questions TOEIC (2026-09-23).
 *
 * POURQUOI CE TEST EXISTE. Rien ne casse le build si :
 *  · une question de vocabulaire en contexte (« the word 'X' ... is closest in meaning to ») cite un mot
 *    qui n'est plus dans le passage (réécrit) : la question devient insoluble ;
 *  · une question d'intention (« what does X mean when she writes, '...' ») cite une réplique absente ;
 *  · une insertion de phrase (« positions marked [1], [2], [3], and [4] ») perd un marqueur dans le texte,
 *    ou ses options ne sont plus [1] à [4] dans l'ordre, ou un écran les PERMUTE (« [3] [1] [4] [2] » :
 *    l'élève ne retrouve plus la position). D'où le drapeau `keep:true`, lu par les quatre endroits qui
 *    permutent les options de Part 7.
 *
 * Usage : node tests/check_part7_items.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { PART7_PASSAGES: P } = require(path.join(ROOT, 'src', 'data', 'part7.js'));

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };
const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
const MARKS = ['[1]', '[2]', '[3]', '[4]'];

const ids = new Set();
let nInsert = 0, nWord = 0, nIntent = 0;
for (const ps of P) {
  ok(ps.id + ' : identifiant unique', !ids.has(ps.id)); ids.add(ps.id);
  ok(ps.id + ' : identifiant p7pN', /^p7p[1-9]\d*$/.test(ps.id));
  ok(ps.id + ' : type et texte', typeof ps.type === 'string' && ps.type && typeof ps.text === 'string' && ps.text.length > 80);
  ok(ps.id + ' : au moins une question', Array.isArray(ps.questions) && ps.questions.length > 0);
  const text = norm(ps.text);
  const hasMarks = MARKS.some((m) => ps.text.includes(m));
  let insertQs = 0;
  (ps.questions || []).forEach((q, i) => {
    const tag = ps.id + ':' + i;
    ok(tag + ' : 4 options', Array.isArray(q.options) && q.options.length === 4);
    ok(tag + ' : bonne réponse dans 0-3', Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3);
    ok(tag + ' : explication', typeof q.x === 'string' && q.x.length > 10);
    ok(tag + ' : options distinctes', new Set(q.options.map(norm)).size === 4);
    if (/positions marked \[1\]/i.test(q.q)) {
      nInsert++; insertQs++;
      ok(tag + ' : insertion → keep:true', q.keep === true);
      ok(tag + ' : insertion → options [1] à [4] dans l\'ordre', JSON.stringify(q.options) === JSON.stringify(MARKS));
      ok(tag + ' : insertion → la phrase à placer est citée', /best belong\? '.{15,}'$/.test(q.q));
      MARKS.forEach((m) => ok(tag + ' : marqueur ' + m + ' présent une seule fois', ps.text.split(m).length === 2));
    } else {
      ok(tag + ' : keep réservé aux insertions', !q.keep);
    }
    const w = /the word '([^']+)'/i.exec(q.q);
    if (w && /closest in meaning/i.test(q.q)) {
      nWord++;
      ok(tag + " : le mot '" + w[1] + "' est dans le passage", new RegExp('\\b' + w[1].toLowerCase() + '\\b').test(text));
    }
    const said = /(?:writes|wrote|says|said),?\s*'(.+)'\??$/i.exec(q.q);
    if (said) {
      nIntent++;
      ok(tag + " : la réplique citée est dans le passage", text.includes(norm(said[1])));
    }
  });
  if (hasMarks) ok(ps.id + ' : des marqueurs [n] sans question d\'insertion', insertQs > 0);
}

// Les quatre endroits qui permutent les options de Part 7 respectent `keep`.
const SITES = [
  ['src/lib/optionShuffle.js', /if \(q\.keep\) return q;/],
  ['src/features/train/reading.jsx', /if\(!q\.keep\)for\(/],
  ['src/lib/endless.js', /q\.keep\?\{options:q\.options,correct:q\.correct\}:shufOpts4/],
  ['src/lib/reviewLookup.js', /pq\.keep \? \{ options: pq\.options, c: pq\.correct \} : perm\(/],
];
for (const [f, re] of SITES) ok(f + ' : respecte keep (options d\'insertion jamais permutées)', re.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));

// Couverture minimale des types de questions ajoutés le 2026-09-23 (qu'un nettoyage ne les efface pas).
ok('au moins 3 insertions de phrase (' + nInsert + ')', nInsert >= 3);
ok('au moins 5 questions de vocabulaire en contexte (' + nWord + ')', nWord >= 5);
ok('au moins 5 questions d\'intention (' + nIntent + ')', nIntent >= 5);

console.log((checks - fails) + '/' + checks + ' vérifications Part 7 au vert (' + P.length + ' passages ; ' + nInsert + ' insertions, ' + nWord + ' vocabulaire, ' + nIntent + ' intention)');
process.exit(fails ? 1 : 0);
