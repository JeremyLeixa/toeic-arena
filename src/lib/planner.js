// Plan du jour (2026-09-17, proto prototypes/mentor-memory/). PUR. Testé par tests/check_planner.cjs.
//
// POURQUOI CE MODULE. Il y avait quatre recommandeurs qui se contredisaient le même jour :
// getDailyMission (par module), computeTodayFocus (par partie), NextStepReco (par partie, hors module
// courant) et generateInsight (par module ≥ 20 Q). L'élève recevait trois « ta priorité » différentes.
// Ici, un seul critère : les POINTS TOEIC EN JEU (lib/learnerModel.js), avec deux règles autour :
//   1. les erreurs arrivées à échéance d'abord (c'est court, et l'espacement ne supporte pas l'attente) ;
//   2. l'entretien d'une partie forte laissée de côté (la mémoire s'efface).
// La 1re quête EST la mission du jour (+15 XP) ; la quête « enjeu » porte le +25 % de l'ancien Focus.
// Le plan est figé une fois par jour dans u.mission (dayMission) : c'est cette copie que lisent le
// Mentor, Home, les onglets, NextStepReco et les portes XP, jamais un recalcul.
import { today } from "./util.js";
import { QUESTIONS } from "../data/grammar.js";
import {
  PARTS, PART_MOD, PART_ICON, TOEIC_Q, MACROS, addDays, daysBetween, stakes, targetAcc, weakestCat,
  catState, catSeries, partSeries, windowAcc, allCats, trainedSessions, PART_SHORT, firstCross,
  weakestLifetimeCat, turnaround,
} from "./learnerModel.js";
import { dueItems, huntQueue, HUNT_CAP, newReview } from "./review.js";

export var HUNT_MIN = 4;   // échéances à partir desquelles la chasse devient une quête à part
export var COLD_SESSIONS = 5; // sessions d'entraînement sous lesquelles on part du Battle Scan
export var KEEP_DAYS = 7;  // jours sans pratique avant de proposer l'entretien d'une partie forte
export var KEEP_ACC = 0.75;

// Rend {quests:[…], due, folded, stakes, cold, tgt}. Les quêtes sont ordonnées : chasse, enjeu, entretien.
export function planToday(u, now) {
  var d = today(now), due = dueItems(u, now), st = stakes(u, now);
  var cold = trainedSessions(u) < COLD_SESSIONS, quests = [];
  if (due.length >= HUNT_MIN) quests.push({ kind: "hunt", mod: "hunt", n: Math.min(HUNT_CAP, due.length), due: due.length });
  if (cold) {
    var sm = (u && u.battleScan && u.battleScan.subScores && u.battleScan.subScores.grammarMacros) || {};
    var weakMacro = null;
    Object.keys(sm).forEach(function (k) { if (!weakMacro || sm[k] < sm[weakMacro]) weakMacro = k; });
    var weakPart = st.filter(function (s) { return s.source === "scan" && s.part !== "p5"; }).sort(function (a, b) { return a.acc - b.acc; })[0];
    if (weakMacro && (!weakPart || sm[weakMacro] <= weakPart.acc)) {
      quests.push({ kind: "confirm", mod: "drill", part: "p5", macro: MACROS.find(function (x) { return x.id === weakMacro; }), scanAcc: sm[weakMacro] });
    } else if (weakPart) {
      quests.push({ kind: "confirm", mod: PART_MOD[weakPart.part], part: weakPart.part, scanAcc: weakPart.acc });
    }
    var aimed = quests.length ? quests[quests.length - 1].part : null;
    var fresh = st.filter(function (s) { return s.sessions === 0 && s.part !== "p1" && s.part !== "p5" && s.part !== aimed; })
      .sort(function (a, b) { return TOEIC_Q[b.part] - TOEIC_Q[a.part]; })[0];
    if (fresh) quests.push({ kind: "explore", mod: PART_MOD[fresh.part], part: fresh.part });
  } else {
    var top = st.find(function (s) { return s.pts > 0 && s.source === "trained"; });
    if (top) {
      var q = { kind: "stake", mod: PART_MOD[top.part], part: top.part, pts: top.pts, acc: top.acc, tgt: top.tgt, n: top.n, life: top.life };
      if (top.part === "p5") { var wc = weakestCat(u, now); if (wc) q.cat = wc; }
      quests.push(q);
    }
    var keep = st.filter(function (s) {
      return s.source === "trained" && s.acc >= KEEP_ACC && s.last && daysBetween(s.last, d) >= KEEP_DAYS && (!top || s.part !== top.part);
    }).sort(function (a, b) { return daysBetween(b.last, d) - daysBetween(a.last, d); })[0];
    if (keep) quests.push({ kind: "keep", mod: PART_MOD[keep.part], part: keep.part, days: daysBetween(keep.last, d), acc: keep.acc });
  }
  return { quests: quests.slice(0, 3), due: due, folded: due.length < HUNT_MIN ? due : [], stakes: st, cold: cold, tgt: targetAcc(u), date: d };
}

