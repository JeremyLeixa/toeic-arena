/* Compare l'estimateur AVANT / APRES la retenue bayesienne (2026-09-15).
 *
 * Contexte : un etudiant iabd2627 a signale une estimation a 990 sans etre a
 * 100% partout. Trois defauts confirmes dans l'ancienne version :
 *   1. le bonus mock etait MULTIPLICATIF sur le total (+20% max) : 843 x 1,18 =
 *      995, plafonne a 990. 82,5% de precision suffisaient a afficher 990 ;
 *   2. aucune exigence de couverture : 1 module sur 23 a 100% -> Reading 495 ;
 *   3. confW se simplifiait dans wSum/wTot : 4 questions valaient 300.
 *
 * Le correctif doit tuer ces trois pathologies SANS ecraser les profils bien
 * couverts : sur la cohorte IDRAC, les 3 etudiants estimables etaient deja
 * SOUS-estimes par rapport au TOEIC papier (-35, -100, -360). Une retenue trop
 * forte aggraverait cet ecart.
 *
 * L'ancienne version est lue depuis git (HEAD du fichier), la nouvelle depuis
 * le disque : aucune copie de l'algo n'est maintenue ici.
 *
 * Usage : node tests/validate_toeic_shrinkage.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function extractEstimator(source, label) {
  const src = source.replace(/\r\n/g, '\n');
  const a = src.indexOf('function estimateTOEICScore(ms,opts){');
  const b = src.indexOf('\n// ─── UPGRADE SCREEN', a);
  if (a < 0 || b < 0) throw new Error('estimateTOEICScore introuvable dans ' + label);
  return new Function(src.slice(a, b) + '\nreturn estimateTOEICScore;')();
}

const OLD = extractEstimator(
  execSync('git show HEAD:src/App.jsx', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'),
  'HEAD');
const NEW = extractEstimator(
  fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8'),
  'working tree');

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('  FAIL ' + msg); } };
const show = v => (v == null ? '—' : String(v));

// ══════════════════════════════════════════════════════════════════════════
// 1. Les trois pathologies
// ══════════════════════════════════════════════════════════════════════════
const READING = ['drill', 'p6', 'p7', 'wordfam', 'connsort', 'prepdrill', 'gerinf', 'falsefr',
  'pvdojo', 'sbuild', 'gauntlet_irregular', 'gauntlet_tense', 'gauntlet_passive',
  'gauntlet_relative', 'tavern', 'clue', 'traps', 'modals_match', 'modals_sort',
  'bforge', 'timesim', 'stratquiz', 'daily'];
const LIS = ['lisP1', 'lisP2', 'lisP3', 'lisP4', 'ablitz'];

function ms(mods, correct, total, mocks) {
  const o = {};
  for (const m of mods) o[m] = { correct, total };
  (mocks || []).forEach((a, i) => {
    o[['mock1', 'mock2', 'boss', 'endless'][i]] = { correct: Math.round(a * 200), total: 200 };
  });
  return o;
}

console.log('══ pathologies signalees ══\n');
const path1 = ms(READING.concat(LIS), 102, 120, [0.90, 0.90]);   // 85% partout
const o1 = OLD(path1), n1 = NEW(path1);
console.log('  85% partout + 2 mocks a 90%');
console.log('     avant : ' + show(o1.total) + '   apres : ' + show(n1.total));
check(o1.total === 990, 'le cas de Noah ne reproduit plus 990 avec l ancien algo');
check(n1.total < 950, 'un profil a 85% affiche encore ' + n1.total);

const path2 = ms(['drill'], 4, 4, [0.70]);                        // 1 module, 4 questions
const o2 = OLD(path2), n2 = NEW(path2);
console.log('\n  drill seul, 4 questions sur 4, + 1 mock a 70%');
console.log('     Reading avant : ' + show(o2.reading) + '/495   apres : ' + show(n2.reading) + '/495');
check(o2.reading === 495, 'la pathologie "4/4 -> 495" ne reproduit plus');
check(n2.reading < 400, 'Reading encore a ' + n2.reading + ' sur 4 questions');

console.log('\n  meme precision (75%), volume croissant — le volume doit compter');
for (const [c, q] of [[3, 4], [15, 20], [60, 80], [225, 300]]) {
  const m = ms(READING.concat(LIS), c, q, [0.70]);
  console.log('     ' + String(q).padStart(3) + ' Q/module : avant ' + show(OLD(m).total) +
    '   apres ' + show(NEW(m).total));
}
// L'invariant n'est pas "petit volume = score plus bas" mais "petit volume =
// score plus proche du prior". Au-dessus du prior la retenue fait descendre,
// en dessous elle fait monter. On verifie les deux sens.
const hiLow = NEW(ms(READING.concat(LIS), 3, 4, [0.70])).total;      // 75%, peu de volume
const hiMany = NEW(ms(READING.concat(LIS), 225, 300, [0.70])).total; // 75%, beaucoup
check(hiLow !== hiMany, 'le volume ne change toujours rien au score');
check(hiLow < hiMany, 'au-dessus du prior, un petit volume devrait etre tire vers le bas');

console.log('\n  sous le prior (40%), la retenue doit remonter les petits volumes');
const loLow = NEW(ms(READING.concat(LIS), 2, 5, [0.45])).total;
const loMany = NEW(ms(READING.concat(LIS), 120, 300, [0.45])).total;
console.log('     5 Q/module : ' + show(loLow) + '   300 Q/module : ' + show(loMany));
check(loLow > loMany, 'sous le prior, un petit volume devrait etre tire vers le haut');

console.log('\n  le bonus mock ne doit plus saturer l echelle');
const many4 = ms(READING.concat(LIS), 102, 120, [0.95, 0.95, 0.95, 0.95]); // 85% + 4 mocks a 95%
console.log('     85% partout + 4 mocks a 95% : avant ' + show(OLD(many4).total) +
  '   apres ' + show(NEW(many4).total));
check(OLD(many4).total === 990, 'le cas sature ne reproduit plus avec l ancien algo');
check(NEW(many4).total < 950, 'le bonus sature encore (' + NEW(many4).total + ')');

console.log('\n  couverture croissante a 100% (120 Q/module) + 1 mock a 70%');
for (const n of [1, 3, 8, 23]) {
  const m = ms(READING.slice(0, n), 120, 120, [0.70]);
  console.log('     ' + String(n).padStart(2) + '/23 modules : Reading avant ' +
    show(OLD(m).reading) + '   apres ' + show(NEW(m).reading));
}
const cov1 = NEW(ms(READING.slice(0, 1), 120, 120, [0.70])).reading;
const cov23 = NEW(ms(READING, 120, 120, [0.70])).reading;
check(cov23 > cov1, 'une couverture large ne rapporte pas plus qu un seul module');

console.log('\n  plafond : profil parfait, couverture totale, 300 Q/module, mocks a 100%');
const perfect = ms(READING.concat(LIS), 300, 300, [1.0, 1.0]);
console.log('     avant ' + show(OLD(perfect).total) + '   apres ' + show(NEW(perfect).total));
check(NEW(perfect).total >= 950, 'un profil parfait est trop penalise (' + NEW(perfect).total + ')');

// ══════════════════════════════════════════════════════════════════════════
// 2. Non-regression sur la cohorte reelle (TOEIC papier T2)
// ══════════════════════════════════════════════════════════════════════════
const PAPER = {
  'matteo s': 780, 'ariba': 775, 'kamel': 755, 'karimaine': 710, 'manel': 670,
  'younes': 650, 'sami': 650, 'noé': 635, 'florian': 555, 'andy': 555,
  'erwan': 755, 'arthur': 425, 'emma': 405, 'zahra ziti': 625,
};
const MODULE_COLS = {
  drill: 'Part 5 Drill', wordfam: 'Word Families', connsort: 'Connectors',
  prepdrill: 'Prepositions', gerinf: 'Gerund/Infinitive', falsefr: 'False Friends',
  p6: 'Part 6', p7: 'Part 7 Reading', pvdojo: 'Phrasal Verb Dojo',
  sbuild: 'Sentence Builder', lisP1: 'Listening Part 1', lisP2: 'Listening Part 2',
  lisP3: 'Listening Part 3', lisP4: 'Listening Part 4', ablitz: 'Audio Blitz',
  traps: 'TOEIC Traps', stratquiz: 'Strategy Quiz', timesim: 'Exam Simulation',
  clue: 'Clue Hunter', tavern: 'Word Tavern', bforge: 'Linking Bridge',
  gauntlet_irregular: 'Gauntlet Irregular Crypt', gauntlet_tense: 'Gauntlet Chronomancer',
  gauntlet_passive: 'Gauntlet Passive Forge', gauntlet_relative: 'Gauntlet Relative Weaver',
  modals_match: 'Modal Council Oracle', modals_sort: 'Modal Council Verdict',
  daily: 'Daily Challenge', endless: 'Endless Arena',
};

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1);
}

const CSV = path.join(__dirname, 'data', 'toeic_arena_export_idrac2026_2026-06-10.csv');
const rows = parseCSV(fs.readFileSync(CSV, 'utf8'));
const header = rows[0].map(h => h.trim());
const idx = {}; header.forEach((h, i) => { idx[h] = i; });
const numOf = v => { const n = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

const students = [];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r]; if (!row || row.length < 5) continue;
  const name = (row[idx['Nom']] || '').trim();
  if (!name) continue;
  const m = {};
  for (const id of Object.keys(MODULE_COLS)) {
    const base = MODULE_COLS[id];
    const q = numOf(row[idx[base + ' Questions']]);
    const pct = numOf(row[idx[base + ' Precision%']]);
    if (q && q > 0 && pct != null) m[id] = { total: q, correct: Math.round(q * pct / 100) };
  }
  students.push({ name, ms: m, paper: PAPER[name.toLowerCase()] || null });
}

console.log('\n\n══ cohorte reelle IDRAC (export 2026-06-10, TOEIC papier T2) ══\n');
console.log('  Nom                Papier    avant    apres    delta   ecart/papier(apres)');
console.log('  ' + '-'.repeat(74));
const moved = [];
for (const st of students) {
  const o = OLD(st.ms).total, n = NEW(st.ms).total;
  if (o === null && n === null) continue;
  const d = (o != null && n != null) ? n - o : null;
  if (d != null) moved.push(Math.abs(d));
  const gap = (st.paper && n != null) ? (n - st.paper) : null;
  console.log('  ' + st.name.padEnd(18) + String(st.paper == null ? '—' : st.paper).padStart(6) +
    show(o).padStart(9) + show(n).padStart(9) +
    (d == null ? '—' : (d > 0 ? '+' + d : String(d))).padStart(9) +
    (gap == null ? '' : ('   ' + (gap > 0 ? '+' + gap : String(gap)))));
}
console.log('  ' + '-'.repeat(74));
console.log('  etudiants estimables : ' + moved.length +
  '   deplacement moyen : ' + (moved.length ? Math.round(moved.reduce((a, b) => a + b, 0) / moved.length) : 0) + ' pts');
console.log('\n  NB : n=' + moved.length + ' — la correlation sur cet echantillon ne prouve rien.');
console.log('  Le critere retenu ici est la NON-REGRESSION : ces profils etaient deja');
console.log('  sous-estimes, la retenue ne doit pas creuser l ecart.');

// Ces profils sont deja sous-estimes : on tolere un deplacement, pas un effondrement.
for (const st of students) {
  const o = OLD(st.ms).total, n = NEW(st.ms).total;
  if (o == null || n == null) continue;
  check(n >= o - 80, st.name + ' perd ' + (o - n) + ' pts : la retenue est trop agressive');
}

console.log(fails === 0 ? '\nOK - les trois pathologies sont corrigees sans effondrer la cohorte'
  : '\n' + fails + ' ECHEC(S)');
process.exit(fails === 0 ? 0 : 1);
