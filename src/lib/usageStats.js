// Onglet « Usage » du dashboard formateur (2026-09-23). Pur : tests/check_usage_stats.cjs.
//
// Entrée : les lignes ANONYMES de la RPC teacher_usage, une par élève :
//   dms       {"<modId>_<YYYY-MM-DD>": n, "quit:<route>_<YYYY-MM-DD>": n}  (35 derniers jours)
//   done_days ["YYYY-MM-DD", …]  jours de mission du jour accomplie
//   weeks     {"<lundi>": {caught, slain}}  bestiaire, 5 semaines
//   secured   true si le compte a un mot de passe (user_id posé) — suivi de la Phase C (2026-09-24)
// Les dates sont celles de today() (UTC), comme à l'écriture.
//
// Deux captures sont neuves au 2026-09-23 (abandons, jours de mission) : leurs taux ne comptent que
// les jours à partir de CAPTURE_START, sinon trois semaines sans capture passeraient pour 0 % de
// missions faites et 0 abandon.
import { MISSION_MODULES } from "../data/placement.js";
import { QUIT_PREFIX } from "./sessionQuit.js";
import { GAUNTLET_MODS } from "./gauntletTrials.js";

export var CAPTURE_START = "2026-09-23";

// Libellés des modules hors MISSION_MODULES. Un id inconnu s'affiche tel quel.
var EXTRA_LABELS = {
  daily: "Daily Challenge", tavern: "Word Tavern", bforge: "Bridge Forge", gauntlet: "Grammar Gauntlet",
  modals: "Modal Council", mimic: "Mimic Hunt", hunt: "Mistake Hunt", wfall: "Word Fall", office: "Nine to Five", travel: "Jet Lag", service: "Front Desk", opening: "Opening Night",
  mock1: "Mock Test 1", mock2: "Mock Test 2", mock3: "Mock Test 3", boss: "The Final Arena", endless: "Endless Arena",
};
export function moduleLabel(id) {
  var m = MISSION_MODULES.find(function (x) { return x.id === id; });
  if (m) return m.name;
  if (EXTRA_LABELS[id]) return EXTRA_LABELS[id];
  if (id.indexOf("game_") === 0) return "Game · " + id.slice(5);
  return id;
}

// Id de module (clé de partie) → famille = la route qui la joue, pour que parties et abandons
// (rangés par route : SessionTop ne connaît que sp) se comparent. Les épreuves des hubs comptent au hub.
// connsort / prepdrill / gerinf : épreuves du Gauntlet depuis le 2026-09-25, sous leurs ids d'origine (sans préfixe).
export function familyOf(modId) {
  if (modId.indexOf("gauntlet_") === 0 || GAUNTLET_MODS.indexOf(modId) >= 0) return "gauntlet";
  if (modId.indexOf("modals_") === 0) return "modals";
  if (modId === "mimic_listen") return "mimic";
  return modId;
}

function dayMinus(now, k) { return new Date(now.getTime() - k * 86400000).toISOString().slice(0, 10); }
// "drill_2026-09-20" → {id:"drill", date:"2026-09-20", quit:false} ; clé illisible → null.
export function parseKey(key) {
  var date = key.slice(-10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || key.charAt(key.length - 11) !== "_") return null;
  var id = key.slice(0, -11), quit = false;
  if (id.indexOf(QUIT_PREFIX) === 0) { quit = true; id = id.slice(QUIT_PREFIX.length); }
  if (!id) return null;
  return { id: quit ? id : familyOf(id), date: date, quit: quit };
}

export function usageStats(rows, now) {
  now = now || new Date();
  var from7 = dayMinus(now, 6), from30 = dayMinus(now, 29);
  var capFrom = from30 > CAPTURE_START ? from30 : CAPTURE_START;
  var mods = {}, active7 = 0, active30 = 0, mDone = 0, mActive = 0, caught = 0, slain = 0, secured = 0, activeUnsecured = 0;
  function mod(id) {
    return mods[id] || (mods[id] = { id: id, label: moduleLabel(id), plays7: 0, plays30: 0, playsCap: 0, quits30: 0, reach: {} });
  }
  (rows || []).forEach(function (r, i) {
    var dms = (r && r.dms) || {}, days30 = {}, in7 = false;
    Object.keys(dms).forEach(function (key) {
      var k = parseKey(key), n = +dms[key] || 0;
      if (!k || n <= 0 || k.date < from30) return;
      var m = mod(k.id);
      if (k.quit) { if (k.date >= capFrom) m.quits30 += n; return; }
      m.plays30 += n; m.reach[i] = true; days30[k.date] = true;
      if (k.date >= capFrom) m.playsCap += n;
      if (k.date >= from7) { m.plays7 += n; in7 = true; }
    });
    var active = Object.keys(days30);
    if (active.length) active30++;
    // Phase C : un compte actif sans mot de passe est celui qui verra l'écran de sécurisation à la bascule.
    if (r && r.secured) secured++; else if (active.length) activeUnsecured++;
    if (in7) active7++;
    var done = {};
    ((r && r.done_days) || []).forEach(function (d) { done[d] = true; });
    active.forEach(function (d) { if (d >= capFrom) { mActive++; if (done[d]) mDone++; } });
    var weeks = (r && r.weeks) || {};
    Object.keys(weeks).forEach(function (w) {
      caught += +(weeks[w] && weeks[w].caught) || 0; slain += +(weeks[w] && weeks[w].slain) || 0;
    });
  });
  var modules = Object.keys(mods).map(function (id) {
    var m = mods[id], att = m.playsCap + m.quits30;
    return { id: id, label: m.label, plays7: m.plays7, plays30: m.plays30, reach30: Object.keys(m.reach).length,
      quits30: m.quits30, quitRate: att ? m.quits30 / att : null, attempts: att };
  }).sort(function (a, b) { return b.plays30 - a.plays30 || b.quits30 - a.quits30 || (a.id < b.id ? -1 : 1); });
  return {
    students: (rows || []).length, active7: active7, active30: active30,
    mission: { done: mDone, active: mActive, rate: mActive ? mDone / mActive : null },
    bestiary: { caught: caught, slain: slain },
    security: { secured: secured, total: (rows || []).length, activeUnsecured30: activeUnsecured },
    modules: modules, captureStart: CAPTURE_START,
  };
}
