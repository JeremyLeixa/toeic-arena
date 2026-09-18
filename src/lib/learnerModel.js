// Modèle de l'apprenant (2026-09-17, proto prototypes/mentor-memory/). PUR : aucun JSX, aucun import
// impur (les tests le requièrent en natif). Testé par tests/check_learner_model.cjs.
//
// POURQUOI CE MODULE. Jusqu'ici la personnalisation lisait `correct/total` depuis le premier jour :
// un élève passé de 45 % à 80 % affichait 68 %, donc Today's Focus restait bloqué sur une faiblesse
// déjà corrigée. Et « le plus faible » n'est pas « le plus coûteux » : la Part 1 pèse 6 questions au
// vrai TOEIC, la Part 7 en pèse 54. Ce module rend trois choses, toutes datées :
//   - la maîtrise RÉCENTE d'une partie ou d'une catégorie (pondérée par l'âge, retenue vers un prior) ;
//   - les POINTS EN JEU par partie (ce que l'écart à la cible coûte vraiment au score) ;
//   - les RETOURNEMENTS (« au début » contre « dernièrement »), qui autorisent Aldric à parler d'un
//     progrès sans l'inventer.
//
// Les dates sont les chaînes « YYYY-MM-DD » de today() (UTC), comme history et lastDate.
import { today } from "./util.js";
import { MODULE_TOEIC_MAP } from "./toeic.js";
import { QUESTIONS } from "../data/grammar.js";
import { SCAN_GRAMMAR_MACROS } from "../data/placement.js";

// ── Dates ── (Date.parse d'une date ISO nue est en UTC : pas de dérive d'heure d'été)
export function addDays(d, n) { return new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10); }
export function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Le lundi de la semaine de `d` (dates ISO en UTC, comme today()). Clé de la lettre du lundi
// (letter_seen) et des compteurs hebdomadaires du bestiaire.
export function mondayOf(d) { return addDays(d, -((new Date(Date.parse(d)).getUTCDay() + 6) % 7)); }
export function fmtDay(d) { var x = new Date(Date.parse(d)); return x.getUTCDate() + " " + MONTHS[x.getUTCMonth()]; }
export function weekdayName(d) { return WEEKDAYS[new Date(Date.parse(d)).getUTCDay()]; }

// ── Le vrai TOEIC : questions par partie, et points par question (échelle de section 5-495 / 100 Q) ──
export var TOEIC_Q = { p1: 6, p2: 25, p3: 39, p4: 30, p5: 30, p6: 16, p7: 54 };
export var PTS_PER_Q = 4.9;
export var PARTS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
// Source unique des libellés et du module conseillé par partie (dupliqués jusqu'ici dans toeic.js,
// NextStepReco.jsx et Mentor.jsx).
export var PART_LABEL = { p1: "Part 1 — Photographs", p2: "Part 2 — Question-Response", p3: "Part 3 — Conversations", p4: "Part 4 — Talks", p5: "Part 5 — Grammar & Vocab", p6: "Part 6 — Text Completion", p7: "Part 7 — Reading", vocab: "Vocabulary" };
export var PART_SHORT = { p1: "Part 1", p2: "Part 2", p3: "Part 3", p4: "Part 4", p5: "Part 5", p6: "Part 6", p7: "Part 7", vocab: "Vocabulary" };
export var PART_MOD = { p1: "lisP1", p2: "lisP2", p3: "lisP3", p4: "lisP4", p5: "drill", p6: "p6", p7: "p7", vocab: "tavern" };
export var PART_ICON = { p1: "spyglass", p2: "chat-bubble", p3: "conversation", p4: "public-speaker", p5: "ink-swirl", p6: "scroll-quill", p7: "eye-target", vocab: "beer-stein" };

// ── Réglages (chacun est une décision produit : les changer, c'est changer ce qu'Aldric ose dire) ──
export var HALF_LIFE = 14;   // jours : une réponse d'il y a 14 jours pèse moitié moins qu'aujourd'hui
export var PRIOR_Q = 6;      // masse du prior, en questions (même idée que PRIOR_K de l'estimateur)
export var PRIOR_ACC = 0.6;
export var MIN_EVID = 8;     // questions « effectives » avant de parler d'une partie ou d'une catégorie
export var TURN = { thenMax: 0.55, nowMin: 0.75, thenQ: 10, nowQ: 12, gapDays: 10 };

