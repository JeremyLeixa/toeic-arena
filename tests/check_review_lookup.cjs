/* Références du bestiaire des modules hors banque de grammaire (lib/reviewRefs.js + lib/reviewLookup.js,
 * 2026-09-18).
 *
 * POURQUOI CE TEST EXISTE. Seize modules (Gauntlet, Clue Hunter, Audio Blitz, Word Tavern, Mimic Hunt,
 * Modal Council, mini-modules de Grammar & Vocab, Traps, Strategy) posent une `ref` à chaque erreur, et
 * la chasse la repose. Tout ce qui peut dériver le fait EN SILENCE :
 *   1. une clé que le module construit et que la résolution ne sait pas relire : la créature est sautée
 *      par la chasse (lookupRef → null), elle reste « due » pour toujours dans le Lair ;
 *   2. une résolution dont la bonne réponse n'est plus celle de la banque (option décalée, distracteur
 *      égal à la réponse, énoncé qui la dévoile) ;
 *   3. une catégorie différente à la capture et à la résolution : la créature est rangée sous un nom et
 *      la fiche de grammaire cherchée sous un autre ; une clé à sous-partie SANS catégorie est rangée
 *      comme un passage Part 3/4 (review.js groupKey « doc: ») ;
 *   4. des options rendues dans l'ordre de la banque : ces banques placent la bonne réponse en B ou C
 *      huit fois sur dix, la chasse réapprendrait « c'était B » ;
 *   5. un module dont le câblage saute (la `ref` ou le passage de mistakesRef.current à p.done) : plus
 *      rien n'entre au bestiaire, sans erreur nulle part.
 *
 * Prouvé mordant le 2026-09-18, 25 mutations sur 25 rouges : catégorie « Tense » au lieu de « Tenses »,
 * catégorie de Tavern retirée, une règle de clueCat retirée, libellé du Clue ignoré à la résolution, clé
 * « :null » sans sous-partie, permutation retirée, distracteur égal à la réponse, type Tavern ignoré, trou
 * du Tavern non posé, paire du Modal Council ignorée, mauvais index du Linking Bridge, fichier Audio Blitz
 * faux, libellé fin du Clue affiché, prétérit et participe inversés, item Clue ch04 sans trou, Tavern hors
 * « vocabulary », et chaque maillon du câblage retiré (hub, p.done, ref, Word Fall, routes, gameSession).
 *
 * Usage : node tests/check_review_lookup.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = (...p) => path.join(ROOT, 'src', ...p);
const { lookupRef } = require(src('lib', 'reviewLookup.js'));
const { moduleRef, clueCat } = require(src('lib', 'reviewRefs.js'));
const { groupKey, refParts, recordMisses, newReview } = require(src('lib', 'review.js'));
const { huntSide } = require(src('lib', 'mentorVoice.js'));
const { QUESTIONS, WORD_FAMILIES } = require(src('data', 'grammar.js'));
const G = require(src('data', 'grammarGauntlet.js'));
const { CLUE_HUNTER } = require(src('data', 'clueHunter.js'));
const { AUDIO_BLITZ } = require(src('data', 'audioBlitz.js'));
const { VOCAB } = require(src('data', 'vocab.js'));
const { MIMIC_ITEMS } = require(src('data', 'mimicHunt.js'));
const { MODAL_MATCH_BOARDS, MODAL_SORT_ITEMS } = require(src('data', 'modals.js'));
const MG = require(src('data', 'miniGames.js'));
const { LINKING_BRIDGE } = require(src('data', 'linkingBridge.js'));
const { PHRASAL_VERBS } = require(src('data', 'phrasalVerbs.js'));
const { PART6_TEXTS: P6T } = require(src('data', 'part6.js'));
const { PART7_PASSAGES: P7P } = require(src('data', 'part7.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; if (fails <= 40) console.log('  FAIL ' + m); };
const ok = (cond, m) => { checks++; if (!cond) fail(m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const QCATS = new Set(QUESTIONS.map((q) => q.cat));

// ── 1-3. Chaque item de chaque banque : la clé du module se relit, avec la bonne réponse ─────────
// `answer` : le texte que le module compte juste. `sameOrder` : grille de catégories rendue dans
// l'ordre du module (pas de permutation attendue).
const cases = [];
const add = (mod, id, sub, label, answer, extra) => cases.push(Object.assign({ mod, id, sub, label, answer }, extra || {}));
G.IRREGULAR_VERBS.forEach((v) => add('gauntlet', v.id, null, null, v.past + ' · ' + v.pp));
[G.TENSE_CHRONOMANCER, G.PASSIVE_FORGE, G.RELATIVE_WEAVER].forEach((arr) => arr.forEach((q) => add('gauntlet', q.id, null, null, q.o[q.c])));
CLUE_HUNTER.forEach((it) => add('clue', it.id, null, it.cat, it.opts[it.ans]));
AUDIO_BLITZ.forEach((it) => add('ablitz', it.id, null, null, it.opts[it.c], { audio: it.audio }));
VOCAB.forEach((d) => d.cards.forEach((c) => {
  add('tavern', c.id, 'defToWord', null, c.w);
  add('tavern', c.id, 'wordToDef', null, c.d);
  add('tavern', c.id, 'fillBlank', null, c.w);
}));
MIMIC_ITEMS.forEach((it) => add('mimic', it.id, null, null, it.opts[it.c]));
MODAL_MATCH_BOARDS.forEach((b) => b.pairs.forEach((pr, i) => add('modals_match', b.id, i, null, pr.modal)));
MODAL_SORT_ITEMS.forEach((it) => add('modals_sort', it.id, null, null, it.bucket.charAt(0).toUpperCase() + it.bucket.slice(1), { sameOrder: true }));
// Word Families : le module ne pose une `ref` que pour les mots à une seule nature.
WORD_FAMILIES.forEach((f) => [['v', 'Verb'], ['n', 'Noun'], ['adj', 'Adjective'], ['adv', 'Adverb']].forEach(([key, pos]) => {
  if (f[key]) add('wordfam', f[key], pos, null, pos, { sameOrder: true });
}));
MG.CONNECTORS.forEach((it) => { const r = MG.CONNECTOR_RULES.find((x) => x.id === it.rule); add('connsort', it.word, null, null, r ? r.label + ' (' + r.desc + ')' : '?', { sameOrder: true }); });
LINKING_BRIDGE.forEach((it) => add('bforge', it.id, null, null, (it.opts.find((o) => o.correct) || {}).w));
MG.PREP_COLLOCATIONS.forEach((it) => add('prepdrill', it.base, null, null, it.prep));
MG.GERUND_INF.forEach((it) => add('gerinf', it.verb, null, null, it.opts[it.c]));
MG.TOEIC_TRAPS.forEach((it) => add('traps', it.id, null, null, it.options[it.correct]));
MG.STRAT_QUIZ.forEach((it) => add('stratquiz', it.id, null, null, it.options[it.correct]));
MG.FALSE_FRIENDS.forEach((it) => add('falsefr', it.en, null, null, it.opts[it.correct]));
PHRASAL_VERBS.forEach((it) => { add('pvdojo', it.pv, 'match', null, it.m); add('pvdojo', it.pv, 'picker', null, it.p); });

const seenKeys = new Set();
cases.forEach((cs) => {
  const ref = moduleRef(cs.mod, cs.id, cs.sub, cs.label);
  const L = cs.mod + ' ' + ref.k;
  const r = refParts(ref.k);
  ok(String(r.id) === String(cs.id) && r.mod === cs.mod, L + ' : la clé se relit (aucun « : » dans l\'identifiant)');
  ok(!seenKeys.has(ref.k), L + ' : clé unique dans sa banque');
  seenKeys.add(ref.k);
  ok(!!ref.cat, L + ' : une catégorie à la capture');
  ok(groupKey(ref).indexOf('cat:') === 0, L + ' : rangée par catégorie dans le Lair, jamais comme un support');
  const q = lookupRef(ref.k);
  if (!q) { ok(false, L + ' : la chasse sait la reposer'); return; }
  ok(q.cat === ref.cat, L + ' : même catégorie à la capture (' + ref.cat + ') et à la résolution (' + q.cat + ')');
  ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5, L + ' : 2 à 5 options');
  ok(q.options.every((o) => typeof o === 'string' && o.trim()), L + ' : options non vides');
  ok(new Set(q.options).size === q.options.length, L + ' : options distinctes');
  ok(q.c >= 0 && q.c < q.options.length && q.options[q.c] === cs.answer, L + ' : la bonne réponse est celle du module (' + cs.answer + ')');
  ok(typeof q.prompt === 'string' && q.prompt.trim(), L + ' : un énoncé');
  // En mot entier : « in » est dans « interested » sans rien trahir.
  const says = new RegExp('(^|[^a-z])' + cs.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])', 'i').test(q.prompt);
  // Les grilles de catégories nomment leurs cases dans la question (« a noun, a verb… »).
  ok(!says || cs.sameOrder, L + ' : l\'énoncé ne dit pas la réponse');
  if (cs.audio) eq(L + ' : le fichier joué par la chasse est celui du module', '/audio/' + q.audio.kind + '/' + q.audio.id + '.mp3', cs.audio);
});
eq('Tavern : le trou est posé quand le mot est dans l\'exemple', lookupRef('tavern:' + VOCAB[0].cards[0].id + ':fillBlank').prompt.indexOf('_____') >= 0,
  new RegExp('\\b' + VOCAB[0].cards[0].w + '\\b', 'i').test(VOCAB[0].cards[0].e));
eq('Clue Hunter : le libellé fin (qui dirait la réponse) n\'est pas affiché', lookupRef('clue:' + CLUE_HUNTER[0].id).label, 'Clue Hunter');

// Catégories de Part 5 : celles de la banque de grammaire, sauf deux qui n'y existent pas.
cases.filter((cs) => moduleRef(cs.mod, cs.id, cs.sub, cs.label).part === 'p5').forEach((cs) => {
  const cat = moduleRef(cs.mod, cs.id, cs.sub, cs.label).cat;
  ok(QCATS.has(cat) || cat === 'Irregular verbs' || cat === 'Modals', cs.mod + ':' + cs.id + ' : « ' + cat + ' » est une catégorie de la banque de grammaire');
});
CLUE_HUNTER.forEach((it) => ok(QCATS.has(clueCat(it.cat)), 'Clue Hunter « ' + it.cat + ' » → ' + clueCat(it.cat) + ' : catégorie de la banque de grammaire'));
eq('Gauntlet : chaque épreuve dans sa catégorie', ['irr01', 'td01', 'pf01', 'rw01'].map((id) => moduleRef('gauntlet', id).cat), ['Irregular verbs', 'Tenses', 'Passive Voice', 'Relative Pronouns']);

// Contenu supprimé ou clé inconnue : null, la chasse saute la créature sans planter.
['gauntlet:irr999', 'gauntlet:zz01', 'clue:nope', 'tavern:nope:fillBlank', 'modals_match:' + MODAL_MATCH_BOARDS[0].id + ':9',
  'wordfam:success:Verb', 'wordfam:success:Pronoun', 'pvdojo:nope:match', 'traps:9999', 'unknownmod:x'].forEach((k) => eq('inconnue → null : ' + k, lookupRef(k), null));

// ── 4. Options permutées à chaque résolution (sauf les grilles de catégories) ─────────────────────
const spread = (k) => { const s = new Set(); for (let i = 0; i < 40; i++) s.add(lookupRef(k).c); return s.size; };
['gauntlet:td01', 'clue:' + CLUE_HUNTER[0].id, 'ablitz:' + AUDIO_BLITZ[0].id, 'traps:' + MG.TOEIC_TRAPS[0].id, 'stratquiz:' + MG.STRAT_QUIZ[0].id,
  'falsefr:' + MG.FALSE_FRIENDS[0].en, 'bforge:' + LINKING_BRIDGE[0].id, 'mimic:' + MIMIC_ITEMS[0].id, 'gauntlet:irr01', 'tavern:' + VOCAB[0].cards[0].id + ':defToWord',
  // Grammaire, Part 6 et Part 7 aussi (la grammaire met la bonne réponse en B 61 % du temps).
  'drill:' + QUESTIONS[0].id, 'p6:' + P6T[0].id + ':0', 'p7:' + P7P[0].id + ':0']
  .forEach((k) => ok(spread(k) > 1, k + ' : la bonne réponse change de place d\'une chasse à l\'autre'));
eq('Word Families : la grille garde l\'ordre du module', lookupRef('wordfam:success:Noun').options, ['Noun', 'Verb', 'Adjective', 'Adverb']);

// ── Le Lair : groupes distincts, extraits coupés aux mots ─────────────────────────────────────────
// Deux textes du même type s'affichaient sous le même nom (« Part 6 · Article » deux fois).
const { groupLabel, aroundBlank } = require(src('lib', 'reviewLookup.js'));
const LI = require(src('data', 'listening.js'));
[['p6', P6T], ['p7', P7P], ['lisP3', LI.LISTENING_P3], ['lisP4', LI.LISTENING_P4]].forEach(([mod, docs]) => {
  const labels = docs.map((d) => groupLabel({ key: 'doc:' + mod + ':' + d.id, items: [{ k: mod + ':' + d.id + ':0' }] }));
  const dup = labels.filter((l, i) => labels.indexOf(l) !== i);
  ok(dup.length === 0, 'Lair ' + mod + ' : chaque document a son propre nom de groupe' + (dup.length ? ' — en double : ' + dup.slice(0, 3).join(' | ') : ''));
  ok(labels.every((l) => l.length <= 72), 'Lair ' + mod + ' : noms de groupe courts (72 caractères au plus)');
});
// Extrait autour du trou (ligne d'une créature Part 6) : jamais un mot coupé à l'entrée ni à la sortie.
let cut = [];
P6T.forEach((t) => t.parts.filter((p) => p.blank).forEach((b, qi) => {
  const q = lookupRef('p6:' + t.id + ':' + qi), txt = q.passage.text.replace(/\s+/g, ' ');
  const title = q.title, core = title.replace(/^…/, '').replace(/…$/, '');
  const at = txt.indexOf(core);
  if (at < 0) { cut.push(t.id + ':' + qi + ' (extrait introuvable)'); return; }
  if (/^…/.test(title) && /[A-Za-z0-9]/.test(txt[at - 1] || '')) cut.push(t.id + ':' + qi + ' début « ' + core.slice(0, 12) + ' »');
  if (/…$/.test(title) && /[A-Za-z0-9]/.test(txt[at + core.length] || '')) cut.push(t.id + ':' + qi + ' fin « ' + core.slice(-12) + ' »');
}));
ok(cut.length === 0, 'Lair : les extraits Part 6 commencent et finissent sur un mot entier' + (cut.length ? ' — ' + cut.slice(0, 4).join(', ') : ''));
eq('aroundBlank : texte court, ni coupe ni points de suspension', aroundBlank('We _____ you.'), 'We _____ you.');

// ── Briefing de la chasse : le côté du test ────────────────────────────────────────────────────
eq('côtés du test', ['drill:g1', 'gauntlet:td01', 'mimic:mh01', 'ablitz:ab_01', 'lisP3:x:0', 'tavern:f1:fillBlank', 'traps:3', 'p7:x:1'].map(huntSide),
  ['grammar', 'grammar', 'reading', 'listening', 'listening', 'vocabulary', 'strategy', 'reading']);

// Une erreur sans `ref` (mot à deux natures, Mimic manqué) n'entre pas ; une `ref` à null non plus.
eq('recordMisses : ref absente ou null ignorée', recordMisses(newReview(), [{ tag: 'x' }, { tag: 'y', ref: null }, { ref: moduleRef('traps', 3) }], new Date('2026-09-18T10:00:00Z')).items.map((x) => x.k), ['traps:3']);

// ── 5. Câblage dans les modules (lecture du source : rien ne le relie à un test sinon) ───────────
const read = (...p) => fs.readFileSync(src(...p), 'utf8');
const wiring = [
  // Le Gauntlet compte 7 épreuves depuis le 2026-09-25 : Knotbinder, Anchor Hall, Twin Paths gardent les refs de
  // leurs modules d'origine (connsort, prepdrill, gerinf), que la chasse sait déjà relire.
  [['features', 'gauntlet', 'Gauntlet.jsx'], ['gauntlet', 'connsort', 'prepdrill', 'gerinf'], 7],
  [['features', 'modals', 'ModalCouncil.jsx'], ['modals_match', 'modals_sort'], 2],
  [['features', 'train', 'grammar.jsx'], ['wordfam', 'bforge', 'traps', 'pvdojo', 'falsefr'], 0],
  [['features', 'train', 'strategy.jsx'], ['stratquiz'], 1],
  [['features', 'games', 'ClueHunter.jsx'], ['clue'], 1],
  [['features', 'games', 'AudioBlitz.jsx'], ['ablitz'], 1],
  [['features', 'games', 'WordTavern.jsx'], ['tavern'], 1],
  [['features', 'games', 'MimicHunt.jsx'], ['mimic'], 1],
];
wiring.forEach(([p, mods, n]) => {
  const s = read(...p), f = p[p.length - 1];
  mods.forEach((m) => ok(s.indexOf('moduleRef("' + m + '"') >= 0, f + ' : les erreurs de ' + m + ' portent une ref'));
  const dones = (s.match(/p\.done\([^;]*\)/g) || []);
  // Suivi au plus d'un objet posé sur la session (`extra` de miniSession : les morsures de Mimic Hunt).
  const passed = dones.filter((d) => /mistakesRef\.current(,\{[^()]*\})?\)$/.test(d)).length;
  if (n) ok(passed >= n, f + ' : mistakesRef.current passé à p.done (' + passed + '/' + n + ')');
});
// grammar.jsx : chaque module câblé passe sa liste (le Drill en passe une aussi, avec catStats).
const gram = read('features', 'train', 'grammar.jsx');
['WordFam', 'LinkingBridge', 'TrapsQuiz', 'PhrasalDojo', 'FalseFriends'].forEach((fn) => {
  const at = gram.indexOf('export function ' + fn + '(');
  const end = gram.indexOf('\nexport function ', at + 10);
  const body = gram.slice(at, end < 0 ? gram.length : end);
  ok(at >= 0 && /p\.done\([^;]*mistakesRef\.current\)/.test(body), 'grammar.jsx ' + fn + ' : mistakesRef.current passé à p.done');
});
ok(/pickIdx>=0\?\{k:"drill:"\+q\.id/.test(read('features', 'games', 'WordFall.jsx')), 'WordFall.jsx : une mauvaise réponse entre au bestiaire (drill:<id>), pas une phrase tombée');
ok(/mistakesRef\.current\);/.test(read('features', 'games', 'WordFall.jsx')), 'WordFall.jsx : mistakesRef.current passé à p.done');
['Gauntlet.jsx', 'ModalCouncil.jsx'].forEach((f) => {
  const s = read('features', f === 'Gauntlet.jsx' ? 'gauntlet' : 'modals', f);
  ok(/function subDone\(sc,tot,xp,mistakes\)/.test(s) && /onModuleDone\(subMode,sc,tot,xp,mistakes\)/.test(s), f + ' : le hub transmet la liste de l\'épreuve');
});
const routes = read('routes.jsx'), app = read('App.jsx');
// Les 3 épreuves du 2026-09-25 comptent sous leurs ids d'origine : les renommer en gauntlet_… remettrait à zéro
// historique, estimateur, échelons et refs (la chasse ne retrouverait plus les créatures déjà capturées).
const GT = require(src('lib', 'gauntletTrials.js'));
eq('Gauntlet : épreuves → modules (ids d\'origine gardés)', GT.GAUNTLET_MODS, ['gauntlet_irregular', 'gauntlet_tense', 'gauntlet_passive', 'gauntlet_relative', 'connsort', 'prepdrill', 'gerinf']);
ok(/if\(sp==="gauntlet"\)[^\n]*var fullModId=gauntletModId\(subId\);/.test(routes), 'routes.jsx gauntlet : le module vient de la table (gauntletModId), jamais du préfixe en dur');
ok(/id:"gauntlet"[^\n]*subs:GAUNTLET_MODS/.test(read('features', 'home', 'Train.jsx')), 'Train.jsx : la tuile Gauntlet agrège ses 7 épreuves');
['gauntlet', 'modals', 'clue', 'ablitz'].forEach((sp) => {
  const line = routes.split(/\r?\n/).find((l) => l.indexOf('if(sp==="' + sp + '")') >= 0) || '';
  ok(/recordMisses\(c\.review,mistakes,new Date\(\)\)/.test(line), 'routes.jsx ' + sp + ' : le handler envoie les erreurs au bestiaire');
});
['bforge', 'tavern', 'mimic'].forEach((sp) => {
  const line = routes.split(/\r?\n/).find((l) => l.indexOf('if(sp==="' + sp + '")') >= 0) || '';
  ok(/miniSession\(sc,tot,xp,mistakes(,extra)?\)/.test(line), 'routes.jsx ' + sp + ' : la route transmet la liste à miniSession');
});
ok(/if\(sp==="wfall"\).*gameSession\(mk,res,xp,mistakes\)/.test(routes), 'routes.jsx wfall : la route transmet la liste à gameSession');
ok(/function gameSession\(modeKey,result,xp,mistakes\)\{[\s\S]{0,700}?recordMisses\(c\.review,mistakes/.test(app), 'App.jsx gameSession : les erreurs entrent au bestiaire');

console.log(fails === 0 ? '  OK ' + checks + ' vérifications (' + cases.length + ' items)' : '  ' + fails + ' échec(s) sur ' + checks);
process.exit(fails === 0 ? 0 : 1);
