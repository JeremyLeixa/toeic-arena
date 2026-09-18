// Bestiaire des erreurs (2026-09-17, proto prototypes/mentor-memory/). PUR et SANS DONNÉES : ce module
// ne manipule que des RÉFÉRENCES de questions. Testé par tests/check_review.cjs.
//
// POURQUOI CE MODULE. Les ~30 `mistakesRef` des modules ne servaient qu'à l'écran de fin : aucune erreur
// ne revenait jamais. Ici, chaque erreur devient une créature qui revient à intervalles croissants, et
// tombe après trois réussites espacées.
//
// Une référence (`k`) désigne l'ITEM, jamais une option : les options sont permutées partout
// (lib/listeningShuffle.js, Part 6, Part 7, options générées à l'exécution). Formats :
//   "drill:g326"            question à identifiant
//   "lisP3:p3_05:1"         sous-question d'un conteneur (conversation, talk, passage, texte)
//   "clue:ch01:clue"        deuxième leçon d'un même item
//   "falsefr:actually"      banque sans identifiant : clé dérivée d'un champ naturel unique
//
// Pas de données ici (le texte des questions vit dans lib/reviewLookup.js, chargé à la demande) : le
// Mentor et App() n'ont pas à tirer listening.js et part7.js dans le bundle principal.
import { today } from "./util.js";
import { addDays, mondayOf } from "./learnerModel.js";

// Ratée → demain ; réussie → 3 jours, puis 7 ; 3e réussite espacée = vaincue.
export var BOX_DAYS = [1, 3, 7];
// Ratée 3 fois ou plus : la reposer chaque jour ne sert plus. Repos de 2 jours, et la chasse ouvre la
// fiche de grammaire avant de la reposer (simulation du proto : une question ratée 11 fois).
export var WYRM_MISS = 3;
export var HUNT_CAP = 10;      // créatures par chasse (sinon le retard s'empile en une session interminable)
export var HUNT_BASE = 5, HUNT_PER_SLAIN = 5, DARICS_PER_SLAIN = 1;
// XP d'une chasse : on paie la créature VAINCUE, rien pour une simple réussite. Rater exprès une
// question de Drill coûte 7 XP tout de suite ; la vaincre rapporte 5 XP au mieux 11 jours plus tard,
// après trois réussites espacées : farmer est toujours perdant.
export function huntReward(slain) { return { xp: HUNT_BASE + HUNT_PER_SLAIN * slain, darics: DARICS_PER_SLAIN * slain }; }

export function newReview() { return { items: [], slain: 0, log: [] }; }
// "lisP3:p3_05:1" → {mod:"lisP3", id:"p3_05", sub:"1"}
export function refParts(k) {
  var p = String(k).split(":");
  return { mod: p[0], id: p[1], sub: p.length > 2 ? p.slice(2).join(":") : null };
}
// Clé de regroupement : la catégorie pour la grammaire, le CONTENEUR pour les questions d'un même
// support (une chasse Part 7 relit le passage une fois, décision du 2026-09-17), la partie sinon.
export function groupKey(it) {
  if (it.cat) return "cat:" + it.cat;
  var r = refParts(it.k);
  if (r.sub !== null) return "doc:" + r.mod + ":" + r.id;
  return "part:" + (it.part || r.mod);
}

