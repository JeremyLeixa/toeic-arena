/* Lanceur de la suite de tests. `npm test`
 *
 * Liste EXPLICITE plutôt que découverte automatique d'un motif de nom : le dossier
 * tests/ contient aussi des scripts d'ANALYSE (analyze_ranking_*, phase2_widen_*) qui
 * explorent des données et ne sortent pas en code d'erreur. Les ramasser
 * automatiquement donnerait une suite qui « passe » sans rien vérifier.
 *
 * Pour ajouter un test : l'écrire de façon à sortir en process.exit(1) s'il échoue,
 * puis l'ajouter ci-dessous avec une phrase disant ce qu'il protège.
 *
 * Ce qui N'EST PAS ici, et pourquoi :
 *  · validate_toeic_estimation.cjs — embarque sa PROPRE copie de l'algorithme. C'est un
 *    artefact de calibration historique : il ne teste pas le code de production, et ne
 *    sort pas en code d'erreur.
 *  · analyze_ranking_*.cjs, phase2_widen_experiment.cjs — scripts d'analyse.
 *  · scripts/check-security.mjs — a besoin du réseau et de .env, donc `npm run
 *    check:security` séparément. Une suite qui échoue parce qu'on est hors ligne est
 *    une suite qu'on finit par ignorer.
 */
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const SUITE = [
  ['check_rpc_contracts.cjs',      'les appels RPC du client correspondent aux signatures SQL'],
  ['check_profile_roundtrip.cjs',  'aucun champ du profil ne se perd entre client, payload et base'],
  ['check_chest_drops.cjs',        'tout butin tiré est persistable et connu'],
  ['check_fresher_local.cjs',      'la copie locale plus fraîche gagne sur Supabase, avec les champs serveur, et jamais pour un autre élève'],
  ['check_identity.cjs',          'le normaliseur de noms et l\'adresse synthétique n\'ont pas bougé'],
  ['check_xp_gates.cjs',           'les portes XP (accuracy, anti-farming, Focus, boosts, bonus) sont celles du produit'],
  ['validate_endless_resume.cjs',  'la reprise d\'Endless rejoue le même test'],
  ['validate_listening_shuffle.cjs', 'la position des bonnes réponses est randomisée'],
  ['check_listening_voices.cjs',   'la règle de voix des clips P1/P2 (deux locuteurs, lettres dans la voix de l\'item) n\'a pas bougé'],
  ['check_festivals.cjs',          'les fenêtres des thèmes saisonniers (bornes, Pâques, déc → jan, opt-out > forçage) n\'ont pas bougé'],
  ['check_skins_light.cjs',        'les skins à cartes sombres restent lisibles en mode clair (cartes-nuit)'],
  ['check_tones.cjs',              'titres et pastilles de ligue gardent une variante lisible en mode clair (tone)'],
  ['validate_toeic_shrinkage.cjs','l\'estimateur TOEIC ne réintroduit pas les 3 pathologies'],
  ['check_symbol_census.cjs',      'aucun symbole d\'App.jsx perdu ni dédoublé par le découpage'],
  ['check_import_graph.cjs',       'aucun cycle d\'import dans src/, sens des couches respecté'],
];

const results = [];
const t0 = Date.now();

for (const [file, what] of SUITE) {
  const started = Date.now();
  let ok = true, output = '';
  try {
    output = execFileSync(process.execPath, [path.join(__dirname, file)],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    ok = false;
    output = (e.stdout || '') + (e.stderr || '');
  }
  const ms = Date.now() - started;
  results.push({ file, what, ok, ms, output });
  console.log((ok ? '  ok   ' : '  FAIL ') + file.padEnd(34) + (ms + ' ms').padStart(8) + '   ' + what);
  if (!ok) console.log(output.split('\n').map(l => '         ' + l).join('\n'));
}

const failed = results.filter(r => !r.ok);
console.log('\n' + (SUITE.length - failed.length) + '/' + SUITE.length
  + ' tests au vert en ' + (Date.now() - t0) + ' ms');
if (failed.length) {
  console.log('Échecs : ' + failed.map(r => r.file).join(', '));
  console.log('\nUn test qui échoue décrit un vrai problème : le corriger, pas l\'ajuster.');
}
process.exit(failed.length === 0 ? 0 : 1);
