// Permutation des options des questions de grammaire et d'examen (2026-09-18). PUR, sans données.
// Les banques rédigées à la main placent mal la bonne réponse : grammaire (Drill, Daily, Exam Simulation,
// Word Fall) en B 61 % du temps et en D 4 % ; Part 6 des Mock Tests en A 7 fois sur 8 ; Parts 3 et 4 du
// Boss jamais en A. Sans permutation, l'élève apprend la position. La banque n'est jamais modifiée : chaque
// fonction rend une copie, bonne réponse suivie. Aucune explication de ces banques ne cite de lettre
// (vérifié par tests/check_option_shuffle.cjs) : rien à remapper.
//
// `seed` absent : tirage neuf à chaque appel (entraînement, Mock Tests, qui ne reprennent pas une session).
// `seed(clé)` → entier : tirage figé par item (Boss : la reprise relit des réponses rangées par index).
// `.map(shufP5)` marche : l'index que `map` passe en second n'est pas une fonction, il est ignoré.
import { shuffleOpts, seededShuffleOpts } from "./util.js";

function pick(opts, c, seed, key) { return typeof seed === "function" ? seededShuffleOpts(opts, c, seed(String(key))) : shuffleOpts(opts, c); }
// Part 5 et banque de grammaire : {o, c}.
export function shufP5(q, seed) {
  var s = pick(q.o, q.c, seed, q.id);
  return Object.assign({}, q, { o: s.opts, c: s.c });
}
// Part 6 : chaque trou {blank, options, correct} du texte.
export function shufP6(t, seed) {
  var n = -1;
  return Object.assign({}, t, { parts: t.parts.map(function (pt) {
    if (!pt.blank) return pt;
    n++;
    var s = pick(pt.options, pt.correct, seed, t.id + ":" + n);
    return Object.assign({}, pt, { options: s.opts, correct: s.c });
  }) });
}
// Part 7 : chaque question {options, correct} du passage.
export function shufP7(ps, seed) {
  return Object.assign({}, ps, { questions: ps.questions.map(function (q, i) {
    // `keep` : options d'ordre fixe (insertion de phrase, [1] à [4] dans l'ordre du texte).
    if (q.keep) return q;
    var s = pick(q.options, q.correct, seed, ps.id + ":" + i);
    return Object.assign({}, q, { options: s.opts, correct: s.c });
  }) });
}
// Parts 3 et 4 : chaque question {opts, c} d'une conversation ou d'un exposé. L'audio ne lit pas les
// options : les permuter ne désaligne rien.
export function shufQs(conv, seed) {
  return Object.assign({}, conv, { qs: conv.qs.map(function (q, i) {
    var s = pick(q.opts, q.c, seed, conv.id + ":" + i);
    return Object.assign({}, q, { opts: s.opts, c: s.c });
  }) });
}