// ── La journée figée (lot 4, 2026-09-18) ──
// Le plan est calculé UNE fois par jour et rangé dans u.mission (jsonb existant, aucune migration).
// Recalculé à chaque ouverture, il bougeait sous les yeux de l'élève : une chasse finie disparaissait
// du plan, l'étiquette « +15 XP » glissait sur une autre quête, le +25 % changeait de partie en cours de
// journée. Figé, il se coche. `pick` = l'index de la quête qui porte la mission (0, sauf re-tirage).
// On ne garde que des primitives : la catégorie et la macro se réhydratent à la lecture (thawQuest).
function freezeQuest(q) {
  var f = { kind: q.kind, mod: q.mod };
  ["part", "n", "due", "pts", "acc", "days", "scanAcc"].forEach(function (k) { if (q[k] != null) f[k] = q[k]; });
  if (q.cat) f.cat = q.cat.cat;
  if (q.macro) f.macro = q.macro.id;
  return f;
}
export function thawQuest(q, u, now) {
  var t = Object.assign({}, q);
  if (q.cat) t.cat = catState(u, q.cat, now);
  if (q.macro) t.macro = MACROS.find(function (x) { return x.id === q.macro; }) || null;
  return t;
}
// La mission du jour, depuis le plan. Garde la série (streak, lastDoneDate : coffre mission_streak).
// Jour du déploiement : une mission de l'ancien système (sans `quests`) déjà faite aujourd'hui reste
// faite, sinon ses +15 XP tomberaient une seconde fois.
export function dayMission(u, now) {
  var plan = planToday(u, now), quests = plan.quests.map(freezeQuest), prev = (u && u.mission) || {};
  var doneToday = prev.date === plan.date && !!prev.done;
  return Object.assign({}, prev, {
    date: plan.date, quests: quests, pick: 0, cold: plan.cold,
    actId: quests.length ? quests[0].mod : null, done: doneToday, rerollCount: 0,
  });
}
// La mission de u si elle est d'aujourd'hui (et issue du plan), sinon null.
export function todayMission(u, now) {
  var m = u && u.mission;
  return m && m.date === today(now) && m.quests ? m : null;
}
// Partie de la quête d'enjeu figée : c'est elle qui porte le +25 % (lib/xp.js, ctx.focusPart).
export function stakePart(u, now) {
  var m = todayMission(u, now), q = m && m.quests.find(function (x) { return x.kind === "stake"; });
  return q ? q.part : null;
}
// Une quête est faite quand son module a été joué aujourd'hui ; celle qui porte la mission, quand la
// mission est faite (checkMission, lib/progress.js).
export function questDone(u, m, i, now) {
  if (i === m.pick) return !!m.done;
  return (((u && u.dailyModSessions) || {})[m.quests[i].mod + "_" + today(now)] || 0) > 0;
}
// Jeton daily_reroll : la mission passe sur la quête suivante, l'ordre du plan ne bouge pas. null
// quand il n'y a rien à re-tirer (une seule quête, ou mission déjà faite) : le jeton n'est pas consommé.
export function rerollMission(m) {
  if (!m || m.done || !m.quests || m.quests.length < 2) return null;
  var pick = ((m.pick || 0) + 1) % m.quests.length;
  return Object.assign({}, m, { pick: pick, actId: m.quests[pick].mod, rerollCount: (m.rerollCount || 0) + 1 });
}

