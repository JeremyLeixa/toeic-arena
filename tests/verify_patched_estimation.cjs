/*
 * Chantier A — Etape 4 : verification post-patch.
 *
 * Extrait estimateTOEICScore de src/App_patched.jsx, l'evalue, et confirme
 * qu'elle produit EXACTEMENT les memes resultats que la fonction V2 validee
 * en etape 1 (tests/validate_toeic_estimation.cjs), sur toute la cohorte CSV.
 *
 * Usage : node tests/verify_patched_estimation.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./validate_toeic_estimation.cjs');

const PATCHED = path.join(__dirname, '..', 'src', 'App_patched.jsx');

// Extrait le corps d'une fonction par equilibrage d'accolades.
function extractFunction(src, signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error('signature introuvable : ' + signature);
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

function main() {
  const src = fs.readFileSync(PATCHED, 'utf8');
  const fnText = extractFunction(src, 'function estimateTOEICScore(ms,opts)');
  const prodEstimate = eval('(' + fnText + ')');

  const rows = V.parseCSV(fs.readFileSync(V.CSV_PATH, 'utf8'));
  const students = V.buildStudents(rows);

  let mismatches = 0, checked = 0;
  const diffs = [];
  for (const s of students) {
    const prod = prodEstimate(s.ms, { bossToeic: null });
    const val = V.newEstimate(s.ms, {}, V.V2_CFG);
    checked++;
    const same =
      prod.total === val.total &&
      prod.listening === val.listening &&
      prod.reading === val.reading &&
      String(prod.estimable) === String(val.estimable);
    if (!same) {
      mismatches++;
      diffs.push(`  MISMATCH ${s.name} :: prod ${JSON.stringify({ t: prod.total, l: prod.listening, r: prod.reading, e: prod.estimable })} vs val ${JSON.stringify({ t: val.total, l: val.listening, r: val.reading, e: val.estimable })}`);
    }
  }

  console.log('\n=== Etape 4 — verification App_patched.jsx vs V2 validee ===\n');
  console.log(`  estimateTOEICScore extraite : ${fnText.length} caracteres`);
  console.log(`  etudiants verifies          : ${checked}`);
  console.log(`  mismatches                  : ${mismatches}`);
  if (diffs.length) console.log('\n' + diffs.join('\n'));

  // Echantillon des cas-test individuels du brief
  console.log('\n  Cas-test individuels (prod) :');
  const probes = ['Matteo S', 'ariba', 'Kamel', 'Younes', 'Karimaine', 'Florian'];
  for (const name of probes) {
    const s = students.find(x => V.norm(x.name) === V.norm(name));
    if (!s) { console.log(`    ${name.padEnd(12)} : absent du CSV`); continue; }
    const p = prodEstimate(s.ms, { bossToeic: null });
    console.log(`    ${name.padEnd(12)} : total=${String(p.total).padStart(4)}  L=${String(p.listening).padStart(4)}  R=${String(p.reading).padStart(4)}  estimable=${p.estimable}`);
  }

  // Probe ciblee A.4 — ancrage Boss (synthetique, aucun eleve reel n'a de Boss)
  console.log('\n  Probe A.4 (synthetique) — ancrage Boss 60% :');
  const synthMs = { drill: { total: 200, correct: 120 }, lisP2: { total: 200, correct: 120 }, lisP1: { total: 50, correct: 30 } };
  const noBoss = prodEstimate(synthMs, { bossToeic: null });
  const withBoss = prodEstimate(synthMs, { bossToeic: 900 });
  console.log(`    sans Boss : total=${noBoss.total}`);
  console.log(`    Boss=900  : total=${withBoss.total}  (attendu ~ 0.6*900 + 0.4*${noBoss.total} = ${Math.round((0.6 * 900 + 0.4 * noBoss.total) / 5) * 5})`);

  if (mismatches > 0) {
    console.log('\n  ECHEC : la fonction patchee diverge de la V2 validee.');
    process.exitCode = 1;
  } else {
    console.log('\n  OK : la fonction patchee est strictement identique a la V2 validee.\n');
  }
}

main();
