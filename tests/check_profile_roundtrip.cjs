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
// Extraction depuis App.jsx (non importable : JSX + React + CSS inline)
// ══════════════════════════════════════════════════════════════════════════
// Découpage par comptage d'accolades plutôt que « jusqu'au prochain commentaire » :
// insensible à la mise en forme et aux lignes qui bougent au-dessus.
const APP = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8').replace(/\r\n/g, '\n');

function sliceFunction(src, name) {
  const a = src.indexOf('function ' + name + '(');
  if (a < 0) throw new Error('fonction introuvable dans App.jsx : ' + name);
  let i = src.indexOf('{', a), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(a, i + 1); }
  }
  throw new Error('accolades non refermées : ' + name);
}

const NAMES = ['today', 'weekId', 'fresh', 'buildSavePayload', 'supaToLocal'];
const app = new Function(NAMES.map(n => sliceFunction(APP, n)).join('\n')
  + '\nreturn {' + NAMES.join(',') + '};')();

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
const MIG = path.join(ROOT, 'supabase', 'migrations', '2026-09-14_p2c_student_rpc.sql');
const sql = fs.readFileSync(MIG, 'utf8').replace(/\r\n/g, '\n');
const m = sql.match(/v_cols\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/);
if (!m) {
  fail('liste blanche v_cols introuvable dans ' + path.basename(MIG)
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
  console.log('  liste blanche SQL : ' + white.length + ' colonnes, payload : ' + sent.length);
}

console.log(fails === 0
  ? '\nOK — aucun champ ne se perd entre le client, le payload et la base.'
  : '\n' + fails + ' problème(s).');
process.exit(fails === 0 ? 0 : 1);
