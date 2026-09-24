/* Droit à l'effacement (RGPD) : ce que purgent delete_my_account et teacher_delete_student (2026-09-24).
 *
 * POURQUOI CE TEST EXISTE. Rien ne casse le build si :
 *  · une table qui porte des données de l'élève est oubliée par l'effacement (feedback_reports l'était
 *    jusqu'au 2026-09-24, avec le texte libre des messages) ; une nouvelle table satellite doit être
 *    ajoutée ici ET aux deux fonctions ;
 *  · le client, sur un refus du serveur (compte non sécurisé, session d'un autre, réseau), déconnecte et
 *    efface le local QUAND MÊME : l'élève croit son compte effacé, il est intact sur le serveur.
 * Les définitions lues sont les DERNIÈRES des migrations (ordre des fichiers), comme check_rpc_contracts.
 *
 * Usage : node tests/check_rgpd_erasure.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MIG = path.join(ROOT, 'supabase', 'migrations');

let fails = 0, checks = 0;
const ok = (label, cond) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + label); } };

// Tables qui portent des données d'un élève (nom + promo, ou user_id) : toutes doivent être purgées.
const TABLES = ['weekly_snapshots', 'push_subscriptions', 'player_rewards', 'player_tokens', 'pending_chests',
  'chest_log', 'shop_purchases', 'marks_log', 'feedback_reports', 'students'];

function lastDef(fn) {
  let body = null;
  for (const f of fs.readdirSync(MIG).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(MIG, f), 'utf8');
    const re = new RegExp('CREATE OR REPLACE FUNCTION public\\.' + fn + '\\([\\s\\S]*?\\$function\\$;', 'g');
    let m; while ((m = re.exec(sql))) body = { file: f, sql: m[0] };
  }
  return body;
}
for (const fn of ['delete_my_account', 'teacher_delete_student']) {
  const d = lastDef(fn);
  ok(fn + ' : définition trouvée', !!d);
  if (!d) continue;
  TABLES.forEach((t) => ok(fn + ' (' + d.file + ') purge ' + t, new RegExp('DELETE FROM ' + t + '\\b').test(d.sql)));
  ok(fn + ' : la ligne students est supprimée en dernier', /DELETE FROM students[\s\S]*$/.test(d.sql)
    && !/DELETE FROM students[\s\S]*DELETE FROM (?!students)/.test(d.sql));
}
const self = lastDef('delete_my_account');
ok('delete_my_account : propriété stricte (compte non sécurisé refusé)', self && /'not_secured'/.test(self.sql) && /v_owner IS DISTINCT FROM v_uid/.test(self.sql));

// Client : un refus arrête tout AVANT la déconnexion et l'effacement local.
const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
for (const fn of ['deleteAccount', 'reset']) {
  const body = (app.match(new RegExp('async function ' + fn + '\\(\\)\\{[\\s\\S]*?\\n  \\}')) || [''])[0];
  const stop = body.indexOf('if(!pr.ok){alert(purgeRefusedMessage(pr.error));return;}');
  ok(fn + ' : s\'arrête sur un refus du serveur', stop > 0);
  ok(fn + ' : l\'arrêt précède la déconnexion', stop > 0 && stop < body.indexOf('signOut'));
  ok(fn + ' : l\'arrêt précède l\'effacement local', stop > 0 && stop < body.indexOf('localStorage.removeItem'));
}
ok('purgeUserRows : une erreur réseau n\'est pas un succès', /if\(r\.error\)\{[^}]*return\{ok:false,error:"network"\};\}/.test(app));

console.log((checks - fails) + '/' + checks + ' vérifications RGPD au vert');
process.exit(fails ? 1 : 0);
