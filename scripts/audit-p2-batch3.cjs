// ═══════════════════════════════════════════════════════════
// audit-p2-batch3.cjs
// Post-deployment audit for P2 batch 3 (items p2_76 → p2_125).
//
// ⚠ NO PER-ITEM TRACKING EXISTS in Supabase. moduleScores.lisP2
//   stores session-level aggregates only ({correct, total, history}).
//   ListenP2 picks 10 random items per session and never saves which
//   specific items were shown. See audit-results/README.md §Limitations.
//
// What this script CAN measure:
//   - Session accuracy before vs after 2026-04-29 (batch 3 deployment)
//   - Student engagement (sessions played post-deployment)
//   - Per-week accuracy trend via weekly_snapshots
//
// Required env vars (from .env or shell):
//   VITE_SUPABASE_URL          – e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  – service role key (bypasses RLS)
//     Fallback: VITE_SUPABASE_ANON_KEY (may hit RLS on students table)
//
// Usage:
//   node scripts/audit-p2-batch3.cjs
//
// Output: audit-results/p2-batch3-YYYY-MM-DD.md
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

// ── 1. Parse .env ────────────────────────────────────────────────────────────
function loadEnv() {
  var envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  var lines = fs.readFileSync(envPath, "utf8").split("\n");
  lines.forEach(function(line) {
    var m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  });
}
loadEnv();

var SUPABASE_URL = process.env.VITE_SUPABASE_URL;
var API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !API_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("   Set SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY as fallback.");
  process.exit(1);
}

var HEADERS = { "apikey": API_KEY, "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json" };
var BATCH3_DATE = "2026-04-29";
var CLASS_CODE = process.env.AUDIT_CLASS_CODE || "idrac2026";

// ── 2. Supabase REST helper ───────────────────────────────────────────────────
async function supaFetch(path) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + path, { headers: HEADERS });
  if (!res.ok) throw new Error("Supabase error " + res.status + ": " + await res.text());
  return res.json();
}

// ── 3. Session accuracy splitter ─────────────────────────────────────────────
function splitHistory(history) {
  var pre = { correct: 0, total: 0, sessions: 0 };
  var post = { correct: 0, total: 0, sessions: 0 };
  (history || []).forEach(function(h) {
    var bucket = h.date < BATCH3_DATE ? pre : post;
    bucket.correct += h.correct || 0;
    bucket.total   += h.total   || 0;
    bucket.sessions++;
  });
  return { pre, post };
}

function pct(c, t) { return t === 0 ? "N/A" : Math.round(100 * c / t) + "%"; }

