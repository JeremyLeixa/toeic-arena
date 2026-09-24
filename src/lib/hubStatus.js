// État des tuiles de hub (2026-09-17, proto prototypes/living-hubs/, variante C « Coffre »).
// Pur : tout vient du profil (moduleScores, dailyModSessions, gameScores, boosts.bypassArmedModule) et
// des événements injectés. Rendu par components/HubTile.jsx ; testé par tests/check_hub_status.cjs.
import { nextRunMult } from "./xp.js";
import { today } from "./util.js";

// Coffre de maîtrise (Champion + 50 Darics, une fois par module) : 50 questions à 80 % ou plus.
// Seule source des seuils : le watcher d'App.jsx qui octroie le coffre les lit aussi.
export var MASTERY_Q = 50;
export var MASTERY_ACC = 0.8;
// Sans coffre de maîtrise : déjà couverts par d'autres coffres, ou pas progressifs.
// "hunt" : la chasse repose des questions déjà vues, sa précision ne mesure rien de progressif.
// Mimic Hunt y a été du 2026-09-18 au 2026-09-19, tant que sa banque (12 items) se rejouait en entière à
// chaque partie : tests/check_mimic_items.cjs l'y remettrait si la banque repassait sous 45 items.
// "mimic_listen" y a été le 2026-09-19, le temps que le mode écoute passe de 21 à 45 sources parlées (lot 4) :
// check_mimic_items l'y remettrait sous 45.
// "office" (Nine to Five, 2026-09-24) : ses réponses comptent déjà dans lisP3 / lisP4 / p7 (officeDone), dont
// les coffres de maîtrise avancent. Un coffre "office" en plus paierait deux fois les mêmes réponses.
export var MASTERY_BLACKLIST = { mock1: 1, mock2: 1, mock3: 1, boss: 1, daily: 1, csess: 1, hunt: 1, office: 1 };

export function isMastered(ms) {
  return !!ms && ms.total >= MASTERY_Q && ms.correct / ms.total >= MASTERY_ACC;
}

// ── Échelons de maîtrise (2026-09-19, proto prototypes/mastery-tiers/, variante B « coffre suivant ») ──
// Le coffre ne tombait qu'une fois par module : quand tout était gagné, les hubs n'offraient plus rien à
// rejouer. Échelon I = la règle d'avant (50 Q, 80 % sur le CUMUL, déclencheur mastery_<mod> inchangé).
// Échelons suivants : volume cumulé ET précision RÉCENTE (~50 dernières questions, sessions entières) —
// sur le cumul, 150 questions à 78 % ne remontent presque plus, l'élève qui progresse n'atteindrait
// jamais 85 %. `chest` : palier de TreasureChestSvg et type de coffre (2 Champion, 3 Légendaire).
export var TIERS = [
  { q: MASTERY_Q, acc: MASTERY_ACC, chest: 2, lifetime: true }, // I   mastery_<mod>     Champion
  { q: 150, acc: 0.85, chest: 2 },                              // II  mastery_<mod>_2   Champion
  { q: 300, acc: 0.85, chest: 3 },                              // III mastery_<mod>_3   Légendaire
];
// Au-delà de III, la récurrence : un échelon tous les +150 Q (IV à 450, V à 600…), coffre Champion.
export var RENOWN_STEP = 150, RENOWN_ACC = 0.85, RENOWN_CHEST = 2;
export var RECENT_Q = 50;
// Un échelon au plus par module et par semaine : 150 questions jouées en un week-end, même à 0 XP (le
// volume compte quand la 4e partie du jour ne rapporte plus), ne donnent pas deux coffres d'affilée.
export var GAP_DAYS = 7;
// Rattrapage (choix de Jérémy, 2026-09-19) : un échelon I gagné AVANT les échelons est daté du jour de la
// mise en ligne. Sans ça, un élève avancé recevait d'un coup un échelon II par module (jusqu'à une dizaine
// de coffres Champion) ; là, tout le monde attend 7 jours, puis ça s'étale.
export var TIERS_EPOCH = "2026-09-19";

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
// Déclencheur et Darics d'un échelon : l'échelon I garde les noms d'avant (coffres déjà servis = I).
export function tierTrigger(modId, n) { return "mastery_" + modId + (n > 1 ? "_" + n : ""); }
export function tierMarksKey(modId, n) { return "mastery_marks_" + modId + (n > 1 ? "_" + n : ""); }