// Composition d'une session. `rnd` : générateur injecté (Math.random par défaut) pour des tests stables.
// - chasse : la file du bestiaire, groupes gardés ensemble ;
// - drill : la catégorie visée, la catégorie « méritée » allégée, les erreurs dues glissées, le reste mêlé.
export function composeSession(u, now, plan, quest, rnd) {
  quest = quest || plan.quests[0];
  rnd = rnd || Math.random;
  if (!quest) return null;
  if (quest.kind === "hunt") return { kind: "hunt", quest: quest, items: huntQueue(u, now) };
  var lurking = {};
  (((u && u.review) || {}).items || []).forEach(function (x) { if (x.k.indexOf("drill:") === 0) lurking[x.k.slice(6)] = 1; });
  var folded = plan.folded.filter(function (x) { return x.k.indexOf("drill:") === 0; }).slice(0, 2);
  var focus = null, focusCats;
  if (quest.kind === "confirm" && quest.macro) focusCats = quest.macro.subcats;
  else { focus = quest.cat || weakestCat(u, now) || weakestLifetimeCat(u, now); focusCats = focus ? [focus.cat] : []; }
  // Catégorie « méritée » : un retournement confirmé ou presque → moins de questions, et on le dit.
  var eased = allCats().map(function (c) { return catState(u, c, now); })
    .filter(function (s) { return s.turn && (s.turn.eligible || s.turn.near) && focusCats.indexOf(s.cat) < 0; })[0] || null;
  var used = {};
  folded.forEach(function (x) { used[x.k.slice(6)] = 1; });
  function draw(filter, n) {
    var pool = QUESTIONS.filter(function (q) { return !used[q.id] && !lurking[q.id] && filter(q); }), out = [];
    while (out.length < n && pool.length) {
      var q = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      used[q.id] = 1; out.push(q);
    }
    return out;
  }
  var fq = draw(function (q) { return focusCats.indexOf(q.cat) >= 0; }, 4);
  var eq = eased ? draw(function (q) { return q.cat === eased.cat; }, 2) : [];
  var mq = draw(function (q) { return focusCats.indexOf(q.cat) < 0 && (!eased || q.cat !== eased.cat); }, 10 - folded.length - fq.length - eq.length);
  var slots = {
    focus: fq.map(function (q) { return { role: "focus", q: q }; }),
    eased: eq.map(function (q) { return { role: "eased", q: q }; }),
    mixed: mq.map(function (q) { return { role: "mixed", q: q }; }),
    due: folded.map(function (it) { return { role: "due", item: it, id: it.k.slice(6) }; }),
  };
  var order = ["focus", "due", "mixed", "focus", "eased", "mixed", "due", "focus", "mixed", "eased", "focus", "mixed", "mixed", "mixed"];
  var out = [];
  order.forEach(function (r) { if (out.length < 10 && slots[r].length) out.push(slots[r].shift()); });
  ["focus", "eased", "due", "mixed"].forEach(function (r) { while (out.length < 10 && slots[r].length) out.push(slots[r].shift()); });
  return { kind: "drill", quest: quest, focus: focus, focusCats: focusCats, macro: quest.macro || null, eased: eased, folded: folded, items: out };
}

// La manche du Drill (lot 5, 2026-09-18) : composée pour la quête du plan figé qui vise le Drill (enjeu
// Part 5 ou confirmation du Battle Scan), sinon pour la catégorie la plus faible. Les échéances glissées
// viennent du plan RECALCULÉ (dueItems du moment) : la chasse du matin a pu les faire tomber sous 4.
// Chaque élément porte sa question (`q`) ; une échéance dont la question a disparu de la banque est
// retirée plutôt que de casser la manche.
export function drillComposition(u, now, rnd) {
  var m = todayMission(u, now), fq = m && m.quests.find(function (q) { return q.mod === "drill"; });
  var quest = fq ? thawQuest(fq, u, now) : { kind: "stake", mod: "drill", part: "p5" };
  var comp = composeSession(u, now, planToday(u, now), quest, rnd);
  comp.items = comp.items.map(function (it) {
    return it.role === "due" ? Object.assign({}, it, { q: QUESTIONS.find(function (q) { return q.id === it.id; }) }) : it;
  }).filter(function (it) { return it.q; });
  return comp;
}

