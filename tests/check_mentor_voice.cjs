/* La voix d'Aldric sur le plan du jour (lib/mentorVoice.js, lot 4 du Mentor, 2026-09-18).
 *
 * POURQUOI CE TEST EXISTE. Ces phrases disent à l'élève ce que l'appli a décidé pour lui ; si elles
 * s'écartent des règles, elles mentent sans rien casser au build :
 *   - le bandeau de Home compte les quêtes qui RESTENT du plan FIGÉ (u.mission), pas un plan recalculé
 *     (où une chasse finie disparaît sans être comptée faite) ;
 *   - « +15 XP » suit la quête qui porte la mission (u.mission.pick, déplacée par le jeton Daily Reroll),
 *     « +25 % » suit la quête d'enjeu — c'est celle que lib/xp.js paie (ctx.focusPart) ;
 *   - les repères de la carte (Path complet, Lair dû) ;
 *   - chaque icône nommée (quêtes, créatures, repaire, carte) existe dans GAME_ICON_PATHS : une icône
 *     inconnue s'affiche vide.
 *
 * Usage : node tests/check_mentor_voice.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const V = require(path.join(ROOT, 'src', 'lib', 'mentorVoice.js'));
const P = require(path.join(ROOT, 'src', 'lib', 'planner.js'));
const R = require(path.join(ROOT, 'src', 'lib', 'review.js'));
const L = require(path.join(ROOT, 'src', 'lib', 'learnerModel.js'));
const { GAME_ICON_PATHS } = require(path.join(ROOT, 'src', 'data', 'avatarIcons.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const NOW = new Date('2026-09-21T10:00:00Z'), TD = '2026-09-21';
const D = (s) => new Date(s + 'T10:00:00Z');
function mod(n, date, c, t) { const h = []; for (let i = 0; i < n; i++) h.push({ date, correct: c, total: t }); return { history: h, sessions: n, correct: n * c, total: n * t }; }
function due(n) { const rv = R.newReview(); for (let i = 0; i < n; i++) R.reviewMiss(rv, { k: 'drill:g' + (100 + i), cat: 'Connectors', part: 'p5' }, D('2026-09-19')); return rv; }
const base = {
  name: 'Léa', joinedAt: '2026-09-01', targetToeic: 785, targetDate: '2026-11-06', streak: 3, stats: { sessions: 12 },
  moduleScores: { p7: mod(4, '2026-09-20', 6, 10), lisP2: mod(2, '2026-09-10', 9, 10) }, review: due(5),
};
const withMission = (u, extra) => Object.assign({}, u, { mission: Object.assign(P.dayMission(u, NOW), extra || {}) });

// ── 1. Bandeau de Home ──────────────────────────────────────────────────────────────────────────
eq('pas de mission posée : pas de bandeau', V.homeStrip(base, NOW), null);
const u1 = withMission(base);
eq('le plan du jour, avec la dette', V.homeStrip(u1, NOW), { text: '5 mistakes due · 3 quests', tone: 'due', pending: true });
// La chasse faite (mission cochée) : la dette tombe, il reste deux quêtes.
const u2 = Object.assign({}, u1, { review: R.newReview(), dailyModSessions: { ['hunt_' + TD]: 1 }, mission: Object.assign({}, u1.mission, { done: true }) });
eq('mission faite : il en reste deux', V.homeStrip(u2, NOW), { text: '2 quests left', tone: 'plain', pending: false });
const u3 = Object.assign({}, u2, { dailyModSessions: { ['hunt_' + TD]: 1, ['p7_' + TD]: 1, ['lisP2_' + TD]: 2 } });
eq('tout fait : le dire', V.homeStrip(u3, NOW).text, "Today's path complete");
const allSteady = withMission({ name: 'X', joinedAt: '2026-09-01', stats: {}, moduleScores: { p7: mod(6, '2026-09-20', 10, 10), p5: mod(6, '2026-09-20', 10, 10), drill: mod(6, '2026-09-20', 10, 10) } });
eq('aucune quête : pas de fausse alerte', [V.homeStrip(allSteady, NOW).text, V.homeStrip(allSteady, NOW).pending], ['All steady today', false]);

// ── 2. Étiquettes des quêtes : +15 XP sur la mission, +25 % sur l'enjeu ─────────────────────────
const m = u1.mission, q = (i) => P.thawQuest(m.quests[i], u1, NOW);
eq('les quêtes', m.quests.map((x) => x.kind), ['hunt', 'stake', 'keep']);
eq('étiquettes, mission sur la chasse', [0, 1, 2].map((i) => V.questView(q(i), u1, i === m.pick).tag), ['+15 XP', '+25% XP', '11 days']);
const moved = P.rerollMission(m);
eq('étiquettes, mission déplacée sur l\'enjeu', [0, 1, 2].map((i) => V.questView(q(i), u1, i === moved.pick).tag), ['~5 min', '+15 XP · +25%', '11 days']);
eq('le +25 % affiché est celui que les portes XP paient', [q(1).part, P.stakePart(u1, NOW)], ['p7', 'p7']);

// ── 3. Repères de la carte ─────────────────────────────────────────────────────────────────────
const b1 = V.mapBadges(u1, NOW, 640);
eq('Path : trois quêtes, la mission attend', [b1.path.value, b1.path.tone], ['3 quests · +15 XP', 'active']);
eq('Lair : la dette', [b1.lair.value, b1.lair.tone], ['5 due', 'active']);
eq('Camp : l\'estimation', b1.camp.value, '640 TOEIC');
const b2 = V.mapBadges(u2, NOW, null);
eq('Path : mission faite, deux quêtes restent', [b2.path.value, b2.path.tone], ['Mission done ✓', 'done']);
eq('Path : tout le chemin fait', V.mapBadges(u3, NOW, null).path.value, 'Complete ✓');
eq('Lair vide, estimation absente', [b2.lair.value, b2.camp.value], ['Empty', '— TOEIC']);

// ── 3 bis. La narration de session (lot 5) ─────────────────────────────────────────────────────
// Briefing : sur le cumul (pas de série récente), Aldric dit « so far », jamais « your last N ».
const legacy = { name: 'Old', joinedAt: '2026-06-01', stats: { sessions: 30 },
  moduleScores: { drill: { sessions: 20, history: [{ date: '2026-09-19', correct: 7, total: 10 }], catStats: { Conditionals: { correct: 3, total: 12 } } } } };
const bl = V.briefing(P.drillComposition(legacy, NOW, () => 0.5), legacy, NOW);
eq('briefing sur le cumul', bl.lines[0], 'Conditionals are your weak spot: 3 of 12 so far. I\'ve put 4 in this drill.');
// Carte de fin du Drill : échéances vaincues / battues / échappées (repos si 3e échec), nouvelles, cible.
const comp5 = { focus: { cat: 'Tenses' }, macro: null, quest: {} };
const it = (k, box, fails) => ({ k, box, fails });
const res = [
  { role: 'due', ok: true, q: { id: 'g1', cat: 'Articles' }, item: it('drill:g1', 2, 1) },
  { role: 'due', ok: true, q: { id: 'g2', cat: 'Tenses' }, item: it('drill:g2', 0, 1) },
  { role: 'due', ok: false, q: { id: 'g3', cat: 'Tenses' }, item: it('drill:g3', 0, 2) },
  { role: 'focus', ok: true, q: { id: 'g4', cat: 'Tenses' } },
  { role: 'focus', ok: false, q: { id: 'g5', cat: 'Tenses' } },
  { role: 'mixed', ok: false, q: { id: 'g6', cat: 'Articles' } },
];
eq('Aldric remembers (Drill)', V.drillRemember(comp5, res).map((l) => l.text + ' | ' + (l.sub || '')), [
  '1 old mistake slain for good | Articles',
  '1 mistake beaten again | They\'ll be back, weaker.',
  '1 escaped | Back in 2 days: they need a rest.',
  '2 new mistakes for your bestiary | First return tomorrow.',
  'Tenses, today\'s aim: 1 of 2 | Your weak spot gets the most questions until it holds.',
]);
// Au 3e échec, Aldric ne promet la fiche de grammaire que si elle existe pour la catégorie.
const wyrm = { role: 'due', ok: false, item: it('drill:g9', 0, 2), cat: 'Pronouns' };
eq('3e échec : fiche promise seulement si elle existe', [V.questionFeedback(Object.assign({ hasSheet: true }, wyrm, { cat: 'Tenses' })).sheet, V.questionFeedback(wyrm).sheet, /sheet/.test(V.questionFeedback(wyrm).text)], [true, undefined, false]);

// ── 3 ter. La lettre, l'insight, la Chronique (lot 6) ─────────────────────────────────────────
const WED = new Date('2026-09-23T10:00:00Z');
const lettered = { name: 'Léa', joinedAt: '2026-08-20', targetToeic: 785, targetDate: '2026-11-06', stats: {},
  moduleScores: { p7: mod(1, '2026-09-08', 4, 10) } };
lettered.moduleScores.p7.history.push({ date: '2026-09-15', correct: 6, total: 10 }, { date: '2026-09-17', correct: 8, total: 10 }, { date: '2026-09-09', correct: 5, total: 10 });
const L6 = V.mondayLetter(lettered, WED, [{ d: '2026-09-07', toeic: 640 }, { d: '2026-09-14', toeic: 662 }]);
eq('lue un mercredi, la lettre est datée du lundi et raconte la semaine d\'avant', [L6.date, L6.paragraphs[0]], ['Monday, 21 Sept', 'Last week you trained 2 days out of 7: 2 sessions, 20 questions.']);
eq('… avec l\'allure vers l\'objectif, chiffrée', /To reach 785 by 6 Nov you need about 20 points a week; last week you made \+22\. You're on track\./.test(L6.paragraphs.join(' ')), true);
const quiet = V.mondayLetter({ name: 'Q', joinedAt: '2026-08-01', stats: {}, moduleScores: { p7: mod(3, '2026-09-01', 5, 10) } }, WED, []);
eq('semaine sans entraînement : pas de « 0 days out of 7 »', quiet.paragraphs[0], 'Last week the Arena was quiet. It happens: what counts is the next session.');
const ins6 = V.insightText({ targetToeic: 785, moduleScores: { p7: mod(2, '2026-09-20', 5, 10) } }, NOW);
eq('insight : la partie où l\'élève perd le plus de points, chiffrée', /^Where you lose the most points: Part 7 — Reading, about \d+ points toward 785\. You're at \d+% there; your goal needs about 79%\./.test(ins6), true);
eq('insight : aucun trou dans le texte', /undefined|NaN/.test(ins6 + V.insightText({ moduleScores: {} }, NOW)), false);
eq('Chronique : un insight se lit comme un jalon', V.chronicleEntry({ d: '2026-09-20', kind: 'insight', icon: 'crystal-ball', facts: { text: 'Part 7 first.' } }).title + ' | ' + V.chronicleEntry({ d: '2026-09-20', kind: 'insight', icon: 'crystal-ball', facts: { text: 'Part 7 first.' } }).text, 'Aldric\'s insight | Part 7 first.');

// ── 4. Toutes les icônes existent ──────────────────────────────────────────────────────────────
const names = new Set(); names.add('crystal-ball'); names.add('quill-ink'); // Chronique (lot 6)
const cold = withMission({ name: 'C', joinedAt: '2026-09-19', stats: {}, moduleScores: { drill: mod(2, '2026-09-20', 5, 10) },
  battleScan: { subScores: { grammarMacros: { verbs: 0.4, linking: 0.7 }, parts: { p3: 0.5, p7: 0.52 } } } });
[u1, cold].forEach((u) => u.mission.quests.forEach((fq, i) => names.add(V.questView(P.thawQuest(fq, u, NOW), u, i === 0).icon)));
Object.values(L.PART_ICON).forEach((n) => names.add(n));
Object.values(R.TIERS).forEach((t) => names.add(t.icon));
L.MACROS.forEach((x) => names.add(x.icon));
V.rememberLines({ slain: [{ label: 'a' }], hits: [1], escaped: [{}], fresh: [1], focusCat: 'X', focusT: 3, focusC: 1, macro: 'Verbs', macroT: 2, macroC: 1, scanAcc: 0.5, best: { name: 'x', sc: 1, tot: 2 } })
  .forEach((l) => names.add(l.icon));
// Les icônes écrites en dur dans les écrans du Mentor, de la chasse et du bandeau de Home.
V.drillRemember(comp5, res).forEach((l) => names.add(l.icon));
V.briefing({ kind: 'hunt', items: [it('lisP2:p2_01', 1, 2), it('p7:p7p1:0', 0, 1), it('drill:g1', 0, 1)] }, u1, NOW).chips.forEach((c) => names.add(c.icon));
bl.chips.forEach((c) => names.add(c.icon));
['src/features/mentor/Mentor.jsx', 'src/features/hunt/MistakeHunt.jsx', 'src/features/home/Home.jsx', 'src/components/NextStepReco.jsx',
  'src/components/MentorMemory.jsx', 'src/components/Ceremonies.jsx', 'src/features/train/grammar.jsx'].forEach((rel) => {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const mm of src.matchAll(/<GIcon name=\{?"([a-z0-9-]+)"/g)) names.add(mm[1]);
  for (const mm of src.matchAll(/\?"([a-z0-9-]+)":v\.icon/g)) names.add(mm[1]);
});
const missing = [...names].filter((n) => !GAME_ICON_PATHS[n]);
eq('icônes inconnues de GAME_ICON_PATHS', missing, []);

console.log(fails === 0 ? '  OK ' + checks + ' vérifications (' + names.size + ' icônes)' : '  ' + fails + ' échec(s) sur ' + checks);
process.exit(fails === 0 ? 0 : 1);