// ── Les deux mouvements ──
// `ref` : {k, cat?, part?} — la catégorie et la partie sont stockées à la capture (le module les
// connaît), pour que ce fichier n'ait jamais besoin des banques de questions.
export function reviewMiss(rv, ref, now) {
  var d = today(now), k = ref.k || ref;
  var it = rv.items.find(function (x) { return x.k === k; });
  if (it) {
    it.fails++;
    // `miss` = la FORCE de la créature : 1 + les fois où elle a fait retomber une réussite. Rater
    // encore une créature jamais touchée ne la renforce pas, sinon chasser tous les jours rendait les
    // créatures plus fortes que ne pas chasser (constaté dans la simulation du proto).
    if (it.box > 0) it.miss++;
    it.box = 0; it.last = d; it.due = addDays(d, it.fails >= WYRM_MISS ? 2 : BOX_DAYS[0]);
  } else {
    rv.items.push({ k: k, cat: ref.cat || null, part: ref.part || null, first: d, last: d, miss: 1, fails: 1, box: 0, due: addDays(d, BOX_DAYS[0]) });
    tally(rv, d, "caught");
  }
  rv.log.push({ d: d, k: k, e: "miss" });
  return rv;
}
export function reviewHit(rv, k, now) {
  var d = today(now);
  var i = rv.items.findIndex(function (x) { return x.k === k; });
  if (i < 0) return null;
  var it = rv.items[i];
  if (it.box + 1 >= BOX_DAYS.length) {
    rv.items.splice(i, 1); rv.slain++; tally(rv, d, "slain");
    rv.log.push({ d: d, k: k, e: "slain" });
    return "slain";
  }
  it.box++; it.last = d; it.due = addDays(d, BOX_DAYS[it.box]);
  rv.log.push({ d: d, k: k, e: "hit" });
  return "hit";
}