// ── 4. Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Fetching students (class_code=" + CLASS_CODE + ") …");

  var students = await supaFetch(
    "students?select=name,module_scores,last_active&class_code=eq." + CLASS_CODE +
    "&module_scores->lisP2->>total=gte.1&order=name"
  );

  // Filter: only students who played P2 after batch 3
  var active = students.filter(function(s) {
    var ms = s.module_scores || {};
    var p2 = ms.lisP2 || {};
    var hist = p2.history || [];
    return hist.some(function(h) { return h.date >= BATCH3_DATE; });
  });

  console.log("  Students with lisP2 data: " + students.length);
  console.log("  Active post-" + BATCH3_DATE + ": " + active.length);

  // Aggregate across all students
  var global = { pre: { c:0,t:0,s:0 }, post: { c:0,t:0,s:0 } };
  var perStudent = active.map(function(s) {
    var p2 = (s.module_scores || {}).lisP2 || {};
    var split = splitHistory(p2.history);
    global.pre.c  += split.pre.correct;  global.pre.t  += split.pre.total;  global.pre.s  += split.pre.sessions;
    global.post.c += split.post.correct; global.post.t += split.post.total; global.post.s += split.post.sessions;
    return {
      name: s.name,
      prePct:  pct(split.pre.correct,  split.pre.total),
      postPct: pct(split.post.correct, split.post.total),
      preSess:  split.pre.sessions,
      postSess: split.post.sessions,
    };
  });

  // Weekly snapshots: compute avg P2 accuracy per week
  console.log("🔍 Fetching weekly_snapshots …");
  var snaps = await supaFetch(
    "weekly_snapshots?select=week_start,module_scores_snapshot&class_code=eq." + CLASS_CODE +
    "&order=week_start&week_start=gte.2026-04-01"
  );

  var byWeek = {};
  snaps.forEach(function(row) {
    var wk = row.week_start;
    var p2 = ((row.module_scores_snapshot || {}).lisP2) || {};
    if (!p2.total) return;
    if (!byWeek[wk]) byWeek[wk] = { c: 0, t: 0, students: 0 };
    byWeek[wk].c += p2.correct || 0;
    byWeek[wk].t += p2.total   || 0;
    byWeek[wk].students++;
  });

  // ── 5. Render markdown ──────────────────────────────────────────────────────
  var today = new Date().toISOString().slice(0, 10);
  var lines = [
    "# Audit P2 batch 3 — Résultats",
    "> Généré automatiquement le " + today + " par `scripts/audit-p2-batch3.cjs`",
    "> Classe : `" + CLASS_CODE + "` | Batch 3 déployé le : `" + BATCH3_DATE + "`",
    "",
    "## ⚠ Limitation critique",
    "**Il n'existe pas de tracking per-item dans TOEIC Arena.** `moduleScores.lisP2` stocke uniquement",
    "des agrégats par session (`correct`, `total`, `history: [{date, correct, total}]`).",
    "`ListenP2` sélectionne 10 items aléatoires par session (via `shuffle().slice(0,10)`) sans",
    "enregistrer les IDs vus. **L'analyse per-item est impossible** avec les données actuelles.",
    "Voir la section Future Work du README pour ajouter ce tracking.",
    "",
    "## ⚠ Confounding factor : bug des préfixes audio (batch 3)",
    'Les fichiers audio de batch 3 (`p2_76` → `p2_125`) ne préfixent pas les réponses avec',
    '"A. ", "B. ", "C. " dans le texte lu à voix haute — contrairement au batch 4 qui a corrigé',
    "ce bug. Cette lacune peut expliquer une baisse d'accuracy indépendante des accents.",
    "**À considérer avant de conclure sur l'impact des accents.**",
    "",
    "## Composition du pool P2",
    "| Batch | Items | Voix | Préfixe audio |",
    "|-------|-------|------|---------------|",
    "| Batch 1+2 | p2_01 → p2_75 | Sarah (US F) | N/A (options écrites) |",
    "| **Batch 3** | **p2_76 → p2_125** | **VOICE_A (pairs) + VOICE_B (impairs)** | **Non (bug)** |",
    "| Batch 4 | p2_126 → p2_175 | 6 voix rotation | Oui (bug corrigé) |",
    "",
    "## Données étudiants",
    "| Métrique | Valeur |",
    "|----------|--------|",
    "| Étudiants avec data lisP2 | " + students.length + " |",
    "| Actifs post-" + BATCH3_DATE + " | " + active.length + " |",
    "",
    "### Accuracy globale : avant vs après batch 3",
    "| Période | Sessions | Questions | Accuracy |",
    "|---------|----------|-----------|----------|",
    "| Pré-" + BATCH3_DATE + " | " + global.pre.s + " | " + global.pre.t + " | " + pct(global.pre.c, global.pre.t) + " |",
    "| Post-" + BATCH3_DATE + " | " + global.post.s + " | " + global.post.t + " | " + pct(global.post.c, global.post.t) + " |",
    "",
    "### Accuracy par étudiant (post-batch 3)",
    "| Étudiant | Accuracy pré | Sessions pré | Accuracy post | Sessions post |",
    "|----------|-------------|-------------|--------------|--------------|",
    ...perStudent.map(function(s) {
      return "| " + s.name + " | " + s.prePct + " | " + s.preSess + " | " + s.postPct + " | " + s.postSess + " |";
    }),
    "",
    "### Tendance hebdomadaire (weekly_snapshots)",
    "| Semaine | Étudiants | Questions cumulées | Accuracy |",
    "|---------|-----------|-------------------|----------|",
    ...Object.keys(byWeek).sort().map(function(wk) {
      var w = byWeek[wk];
      return "| " + wk + " | " + w.students + " | " + w.t + " | " + pct(w.c, w.t) + " |";
    }),
    "",
    "---",
    "",
    "## Template d'analyse — À remplir par Jérémy",
    "",
    "### 1. Différentiel accuracy batch 3 vs batch 1+2",
    "- [ ] Accuracy post-batch3 **supérieure ou égale** à pré-batch3 → ✅ les accents n'impactent pas négativement",
    "- [ ] Accuracy post-batch3 **inférieure de 5-10%** → ⚠ impact modéré (accent + bug préfixe audio ?)",
    "- [ ] Accuracy post-batch3 **inférieure de >10%** → 🔴 impact significatif → investiguer",
    "",
    "**Observation Jérémy :**",
    "> _À compléter_",
    "",
    "### 2. Hypothèse accent vs bug préfixe",
    "- [ ] Comparer avec accuracy batch 4 (post-déploiement batch4) qui a le bug corrigé",
    "- [ ] Si batch4 accuracy ≥ batch1+2 → bug préfixe est le coupable principal",
    "- [ ] Si batch4 accuracy toujours basse → c'est bien l'accent",
    "",
    "**Observation Jérémy :**",
    "> _À compléter_",
    "",
    "### 3. Engament post-batch3",
    "- [ ] Sessions post-batch3 suffisantes (≥ 50 sessions total) pour des conclusions statistiques",
    "- [ ] Nombre d'étudiants actifs post-batch3 représentatif (≥ 15)",
    "",
    "### 4. Problèmes à investiguer si détectés",
    "- [ ] Items jamais exposés → **impossible à détecter** (pas de tracking per-item)",
    "- [ ] Shuffle non uniforme → **impossible à détecter** sans tracking per-item",
    "",
    "### 5. Recommandation finale",
    "<!-- Cocher une option après analyse -->",
    "- [ ] ✅ GO batch 5 — pas d'impact détectable",
    "- [ ] ⚠ Ajouter tracking per-item avant le prochain batch (voir Future Work)",
    "- [ ] 🔴 Régénérer les 50 items batch 3 avec préfixes audio (bug fix)",
    "- [ ] 🔴 Reconsidérer les voix batch 3 (accents trop difficiles)",
    "",
    "**Décision Jérémy :**",
    "> _À compléter_",
  ];

  var outDir = path.join(__dirname, "..", "audit-results");
  fs.mkdirSync(outDir, { recursive: true });
  var outFile = path.join(outDir, "p2-batch3-" + today + ".md");
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  console.log("✅ Report written → " + outFile);
}

main().catch(function(e) {
  console.error("❌ Audit failed:", e.message);
  process.exit(1);
});