// ── Cérémonie « faiblesse devenue force » (lot 5) ──
// Une catégorie dont le retournement devient ÉLIGIBLE (learnerModel.turnaround : sous 55 % sur ses
// premières questions, au-dessus de 75 % dernièrement, 10 jours d'écart au moins) et pas encore célébrée.
// Une fois par catégorie : la liste vit dans le bestiaire (review.celebrated), dans la sauvegarde
// existante. Le plus grand écart d'abord. `spark` : les dernières sessions de la catégorie, pour le
// petit graphique de la cérémonie (up = dans la fenêtre « dernièrement »).
export function newTurn(u, now) {
  var done = ((u && u.review) || {}).celebrated || [], best = null;
  allCats().forEach(function (c) {
    if (done.indexOf(c) >= 0) return;
    var s = catSeries(u, c), t = turnaround(s);
    if (t && t.eligible && (!best || t.delta > best.turn.delta)) best = { cat: c, turn: t, series: s };
  });
  if (!best) return null;
  return {
    cat: best.cat, then: { c: best.turn.then.c, t: best.turn.then.t }, now: { c: best.turn.now.c, t: best.turn.now.t },
    spark: best.series.slice(-14).map(function (e) { return { acc: e.t ? e.c / e.t : 0, up: e.d >= best.turn.now.start }; }),
  };
}
// Marque la catégorie célébrée sur `u` (App() travaille sur une copie du profil) et rend la cérémonie.
export function celebrateTurn(u, now) {
  var t = newTurn(u, now);
  if (!t) return null;
  if (!u.review || !u.review.items) u.review = newReview();
  u.review.celebrated = (u.review.celebrated || []).concat([t.cat]);
  return t;
}

// ── La semaine écoulée (lettre du lundi) ──
export function weekFacts(u, now, snaps) {
  var d = today(now), from = addDays(d, -7), to = addDays(d, -1), prevFrom = addDays(d, -14), prevTo = addDays(d, -8);
  var sessions = 0, q = 0, days = {};
  Object.keys((u && u.moduleScores) || {}).forEach(function (id) {
    (u.moduleScores[id].history || []).forEach(function (h) { if (h.date >= from && h.date <= to) { sessions++; q += h.total; days[h.date] = 1; } });
  });
  function moves(seriesOf, keys, label) {
    return keys.map(function (k) {
      var s = seriesOf(k), a = windowAcc(s, from, to), b = windowAcc(s, prevFrom, prevTo);
      return { key: k, label: label(k), now: a, before: b, delta: a.t >= 10 && b.t >= 10 ? a.acc - b.acc : null };
    }).filter(function (x) { return x.delta !== null; });
  }
  var all = moves(function (p) { return partSeries(u, p); }, PARTS, function (p) { return PART_SHORT[p]; })
    .concat(moves(function (c) { return catSeries(u, c); }, allCats(), function (c) { return c; }));
  var sn = (snaps || []).filter(function (s) { return s.toeic != null; });
  return {
    from: from, to: to, sessions: sessions, questions: q, activeDays: Object.keys(days).length,
    up: all.filter(function (x) { return x.delta >= 0.1; }).sort(function (a, b) { return b.delta - a.delta; }),
    down: all.filter(function (x) { return x.delta <= -0.1; }).sort(function (a, b) { return a.delta - b.delta; }),
    est: sn.length >= 2 ? { from: sn[sn.length - 2].toeic, to: sn[sn.length - 1].toeic } : sn.length === 1 ? { from: null, to: sn[0].toeic } : null,
    turning: allCats().map(function (c) { return catState(u, c, now); }).filter(function (s) { return s.turn && (s.turn.near || s.turn.eligible); }),
  };
}
// Allure vers l'objectif, depuis les instantanés hebdomadaires de l'estimation (weekly_snapshots).
export function goalPace(u, now, snaps) {
  if (!u || !u.targetToeic || !u.targetDate) return null;
  var sn = (snaps || []).filter(function (s) { return s.toeic != null; });
  if (!sn.length) return { target: u.targetToeic, date: u.targetDate, current: null };
  var cur = sn[sn.length - 1].toeic, weeksLeft = Math.max(1, daysBetween(today(now), u.targetDate) / 7);
  var last = sn.length >= 2 ? sn[sn.length - 1].toeic - sn[sn.length - 2].toeic : null;
  var needed = (u.targetToeic - cur) / weeksLeft;
  return { target: u.targetToeic, date: u.targetDate, current: cur, weeksLeft: Math.round(weeksLeft), needed: needed, last: last, onTrack: last != null && last >= needed };
}

