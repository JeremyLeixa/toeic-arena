// Proto « moments de victoire » (2026-09-17) — scénarios de fin de session.
//
// Les chiffres ne sont PAS inventés : chaque scénario passe par la vraie chaîne XP de
// src/lib/xp.js (gateXp puis settleXp, comme applyXpGates/addXp dans App.jsx). explainXp
// refait les étapes une à une avec les fonctions pures exportées pour obtenir le détail
// affichable, puis vérifie qu'il retombe exactement sur gateXp/settleXp (console.warn sinon).
// Au câblage, ce détail deviendra le retour de gateXp/settleXp (+ test), pas une copie.
import { gateXp, settleXp, accuracyGate, farmMult, isBoostedByEvents } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { getLevel } from "../../src/data/helpers.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { QUESTIONS } from "../../src/data/grammar.js";
import { VOCAB } from "../../src/data/vocab.js";
import { getTriggerLabel } from "../../src/lib/chestLabels.js";
import { LEAGUES } from "../../src/data/leagues.js";

// Jeudi 17 septembre 2026, 15 h locale : pas de bonus week-end, date fixe pour des chiffres stables.
export var NOW = new Date(2026, 8, 17, 15, 0, 0);
var TD = NOW.toISOString().split("T")[0];
var YD = (function () { var d = new Date(NOW.getTime()); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })();

function ms(c, t, s) { return { correct: c, total: t, sessions: s, lastDate: YD, history: [], catStats: {} }; }

function user(o) {
  var u = fresh("Camille", "idrac2026");
  Object.assign(u, {
    avatar: "chevalier", equippedTitle: "squire", equippedFrame: "gold_neon", tutorialPending: false, gdprConsent: true,
    joinedAt: "2026-09-01", lastActive: TD, streak: 4, xp: 5200, weeklyXp: 420, dailyModSessions: {},
    stats: { totalQ: 820, correct: 590, sessions: 64, cardsRev: 300, perfects: 6, drills: 20 },
    // Partie la plus faible = P3 : ni le Drill ni la Tavern ne prennent le bonus Focus par défaut.
    moduleScores: { drill: ms(118, 160, 16), lisP2: ms(70, 100, 10), lisP3: ms(20, 40, 5), tavern: ms(50, 75, 5), wordfam: ms(40, 60, 4) },
    mockResults: { mock1: { score: 30, total: 49, toeicEstimate: 340, date: YD } },
  });
  Object.assign(u, o || {});
  return u;
}

function drillMistakes(ids) {
  return ids.map(function (id) {
    var q = QUESTIONS.find(function (x) { return x.id === id; }) || QUESTIONS[0];
    return { tag: q.cat, prompt: q.s, yours: q.o[(q.c + 1) % q.o.length], correct: q.o[q.c], why: q.x };
  });
}
function tavernMistakes(n) {
  var cards = VOCAB[0].cards;
  return cards.slice(0, n).map(function (c, i) {
    return { tag: "Definition → word", prompt: c.d, yours: cards[(i + 3) % cards.length].w, correct: c.w, why: c.e, noBlank: true };
  });
}

var DRILL = { id: "drill", name: "Grammar Drill", icon: "ink-swirl" };
var TAVERN = { id: "tavern", name: "Word Tavern", icon: "beer-stein" };

export var SCENARIOS = [
  { id: "solid", label: "Drill 8/10 (cas courant)", mod: DRILL, sc: 8, tot: 10, base: 20 + 8 * 7,
    user: user({ xp: 5000, weeklyXp: 420, streak: 4 }), mistakes: drillMistakes(["g2", "g7"]) },
  { id: "perfect", label: "Drill 10/10 + Focus + niveau", mod: DRILL, sc: 10, tot: 10, base: 20 + 10 * 7,
    user: user({ xp: 5340, weeklyXp: 300, streak: 4, moduleScores: { drill: ms(60, 120, 12), lisP2: ms(80, 100, 10), lisP3: ms(34, 40, 5), tavern: ms(60, 75, 5) } }),
    mistakes: [] },
  { id: "struggle", label: "Drill 2/10 (porte de précision)", mod: DRILL, sc: 2, tot: 10, base: 20 + 2 * 7,
    user: user({ xp: 5100, weeklyXp: 250, streak: 1 }), mistakes: drillMistakes(["g1", "g3", "g4", "g5", "g6", "g8", "g9", "g10"]) },
  { id: "farming", label: "Tavern 12/15, 3e partie du jour", mod: TAVERN, sc: 12, tot: 15, base: 20 + 12 * 6,
    user: user({ xp: 5250, weeklyXp: 480, streak: 4, dailyModSessions: { ["tavern_" + TD]: 2 } }), mistakes: tavernMistakes(3) },
  { id: "promotion", label: "Drill 9/10 + ligue Gold + streak 7", mod: DRILL, sc: 9, tot: 10, base: 20 + 9 * 7,
    user: user({ xp: 5150, weeklyXp: 560, streak: 6, lastActive: YD }), mistakes: drillMistakes(["g12"]) },
];

