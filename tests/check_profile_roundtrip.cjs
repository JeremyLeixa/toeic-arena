/* Le profil élève doit survivre à l'aller-retour vers Supabase sans perdre un champ.
 *
 * POURQUOI CE TEST EXISTE. CLAUDE.md impose une règle tenue de tête :
 *
 *   « Any new field must be added here AND in supaToLocal AND save() payload. »
 *
 * Trois endroits à modifier de concert, dans un fichier de 18 000 lignes. Un oubli ne
 * casse rien visiblement : le champ est bien en mémoire pendant la session, et il
 * disparaît au rechargement suivant. L'élève perd un réglage, un objectif, un cosmétique
 * équipé — et personne ne relie ça au commit qui l'a causé.
 *
 * Depuis la Phase C-lite s'ajoute un QUATRIÈME endroit : la liste blanche de colonnes de
 * `save_student` (2026-09-14_p2c_student_rpc.sql). Une clé envoyée qui n'y figure pas est
 * **silencieusement ignorée** par le serveur — l'écriture part, ne renvoie aucune erreur,
 * et ne persiste rien.
 *
 * ⚠️ PIÈGE ÉVITÉ ICI : tester avec un profil `fresh()` ne prouve presque rien. Toutes ses
 * valeurs sont des valeurs par défaut, donc un champ perdu en route et reconstruit par un
 * `|| défaut` dans supaToLocal ressort IDENTIQUE. Le test remplit donc chaque champ d'une
 * valeur distinctive avant l'aller-retour.
 *
 * Usage : node tests/check_profile_roundtrip.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let fails = 0;
const fail = (msg) => { fails++; console.log('  FAIL ' + msg); };

// ══════════════════════════════════════════════════════════════════════════
// Import natif de lib/profileSchema.js (découpage d'App.jsx, 2026-09-15)
// ══════════════════════════════════════════════════════════════════════════
// fresh / supaToLocal / buildSavePayload vivent dans un module PUR (aucun import
// Supabase, aucun JSX) précisément pour être requérables ici tels quels. Si ce require
// casse, c'est que quelqu'un a rendu profileSchema.js impur : le remettre pur, pas
// revenir au découpage de texte.
const app = require(path.join(ROOT, 'src', 'lib', 'profileSchema.js'));

// ══════════════════════════════════════════════════════════════════════════
// Colonnes que le client n'a PAS le droit d'écrire (finding C3)
// ══════════════════════════════════════════════════════════════════════════
// access_level / access_expires_at : entitlement, écrits par le seul webhook Stripe.
// arena_marks : monnaie, incrémentée par grant_marks/spend_marks — un full-row UPDATE
// écraserait tout gain arrivé entre temps.
// Leur absence du payload est VOLONTAIRE : elles ne doivent donc pas revenir de
// l'aller-retour, et le test l'exige dans les deux sens.
const SERVER_OWNED = ['accessLevel', 'accessExpiresAt', 'arenaMarks'];
const SERVER_OWNED_SQL = ['access_level', 'access_expires_at', 'arena_marks'];

// ══════════════════════════════════════════════════════════════════════════
// 1. Aller-retour sans perte, avec des valeurs distinctives
// ══════════════════════════════════════════════════════════════════════════

// Valeur reconnaissable, du même type que l'originale. Toujours TRUTHY : un `|| défaut`
// dans supaToLocal ne doit pas pouvoir la remplacer sans qu'on le voie.
function distinct(v, i) {
  if (Array.isArray(v)) return ['ZZ' + i];
  if (v && typeof v === 'object') return { zz: i };
  if (typeof v === 'number') return 4200 + i;
  if (typeof v === 'boolean') return true;
  return 'ZZ' + i; // string, null, undefined
}

const base = app.fresh('Zoé Test', 'idrac2026');
const filled = {};
Object.keys(base).forEach((k, i) => { filled[k] = distinct(base[k], i); });
// La clé naturelle reste une vraie chaîne : elle n'est pas dans le payload, elle
// identifie la ligne.
filled.name = 'Zoé Test';
filled.classCode = 'idrac2026';

const payload = app.buildSavePayload(filled);
const row = Object.assign({ name: filled.name, class_code: filled.classCode }, payload);
const back = app.supaToLocal(row);

console.log('Aller-retour du profil — ' + Object.keys(base).length + ' champs, '
  + Object.keys(payload).length + ' colonnes envoyées\n');

for (const k of Object.keys(filled)) {
  if (SERVER_OWNED.indexOf(k) >= 0) continue;
  if (!(k in back)) {
    fail('champ « ' + k +' » PERDU : présent dans fresh(), absent du retour de supaToLocal. '
      + 'Il disparaîtra au rechargement. Vérifier buildSavePayload ET supaToLocal.');
    continue;
  }
  if (JSON.stringify(back[k]) !== JSON.stringify(filled[k])) {
    fail('champ « ' + k + ' » ALTÉRÉ : envoyé ' + JSON.stringify(filled[k])
      + ', revenu ' + JSON.stringify(back[k]) + '. '
      + 'Souvent un `|| défaut` qui écrase, ou une colonne absente du payload.');
  }
}

for (const k of Object.keys(back)) {
  if (!(k in filled)) {
    fail('champ « ' + k + ' » reconstruit par supaToLocal mais absent de fresh() : '
      + 'un profil neuf ne l\'aura pas. À ajouter dans fresh().');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Les colonnes serveur ne doivent JAMAIS partir du client
// ══════════════════════════════════════════════════════════════════════════
for (const col of SERVER_OWNED_SQL) {
  if (col in payload) {
    fail('buildSavePayload envoie « ' + col + ' » : régression du finding C3. '
      + 'Cette colonne appartient au serveur (webhook Stripe / grant_marks), '
      + 'la renvoyer depuis le client rouvre la voie au premium forgé.');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 3. Le payload doit correspondre EXACTEMENT à la liste blanche de save_student
// ══════════════════════════════════════════════════════════════════════════
// Une clé envoyée hors liste blanche est ignorée en silence par la RPC : aucune erreur
// remontée, aucune persistance. C'est le mode d'échec le plus sournois du verrou.
// La liste blanche est lue dans la DERNIÈRE migration qui (re)définit save_student : un
// `CREATE OR REPLACE` ultérieur écrase le précédent en base, donc lire un fichier figé ferait
// mentir ce test dès la migration suivante (c'était le cas jusqu'au 2026-09-17, où l'ajout de la
// colonne `review` passait par un nouveau fichier). Même règle que check_rpc_contracts.
const MIG_DIR = path.join(ROOT, 'supabase', 'migrations');
const MIG = fs.readdirSync(MIG_DIR).filter((f) => /\.sql$/.test(f)).sort()
  .filter((f) => /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.save_student/i.test(fs.readFileSync(path.join(MIG_DIR, f), 'utf8')))
  .pop();
const sql = MIG ? fs.readFileSync(path.join(MIG_DIR, MIG), 'utf8').replace(/\r\n/g, '\n') : '';
const m = sql.match(/v_cols\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/);
if (!MIG) {
  fail('aucune migration ne définit save_student — le test ne peut plus vérifier la liste blanche.');
} else if (!m) {
  fail('liste blanche v_cols introuvable dans ' + MIG
    + ' — le test ne peut plus vérifier la correspondance (parseur à corriger).');
} else {
  const white = (m[1].match(/'([a-z_]+)'/g) || []).map(s => s.replace(/'/g, ''));
  const sent = Object.keys(payload);
  for (const k of sent) {
    if (white.indexOf(k) < 0) {
      fail('colonne « ' + k + ' » envoyée par buildSavePayload mais ABSENTE de la liste '
        + 'blanche de save_student : la RPC l\'ignore en silence, la donnée ne persiste pas.');
    }
  }
  for (const k of white) {
    if (sent.indexOf(k) < 0) {
      fail('colonne « ' + k + ' » autorisée par save_student mais jamais envoyée : '
        + 'soit le client a cessé de la sauvegarder, soit la liste blanche est trop large.');
    }
  }
  console.log('  liste blanche SQL (' + MIG + ') : ' + white.length + ' colonnes, payload : ' + sent.length);
  // Une colonne présente dans v_cols mais absente du SET de l'UPDATE (ou de l'INSERT) passe le
  // filtre puis n'est jamais écrite : la donnée disparaît sans erreur. Quatre listes à tenir.
  const upd = (sql.match(/UPDATE students SET([\s\S]*?)WHERE id = v_row\.id/) || [])[1] || '';
  const insCols = (sql.match(/INSERT INTO students\(([\s\S]*?)\)\s*VALUES/) || [])[1] || '';
  for (const k of white) {
    if (upd.indexOf(k + ' = v_new.' + k) < 0) {
      fail('colonne « ' + k + ' » dans la liste blanche mais absente du SET de l\'UPDATE : '
        + 'la RPC accepte la clé et ne l\'écrit jamais.');
    }
    if (!new RegExp('(^|[\\s,(])' + k + '([\\s,)]|$)').test(insCols)) {
      fail('colonne « ' + k + ' » dans la liste blanche mais absente de l\'INSERT : '
        + 'elle serait perdue à la création du profil.');
    }
  }
}

console.log(fails === 0
  ? '\nOK — aucun champ ne se perd entre le client, le payload et la base.'
  : '\n' + fails + ' problème(s).');
process.exit(fails === 0 ? 0 : 1);
