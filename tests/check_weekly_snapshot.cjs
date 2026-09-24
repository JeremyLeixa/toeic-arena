/* Instantané hebdomadaire : la semaine qui se termine, avec son XP (2026-09-24).
 *
 * POURQUOI CE TEST EXISTE. applyWeekTransition (src/lib/league.js) envoie l'instantané de la semaine finie PUIS
 * remet weeklyXp à 0 et passe weekId à la nouvelle semaine, de façon synchrone. pushWeeklySnapshot lisait ces
 * valeurs dans un .then() : l'envoi partait avec xp_this_week = 0, daily_completions = 0, et sous l'étiquette de
 * la semaine SUIVANTE. Les 398 instantanés en base jusqu'au 24/09 valaient 0 : rapport formateur, tendances et
 * podium hebdomadaire (et ses coffres) classaient sur du vide, sans aucune erreur nulle part.
 *
 * Le test rejoue la transition avec un Supabase simulé (réponse asynchrone, comme le vrai) et lit la charge
 * réellement envoyée. league.js importe Supabase et n'est pas requérable : ses imports sont remplacés par des
 * doublures.
 *
 * Usage : node tests/check_weekly_snapshot.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'league.js'), 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/^export /gm, '');

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };

const calls = [];
const supabase = {
  auth: { getUser: () => new Promise((res) => setTimeout(() => res({ data: { user: { id: 'u1' } } }), 5)) },
  rpc: (name, args) => { calls.push({ name, args }); return Promise.resolve({ data: { ok: true } }); },
};
const U = require(path.join(__dirname, '..', 'src', 'lib', 'util.js'));
const weekId = () => '2026-W38';
// eslint-disable-next-line no-new-func
const mod = new Function('supabase', 'weekId', 'weekStartOf', 'LEAGUES', 'estimateTOEICScore',
  src + '\nreturn { applyWeekTransition, pushWeeklySnapshot };')(supabase, weekId, U.weekStartOf, [], () => ({ total: null }));

const d = { name: 'Léa', classCode: 'idrac2026', weekId: '2026-W37', weeklyXp: 1234, weeklyDailyCount: 3, xp: 5000,
  streak: 4, stats: { q: 10 }, moduleScores: {}, mockResults: {}, unlockedAch: ['a', 'b'], weeklyHistory: [] };

ok('la transition a lieu', mod.applyWeekTransition(d) === true);
ok('le profil passe à la nouvelle semaine, remis à zéro', d.weekId === '2026-W38' && d.weeklyXp === 0 && d.weeklyDailyCount === 0);
ok('weeklyHistory garde la semaine finie', d.weeklyHistory.length === 1 && d.weeklyHistory[0].week === '2026-W37'
  && d.weeklyHistory[0].xp === 1234);

setTimeout(() => {
  const c = calls.find((x) => x.name === 'save_weekly_snapshot');
  ok('instantané envoyé par save_weekly_snapshot', !!c);
  const p = (c && c.args.p_payload) || {};
  ok('étiqueté avec la semaine FINIE (2026-W37), pas la suivante (reçu ' + p.week_id + ')', p.week_id === '2026-W37');
  ok('xp_this_week = XP de la semaine finie (reçu ' + p.xp_this_week + ')', p.xp_this_week === 1234);
  ok('daily_completions = jours de la semaine finie (reçu ' + p.daily_completions + ')', p.daily_completions === 3);
  ok('xp_cumulative et achievements_count présents', p.xp_cumulative === 5000 && p.achievements_count === 2);
  // weekId '2026-W37' = semaine du lundi 14/09. Avant : dimanche 06/09 (lundi PRÉCÉDENT, puis toISOString en UTC).
  ok('week_start = lundi LOCAL de la semaine finie (reçu ' + p.week_start + ', attendu 2026-09-14)', p.week_start === '2026-09-14');

  // weekStartOf est l'inverse exact de weekId, et weekId ne donne jamais le même numéro à deux lundis.
  let bad = 0; const seen = new Map();
  for (let t = new Date(2025, 0, 1, 9); t < new Date(2031, 0, 1); t.setDate(t.getDate() + 1)) {
    const w = U.weekId(t); const m = new Date(t); m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    if (U.weekStartOf(w) !== U.localYmd(m)) bad++;
    if (seen.has(w) && seen.get(w) !== U.localYmd(m)) bad++;
    seen.set(w, U.localYmd(m));
  }
  ok('weekStartOf(weekId(jour)) = lundi local de ce jour, 2025-2030, heure d\'été comprise (' + bad + ' écarts)', bad === 0);
  const dash = fs.readFileSync(path.join(__dirname, '..', 'src', 'features', 'teacher', 'TeacherDash.jsx'), 'utf8');
  ok('le rapport formateur cherche les mêmes lundis locaux (localYmd, pas toISOString)',
    /lastMondayStr=localYmd\(lastMonday\)/.test(dash) && /prevMondayStr=localYmd\(prevMonday\)/.test(dash));
  console.log((checks - fails) + '/' + checks + ' vérifications de l\'instantané hebdomadaire au vert');
  process.exit(fails ? 1 : 0);
}, 30);
