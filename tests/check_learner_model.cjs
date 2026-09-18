/* Modèle de l'apprenant (lib/learnerModel.js, 2026-09-17).
 *
 * POURQUOI CE TEST EXISTE. Ce module décide de ce qu'Aldric OSE dire à un élève. Trois règles y
 * tiennent, et aucune ne casse le build si elle dérive :
 *   1. la maîtrise est RÉCENTE (demi-vie 14 j + prior). Revenir à `correct/total` à vie, c'est
 *      remettre Today's Focus sur une faiblesse déjà corrigée — le défaut qui a lancé ce chantier ;
 *   2. la priorité va aux POINTS EN JEU, pas à la précision la plus basse. La Part 1 pèse 6 questions
 *      au vrai TOEIC, la Part 7 en pèse 54 : un élève à 60 % en Part 1 et 73 % en Part 7 doit être
 *      envoyé en Part 7 ;
 *   3. un retournement (« au début » contre « dernièrement ») exige deux fenêtres mesurables ET dix
 *      jours d'écart. Sans ça, la cérémonie « faiblesse devenue force » se déclenche sur du bruit.
 * Plus une règle de propreté : les réponses données en CHASSE (module "hunt", questions déjà vues avec
 * leur explication) ne comptent pas dans la maîtrise d'une catégorie.
 *
 * Prouvé mordant le 2026-09-17 : HALF_LIFE 14 → 9999 (maîtrise = précision à vie) rouge ;
 * PRIOR_Q 6 → 0 rouge ; tri de stakes par acc au lieu des points rouge ; TURN.gapDays 10 → 0 rouge ;
 * `if (id === "hunt") return;` retiré de catSeries rouge ; MIN_EVID 8 → 1 rouge.
 *
 * Usage : node tests/check_learner_model.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
// Import natif du module pur. S'il casse ici, c'est que quelqu'un l'a rendu impur (JSX, supabase,
// league.js…) : le remettre pur, pas contourner.
const L = require(path.join(ROOT, 'src', 'lib', 'learnerModel.js'));

let fails = 0, checks = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fail(label + ' : obtenu ' + g + ', attendu ' + w);
};
const near = (label, got, want, tol) => {
  checks++;
  if (!(Math.abs(got - want) <= (tol || 0.001))) fail(label + ' : obtenu ' + got + ', attendu ~' + want);
};
const ok = (label, cond) => { checks++; if (!cond) fail(label); };

const NOW = new Date('2026-09-21T10:00:00Z');
function hist(entries) { return { history: entries, sessions: entries.length }; }

// ── 1. Maîtrise récente ────────────────────────────────────────────────────────────────────────
// Deux sessions identiques en volume, l'une d'il y a 20 jours (2/10), l'autre d'hier (8/10).
const u1 = { joinedAt: '2026-09-01', moduleScores: { drill: hist([
  { date: '2026-09-01', correct: 2, total: 10, cs: { Conditionals: { c: 2, t: 10 } } },
  { date: '2026-09-20', correct: 8, total: 10, cs: { Conditionals: { c: 8, t: 10 } } },
]) } };
const s1 = L.partSeries(u1, 'p5');
eq('la série p5 vient de drill, datée', s1.map((e) => e.d), ['2026-09-01', '2026-09-20']);
near('précision à vie', L.lifetime(s1).acc, 0.5);
// La récence tire vers la session d'hier ; le prior (6 Q à 60 %) freine sur un si petit volume.
near('maîtrise récente', L.mastery(s1, NOW).acc, 0.6217);
ok('la maîtrise récente dépasse la précision à vie', L.mastery(s1, NOW).acc > L.lifetime(s1).acc + 0.05);
// Sans prior, 20 questions suffiraient à afficher une maîtrise extrême : le prior doit compter.
near('masse de preuve pondérée par l\'âge', L.mastery(s1, NOW).n, 13.232, 0.01);

// ── 2. Assez de preuve avant de parler ─────────────────────────────────────────────────────────
const scan = { subScores: { parts: { p3: 0.5 }, grammarMacros: { verbs: 0.4 } } };
const thin = { battleScan: scan, moduleScores: { lisP3: hist([{ date: '2026-09-20', correct: 3, total: 6 }]) } };
eq('6 questions : on reste sur le Battle Scan', L.partState(thin, 'p3', NOW).source, 'scan');
near('… et on annonce la valeur du scan', L.partState(thin, 'p3', NOW).acc, 0.5);
const thick = { battleScan: scan, moduleScores: { lisP3: hist([{ date: '2026-09-20', correct: 9, total: 18 }]) } };
eq('18 questions : on parle de l\'entraînement', L.partState(thick, 'p3', NOW).source, 'trained');
eq('partie jamais jouée et hors scan : rien', L.partState({ moduleScores: {} }, 'p4', NOW).acc, null);

// ── 3. Les points en jeu, pas la précision la plus basse ───────────────────────────────────────
// 60 % en Part 1 (6 Q au TOEIC) contre 73 % en Part 7 (54 Q) : la Part 7 coûte bien plus cher.
const u3 = { targetToeic: 785, moduleScores: {
  lisP1: hist([{ date: '2026-09-20', correct: 12, total: 20 }]),
  p7: hist([{ date: '2026-09-20', correct: 30, total: 40 }]),
} };
const st3 = L.stakes(u3, NOW).filter((x) => x.acc != null);
eq('la partie la plus coûteuse passe devant la plus faible', st3[0].part, 'p7');
eq('points en jeu Part 7', st3.find((x) => x.part === 'p7').pts, 16);
eq('points en jeu Part 1', st3.find((x) => x.part === 'p1').pts, 6);
near('cible par section déduite de l\'objectif 785', L.targetAcc({ targetToeic: 785 }), 0.7908);
eq('sans objectif, cible par défaut', L.targetAcc({}), 0.85);
eq('au-dessus de la cible, plus rien en jeu',
  L.stakes({ targetToeic: 600, moduleScores: { p7: hist([{ date: '2026-09-20', correct: 38, total: 40 }]) } }, NOW).find((x) => x.part === 'p7').pts, 0);

// ── 4. Retournements : deux fenêtres mesurables ET dix jours d'écart ───────────────────────────
const weakThenStrong = [
  { d: '2026-09-01', c: 1, t: 5 }, { d: '2026-09-02', c: 1, t: 5 },   // « au début » : 2/10
  { d: '2026-09-15', c: 5, t: 6 }, { d: '2026-09-20', c: 6, t: 6 },   // « dernièrement » : 11/12
];
const tr = L.turnaround(weakThenStrong);
eq('fenêtre du début', [tr.then.c, tr.then.t], [2, 10]);
eq('fenêtre récente', [tr.now.c, tr.now.t], [11, 12]);
eq('écart entre les deux fenêtres', tr.gap, 13);
ok('retournement confirmé', tr.eligible === true && tr.near === false);
// Les mêmes chiffres, resserrés dans le temps : on l\'annonce, on ne le célèbre pas.
const tight = L.turnaround([
  { d: '2026-09-10', c: 1, t: 5 }, { d: '2026-09-11', c: 1, t: 5 },
  { d: '2026-09-16', c: 5, t: 6 }, { d: '2026-09-20', c: 6, t: 6 },
]);
ok('8 jours d\'écart : presque, pas confirmé', tight.near === true && tight.eligible === false);
eq('trop peu de questions : pas de retournement', L.turnaround([{ d: '2026-09-01', c: 1, t: 4 }, { d: '2026-09-20', c: 4, t: 4 }]), null);
ok('resté faible : aucune forme de retournement',
  (() => { const t = L.turnaround([{ d: '2026-09-01', c: 2, t: 10 }, { d: '2026-09-20', c: 5, t: 12 }]); return t && !t.eligible && !t.near; })());

// ── 5. La chasse ne prouve pas la maîtrise d'une catégorie ─────────────────────────────────────
// Réussir en chasse une question déjà vue (explication lue) prouve qu'on l'a retenue, pas qu'on
// maîtrise la catégorie : la simulation du proto faisait ainsi « devenir une force » des pronoms
// relatifs sur des questions revues.
const withHunt = { moduleScores: {
  drill: hist([{ date: '2026-09-20', correct: 2, total: 6, cs: { Conditionals: { c: 2, t: 6 } } }]),
  hunt: hist([{ date: '2026-09-20', correct: 5, total: 5, cs: { Conditionals: { c: 5, t: 5 } } }]),
} };
eq('les catStats de la chasse sont ignorées', L.catSeries(withHunt, 'Conditionals'), [{ d: '2026-09-20', c: 2, t: 6 }]);
eq('la chasse ne compte pas comme session d\'entraînement', L.trainedSessions(withHunt), 1);

// ── 5 bis. Le pont : recordModule écrit les catStats DE LA SESSION ─────────────────────────────
// Sans `cs` dans l'entrée d'history, le modèle n'a plus qu'une moyenne à vie : ni « 6 sur tes 13
// dernières », ni date de retournement. C'est recordModule qui les pose.
const { recordModule } = require(path.join(ROOT, 'src', 'lib', 'progress.js'));
const rec = { moduleScores: {} };
recordModule(rec, 'drill', 7, 10, { Conditionals: { correct: 2, total: 4 }, Tenses: { correct: 5, total: 6 } });
const entry = rec.moduleScores.drill.history[0];
eq('la session garde ses catStats', entry.cs, { Conditionals: { c: 2, t: 4 }, Tenses: { c: 5, t: 6 } });
eq('… et le cumul reste', rec.moduleScores.drill.catStats.Conditionals, { correct: 2, total: 4 });
eq('le modèle relit la session', L.catSeries(rec, 'Tenses').map((e) => [e.c, e.t]), [[5, 6]]);
recordModule(rec, 'drill', 9, 10, null);
eq('sans catStats, pas de clé cs inutile dans le jsonb', 'cs' in rec.moduleScores.drill.history[1], false);

// ── 6. Les 15 catégories de QUESTIONS ont toutes une macro ─────────────────────────────────────
// Pronouns, Quantifiers & Determiners et Parallel Structure (108 des 564 questions) étaient absentes
// des macros : invisibles au Mentor et au Battle Scan jusqu'au 2026-09-17.
const orphans = L.allCats().filter((c) => !L.macroOfCat(c));
eq('aucune catégorie de grammaire sans macro', orphans, []);

// ── 7. Dates : chaînes UTC, comme history ──────────────────────────────────────────────────────
eq('addDays traverse un mois', L.addDays('2026-09-30', 2), '2026-10-02');
eq('daysBetween', L.daysBetween('2026-09-10', '2026-09-21'), 11);
eq('libellé de date', L.fmtDay('2026-09-13'), '13 Sept');
eq('jour de la semaine', L.weekdayName('2026-09-21'), 'Monday');

// ── Entrées d'historique abîmées ──────────────────────────────────────────────────────────────
// Seul recordModule écrit l'historique, avec une date ; mais une entrée sans date (format ancien)
// donnerait un NaN dans la maîtrise, donc dans tout le plan du jour de l'élève. Elle est ignorée.
const broken = { moduleScores: { drill: hist([{ correct: 5, total: 10 }, { date: '2026-09-20', correct: 8, total: 10, cs: { Tenses: { c: 8, t: 10 } } }, { date: '2026-09-19', correct: 0, total: 0 }]) } };
eq('entrée sans date ou vide ignorée', L.partSeries(broken, 'p5').map((e) => e.d), ['2026-09-20']);
ok('maîtrise calculable malgré elle', Number.isFinite(L.mastery(L.partSeries(broken, 'p5'), NOW).acc));
eq('catégorie : idem', L.catSeries({ moduleScores: { drill: hist([{ cs: { Tenses: { c: 1, t: 2 } } }]) } }, 'Tenses'), []);

console.log(fails === 0 ? '  OK ' + checks + ' vérifications' : '  ' + fails + ' échec(s) sur ' + checks);
process.exit(fails === 0 ? 0 : 1);