// Les 4 macros de grammaire, avec leurs catégories. Source unique : data/placement.js.
export var MACROS = SCAN_GRAMMAR_MACROS;
export function macroOfCat(cat) {
  for (var i = 0; i < MACROS.length; i++) if (MACROS[i].subcats.indexOf(cat) >= 0) return MACROS[i];
  return null;
}

// ── Séries datées ──
function byDate(a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }
export function partSeries(u, part) {
  var out = [], ms = (u && u.moduleScores) || {};
  Object.keys(ms).forEach(function (id) {
    var m = MODULE_TOEIC_MAP[id];
    if (!m || m.part !== part) return;
    // Une entrée sans date (format ancien, profil abîmé) donnerait un NaN dans tout le plan : ignorée.
    (ms[id].history || []).forEach(function (h) { if (h && h.date && h.total) out.push({ d: h.date, c: h.correct || 0, t: h.total, mod: id }); });
  });
  return out.sort(byDate);
}
// Catégories de grammaire : les catStats DE LA SESSION (`cs`, posées par recordModule).
// La chasse aux erreurs (module "hunt") est exclue : y réussir une question déjà vue, explication lue,
// prouve qu'on l'a retenue, pas qu'on maîtrise la catégorie (constaté dans la simulation du proto :
// les pronoms relatifs passaient pour « devenus une force » sur des questions revues).
export function catSeries(u, cat) {
  var ms = (u && u.moduleScores) || {}, out = [];
  Object.keys(ms).forEach(function (id) {
    if (id === "hunt") return;
    (ms[id].history || []).forEach(function (e) { var s = e && e.date && e.cs && e.cs[cat]; if (s && s.t) out.push({ d: e.date, c: s.c || 0, t: s.t }); });
  });
  return out.sort(byDate);
}
export function lifetime(series) {
  var c = 0, t = 0;
  series.forEach(function (e) { c += e.c; t += e.t; });
  return { c: c, t: t, acc: t ? c / t : null };
}
// Maîtrise récente : pondération par l'âge (demi-vie) puis retenue vers le prior, comme l'estimateur.
export function mastery(series, now) {
  var d = today(now), sw = 0, sc = 0;
  series.forEach(function (e) { var w = Math.pow(0.5, daysBetween(e.d, d) / HALF_LIFE); sw += w * e.t; sc += w * e.c; });
  return { acc: (sc + PRIOR_Q * PRIOR_ACC) / (sw + PRIOR_Q), n: sw, raw: sw ? sc / sw : null };
}
export function windowAcc(series, from, to) {
  var c = 0, t = 0;
  series.forEach(function (e) { if (e.d >= from && e.d <= to) { c += e.c; t += e.t; } });
  return { c: c, t: t, acc: t ? c / t : null };
}
// Les dernières réponses (≥ minQ questions), de la plus récente vers l'arrière.
export function recentWindow(series, minQ) {
  var c = 0, t = 0, start = null;
  for (var i = series.length - 1; i >= 0 && t < minQ; i--) { c += series[i].c; t += series[i].t; start = series[i].d; }
  return { c: c, t: t, acc: t ? c / t : null, start: start };
}
// « Au début » (premières ≥ 10 Q) contre « dernièrement » (dernières ≥ 12 Q), sans chevauchement.
// `eligible` autorise la cérémonie « faiblesse devenue force » ; `near` autorise seulement de l'annoncer.
export function turnaround(series) {
  if (!series || !series.length) return null;
  var th = { c: 0, t: 0, start: series[0].d, end: null, i: -1 };
  for (var i = 0; i < series.length && th.t < TURN.thenQ; i++) { th.c += series[i].c; th.t += series[i].t; th.end = series[i].d; th.i = i; }
  var nw = { c: 0, t: 0, start: null, end: series[series.length - 1].d, i: series.length };
  for (var j = series.length - 1; j > th.i && nw.t < TURN.nowQ; j--) { nw.c += series[j].c; nw.t += series[j].t; nw.start = series[j].d; nw.i = j; }
  if (th.t < TURN.thenQ || nw.t < TURN.nowQ) return null;
  th.acc = th.c / th.t; nw.acc = nw.c / nw.t;
  var gap = daysBetween(th.end, nw.start), shape = th.acc < TURN.thenMax && nw.acc >= TURN.nowMin;
  return { then: th, now: nw, gap: gap, delta: nw.acc - th.acc, eligible: shape && gap >= TURN.gapDays, near: shape && gap < TURN.gapDays };
}
// Première date où la série cumulée (≥ minQ) remplit le test — les jalons de la Chronique.
export function firstCross(series, minQ, test) {
  var c = 0, t = 0;
  for (var i = 0; i < series.length; i++) {
    c += series[i].c; t += series[i].t;
    if (t >= minQ && test(c / t)) return { d: series[i].d, c: c, t: t, acc: c / t };
  }
  return null;
}