// ── La Chronique : des jalons DATÉS, tous reconstruits depuis les données déjà là (un élève actuel
// verra sa chronique remplie dès le premier jour). `snaps` : les instantanés hebdomadaires.
export function chronicleMilestones(u, now, snaps) {
  var out = [], d = today(now), bs = u && u.battleScan;
  if (bs) {
    var sa = bs.sectionAcc || {}, keys = Object.keys(sa).filter(function (k) { return typeof sa[k] === "number"; });
    keys.sort(function (a, b) { return sa[b] - sa[a]; });
    out.push({ d: bs.date || u.joinedAt, kind: "scan", icon: "compass",
      facts: keys.length ? { strong: keys[0], strongAcc: sa[keys[0]], weak: keys[keys.length - 1], weakAcc: sa[keys[keys.length - 1]] } : {} });
  }
  PARTS.forEach(function (p) {
    var x = firstCross(partSeries(u, p), 20, function (a) { return a >= 0.8; });
    if (x) out.push({ d: x.d, kind: "part80", icon: PART_ICON[p], facts: { part: p, c: x.c, t: x.t } });
  });
  allCats().forEach(function (c) {
    var s = catSeries(u, c);
    var weak = firstCross(s, 10, function (a) { return a < 0.5; });
    if (weak) out.push({ d: weak.d, kind: "weak", icon: "spider-web", facts: { cat: c, c: weak.c, t: weak.t } });
    var st = catState(u, c, now);
    var celebrated = ((u && u.review) || {}).celebrated || [];
    if (st.turn && st.turn.eligible && celebrated.indexOf(c) >= 0) {
      out.push({ d: st.turn.now.end, kind: "turn", icon: "laurel-crown", facts: { cat: c, then: st.turn.then, now: st.turn.now } });
    }
  });
  var mr = (u && u.mockResults) || {};
  Object.keys(mr).forEach(function (k) {
    var r = mr[k];
    if (r && r.date) out.push({ d: r.date, kind: "mock", icon: "scroll-unfurled", facts: { id: k, score: r.score, total: r.total } });
  });
  var firstEst = (snaps || []).find(function (s) { return s.toeic != null; });
  if (firstEst) out.push({ d: firstEst.d, kind: "estimate", icon: "star-formation", facts: { toeic: firstEst.toeic } });
  var slainLog = (((u && u.review) || {}).log || []).filter(function (l) { return l.e === "slain"; });
  [1, 10, 25, 50].forEach(function (n) {
    if (slainLog.length >= n) out.push({ d: slainLog[n - 1].d, kind: "slain", icon: "broadsword", facts: { n: n, k: slainLog[n - 1].k } });
  });
  if (u && u.targetToeic) out.push({ d: d, kind: "goal", icon: "path-distance", facts: { target: u.targetToeic, date: u.targetDate } });
  var order = { scan: 0, weak: 1, part80: 2, mock: 3, estimate: 4, slain: 5, turn: 6, goal: 7 };
  return out.filter(function (e) { return e.d && e.d <= d; })
    .sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : order[a.kind] - order[b.kind]; });
}
