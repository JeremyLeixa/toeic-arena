/* Invariants du butin : ce que le client tire doit être persistable et connu.
 *
 * POURQUOI CE TEST EXISTE. Depuis le 2026-09-15, l'ouverture d'un coffre passe par
 * `open_pending_chest`, qui persiste les récompenses avec une liste blanche de types :
 *
 *     IF v_type IN ('avatar','skin','frame','title','cheat_sheet') ... INSERT
 *
 * Tout autre type est **ignoré en silence** — pas d'erreur, pas de ligne. Un nouveau type
 * de récompense ajouté côté client (`pickRewards`) sans toucher au SQL disparaîtrait donc
 * à l'ouverture : l'élève voit l'animation, la carte, le nom du lot… et ne possède rien
 * après rechargement. Exactement le genre de bug qu'on ne découvre que par une plainte.
 *
 * Même logique pour les identifiants : `openChestFromPending` fait `TOKEN_TYPES[r.id]` et
 * saute silencieusement si la clé est absente. Un jeton mal orthographié ne tombe jamais.
 *
 * Le test lit la liste blanche DANS le fichier de migration plutôt que de la recopier :
 * si la RPC gagne un type, le test suit tout seul.
 *
 * Usage : node tests/check_chest_drops.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RUNS = 2000; // par type de coffre, et par profil (neuf / tout possédé)

let fails = 0;
const seen = new Set();
// Un même défaut se répète sur des milliers de tirages : on ne le signale qu'une fois,
// sinon un seul bug noie la sortie sous 2000 lignes identiques.
function fail(key, msg) {
  if (seen.has(key)) return;
  seen.add(key); fails++; console.log('  FAIL ' + msg);
}

// ══════════════════════════════════════════════════════════════════════════
// Le module pur des coffres
// ══════════════════════════════════════════════════════════════════════════
// Depuis le 2026-09-24, catalogues et tables de tirage vivent dans src/data/chestCatalog.js (sans Supabase) :
// plus de découpage de texte de chests.js, le module se charge tel quel.
const M = require(path.join(ROOT, 'src', 'data', 'chestCatalog.js'));

// ══════════════════════════════════════════════════════════════════════════
// Les types persistés, lus dans la migration
// ══════════════════════════════════════════════════════════════════════════
const MIG = path.join(ROOT, 'supabase', 'migrations', '2026-09-15_p2d3_chest_rpc.sql');
const sql = fs.readFileSync(MIG, 'utf8').replace(/\r\n/g, '\n');
const mWhite = sql.match(/v_type\s+IN\s*\(([^)]*)\)/i);
if (!mWhite) throw new Error('liste blanche des types introuvable dans '
  + path.basename(MIG) + ' — parseur à corriger.');
const PERSISTED = (mWhite[1].match(/'([a-z_]+)'/g) || []).map(s => s.replace(/'/g, ''));

// Types traités ailleurs que par un INSERT player_rewards, donc légitimes :
// xp et daric sont agrégés et rendus à l'appelant, token passe par grant_token.
const HANDLED_ELSEWHERE = ['xp', 'daric', 'token'];
const ALLOWED = PERSISTED.concat(HANDLED_ELSEWHERE);

// ══════════════════════════════════════════════════════════════════════════
// Index des identifiants connus, par type
// ══════════════════════════════════════════════════════════════════════════
const idsOf = (pool) => new Set(Array.isArray(pool)
  ? pool.map(x => (x && typeof x === 'object') ? x.id : x)
  : Object.keys(pool || {}));
const KNOWN = {
  avatar: idsOf(M.AVATARS), skin: idsOf(M.SKINS), frame: idsOf(M.FRAMES),
  title: idsOf(M.TITLES), cheat_sheet: idsOf(M.CHEAT_SHEETS), token: idsOf(M.TOKEN_TYPES),
};

const everything = {
  avatars: [...KNOWN.avatar], skins: [...KNOWN.skin], frames: [...KNOWN.frame],
  titles: [...KNOWN.title], cheatSheets: [...KNOWN.cheat_sheet], tokens: {},
};
const nothing = { avatars: [], skins: [], frames: [], titles: [], cheatSheets: [], tokens: {} };

// ══════════════════════════════════════════════════════════════════════════
// Tirages
// ══════════════════════════════════════════════════════════════════════════
const chestTypes = Object.keys(M.DROP_TABLES);
console.log('Invariants du butin — ' + chestTypes.length + ' types de coffre × '
  + RUNS + ' tirages × 2 profils');
console.log('  types persistés par open_pending_chest : ' + PERSISTED.join(', ') + '\n');

// Garanties de palier documentées dans CLAUDE.md (« V2 segmented drop tables »).
const GUARANTEES = {
  novice:     { tokens: [1, 1], cosmetics: [0, 0], cheatSheets: [0, 0] },
  guerrier:   { tokens: [2, 2], cosmetics: [1, 1], cheatSheets: [0, 0] },
  champion:   { tokens: [3, 3], cosmetics: [1, 1], cheatSheets: [0, 0] },
  legendaire: { tokens: [3, 4], cosmetics: [2, 2], cheatSheets: [1, 1] },
};
const COSMETIC = ['avatar', 'skin', 'frame', 'title'];

// Replis connus, tirés de pickRewards : un lot d'XP supplémentaire quand un pool est
// épuisé. `tokens_capped` = tous les jetons du slot sont au plafond ;
// `sheets_owned` = toutes les cheat sheets sont déjà possédées (300 XP à la place).
// Les cosmétiques, eux, ne se replient PAS sur de l'XP : ils rendent un doublon, qui
// alimente la conversion « 3 doublons → 1 jeton ».
const KNOWN_FALLBACKS = ['tokens_capped', 'sheets_owned'];

for (const ct of chestTypes) {
  for (const [label, owned] of [['profil neuf', nothing], ['tout possédé', everything]]) {
    for (let i = 0; i < RUNS; i++) {
      const rewards = M.pickRewards(ct, owned);
      const n = { token: 0, cosmetic: 0, cheat_sheet: 0, xp: 0, daric: 0 };
      // Replis prévus par pickRewards quand un pool est épuisé : un lot d'XP
      // supplémentaire, marqué d'une raison. Ils s'ajoutent au lot d'XP normal.
      const fallbacks = rewards.filter(r => r.fallback).map(r => r.fallback);

      for (const r of rewards) {
        // 1. Le type est-il traitable par le serveur ?
        if (ALLOWED.indexOf(r.type) < 0) {
          fail('type:' + r.type, ct + ' (' + label + ') : type de récompense « ' + r.type
            + ' » inconnu. open_pending_chest ne persiste que [' + PERSISTED.join(', ')
            + '] et IGNORE le reste EN SILENCE — l\'élève ne posséderait rien après ouverture.');
          continue;
        }
        // 2. L'identifiant existe-t-il dans son pool ?
        if (KNOWN[r.type] && !KNOWN[r.type].has(r.id)) {
          fail('id:' + r.type + ':' + r.id, ct + ' (' + label + ') : ' + r.type
            + ' « ' + r.id + ' » absent du pool correspondant.'
            + (r.type === 'token' ? ' openChestFromPending fait TOKEN_TYPES[id] et saute'
              + ' silencieusement : ce jeton ne serait jamais accordé.' : ''));
        }
        if (r.type === 'token') n.token++;
        else if (COSMETIC.indexOf(r.type) >= 0) n.cosmetic++;
        else if (r.type === 'cheat_sheet') n.cheat_sheet++;
        else if (r.type === 'xp' && !r.fallback) n.xp++;
        else if (r.type === 'daric') n.daric++;
      }

      // 3. Tout coffre rend exactement un lot d'XP (hors replis) et un lot de Darics.
      if (n.xp !== 1) fail('xp:' + ct, ct + ' (' + label + ') : ' + n.xp + ' lot(s) d\'XP, 1 attendu.');
      if (n.daric !== 1) fail('daric:' + ct, ct + ' (' + label + ') : ' + n.daric + ' lot(s) de Darics, 1 attendu.');

      // 3b. Tout repli doit être l'un de ceux que l'on connaît. Un repli d'un nouveau
      //     nom ferait échouer le test — c'est voulu : il faut alors décider s'il est
      //     légitime, et le documenter ici plutôt que de le découvrir en production.
      for (const fb of fallbacks) {
        if (KNOWN_FALLBACKS.indexOf(fb) < 0) {
          fail('fb:' + fb, ct + ' (' + label + ') : repli inconnu « ' + fb + ' ». '
            + 'Connus : ' + KNOWN_FALLBACKS.join(', ') + '.');
        }
      }

      // 4. Les garanties de palier.
      const g = GUARANTEES[ct];
      if (!g) { fail('guar:' + ct, 'type de coffre « ' + ct + ' » sans garantie déclarée dans ce test.'); continue; }
      const check = (got, [lo, hi], what) => {
        if (got < lo || got > hi) {
          fail(what + ':' + ct, ct + ' (' + label + ') : ' + got + ' ' + what
            + ', attendu ' + (lo === hi ? lo : lo + ' à ' + hi) + '.');
        }
      };
      check(n.token, g.tokens, 'jeton(s)');
      check(n.cosmetic, g.cosmetics, 'cosmétique(s)');
      // La cheat sheet garantie du Légendaire cède la place à un repli « sheets_owned »
      // (300 XP) quand l'élève les possède déjà toutes. L'une OU l'autre, jamais rien.
      if (g.cheatSheets[1] > 0 && n.cheat_sheet === 0) {
        if (fallbacks.indexOf('sheets_owned') < 0) {
          fail('sheet:' + ct, ct + ' (' + label + ') : aucune cheat sheet ET aucun repli '
            + '« sheets_owned ». La garantie du palier saute sans compensation.');
        }
      } else {
        check(n.cheat_sheet, g.cheatSheets, 'cheat sheet(s)');
      }
    }
  }
}

// 5. Un joueur qui possède tout doit recevoir des doublons, pas du vide : c'est ce qui
//    alimente la conversion « 3 doublons → 1 jeton ».
const full = M.pickRewards('legendaire', everything);
if (!full.some(r => COSMETIC.indexOf(r.type) >= 0)) {
  fail('dup', 'un joueur possédant tous les cosmétiques ne reçoit plus aucun cosmétique '
    + 'sur un Légendaire : le système anti-frustration (doublons → jetons) est cassé.');
}

console.log(fails === 0
  ? 'OK — tout ce qui est tiré est persistable et connu.'
  : '\n' + fails + ' problème(s) distinct(s).');
process.exit(fails === 0 ? 0 : 1);
