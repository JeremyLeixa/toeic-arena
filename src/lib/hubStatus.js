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
export var MASTERY_BLACKLIST = { mock1: 1, mock2: 1, mock3: 1, boss: 1, daily: 1, csess: 1, hunt: 1 };

export function isMastered(ms) {
  return !!ms && ms.total >= MASTERY_Q && ms.correct / ms.total >= MASTERY_ACC;
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
  return moduleStatus(u, item.id, ctx);
}

// Étagère de coffres en tête de hub : un coffre par tuile qui en a un (hub à épreuves : gagné
// quand toutes le sont), et le nombre de tuiles encore à plein tarif aujourd'hui.
export function hubSummary(u, items, ctx) {
  var chests = [], fresh = 0;
  items.forEach(function (it) {
    var s = hubItemStatus(u, it, ctx);
    if (s.plain) return;
    if (s.xp === "full") fresh++;
    if (!s.game) chests.push(s.hub ? s.allMastered : s.mastered);
  });
  return { chests: chests, won: chests.filter(Boolean).length, fresh: fresh };
}