// Précision des ~50 dernières questions : sessions entières en partant de la fin (history, 100 sessions).
export function recentAcc(hist) {
  var t = 0, c = 0;
  for (var i = (hist || []).length - 1; i >= 0 && t < RECENT_Q; i--) { t += hist[i].total || 0; c += hist[i].correct || 0; }
  return { q: t, acc: t ? c / t : 0 };
}
function dayDiff(a, b) { return Math.round((Date.parse(a) - Date.parse(b)) / 864e5); }

// Échelon atteint : moduleScores[mod].mt = {n, date}, posé par le watcher d'App.jsx quand le serveur a
// répondu (coffre accordé, ou déjà servi) ; recordModule le recopie. SANS `mt`, rien n'est acquis : le
// watcher tente l'échelon I et le serveur tranche (« déjà servi » = coffre d'avant, daté TIERS_EPOCH).
// Supposer l'échelon I acquis dès 50 Q à 80 % aurait privé de coffre tout module maîtrisé APRÈS la mise
// en ligne.
export function tierStatus(m, now) {
  m = m || {};
  var total = m.total || 0, correct = m.correct || 0;
  var won = m.mt && m.mt.n ? m.mt.n : 0;
  var next = tierDef(won + 1), prevQ = won ? tierDef(won).q : 0;
  var rec = next.lifetime ? { q: total, acc: total ? correct / total : 0 } : recentAcc(m.history);
  var volOk = total >= next.q, accOk = rec.acc >= next.acc;
  var t = today(now || new Date());
  var wait = m.mt && m.mt.date ? Math.max(0, GAP_DAYS - dayDiff(t, m.mt.date)) : 0;
  return {
    total: total, won: won, next: next, prevQ: prevQ, acc: rec.acc, recentQ: rec.q,
    vol: Math.max(0, Math.min(1, (total - prevQ) / (next.q - prevQ))),
    volOk: volOk, accOk: accOk,
    // Signalée comme avant : seulement au-delà de 10 questions mesurées.
    accLow: rec.q >= 10 && !accOk,
    wait: wait,
    // new : jamais joué · road : volume en route · acclow : volume atteint, précision sous le seuil ·
    // wait : tout est atteint, le coffre part dans `wait` jours · ready : le watcher l'octroie.
    state: !total ? "new" : volOk && accOk ? (wait ? "wait" : "ready") : volOk ? "acclow" : "road",
  };
}

// Hub à épreuves (Gauntlet, Modal Council, Listening, Reading) : un coffre par épreuve. La tuile vise
// l'échelon suivant de l'épreuve la moins avancée (« 1/4 trials at II »).
export function hubTierStatus(scores, subs, now) {
  var parts = subs.map(function (s) { return tierStatus((scores || {})[s], now); });
  var floor = Math.min.apply(null, parts.map(function (x) { return x.won; }));
  var target = tierDef(floor + 1);
  var at = parts.filter(function (x) { return x.won >= target.n; }).length;
  var started = parts.some(function (x) { return x.total > 0; });
  return {
    hub: true, n: parts.length, won: floor, next: target, at: at,
    chests: parts.reduce(function (a, x) { return a + x.won; }, 0),
    vol: parts.reduce(function (a, x) { return a + (x.won >= target.n ? 1 : Math.min(x.vol, 0.95)); }, 0) / parts.length,
    started: started, state: started ? "road" : "new",
  };
}

// Palier d'XP de la prochaine partie : 1 → full, 0,5 (et 0,4 / 0,6) → half, >0 → low, 0 → none.
export function xpTier(mult) {
  return mult >= 1 ? "full" : mult >= 0.4 ? "half" : mult > 0 ? "low" : "none";
}

// « today », « yesterday », « 3 days ago » (dates today() en UTC, comme history).
export function agoLabel(date, now) {
  if (!date) return "";
  var days = Math.round((Date.parse(today(now || new Date())) - Date.parse(date)) / 864e5);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days + " days ago";
}

