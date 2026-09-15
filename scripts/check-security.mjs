/* Balayage de sécurité : rejoue, en une commande, la vérification finale du chantier
 * pentest du 2026-09-15. `npm run check:security`
 *
 * POURQUOI C'EST SÉPARÉ DE `npm test`. Ce script a besoin du réseau et de .env. Une
 * suite de tests qui échoue parce qu'on est dans le train est une suite qu'on finit par
 * ignorer — et le jour où elle signale un vrai problème, on ne la croit plus.
 *
 * CE QU'IL VÉRIFIE. Avec la clé publique (celle que tout visiteur possède, elle est dans
 * le bundle) :
 *   · aucune table n'est lisible en direct ;
 *   · seules la vue de classement et les événements répondent, en lecture ;
 *   · les suppressions en lot sont refusées — c'était le vecteur le plus grave, capable
 *     de couper les notifications d'une promo entière sans laisser de trace ;
 *   · les RPC légitimes répondent toujours (sinon on aurait « sécurisé » en cassant).
 *
 * INNOCUITÉ. Toutes les sondes sont soit des lectures, soit des écritures filtrées sur
 * une cohorte qui n'existe pas. Aucune ligne réelle n'est touchée, même si un privilège
 * avait été rouvert par erreur.
 *
 * Usage : node scripts/check-security.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── .env ──────────────────────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env introuvable — ce script a besoin de VITE_SUPABASE_URL et '
    + 'VITE_SUPABASE_ANON_KEY. Il ne peut rien conclure sans, donc il échoue '
    + 'plutôt que de passer au vert.');
  process.exit(1);
}
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquante dans .env'); process.exit(1); }

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };

// ── Ce qu'on attend ───────────────────────────────────────────────────────
// Toute table du schéma public. Si une nouvelle table apparaît sans être ajoutée
// ici, ce script ne la verra pas : le vrai filet reste la requête de balayage
// catalogue (en commentaire dans les migrations de verrouillage).
const LOCKED = [
  'students', 'groups', 'push_subscriptions', 'weekly_snapshots',
  'player_rewards', 'pending_chests', 'chest_log', 'player_tokens',
  'marks_log', 'shop_purchases', 'feedback_reports', 'teacher_codes',
  'teacher_audit_log', 'passes', 'subscriptions', 'stripe_events',
  'password_reset_tokens', 'students_xp_backup_2026_04_27', 'player_equipped',
];
// Volontairement lisibles : le classement et les événements en cours.
const READABLE = ['students_public', 'events'];

const get = (p) => fetch(URL_ + '/rest/v1/' + p, { headers: H });
const del = (p) => fetch(URL_ + '/rest/v1/' + p, { method: 'DELETE', headers: H });

console.log('Balayage de sécurité — ' + URL_.replace(/https:\/\//, '') + '\n');

// ── 1. Rien ne doit être lisible en direct ────────────────────────────────
for (const t of LOCKED) {
  const r = await get(t + '?select=*&limit=1');
  if (r.status !== 401) {
    fail(t + ' : lecture anon → HTTP ' + r.status + ', 401 attendu. '
      + 'La table est exposée à quiconque possède la clé publique.');
  }
}
console.log('  ' + LOCKED.length + ' tables verrouillées vérifiées');

// ── 2. Ce qui doit rester lisible l'est ───────────────────────────────────
for (const t of READABLE) {
  const r = await get(t + '?select=*&limit=1');
  if (r.status !== 200) {
    fail(t + ' : lecture anon → HTTP ' + r.status + ', 200 attendu. '
      + 'Le classement ou les événements sont cassés pour les élèves.');
  }
}
console.log('  ' + READABLE.length + ' objets publics toujours lisibles');

// ── 3. Les vecteurs destructeurs ──────────────────────────────────────────
// Filtrés sur une cohorte inexistante : même si le privilège existait, 0 ligne.
const NOWHERE = 'class_code=eq.zz-cohorte-inexistante';
for (const t of ['push_subscriptions', 'player_rewards', 'pending_chests', 'weekly_snapshots']) {
  const r = await del(t + '?' + NOWHERE);
  if (r.status !== 401) {
    fail('DELETE ' + t + ' → HTTP ' + r.status + ', 401 attendu. '
      + 'Suppression en lot possible : de quoi effacer les données d\'une promo entière.');
  }
}
// Une vue mono-table est AUTO-MODIFIABLE et tourne avec les droits de son
// propriétaire : écrire à travers students_public atteindrait students.
const rv = await fetch(URL_ + '/rest/v1/students_public?name=eq.zz-personne', {
  method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ weekly_xp: 1 }),
});
if (rv.status !== 401) {
  fail('PATCH students_public → HTTP ' + rv.status + ', 401 attendu. '
    + 'La vue est redevenue modifiable : REVOKE ALL puis GRANT SELECT, jamais un GRANT seul.');
}
console.log('  5 vecteurs destructeurs refusés');

// ── 4. Les chemins légitimes répondent toujours ───────────────────────────
// Sécuriser en cassant l'application n'est pas sécuriser.
const rpc = async (name, body) => fetch(URL_ + '/rest/v1/rpc/' + name, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify(body || {}),
});
for (const [name, body] of [
  ['class_median_xp', { p_class_code: 'idrac2026' }],
  ['class_weekly_progress', { p_class_code: 'idrac2026' }],
  ['find_students_by_name', { p_name: 'ZZPersonne', p_class_code: 'idrac2026' }],
]) {
  const r = await rpc(name, body);
  if (r.status !== 200) {
    fail('rpc/' + name + ' → HTTP ' + r.status + ', 200 attendu. '
      + 'Une RPC dont l\'application dépend ne répond plus.');
  }
}
// Et une garde de propriété doit bien refuser un compte qui n'existe pas.
const guard = await (await rpc('my_rewards', { p_name: 'ZZPersonne', p_class_code: 'idrac2026' })).json();
if (!guard || guard.ok !== false) {
  fail('rpc/my_rewards sur un compte inexistant devrait refuser, a répondu : '
    + JSON.stringify(guard) + '. La garde de propriété ne s\'applique plus.');
}
console.log('  4 chemins légitimes vérifiés');

console.log(fails === 0
  ? '\nOK — le verrou tient, et l\'application fonctionne toujours.'
  : '\n' + fails + ' problème(s) de sécurité.');
process.exit(fails === 0 ? 0 : 1);
