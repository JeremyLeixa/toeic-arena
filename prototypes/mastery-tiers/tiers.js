// Proto échelons de maîtrise (2026-09-19). Règle proposée, pure : au câblage elle part dans
// src/lib/hubStatus.js, lue par le watcher d'App.jsx ET par les tuiles (une seule source, comme
// MASTERY_Q / MASTERY_ACC aujourd'hui).
import { MASTERY_Q, MASTERY_ACC, isMastered } from "../../src/lib/hubStatus.js";
import { today } from "../../src/lib/util.js";

// Échelon I = la règle d'aujourd'hui (50 Q, 80 % sur le CUMUL, déclencheur mastery_<mod> inchangé) :
// les coffres déjà gagnés restent l'échelon I, rien à migrer côté serveur.
// Échelons suivants : volume cumulé ET précision RÉCENTE (les ~50 dernières questions, en sessions
// entières). Sur le cumul, 150 questions à 78 % ne remontent presque plus : l'élève qui progresse
// n'atteindrait jamais 85 %. Même principe que la maîtrise récente de lib/learnerModel.js.
// chest : palier visuel de TreasureChestSvg (2 Champion, 3 Légendaire) et type de coffre octroyé.
export var TIERS = [
  { q: MASTERY_Q, acc: MASTERY_ACC, chest: 2, lifetime: true }, // I   mastery_<mod>     Champion
  { q: 150, acc: 0.85, chest: 2 },                              // II  mastery_<mod>_2   Champion
  { q: 300, acc: 0.85, chest: 3 },                              // III mastery_<mod>_3   Légendaire
];
// Au-delà de III, la récurrence : un échelon tous les +150 Q (IV à 450, V à 600…), coffre Champion.
export var RENOWN_STEP = 150, RENOWN_ACC = 0.85, RENOWN_CHEST = 2;
export var RECENT_Q = 50;
// Un échelon au plus par module et par semaine (dès II) : 150 questions jouées en un week-end, même
// à 0 XP (4e partie du jour : le volume compte quand même), ne donnent pas deux coffres d'affilée.
export var GAP_DAYS = 7;

export function tierDef(n) {
  if (n <= TIERS.length) return Object.assign({ n: n }, TIERS[n - 1]);
  var top = TIERS[TIERS.length - 1];
  return { n: n, q: top.q + (n - TIERS.length) * RENOWN_STEP, acc: RENOWN_ACC, chest: RENOWN_CHEST, renown: true };
}

export function roman(n) {
  var r = "";
  [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } });
  return r;
}

// Précision des ~50 dernières questions : sessions entières en partant de la fin (history, 100 sessions).
export function recentAcc(hist) {
  var t = 0, c = 0;
  for (var i = (hist || []).length - 1; i >= 0 && t < RECENT_Q; i--) { t += hist[i].total || 0; c += hist[i].correct || 0; }
  return { q: t, acc: t ? c / t : 0 };
}

function dayDiff(a, b) { return Math.round((Date.parse(a) - Date.parse(b)) / 864e5); }

// Échelon atteint : moduleScores[mod].mt = {n, date}, posé par le watcher quand le coffre part (au câblage,
// recordModule doit le recopier : il reconstruit l'objet avec des clés fixes). Sans mt, un module maîtrisé
// au sens d'aujourd'hui a déjà reçu son coffre I : échelon 1, date inconnue, donc pas d'attente.
export function tierStatus(m, now) {
  m = m || {};
  var total = m.total || 0, correct = m.correct || 0;
  var won = m.mt && m.mt.n ? m.mt.n : isMastered({ total: total, correct: correct }) ? 1 : 0;
  var next = tierDef(won + 1), prevQ = won ? tierDef(won).q : 0;
  var rec = next.lifetime ? { q: total, acc: total ? correct / total : 0 } : recentAcc(m.history);
  var volOk = total >= next.q, accOk = rec.acc >= next.acc;
  var t = today(now || new Date());
  var wait = m.mt && m.mt.date ? Math.max(0, GAP_DAYS - dayDiff(t, m.mt.date)) : 0;
  return {
    total: total, won: won, next: next, prevQ: prevQ, acc: rec.acc, recentQ: rec.q,
    vol: Math.max(0, Math.min(1, (total - prevQ) / (next.q - prevQ))),
    volOk: volOk, accOk: accOk,
    // Signalée comme aujourd'hui : seulement au-delà de 10 questions mesurées.
    accLow: rec.q >= 10 && !accOk,
    wait: wait,
    // new : jamais joué · road : volume en route · acclow : volume atteint, précision sous le seuil ·
    // wait : tout est atteint, le coffre part dans `wait` jours · ready : le watcher l'octroierait tout de suite.
    state: !total ? "new" : volOk && accOk ? (wait ? "wait" : "ready") : volOk ? "acclow" : "road",
  };
}

// Hub à épreuves (Gauntlet, Modal Council, Listening, Reading) : un coffre par épreuve, comme
// aujourd'hui. La tuile vise l'échelon suivant de l'épreuve la moins avancée.
export function hubTierStatus(scores, subs, now) {
  var parts = subs.map(function (s) { return tierStatus(scores[s], now); });
  var floor = Math.min.apply(null, parts.map(function (x) { return x.won; }));
  var target = tierDef(floor + 1);
  var at = parts.filter(function (x) { return x.won >= target.n; }).length;
  return {
    hub: true, n: parts.length, won: floor, next: target, at: at,
    chests: parts.reduce(function (a, x) { return a + x.won; }, 0),
    vol: parts.reduce(function (a, x) { return a + (x.won >= target.n ? 1 : Math.min(x.vol, 0.95)); }, 0) / parts.length,
    started: parts.some(function (x) { return x.total > 0; }),
    state: parts.some(function (x) { return x.total > 0; }) ? "road" : "new",
  };
}