function moduleStatus(u, modId, ctx) {
  var m = (u && u.moduleScores || {})[modId];
  var total = m ? m.total || 0 : 0, correct = m ? m.correct || 0 : 0;
  var acc = total ? correct / total : 0;
  var hist = m && m.history;
  var mult = nextRunMult(u, modId, ctx);
  return {
    total: total, correct: correct, acc: acc,
    mastered: isMastered({ total: total, correct: correct }),
    vol: Math.min(1, total / MASTERY_Q),
    // Précision sous le seuil, signalée seulement au-delà de 10 questions (pas sur un premier essai).
    accLow: total >= 10 && acc < MASTERY_ACC,
    last: hist && hist.length ? hist[hist.length - 1] : null,
    mult: mult, xp: xpTier(mult),
  };
}

// item : {id, subs?:[modId], game?:"matchEasy"|"wordFall"|"duel", plain?:true}
// Rend {plain} | {game, record, mult, xp} | {hub, n, mastered, allMastered, vol, started, last, mult, xp, best}
// | {total, correct, acc, mastered, vol, accLow, last, mult, xp}.
export function hubItemStatus(u, item, ctx) {
  ctx = ctx || {};
  if (item.plain || MASTERY_BLACKLIST[item.id]) return { plain: true };
  if (item.subs) {
    var parts = item.subs.map(function (s) { return moduleStatus(u, s, ctx); });
    var mastered = parts.filter(function (x) { return x.mastered; }).length;
    var last = null;
    parts.forEach(function (x) { if (x.last && (!last || x.last.date > last.date)) last = x.last; });
    var best = Math.max.apply(null, parts.map(function (x) { return x.mult; }));
    return {
      tier: hubTierStatus(u && u.moduleScores, item.subs, ctx.now),
      hub: true, n: parts.length, mastered: mastered, allMastered: mastered === parts.length,
      // Une épreuve maîtrisée compte pleine, les autres au volume (plafonné sous 1 : pas de 100 % trompeur).
      vol: parts.reduce(function (a, x) { return a + (x.mastered ? 1 : Math.min(x.vol, 0.95)); }, 0) / parts.length,
      started: parts.some(function (x) { return x.total > 0; }), last: last,
      // Meilleur tarif encore disponible : une épreuve pas encore jouée aujourd'hui = plein tarif.
      mult: best, xp: xpTier(best), atBest: parts.filter(function (x) { return x.mult === best; }).length,
    };
  }
  if (item.game) {
    var g = (u && u.gameScores || {})[item.game];
    var rec = null;
    if (g && item.game === "matchEasy" && g.time != null) rec = g.time + "s";
    else if (g && item.game === "wordFall" && g.score != null) rec = g.score + " pts";
    else if (g && item.game === "duel" && g.wins) rec = g.wins + " win" + (g.wins > 1 ? "s" : "");
    var gm = nextRunMult(u, "game_" + item.game, ctx);
    return { game: true, record: rec, mult: gm, xp: xpTier(gm) };
  }
  return Object.assign(moduleStatus(u, item.id, ctx), { tier: tierStatus((u && u.moduleScores || {})[item.id], ctx.now) });
}

// Étagère en tête de hub (variante B) : un coffre par tuile au palier de son dernier échelon gagné (hub à
// épreuves : l'épreuve la moins avancée), le nombre total de coffres gagnés — plus de « 3 of 5 », la série
// ne finit pas —, le coffre le plus proche (`near`, ou `wait` s'il attend son délai de 7 jours) et le nombre
// de tuiles encore à plein tarif aujourd'hui.
export function hubSummary(u, items, ctx) {
  var chests = [], fresh = 0, won = 0, near = null, wait = null;
  items.forEach(function (it) {
    var s = hubItemStatus(u, it, ctx);
    if (s.plain) return;
    if (s.xp === "full") fresh++;
    if (s.game) return;
    var t = s.tier;
    chests.push(t.won);
    won += t.hub ? t.chests : t.won;
    if (t.hub || t.state === "new") return;
    if (t.state === "wait") { if (!wait || t.wait < wait.wait) wait = { id: it.id, n: it.n, tier: t.next.n, wait: t.wait }; return; }
    if (t.accLow || t.volOk) return;
    var left = t.next.q - t.total;
    if (!near || left < near.left) near = { id: it.id, n: it.n, tier: t.next.n, left: left };
  });
  return { chests: chests, won: won, near: near, wait: wait, fresh: fresh };
}