// ── Lectures ──
export function dueItems(u, now) {
  var d = today(now), rv = (u && u.review) || newReview();
  return (rv.items || []).filter(function (x) { return x.due <= d; })
    .sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : b.miss - a.miss; });
}
// Une chasse : les plus anciennes d'abord, plafonnées, mais les créatures d'un même support restent
// ensemble (le passage n'est lu qu'une fois).
export function huntQueue(u, now, cap) {
  var due = dueItems(u, now), max = cap || HUNT_CAP, out = [], seen = {};
  due.forEach(function (it) {
    if (out.length >= max) return;
    var g = groupKey(it);
    if (seen[g]) return;
    seen[g] = 1;
    var group = due.filter(function (x) { return groupKey(x) === g; });
    group.forEach(function (x) { if (out.length < max) out.push(x); });
  });
  return out;
}
export var TIERS = {
  trickster: { name: "Trickster", icon: "trap-mask" },
  stalker: { name: "Stalker", icon: "hooded-assassin" },
  wyrm: { name: "Wyrm", icon: "dragon-head" },
};
export function tierOf(it) { return it.miss >= 3 ? "wyrm" : it.miss === 2 ? "stalker" : "trickster"; }
function logOf(u) { return (u && u.review && u.review.log) || []; }
export function slainOn(u, d) { return logOf(u).filter(function (l) { return l.e === "slain" && l.d === d; }); }
export function slainBetween(u, from, to) { return logOf(u).filter(function (l) { return l.e === "slain" && l.d >= from && l.d <= to; }); }
export function caughtBetween(u, from, to) {
  var seen = {};
  return logOf(u).filter(function (l) {
    if (l.e !== "miss" || l.d < from || l.d > to || seen[l.k]) return false;
    seen[l.k] = 1; return true;
  });
}
// Compteurs et groupes du bestiaire. `label` est résolu par l'écran (lib/reviewLookup.js).
export function bestiary(u, now) {
  var d = today(now), rv = (u && u.review) || newReview(), groups = {};
  (rv.items || []).forEach(function (it) {
    var g = groupKey(it);
    if (!groups[g]) groups[g] = { key: g, cat: it.cat || null, part: it.part || null, items: [], due: 0 };
    groups[g].items.push(it);
    if (it.due <= d) groups[g].due++;
  });
  var list = Object.keys(groups).map(function (k) {
    var g = groups[k];
    g.items.sort(function (a, b) { return (a.due <= d ? 0 : 1) - (b.due <= d ? 0 : 1) || b.miss - a.miss || (a.due < b.due ? -1 : 1); });
    return g;
  }).sort(function (a, b) { return b.due - a.due || b.items.length - a.items.length; });
  return {
    groups: list, lurking: (rv.items || []).length, due: dueItems(u, now).length, slain: rv.slain || 0,
    slainWeek: slainBetween(u, addDays(d, -6), d).length,
    wyrms: (rv.items || []).filter(function (x) { return x.miss >= 3; }).length,
  };
}
// La file est bornée avant la sauvegarde (jamais dans supaToLocal : une troncature à la lecture ferait
// échouer check_profile_roundtrip). Les plus anciennes vaincues partent en premier.
// Lot 6 : la même sauvegarde porte aussi les compteurs par semaine (`weeks`, 5 semaines), les jalons
// datés de la Chronique (`chronicle`, 60) et les insights du jeton (`insights`, 10).
export var MAX_ITEMS = 120, MAX_LOG = 60, MAX_WEEKS = 5, MAX_CHRONICLE = 60, MAX_INSIGHTS = 10;
export function boundReview(rv) {
  if (!rv) return newReview();
  if (rv.items.length > MAX_ITEMS) {
    rv.items = rv.items.slice().sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : 0; }).slice(0, MAX_ITEMS);
  }
  if (rv.log.length > MAX_LOG) rv.log = rv.log.slice(-MAX_LOG);
  if (rv.weeks) {
    var keep = Object.keys(rv.weeks).sort().slice(-MAX_WEEKS), w = {};
    keep.forEach(function (k) { w[k] = rv.weeks[k]; });
    rv.weeks = w;
  }
  if (rv.chronicle && rv.chronicle.length > MAX_CHRONICLE) rv.chronicle = rv.chronicle.slice(-MAX_CHRONICLE);
  if (rv.insights && rv.insights.length > MAX_INSIGHTS) rv.insights = rv.insights.slice(-MAX_INSIGHTS);
  return rv;
}
// Compteurs par semaine (clé = le lundi) : créatures attrapées (NOUVELLES seulement) et vaincues. La
// lettre du lundi les cite ; le journal (MAX_LOG lignes) ne tient pas une semaine active.
function tally(rv, d, key) {
  var w = mondayOf(d);
  if (!rv.weeks) rv.weeks = {};
  if (!rv.weeks[w]) rv.weeks[w] = { caught: 0, slain: 0 };
  rv.weeks[w][key]++;
}
export function weekTally(u, monday) { return (((u && u.review) || {}).weeks || {})[monday] || null; }
// Un insight du jeton (lot 6) : rangé dans le bestiaire, relu dans la Chronique. Avant, `u.insights`
// n'allait dans aucune colonne et disparaissait au rechargement.
export function addInsight(rv, text, now) {
  if (!rv || !rv.items) rv = newReview();
  rv.insights = (rv.insights || []).concat([{ d: today(now), text: text }]);
  return boundReview(rv);
}
// Les créatures battues DANS une autre session (le Drill y glisse les échéances, lot 5) : même effet
// qu'une réussite en chasse (boîte suivante, vaincue à la 3e). `keys` : les références battues.
export function recordHits(rv, keys, now) {
  if (!rv || !rv.items) rv = newReview();
  (keys || []).forEach(function (k) { if (k) reviewHit(rv, k, now); });
  return boundReview(rv);
}
// Les erreurs d'une session entrent au bestiaire (App() : drillDone, dailyDone, miniSession). `mistakes`
// est la liste mistakesRef du module, celle de l'écran de fin : seules les entrées qui portent
// `ref:{k,cat,part}` entrent, les autres (module que la chasse ne sait pas encore reposer) sont ignorées.
// Modifie `rv` sur place (App() travaille sur une copie du profil) et le rend borné.
export function recordMisses(rv, mistakes, now) {
  if (!rv || !rv.items) rv = newReview();
  (mistakes || []).forEach(function (m) { if (m && m.ref && m.ref.k) reviewMiss(rv, m.ref, now); });
  return boundReview(rv);
}
