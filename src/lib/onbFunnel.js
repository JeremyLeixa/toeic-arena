// Entonnoir de l'onboarding (2026-10-23), onglet Usage du dashboard formateur. Pur :
// tests/check_onb_funnel.cjs.
//
// Avant le compte, rien de personnel : des COMPTEURS anonymes (jour, promo, étape) → n, envoyés par
// Onboard.jsx (onb_step, une fois par étape et par onglet) et relus par teacher_usage (`funnel` pour la
// promo, `funnel_all` pour l'admin). Après le compte, on lit l'activité anonyme déjà renvoyée par élève
// (`dms`, `joined_at`) : inscrits, première manche, retour un autre jour.
//
// ⚠️ La liste des étapes est recopiée dans la liste blanche de onb_step
// (supabase/migrations/2026-10-23_onboarding_funnel.sql) : une étape ajoutée ici sans le SQL est refusée
// en silence côté serveur, et le test le vérifie.
import { parseKey } from "./usageStats.js";

export var ONB_CAPTURE_START = "2026-10-23";
// `_` : promo des étapes d'avant le code de classe (écran prénom), visibles dans la seule vue globale.
export var ONB_GLOBAL = "_";

export var ONB_STEPS = [
  { id: "land", label: "Écran d'accueil ouvert", global: true },
  { id: "name", label: "Prénom validé", global: true },
  { id: "scan_open", label: "Arrivé au scan (nouveau)" },
  { id: "scan_start", label: "Scan commencé" },
  { id: "sec1", label: "Grammaire finie" },
  { id: "sec2", label: "Vocabulaire fini" },
  { id: "sec3", label: "Lecture finie" },
  { id: "scan_done", label: "Scan fini" },
  { id: "report_cta", label: "Rapport : bouton touché" },
  { id: "account", label: "Compte créé" },
];
// Hors entonnoir : un élève déjà inscrit reconnu au lookup (il ne refait pas le scan).
export var ONB_INFO_STEPS = ["returning"];
export var ONB_STEP_IDS = ONB_STEPS.map(function (s) { return s.id; }).concat(ONB_INFO_STEPS);

function dayMinus(now, k) { return new Date(now.getTime() - k * 86400000).toISOString().slice(0, 10); }

// rows : [{day:"YYYY-MM-DD", step, n}] ; students : lignes anonymes de teacher_usage ({dms, joined_at}).
// opts.global : vue admin toutes promos (part de `land`), sinon vue promo (part de `scan_open`).
export function onbFunnel(rows, students, now, opts) {
  now = now || new Date();
  var global = !!(opts && opts.global);
  var from30 = dayMinus(now, 29), from = from30 > ONB_CAPTURE_START ? from30 : ONB_CAPTURE_START;
  var tot = {};
  (rows || []).forEach(function (r) {
    if (!r || !r.day || String(r.day).slice(0, 10) < from) return;
    tot[r.step] = (tot[r.step] || 0) + (+r.n || 0);
  });
  var defs = ONB_STEPS.filter(function (s) { return global || !s.global; });
  var start = defs.length ? (tot[defs[0].id] || 0) : 0;
  var worst = null, prev = null;
  var steps = defs.map(function (s, i) {
    var n = tot[s.id] || 0;
    var ofPrev = i === 0 ? null : (prev ? n / prev : null);
    var st = { id: s.id, label: s.label, n: n, ofPrev: ofPrev, ofStart: start ? n / start : null, worst: false };
    // Plus forte perte : la plus petite part de l'étape précédente, seulement quand il y avait du monde avant.
    if (ofPrev !== null && (worst === null || ofPrev < worst.ofPrev)) worst = st;
    prev = n;
    return st;
  });
  if (worst && worst.ofPrev < 1) worst.worst = true;

  // Après le compte : élèves inscrits dans la fenêtre, d'après joined_at et leur activité (dms).
  var joined = 0, firstSession = 0, cameBack = 0;
  (students || []).forEach(function (s) {
    var j = s && s.joined_at ? String(s.joined_at).slice(0, 10) : null;
    if (!j || j < from) return;
    joined++;
    var played = false, later = false;
    Object.keys((s && s.dms) || {}).forEach(function (key) {
      var k = parseKey(key);
      if (!k || k.quit || !(+s.dms[key] > 0) || k.date < j) return;
      played = true;
      if (k.date > j) later = true;
    });
    if (played) firstSession++;
    if (later) cameBack++;
  });
  return {
    from: from, global: global, steps: steps,
    returning: tot.returning || 0,
    after: { joined: joined, firstSession: firstSession, cameBack: cameBack },
    empty: !Object.keys(tot).length,
  };
}
