/* Règle de voix des clips Listening P1/P2 : la même pour l'app et pour le script de
 * génération, et fidèle au TOEIC (question et réponses par deux locuteurs différents).
 *
 * POURQUOI CE TEST EXISTE. Depuis le 2026-09-16, la lettre (« A. », « B. »…) est un clip à
 * part, joué dans la voix de l'item avant l'option affichée : l'app choisit le clip de lettre
 * avec lib/listeningVoices.js, le script scripts/regen-listening-letterless.mjs a choisi la
 * voix des options avec le MÊME module. Si la règle bouge sans regénérer les clips, l'élève
 * entend « B. » dans une voix et la réponse dans une autre — ça ne casse ni le build ni
 * check:assets (les fichiers existent tous). Ce test fige donc la forme de la règle :
 *   · pour chaque item P2, la voix de la question ≠ la voix des réponses (deux locuteurs) ;
 *   · l'URL d'un clip de lettre est /audio/letters/<clé de voix connue>_<A-D>.mp3 ;
 *   · un item du Boss (bp…) est annoncé par Sarah, la voix des questions du Boss ;
 *   · la rotation utilise les 6 voix, sans trou (chaque voix a bien ses clips de lettres).
 * Il ne peut pas prouver que les MP3 sur disque ont été générés avec CETTE règle : c'est le
 * commentaire du module, et la discipline « changer la règle = regénérer », qui le garantissent.
 *
 * Prouvé mordant le 2026-09-16 : réponses à `(n+0)` au lieu de `(n+3)` → rouge (Q = R) ;
 * letterVoiceKey renvoyant "narrator" → rouge (clé inconnue) ; LETTERS réduit à A-C → rouge.
 *
 * Usage : node tests/check_listening_voices.cjs
 */
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
const V = require(path.join(ROOT, 'src', 'lib', 'listeningVoices.js'));
const { LISTENING_P1, LISTENING_P2 } = require(path.join(ROOT, 'src', 'data', 'listening.js'));
const { BOSS_P1, BOSS_P2 } = require(path.join(ROOT, 'src', 'data', 'bossTestFull.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const keys = new Set(V.LISTENING_VOICES.map((v) => v.key));
const URL_RE = /^\/audio\/letters\/([a-z_]+)_([ABCD])\.mp3$/;

checks++; if (V.LISTENING_VOICES.length !== 6) fail('6 voix attendues en rotation, ' + V.LISTENING_VOICES.length + ' trouvée(s)');
checks++; if (V.LETTERS.join('') !== 'ABCD') fail('LETTERS doit être A, B, C, D (P1 a quatre énoncés) : ' + V.LETTERS.join(''));
checks++; if (new Set(V.LISTENING_VOICES.map((v) => v.id)).size !== V.LISTENING_VOICES.length) fail('deux voix partagent le même id ElevenLabs');

// P2 : deux locuteurs par item, et la voix des lettres = celle des réponses.
const used = new Set();
for (const it of LISTENING_P2) {
  checks++;
  const q = V.p2QuestionVoice(it.id), r = V.p2ResponseVoice(it.id);
  if (!q || !r) { fail(it.id + ' : voix introuvable'); continue; }
  if (q.key === r.key) fail(it.id + ' : question et réponses dans la même voix (' + q.key + ') — le TOEIC en veut deux');
  if (V.letterVoiceKey('p2', it.id) !== r.key) fail(it.id + ' : la lettre serait dite par ' + V.letterVoiceKey('p2', it.id) + ' mais les réponses par ' + r.key);
  used.add(q.key); used.add(r.key);
}
// P1 : une voix par item, la lettre dans cette voix.
for (const it of LISTENING_P1) {
  checks++;
  const v = V.p1Voice(it.id);
  if (!v) { fail(it.id + ' : voix introuvable'); continue; }
  if (V.letterVoiceKey('p1', it.id) !== v.key) fail(it.id + ' : lettre (' + V.letterVoiceKey('p1', it.id) + ') ≠ énoncés (' + v.key + ')');
  used.add(v.key);
}
checks++; for (const k of keys) if (!used.has(k)) fail('la voix ' + k + ' n\'est jamais utilisée par la rotation : ses clips de lettres sont inutiles, ou la rotation a un trou');

// URL des clips de lettres : voix connue, lettre A-D, pour tout item et toute position.
const sample = LISTENING_P1.slice(0, 12).map((it) => ['p1', it.id]).concat(LISTENING_P2.slice(0, 12).map((it) => ['p2', it.id]));
for (const [part, id] of sample) for (let pos = 0; pos < (part === 'p1' ? 4 : 3); pos++) {
  checks++;
  const url = V.letterClipUrl(part, id, pos);
  const m = URL_RE.exec(url);
  if (!m) { fail(part + ' ' + id + ' pos ' + pos + ' : URL de lettre inattendue ' + url); continue; }
  if (!keys.has(m[1])) fail(url + ' : clé de voix inconnue « ' + m[1] + ' »');
  if (m[2] !== V.LETTERS[pos]) fail(url + ' : lettre ' + m[2] + ' pour la position ' + pos);
}

// Boss : ids bp1_/bp2_, lettres par Sarah (voix des questions du Boss, clips sans lettre).
for (const it of BOSS_P1.slice(0, 3).concat(BOSS_P2.slice(0, 3))) {
  checks++;
  if (!V.isBossItem(it.id)) fail(it.id + ' : non reconnu comme item du Boss');
  const url = V.letterClipUrl(it.id.startsWith('bp1') ? 'p1' : 'p2', it.id, 0);
  if (url !== '/audio/letters/sarah_A.mp3') fail(it.id + ' : lettre attendue par Sarah, obtenu ' + url);
}
checks++; if (V.isBossItem('p2_01')) fail('p2_01 (entraînement) pris pour un item du Boss');

console.log('  ' + checks + ' vérifications, ' + fails + ' échec(s)');
if (fails) { console.log('\nLa règle de voix a bougé : regénérer les clips concernés (scripts/regen-listening-letterless.mjs), pas ajuster le test.'); process.exit(1); }
console.log('  ok');
