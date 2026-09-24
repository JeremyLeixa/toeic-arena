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

console.log((checks - fails) + '/' + checks + ' vérifications de l\'économie au vert');
process.exit(fails ? 1 : 0);
