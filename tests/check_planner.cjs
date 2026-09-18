/* Plan du jour (lib/planner.js, 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. Ce module remplace QUATRE recommandeurs qui se contredisaient
 * (getDailyMission, computeTodayFocus, NextStepReco, generateInsight) : c'est désormais la seule
 * réponse à « qu'est-ce que je fais maintenant ? », et la 1re quête EST la mission du jour (+15 XP).
 * Ce qui casse en silence :
 *   - le seuil de la chasse (4 échéances) : trop bas, l'élève ne fait plus que réviser ; trop haut, le
 *     bestiaire s'empile et la révision espacée ne sert plus à rien ;
 *   - le démarrage à froid (< 5 sessions) : sans lui, on annonce une « faiblesse » sur trois questions ;
 *   - la quête d'enjeu, qui doit suivre les POINTS et non la précision la plus basse ;
 *   - la composition du Drill : la catégorie visée, la catégorie méritée allégée, les erreurs dues
 *     glissées, et surtout AUCUNE créature du bestiaire tirée au hasard (elle doit venir par sa dette).
 *
 * Prouvé mordant le 2026-09-17 : HUNT_MIN 4 → 1 rouge ; COLD_SESSIONS 5 → 0 rouge ; KEEP_DAYS 7 → 99
 * rouge ; quête d'enjeu acceptant une partie « scan » rouge ; filtre `!lurking[q.id]` retiré rouge ;
 * seuil de 10 questions des tendances hebdomadaires abaissé rouge.
 *
 * Usage : node tests/check_planner.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src', 'lib', 'planner.js'));
const R = require(path.join(ROOT, 'src', 'lib', 'review.js'));
const { QUESTIONS } = require(path.join(ROOT, 'src', 'data', 'grammar.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const ok = (label, cond) => { checks++; if (!cond) fail(label); };
const NOW = new Date('2026-09-21T10:00:00Z');
const D = (s) => new Date(s + 'T10:00:00Z');
// Générateur déterministe : la composition d'une session ne doit pas dépendre du hasard du jour.
function seeded(seed) { return function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
function mod(entries) { return { history: entries, sessions: entries.length, correct: entries.reduce((a, e) => a + e.correct, 0), total: entries.reduce((a, e) => a + e.total, 0) }; }
function sessions(n, date, correct, total, cs) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(cs ? { date: date, correct: correct, total: total, cs: cs } : { date: date, correct: correct, total: total });
  return out;
}
function dueCreatures(n, day) {
  const rv = R.newReview();
  for (let i = 0; i < n; i++) R.reviewMiss(rv, { k: 'drill:g' + (100 + i), cat: 'Connectors', part: 'p5' }, D(day || '2026-09-19'));
  return rv;
}

// Un élève « chaud » : beaucoup de Part 7 (faible, lourde au TOEIC), une Part 2 forte laissée de côté.
function warm(extra) {
  return Object.assign({
    joinedAt: '2026-09-01', targetToeic: 785, targetDate: '2026-11-06', stats: { sessions: 12 },
    moduleScores: {
      drill: mod(sessions(4, '2026-09-19', 7, 10, { Conditionals: { c: 2, t: 4 }, Tenses: { c: 5, t: 6 } })),
      p7: mod(sessions(4, '2026-09-20', 6, 10)),
      lisP2: mod(sessions(2, '2026-09-10', 9, 10)),
    },
  }, extra || {});
}

// ── 1. La chasse ne devient une quête qu'à partir de 4 échéances ───────────────────────────────
eq('3 échéances : pas de quête de chasse', P.planToday(warm({ review: dueCreatures(3) }), NOW).quests[0].kind, 'stake');
eq('3 échéances : elles sont glissées dans la session', P.planToday(warm({ review: dueCreatures(3) }), NOW).folded.length, 3);
eq('4 échéances : la chasse passe en tête', P.planToday(warm({ review: dueCreatures(4) }), NOW).quests[0].kind, 'hunt');
eq('… et rien n\'est glissé ailleurs', P.planToday(warm({ review: dueCreatures(4) }), NOW).folded.length, 0);
eq('la chasse est plafonnée', P.planToday(warm({ review: dueCreatures(25) }), NOW).quests[0].n, R.HUNT_CAP);
eq('… mais elle dit la dette réelle', P.planToday(warm({ review: dueCreatures(25) }), NOW).quests[0].due, 25);

// ── 2. Un plan chaud : enjeu puis entretien ────────────────────────────────────────────────────
const planW = P.planToday(warm(), NOW);
eq('les quêtes, dans l\'ordre', planW.quests.map((q) => q.kind), ['stake', 'keep']);
eq('l\'enjeu vise la partie la plus coûteuse', planW.quests[0].part, 'p7');
eq('l\'entretien vise la partie forte délaissée', [planW.quests[1].part, planW.quests[1].days], ['p2', 11]);
ok('la quête d\'enjeu porte ses points', planW.quests[0].pts > 0);
// Une partie connue seulement par le Battle Scan ne peut pas être « l'enjeu » : on ne bâtit pas un
// plan sur une estimation de 4 questions.
const scanOnly = warm({ battleScan: { subScores: { parts: { p4: 0.2 } } } });
eq('une partie seulement « scannée » ne devient pas l\'enjeu', P.planToday(scanOnly, NOW).quests[0].part, 'p7');

// ── 3. Démarrage à froid : on part du Battle Scan, et on le dit ────────────────────────────────
const cold = {
  joinedAt: '2026-09-18', stats: { sessions: 2 },
  battleScan: { subScores: { grammarMacros: { verbs: 0.4, linking: 0.7, forms: 0.62, reference: 0.55 }, parts: { p3: 0.5, p7: 0.52 } } },
  moduleScores: { drill: mod(sessions(2, '2026-09-19', 5, 10, { Tenses: { c: 5, t: 10 } })) },
};
const planC = P.planToday(cold, NOW);
ok('plan de démarrage à froid', planC.cold === true);
eq('on vérifie d\'abord ce que le scan soupçonne', [planC.quests[0].kind, planC.quests[0].macro.id], ['confirm', 'verbs']);
eq('puis on mesure la partie la plus lourde jamais jouée', [planC.quests[1].kind, planC.quests[1].part], ['explore', 'p7']);
// 5 sessions d'entraînement : on sort du démarrage à froid.
const warmed = Object.assign({}, cold, { moduleScores: { drill: mod(sessions(5, '2026-09-19', 5, 10, { Tenses: { c: 5, t: 10 } })) } });
ok('5 sessions : on ne parle plus du scan', P.planToday(warmed, NOW).cold === false);

// ── 4. Composition d'un Drill ──────────────────────────────────────────────────────────────────
const u4 = warm({ review: dueCreatures(2, '2026-09-19') });
const comp = P.composeSession(u4, NOW, P.planToday(u4, NOW), null, seeded(7));
eq('dix questions', comp.items.length, 10);
eq('deux erreurs dues, glissées dans la manche', comp.items.filter((x) => x.role === 'due').length, 2);
eq('la catégorie visée est la plus faible', comp.focus.cat, 'Conditionals');
eq('quatre questions sur la catégorie visée', comp.items.filter((x) => x.role === 'focus').length, 4);
ok('les questions visées sont bien de cette catégorie', comp.items.filter((x) => x.role === 'focus').every((x) => x.q.cat === 'Conditionals'));
// Une créature du bestiaire ne doit jamais arriver « par hasard » : elle vient par sa dette, sinon
// l'espacement est cassé et la question est reposée trop tôt. Cas limite : presque toute la catégorie
// visée dort dans le bestiaire — il ne reste que deux questions neuves, et le Drill n'en pose que deux.
const CONDITIONALS = QUESTIONS.filter((q) => q.cat === 'Conditionals');
const nearlyAll = R.newReview();
CONDITIONALS.slice(0, CONDITIONALS.length - 2).forEach((q) => R.reviewMiss(nearlyAll, { k: 'drill:' + q.id, cat: 'Conditionals', part: 'p5' }, NOW));
const uLurk = warm({ review: nearlyAll });
const compL = P.composeSession(uLurk, NOW, P.planToday(uLurk, NOW), null, seeded(5));
const lurkIds = nearlyAll.items.map((x) => x.k.slice(6));
eq('les créatures d\'aujourd\'hui ne sont pas encore dues', P.planToday(uLurk, NOW).due.length, 0);
eq('aucune créature tirée au hasard', compL.items.filter((x) => x.q).map((x) => x.q.id).filter((id) => lurkIds.indexOf(id) >= 0), []);
eq('il ne reste que deux questions neuves sur la catégorie visée', compL.items.filter((x) => x.role === 'focus').length, 2);
eq('… et la manche reste pleine', compL.items.length, 10);
eq('aucune question en double', new Set(comp.items.map((x) => (x.q ? x.q.id : x.id))).size, 10);
eq('même graine, même manche', P.composeSession(u4, NOW, P.planToday(u4, NOW), null, seeded(7)).items.map((x) => (x.q ? x.q.id : x.id)),
  comp.items.map((x) => (x.q ? x.q.id : x.id)));
// Une catégorie retournée (faible au début, solide depuis) est ALLÉGÉE : deux questions au lieu de
// quatre. C'est ce qui permet au briefing de dire « you've earned it » sans mentir.
const turnedUser = {
  joinedAt: '2026-09-01', stats: { sessions: 12 },
  moduleScores: { drill: mod([
    { date: '2026-09-01', correct: 2, total: 10, cs: { 'Passive Voice': { c: 1, t: 5 }, Conditionals: { c: 1, t: 5 } } },
    { date: '2026-09-02', correct: 2, total: 10, cs: { 'Passive Voice': { c: 1, t: 5 }, Conditionals: { c: 1, t: 5 } } },
    { date: '2026-09-18', correct: 8, total: 12, cs: { 'Passive Voice': { c: 6, t: 6 }, Conditionals: { c: 2, t: 6 } } },
    { date: '2026-09-20', correct: 8, total: 12, cs: { 'Passive Voice': { c: 6, t: 6 }, Conditionals: { c: 2, t: 6 } } },
  ]) },
};
const compT = P.composeSession(turnedUser, NOW, P.planToday(turnedUser, NOW), null, seeded(11));
eq('la catégorie retournée est allégée', compT.eased.cat, 'Passive Voice');
eq('deux questions seulement pour elle', compT.items.filter((x) => x.role === 'eased').length, 2);
eq('la catégorie visée reste la plus faible', compT.focus.cat, 'Conditionals');

// ── 5. Composition d'une chasse ────────────────────────────────────────────────────────────────
const u5 = warm({ review: dueCreatures(6) });
const hunt = P.composeSession(u5, NOW, P.planToday(u5, NOW), null, seeded(3));
eq('la chasse prend la file du bestiaire', [hunt.kind, hunt.items.length], ['hunt', 6]);

// ── 6. La semaine écoulée : aucune tendance sans preuve ────────────────────────────────────────
const twoWeeks = {
  joinedAt: '2026-08-01', targetToeic: 785, targetDate: '2026-11-06',
  moduleScores: { p7: mod([
    { date: '2026-09-10', correct: 6, total: 20 },   // semaine précédente : 30 %
    { date: '2026-09-18', correct: 16, total: 20 },  // semaine écoulée : 80 %
  ]) },
};
const wf = P.weekFacts(twoWeeks, NOW, [{ d: '2026-09-13', toeic: 650 }, { d: '2026-09-20', toeic: 680 }]);
eq('la hausse est annoncée', wf.up.map((m) => m.label), ['Part 7']);
eq('estimation de la semaine', [wf.est.from, wf.est.to], [650, 680]);
const thin = { joinedAt: '2026-08-01', moduleScores: { p7: mod([
  { date: '2026-09-10', correct: 2, total: 6 }, { date: '2026-09-18', correct: 6, total: 6 },
]) } };
eq('6 questions par semaine : aucune tendance annoncée', P.weekFacts(thin, NOW, []).up, []);

// ── 7. L'allure vers l'objectif ────────────────────────────────────────────────────────────────
const pace = P.goalPace(twoWeeks, NOW, [{ d: '2026-09-13', toeic: 650 }, { d: '2026-09-20', toeic: 680 }]);
eq('semaines restantes', pace.weeksLeft, 7);
eq('points nécessaires par semaine', Math.round(pace.needed), 16); // (785 − 680) / 6,6 semaines
eq('+30 la semaine passée : dans les temps', pace.onTrack, true);
eq('sans objectif, pas d\'allure', P.goalPace({ moduleScores: {} }, NOW, []), null);

// ── 8. La journée figée dans u.mission (lot 4) ─────────────────────────────────────────────────
// Recalculé à chaque ouverture, le plan bougeait sous les yeux de l'élève : chasse finie → disparue,
// « +15 XP » qui glisse sur une autre quête, +25 % qui change de partie. Figé, il se coche.
const uM = warm({ review: dueCreatures(5), mission: { date: '2026-09-20', actId: 'p7', done: true, streak: 6, lastDoneDate: '2026-09-20' } });
const m8 = P.dayMission(uM, NOW);
eq('la mission porte la 1re quête', [m8.date, m8.pick, m8.actId, m8.done], ['2026-09-21', 0, 'hunt', false]);
eq('la série du coffre mission_streak est gardée', [m8.streak, m8.lastDoneDate], [6, '2026-09-20']);
eq('les quêtes figées', m8.quests.map((q) => q.kind), ['hunt', 'stake', 'keep']);
ok('figées en primitives (jsonb léger, pas de séries)', JSON.stringify(m8.quests).length < 400);
const frozen = Object.assign({}, uM, { mission: m8 });
eq('le +25 % suit la quête d\'enjeu figée', P.stakePart(frozen, NOW), 'p7');
// La chasse faite, le plan recalculé n'a plus de chasse : la copie figée, si.
const afterHunt = Object.assign({}, frozen, { review: R.newReview(), dailyModSessions: { ['hunt_2026-09-21']: 1 }, mission: Object.assign({}, m8, { done: true }) });
eq('plan recalculé : la chasse a disparu', P.planToday(afterHunt, NOW).quests[0].kind, 'stake');
eq('plan figé : elle est cochée, à sa place', P.todayMission(afterHunt, NOW).quests.map((q, i) => [q.kind, P.questDone(afterHunt, afterHunt.mission, i, NOW)]),
  [['hunt', true], ['stake', false], ['keep', false]]);
// Jour du déploiement : l'ancienne mission (sans quêtes) déjà faite aujourd'hui ne se refait pas (+15 XP).
eq('ancienne mission faite aujourd\'hui : reste faite', P.dayMission(warm({ mission: { date: '2026-09-21', actId: 'drill', done: true, streak: 2 } }), NOW).done, true);
eq('une mission d\'hier n\'est pas celle du jour', [P.todayMission(uM, NOW), P.stakePart(uM, NOW)], [null, null]);
// La catégorie visée se réhydrate (sa série) au lieu d'être stockée.
const mP5 = P.dayMission(warm({ moduleScores: { drill: mod(sessions(6, '2026-09-19', 5, 10, { Conditionals: { c: 2, t: 6 }, Tenses: { c: 3, t: 4 } })) } }), NOW);
eq('catégorie figée par son nom', mP5.quests[0].cat, 'Conditionals');
ok('… et réhydratée avec sa série', P.thawQuest(mP5.quests[0], warm({ moduleScores: { drill: mod(sessions(6, '2026-09-19', 5, 10, { Conditionals: { c: 2, t: 6 } })) } }), NOW).cat.series.length === 6);
// Jeton daily_reroll : la mission passe à la quête suivante, l'ordre ne bouge pas.
const r1 = P.rerollMission(m8), r2 = P.rerollMission(r1), r3 = P.rerollMission(r2);
eq('re-tirage : quête suivante', [r1.pick, r1.actId, r2.actId, r3.actId], [1, 'p7', 'lisP2', 'hunt']);
eq('re-tirage : l\'ordre du plan ne bouge pas', r2.quests.map((q) => q.kind), ['hunt', 'stake', 'keep']);
// Re-tirée sur une partie déjà jouée ce matin : la quête-mission n'est pas « faite » tant que la mission
// ne l'est pas (checkMission attend une nouvelle session de ce module), sinon « Done » mentirait.
const playedFirst = Object.assign({}, frozen, { dailyModSessions: { ['p7_2026-09-21']: 1 }, mission: r1 });
eq('quête-mission : faite seulement quand la mission l\'est', [P.questDone(playedFirst, r1, 1, NOW), P.questDone(playedFirst, Object.assign({}, r1, { done: true }), 1, NOW)], [false, true]);
eq('rien à re-tirer : mission faite, ou une seule quête', [P.rerollMission(Object.assign({}, m8, { done: true })), P.rerollMission(Object.assign({}, m8, { quests: m8.quests.slice(0, 1) }))], [null, null]);

// ── 9. La manche du Drill composée par le plan (lot 5) ─────────────────────────────────────────
// La série par catégorie (`cs`) n'existe que depuis le 2026-09-17 : sans le repli sur les catStats
// CUMULÉES, le Drill composé serait aléatoire pour presque tous les élèves (régression sur pickAdaptive).
const legacy = {
  joinedAt: '2026-06-01', stats: { sessions: 30 },
  moduleScores: { drill: { sessions: 20, history: sessions(6, '2026-09-19', 7, 10), catStats: { Conditionals: { correct: 3, total: 12 }, Tenses: { correct: 9, total: 10 }, Articles: { correct: 1, total: 3 } } } },
  review: dueCreatures(2, '2026-09-19'),
};
const dc = P.drillComposition(legacy, NOW, seeded(9));
eq('sans série récente : la catégorie cumulée la plus faible (≥ 5 questions)', [dc.focus.cat, dc.focus.source], ['Conditionals', 'lifetime']);
eq('… quatre questions sur elle', dc.items.filter((x) => x.role === 'focus').map((x) => x.q.cat), ['Conditionals', 'Conditionals', 'Conditionals', 'Conditionals']);
eq('les échéances glissées portent leur question', dc.items.filter((x) => x.role === 'due').map((x) => [x.q && x.q.id, x.item.k]), [['g100', 'drill:g100'], ['g101', 'drill:g101']]);
eq('dix questions, toutes résolues', [dc.items.length, dc.items.every((x) => x.q)], [10, true]);
// La quête Part 5 du plan figé commande la cible (ici une confirmation du Battle Scan sur les verbes).
const coldM = Object.assign({}, cold, { mission: P.dayMission(cold, NOW) });
const dcc = P.drillComposition(coldM, NOW, seeded(4));
eq('quête de confirmation : la macro du scan', [dcc.macro && dcc.macro.id, dcc.items.filter((x) => x.role === 'focus').every((x) => dcc.macro.subcats.indexOf(x.q.cat) >= 0)], ['verbs', true]);

// ── 10. Cérémonie « faiblesse devenue force » : une fois par catégorie ─────────────────────────
const t10 = P.newTurn(turnedUser, NOW);
eq('le retournement prouvé est célébré', [t10.cat, t10.then, t10.now], ['Passive Voice', { c: 2, t: 10 }, { c: 12, t: 12 }]);
eq('le petit graphique marque la fenêtre récente', t10.spark.map((s) => s.up), [false, false, true, true]);
const cu = JSON.parse(JSON.stringify(turnedUser));
eq('célébrée : marquée dans le bestiaire', [P.celebrateTurn(cu, NOW).cat, cu.review.celebrated], ['Passive Voice', ['Passive Voice']]);
eq('… et plus jamais', P.celebrateTurn(cu, NOW), null);
// Écart trop court entre « au début » et « dernièrement » (< 10 jours) : pas prouvé, pas célébré.
const tooSoon = JSON.parse(JSON.stringify(turnedUser));
tooSoon.moduleScores.drill.history.forEach((h, i) => { h.date = ['2026-09-14', '2026-09-15', '2026-09-18', '2026-09-20'][i]; });
eq('écart de moins de 10 jours : rien', P.newTurn(tooSoon, NOW), null);

console.log(fails === 0 ? '  OK ' + checks + ' vérifications' : '  ' + fails + ' échec(s) sur ' + checks);
process.exit(fails === 0 ? 0 : 1);
