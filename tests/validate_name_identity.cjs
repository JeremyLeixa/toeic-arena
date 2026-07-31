/*
 * Homonymes — validation des helpers d'identité (2026-07-31).
 *
 * (name, class_code) est la clé naturelle de toute l'app : save() fait un
 * UPDATE .ilike(name).eq(class_code) SANS .limit(), et weekly_snapshots /
 * push_subscriptions / chest_log / pending_chests / player_rewards /
 * player_tokens sont keyés sur la même paire. Une régression sur ces
 * fonctions ne casse pas le build : elle fait silencieusement écrire un
 * étudiant dans la ligne d'un autre. D'où ce filet.
 *
 * Contrairement à validate_toeic_estimation.cjs, ce script ne recopie PAS
 * l'algo : il EXTRAIT les fonctions de src/App.jsx et les évalue. Une copie
 * dériverait de la prod sans prévenir — or c'est justement la dérive
 * silencieuse qu'on cherche à empêcher ici. Si une fonction est renommée ou
 * supprimée, l'extraction échoue bruyamment.
 *
 * Usage : node tests/validate_name_identity.cjs   (exit 1 si un cas casse)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, '..', 'src', 'App.jsx');
const src = fs.readFileSync(APP_PATH, 'utf8');

// Extraction par comptage d'accolades depuis "function <nom>(" — suffisant ici :
// les 4 helpers visés sont au top level et ne contiennent ni chaîne à accolade
// déséquilibrée ni template literal.
function extractFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('Fonction introuvable dans src/App.jsx : ' + name);
  let i = src.indexOf('{', start);
  if (i === -1) throw new Error('Corps introuvable pour : ' + name);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  throw new Error('Accolades déséquilibrées pour : ' + name);
}

const NAMES = ['normalizeName', 'composeDiscriminatedName', 'stripNameDiscriminant', 'resolveUniqueNameInClass'];
const bundle = NAMES.map(extractFn).join('\n');
// eslint-disable-next-line no-new-func
const helpers = new Function(bundle + '\nreturn {' + NAMES.join(',') + '};')();
const { normalizeName, composeDiscriminatedName, stripNameDiscriminant, resolveUniqueNameInClass } = helpers;

let fails = 0;
function eq(actual, expected, label) {
  const ok = actual === expected;
  if (!ok) fails++;
  console.log((ok ? '  ok  ' : '  FAIL') + '  ' + label + '  -> ' + JSON.stringify(actual) +
    (ok ? '' : '  (attendu ' + JSON.stringify(expected) + ')'));
}

console.log('\ncomposeDiscriminatedName');
eq(composeDiscriminatedName('Romain', 'L'), 'Romain L.', 'initiale');
eq(composeDiscriminatedName('Romain', 'l'), 'Romain L.', 'minuscule capitalisee');
eq(composeDiscriminatedName('Romain', 'Leb'), 'Romain Leb.', 'trois lettres');
eq(composeDiscriminatedName(' Romain ', '  L. '), 'Romain L.', 'trim + point tape retire');
// Garde-fou clé : % et _ sont des jokers dans le .ilike() de save(), un nom qui
// en contient ferait matcher l'UPDATE sur d'autres lignes.
eq(composeDiscriminatedName('Romain', '%_\\'), 'Romain', 'jokers SQL retires');
eq(composeDiscriminatedName('Romain', 'L%o'), 'Romain Lo.', 'joker retire au milieu');
eq(composeDiscriminatedName('Léa', 'Bérnard'), 'Léa Bérnard.', 'accents preserves');
eq(composeDiscriminatedName('Romain', 'abcdefghijkl'), 'Romain Abcdefgh.', 'plafonne a 8 caracteres');
eq(composeDiscriminatedName('Romain', ''), 'Romain', 'discriminant vide -> inchange');

console.log('\nstripNameDiscriminant');
eq(stripNameDiscriminant('Romain L.'), 'romain', 'forme canonique');
eq(stripNameDiscriminant('Romain Leb.'), 'romain', 'discriminant long');
// "Matteo S" existe deja dans la cohorte idrac2026 (cf. validate_toeic_estimation.cjs) :
// la convention preexistait a la main, sans le point.
eq(stripNameDiscriminant('Matteo S'), 'matteo', 'legacy sans point, 1 lettre');
eq(stripNameDiscriminant('Romain'), 'romain', 'prenom nu inchange');
// Sans ces 3 cas, tous les "Jean *" remonteraient dans l'ecran de reconnaissance
// de n'importe quel "Jean".
eq(stripNameDiscriminant('Jean Pierre'), 'jean pierre', 'prenom compose NON strippe');
eq(stripNameDiscriminant('Jean Luc'), 'jean luc', 'token 3 lettres sans point NON strippe');
eq(stripNameDiscriminant('Romaine Dupont'), 'romaine dupont', 'nom de famille NON strippe');
eq(stripNameDiscriminant('Léa L.'), 'lea', 'accents normalises');

console.log("\npredicat de lookupName : saisie 'Romain'");
const norm = normalizeName('Romain');
const nameMatches = (s) => normalizeName(s.name) === norm || stripNameDiscriminant(s.name) === norm;
[['Romain', true], ['romain', true], ['ROMAIN', true], ['Romain L.', true], ['Romain Leb.', true],
 ['Romaine', false], ['Romaine Dupont', false], ['Roman', false], ['Romain Dupont', false]]
  .forEach(([n, want]) => eq(nameMatches({ name: n }), want, "'" + n + "'"));

console.log('\nresolveUniqueNameInClass');
const rows = [{ name: 'Romain' }, { name: 'Romain L.' }];
eq(resolveUniqueNameInClass('Romain M.', rows), 'Romain M.', 'nom libre conserve');
eq(resolveUniqueNameInClass('Romain L.', rows), 'Romain L. 2', 'collision -> suffixe');
eq(resolveUniqueNameInClass('romain', rows), 'romain 2', 'collision insensible a la casse');
eq(resolveUniqueNameInClass('Romain L.', rows.concat([{ name: 'Romain L. 2' }])), 'Romain L. 3', 'saute les suffixes pris');

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' ECHEC(S)'));
process.exit(fails === 0 ? 0 : 1);
