/*
 * Chantier A — Validation autonome de la refonte estimateTOEICScore.
 *
 * Ce script NE MODIFIE PAS App.jsx. Il contient sa propre copie de l'ancien
 * algo (reproduction fidele du code de prod, pour baseline) et du nouvel algo
 * (specs A.1 -> A.5). Il reconstruit un module_scores proxy depuis le CSV
 * d'export enseignant (colonnes <module> Precision%/Sessions/Questions), calcule
 * les estimations, et confronte aux scores TOEIC papier T2.
 *
 * Usage : node tests/validate_toeic_estimation.cjs
 *
 * Sortie : tableau comparatif + Pearson/Spearman par variante de config.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'data', 'toeic_arena_export_idrac2026_2026-06-07.csv');

// ─────────────────────────────────────────────────────────────────────────
// 1. Scores TOEIC papier T2 (verite terrain, brief Chantier A)
// ─────────────────────────────────────────────────────────────────────────
// Cle = nom normalise (lower, trim). Les "non matche" du brief qui existent
// quand meme dans le CSV (emma, Zahra Ziti) sont inclus en secondaire et
// signales dans le rapport.
const PAPER_T2 = {
  'matteo s': 780,
  'ariba': 775,
  'kamel': 755,
  'karimaine': 710,
  'manel': 670,
  'younes': 650,
  'sami': 650,
  'noé': 635,
  'florian': 555,
  'andy': 555,
  'erwan': 755,
  'arthur': 425,
  // Marques "non matche" dans le brief mais presents dans le CSV :
  'emma': 405,
  'zahra ziti': 625,
};

function norm(s) {
  return String(s == null ? '' : s).trim().toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Mapping module-id interne -> prefixe colonne CSV
// ─────────────────────────────────────────────────────────────────────────
const MODULE_COLS = {
  drill: 'Part 5 Drill',
  wordfam: 'Word Families',
  connsort: 'Connectors',
  prepdrill: 'Prepositions',
  gerinf: 'Gerund/Infinitive',
  falsefr: 'False Friends',
  p6: 'Part 6',
  p7: 'Part 7 Reading',
  pvdojo: 'Phrasal Verb Dojo',
  sbuild: 'Sentence Builder',
  lisP1: 'Listening Part 1',
  lisP2: 'Listening Part 2',
  lisP3: 'Listening Part 3',
  lisP4: 'Listening Part 4',
  ablitz: 'Audio Blitz',
  // Non utilises par l'estimateur mais parses pour le compte d'activite :
  flashcard: 'Flashcard Review',
  traps: 'TOEIC Traps',
  stratquiz: 'Strategy Quiz',
  csess: 'Exam Simulation',
  clue: 'Clue Hunter',
};
// Note : le CSV n'a PAS de colonnes Grammar Gauntlet ni Modal Council.
// Ces modules seront simplement absents du proxy (normalisation gere l'absence).

// ─────────────────────────────────────────────────────────────────────────
// 3. Parseur CSV (gere les champs quotes)
// ─────────────────────────────────────────────────────────────────────────
function parseCSV(text) {
  // strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Construction du module_scores proxy depuis une ligne CSV
// ─────────────────────────────────────────────────────────────────────────
function buildStudents(rows) {
  const header = rows[0];
  const idx = {};
  header.forEach((h, i) => { idx[h.trim()] = i; });

  function col(name) { return idx[name]; }

  const students = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 5) continue;
    const name = row[col('Nom')];
    if (!name) continue;

    const ms = {};
    const activity = {}; // questions par module-id (pour comptes/diagnostic)

    for (const id in MODULE_COLS) {
      const prefix = MODULE_COLS[id];
      const pi = col(prefix + ' Precision%');
      const qi = col(prefix + ' Questions');
      if (pi == null || qi == null) continue;
      const prec = num(row[pi]);
      const q = num(row[qi]);
      if (q != null && q > 0 && prec != null) {
        const total = Math.round(q);
        const correct = Math.round((prec / 100) * total);
        ms[id] = { total, correct };
        activity[id] = total;
      }
    }

    // Mocks : reconstruits depuis Mock1/Mock2 Score% + Questions
    function addMock(key, scoreCol, qCol) {
      const sc = num(row[col(scoreCol)]);
      const q = num(row[col(qCol)]);
      if (sc != null && q != null && q > 0) {
        const total = Math.round(q);
        ms[key] = { total, correct: Math.round((sc / 100) * total) };
      }
    }
    addMock('mock1', 'Mock1 Score %', 'Mock1 Questions');
    addMock('mock2', 'Mock2 Score %', 'Mock2 Questions');

    students.push({
      name,
      ms,
      activity,
      csvOldToeic: num(row[col('TOEIC estime total')]),
      csvOldLis: num(row[col('TOEIC Listening')]),
      csvOldRd: num(row[col('TOEIC Reading')]),
      totalQ: num(row[col('Questions totales')]),
      precHorsFlash: num(row[col('Precision hors Flashcards %')]),
      mock1Toeic: num(row[col('Mock1 TOEIC estime')]),
      mock2Toeic: num(row[col('Mock2 TOEIC estime')]),
    });
  }
  return students;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. ANCIEN algo (reproduction fidele du code de prod, App.jsx ~13893)
// ─────────────────────────────────────────────────────────────────────────
function oldEstimate(ms) {
  function acc(id) { const d = ms[id]; if (!d || !d.total) return null; return d.correct / d.total; }
  const lisParts = [{ id: 'lisP1', w: 0.20 }, { id: 'lisP2', w: 0.30 }, { id: 'lisP3', w: 0.25 }, { id: 'lisP4', w: 0.25 }];
  const vocabVals = [acc('wordfam'), acc('connsort'), acc('prepdrill'), acc('gerinf')].filter(v => v !== null);
  const vocabAvg = vocabVals.length ? vocabVals.reduce((a, b) => a + b, 0) / vocabVals.length : null;
  const gauntletVals = [acc('gauntlet_irregular'), acc('gauntlet_tense'), acc('gauntlet_passive'), acc('gauntlet_relative')].filter(v => v !== null);
  const gauntletAvg = gauntletVals.length ? gauntletVals.reduce((a, b) => a + b, 0) / gauntletVals.length : null;
  const rdParts = [{ id: 'drill', w: 0.30 }, { id: 'p6', w: 0.20 }, { id: 'p7', w: 0.25 }, { val: vocabAvg, w: 0.10 }, { val: gauntletAvg, w: 0.15 }];
  function section(parts) {
    let wSum = 0, wTot = 0, hasData = false;
    parts.forEach(p => { const v = p.val !== undefined ? p.val : acc(p.id); if (v !== null) { wSum += v * p.w; wTot += p.w; hasData = true; } });
    if (!hasData) return null;
    wSum += (1 - wTot) * 0.01;
    return wSum;
  }
  const lis = section(lisParts), rd = section(rdParts);
  const lisScore = lis !== null ? Math.round(5 + lis * 490) : 5;
  const rdScore = rd !== null ? Math.round(5 + rd * 490) : 5;
  let total = lisScore + rdScore;
  const m1 = acc('mock1'), m2 = acc('mock2'); let bonus = 0;
  if (m1 !== null && m1 >= 0.60) bonus += 0.05;
  if (m2 !== null && m2 >= 0.60) bonus += 0.05;
  if (bonus > 0) total = Math.min(990, Math.round(total * (1 + bonus)));
  total = Math.max(200, Math.min(990, total));
  return { total: Math.round(total / 5) * 5, listening: lisScore, reading: rdScore };
}

// ─────────────────────────────────────────────────────────────────────────
// 6. NOUVEL algo (specs A.1 -> A.5), parametre par cfg pour le sweep
// ─────────────────────────────────────────────────────────────────────────
function clamp5(x) { return Math.round(Math.max(5, Math.min(495, x))); }

const READING_MODS = ['drill', 'p6', 'p7', 'wordfam', 'connsort', 'prepdrill', 'gerinf', 'falsefr', 'pvdojo', 'sbuild', 'gauntlet_irregular', 'gauntlet_tense', 'gauntlet_passive', 'gauntlet_relative'];
const LIS_MODS = ['lisP1', 'lisP2', 'lisP3', 'lisP4', 'ablitz'];

const RD_PARTS = [
  { id: 'drill', w: 0.22 }, { id: 'p6', w: 0.15 }, { id: 'p7', w: 0.18 },
  { id: 'wordfam', w: 0.06 }, { id: 'connsort', w: 0.06 }, { id: 'prepdrill', w: 0.05 },
  { id: 'gerinf', w: 0.05 }, { id: 'falsefr', w: 0.04 }, { id: 'pvdojo', w: 0.04 },
  { id: 'sbuild', w: 0.04 }, // gauntlet ajoute dynamiquement (0.11)
];
const LIS_PARTS = [
  { id: 'lisP1', w: 0.18 }, { id: 'lisP2', w: 0.27 }, { id: 'lisP3', w: 0.25 },
  { id: 'lisP4', w: 0.22 }, { id: 'ablitz', w: 0.08 },
];

function newEstimate(ms, anchors, cfg) {
  cfg = cfg || {};
  anchors = anchors || {};
  const useConf = cfg.confidence !== false;      // A.5 (default ON)
  const READ_THRESH = cfg.readThresh != null ? cfg.readThresh : 80;
  const LIS_THRESH = cfg.lisThresh != null ? cfg.lisThresh : 40;
  const bossCoef = cfg.bossCoef != null ? cfg.bossCoef : 0.60;   // A.4
  const mockBlend = cfg.mockBlend != null ? cfg.mockBlend : 0;   // blend mock acc dans les sections
  const mockBonusScale = cfg.mockBonusScale != null ? cfg.mockBonusScale : 0.30; // bonus asym. base sur l'acc mock
  const mockBonusCap = cfg.mockBonusCap != null ? cfg.mockBonusCap : 0.20;

  function rec(id) { const d = ms && ms[id]; if (!d || !d.total) return null; return { acc: d.correct / d.total, q: d.total }; }
  function confW(q) { if (!useConf) return 1; if (q < 10) return 0.3; if (q < 30) return 0.6; if (q < 100) return 0.85; return 1; }

  function sumQ(ids) { let s = 0; ids.forEach(id => { const r = rec(id); if (r) s += r.q; }); return s; }
  const readingQ = sumQ(READING_MODS);
  const listeningQ = sumQ(LIS_MODS);

  const m1 = rec('mock1'), m2 = rec('mock2'), mb = rec('boss');
  const mocksList = [m1, m2, mb].filter(Boolean);
  const mocksDone = mocksList.length;
  const hasMock = mocksDone > 0;
  // accuracy mock ponderee par volume
  let mockAcc = null;
  if (hasMock) {
    let s = 0, q = 0; mocksList.forEach(m => { s += m.acc * m.q; q += m.q; });
    mockAcc = q ? s / q : null;
  }

  const evidence = { listeningQ, readingQ, mocksDone };

  const readingOK = readingQ >= READ_THRESH || hasMock;
  const listeningOK = listeningQ >= LIS_THRESH || hasMock;

  // ── Sections (normalisation proportionnelle = wSum/wTot ; A.2/A.3) ──
  const gaunt = [rec('gauntlet_irregular'), rec('gauntlet_tense'), rec('gauntlet_passive'), rec('gauntlet_relative')].filter(Boolean);
  const gauntAvg = gaunt.length ? { acc: gaunt.reduce((a, b) => a + b.acc, 0) / gaunt.length, q: gaunt.reduce((a, b) => a + b.q, 0) } : null;
  const rdParts = RD_PARTS.concat([{ val: gauntAvg, w: 0.11 }]);

  function section(parts) {
    let wSum = 0, wTot = 0, has = false;
    parts.forEach(p => {
      const r = p.val !== undefined ? p.val : rec(p.id);
      if (r) { const ew = p.w * confW(r.q); wSum += r.acc * ew; wTot += ew; has = true; }
    });
    if (!has) return null;
    return wSum / wTot;
  }
  let rawRd = section(rdParts);
  let rawLis = section(LIS_PARTS);

  // Mock blend (A.1 ancrage) : melange l'acc mock dans chaque section.
  if (mockBlend > 0 && mockAcc != null) {
    rawRd = rawRd != null ? (1 - mockBlend) * rawRd + mockBlend * mockAcc : mockAcc;
    rawLis = rawLis != null ? (1 - mockBlend) * rawLis + mockBlend * mockAcc : mockAcc;
  } else if (hasMock && mockAcc != null) {
    // au minimum, deriver une section absente depuis l'acc mock (anti-trou)
    if (rawRd == null) rawRd = mockAcc;
    if (rawLis == null) rawLis = mockAcc;
  }

  let lisScore = rawLis != null ? clamp5(5 + rawLis * 490) : null;
  let rdScore = rawRd != null ? clamp5(5 + rawRd * 490) : null;

  // ── Estimable gating (A.1) ──
  if (!readingOK && !listeningOK) {
    return { total: null, listening: null, reading: null, estimable: false, evidence, reason: 'insufficient_data' };
  }

  // Bonus mock asymetrique (Kamel-safe) : ne recompense que la sur-performance,
  // ne penalise jamais une mauvaise perf mock. Exclusif du mockBlend.
  function mockBonus() {
    if (mockBlend > 0) return 0;
    let b = 0;
    mocksList.forEach(m => { if (m.acc > 0.60) b += (m.acc - 0.60) * mockBonusScale; });
    return Math.min(mockBonusCap, b);
  }

  // ── A.4 Boss anchor ──
  function applyBoss(moduleTotal) {
    if (!mb || anchors.bossToeic == null) return moduleTotal;
    if (moduleTotal == null) return Math.max(200, Math.min(990, anchors.bossToeic));
    return bossCoef * anchors.bossToeic + (1 - bossCoef) * moduleTotal;
  }

  const bothShown = lisScore != null && rdScore != null;

  if (readingOK && listeningOK && bothShown) {
    let total = lisScore + rdScore;
    const bonus = mockBonus();
    if (bonus > 0) total = total * (1 + bonus);
    total = applyBoss(total);
    total = Math.max(200, Math.min(990, total));
    return {
      total: Math.round(total / 5) * 5, listening: lisScore, reading: rdScore,
      estimable: true, evidence,
    };
  }

  // ── Cas partiel (A.1) : une seule section calculable ──
  return {
    total: null,
    listening: (listeningOK && lisScore != null) ? lisScore : null,
    reading: (readingOK && rdScore != null) ? rdScore : null,
    estimable: 'partial',
    evidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Correlations
// ─────────────────────────────────────────────────────────────────────────
function pearson(xs, ys) {
  const n = xs.length; if (n < 2) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}
function rankOf(arr) {
  const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < idx.length) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k][1]] = r;
    i = j + 1;
  }
  return ranks;
}
function spearman(xs, ys) {
  if (xs.length < 2) return NaN;
  return pearson(rankOf(xs), rankOf(ys));
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Run
// ─────────────────────────────────────────────────────────────────────────
function fmt(v, w) { return String(v == null ? '—' : v).padEnd(w); }
function fmtR(v, w) { return String(v == null ? '—' : v).padStart(w); }

function runVariant(students, cfg, label) {
  const matched = [];
  for (const s of students) {
    const paper = PAPER_T2[norm(s.name)];
    if (paper == null) continue;
    const anchors = { bossToeic: null, mock1Toeic: s.mock1Toeic, mock2Toeic: s.mock2Toeic };
    const est = newEstimate(s.ms, anchors, cfg);
    matched.push({ name: s.name, paper, old: oldEstimate(s.ms), est, totalQ: s.totalQ, activity: s.activity });
  }
  // correlation sur les estimable:true uniquement (total numerique)
  const corr = matched.filter(m => m.est.total != null);
  const xs = corr.map(m => m.paper), ys = corr.map(m => m.est.total);
  const r = pearson(xs, ys), rs = spearman(xs, ys);
  // baseline old : sur les memes etudiants matched, total old (jamais null)
  const oxs = matched.map(m => m.paper), oys = matched.map(m => m.old.total);
  return { label, cfg, matched, r, rs, oldR: pearson(oxs, oys), oldRs: spearman(oxs, oys), nEstimable: corr.length, nMatched: matched.length };
}

function readingActivityNonFlash(activity) {
  // somme des questions hors flashcard (toutes activites)
  let s = 0;
  for (const id in activity) { if (id !== 'flashcard') s += activity[id]; }
  return s;
}

function main() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(text);
  const students = buildStudents(rows);

  // Sanity check : mon proxy reproduit-il l'ancien algo tel que stocke dans le CSV ?
  console.log('\n=== SANITY : reconstruction ancien algo vs colonne CSV "TOEIC estime total" ===');
  console.log('(ecart attendu faible ; le CSV inclut gauntlet/boss absents du proxy)\n');
  let sane = 0, saneTot = 0;
  for (const s of students) {
    if (PAPER_T2[norm(s.name)] == null) continue;
    const recon = oldEstimate(s.ms).total;
    const real = s.csvOldToeic;
    const d = (real != null) ? Math.abs(recon - real) : null;
    if (d != null) { saneTot++; if (d <= 20) sane++; }
    console.log(`  ${fmt(s.name, 16)} reconstruit=${fmtR(recon, 4)}  CSV=${fmtR(real, 4)}  ecart=${fmtR(d, 4)}`);
  }
  console.log(`\n  -> ${sane}/${saneTot} a moins de 20 pts d'ecart (validation du proxy)\n`);

  // Variantes de config a balayer
  const variants = [
    { label: 'V0  spec A.1-A.4 seul (pas A.5, pas blend, bonus legacy)', cfg: { confidence: false, mockBonusScale: 0, mockBonusCap: 0 } },
    { label: 'V1  + A.5 confidence', cfg: { confidence: true, mockBonusScale: 0, mockBonusCap: 0 } },
    { label: 'V2  + A.5 + bonus mock asym (scale .30 cap .20)', cfg: { confidence: true, mockBonusScale: 0.30, mockBonusCap: 0.20 } },
    { label: 'V3  + A.5 + mock blend .40', cfg: { confidence: true, mockBlend: 0.40 } },
    { label: 'V4  + A.5 + mock blend .25', cfg: { confidence: true, mockBlend: 0.25 } },
    { label: 'V5  sans A.5 + bonus mock asym', cfg: { confidence: false, mockBonusScale: 0.30, mockBonusCap: 0.20 } },
  ];

  const results = variants.map(v => runVariant(students, v.cfg, v.label));

  // Tableau detaille pour la meilleure variante (par Pearson)
  for (const res of results) {
    console.log('\n' + '='.repeat(96));
    console.log(res.label);
    console.log('='.repeat(96));
    console.log(`${'Nom'.padEnd(16)}${'Papier'.padStart(8)}${'Ancien'.padStart(8)}${'Nouveau'.padStart(9)}${'L'.padStart(6)}${'R'.padStart(6)}  ${'estimable'.padEnd(10)}${'Qtot'.padStart(6)}  ecart(new)`);
    console.log('-'.repeat(96));
    const sorted = res.matched.slice().sort((a, b) => b.paper - a.paper);
    for (const m of sorted) {
      const ne = m.est.total;
      const diff = ne != null ? (ne - m.paper) : null;
      console.log(
        `${fmt(m.name, 16)}${fmtR(m.paper, 8)}${fmtR(m.old.total, 8)}${fmtR(ne, 9)}${fmtR(m.est.listening, 6)}${fmtR(m.est.reading, 6)}  ${fmt(String(m.est.estimable), 10)}${fmtR(m.totalQ, 6)}  ${fmtR(diff, 6)}`
      );
    }
    console.log('-'.repeat(96));
    console.log(`  Pearson  r = ${res.r.toFixed(3)}   (ancien ${res.oldR.toFixed(3)})   [n estimable=${res.nEstimable}/${res.nMatched}]`);
    console.log(`  Spearman r = ${res.rs.toFixed(3)}   (ancien ${res.oldRs.toFixed(3)})`);
    console.log(`  Cibles : Pearson >= 0.65 ${res.r >= 0.65 ? 'OK' : 'NON'} | Spearman >= 0.75 ${res.rs >= 0.75 ? 'OK' : 'NON'}`);
  }

  // Diagnostic criterion 2 : >100 Q hors flash mais estimable:false
  console.log('\n' + '='.repeat(96));
  console.log('DIAGNOSTIC — etudiants >100 Q hors flashcards mais estimable:false (toute la cohorte, V2)');
  console.log('='.repeat(96));
  const cfg2 = variants[2].cfg;
  for (const s of students) {
    const nf = readingActivityNonFlash(s.activity);
    if (nf <= 100) continue;
    const est = newEstimate(s.ms, { mock1Toeic: s.mock1Toeic, mock2Toeic: s.mock2Toeic }, cfg2);
    if (est.estimable === false) {
      console.log(`  ${fmt(s.name, 18)} Qhors-flash=${fmtR(nf, 5)}  readingQ=${fmtR(est.evidence.readingQ, 4)}  listeningQ=${fmtR(est.evidence.listeningQ, 4)}  -> ${est.reason}`);
    }
  }
  console.log('  (vide = critere 2 respecte)\n');
}

// Config V2 retenue (verrouillee) — reutilisee par le check post-patch (Etape 4).
const V2_CFG = { confidence: true, mockBonusScale: 0.30, mockBonusCap: 0.20 };

module.exports = {
  CSV_PATH, PAPER_T2, MODULE_COLS, V2_CFG,
  norm, parseCSV, num, buildStudents,
  oldEstimate, newEstimate, pearson, spearman,
};

if (require.main === module) main();