function ordinal(n) { return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th"; }
function cleanBonus(label) {
  var s = label.replace(/[^\x20-\x7E]/g, "").trim();
  var streak = /^Streak x[\d.]+ \((\d+)d\)/.exec(s);
  if (streak) return "Streak " + streak[1] + " days";
  return s.replace(/\s*x[\d.]+\s*/, " ").trim();
}

export function explainXp(s) {
  var u = s.user, base = s.base, sc = s.sc, tot = s.tot, modId = s.mod.id, events = [];
  var lines = [{ kind: "base", label: "Base", detail: sc + " correct", value: base }];
  var x = accuracyGate(base, sc, tot);
  if (x !== base) {
    var acc = sc / tot;
    lines.push({ kind: "malus", label: acc < 0.3 ? "Accuracy under 30%" : "Accuracy under 50%", detail: acc < 0.3 ? "×0.1" : "×0.5", value: x,
      hint: "Score 50% or more for full XP" });
  }
  if (!isBoostedByEvents(modId, events)) {
    var n = (u.dailyModSessions || {})[modId + "_" + TD] || 0;
    var m = farmMult(modId, n);
    if (m !== 1) {
      x = Math.round(x * m);
      lines.push({ kind: "malus", label: ordinal(n + 1) + " run today", detail: "×" + m, value: x,
        hint: "Full XP again tomorrow, or on another module today" });
    }
  }
  // Focus : computeTodayFocus a disparu avec le plan du jour figé (2026-09-18, ctx.focusPart de gateXp) ; le
  // banc n'injecte pas de plan, donc pas de +25 % ici (gateXp non plus : pas de divergence).

  var g = gateXp(base, sc, tot, modId, { u: u, now: NOW, events: events });
  if (g.xp !== x) console.warn("[victory] gateXp diverge :", g.xp, "≠", x);
  var st = settleXp(u, g.xp, { now: NOW, events: events, classMedianXp: 0, leagueOf: getLeague });

  var v = g.xp;
  st.toast.bonuses.forEach(function (b) {
    if (/daily login/.test(b.label)) { v = Math.round(v) + 10; lines.push({ kind: "bonus", label: "First session today", detail: "+10", value: v }); return; }
    var mm = /x([\d.]+)/.exec(b.label);
    if (mm) { v = v * parseFloat(mm[1]); lines.push({ kind: "bonus", label: cleanBonus(b.label), detail: "×" + mm[1], value: Math.round(v) }); }
  });
  var last = lines[lines.length - 1];
  if (last.value !== st.amt) { console.warn("[victory] settleXp diverge :", st.amt, "≠", last.value); last.value = st.amt; }

  var TIER = { novice: 0, guerrier: 1, champion: 2, legendaire: 3 };
  return {
    lines: lines, total: st.amt,
    fromXp: u.xp, toXp: st.c.xp, levelUp: st.levelUp,
    leagueUp: st.leagueUp ? { from: LEAGUES.find(function (l) { return l.id === st.leagueUp.from; }), to: LEAGUES.find(function (l) { return l.id === st.leagueUp.to; }) } : null,
    weekly: { from: u.weeklyXp, to: st.c.weeklyXp },
    nextLeague: LEAGUES.find(function (l) { return l.min > st.c.weeklyXp; }) || null,
    chests: st.chests.map(function (ch) { return { type: ch.type, tier: TIER[ch.type] || 0, label: getTriggerLabel(ch.trigger) }; }),
    streak: st.c.streak,
    levelAfter: getLevel(st.c.xp),
  };
}
