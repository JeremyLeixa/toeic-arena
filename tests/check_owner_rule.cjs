/* Phase C : une seule règle de propriété (2026-09-24).
 *
 * POURQUOI CE TEST EXISTE. La tolérance legacy (« une ligne sans user_id passe ») vivait en 7 copies :
 * student_guard, save_student, grant_marks, consume_token, buy_item, claim_bourse_title, grant_token. Elles
 * appellent maintenant toutes _owner_ok(owner, promo), qui ne tolère une ligne legacy que hors mode strict
 * (identity_strict_classes). Rien ne casse au build si :
 *  · une nouvelle migration redéfinit l'une d'elles en recopiant l'ancienne condition (« v_owner IS NOT NULL AND
 *    v_owner IS DISTINCT FROM auth.uid() ») : la promo passée en mode strict resterait ouverte par cette porte ;
 *  · _owner_ok compare avec « = auth.uid() » : sans session, auth.uid() est NULL, la comparaison vaut NULL et
 *    « IF NOT NULL » ne refuse RIEN. C'est l'erreur attrapée par l'essai en transaction du 2026-09-24 : écrite
 *    ainsi, la règle ouvrait tout compte sécurisé aux appels anonymes.
 *
 * Lit la DERNIÈRE définition de chaque fonction dans supabase/migrations/ (ordre des fichiers).
 * Usage : node tests/check_owner_rule.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { collectDefs } = require(path.join(ROOT, 'scripts', 'clientPaths.cjs'));

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };

const defs = collectDefs(path.join(ROOT, 'supabase', 'migrations'));
const OLD_TOLERANCE = /IS\s+NOT\s+NULL\s+AND\s+\w+(\.\w+)?\s+IS\s+DISTINCT\s+FROM\s+(auth\.uid\(\)|v_uid)|IF\s+v_owner\s+IS\s+NULL\s+THEN\s+RETURN\s+'ok'/i;

const RULED = ['student_guard', 'save_student', 'grant_marks', 'consume_token', 'buy_item', 'claim_bourse_title', 'grant_token'];
RULED.forEach((fn) => {
  const d = defs[fn];
  ok(fn + ' : définie dans les migrations', !!d);
  if (!d) return;
  ok(fn + ' (' + d.file + ') passe par _owner_ok', /\b_owner_ok\s*\(/.test(d.body));
  ok(fn + ' (' + d.file + ') ne recopie pas l\'ancienne tolérance', !OLD_TOLERANCE.test(d.body));
});

// Aucune autre fonction (dernière définition) ne réintroduit une tolérance à part.
// Exemptée : bind_student_user_id, dont la condition voisine est une AUTRE règle (P2-D4) : ne refuser la liaison
// qu'à une ligne sécurisée (password_set_at posé) appartenant à quelqu'un d'autre. C'est elle qui permet la
// sécurisation d'un compte legacy.
// Ignorées : les fonctions supprimées par une migration postérieure à leur dernière définition (spend_marks…).
const fsx = require('fs');
const MIGS = path.join(ROOT, 'supabase', 'migrations');
const files = fsx.readdirSync(MIGS).filter((f) => f.endsWith('.sql')).sort();
const droppedAfter = (fn, defFile) => files.some((f) => f > defFile
  && new RegExp('DROP\\s+FUNCTION\\s+(IF\\s+EXISTS\\s+)?(public\\.)?' + fn + '\\s*\\(', 'i').test(fsx.readFileSync(path.join(MIGS, f), 'utf8')));
const EXEMPT = ['bind_student_user_id'];
Object.keys(defs).forEach((fn) => {
  if (RULED.includes(fn) || EXEMPT.includes(fn) || droppedAfter(fn, defs[fn].file)) return;
  ok(fn + ' (' + defs[fn].file + ') : pas de tolérance legacy recopiée (utiliser _owner_ok)', !OLD_TOLERANCE.test(defs[fn].body));
});

const o = defs._owner_ok;
ok('_owner_ok définie', !!o);
if (o) {
  const body = o.body.replace(/--.*$/gm, '');
  ok('_owner_ok compare par IS NOT DISTINCT FROM auth.uid() (NULL sans session = refus)', /IS\s+NOT\s+DISTINCT\s+FROM\s+auth\.uid\(\)/i.test(body));
  ok('_owner_ok n\'utilise jamais « = auth.uid() »', !/=\s*auth\.uid\(\)/i.test(body.replace(/DISTINCT\s+FROM\s+auth\.uid\(\)/gi, '')));
  ok('_owner_ok ne rend jamais NULL (COALESCE …, false)', /COALESCE\s*\([\s\S]*,\s*false\s*\)/i.test(body));
  ok('_owner_ok tolère toujours les visiteurs (choix de Jérémy)', /p_class_code\s*=\s*'visitor'\s+THEN\s+true/i.test(body));
  ok('_owner_ok lit le mode strict par promo ou global (identity_strict_classes, « * »)', /identity_strict_classes/.test(body) && /'\*'/.test(body));
}

console.log((checks - fails) + '/' + checks + ' vérifications de la règle de propriété au vert');
process.exit(fails ? 1 : 0);
