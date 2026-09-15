/* L'identité des élèves : le normaliseur de noms ne doit jamais bouger.
 *
 * POURQUOI CE TEST EXISTE. `normNameForEmail` décide de l'adresse du compte Supabase Auth :
 *
 *     signInStudent(nom, promo, mdp) → signInWithPassword(synthEmail(nom, promo), mdp)
 *
 * Cette adresse est calculée à CHAQUE connexion, jamais stockée. Si la fonction change de
 * sortie — un caractère traité différemment, un accent, un tiret — l'adresse calculée ne
 * correspond plus au compte créé au moment de l'inscription, et l'élève est **définitivement
 * enfermé dehors** : son mot de passe est bon, mais on interroge un compte qui n'existe pas.
 *
 * Ce n'est pas théorique. Le 2026-09-15, trois comptes (dont celui du formateur) étaient
 * exactement dans cet état, pour une raison voisine : un `password_set_at` hérité de
 * l'ancien système renvoyait vers une adresse réelle, alors que le login visait l'adresse
 * synthétique. Symptôme : « mot de passe incorrect », quel que soit le mot de passe.
 *
 * Le second normaliseur, `normalizeName` (lib/util.js), est le **miroir JS de `norm_name(text)`**
 * en SQL, qui sert à retrouver une ligne `students`. S'ils divergent, le client cherche un
 * élève que la base ne trouve pas — ou l'inverse.
 *
 * Usage : node tests/check_identity.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let fails = 0;
const fail = (msg) => { fails++; console.log('  FAIL ' + msg); };

// ══════════════════════════════════════════════════════════════════════════
// Extraction (auth.js importe supabase : non requérable). normalizeName vit dans
// lib/util.js, module pur : requis tel quel (découpage d'App.jsx, 2026-09-15).
// ══════════════════════════════════════════════════════════════════════════
function sliceFunction(src, name) {
  const a = src.indexOf('function ' + name + '(');
  if (a < 0) throw new Error('fonction introuvable : ' + name);
  let i = src.indexOf('{', a), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(a, i + 1); }
  }
  throw new Error('accolades non refermées : ' + name);
}

const AUTH = fs.readFileSync(path.join(ROOT, 'src', 'auth.js'), 'utf8').replace(/\r\n/g, '\n');

const domLine = AUTH.match(/const SYNTH_EMAIL_DOMAIN\s*=\s*'[^']*';/);
if (!domLine) throw new Error('SYNTH_EMAIL_DOMAIN introuvable dans auth.js');

const F = new Function([
  domLine[0],
  sliceFunction(AUTH, 'normNameForEmail'),
  sliceFunction(AUTH, 'synthEmail'),
].join('\n') + '\nreturn {normNameForEmail, synthEmail, SYNTH_EMAIL_DOMAIN};')();
F.normalizeName = require(path.join(ROOT, 'src', 'lib', 'util.js')).normalizeName;

console.log('Identité — normaliseurs de noms et adresse synthétique\n');

// ══════════════════════════════════════════════════════════════════════════
// 1. Corpus figé — LA protection contre l'enfermement dehors
// ══════════════════════════════════════════════════════════════════════════
// Ces valeurs ne sont pas des choix esthétiques : ce sont les adresses des comptes
// Auth réellement créés. Les changer casse la connexion des élèves déjà migrés.
// Modifier ce tableau sans plan de migration des comptes = les enfermer dehors.
const GOLDEN = [
  // [saisie,            normalizeName,       normNameForEmail]
  ['Zoé',                'zoe',               'zoe'],
  ['Jérôme',             'jerome',            'jerome'],
  ['José',               'jose',              'jose'],
  ['Anaïs',              'anais',             'anais'],
  ['Noé',                'noe',               'noe'],
  ['Françoise',          'francoise',         'francoise'],  // ç : NFD → c + cédille combinante
  ['Lêe Ann',            'lee ann',           'leeann'],
  ['  HUGO  ',           'hugo',              'hugo'],        // espaces rognés
  ['ALEX',               'alex',              'alex'],        // casse
  ['Baptiste C',         'baptiste c',        'baptistec'],   // espace interne
  ['Jean Pierre',        'jean pierre',       'jeanpierre'],
  ['Maria Elakredar',    'maria elakredar',   'mariaelakredar'],
  ['Matteo S',           'matteo s',          'matteos'],
  ['Marie-Claire',       'marie-claire',      'marieclaire'], // tiret : gardé par l'un, pas l'autre
  ["O'Brien",            "o'brien",           'obrien'],      // apostrophe idem
  ['a',                  'a',                 'a'],
];

for (const [input, expNorm, expEmail] of GOLDEN) {
  const gotNorm = F.normalizeName(input);
  const gotEmail = F.normNameForEmail(input);
  if (gotNorm !== expNorm) {
    fail('normalizeName(' + JSON.stringify(input) + ') = ' + JSON.stringify(gotNorm)
      + ', attendu ' + JSON.stringify(expNorm) + '. '
      + 'Cette fonction est le miroir de norm_name(text) en SQL : si elle bouge, '
      + 'la migration SQL correspondante doit bouger aussi, sinon les lookups cassent.');
  }
  if (gotEmail !== expEmail) {
    fail('normNameForEmail(' + JSON.stringify(input) + ') = ' + JSON.stringify(gotEmail)
      + ', attendu ' + JSON.stringify(expEmail) + '. '
      + 'ATTENTION : cette valeur est l\'adresse du compte Auth. La changer enferme '
      + 'dehors tous les élèves déjà migrés dont le nom passe par ce cas.');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 2. La relation entre les deux normaliseurs
// ══════════════════════════════════════════════════════════════════════════
// normNameForEmail == normalizeName + suppression de tout ce qui n'est pas [a-z0-9].
// Les tenir liés garantit qu'une correction d'accent appliquée à l'un profite à
// l'autre — et que le miroir SQL reste valable pour les deux.
for (const [input] of GOLDEN) {
  const derived = F.normalizeName(input).replace(/[^a-z0-9]/g, '');
  if (F.normNameForEmail(input) !== derived) {
    fail('les deux normaliseurs divergent sur ' + JSON.stringify(input) + ' : '
      + JSON.stringify(F.normNameForEmail(input)) + ' vs ' + JSON.stringify(derived)
      + '. Ils doivent rester « même normalisation, l\'un gardant la ponctuation ».');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 3. Idempotence
// ══════════════════════════════════════════════════════════════════════════
// Renormaliser une valeur déjà normalisée ne doit rien changer : sans ça, un
// aller-retour de plus dans le code produirait une autre adresse.
for (const [input] of GOLDEN) {
  const once = F.normNameForEmail(input);
  if (F.normNameForEmail(once) !== once) {
    fail('normNameForEmail non idempotente sur ' + JSON.stringify(input)
      + ' : ' + JSON.stringify(once) + ' → ' + JSON.stringify(F.normNameForEmail(once)));
  }
  const n1 = F.normalizeName(input);
  if (F.normalizeName(n1) !== n1) {
    fail('normalizeName non idempotente sur ' + JSON.stringify(input));
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 4. L'adresse synthétique
// ══════════════════════════════════════════════════════════════════════════
const EXPECTED_DOMAIN = 'students.verse-arena.fr';
if (F.SYNTH_EMAIL_DOMAIN !== EXPECTED_DOMAIN) {
  fail('SYNTH_EMAIL_DOMAIN = ' + JSON.stringify(F.SYNTH_EMAIL_DOMAIN) + ', attendu '
    + JSON.stringify(EXPECTED_DOMAIN) + '. Changer de domaine invalide TOUS les comptes '
    + 'existants — c\'est une migration, pas une modification.');
}
if (F.synthEmail('Zoé', 'idrac2026') !== 'zoe.idrac2026@' + EXPECTED_DOMAIN) {
  fail('synthEmail ne compose plus <nom>.<promo>@<domaine> : '
    + F.synthEmail('Zoé', 'idrac2026'));
}
// Le code promo est nettoyé mais garde ses tirets (cesi-rqse-27 est un code réel).
if (F.synthEmail('Zoe', 'CESI-RQSE-27') !== 'zoe.cesi-rqse-27@' + EXPECTED_DOMAIN) {
  fail('synthEmail abîme les codes promo à tirets : ' + F.synthEmail('Zoe', 'CESI-RQSE-27'));
}

// 5. Les refus. Laisser passer un nom qui se normalise à vide créerait un compte
//    « .promo@… » partagé par tous les noms non latins.
const mustThrow = (fn, what) => {
  try { fn(); fail(what + ' : aucune exception levée, alors qu\'elle est attendue.'); }
  catch (e) { /* attendu */ }
};
mustThrow(() => F.synthEmail('日本語', 'idrac2026'), 'nom entièrement non latin');
mustThrow(() => F.synthEmail('---', 'idrac2026'), 'nom réduit à de la ponctuation');
mustThrow(() => F.synthEmail('Zoe', ''), 'code promo vide');

// ══════════════════════════════════════════════════════════════════════════
// Note — les collisions sont VOULUES, pas un défaut
// ══════════════════════════════════════════════════════════════════════════
// « Marie-Claire », « Marie Claire » et « marieclaire » donnent la même adresse.
// C'est le comportement attendu (un élève doit se reconnecter même en tapant son
// nom un peu différemment), et c'est pour ça que l'index unique porte sur
// (normNameForEmail, class_code) : deux élèves réellement distincts de la même
// promo ne peuvent pas s'y retrouver à deux.
if (F.normNameForEmail('Marie-Claire') !== F.normNameForEmail('Marie Claire')) {
  fail('« Marie-Claire » et « Marie Claire » ne donnent plus la même adresse : '
    + 'un élève qui tape son nom autrement qu\'à l\'inscription ne se reconnecte plus.');
}

console.log(fails === 0
  ? 'OK — ' + GOLDEN.length + ' cas figés, relation et idempotence vérifiées.'
  : '\n' + fails + ' problème(s).');
process.exit(fails === 0 ? 0 : 1);
