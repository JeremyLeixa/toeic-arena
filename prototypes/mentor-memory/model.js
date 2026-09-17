// Proto « mémoire du Mentor » (2026-09-17) — modèle de l'apprenant, bestiaire des erreurs et
// planificateur. PUR : aucun JSX, aucun import impur (requérable en Node, comme lib/).
// Au câblage : lib/learnerModel.js (séries, maîtrise récente, retournements), lib/review.js
// (bestiaire), lib/planner.js (plan du jour, composition des sessions) + tests Node.
import { MODULE_TOEIC_MAP, estimateTOEICScore } from "../../src/lib/toeic.js";
import { QUESTIONS } from "../../src/data/grammar.js";
import { LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";
import { SCAN_GRAMMAR_MACROS } from "../../src/data/placement.js";

// Lundi 21 septembre 2026, 8 h 30 : l'instant simulé (lettre du lundi, plan du jour, session).
export var NOW = new Date(2026, 8, 21, 8, 30);

// ── Dates locales « YYYY-MM-DD » (pas today(), qui est en UTC) ──
function pad(n) { return (n < 10 ? "0" : "") + n; }
export function day(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
export function parseDay(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
export function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return day(d); }
export function daysBetween(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 864e5); }
export function fmtDay(s) { var d = parseDay(s); return d.getDate() + " " + ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"][d.getMonth()]; }
export function weekdayName(s) { return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parseDay(s).getDay()]; }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function pct(x) { return Math.round(x * 100); }

// ── Le TOEIC réel : questions par partie, points par question (échelle de section 5-495 sur 100 Q) ──
export var TOEIC_Q = { p1: 6, p2: 25, p3: 39, p4: 30, p5: 30, p6: 16, p7: 54 };
export var PTS_PER_Q = 4.9;
export var PARTS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
export var PART_LABEL = { p1: "Part 1 · Photographs", p2: "Part 2 · Question-Response", p3: "Part 3 · Conversations", p4: "Part 4 · Talks", p5: "Part 5 · Grammar", p6: "Part 6 · Text Completion", p7: "Part 7 · Reading" };
export var PART_SHORT = { p1: "Part 1", p2: "Part 2", p3: "Part 3", p4: "Part 4", p5: "Part 5", p6: "Part 6", p7: "Part 7" };
export var PART_MOD = { p1: "lisP1", p2: "lisP2", p3: "lisP3", p4: "lisP4", p5: "drill", p6: "p6", p7: "p7" };
export var PART_ICON = { p1: "spyglass", p2: "chat-bubble", p3: "conversation", p4: "public-speaker", p5: "ink-swirl", p6: "scroll-quill", p7: "eye-target" };
export var MODULE_NAME = { drill: "Grammar Drill", lisP1: "Part 1", lisP2: "Part 2", lisP3: "Part 3", lisP4: "Part 4", p6: "Part 6", p7: "Part 7", review: "Mistake Hunt", mock1: "Mock Test 1" };

// ── Réglages du modèle (chacun est une décision, voir README) ──
export var HALF_LIFE = 14;   // jours : une réponse d'il y a 14 jours pèse moitié moins qu'aujourd'hui
export var PRIOR_Q = 6;      // masse du prior en questions (même idée que PRIOR_K de l'estimateur)
export var PRIOR_ACC = 0.6;
export var MIN_EVID = 8;     // questions « effectives » avant de parler d'une partie ou d'une catégorie
export var BOX_DAYS = [1, 3, 7]; // bestiaire : ratée → demain ; puis 3 jours, 7 jours ; 3e réussite espacée = vaincue
// XP de la chasse (décision à valider, voir README) : payer la créature VAINCUE, rien pour une simple
// réussite. Rater exprès une question de Drill coûte 7 XP tout de suite ; la vaincre rapporte 5 XP au
// mieux 11 jours plus tard, après trois réussites espacées. Rater pour farmer est donc toujours perdant.
export var HUNT_BASE = 5, HUNT_PER_SLAIN = 5, DARICS_PER_SLAIN = 1, DRILL_XP_PER_Q = 7;
export function huntReward(slain) { return { xp: HUNT_BASE + HUNT_PER_SLAIN * slain, darics: DARICS_PER_SLAIN * slain }; }
export var HUNT_MIN = 4;     // erreurs à échéance à partir desquelles la chasse devient une quête (sinon glissées dans la session)
export var TURN = { thenMax: 0.55, nowMin: 0.75, thenQ: 10, nowQ: 12, gapDays: 10 };

// Les 4 macros du Battle Scan + les 3 catégories qui n'y figurent pas aujourd'hui (Lot 0).
export var MACROS = SCAN_GRAMMAR_MACROS.map(function (m) {
  var extra = { linking: ["Parallel Structure"], forms: ["Quantifiers & Determiners"], reference: ["Pronouns"] }[m.id] || [];
  return { id: m.id, label: m.label, icon: m.icon, subcats: m.subcats.concat(extra) };
});
export function macroOfCat(cat) { for (var i = 0; i < MACROS.length; i++) if (MACROS[i].subcats.indexOf(cat) >= 0) return MACROS[i]; return null; }

// ═══ Séries et maîtrise ═══
function byDate(a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }
export function partSeries(u, part) {
  var out = [], ms = u.moduleScores || {};
  Object.keys(ms).forEach(function (id) {
    var m = MODULE_TOEIC_MAP[id];
    if (!m || m.part !== part) return;
    (ms[id].history || []).forEach(function (h) { out.push({ d: h.date, c: h.correct, t: h.total, mod: id }); });
  });
  return out.sort(byDate);
}
// Proposition : chaque entrée de history garde ses catStats de session (cs), pas seulement le cumul.
// Toutes les sources SAUF la chasse du bestiaire : y réussir une question déjà vue (explication lue)
// prouve qu'on l'a retenue, pas qu'on maîtrise la catégorie. Les compter gonflait les retournements
// (constaté dans la simulation : pronoms relatifs « devenus une force » sur des questions revues).
export function catSeries(u, cat) {
  var ms = u.moduleScores || {}, out = [];
  Object.keys(ms).forEach(function (id) {
    if (id === "review") return;
    (ms[id].history || []).forEach(function (e) { var s = e.cs && e.cs[cat]; if (s && s.t) out.push({ d: e.date, c: s.c, t: s.t }); });
  });
  return out.sort(byDate);
}
export function lifetime(series) {
  var c = 0, t = 0;
  series.forEach(function (e) { c += e.c; t += e.t; });
  return { c: c, t: t, acc: t ? c / t : null };
}
// Maîtrise récente : pondération par l'âge (demi-vie) + retenue vers le prior.
export function mastery(series, now) {
  var today = day(now), sw = 0, sc = 0;
  series.forEach(function (e) { var w = Math.pow(0.5, daysBetween(e.d, today) / HALF_LIFE); sw += w * e.t; sc += w * e.c; });
  return { acc: (sc + PRIOR_Q * PRIOR_ACC) / (sw + PRIOR_Q), n: sw, raw: sw ? sc / sw : null };
}
export function windowAcc(series, from, to) {
  var c = 0, t = 0;
  series.forEach(function (e) { if (e.d >= from && e.d <= to) { c += e.c; t += e.t; } });
  return { c: c, t: t, acc: t ? c / t : null };
}
// « Au début » (premières ≥10 Q) contre « dernièrement » (dernières ≥12 Q), sans chevauchement.
export function turnaround(series) {
  if (!series.length) return null;
  var th = { c: 0, t: 0, start: series[0].d, end: null, i: -1 };
  for (var i = 0; i < series.length && th.t < TURN.thenQ; i++) { th.c += series[i].c; th.t += series[i].t; th.end = series[i].d; th.i = i; }
  var nw = { c: 0, t: 0, start: null, end: series[series.length - 1].d, i: series.length };
  for (var j = series.length - 1; j > th.i && nw.t < TURN.nowQ; j--) { nw.c += series[j].c; nw.t += series[j].t; nw.start = series[j].d; nw.i = j; }
  if (th.t < TURN.thenQ || nw.t < TURN.nowQ) return null;
  th.acc = th.c / th.t; nw.acc = nw.c / nw.t;
  var gap = daysBetween(th.end, nw.start);
  var shape = th.acc < TURN.thenMax && nw.acc >= TURN.nowMin;
  return { then: th, now: nw, gap: gap, delta: nw.acc - th.acc, eligible: shape && gap >= TURN.gapDays, near: shape && gap < TURN.gapDays };
}
// Première date où la série cumulée (≥ minQ) remplit le test.
export function firstCross(series, minQ, test) {
  var c = 0, t = 0;
  for (var i = 0; i < series.length; i++) { c += series[i].c; t += series[i].t; if (t >= minQ && test(c / t)) return { d: series[i].d, c: c, t: t, acc: c / t }; }
  return null;
}

// ═══ Où sont les points ═══
export function targetAcc(u) {
  if (u.targetToeic) return clamp((u.targetToeic / 2 - 5) / 490, 0.3, 0.97);
  return 0.85;
}
function scanParts(u) { return (u.battleScan && u.battleScan.subScores && u.battleScan.subScores.parts) || {}; }
function scanMacros(u) { return (u.battleScan && u.battleScan.subScores && u.battleScan.subScores.grammarMacros) || {}; }
export function partState(u, part, now) {
  var s = partSeries(u, part), m = mastery(s, now), life = lifetime(s);
  var last = s.length ? s[s.length - 1].d : null;
  var base = { part: part, n: m.n, life: life, last: last, sessions: s.length };
  if (m.n >= MIN_EVID) return Object.assign(base, { acc: m.acc, source: "trained" });
  var sp = scanParts(u)[part];
  if (typeof sp === "number") return Object.assign(base, { acc: sp, source: "scan" });
  if (part === "p5") {
    var sm = scanMacros(u), ks = Object.keys(sm);
    if (ks.length) return Object.assign(base, { acc: ks.reduce(function (a, k) { return a + sm[k]; }, 0) / ks.length, source: "scan" });
  }
  return Object.assign(base, { acc: null, source: "none" });
}
export function stakes(u, now) {
  var tgt = targetAcc(u);
  return PARTS.map(function (p) {
    var st = partState(u, p, now);
    st.tgt = tgt;
    st.pts = st.acc == null ? null : Math.round(TOEIC_Q[p] * Math.max(0, tgt - st.acc) * PTS_PER_Q);
    return st;
  }).sort(function (a, b) { return (b.pts || 0) - (a.pts || 0); });
}
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

// ═══ Bestiaire des erreurs ═══
// Proposition de champ Supabase `review` (jsonb borné) : {items:[…], slain, log:[…]}.
// Un item = une RÉFÉRENCE vers la question (jamais son texte) : "drill:g326", "lisP3:p3_05:1".
export function newReview() { return { items: [], slain: 0, log: [] }; }
export function itemMeta(k) {
  var p = k.split(":"), mod = p[0], id = p[1], qi = p.length > 2 ? +p[2] : null;
  var part = MODULE_TOEIC_MAP[mod] ? MODULE_TOEIC_MAP[mod].part : null, cat = null;
  if (mod === "drill") { var q = QUESTIONS.find(function (x) { return x.id === id; }); cat = q ? q.cat : null; }
  return { k: k, mod: mod, id: id, qi: qi, part: part, cat: cat };
}
// Deux compteurs (constatés nécessaires dans la simulation) :
//   fails : toutes les fois où la question a été ratée ;
//   miss  : sa FORCE = 1 + les fois où elle a fait retomber une réussite (box ≥ 1 → 0). Rater encore
//           une créature pas encore touchée ne la renforce pas : sinon chasser tous les jours rendait
//           les créatures plus fortes que ne pas chasser (Karim : 15 « Wyrms » à force d'assiduité).
// Ratée 3 fois ou plus : la reposer chaque jour ne sert plus, elle revient à J+2 et la chasse ouvre
// la fiche de grammaire avant (une question ratée 11 fois dans la première simulation).
export var WYRM_MISS = 3;
export function reviewMiss(rv, k, d) {
  var it = rv.items.find(function (x) { return x.k === k; });
  if (it) { it.fails++; if (it.box > 0) it.miss++; it.box = 0; it.last = d; it.due = addDays(d, it.fails >= WYRM_MISS ? 2 : BOX_DAYS[0]); }
  else rv.items.push(Object.assign(itemMeta(k), { first: d, last: d, miss: 1, fails: 1, box: 0, due: addDays(d, BOX_DAYS[0]) }));
  rv.log.push({ d: d, k: k, e: "miss" });
}
// Fenêtre des dernières réponses (≥ minQ questions), de la plus récente vers l'arrière.
export function recentWindow(series, minQ) {
  var c = 0, t = 0, start = null;
  for (var i = series.length - 1; i >= 0 && t < minQ; i--) { c += series[i].c; t += series[i].t; start = series[i].d; }
  return { c: c, t: t, acc: t ? c / t : null, start: start };
}
export function reviewHit(rv, k, d) {
  var i = rv.items.findIndex(function (x) { return x.k === k; });
  if (i < 0) return null;
  var it = rv.items[i];
  if (it.box + 1 >= BOX_DAYS.length) { rv.items.splice(i, 1); rv.slain++; rv.log.push({ d: d, k: k, e: "slain" }); return "slain"; }
  it.box++; it.last = d; it.due = addDays(d, BOX_DAYS[it.box]);
  rv.log.push({ d: d, k: k, e: "hit" });
  return "hit";
}
export function dueItems(u, d) {
  var rv = u.review || newReview();
  return rv.items.filter(function (x) { return x.due <= d; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : b.miss - a.miss; });
}
export var TIERS = {
  trickster: { name: "Trickster", icon: "trap-mask", hint: "missed once" },
  stalker: { name: "Stalker", icon: "hooded-assassin", hint: "knocked you back once" },
  wyrm: { name: "Wyrm", icon: "dragon-head", hint: "knocked you back 3 times" },
};
export function tierOf(it) { return it.miss >= 3 ? "wyrm" : it.miss === 2 ? "stalker" : "trickster"; }
export function slainOn(u, d) { return ((u.review && u.review.log) || []).filter(function (l) { return l.e === "slain" && l.d === d; }); }
export function slainBetween(u, from, to) { return ((u.review && u.review.log) || []).filter(function (l) { return l.e === "slain" && l.d >= from && l.d <= to; }); }
export function caughtBetween(u, from, to) {
  var seen = {};
  return ((u.review && u.review.log) || []).filter(function (l) { if (l.e !== "miss" || l.d < from || l.d > to || seen[l.k]) return false; seen[l.k] = 1; return true; });
}

// Retrouve la question d'origine à partir de sa référence (le texte n'est jamais copié dans le profil).
export function lookupItem(k) {
  var m = itemMeta(k);
  if (m.mod === "drill") {
    var q = QUESTIONS.find(function (x) { return x.id === m.id; });
    if (!q) return null;
    return Object.assign(m, { label: q.cat, prompt: q.s, options: q.o, c: q.c, why: q.x });
  }
  if (m.mod === "lisP2") {
    var p2 = LISTENING_P2.find(function (x) { return x.id === m.id; });
    if (!p2) return null;
    return Object.assign(m, { label: "Part 2 question", prompt: p2.q, options: p2.opts, c: p2.c, why: p2.x, audio: true });
  }
  if (m.mod === "lisP3" || m.mod === "lisP4") {
    var pool = m.mod === "lisP3" ? LISTENING_P3 : LISTENING_P4;
    var it = pool.find(function (x) { return x.id === m.id; });
    var sq = it && it.qs[m.qi];
    if (!sq) return null;
    return Object.assign(m, { label: (m.mod === "lisP3" ? "Part 3 conversation" : "Part 4 talk"), prompt: sq.q, options: sq.opts, c: sq.c, why: sq.x || "", audio: true });
  }
  if (m.mod === "p7") {
    var ps = PART7_PASSAGES.find(function (x) { return x.id === m.id; });
    var pq = ps && ps.questions[m.qi];
    if (!pq) return null;
    return Object.assign(m, { label: "Part 7 · " + ps.type, prompt: pq.q, options: pq.options, c: pq.correct, why: pq.x });
  }
  return null;
}
// Groupes du bestiaire : par catégorie de grammaire, sinon par partie.
export function bestiary(u, now) {
  var d = day(now), rv = u.review || newReview();
  var groups = {};
  rv.items.forEach(function (it) {
    var key = it.cat || PART_SHORT[it.part] || it.mod;
    if (!groups[key]) groups[key] = { key: key, part: it.part, items: [], due: 0 };
    var g = groups[key];
    g.items.push(it);
    if (it.due <= d) g.due++;
  });
  var list = Object.keys(groups).map(function (k) {
    var g = groups[k];
    g.items.sort(function (a, b) { return (a.due <= d ? 0 : 1) - (b.due <= d ? 0 : 1) || b.miss - a.miss || (a.due < b.due ? -1 : 1); });
    return g;
  }).sort(function (a, b) { return b.due - a.due || b.items.length - a.items.length; });
  var weekStart = addDays(d, -6);
  return {
    groups: list, lurking: rv.items.length, due: dueItems(u, d).length, slain: rv.slain,
    slainWeek: slainBetween(u, weekStart, d).length, wyrms: rv.items.filter(function (x) { return x.miss >= 3; }).length,
  };
}

// Sessions d'entraînement (les chasses du bestiaire ne comptent pas pour sortir du démarrage à froid).
export function trainedSessions(u) {
  var ms = u.moduleScores || {}, n = 0;
  Object.keys(ms).forEach(function (id) { if (id !== "review") n += ms[id].sessions || 0; });
  return n;
}

// ═══ Plan du jour ═══
// Un seul critère : les points TOEIC en jeu (questions de la partie au vrai test × écart à la cible),
// avec deux règles autour : les erreurs arrivées à échéance d'abord (courtes, et l'espacement ne
// supporte pas l'attente), puis l'entretien d'une partie forte laissée de côté.
export function planToday(u, now) {
  var d = day(now), due = dueItems(u, d), st = stakes(u, now);
  var sessions = trainedSessions(u), cold = sessions < 5, quests = [];
  if (due.length >= HUNT_MIN) quests.push({ kind: "hunt", mod: "review", n: Math.min(10, due.length), due: due.length });
  if (cold) {
    // Élève neuf : vérifier ce que le Battle Scan soupçonne, puis mesurer une partie jamais jouée.
    var sm = scanMacros(u), weakMacro = null;
    Object.keys(sm).forEach(function (k) { if (!weakMacro || sm[k] < sm[weakMacro]) weakMacro = k; });
    var weakPart = st.filter(function (s) { return s.source === "scan" && s.part !== "p5"; }).sort(function (a, b) { return a.acc - b.acc; })[0];
    if (weakMacro && (!weakPart || sm[weakMacro] <= weakPart.acc)) {
      var mac = MACROS.find(function (x) { return x.id === weakMacro; });
      quests.push({ kind: "confirm", mod: "drill", part: "p5", macro: mac, scanAcc: sm[weakMacro] });
    } else if (weakPart) quests.push({ kind: "confirm", mod: PART_MOD[weakPart.part], part: weakPart.part, scanAcc: weakPart.acc });
    var fresh = st.filter(function (s) { return s.sessions === 0 && s.part !== "p1" && s.part !== "p5" && (!quests[quests.length - 1] || quests[quests.length - 1].part !== s.part); })
      .sort(function (a, b) { return TOEIC_Q[b.part] - TOEIC_Q[a.part]; })[0];
    if (fresh) quests.push({ kind: "explore", mod: PART_MOD[fresh.part], part: fresh.part });
  } else {
    var top = st.find(function (s) { return s.pts > 0 && s.source === "trained"; });
    if (top) {
      var q = { kind: "stake", mod: PART_MOD[top.part], part: top.part, pts: top.pts, acc: top.acc, tgt: top.tgt, n: top.n, life: top.life };
      if (top.part === "p5") { var wc = weakestCat(u, now); if (wc) q.cat = wc; }
      quests.push(q);
    }
    var keep = st.filter(function (s) { return s.source === "trained" && s.acc >= 0.75 && s.last && daysBetween(s.last, d) >= 7 && (!top || s.part !== top.part); })
      .sort(function (a, b) { return daysBetween(b.last, d) - daysBetween(a.last, d); })[0];
    if (keep) quests.push({ kind: "keep", mod: PART_MOD[keep.part], part: keep.part, days: daysBetween(keep.last, d), acc: keep.acc });
  }
  return { quests: quests.slice(0, 3), due: due, folded: due.length < HUNT_MIN ? due : [], stakes: st, cold: cold, tgt: targetAcc(u) };
}

// Composition de la première session du plan. rnd : générateur déterministe (fixtures).
export function composeSession(u, now, plan, rnd, quest) {
  quest = quest || plan.quests[0];
  var d = day(now);
  if (quest.kind === "hunt") {
    var items = plan.due.slice(0, 10).map(function (it) { return Object.assign({ role: "due", item: it }, lookupItem(it.k)); })
      .sort(function (a, b) { return (a.mod === "drill" ? 0 : 1) - (b.mod === "drill" ? 0 : 1); });
    return { kind: "hunt", quest: quest, questions: items };
  }
  // Drill : erreurs à échéance glissées dedans, catégorie ou macro visée, catégorie « méritée » allégée.
  var lurking = {};
  ((u.review && u.review.items) || []).forEach(function (x) { if (x.mod === "drill") lurking[x.id] = 1; });
  var folded = plan.folded.filter(function (x) { return x.mod === "drill"; }).slice(0, 2);
  var focusCats, focus = null;
  if (quest.kind === "confirm" && quest.macro) focusCats = quest.macro.subcats;
  else { focus = quest.cat || weakestCat(u, now); focusCats = focus ? [focus.cat] : []; }
  var eased = allCats().map(function (c) { return catState(u, c, now); })
    .filter(function (s) { return s.turn && (s.turn.eligible || s.turn.near) && focusCats.indexOf(s.cat) < 0; })[0] || null;
  var used = {};
  folded.forEach(function (x) { used[x.id] = 1; });
  function draw(filter, n) {
    var pool = QUESTIONS.filter(function (q) { return !used[q.id] && !lurking[q.id] && filter(q); }), out = [];
    while (out.length < n && pool.length) { var q = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; used[q.id] = 1; out.push(q); }
    return out;
  }
  var nFocus = 4, nEased = eased ? 2 : 0;
  var fq = draw(function (q) { return focusCats.indexOf(q.cat) >= 0; }, nFocus);
  var eq = eased ? draw(function (q) { return q.cat === eased.cat; }, nEased) : [];
  var mq = draw(function (q) { return focusCats.indexOf(q.cat) < 0 && (!eased || q.cat !== eased.cat); }, 10 - folded.length - fq.length - eq.length);
  function asQ(q, role, item) { return Object.assign({ role: role, item: item || null }, lookupItem("drill:" + q.id)); }
  var slots = { focus: fq.map(function (q) { return asQ(q, "focus"); }), eased: eq.map(function (q) { return asQ(q, "eased"); }), mixed: mq.map(function (q) { return asQ(q, "mixed"); }),
    due: folded.map(function (it) { return Object.assign({ role: "due", item: it }, lookupItem(it.k)); }) };
  var order = ["focus", "due", "mixed", "focus", "eased", "mixed", "due", "focus", "mixed", "eased", "focus", "mixed", "mixed", "mixed"];
  var questions = [];
  order.forEach(function (r) { if (questions.length < 10 && slots[r].length) questions.push(slots[r].shift()); });
  ["focus", "eased", "due", "mixed"].forEach(function (r) { while (questions.length < 10 && slots[r].length) questions.push(slots[r].shift()); });
  return { kind: "drill", quest: quest, focus: focus, focusCats: focusCats, macro: quest.macro || null, eased: eased, folded: folded, questions: questions, date: d };
}

// ═══ Chiffres de la semaine écoulée (lettre du lundi) ═══
export function weekFacts(u, now, snaps) {
  var d = day(now), from = addDays(d, -7), to = addDays(d, -1), prevFrom = addDays(d, -14), prevTo = addDays(d, -8);
  var sessions = 0, q = 0, days = {};
  Object.keys(u.moduleScores || {}).forEach(function (id) {
    (u.moduleScores[id].history || []).forEach(function (h) { if (h.date >= from && h.date <= to) { sessions++; q += h.total; days[h.date] = 1; } });
  });
  function moves(seriesOf, keys, label) {
    return keys.map(function (k) {
      var s = seriesOf(k), a = windowAcc(s, from, to), b = windowAcc(s, prevFrom, prevTo);
      return { key: k, label: label(k), now: a, before: b, delta: a.t >= 10 && b.t >= 10 ? a.acc - b.acc : null };
    }).filter(function (x) { return x.delta !== null; });
  }
  var partMoves = moves(function (p) { return partSeries(u, p); }, PARTS, function (p) { return PART_SHORT[p]; });
  var catMoves = moves(function (c) { return catSeries(u, c); }, allCats(), function (c) { return c; });
  var all = partMoves.concat(catMoves);
  var up = all.filter(function (x) { return x.delta >= 0.1; }).sort(function (a, b) { return b.delta - a.delta; });
  var down = all.filter(function (x) { return x.delta <= -0.1; }).sort(function (a, b) { return a.delta - b.delta; });
  var sn = (snaps || []).filter(function (s) { return s.toeic != null; });
  var est = sn.length >= 2 ? { from: sn[sn.length - 2].toeic, to: sn[sn.length - 1].toeic } : sn.length === 1 ? { from: null, to: sn[0].toeic } : null;
  var turning = allCats().map(function (c) { return catState(u, c, now); }).filter(function (s) { return s.turn && (s.turn.near || s.turn.eligible); });
  return {
    from: from, to: to, sessions: sessions, questions: q, activeDays: Object.keys(days).length,
    up: up, down: down, est: est, slain: slainBetween(u, from, to).length, caught: caughtBetween(u, from, to).length, turning: turning,
  };
}

// Allure vers l'objectif, à partir des instantanés hebdomadaires de l'estimation.
export function goalPace(u, now, snaps) {
  if (!u.targetToeic || !u.targetDate) return null;
  var sn = (snaps || []).filter(function (s) { return s.toeic != null; });
  if (!sn.length) return { target: u.targetToeic, date: u.targetDate, current: null };
  var cur = sn[sn.length - 1].toeic, weeksLeft = Math.max(1, daysBetween(day(now), u.targetDate) / 7);
  var needed = (u.targetToeic - cur) / weeksLeft;
  var last = sn.length >= 2 ? sn[sn.length - 1].toeic - sn[sn.length - 2].toeic : null;
  return { target: u.targetToeic, date: u.targetDate, current: cur, weeksLeft: Math.round(weeksLeft), needed: needed, last: last, onTrack: last != null && last >= needed };
}

// ═══ Chronique : jalons tirés des données existantes (reconstructible pour les élèves actuels) ═══
export function chronicle(u, now, snaps) {
  var out = [], d = day(now);
  var bs = u.battleScan;
  if (bs) {
    var sa = bs.sectionAcc || {}, keys = Object.keys(sa).filter(function (k) { return typeof sa[k] === "number"; });
    keys.sort(function (a, b) { return sa[b] - sa[a]; });
    out.push({ d: bs.date || u.joinedAt, kind: "scan", icon: "compass", title: "You entered the Arena",
      facts: { strong: keys[0], strongAcc: sa[keys[0]], weak: keys[keys.length - 1], weakAcc: sa[keys[keys.length - 1]] } });
  }
  PARTS.forEach(function (p) {
    var x = firstCross(partSeries(u, p), 20, function (a) { return a >= 0.8; });
    if (x) out.push({ d: x.d, kind: "part80", icon: PART_ICON[p], title: PART_SHORT[p] + " crossed 80%", facts: { part: p, c: x.c, t: x.t } });
  });
  allCats().forEach(function (c) {
    var s = catSeries(u, c);
    var weak = firstCross(s, 10, function (a) { return a < 0.5; });
    if (weak) out.push({ d: weak.d, kind: "weak", icon: "spider-web", title: c + " marked as a weak spot", facts: { cat: c, c: weak.c, t: weak.t } });
    var tr = turnaround(s);
    if (tr && tr.eligible && u.celebrated && u.celebrated.indexOf(c) >= 0) out.push({ d: tr.now.end, kind: "turn", icon: "laurel-crown", title: c + ": weakness turned strength", facts: { cat: c, then: tr.then, now: tr.now } });
  });
  var mr = u.mockResults || {};
  Object.keys(mr).forEach(function (k) {
    var r = mr[k];
    if (r && r.date) out.push({ d: r.date, kind: "mock", icon: "scroll-unfurled", title: (MODULE_NAME[k] || k) + " completed", facts: { score: r.score, total: r.total } });
  });
  var firstEst = (snaps || []).find(function (s) { return s.toeic != null; });
  if (firstEst) out.push({ d: firstEst.d, kind: "estimate", icon: "star-formation", title: "Your TOEIC estimate appeared", facts: { toeic: firstEst.toeic } });
  var slainLog = ((u.review && u.review.log) || []).filter(function (l) { return l.e === "slain"; });
  [1, 10, 25, 50].forEach(function (n) {
    if (slainLog.length >= n) out.push({ d: slainLog[n - 1].d, kind: "slain", icon: "broadsword", title: n === 1 ? "First mistake slain" : n + " mistakes slain", facts: { n: n, k: slainLog[n - 1].k } });
  });
  if (u.targetToeic) out.push({ d: d, kind: "goal", icon: "path-distance", title: "On the road to " + u.targetToeic, facts: { target: u.targetToeic, date: u.targetDate }, now: true });
  var order = { scan: 0, weak: 1, part80: 2, mock: 3, estimate: 4, slain: 5, turn: 6, goal: 7 };
  return out.filter(function (e) { return e.d <= d; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : order[a.kind] - order[b.kind]; });
}

// Instantanés hebdomadaires de l'estimation (en prod : weekly_snapshots via my_weekly_snapshots).
export function estimateAt(u) { return estimateTOEICScore(u.moduleScores || {}).total; }
export { pct };
