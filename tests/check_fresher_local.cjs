/* Garde « stale-remote » (src/lib/staleRemote.js) : quand garde-t-on la copie locale plutôt que
 * la ligne Supabase, et avec quels champs serveur ?
 *
 * POURQUOI CE TEST EXISTE. Cette règle décide de deux pertes silencieuses opposées :
 *   · trop stricte → une progression jouée pendant une panne de sauvegarde (session perdue,
 *     schéma cassé) est écrasée par le distant au chargement ou à la reconnexion ;
 *   · trop large, ou champs serveur oubliés → un vieux local ressuscite des valeurs périmées, ou
 *     fait repasser un élève payant / scolarisé en free/visitor (access_level, class_code).
 * Et isSameStudent est le garde-fou des appareils partagés : la progression d'un élève ne doit
 * jamais être fusionnée dans la ligne d'un autre. Aucune de ces erreurs ne casse le build.
 *
 * Prouvé mordant le 2026-09-16 : `localXp>remoteXp` → `>=` → rouge (XP égale) ; ligne
 * access_level retirée → rouge ; isSameStudent qui ignore le class_code → rouge ;
 * fresherLocalFor qui saute isSameStudent → rouge.
 *
 * Usage : node tests/check_fresher_local.cjs
 */
'use strict';
const path = require('path');

const ROOT = path.join(__dirname, '..');
const S = require(path.join(ROOT, 'src', 'lib', 'staleRemote.js'));

let fails = 0, checks = 0;
const check = (cond, m) => { checks++; if (!cond) { fails++; console.log('  FAIL ' + m); } };

const remote = { name: 'Chloé', class_code: 'idrac2026', xp: 1000, last_active: '2026-09-10',
  access_level: 'premium', access_expires_at: '2026-12-31', email: 'chloe.idrac2026@students.verse-arena.fr' };
const local = { name: 'chloe', classCode: 'visitor', xp: 1200, lastActive: '2026-09-16',
  accessLevel: 'free', accessExpiresAt: null, email: null, streak: 4 };

// ── Local plus frais : fusion avec les champs serveur ──
const m = S.pickFresherLocal(remote, local);
check(m !== null, 'local plus frais (xp 1200 > 1000, actif plus récemment) : fusion attendue');
if (m) {
  check(m.xp === 1200 && m.streak === 4, 'la progression locale (xp, streak) doit être conservée');
  check(m.classCode === 'idrac2026', 'class_code doit venir du distant (migration de promo)');
  check(m.accessLevel === 'premium', 'access_level doit venir du distant (webhook Stripe) : sinon un payant repasse free');
  check(m.accessExpiresAt === '2026-12-31', 'access_expires_at doit venir du distant');
  check(m.email === remote.email, 'email doit venir du distant');
  check(m !== local && local.classCode === 'visitor', 'la fusion doit être une copie : le local passé en argument ne doit pas muter');
}
// access_expires_at absent de la ligne : ne pas écraser le local
const noExp = Object.assign({}, remote); delete noExp.access_expires_at;
const m2 = S.pickFresherLocal(noExp, Object.assign({}, local, { accessExpiresAt: '2027-01-01' }));
check(m2 && m2.accessExpiresAt === '2027-01-01', 'access_expires_at absent du distant : la valeur locale doit rester');
// access_expires_at explicitement null : il s'applique (abonnement terminé)
const m3 = S.pickFresherLocal(Object.assign({}, remote, { access_expires_at: null }), Object.assign({}, local, { accessExpiresAt: '2027-01-01' }));
check(m3 && m3.accessExpiresAt === null, 'access_expires_at null côté serveur doit écraser le local');

// ── Distant plus frais ou égal : pas de fusion ──
check(S.pickFresherLocal(remote, Object.assign({}, local, { xp: 1000 })) === null, 'XP égale : le distant gagne (sinon un vieux local ressuscite)');
check(S.pickFresherLocal(remote, Object.assign({}, local, { xp: 900 })) === null, 'XP locale inférieure : le distant gagne');
check(S.pickFresherLocal(remote, Object.assign({}, local, { lastActive: '2026-09-01' })) === null, 'local actif moins récemment : le distant gagne');
check(S.pickFresherLocal(remote, Object.assign({}, local, { lastActive: '2026-09-10' })) !== null, 'lastActive égal et XP locale supérieure : fusion attendue (>=)');
check(S.pickFresherLocal(remote, null) === null && S.pickFresherLocal(null, local) === null, 'argument manquant : null');
check(S.pickFresherLocal({ xp: 0, last_active: null }, { xp: 5, lastActive: '' }) !== null, 'distant vierge (xp 0, last_active null) et local à 5 XP : fusion attendue');

// ── isSameStudent ──
check(S.isSameStudent({ name: 'CHLOÉ', classCode: 'idrac2026' }, remote), 'même élève malgré casse et accents');
check(!S.isSameStudent({ name: 'Chloé', classCode: 'cesi2026' }, remote), 'même prénom, autre promo : pas le même élève');
check(!S.isSameStudent({ name: 'Clara', classCode: 'idrac2026' }, remote), 'autre prénom, même promo : pas le même élève');
check(S.isSameStudent({ name: 'Zoé', classCode: undefined }, { name: 'zoe', class_code: 'visitor' }), 'classCode absent = visitor des deux côtés');
check(!S.isSameStudent(null, remote) && !S.isSameStudent(local, null), 'argument manquant : false');

// ── fresherLocalFor (reconnexion) : même élève ET plus frais ──
const sameFresh = { name: 'chloe', classCode: 'idrac2026', xp: 1200, lastActive: '2026-09-16' };
check(S.fresherLocalFor(remote, sameFresh) !== null, 'reconnexion, même élève, local plus frais : fusion attendue');
check(S.fresherLocalFor(remote, Object.assign({}, sameFresh, { name: 'Clara' })) === null, 'reconnexion, AUTRE élève plus frais sur l\'appareil : jamais de fusion');
check(S.fresherLocalFor(remote, Object.assign({}, sameFresh, { xp: 1000 })) === null, 'reconnexion, même élève pas plus frais : pas de fusion');
check(S.fresherLocalFor(remote, null) === null, 'reconnexion sans profil local : null');

console.log('  ' + checks + ' vérifications');
if (fails) { console.log('\n' + fails + ' problème(s). Une fusion fausse perd une progression ou rétrograde un accès, sans rien casser.'); process.exit(1); }
console.log('  ok');
