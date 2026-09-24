/* Économie côté serveur : parité des catalogues et câblage (2026-09-24, chantier « économie côté serveur »).
 *
 * POURQUOI CE TEST EXISTE. Le serveur décide désormais prix, raretés, plafonds et exclusifs à partir de tables
 * GÉNÉRÉES depuis src/data/chestCatalog.js (scripts/gen-economy-sql.mjs). Rien ne casse le build si :
 *  · un prix, une rareté ou un jeton change dans le jeu sans que le SQL soit régénéré : la boutique affiche
 *    un prix, le serveur en débite un autre (ou refuse un article qu'il ne connaît pas) ;
 *  · le SQL généré est retouché à la main (il serait écrasé au prochain passage du générateur) ;
 *  · le client se remet à envoyer prix / catégorie / rareté (retour de la faille du 24/09).
 *
 * Usage : node tests/check_economy_parity.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const G = require(path.join(ROOT, 'scripts', 'gen-economy-sql.mjs'));

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };

// ── le fichier SQL commité = ce que le générateur produit aujourd'hui ──
const expected = G.render(G.economyRows()).replace(/\r\n/g, '\n');
const actual = fs.existsSync(G.ECONOMY_SQL_FILE) ? fs.readFileSync(G.ECONOMY_SQL_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
ok('supabase/migrations/2026-09-24_economy_catalog_data.sql à jour (relancer node scripts/gen-economy-sql.mjs)', actual === expected);

// ── cohérence des données elles-mêmes ──
const rows = G.economyRows();
const rewardKey = new Set(rows.rewards.map((r) => r.type + ':' + r.id));
const tokenTypes = new Set(rows.tokens.map((t) => t.type));
rows.shop.forEach((it) => {
  ok(it.item_id + ' : prix > 0', it.price > 0);
  if (it.category === 'token') {
    ok(it.item_id + ' : jeton connu (' + it.ref_id + ')', tokenTypes.has(it.ref_id));
    ok(it.item_id + ' : jeton jamais one_shot', !it.one_shot);
  } else {
    ok(it.item_id + ' : cosmétique connu (' + it.category + ':' + it.ref_id + ')', rewardKey.has(it.category + ':' + it.ref_id));
    ok(it.item_id + ' : cosmétique toujours one_shot (sinon doublons à l\'infini)', it.one_shot);
  }
});
ok('identifiants d\'articles uniques', new Set(rows.shop.map((i) => i.item_id)).size === rows.shop.length);

// ── câblage client : seul l'identifiant part ──
const chests = fs.readFileSync(path.join(ROOT, 'src', 'data', 'chests.js'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
ok('achat par buy_item avec le seul identifiant', /rpc\("buy_item",\{p_name:userName, p_class_code:classCode, p_item_id:item\.item_id\}\)/.test(chests));
ok('plus aucun appel client à spend_marks', !/rpc\(["']spend_marks["']/.test(chests + app));
ok('titre Bottomless Purse par claim_bourse_title', /rpc\("claim_bourse_title"/.test(app));
ok('plus aucun appel client à grant_reward_once', !/rpc\(["']grant_reward_once["']/.test(chests + app));

// ── lot 2a : le serveur tire et crédite le contenu des coffres ──
ok('ouverture par open_chest (identifiant du coffre seulement)', /rpc\("open_chest",\{p_pending_id:pendingChest\.id, p_name:un, p_class_code:cc\}\)/.test(chests));
ok('plus aucun appel client à open_pending_chest (butin fourni par le client)', !/rpc\(["']open_pending_chest["']/.test(chests + app));
ok('le client ne tire plus le butin (pickRewards absent de chests.js hors ré-export)', !/pickRewards\(/.test(chests));
ok('les Darics des coffres ne sont plus crédités par le client', !/grantMarks\([^)]*"chest"/.test(app));
ok('le solde renvoyé par le serveur est recopié', /if\(typeof result\.balance==="number"\)c\.arenaMarks=result\.balance;/.test(app));

// ── lot 2b : tout déclencheur de coffre émis par le client est connu du serveur ──
// Une source de coffre ajoutée côté client sans passer par scripts/gen-economy-sql.mjs serait refusée en silence
// par grant_pending_chest ('invalid_trigger') : l'élève ne recevrait jamais le coffre.
const routes = fs.readFileSync(path.join(ROOT, 'src', 'routes.jsx'), 'utf8');
const xpSrc = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'xp.js'), 'utf8');
const known = new Set(G.chestTriggerRows().map((r) => r.trigger));
const literal = [];
for (const m of (app + routes).matchAll(/grant(?:ChestLocal|WeeklyChest)\("([a-z0-9_]+)",/g)) literal.push(m[1]);
for (const m of xpSrc.matchAll(/trigger:"([a-z0-9_]+)"(?=[,}])/g)) literal.push(m[1]); // pas les préfixes "xp_"+…
ok('au moins 15 déclencheurs littéraux relevés dans le client (' + literal.length + ')', literal.length >= 15);
literal.forEach((t) => ok('déclencheur « ' + t + ' » connu du serveur', known.has(t)));
// Déclencheurs construits : leurs préfixes doivent être ceux que le serveur sait vérifier.
const DYNAMIC = ['"streak_login_"', '"mission_streak_"', '"weekly_toeic_"', '"podium_"', '"ach_legendary_"', '"ach_epic_"',
  '"ach_novice_"', 'tierTrigger(', 'fullModId+"_perfect"', '"xp_"', '"league_up_"'];
const dyn = (app + routes + xpSrc).match(/(?<!function )grant(?:ChestLocal|WeeklyChest)\((?!")[^,]+|(?<!function )grant(?:ChestLocal|WeeklyChest)\("[a-z_]+"\+/g) || [];
// Les préfixes construits de lib/xp.js (xp_<n>k, league_up_<id>) : générés depuis XP_MILESTONES et LEAGUES.
ok('préfixes de lib/xp.js couverts (xp_, league_up_)', /trigger:"xp_"\+/.test(xpSrc) && /trigger:"league_up_"\+/.test(xpSrc)
  && known.has('xp_1k') && known.has('league_up_silver'));
dyn.forEach((d) => ok('déclencheur construit reconnu : ' + d, DYNAMIC.some((p) => d.includes(p.replace(/"$/, '')) || d.includes(p))
  || /ch\.trigger/.test(d)));
ok('les 4 épreuves du Gauntlet et les 2 du Modal Council ont leur défi parfait', ['irregular', 'tense', 'passive', 'relative']
  .every((s) => known.has('gauntlet_' + s + '_perfect')) && ['match', 'sort'].every((s) => known.has('modals_' + s + '_perfect')));

console.log((checks - fails) + '/' + checks + ' vérifications de l\'économie au vert');
process.exit(fails ? 1 : 0);
