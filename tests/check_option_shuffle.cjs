/* Permutation des options des QCM de modules (2026-09-18).
 *
 * POURQUOI CE TEST EXISTE. Les banques écrites à la main mettent la bonne réponse en B ou C
 * huit fois sur dix (Traps : 44 B sur 60, aucun D). Un module qui rend les options dans l'ordre
 * de la banque apprend la position, pas la règle, et rien ne casse : le build passe, le jeu
 * marche, le score monte. Neuf modules étaient dans ce cas jusqu'au 2026-09-18. Trois choses
 * tiennent la correction :
 *   1. `shuffleOpts` (lib/util.js) : la bonne réponse suit, les options restent les mêmes, la
 *      banque n'est pas modifiée, et toutes les positions sortent.
 *   2. Chaque module l'appelle au montage de son deck avec les clés de SA banque, et range le
 *      résultat sous ces mêmes clés : une permutation rangée sous `c` dans un module qui lit
 *      `ans` surlignerait une option au hasard. Les options sont rendues depuis cette clé.
 *   3. Aucun texte des banques ne désigne une option par sa position (« answer B », « both A
 *      and C », « all of the above ») : une fois permutées, la lettre désigne n'importe quoi.
 *      C'était le cas du piège n°1 du Traps Quiz, affiché pendant la question. Les exceptions
 *      (article « A » en option, lettres d'une question TOEIC imaginée) sont listées avec leur
 *      raison, et une exception qui ne sert plus fait rougir.
 *
 * Étendu le même jour (section 2b) à la banque de grammaire (Drill, Daily, Exam Simulation, Word Fall :
 * bonne réponse en B 61 %, en D 4 %), aux Mock Tests (Part 6 en A 7 fois sur 8) et au Boss (Parts 3-4
 * jamais en A), via lib/optionShuffle.js : tirage neuf, sauf au Boss, figé par identifiant parce que sa
 * reprise de session relit des réponses rangées par index. Prouvé mordant (16 mutations) : bonne réponse
 * non suivie en P5 ou P6, index de map pris pour une graine, tirage du Boss non figé ou à l'ancien pas,
 * chacun des cinq écrans et le Boss qui relisent la banque brute, une explication qui cite « answer D »,
 * une exception devenue orpheline (« Lot C » réécrit), et la chasse qui rend drill, P6 ou P7 dans l'ordre.
 *
 * Nouveau module QCM : l'ajouter à MODULES (et ses textes à BANKS).
 * Prouvé mordant le 2026-09-18 (voir le commit) : retirer `.map(permuteQ)` du Chronomancer,
 * ranger la permutation du Clue Hunter sous `c`, un `shuffleOpts` qui ne suit pas la bonne
 * réponse ou ne permute pas, un `resetQuiz` qui garde le deck, remettre « answer B » dans le
 * piège n°1, retirer une exception : chacun rougit.
 *
 * Usage : node tests/check_option_shuffle.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
// require(esm) : Node 22 + "type": "module", comme les autres tests.
const { shuffleOpts } = require(path.join(SRC, 'lib', 'util.js'));
const { A_IS_OPT_LABEL } = require(path.join(SRC, 'lib', 'listeningShuffle.js'));
const GG = require(path.join(SRC, 'data', 'grammarGauntlet.js'));
const CLUE = require(path.join(SRC, 'data', 'clueHunter.js'));
const AB = require(path.join(SRC, 'data', 'audioBlitz.js'));
const MG = require(path.join(SRC, 'data', 'miniGames.js'));

let fails = 0, checks = 0;
function ok(cond, label) { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } }

const BANKS = {
  TENSE_CHRONOMANCER: GG.TENSE_CHRONOMANCER, PASSIVE_FORGE: GG.PASSIVE_FORGE, RELATIVE_WEAVER: GG.RELATIVE_WEAVER,
  CLUE_HUNTER: CLUE.CLUE_HUNTER, AUDIO_BLITZ: AB.AUDIO_BLITZ, FALSE_FRIENDS: MG.FALSE_FRIENDS,
  TOEIC_TRAPS: MG.TOEIC_TRAPS, STRAT_QUIZ: MG.STRAT_QUIZ, GERUND_INF: MG.GERUND_INF,
  // Mimic Hunt permute ses options avec son propre `prep` (les Mimics suivent) : pas dans MODULES, mais
  // ses textes, eux, ne doivent pas plus citer de lettre (les 11 pièges « A recycles… » jusqu'au 2026-09-18).
  MIMIC_ITEMS: require(path.join(SRC, 'data', 'mimicHunt.js')).MIMIC_ITEMS,
};
// fn = le composant exporté ; ok / ck = clés des options et de la bonne réponse dans la banque.
const MODULES = [
  { file: 'features/gauntlet/Gauntlet.jsx', fn: 'Chronomancer', bank: 'TENSE_CHRONOMANCER', ok: 'o', ck: 'c' },
  { file: 'features/gauntlet/Gauntlet.jsx', fn: 'PassiveForge', bank: 'PASSIVE_FORGE', ok: 'o', ck: 'c' },
  { file: 'features/gauntlet/Gauntlet.jsx', fn: 'RelativeWeaver', bank: 'RELATIVE_WEAVER', ok: 'o', ck: 'c' },
  { file: 'features/games/ClueHunter.jsx', fn: 'ClueHunter', bank: 'CLUE_HUNTER', ok: 'opts', ck: 'ans' },
  { file: 'features/games/AudioBlitz.jsx', fn: 'AudioBlitz', bank: 'AUDIO_BLITZ', ok: 'opts', ck: 'c' },
  { file: 'features/train/grammar.jsx', fn: 'FalseFriends', bank: 'FALSE_FRIENDS', ok: 'opts', ck: 'correct' },
  { file: 'features/train/grammar.jsx', fn: 'TrapsQuiz', bank: 'TOEIC_TRAPS', ok: 'options', ck: 'correct' },
  { file: 'features/train/grammar.jsx', fn: 'GerInf', bank: 'GERUND_INF', ok: 'opts', ck: 'c' },
  { file: 'features/train/strategy.jsx', fn: 'StratQuizPage', bank: 'STRAT_QUIZ', ok: 'options', ck: 'correct' },
];
const itemKey = (it) => String(it.id != null ? it.id : (it.en || it.verb));

// ── 1. shuffleOpts ──────────────────────────────────────────────────────────────────────────────
// Math.random semé : le test est déterministe, jamais « rouge une fois sur mille ».
function withSeed(seed, f) {
  const orig = Math.random;
  let a = seed >>> 0;
  Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try { return f(); } finally { Math.random = orig; }
}
console.log('\n── 1. shuffleOpts ──');
withSeed(20260918, function () {
  [2, 3, 4].forEach(function (n) {
    const opts = ['w', 'x', 'y', 'z'].slice(0, n);
    for (let c = 0; c < n; c++) {
      const before = opts.join('|'), hits = new Array(n).fill(0), N = 4000;
      let tracked = true, same = true, fresh = true;
      for (let k = 0; k < N; k++) {
        const s = shuffleOpts(opts, c);
        if (s.opts[s.c] !== opts[c]) tracked = false;
        if (s.opts.slice().sort().join('|') !== before) same = false;
        if (s.opts === opts) fresh = false;
        hits[s.c]++;
      }
      const L = n + ' options, bonne réponse en ' + 'ABCD'[c];
      ok(tracked, L + ' : la bonne réponse suit la permutation');
      ok(same, L + ' : mêmes options, ni perdues ni dédoublées');
      ok(fresh && opts.join('|') === before, L + ' : tableau neuf, la banque n\'est pas modifiée');
      ok(hits.every((h) => Math.abs(h / N - 1 / n) < 0.03), L + ' : chaque position sort (' + hits.map((h) => Math.round(100 * h / N) + '%').join(' / ') + ')');
    }
  });
});
// Sur les vraies banques : clés présentes, bonne réponse retrouvée après permutation.
MODULES.forEach(function (m) {
  const bank = BANKS[m.bank];
  ok(Array.isArray(bank) && bank.length > 0, m.bank + ' : banque importable');
  let bad = [];
  withSeed(7, function () {
    (bank || []).forEach(function (it) {
      const opts = it[m.ok], c = it[m.ck];
      if (!Array.isArray(opts) || !(c >= 0 && c < opts.length)) { bad.push(itemKey(it) + ' (clés ' + m.ok + '/' + m.ck + ')'); return; }
      const s = shuffleOpts(opts, c);
      if (s.opts[s.c] !== opts[c]) bad.push(itemKey(it));
    });
  });
  ok(bad.length === 0, m.bank + ' : chaque item a ' + m.ok + '[' + m.ck + '] et la retrouve après permutation' + (bad.length ? ' — ' + bad.slice(0, 5).join(', ') : ''));
});

// ── 2. Câblage dans les modules (lecture du source : rien d'autre ne le relie) ─────────────────
console.log('\n── 2. Modules ──');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function bodyOf(src, fn) {
  const at = src.indexOf('export function ' + fn + '(');
  if (at < 0) return null;
  const end = src.indexOf('\nexport function ', at + 10);
  return src.slice(at, end < 0 ? src.length : end);
}
// Le texte qui permute : la ligne qui cite la banque et la suivante (le Gauntlet construit son
// deck sur deux lignes), ou le helper du fichier appelé par `.map(helper)` sur ces lignes.
function permutationText(src, body, bank) {
  const re = new RegExp('\\b' + esc(bank) + '\\b', 'g');
  let m;
  while ((m = re.exec(body))) {
    const lineStart = body.lastIndexOf('\n', m.index) + 1;
    const n1 = body.indexOf('\n', m.index), n2 = n1 < 0 ? -1 : body.indexOf('\n', n1 + 1);
    const win = body.slice(lineStart, n2 < 0 ? body.length : n2);
    if (win.indexOf('shuffleOpts(') >= 0) return win;
    const h = win.match(/\.map\((\w+)\)/);
    if (h) {
      const def = src.match(new RegExp('function ' + h[1] + '\\([^)]*\\)\\{[^\\n]*'));
      if (def && def[0].indexOf('shuffleOpts(') >= 0) return def[0];
    }
  }
  return null;
}
const sources = {};
MODULES.forEach(function (m) {
  const src = sources[m.file] || (sources[m.file] = fs.readFileSync(path.join(SRC, ...m.file.split('/')), 'utf8'));
  const L = m.fn + ' (' + m.file.split('/').pop() + ')';
  const body = bodyOf(src, m.fn);
  ok(!!body, L + ' : composant introuvable (renommé ? mettre MODULES à jour)');
  if (!body) return;
  ok(new RegExp('\\b' + esc(m.bank) + '\\b').test(body), L + ' : construit son deck depuis ' + m.bank);
  const txt = permutationText(src, body, m.bank);
  ok(!!txt, L + ' : le deck construit depuis ' + m.bank + ' passe par shuffleOpts');
  if (!txt) return;
  const call = txt.match(/(\w+)=shuffleOpts\(\s*(\w+)\.(\w+)\s*,\s*\2\.(\w+)\s*\)/);
  ok(!!call && call[3] === m.ok && call[4] === m.ck, L + ' : shuffleOpts reçoit ' + m.ok + ' et ' + m.ck + ' de l\'item' + (call ? ' (reçoit ' + call[3] + ', ' + call[4] + ')' : ''));
  if (call) {
    const s = esc(call[1]);
    ok(new RegExp('\\{\\s*' + m.ok + '\\s*:\\s*' + s + '\\.opts\\s*,\\s*' + m.ck + '\\s*:\\s*' + s + '\\.c\\s*\\}').test(txt),
      L + ' : la permutation est rangée sous {' + m.ok + ', ' + m.ck + '}, les clés que le module lit');
  }
  ok(new RegExp('\\.' + m.ok + '\\.map\\(function').test(body), L + ' : les options sont rendues depuis .' + m.ok);
  ok(new RegExp('===\\s*[\\w.\\[\\]]*\\.' + m.ck + '\\b').test(body), L + ' : la bonne réponse est lue dans .' + m.ck);
});
// GerInf garde le composant monté entre deux parties : « Play again » passe par resetQuiz, qui
// doit retirer le deck (sinon même ordre et mêmes positions à chaque partie).
const gerinf = bodyOf(sources['features/train/grammar.jsx'], 'GerInf') || '';
ok(/function resetQuiz\(\)\{[^\n]*setQuizItems\(buildQuiz\(\)\)/.test(gerinf), 'GerInf : resetQuiz retire un deck neuf (Play again)');

// ── 2b. Banque de grammaire et examens (lib/optionShuffle.js, 2026-09-18) ────────────────────────
// Grammaire en B 61 % (D 4 %), Part 6 des Mock Tests en A 7 fois sur 8, Parts 3-4 du Boss jamais en A.
console.log('\n── 2b. Grammaire et examens ──');
const OS = require(path.join(SRC, 'lib', 'optionShuffle.js'));
const { seedFromId } = require(path.join(SRC, 'lib', 'listeningShuffle.js'));
const GR = require(path.join(SRC, 'data', 'grammar.js'));
const MK = require(path.join(SRC, 'data', 'mockTests.js'));
const BS = require(path.join(SRC, 'data', 'bossTestFull.js'));
const P6 = require(path.join(SRC, 'data', 'part6.js'));
const P7 = require(path.join(SRC, 'data', 'part7.js'));
// Chaque forme : où sont les options d'une question, pour vérifier que la bonne réponse suit.
const SHAPES = {
  p5: { fn: OS.shufP5, qs: (x) => [{ opts: x.o, c: x.c }] },
  p6: { fn: OS.shufP6, qs: (x) => x.parts.filter((p) => p.blank).map((p) => ({ opts: p.options, c: p.correct })) },
  p7: { fn: OS.shufP7, qs: (x) => x.questions.map((q) => ({ opts: q.options, c: q.correct })) },
  qs: { fn: OS.shufQs, qs: (x) => x.qs.map((q) => ({ opts: q.opts, c: q.c })) },
};
const EXAM = [
  // Part 6 et Part 7 d'entraînement : leurs modules permutent déjà ; la chasse les repose permutées aussi.
  ['QUESTIONS', GR.QUESTIONS, 'p5'], ['PART6_TEXTS', P6.PART6_TEXTS, 'p6'], ['PART7_PASSAGES', P7.PART7_PASSAGES, 'p7'], ['MOCK1_P5', MK.MOCK1_P5, 'p5'], ['MOCK1_P6', MK.MOCK1_P6, 'p6'], ['MOCK1_P7', MK.MOCK1_P7, 'p7'],
  ['MOCK2_P5', MK.MOCK2_P5, 'p5'], ['MOCK2_P6', MK.MOCK2_P6, 'p6'], ['MOCK2_P7', MK.MOCK2_P7, 'p7'],
  ['MOCK3_P5', MK.MOCK3_P5, 'p5'], ['MOCK3_P6', MK.MOCK3_P6, 'p6'], ['MOCK3_P7', MK.MOCK3_P7, 'p7'],
  ['BOSS_P3', BS.BOSS_P3, 'qs'], ['BOSS_P4', BS.BOSS_P4, 'qs'], ['BOSS_P5', BS.BOSS_P5, 'p5'], ['BOSS_P6', BS.BOSS_P6, 'p6'], ['BOSS_P7', BS.BOSS_P7, 'p7'],
];
EXAM.forEach(function ([name, bank, shape]) {
  const S = SHAPES[shape], before = JSON.stringify(bank), bad = [], hits = [0, 0, 0, 0];
  withSeed(11, function () {
    [undefined, seedFromId].forEach(function (seed) {
      bank.forEach(function (it) {
        const out = S.fn(it, seed), a = S.qs(it), b = S.qs(out);
        a.forEach(function (q, i) {
          const r = b[i];
          if (!r || r.opts[r.c] !== q.opts[q.c] || r.opts.slice().sort().join('|') !== q.opts.slice().sort().join('|')) bad.push(it.id + '#' + i);
          if (r && !seed) hits[r.c]++;
        });
      });
    });
  });
  ok(bad.length === 0, name + ' : chaque question garde ses options et sa bonne réponse après permutation' + (bad.length ? ' — ' + bad.slice(0, 5).join(', ') : ''));
  ok(JSON.stringify(bank) === before, name + ' : la banque n\'est pas modifiée');
  if (bank.length >= 30) ok(hits.every((h, i) => i > 3 || h > 0), name + ' : toutes les positions sortent (' + hits.join('/') + ')');
});
// `.map(shufP5)` : l'index que map passe en second ne doit pas être pris pour une graine.
withSeed(3, function () {
  let threw = null;
  try { GR.QUESTIONS.slice(0, 5).map(OS.shufP5); } catch (e) { threw = e.message; }
  ok(!threw, '.map(shufP5) ignore l\'index passé par map' + (threw ? ' (' + threw + ')' : ''));
});
// Boss : tirage FIGÉ (la reprise relit des réponses rangées par index) et réparti. Le pas de
// seededShuffleOpts a été choisi pour ça ; le changer sans bumper BOSS_LAYOUT_V désaligne les reprises.
[['BOSS_P3', BS.BOSS_P3, 'qs'], ['BOSS_P4', BS.BOSS_P4, 'qs'], ['BOSS_P5', BS.BOSS_P5, 'p5'], ['BOSS_P6', BS.BOSS_P6, 'p6'], ['BOSS_P7', BS.BOSS_P7, 'p7']].forEach(function ([name, bank, shape]) {
  const S = SHAPES[shape];
  const once = JSON.stringify(bank.map((it) => S.fn(it, seedFromId))), twice = JSON.stringify(bank.map((it) => S.fn(it, seedFromId)));
  ok(once === twice, name + ' : même disposition à chaque ouverture (reprise de session)');
  const pos = [0, 0, 0, 0];
  bank.forEach((it) => S.qs(S.fn(it, seedFromId)).forEach((q) => pos[q.c]++));
  const n = pos.reduce((a, b) => a + b, 0);
  ok(pos.every((p) => Math.abs(p / n - 0.25) <= 0.10), name + ' : bonne réponse répartie à ±10 points de 25 % (' + pos.join('/') + ')');
});
// Câblage : chaque écran construit son deck à travers le helper, et le Boss ne lit plus ses banques brutes.
const WIRED = [
  ['features/train/grammar.jsx', 'Drill', /c\.items=c\.items\.map\(function\(it\)\{return Object\.assign\(\{\},it,\{q:shufP5\(it\.q\)\}\);\}\)/],
  ['features/home/Daily.jsx', 'Daily', /dailyQs\(today\(\),p\.u\)\.map\(shufP5\)/],
  ['features/train/reading.jsx', 'TimeSim', /shuffle\(QUESTIONS\)\.slice\(0,30\)\.map\(shufP5\)/],
  ['features/games/WordFall.jsx', 'WordFall', /shuffle\(QUESTIONS\)\.map\(shufP5\)/],
  ['features/exams/MockTest.jsx', 'MockTest', /\{p5:data\.p5\.map\(shufP5\),p6:data\.p6\.map\(shufP6\),p7:data\.p7\.map\(shufP7\)\}/],
];
WIRED.forEach(function ([file, fn, re]) {
  const src = sources[file] || (sources[file] = fs.readFileSync(path.join(SRC, ...file.split('/')), 'utf8'));
  const body = bodyOf(src, fn);
  ok(!!body && re.test(body), fn + ' (' + file.split('/').pop() + ') : le deck passe par lib/optionShuffle.js');
});
const mock = bodyOf(fs.readFileSync(path.join(SRC, 'features', 'exams', 'MockTest.jsx'), 'utf8'), 'MockTest') || '';
ok(!/=\s*data\.p[567]\s*;/.test(mock), 'MockTest : aucune partie lue brute dans la banque');
const boss = fs.readFileSync(path.join(SRC, 'features', 'exams', 'BossTest.jsx'), 'utf8');
['P3', 'P4', 'P5', 'P6', 'P7'].forEach(function (pt) {
  ok(new RegExp('BOSS_' + pt + '_SHUF=BOSS_' + pt + '\\.map\\(function\\(\\w+\\)\\{return shuf\\w+\\(\\w+,seedFromId\\);\\}\\)').test(boss), 'BossTest : Part ' + pt.slice(1) + ' permutée, tirage figé par identifiant');
  ok(!new RegExp('=BOSS_' + pt + '[,;]').test(boss), 'BossTest : la Part ' + pt.slice(1) + ' n\'est plus lue brute');
});

// ── 3. Aucun texte ne désigne une option par sa position ────────────────────────────────────────
console.log('\n── 3. Textes des banques ──');
// B, C, D isolés (ni lettre accentuée, ni chiffre, ni « R&D » autour) ; A seulement quand c'est
// une étiquette, selon la règle partagée avec le listening (A_IS_OPT_LABEL, lib/listeningShuffle.js).
const LETTER = /(^|[^\p{L}\p{N}'&])([A-D])(?![\p{L}\p{N}'&])/gu;
const POSITIONAL = /\b(?:all|none|both|neither) of the above\b|\bof the above\b/i;
// Clé : BANQUE:item:champ → les seules lettres permises dans ce champ, et pourquoi. Une autre
// lettre (« Both A and C » ajouté aux options de sq2) rougit ; une exception qui ne sert plus aussi.
const ALLOWED = {
  'CLUE_HUNTER:ch42:opts': ['A', 'l\'option EST l\'article A (A / An)'],
  'CLUE_HUNTER:ch44:opts': ['A', 'l\'option EST l\'article A (A / An)'],
  'AUDIO_BLITZ:ab_01:opts': ['A', 'Conference Room A, nom de salle entendu dans l\'audio'],
  'FALSE_FRIENDS:patron:opts': ['A', 'article (A boss)'],
  'FALSE_FRIENDS:hazard:opts': ['A', 'article (A guess)'],
  'FALSE_FRIENDS:affair:opts': ['A', 'article (A business deal)'],
  'TOEIC_TRAPS:9:options': ['BC', 'Fill in B or C : feuille de réponse TOEIC, pas une option du quiz'],
  'STRAT_QUIZ:sq2:scenario': ['B', 'Answer B : réponse d\'une question TOEIC imaginée'],
  'STRAT_QUIZ:sq2:options': ['B', 'B is probably… : la même réponse imaginée'],
  'STRAT_QUIZ:sq4:options': ['BC', 'guess B or C : feuille de réponse TOEIC'],
  'STRAT_QUIZ:sq5:options': ['BC', 'Fill in B or C : feuille de réponse TOEIC'],
  'STRAT_QUIZ:sq5:explain': ['BC', 'Random B/C : feuille de réponse TOEIC'],
  'STRAT_QUIZ:sq36:scenario': ['AB', 'Sentence A / Sentence B : phrases d\'un texte Part 6'],
  // Explications des banques de grammaire et d'examen (section 3b) : des noms, pas des options.
  'QUESTIONS:g438:x': ['B', 'formule « Not only A but also B »'],
  'PART7_PASSAGES:p7p19:x': ['B', 'Line B, chaîne de montage du passage'],
  'PART7_PASSAGES:p7p26:x': ['C', 'Building C, immeuble du passage'],
  'PART7_PASSAGES:p7p42:x': ['B', 'Entrance B, entrée du passage'],
  'PART7_PASSAGES:p7p54:x': ['C', 'Lot C, parking du passage'],
  'PART7_PASSAGES:p7p62:x': ['ACD', 'Workshop A, C, D : ateliers du programme'],
  'MOCK1_P7:m1p7_1:x': ['B', 'Conference Hall B'],
  'MOCK1_P7:m1p7_4:x': ['AC', 'Building A, Lot C'],
  'MOCK2_P7:m2p7_5:x': ['D', 'Vitamin D'],
  'BOSS_P7:bp7_4:x': ['C', 'Series C (levée de fonds)'],
};
function strings(v, out) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => strings(v[k], out));
  return out;
}
const used = {};
let scanned = 0;
Object.keys(BANKS).forEach(function (bank) {
  (BANKS[bank] || []).forEach(function (it) {
    Object.keys(it).forEach(function (field) {
      strings(it[field], []).forEach(function (s) {
        scanned++;
        const hits = [];
        s.replace(LETTER, function (m, pre, L, off, str) {
          if (L !== 'A' || A_IS_OPT_LABEL.test(str.slice(off + m.length))) hits.push(L);
          return m;
        });
        if (POSITIONAL.test(s)) hits.push('of the above');
        if (!hits.length) return;
        const key = bank + ':' + itemKey(it) + ':' + field;
        if (ALLOWED[key] && hits.every((h) => h.length === 1 && ALLOWED[key][0].indexOf(h) >= 0)) { used[key] = true; return; }
        ok(false, key + ' désigne une option par sa position (' + hits.join(', ') + ') : « ' + (s.length > 90 ? s.slice(0, 90) + '…' : s) + ' ». Les options sont permutées : citer l\'option elle-même.');
      });
    });
  });
});
// 3b. Banques de grammaire et d'examen : les EXPLICATIONS seulement (leurs textes et leurs options nomment
// des salles, des lots, des usines — « Lot C » — sans rien désigner). Les options y sont permutées depuis
// le 2026-09-18 (section 2b) : une explication qui dirait « B is wrong » désignerait n'importe quoi.
function explanations(it) {
  const out = [];
  if (typeof it.x === 'string') out.push(it.x);
  (it.parts || []).forEach((p) => { if (p.blank && p.x) out.push(p.x); });
  (it.questions || []).concat(it.qs || []).forEach((q) => { if (q.x) out.push(q.x); });
  return out;
}
EXAM.forEach(function ([bank, items]) {
  items.forEach(function (it) {
    const key = bank + ':' + it.id + ':x';
    explanations(it).forEach(function (s) {
      scanned++;
      const hits = [];
      s.replace(LETTER, function (m, pre, L, off, str) {
        if (L !== 'A' || A_IS_OPT_LABEL.test(str.slice(off + m.length))) hits.push(L);
        return m;
      });
      if (POSITIONAL.test(s)) hits.push('of the above');
      if (!hits.length) return;
      if (ALLOWED[key] && hits.every((h) => h.length === 1 && ALLOWED[key][0].indexOf(h) >= 0)) { used[key] = true; return; }
      ok(false, key + ' désigne une option par sa position (' + hits.join(', ') + ') : « ' + (s.length > 90 ? s.slice(0, 90) + '…' : s) + ' ». Les options sont permutées : citer l\'option elle-même.');
    });
  });
});
Object.keys(ALLOWED).forEach((k) => ok(used[k], 'exception ' + k + ' orpheline (texte réécrit ?) : la retirer d\'ALLOWED'));

console.log('\n' + checks + ' vérifications, ' + scanned + ' textes lus dans ' + (Object.keys(BANKS).length + EXAM.length) + ' banques');
if (fails) { console.log(fails + ' échec(s)'); process.exit(1); }
console.log('  ok');
