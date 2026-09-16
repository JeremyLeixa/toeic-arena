#!/usr/bin/env node
'use strict';
/* Équivalence des portes XP avant / après leur extraction dans lib/xp.js (Phase 5, B2).
 *
 * POURQUOI. applyXpGates, addXp, isModuleBoosted et getSpotlightMult étaient des closures
 * dans App() : impossibles à requérir, donc impossibles à comparer par un test ordinaire.
 * Ce script prend la TRANCHE de ces quatre fonctions dans deux versions d'App.jsx — l'ancienne
 * (commit épinglé, avant B2) et celle du disque — l'enveloppe dans `new Function` avec les
 * mêmes dépendances injectées (état, instant figé, événements, et des EFFETS qui journalisent
 * au lieu d'agir), puis rejoue des milliers de profils seedés des deux côtés. Un cas est
 * identique si le retour ET le journal ordonné des effets (grantMarks, sons, haptique, toast,
 * coffres) coïncident.
 *
 * Même technique que tests/validate_toeic_shrinkage.cjs (OLD depuis git, NEW depuis le
 * disque) ; aucune copie de l'algorithme n'est maintenue ici. Hors `npm test` : le sha
 * épinglé n'a de sens qu'au moment de B2. La sortie est collée dans REFACTOR_PLAN.md §9.
 *
 * Usage : node scripts/refactor/xp_equivalence.cjs [sha-avant-B2] [nb-cas]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OLD_SHA = process.argv[2] || '8f695c9';   // B1 : lib/xp.js existe, App.jsx pas encore câblé
const N = parseInt(process.argv[3] || '2000', 10);

const oldSrc = execFileSync('git', ['show', OLD_SHA + ':src/App.jsx'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const newSrc = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');

// La tranche : de la première des fonctions (isModuleBoosted côté OLD — elle n'existe plus
// côté NEW, où applyXpGates ouvre la tranche) à nav (la fonction qui suit getSpotlightMult).
function slice(src, label) {
  const starts = ['  function isModuleBoosted(', '  function applyXpGates('].map((s) => src.indexOf(s)).filter((i) => i >= 0);
  const a = starts.length ? Math.min(...starts) : -1;
  const b = src.indexOf('  function nav(');
  if (a < 0 || b < 0 || b < a) throw new Error('tranche introuvable dans ' + label);
  return src.slice(a, b);
}

// Dépendances PURES, requises telles quelles.
const toeic = require(path.join(ROOT, 'src', 'lib', 'toeic.js'));
const { getLevel } = require(path.join(ROOT, 'src', 'data', 'helpers.js'));
const { LEAGUES } = require(path.join(ROOT, 'src', 'data', 'leagues.js'));
const XP = require(path.join(ROOT, 'src', 'lib', 'xp.js'));
// lib/league.js importe Supabase (non requérable) : copie de sa ligne 65, identique.
function getLeague(wxp) { var l = LEAGUES[0]; for (var i = 0; i < LEAGUES.length; i++) if (wxp >= LEAGUES[i].min) l = LEAGUES[i]; return l; }

const DEPS = ['u', 'activeEvents', 'classMedianXp', 'today', 'computeTodayFocus', 'partOfModule', 'getLeague', 'getLevel',
  'grantMarks', 'playXP', 'playJingleLeague', 'playLevelUp', 'haptic', 'sXpt', 'grantChestLocal', 'Date', 'console'];
const NEW_DEPS = DEPS.concat(['gateXp', 'settleXp', 'isBoostedByEvents', 'spotlightMult']);
// isModuleBoosted n'existe que côté OLD : côté NEW on compare à isBoostedByEvents (lib/xp.js),
// la fonction qui l'a remplacée.
const RET = '\nreturn{isModuleBoosted:typeof isModuleBoosted==="function"?isModuleBoosted:null,applyXpGates:applyXpGates,addXp:addXp,getSpotlightMult:getSpotlightMult};';
const oldFactory = new Function(...DEPS, slice(oldSrc, OLD_SHA) + RET);
const newFactory = new Function(...NEW_DEPS, slice(newSrc, 'disque') + RET);

// Instant figé : `new Date()` sans argument et `Date.now()` rendent le même instant.
function frozenDate(ms) {
  return class FrozenDate extends Date {
    constructor(...a) { if (a.length === 0) super(ms); else super(...a); }
    static now() { return ms; }
  };
}
const clone = (v) => JSON.parse(JSON.stringify(v === undefined ? null : v));

function runSide(factory, deps, kase) {
  const log = [];
  const fx = (name) => (...args) => { log.push([name].concat(args.map(clone))); };
  const FD = frozenDate(kase.nowMs);
  const bag = {
    u: clone(kase.u), activeEvents: clone(kase.events), classMedianXp: kase.median,
    today: (d) => (d || new FD()).toISOString().split('T')[0],
    computeTodayFocus: toeic.computeTodayFocus, partOfModule: toeic.partOfModule, getLeague, getLevel,
    grantMarks: fx('grantMarks'), playXP: fx('playXP'), playJingleLeague: fx('playJingleLeague'), playLevelUp: fx('playLevelUp'),
    haptic: fx('haptic'), sXpt: fx('sXpt'), grantChestLocal: fx('grantChestLocal'),
    Date: FD, console: { warn: (...a) => log.push(['warn', a.map(String).join(' ')]) },
    gateXp: XP.gateXp, settleXp: XP.settleXp, isBoostedByEvents: XP.isBoostedByEvents, spotlightMult: XP.spotlightMult,
  };
  const api = factory(...deps.map((n) => bag[n]));
  const out = {};
  out.boosted = api.isModuleBoosted ? api.isModuleBoosted(kase.modId) : XP.isBoostedByEvents(kase.modId, bag.activeEvents);
  out.spot = api.getSpotlightMult(kase.modId);
  out.gated = api.applyXpGates(kase.baseXp, kase.sc, kase.tot, kase.modId);
  out.c = api.addXp(kase.amt);
  return { out, log };
}

// ── Générateur seedé (mulberry32) ─────────────────────────────────────────
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const R = rng(20260916);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const iso = (ms) => new Date(ms).toISOString().split('T')[0];
const DAY = 864e5;

const INSTANTS = ['2026-09-15T10:00:00Z', '2026-09-19T10:00:00Z', '2026-09-20T22:30:00Z', '2026-09-14T00:30:00Z', '2026-09-18T23:59:30Z'].map((s) => Date.parse(s));
const MODS = ['drill', 'mock1', 'mock2', 'mock3', 'csess', 'boss', 'game_x', 'lisP2', 'lisP1', 'gauntlet_tense', 'p6', 'p7', 'tavern', 'wordfam', null];
const XPS = [0, 5, 149, 150, 999, 1000, 2999, 4990, 9990, 19995, 29999, 49999];
const WXPS = [0, 50, 199, 200, 599, 600, 1499, 4999, 9999, 29999];
const STREAKS = [0, 1, 2, 3, 6, 7, 8, 29, 30, 99, 100];

function makeCase(i) {
  const nowMs = pick(INSTANTS);
  const td = iso(nowMs);
  const modId = pick(MODS);
  const other = pick(['p6', 'drill', 'lisP3']);
  const lastActive = pick([td, iso(nowMs - DAY), iso(nowMs - 3 * DAY), undefined, td, iso(nowMs - DAY)]);
  const dms = {};
  if (modId && R() < 0.8) dms[modId + '_' + td] = int(0, 4);
  if (modId && R() < 0.3) dms[modId + '_' + iso(nowMs - DAY)] = int(1, 3);
  const ms = {};
  for (const m of ['lisP1', 'lisP2', 'lisP3', 'lisP4', 'drill', 'p6', 'p7', 'tavern', 'wordfam']) {
    if (R() < 0.6) { const tot = int(0, 40); ms[m] = { correct: int(0, tot), total: tot, sessions: int(1, 5) }; }
  }
  const events = [];
  if (R() < 0.35) events.push({ type: 'spotlight', config: { module: R() < 0.5 ? modId : other, multiplier: pick([undefined, 2, 3]) } });
  if (R() < 0.25) events.push({ type: 'flash_hour', config: R() < 0.5 ? { multiplier: pick([2, 3]) } : undefined });
  if (R() < 0.25) events.push({ type: 'underdog', config: { multiplier: pick([undefined, 2]) } });
  const boosts = R() < 0.5 ? null : {
    moduleBoostArmed: pick([null, modId, other]),
    mockMultArmed: R() < 0.5,
    dailyDoublerUntil: pick([undefined, nowMs + 3600e3, nowMs - 1]),
  };
  const u = {
    xp: R() < 0.5 ? pick(XPS) : int(0, 60000), weeklyXp: R() < 0.5 ? pick(WXPS) : int(0, 35000),
    streak: pick(STREAKS), lastActive, dailyModSessions: dms, moduleScores: ms,
    stats: { totalQ: pick([0, 10, 19, 20, 40, 100]) },
    bypassArmedModule: pick([null, null, modId, other]),
    boosts,
  };
  if (R() < 0.3) u.battleScan = { subScores: { parts: { p1: R(), p2: R(), p5: R() } } };
  const tot = pick([0, 5, 10, 15, 20, 30]);
  return { i, nowMs, modId, events: R() < 0.3 ? null : events, median: int(0, 30000), u,
    baseXp: int(-10, 200), sc: tot ? int(0, tot) : 0, tot, amt: pick([0, -50, int(1, 2000), int(1, 300), int(1, 12000)]) };
}

// ── Rejeu ─────────────────────────────────────────────────────────────────
let same = 0, effects = 0; const diffs = [];
for (let i = 0; i < N; i++) {
  const k = makeCase(i);
  const a = runSide(oldFactory, DEPS, k);
  const b = runSide(newFactory, NEW_DEPS, k);
  effects += a.log.length;
  if (JSON.stringify(a) === JSON.stringify(b)) same++;
  else if (diffs.length < 5) diffs.push({ k, a, b });
}
console.log('Équivalence XP — OLD ' + OLD_SHA + ' vs App.jsx du disque, ' + N + ' cas seedés');
console.log('  ' + same + '/' + N + ' identiques (retour + journal ordonné des effets, ' + effects + ' effets journalisés)');
for (const d of diffs) {
  console.log('\n  DIFF cas #' + d.k.i + ' modId=' + d.k.modId + ' amt=' + d.k.amt + ' base=' + d.k.baseXp + ' ' + d.k.sc + '/' + d.k.tot);
  console.log('   OLD ' + JSON.stringify(d.a).slice(0, 600));
  console.log('   NEW ' + JSON.stringify(d.b).slice(0, 600));
}
process.exit(same === N ? 0 : 1);
