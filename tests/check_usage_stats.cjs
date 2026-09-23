/* Onglet « Usage » du dashboard formateur (lib/usageStats.js, lib/sessionQuit.js, 2026-09-23).
 *
 * POURQUOI CE TEST EXISTE. Ces chiffres servent à décider quoi alléger ou retirer de l'appli. Faux, ils
 * font retirer un module joué ou garder un module fui, et rien ne casse le build :
 *  · un abandon compté comme une partie gonfle l'usage du module qu'on fuit ;
 *  · une borne de fenêtre décalée d'un jour fait varier « 7 j » au gré de l'heure ;
 *  · les épreuves du Gauntlet (gauntlet_irregular…) et ses abandons (rangés par route : gauntlet) ne
 *    se rencontrent pas si la famille n'est pas calculée → taux d'abandon de 100 % ;
 *  · un taux de mission calculé avant le début de la capture affiche 0 % pour toute la promo ;
 *  · le câblage : SessionTop doit signaler l'abandon dans leave() (confirmé), PAS au départ sans
 *    réponse ; checkMission doit borner doneDays.
 *
 * Usage : node tests/check_usage_stats.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const U = require(path.join(ROOT, 'src', 'lib', 'usageStats.js'));
const Q = require(path.join(ROOT, 'src', 'lib', 'sessionQuit.js'));
const P = require(path.join(ROOT, 'src', 'lib', 'progress.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};
const ok = (label, cond) => eq(label, !!cond, true);

// Horloge figée : 2026-10-10 midi UTC. 7 j = 04 → 10 ; 30 j = 11/09 → 10/10 ; capture depuis le 23/09.
const NOW = new Date('2026-10-10T12:00:00Z');
const byId = (r, id) => r.modules.find(m => m.id === id);

// ── parseKey ──
eq('clé de partie', U.parseKey('drill_2026-10-01'), { id: 'drill', date: '2026-10-01', quit: false });
eq('clé d\'abandon', U.parseKey('quit:drill_2026-10-01'), { id: 'drill', date: '2026-10-01', quit: true });
eq('épreuve de hub → famille', U.parseKey('gauntlet_irregular_2026-10-01').id, 'gauntlet');
eq('mimic_listen → mimic', U.parseKey('mimic_listen_2026-10-01').id, 'mimic');
eq('clé sans date → ignorée', U.parseKey('drill'), null);
eq('clé sans séparateur → ignorée', U.parseKey('x2026-10-01'), null);
eq('préfixe d\'abandon aligné sur sessionQuit', Q.QUIT_PREFIX, 'quit:');

// ── fenêtres, bornes incluses ──
{
  const r = U.usageStats([{ dms: {
    'drill_2026-10-04': 1,   // 1er jour des 7 j
    'drill_2026-10-03': 2,   // hors 7 j, dans 30 j
    'drill_2026-09-11': 4,   // 1er jour des 30 j
    'drill_2026-09-10': 8,   // hors 30 j
  } }], NOW);
  const d = byId(r, 'drill');
  eq('plays7 borne incluse', d.plays7, 1);
  eq('plays30 borne incluse, veille exclue', d.plays30, 7);
  eq('actif 7 j', r.active7, 1);
}

// ── les abandons ne sont jamais des parties ──
{
  const r = U.usageStats([
    { dms: { 'quit:p7_2026-10-05': 3 } },                       // n'a fait qu'abandonner
    { dms: { 'p7_2026-10-05': 1, 'quit:p7_2026-10-06': 1 } },
  ], NOW);
  const m = byId(r, 'p7');
  eq('abandons comptés à part', [m.plays30, m.quits30], [1, 4]);
  eq('un élève qui n\'a qu\'abandonné n\'est pas « touché »', m.reach30, 1);
  eq('ni actif', r.active30, 1);
  eq('taux = abandons / (abandons + parties)', m.quitRate, 4 / 5);
}

// ── les hubs se rencontrent (parties par épreuve, abandons par route) ──
{
  const r = U.usageStats([{ dms: { 'gauntlet_irregular_2026-10-05': 2, 'gauntlet_tense_2026-10-06': 1, 'quit:gauntlet_2026-10-06': 1 } }], NOW);
  eq('une seule ligne gauntlet', r.modules.filter(m => m.id.indexOf('gauntlet') === 0).length, 1);
  eq('taux gauntlet', byId(r, 'gauntlet').quitRate, 1 / 4);
}

// ── capture neuve : rien avant CAPTURE_START ──
{
  eq('début de capture', U.CAPTURE_START, '2026-09-23');
  const r = U.usageStats([{ dms: {
    'drill_2026-09-20': 1, 'quit:drill_2026-09-20': 5,    // avant la capture
    'drill_2026-09-25': 1, 'drill_2026-09-26': 1,
  }, done_days: ['2026-09-20', '2026-09-25'] }], NOW);
  eq('abandons d\'avant la capture ignorés', byId(r, 'drill').quits30, 0);
  eq('parties d\'avant la capture comptées dans l\'usage', byId(r, 'drill').plays30, 3);
  eq('mission : jours actifs depuis la capture seulement', r.mission, { done: 1, active: 2, rate: 0.5 });
  eq('taux d\'abandon sans abandon = 0', byId(r, 'drill').quitRate, 0);
}

// ── bestiaire, élève vide, entrée vide ──
{
  const r = U.usageStats([{ weeks: { '2026-09-28': { caught: 4, slain: 1 }, '2026-10-05': { caught: 2, slain: 3 } } }, {}, null], NOW);
  eq('bestiaire sommé', r.bestiary, { caught: 6, slain: 4 });
  eq('élèves comptés, même vides', r.students, 3);
  eq('aucun actif', [r.active7, r.active30], [0, 0]);
  eq('mission sans jour actif → null', r.mission.rate, null);
  eq('entrée nulle', U.usageStats(null, NOW).modules, []);
}

// ── tri et libellés ──
{
  const r = U.usageStats([{ dms: { 'tavern_2026-10-05': 1, 'drill_2026-10-05': 5, 'game_wordFall_2026-10-05': 2 } }], NOW);
  eq('tri par parties 30 j', r.modules.map(m => m.id), ['drill', 'game_wordFall', 'tavern']);
  eq('libellés', r.modules.map(m => m.label), ['Part 5 Drill', 'Game · wordFall', 'Word Tavern']);
}

// ── puits d'abandon ──
{
  const got = [];
  Q.reportQuit(3); // sans puits : ne fait rien, ne lève pas
  Q.setQuitSink(n => got.push(n));
  Q.reportQuit(4);
  Q.setQuitSink(() => { throw new Error('boom'); });
  const warn = console.warn; console.warn = () => {};
  try { Q.reportQuit(1); ok('un puits qui lève ne casse pas le retour', true); } finally { console.warn = warn; }
  Q.setQuitSink(null);
  eq('puits appelé avec le nombre de réponses', got, [4]);
  ok('Boss et Endless exemptés', Q.QUIT_EXEMPT.boss && Q.QUIT_EXEMPT.endless);
}

// ── checkMission : doneDays daté, dédoublonné, borné ──
{
  const t = new Date().toISOString().slice(0, 10);
  const old = Array.from({ length: 40 }, (_, i) => '2020-01-' + String(i % 28 + 1).padStart(2, '0'));
  const u = { xp: 0, weeklyXp: 0, mission: { date: t, actId: 'drill', done: false, doneDays: old.concat([t]) } };
  P.checkMission(u, 'drill');
  const dd = u.mission.doneDays;
  eq('borné à 35', dd.length, 35);
  eq('aujourd\'hui en dernier', dd[dd.length - 1], t);
  eq('aujourd\'hui une seule fois', dd.filter(d => d === t).length, 1);
  const u2 = { xp: 0, weeklyXp: 0, mission: { date: t, actId: 'drill', done: false } };
  P.checkMission(u2, 'p7');
  eq('mauvais module → rien', u2.mission.doneDays, undefined);
}

// ── câblage lu dans le source ──
{
  const hud = fs.readFileSync(path.join(ROOT, 'src', 'components', 'SessionHud.jsx'), 'utf8');
  const leave = (hud.match(/function leave\(\)[^\n]*/) || [''])[0];
  const ask = (hud.match(/function ask\(\)[\s\S]*?\n  \}/) || [''])[0];
  ok('SessionTop.leave() signale l\'abandon', /reportQuit\(results\.length\)/.test(leave));
  ok('…avant de quitter', leave.indexOf('reportQuit') < leave.indexOf('p.onQuit'));
  ok('le départ sans réponse ne signale rien', ask && ask.indexOf('reportQuit') < 0);
  const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
  ok('App() pose le puits', /setQuitSink\(function\(answered\)/.test(app));
  ok('le puits range sous QUIT_PREFIX + route', /QUIT_PREFIX\+route\+"_"\+today\(\)/.test(app));
  ok('le puits ignore 0 réponse et les routes exemptées', /answered<1\|\|!route\|\|QUIT_EXEMPT\[route\]/.test(app));
  const dash = fs.readFileSync(path.join(ROOT, 'src', 'features', 'teacher', 'TeacherDash.jsx'), 'utf8');
  ok('le dashboard agrège par usageStats', /usageStats\(res\.data\.students/.test(dash));
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '2026-09-23_teacher_usage.sql'), 'utf8');
  ok('la RPC ne renvoie aucun nom', !/SELECT[^;]*\bs\.name\b\s*(,|AS)/i.test(sql) && !/'name'/.test(sql));
  ok('la RPC exclut Teacher', /s\.name <> 'Teacher'/.test(sql));
}

console.log((checks - fails) + '/' + checks + ' vérifications usage au vert');
process.exit(fails ? 1 : 0);
