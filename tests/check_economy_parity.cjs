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

// ── lot 2c : conversions décidées par le serveur ──
// Le SQL écrit ses listes de jetons en dur : un jeton ajouté à TOKEN_TYPES sans passer par ici serait
// inaccessible par conversion (ou, pire, un jeton de boost deviendrait convertible).
const conv = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '2026-09-24_economy_lot2c_conversions.sql'), 'utf8');
const sqlArrays = [...conv.matchAll(/unnest\(ARRAY\[([^\]]+)\]\)/g)].map((m) => m[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1)).sort());
const nonPrem = rows.tokens.filter((t) => !t.premium && !t.boost).map((t) => t.type).sort();
const prem = rows.tokens.filter((t) => t.premium && t.type !== 'insight_token').map((t) => t.type).sort();
ok('convert_dups_to_token rend un jeton non premium (liste = TOKEN_TYPES)', JSON.stringify(sqlArrays[0]) === JSON.stringify(nonPrem));
ok('convert_tokens_premium rend un jeton premium hors insight (liste = TOKEN_TYPES)', JSON.stringify(sqlArrays[1]) === JSON.stringify(prem));
const srcCheck = (conv.match(/p_source NOT IN \(([^)]+)\)/) || [, ''])[1].match(/'([a-z_]+)'/g) || [];
ok('source d\'une conversion premium = jetons non premium', JSON.stringify(srcCheck.map((s) => s.slice(1, -1)).sort()) === JSON.stringify(nonPrem));
ok('doublons convertis par convert_dups_to_token', /rpc\("convert_dups_to_token"/.test(chests));
ok('jetons convertis par convert_tokens_premium', /rpc\("convert_tokens_premium"/.test(chests));
const clientSrc = chests + app + fs.readFileSync(path.join(ROOT, 'src', 'features', 'shop', 'Shop.jsx'), 'utf8');
ok('plus aucun appel client à grant_token', !/rpc\(["']grant_token["']/.test(clientSrc));
ok('plus aucun appel client à convert_cosmetic_dups', !/rpc\(["']convert_cosmetic_dups["']/.test(clientSrc));

// ── fermeture du lot 2 : grant_marks n'accepte que les sources du jeu ──
// Une source ajoutée côté client sans l'ajouter au SQL serait refusée ('invalid_source') : Darics jamais versés.
const close2 = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '2026-09-24_economy_lot2_close.sql'), 'utf8');
const marksSql = ((close2.match(/p_source NOT IN \(([^)]+)\)/) || [, ''])[1].match(/'([a-z_]+)'/g) || []).map((s) => s.slice(1, -1));
const marksClient = [...new Set([...app.matchAll(/grantMarks\([^,]+,"([a-z_]+)"/g)].map((m) => m[1]))];
ok('au moins 6 sources de Darics relevées dans App.jsx (' + marksClient.length + ')', marksClient.length >= 6);
marksClient.forEach((s) => ok('source de Darics « ' + s + ' » acceptée par grant_marks', marksSql.includes(s)));
['chest', 'shop', 'admin', 'admin_bonus'].forEach((s) => ok('grant_marks refuse la source « ' + s + ' »', marksSql.length > 0 && !marksSql.includes(s)));
ok('grantMarks n\'est appelé qu\'avec une source littérale', !/grantMarks\([^,)]+,(?!")[^,)]+,/.test(app.replace(/function grantMarks\(/, '')));

// ── lot 3 : garde-fou XP dans save_student ──
// La dernière migration qui définit save_student doit toujours passer par _xp_guard, et les colonnes de base du
// jour ne doivent JAMAIS entrer dans la liste blanche : le client pourrait remettre sa base à zéro.
const MIGS = path.join(ROOT, 'supabase', 'migrations');
const lastSave = fs.readdirSync(MIGS).filter((f) => f.endsWith('.sql')).sort()
  .filter((f) => /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.save_student/i.test(fs.readFileSync(path.join(MIGS, f), 'utf8'))).pop();
const saveSql = lastSave ? fs.readFileSync(path.join(MIGS, lastSave), 'utf8') : '';
const vcols = (saveSql.match(/v_cols\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/) || [, ''])[1];
ok('save_student (' + lastSave + ') plafonne l\'XP par _xp_guard', /FROM _xp_guard\(v_row,/.test(saveSql) && /v_new\.xp := v_g\.o_xp/.test(saveSql));
ok('save_student plafonne aussi un profil neuf (40 000)', /v_new\.xp := LEAST\(COALESCE\(v_new\.xp, 0\), 40000\)/.test(saveSql));
ok('save_student note toute journée au-dessus du seuil d\'alerte, plafonnée ou non', /IF v_g\.o_alert THEN/.test(saveSql));
ok('colonnes xp_day_* hors de la liste blanche du client', vcols.length > 0 && !/xp_day/.test(vcols));
// Lot 3b (choix de Jérémy) : alerte à +20 000, plafond à +40 000. Des semaines réelles montent à 44 365 : un
// plafond plus bas retirerait de l'XP aux gros joueurs honnêtes.
const lastGuard = fs.readdirSync(MIGS).filter((f) => f.endsWith('.sql')).sort()
  .filter((f) => /FUNCTION public\._xp_guard\(/.test(fs.readFileSync(path.join(MIGS, f), 'utf8'))).pop();
const guardSql = lastGuard ? fs.readFileSync(path.join(MIGS, lastGuard), 'utf8') : '';
ok('seuil d\'alerte 20 000 et plafond 40 000 (' + lastGuard + ')', /c_alert CONSTANT integer := 20000/.test(guardSql)
  && /c_max CONSTANT integer := 40000/.test(guardSql));
const dash = fs.readFileSync(path.join(ROOT, 'src', 'features', 'teacher', 'TeacherDash.jsx'), 'utf8');
ok('plafonnements affichés dans l\'onglet Usage (teacher_xp_clamps)', /rpc\('teacher_xp_clamps'/.test(dash));

console.log((checks - fails) + '/' + checks + ' vérifications de l\'économie au vert');
process.exit(fails ? 1 : 0);
