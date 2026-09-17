// Proto « mémoire du Mentor » — trois élèves fictifs, SIMULÉS jour par jour (pas écrits à la main) :
// sessions réelles du journal, erreurs tirées dans les vraies banques de questions, chasses du
// bestiaire selon l'assiduité, réussite selon la précision récente. Tout ce que disent les écrans
// est calculé par model.js et voice.js sur ces profils. Générateur déterministe (graine par élève).
import { fresh } from "../../src/lib/profileSchema.js";
import { QUESTIONS } from "../../src/data/grammar.js";
import { LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";
import {
  NOW, day, addDays, newReview, reviewMiss, reviewHit, dueItems, planToday, composeSession,
  partSeries, catSeries, windowAcc, lifetime, estimateAt, turnaround, allCats, huntReward,
} from "./model.js";

function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

export var SPECS = {
  lea: {
    id: "lea", name: "Léa", seed: 11, joined: "2026-09-01", xp: 4180, streak: 19, diligence: 0.7, pick: "due-hit",
    goal: { score: 785, date: "2026-11-06" },
    story: "Vise 785 le 6 novembre. Très à l'aise à l'écoute, la Part 7 lui coûte le plus de points ; conditionnels fragiles ; chasse ses erreurs la plupart des jours sans venir à bout de ses échéances.",
    scan: { date: "2026-09-01", scores: { grammar: 3, vocab: 4, reading: 3, listening: 4 }, total: 14, tier: "Skilled Fighter",
      subScores: { grammarMacros: { verbs: 0.5, linking: 0.7, forms: 0.72, reference: 0.66 }, parts: { p1: 0.83, p2: 0.8, p3: 0.72, p4: 0.7, p6: 0.6, p7: 0.55 } },
      sectionAcc: { grammar: 0.62, vocab: 0.7, reading: 0.57, listening: 0.76 } },
    journal: [
      ["09-02", "lisP2", 8, 10], ["09-02", "drill", 6, 10, "Conditionals:1/3,Tenses:2/2,Prepositions:2/3,Word Families:1/2"],
      ["09-03", "lisP3", 7, 9], ["09-04", "p7", 5, 9], ["09-05", "lisP2", 9, 10],
      ["09-05", "drill", 6, 10, "Conditionals:1/2,Passive Voice:2/3,Connectors:2/2,Articles:1/3"],
      ["09-06", "lisP4", 6, 9], ["09-07", "p6", 8, 12], ["09-08", "p7", 6, 10], ["09-09", "lisP2", 8, 10],
      ["09-09", "drill", 7, 10, "Conditionals:1/3,Relative Pronouns:2/2,Collocations:2/3,Comparatives:2/2"],
      ["09-10", "lisP3", 8, 9], ["09-11", "p7", 5, 9], ["09-12", "lisP2", 9, 10],
      ["09-13", "drill", 7, 10, "Conditionals:2/4,Pronouns:2/2,Subject-Verb Agreement:2/2,Parallel Structure:1/2"],
      ["09-14", "p7", 6, 10], ["09-14", "mock1", 64, 100], ["09-15", "lisP4", 7, 9], ["09-16", "lisP3", 7, 9],
      ["09-16", "drill", 7, 10, "Conditionals:1/3,Gerunds vs Infinitives:3/3,Prepositions:2/2,Word Families:1/2"],
      ["09-17", "p7", 7, 9], ["09-18", "p6", 9, 12], ["09-19", "lisP3", 8, 9],
      ["09-19", "drill", 8, 10, "Conditionals:2/3,Quantifiers & Determiners:2/3,Tenses:2/2,Connectors:2/2"],
      ["09-20", "p7", 9, 11],
    ],
  },
  karim: {
    id: "karim", name: "Karim", seed: 3, joined: "2026-09-01", xp: 3650, streak: 9, diligence: 1, huntDays: ["09-06", "09-09", "09-14"],
    play: "stake", pick: "eased-hit",
    goal: null,
    story: "Pas d'objectif fixé. Arrivé avec des conditionnels à 20 %, les a travaillés trois semaines : ils tiennent. Les pronoms relatifs deviennent son point faible. Chasse ses erreurs presque chaque jour.",
    scan: { date: "2026-09-01", scores: { grammar: 2, vocab: 3, reading: 4, listening: 4 }, total: 13, tier: "Skilled Fighter",
      subScores: { grammarMacros: { verbs: 0.35, linking: 0.62, forms: 0.7, reference: 0.45 }, parts: { p1: 0.8, p2: 0.78, p3: 0.7, p4: 0.66, p6: 0.64, p7: 0.72 } },
      sectionAcc: { grammar: 0.5, vocab: 0.66, reading: 0.68, listening: 0.73 } },
    journal: [
      ["09-01", "drill", 5, 10, "Conditionals:0/3,Tenses:2/2,Prepositions:2/3,Articles:1/2"],
      ["09-02", "lisP2", 8, 10],
      ["09-03", "drill", 5, 10, "Conditionals:1/4,Relative Pronouns:1/2,Connectors:2/2,Word Families:1/2"],
      ["09-04", "p7", 8, 9],
      ["09-05", "drill", 6, 10, "Conditionals:1/3,Passive Voice:2/2,Relative Pronouns:1/3,Comparatives:2/2"],
      ["09-07", "lisP3", 7, 9],
      ["09-08", "drill", 6, 10, "Conditionals:2/4,Pronouns:2/2,Relative Pronouns:1/2,Collocations:1/2"],
      ["09-10", "drill", 7, 10, "Conditionals:2/3,Tenses:2/2,Relative Pronouns:1/3,Prepositions:2/2"],
      ["09-11", "p7", 8, 9], ["09-12", "lisP2", 9, 10],
      ["09-13", "drill", 7, 10, "Conditionals:3/4,Relative Pronouns:1/3,Articles:2/2,Word Families:1/1"],
      ["09-15", "drill", 8, 10, "Conditionals:3/3,Relative Pronouns:2/4,Gerunds vs Infinitives:2/2,Connectors:1/1"],
      ["09-16", "lisP3", 8, 9],
      ["09-17", "drill", 7, 10, "Conditionals:3/4,Relative Pronouns:1/3,Parallel Structure:2/2,Subject-Verb Agreement:1/1"],
      ["09-18", "p7", 9, 10],
      ["09-19", "drill", 8, 10, "Conditionals:4/4,Relative Pronouns:2/3,Quantifiers & Determiners:1/2,Tenses:1/1"],
      ["09-20", "lisP4", 9, 9],
    ],
  },
  ines: {
    id: "ines", name: "Inès", seed: 5, joined: "2026-09-18", xp: 420, streak: 3, diligence: 1, huntDays: ["09-20"], pick: "fresh-miss",
    goal: null,
    story: "Arrivée vendredi (4e jour). Battle Scan : verbes et Part 3 faibles. Deux sessions et deux chasses : l'appli sait peu de choses, et doit le dire.",
    scan: { date: "2026-09-18", scores: { grammar: 2, vocab: 3, reading: 3, listening: 3 }, total: 11, tier: "Apprentice",
      subScores: { grammarMacros: { verbs: 0.4, linking: 0.58, forms: 0.62, reference: 0.55 }, parts: { p1: 0.75, p2: 0.62, p3: 0.5, p4: 0.55, p6: 0.58, p7: 0.52 } },
      sectionAcc: { grammar: 0.48, vocab: 0.55, reading: 0.54, listening: 0.6 } },
    journal: [
      ["09-18", "drill", 5, 10, "Tenses:1/2,Passive Voice:1/2,Prepositions:2/3,Word Families:1/3"],
      ["09-19", "lisP2", 7, 10],
    ],
  },
};

// ── Banques de questions (références, jamais de texte) ──
var POOLS = {
  lisP2: LISTENING_P2.map(function (x) { return "lisP2:" + x.id; }),
  lisP3: [].concat.apply([], LISTENING_P3.map(function (x) { return x.qs.map(function (q, i) { return "lisP3:" + x.id + ":" + i; }); })),
  lisP4: [].concat.apply([], LISTENING_P4.map(function (x) { return x.qs.map(function (q, i) { return "lisP4:" + x.id + ":" + i; }); })),
  p7: [].concat.apply([], PART7_PASSAGES.map(function (x) { return x.questions.map(function (q, i) { return "p7:" + x.id + ":" + i; }); })),
};
var CAT_POOL = {};
QUESTIONS.forEach(function (q) { (CAT_POOL[q.cat] = CAT_POOL[q.cat] || []).push("drill:" + q.id); });

function entry(j) {
  var cs = null;
  if (j[4]) {
    cs = {};
    j[4].split(",").forEach(function (p) { var m = p.split(":"), ct = m[1].split("/"); cs[m[0]] = { c: +ct[0], t: +ct[1] }; });
    var c = 0, t = 0;
    Object.keys(cs).forEach(function (k) { c += cs[k].c; t += cs[k].t; });
    if (c !== j[2] || t !== j[3]) console.warn("[mentor-memory] catStats incohérents :", j);
  }
  return { d: "2026-" + j[0], mod: j[1], c: j[2], t: j[3], cs: cs };
}

// Même agrégat que recordModule, avec en plus les catStats de la session dans history (proposition).
function record(u, e) {
  var ms = u.moduleScores;
  var prev = ms[e.mod] || { correct: 0, total: 0, sessions: 0, lastDate: null, history: [], catStats: {} };
  var h = { date: e.d, correct: e.c, total: e.t };
  if (e.cs) h.cs = e.cs;
  prev.history.push(h);
  prev.correct += e.c; prev.total += e.t; prev.sessions++; prev.lastDate = e.d;
  if (e.cs) Object.keys(e.cs).forEach(function (c) {
    var p = prev.catStats[c] || { correct: 0, total: 0 };
    prev.catStats[c] = { correct: p.correct + e.cs[c].c, total: p.total + e.cs[c].t };
  });
  ms[e.mod] = prev;
  if (u.stats) {
    u.stats.totalQ += e.t; u.stats.correct += e.c; u.stats.sessions++;
    if (e.mod === "drill") u.stats.drills++;
    if (e.c === e.t) u.stats.perfects++;
  }
  if (e.mod === "mock1") u.mockResults.mock1 = { date: e.d, score: e.c, total: e.t, mockId: 1 };
}
// Les erreurs d'une session du journal entrent dans le bestiaire (parfois une créature déjà là).
function catchMisses(u, e, rnd) {
  var misses = [];
  if (e.cs) Object.keys(e.cs).forEach(function (c) { for (var i = 0; i < e.cs[c].t - e.cs[c].c; i++) misses.push(CAT_POOL[c]); });
  else if (POOLS[e.mod]) for (var i = 0; i < e.t - e.c; i++) misses.push(POOLS[e.mod]);
  misses.forEach(function (pool) {
    var inPool = {};
    pool.forEach(function (k) { inPool[k] = 1; });
    var lurking = u.review.items.filter(function (x) { return inPool[x.k]; });
    var dueHere = lurking.filter(function (x) { return x.due <= e.d; });
    var k;
    // Parfois l'élève retombe sur une créature déjà à échéance (le Drill glisse les erreurs dues).
    if (dueHere.length && rnd() < 0.1) k = dueHere[Math.floor(rnd() * dueHere.length)].k;
    else {
      var taken = {};
      lurking.forEach(function (x) { taken[x.k] = 1; });
      var free = pool.filter(function (x) { return !taken[x]; });
      k = free[Math.floor(rnd() * free.length)];
    }
    reviewMiss(u.review, k, e.d);
  });
}
// Probabilité de réussir une question : précision des 10 derniers jours sur sa catégorie ou sa partie.
function skillAcc(u, cat, part, d) {
  var s = cat ? catSeries(u, cat) : partSeries(u, part);
  var w = windowAcc(s, addDays(d, -10), d);
  if (w.t >= 5) return w.acc;
  var l = lifetime(s);
  if (l.acc != null) return l.acc;
  var bs = u.battleScan && u.battleScan.subScores;
  return (bs && part && bs.parts && bs.parts[part]) || 0.55;
}
function hitProb(u, it, d) { return clamp(skillAcc(u, it.cat, it.part, d) + 0.12 + 0.05 * it.box, 0.2, 0.95); }

function hunt(u, d, rnd) {
  var due = dueItems(u, d).slice(0, 10), hits = 0, cs = {};
  var res = due.map(function (it) {
    var ok = rnd() < hitProb(u, it, d);
    if (it.cat) { var s = cs[it.cat] || { c: 0, t: 0 }; cs[it.cat] = { c: s.c + (ok ? 1 : 0), t: s.t + 1 }; }
    if (ok) { hits++; return { k: it.k, r: reviewHit(u.review, it.k, d) }; }
    reviewMiss(u.review, it.k, d);
    return { k: it.k, r: "miss" };
  });
  if (due.length) record(u, { d: d, mod: "review", c: hits, t: due.length, cs: Object.keys(cs).length ? cs : null });
  return res;
}

function simulate(spec) {
  var rnd = rng(spec.seed);
  var u = fresh(spec.name, "idrac2026");
  Object.assign(u, {
    joinedAt: spec.joined, xp: spec.xp, streak: spec.streak, lastActive: addDays(day(NOW), -1), weeklyXp: 0,
    targetToeic: spec.goal ? spec.goal.score : null, targetDate: spec.goal ? spec.goal.date : null,
    battleScan: spec.scan, narrator: { heard: ["mentor_intro"], muted: false }, tutorialPending: false,
    gdprConsent: spec.joined, review: newReview(), celebrated: [], mockResults: {},
  });
  var journal = spec.journal.map(entry);
  var end = addDays(day(NOW), -1);
  for (var d = spec.joined; d <= end; d = addDays(d, 1)) {
    var todays = journal.filter(function (e) { return e.d === d; });
    var active = todays.length || (spec.huntDays || []).indexOf(d.slice(5)) >= 0;
    if (active && dueItems(u, d).length && rnd() < spec.diligence) hunt(u, d, rnd);
    todays.forEach(function (e) { record(u, e); catchMisses(u, e, rnd); });
  }
  return { u: u, rnd: rnd, journal: journal };
}

// Estimation au soir de chaque dimanche (en prod : table weekly_snapshots).
function snapshots(spec, journal) {
  var out = [], d = spec.joined;
  while (new Date(d).getDay() !== 0) d = addDays(d, 1);
  for (; d < day(NOW); d = addDays(d, 7)) {
    var u = { moduleScores: {}, mockResults: {} }, upTo = d;
    journal.filter(function (e) { return e.d <= upTo; }).forEach(function (e) { record(u, e); });
    out.push({ d: d, toeic: estimateAt(u) });
  }
  return out;
}

// Joue la session composée par le planificateur, question par question, et rend l'état « après ».
function playToday(before, comp, rnd) {
  var u = JSON.parse(JSON.stringify(before)), d = day(NOW);
  var results = comp.questions.map(function (q) {
    var p = q.role === "due" ? hitProb(u, q.item, d) : clamp(skillAcc(u, q.cat, q.part, d) + (q.role === "eased" ? 0.05 : 0), 0.15, 0.95);
    return { q: q, ok: rnd() < p };
  });
  var out = { kind: comp.kind, results: results, slain: [], hits: [], escaped: [], fresh: [] };
  var sc = 0, cs = {};
  results.forEach(function (r) {
    var q = r.q, k = q.k;
    if (r.ok) sc++;
    if (q.cat) { var s = cs[q.cat] || { c: 0, t: 0 }; cs[q.cat] = { c: s.c + (r.ok ? 1 : 0), t: s.t + 1 }; }
    if (q.role === "due") {
      if (r.ok) { var rr = reviewHit(u.review, k, d); (rr === "slain" ? out.slain : out.hits).push(k); }
      else { reviewMiss(u.review, k, d); out.escaped.push(k); }
    } else if (!r.ok) { reviewMiss(u.review, k, d); out.fresh.push(k); }
  });
  var modId = comp.kind === "hunt" ? "review" : "drill";
  var prevHist = (u.moduleScores[modId] && u.moduleScores[modId].history) || [];
  out.prevBest = prevHist.reduce(function (m, h) { return Math.max(m, h.total ? h.correct / h.total : 0); }, -1);
  out.prevRuns = prevHist.length;
  record(u, { d: d, mod: modId, c: sc, t: results.length, cs: Object.keys(cs).length ? cs : null });
  u.lastActive = d; u.streak++;
  out.modId = modId; out.sc = sc; out.tot = results.length;
  out.base = comp.kind === "hunt" ? huntReward(out.slain.length).xp : 20 + 7 * sc;
  out.darics = comp.kind === "hunt" ? huntReward(out.slain.length).darics : 0;
  // Cérémonie : un retournement devenu éligible aujourd'hui, sur une catégorie jouée dans la session.
  out.ceremony = null;
  Object.keys(cs).forEach(function (c) {
    if (out.ceremony || u.celebrated.indexOf(c) >= 0) return;
    var tr = turnaround(catSeries(u, c));
    if (tr && tr.eligible) { out.ceremony = { cat: c, turn: tr }; u.celebrated.push(c); }
  });
  out.mistakes = results.filter(function (r) { return !r.ok; }).map(function (r) {
    var q = r.q, wrong = q.options.findIndex(function (o, i) { return i !== q.c; });
    return { tag: q.label, prompt: q.prompt, yours: q.options[wrong], correct: q.options[q.c], why: q.why };
  });
  return { u: u, outcome: out };
}

var CACHE = {};
export function buildPersona(id) {
  if (CACHE[id]) return CACHE[id];
  var spec = SPECS[id] || SPECS.lea;
  var sim = simulate(spec), before = sim.u;
  var snaps = snapshots(spec, sim.journal);
  var plan = planToday(before, NOW);
  // La session jouée : la quête choisie par l'élève (spec.play), sinon la première que le proto sait
  // composer (chasse ou drill). Le plan propose, l'élève dispose.
  var composable = function (q) { return q.mod === "review" || q.mod === "drill"; };
  var quest = plan.quests.find(function (q) { return composable(q) && (!spec.play || q.kind === spec.play); }) || plan.quests.find(composable);
  var comp = composeSession(before, NOW, plan, sim.rnd, quest);
  var played = playToday(before, comp, sim.rnd);
  // Question montrée dans le storyboard, selon l'histoire de l'élève.
  var res = played.outcome.results;
  var tests = {
    "due-hit": function (r) { return r.q.role === "due" && r.q.mod === "drill" && r.ok; },
    "eased-hit": function (r) { return r.q.role === "eased" && r.ok; },
    "fresh-miss": function (r) { return r.q.role !== "due" && r.q.mod === "drill" && !r.ok; },
  };
  var qIndex = res.findIndex(tests[spec.pick] || function () { return false; });
  if (qIndex < 0) qIndex = res.findIndex(function (r) { return r.q.mod === "drill"; });
  if (qIndex < 0) qIndex = 0;
  CACHE[id] = { id: spec.id, spec: spec, before: before, after: played.u, plan: plan, comp: comp, outcome: played.outcome, snaps: snaps, qIndex: qIndex };
  return CACHE[id];
}
export var PERSONA_IDS = ["lea", "karim", "ines"];
export { allCats };
