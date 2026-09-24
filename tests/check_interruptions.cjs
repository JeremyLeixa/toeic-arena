/* Budget d'interruptions plein écran (lib/interruptions.js, variante B du proto ceremony-budget, 2026-09-24).
 *
 * POURQUOI CE TEST EXISTE. Avant la règle, une manche pouvait enchaîner Ascension, cérémonie du retournement,
 * trois moments d'Aldric et la lettre du lundi : 6 plein écran, 7 taps. Rien ne casse le build si :
 *  · la priorité s'inverse (la promotion passe devant le retournement, moment unique par catégorie) ;
 *  · un moment CONTEXTUEL (Shop, Mentor, verdict, premier coffre) est reporté : l'élève arrive sur un écran
 *    qu'Aldric devait lui présenter, et la présentation tombe plus tard, hors contexte ;
 *  · un palier passe malgré un budget consommé (retour à l'enchaînement) ;
 *  · dans SessionResult, le retournement attend une Ascension qui n'aura jamais lieu (il ne s'afficherait
 *    plus du tout quand promotion et retournement tombent ensemble) ;
 *  · le jingle des trophées rejoue par-dessus celui du retournement ;
 *  · App() cesse de verrouiller le moment affiché (il disparaîtrait à l'instant où il consomme le budget),
 *    ou soumet une rediffusion demandée au budget (le bouton « replay » ne ferait plus rien).
 *
 * Usage : node tests/check_interruptions.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const I = require(path.join(ROOT, 'src', 'lib', 'interruptions.js'));
const { NARRATOR_MOMENTS } = require(path.join(ROOT, 'src', 'narrator.js'));

let fails = 0, checks = 0;
const eq = (label, got, want) => {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log('  FAIL ' + label + ' : obtenu ' + g + ', attendu ' + w); }
};
const ok = (label, cond) => eq(label, !!cond, true);

// ── priorité dans l'écran de fin ──
eq('rien', I.sessionFullscreen({}), null);
eq('session absente', I.sessionFullscreen(null), null);
eq('promotion seule', I.sessionFullscreen({ leagueUp: { from: 'bronze', to: 'silver' } }), 'league');
eq('retournement seul', I.sessionFullscreen({ turn: { cat: 'Articles' } }), 'turn');
eq('les deux : le retournement passe', I.sessionFullscreen({ turn: { cat: 'Articles' }, leagueUp: { to: 'gold' } }), 'turn');
eq('cérémonie → entrée suivante consommée', I.spendsNextEntry({ leagueUp: { to: 'gold' } }), true);
eq('manche ordinaire → entrée libre', I.spendsNextEntry({ levelUp: true }), false);

// ── familles de moments ──
eq('paliers', I.MILESTONE_MOMENTS.slice().sort(), ['dawn_rank', 'dragon', 'first_combat', 'oath_of_fire', 'rising_rank']);
I.MILESTONE_MOMENTS.forEach((id) => ok('palier connu du narrateur : ' + id, NARRATOR_MOMENTS[id]));
['shop_intro', 'mentor_intro', 'verdict', 'first_chest', 'legacy'].forEach((id) => {
  ok('contextuel connu : ' + id, NARRATOR_MOMENTS[id]);
  eq('contextuel jamais reporté : ' + id, I.isMilestone(id), false);
});

// ── choix du moment à afficher ──
eq('file vide', I.pickNarrator([], true), null);
eq('palier, budget libre', I.pickNarrator(['rising_rank', 'oath_of_fire'], true), 'rising_rank');
eq('palier, budget pris → attend', I.pickNarrator(['rising_rank', 'oath_of_fire'], false), null);
eq('contextuel passe même budget pris', I.pickNarrator(['rising_rank', 'shop_intro'], false), 'shop_intro');
eq('contextuel devant un palier plus ancien', I.pickNarrator(['dawn_rank', 'first_chest'], true), 'first_chest');

// ── câblage lu dans le source ──
const sr = fs.readFileSync(path.join(ROOT, 'src', 'components', 'SessionResult.jsx'), 'utf8');
ok('SessionResult choisit par sessionFullscreen', /var full = sessionFullscreen\(s\)/.test(sr));
ok('Ascension seulement si elle est le plein écran retenu', /full !== "league" \|\| stage < ST_LEAGUE/.test(sr));
ok('le retournement n\'attend l\'Ascension que si elle a lieu', /if \(full === "league" && !skip && !ceremonyFired\.current\) return;/.test(sr));
ok('promotion non retenue = ligne du parchemin', /inlineLeague && <div className="sr-honor">/.test(sr));
ok('jingle des trophées tu quand le retournement le joue', /if \(hasTurn\) return;\s*\n?\s*sound\(playJingleAchieve\)/.test(sr));
const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
ok('App choisit le moment par pickNarrator et le budget frais', /pickNarrator\(narratorQueue,budgetFreeNow\(\)\)/.test(app));
ok('moment affiché verrouillé jusqu\'à sa fermeture', /if\(narratorActive&&narratorQueue\.indexOf\(narratorActive\)!==-1\)return;/.test(app));
ok('un palier affiché consomme l\'entrée', /if\(id&&isMilestone\(id\)\)markEntryUsed\(entryRef\.current\)/.test(app));
ok('session à cérémonie → entrée suivante consommée', /if\(spendsNextEntry\(lastSession\)\)spentNextRef\.current=true/.test(app));
ok('examens à cérémonies → entrée suivante consommée', /if\(examCeremony\)spentNextRef\.current=true/.test(app));
ok('rediffusion jamais soumise au budget', /function replayNarratorMoment\(id\)\{setNarratorQueue\(\[id\]\);setNarratorActive\(id\);\}/.test(app)
  && (app.match(/replayNarrator=\{replayNarratorMoment\}/g) || []).length >= 2);
ok('lettre du lundi derrière le budget, verrouillée une fois ouverte', /showLetter=letterBase&&homeEntry>0&&\(letterEntry===homeEntry\|\|usedEntry!==homeEntry\)/.test(app));

console.log((checks - fails) + '/' + checks + ' vérifications du budget d\'interruptions au vert');
process.exit(fails ? 1 : 0);
