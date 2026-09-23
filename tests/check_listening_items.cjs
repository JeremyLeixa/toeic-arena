/* Banques Listening P3/P4 (src/data/listening.js) : forme des items et questions d'intention (2026-09-23).
 *
 * POURQUOI CE TEST EXISTE. Rien ne casse le build si :
 *  · une question d'intention (« What does the woman mean when she says, '...' ? », « Why does the speaker
 *    say, '...' ? ») cite une réplique qui n'est plus dans la conversation ou le monologue (réécrit après
 *    coup, ou audio regénéré sur un autre texte) : l'élève cherche une phrase qu'il n'a jamais entendue ;
 *  · un locuteur P3 porte un label que les scripts audio ne connaissent pas (W, M, W2, M2 : le 1er
 *    caractère donne le genre affiché « Man/Woman speaking ») ;
 *  · un monologue P4 perd son champ `voice` (W/M), que le script de génération doit respecter ;
 *  · un graphique « Look at the graphic » est mal formé (table sans lignes) : la question devient insoluble.
 *
 * Usage : node tests/check_listening_items.cjs
 */
'use strict';
const path = require('path');
const { LISTENING_P3: P3, LISTENING_P4: P4 } = require(path.join(__dirname, '..', 'src', 'data', 'listening.js'));

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };
const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
const QUOTE = /(?:says?|said|writes),?\s*'(.+)'\??$/i;

let nIntent = 0;
function checkQs(it, spoken) {
  const heard = norm(spoken);
  it.qs.forEach((q, i) => {
    const tag = it.id + ':' + i;
    ok(tag + ' : 4 options', Array.isArray(q.opts) && q.opts.length === 4);
    ok(tag + ' : bonne réponse dans 0-3', Number.isInteger(q.c) && q.c >= 0 && q.c <= 3);
    ok(tag + ' : options distinctes', new Set(q.opts.map(norm)).size === q.opts.length);
    const m = QUOTE.exec(q.q);
    if (m) { nIntent++; ok(tag + " : la réplique citée « " + m[1] + " » est dite", heard.includes(norm(m[1]))); }
    if (q.graphic) {
      ok(tag + ' : graphique → « Look at the graphic »', /^Look at the graphic/.test(q.q));
      ok(tag + ' : graphique table avec lignes', q.graphic.type !== 'table' || (Array.isArray(q.graphic.rows) && q.graphic.rows.length >= 2));
    }
  });
}
const seen = new Set();
for (const it of P3) {
  ok(it.id + ' : identifiant unique', !seen.has(it.id)); seen.add(it.id);
  ok(it.id + ' : identifiant p3_N', /^p3_\d+$/.test(it.id));
  ok(it.id + ' : au moins 3 répliques', Array.isArray(it.lines) && it.lines.length >= 3);
  (it.lines || []).forEach((l, j) => ok(it.id + ' réplique ' + j + ' : locuteur W/M/W2/M2', /^[WM]2?$/.test(l.s) && typeof l.t === 'string' && l.t.length > 5));
  checkQs(it, (it.lines || []).map((l) => l.t).join(' '));
}
for (const it of P4) {
  ok(it.id + ' : identifiant unique', !seen.has(it.id)); seen.add(it.id);
  ok(it.id + ' : identifiant p4_N', /^p4_\d+$/.test(it.id));
  ok(it.id + ' : voix W ou M', it.voice === 'W' || it.voice === 'M');
  ok(it.id + ' : texte du monologue', typeof it.text === 'string' && it.text.length > 150);
  checkQs(it, it.text);
}
ok('au moins 10 questions d\'intention en P3/P4 (' + nIntent + ')', nIntent >= 10);

console.log((checks - fails) + '/' + checks + ' vérifications Listening au vert (P3 ' + P3.length + ', P4 ' + P4.length + ', ' + nIntent + ' intentions)');
process.exit(fails ? 1 : 0);
