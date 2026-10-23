/* Entonnoir de l'onboarding (lib/onbFunnel.js, 2026-10-23), onglet Usage du dashboard formateur.
 *
 * POURQUOI CE TEST EXISTE. Ces chiffres disent où les nouveaux décrochent et guident les retouches de
 * l'onboarding. Faux, ils font corriger le mauvais écran, et rien ne casse le build :
 *  · une étape ajoutée au client mais absente de la liste blanche SQL de onb_step est refusée en silence :
 *    l'entonnoir affiche 0 à cette étape, et la « plus forte perte » pointe le mauvais écran ;
 *  · la vue promo qui démarrerait à `land` (compté sous la promo `_`) afficherait 0 au départ ;
 *  · des compteurs d'avant la mise en service ou hors fenêtre fausseraient les parts ;
 *  · une partie abandonnée (clé quit:) comptée comme « 1re manche », ou une partie du jour d'inscription
 *    comptée comme « revenu un autre jour » ;
 *  · le câblage : chaque étape doit être envoyée par Onboard.jsx, sous la bonne clé.
 *
 * Usage : node tests/check_onb_funnel.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const F = require(path.join(ROOT, 'src', 'lib', 'onbFunnel.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};

const NOW = new Date('2026-11-10T12:00:00Z'); // fenêtre de 30 j : 12/10 → 10/11, capture depuis le 23/10
const R = (day, step, n) => ({ day, step, n });
const rows = [
  R('2026-10-20', 'scan_open', 50),            // avant la mise en service : ignoré
  R('2026-11-01', 'land', 40), R('2026-11-01', 'name', 30),
  R('2026-11-01', 'scan_open', 20), R('2026-11-02', 'scan_open', 4),
  R('2026-11-01', 'scan_start', 20), R('2026-11-01', 'sec1', 18), R('2026-11-01', 'sec2', 17),
  R('2026-11-01', 'sec3', 9), R('2026-11-01', 'scan_done', 9), R('2026-11-01', 'report_cta', 8),
  R('2026-11-01', 'account', 7), R('2026-11-01', 'returning', 5),
];

// ── vue promo : part de scan_open, sans land/name ──
const p = F.onbFunnel(rows, [], NOW);
eq('vue promo : première étape', p.steps[0].id, 'scan_open');
eq('vue promo : land absent', p.steps.some(s => s.id === 'land'), false);
eq('compteurs additionnés sur la fenêtre, avant la mise en service exclu', p.steps[0].n, 24);
eq('part de l\'étape précédente', Math.round(p.steps.find(s => s.id === 'sec3').ofPrev * 100), 53);
eq('plus forte perte = Lecture finie (17 → 9)', p.steps.filter(s => s.worst).map(s => s.id), ['sec3']);
eq('élèves reconnus à part', p.returning, 5);
eq('fenêtre bornée par la mise en service', F.onbFunnel(rows, [], new Date('2026-10-30T12:00:00Z')).from, '2026-10-23');

// ── vue globale : part de land ──
const g = F.onbFunnel(rows, [], NOW, { global: true });
eq('vue globale : première étape', g.steps[0].id, 'land');
eq('vue globale : part du départ du compte créé', Math.round(g.steps[g.steps.length - 1].ofStart * 100), 18);

// ── après le compte ──
const st = [
  { joined_at: '2026-11-01', dms: { 'drill_2026-11-01': 1 } },                          // 1re manche, pas revenu
  { joined_at: '2026-11-01', dms: { 'drill_2026-11-01': 1, 'tavern_2026-11-03': 2 } },  // revenu
  { joined_at: '2026-11-02', dms: { 'quit:drill_2026-11-02': 1 } },                     // abandon seul : rien
  { joined_at: '2026-11-02', dms: {} },
  { joined_at: '2026-09-01', dms: { 'drill_2026-11-05': 1 } },                          // inscrit avant la fenêtre
];
eq('après le compte', F.onbFunnel([], st, NOW).after, { joined: 4, firstSession: 2, cameBack: 1 });
eq('aucun compteur → vide', F.onbFunnel([], st, NOW).empty, true);

// ── liste blanche SQL = étapes du client ──
const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '2026-10-23_onboarding_funnel.sql'), 'utf8');
const m = sql.match(/v_steps\s+text\[\]\s*:=\s*ARRAY\[([^\]]*)\]/);
const sqlSteps = m ? m[1].match(/'([a-z0-9_]+)'/g).map(s => s.slice(1, -1)).sort() : [];
eq('liste blanche de onb_step = ONB_STEP_IDS', sqlSteps, F.ONB_STEP_IDS.slice().sort());

// ── câblage : chaque étape est envoyée par Onboard.jsx ──
const onb = fs.readFileSync(path.join(ROOT, 'src', 'features', 'onboarding', 'Onboard.jsx'), 'utf8');
F.ONB_STEP_IDS.forEach(function (id) {
  if (id === 'sec1' || id === 'sec2' || id === 'sec3') return; // envoyées par "sec"+(n) dans advanceScanV2
  eq('Onboard envoie ' + id, onb.indexOf('onbStep("' + id + '"') >= 0, true);
});
eq('Onboard envoie les fins de section', /onbStep\("sec"\+/.test(onb), true);

console.log(fails ? fails + '/' + checks + ' vérifications en échec' : checks + '/' + checks + ' vérifications de l\'entonnoir au vert');
process.exit(fails ? 1 : 0);