// ── Où sont les points ──
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
// Cible de précision par section, déduite de l'objectif de l'élève (inverse de l'échelle 5 + acc×490).
export function targetAcc(u) {
  if (u && u.targetToeic) return clamp((u.targetToeic / 2 - 5) / 490, 0.3, 0.97);
  return 0.85;
}
function scanParts(u) { return (u && u.battleScan && u.battleScan.subScores && u.battleScan.subScores.parts) || {}; }
function scanMacros(u) { return (u && u.battleScan && u.battleScan.subScores && u.battleScan.subScores.grammarMacros) || {}; }
export function partState(u, part, now) {
  var s = partSeries(u, part), m = mastery(s, now), life = lifetime(s);
  var base = { part: part, n: m.n, life: life, last: s.length ? s[s.length - 1].d : null, sessions: s.length };
  if (m.n >= MIN_EVID) { base.acc = m.acc; base.source = "trained"; return base; }
  var sp = scanParts(u)[part];
  if (typeof sp === "number") { base.acc = sp; base.source = "scan"; return base; }
  if (part === "p5") {
    var sm = scanMacros(u), ks = Object.keys(sm);
    if (ks.length) { base.acc = ks.reduce(function (a, k) { return a + sm[k]; }, 0) / ks.length; base.source = "scan"; return base; }
  }
  base.acc = null; base.source = "none";
  return base;
}
// Points TOEIC en jeu par partie : questions au vrai test × écart à la cible × points par question.
export function stakes(u, now) {
  var tgt = targetAcc(u);
  return PARTS.map(function (p) {
    var st = partState(u, p, now);
    st.tgt = tgt;
    st.pts = st.acc == null ? null : Math.round(TOEIC_Q[p] * Math.max(0, tgt - st.acc) * PTS_PER_Q);
    return st;
  }).sort(function (a, b) { return (b.pts || 0) - (a.pts || 0); });
}

// ── Catégories de grammaire ──
export function allCats() {
  var seen = {}, out = [];
  QUESTIONS.forEach(function (q) { if (!seen[q.cat]) { seen[q.cat] = 1; out.push(q.cat); } });
  return out;
}
export function catState(u, cat, now) {
  var s = catSeries(u, cat);
  return { cat: cat, series: s, m: mastery(s, now), life: lifetime(s), turn: turnaround(s), last: s.length ? s[s.length - 1].d : null };
}
export function weakestCat(u, now, onlyCats) {
  var best = null;
  (onlyCats || allCats()).forEach(function (c) {
    var st = catState(u, c, now);
    if (st.m.n < MIN_EVID) return;
    if (!best || st.m.acc < best.m.acc) best = st;
  });
  return best;
}
// Repli quand la série par catégorie est trop mince (elle n'existe que depuis le 2026-09-17) : la
// catégorie la plus faible selon les statistiques CUMULÉES du Drill (≥ 5 questions, seuil de l'ancien
// pickAdaptive). Sans lui, le Drill composé par le plan serait purement aléatoire pour presque tout le
// monde, là où l'ancien tirage pondérait déjà vers les faiblesses. `source:"lifetime"` : le briefing
// cite alors le cumul (« 12 of 30 so far »), jamais une fenêtre récente qu'on n'a pas.
export function weakestLifetimeCat(u, now) {
  var cs = (u && u.moduleScores && u.moduleScores.drill && u.moduleScores.drill.catStats) || {}, best = null;
  Object.keys(cs).forEach(function (c) {
    var s = cs[c];
    if (!s || s.total < 5 || allCats().indexOf(c) < 0) return;
    var acc = s.correct / s.total;
    if (!best || acc < best.acc) best = { cat: c, acc: acc, c: s.correct, t: s.total };
  });
  if (!best) return null;
  return Object.assign(catState(u, best.cat, now), { source: "lifetime", life: { c: best.c, t: best.t, acc: best.acc } });
}
// Sessions d'entraînement : les chasses ne comptent pas pour sortir du démarrage à froid.
export function trainedSessions(u) {
  var ms = (u && u.moduleScores) || {}, n = 0;
  Object.keys(ms).forEach(function (id) { if (id !== "hunt") n += ms[id].sessions || 0; });
  return n;
}
