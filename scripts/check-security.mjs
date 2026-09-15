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
 *   · chaque chemin que le CLIENT emprunte répond toujours — lectures directes et RPC
 *     relevées dans le source, pas dans une liste tenue à la main (sinon on aurait
 *     « sécurisé » en cassant : c'est arrivé le 2026-09-15, lecture de `groups` coupée).
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
import { createRequire } from 'node:module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { collectReads, collectRpcNames, collectDefs, dummyFor } = require('./clientPaths.cjs');

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

// ── 4. Chaque chemin que le CLIENT emprunte répond — dérivé du source ─────
// Sécuriser en cassant l'application n'est pas sécuriser. La liste n'est PAS tenue à
// la main : c'est une liste à la main (3 RPC + 1 garde) qui a laissé passer la
// régression du 2026-09-15 — la migration d'hygiène a supprimé la policy SELECT de
// `groups` en la croyant inerte, et « Join a Group » a répondu « Code not found » pour
// toutes les promos. Ici, tout `supabase.from(...).select(...)` et tout
// `supabase.rpc(...)` du source est relevé (scripts/clientPaths.cjs) et sondé.
const SRC = path.join(ROOT, 'src');

// 4a. Lectures directes. Un 200 ne suffit pas : RLS active sans policy SELECT donne
// `200 []` sur une table pleine — c'était exactement le symptôme. Sur une table qui
// n'est jamais vide, on exige une ligne. `events` peut l'être légitimement.
const reads = collectReads(SRC, ROOT);
const NEVER_EMPTY = new Set(['groups', 'students_public']);
for (const rd of reads) {
  const r = await get(rd.table + '?select=' + rd.cols + '&limit=1');
  const rows = r.status === 200 ? await r.json() : null;
  if (r.status !== 200) {
    fail('GET ' + rd.table + '?select=' + rd.cols + ' → HTTP ' + r.status + ' (' + rd.where[0]
      + '). Lecture directe coupée : grant colonne ou policy.');
  } else if (NEVER_EMPTY.has(rd.table) && (!Array.isArray(rows) || rows.length === 0)) {
    fail('GET ' + rd.table + '?select=' + rd.cols + ' → 200 mais aucune ligne (' + rd.where[0]
      + '). RLS active sans policy SELECT ? (régression du 2026-09-15)');
  }
}
// Les colonnes sensibles de `groups` restent refusées (grant colonne par colonne, B4).
for (const col of ['teacher_code', 'teacher_email']) {
  const r = await get('groups?select=' + col + '&limit=1');
  if (r.status === 200) fail('GET groups?select=' + col + ' → 200 : la colonne sensible est redevenue lisible.');
}

// 4b. RPC. Chaque fonction appelée par le client est sondée avec des arguments factices
// typés d'après sa DERNIÈRE signature SQL (migrations rejouées dans l'ordre). Seules les
// fonctions dont le corps porte une garde (student_guard, teacher_role_of, auth.uid) ou
// qui ne font que lire sont sondées : la garde refuse un compte qui n'existe pas AVANT
// toute écriture. Une fonction sans garde reconnue n'est pas sondée, et son nom est
// affiché : à garder ou à écrire, mais jamais en silence.
//   401/403 → EXECUTE révoquée ; 404 → introuvable pour cette signature (migration non
//   appliquée, ou paramètre renommé) ; 200/400 → elle existe et s'exécute.
const rpc = async (name, body) => fetch(URL_ + '/rest/v1/rpc/' + name, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify(body || {}),
});
const rpcNames = collectRpcNames(SRC, ROOT);
const defs = collectDefs(path.join(ROOT, 'supabase', 'migrations'));
const isGuarded = (d) => /\bstudent_guard\s*\(|\bteacher_role_of\s*\(|\bauth\.(uid|jwt)\s*\(\)/.test(d.body);
// Lectures sans garde (patron « classement », plus les deux lookups legacy de l'onboarding,
// pur SELECT) : rien n'écrit, on peut les sonder. Vérifié corps par corps le 2026-09-15.
const READ_ONLY = new Set(['class_median_xp', 'class_weekly_progress', 'class_week_podium', 'find_students_by_name',
  'my_student_by_email', 'recover_student_row']);
let probed = 0;
const skipped = [];
for (const [name, where] of [...rpcNames].sort()) {
  const d = defs[name];
  if (!d) { fail('rpc/' + name + ' (' + where[0] + ') : définie nulle part dans supabase/migrations/'); continue; }
  if (!isGuarded(d) && !READ_ONLY.has(name)) { skipped.push(name); continue; }
  const args = {};
  for (const p of d.params) args[p.name] = dummyFor(p.type);
  const r = await rpc(name, args);
  probed++;
  if (r.status === 401 || r.status === 403) {
    fail('rpc/' + name + ' → HTTP ' + r.status + ' : EXECUTE révoquée pour anon/authenticated (' + where[0] + ').');
  } else if (r.status === 404) {
    fail('rpc/' + name + ' → 404 : introuvable pour la signature (' + d.params.map((p) => p.name).join(', ')
      + ') de ' + d.file + ' ; migration non appliquée, ou paramètre renommé ?');
  } else if (r.status !== 200 && r.status !== 400) {
    fail('rpc/' + name + ' → HTTP ' + r.status + ' inattendu (' + where[0] + ').');
  }
}
// Et une garde de propriété doit bien refuser un compte qui n'existe pas.
const guard = await (await rpc('my_rewards', { p_name: 'ZZPersonne', p_class_code: 'idrac2026' })).json();
if (!guard || guard.ok !== false) {
  fail('rpc/my_rewards sur un compte inexistant devrait refuser, a répondu : '
    + JSON.stringify(guard) + '. La garde de propriété ne s\'applique plus.');
}
console.log('  ' + reads.length + ' lectures directes et ' + probed + ' RPC du client vérifiées'
  + (skipped.length ? '\n  non sondées (aucune garde reconnue dans leur corps) : ' + skipped.join(', ') : ''));

console.log(fails === 0
  ? '\nOK — le verrou tient, et l\'application fonctionne toujours.'
  : '\n' + fails + ' problème(s) de sécurité.');
process.exit(fails === 0 ? 0 : 1);
