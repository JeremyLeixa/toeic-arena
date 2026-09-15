// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── FREEMIUM: modules available in visitor/free mode ───
export var FREE_MODULES = ["daily","drill","csess","lisP2","stratquiz","strats","gramref","wfall","tavern"];
export var FREE_FLASHCARD_DOMAINS = ["finance","travel","office","linking"];
// Returns true if the user has unrestricted access to all premium modules.
// Reasons: active Stripe subscription, active 3-month pass, or active institutional group.
export function hasFullAccess(u, gType) {
  if (!u) return false;
  if (u.accessLevel === "premium_monthly") return true;
  if (u.accessLevel === "premium_pass" && u.accessExpiresAt && new Date(u.accessExpiresAt) > new Date()) return true;
  // Institutional (school/pro) users get full access until their group's end_date
  // (expired groups are handled upstream — user is redirected to the expired screen before reaching module gates)
  if (gType === "school" || gType === "pro") return true;
  return false;
}
export function isModuleLocked(moduleId, u, gType) {
  if (hasFullAccess(u, gType)) return false;
  return FREE_MODULES.indexOf(moduleId) === -1;
}
// ─── PREMIUM FEATURE FLAG ───
// Bascule manuelle. False = bouton "Passer à Premium" grisé + UpgradeScreen
// bloqué (affiche juste "Bientôt disponible"). Les utilisateurs déjà Premium
// (pass ou monthly actif) gardent leur accès — seule la nouvelle souscription
// est bloquée.
//
// À remettre à TRUE dès que le flow E2E est validé end-to-end sans bug
// d'attribution de row (cf. chantier hardening 2026-04-24).
export var PREMIUM_UPGRADE_ENABLED=true;
// save() — localStorage + Supabase (UPDATE first, INSERT if no row)
export var GHOST_NAME="Teacher"; // Teacher is hidden from leaderboards but DOES sync to Supabase
// Colonnes du roster formateur. Plus utilisee comme argument de select() depuis la
// Phase C-lite (le dashboard passe par la RPC teacher_students) : gardee comme
// reference, la liste SQL de la RPC doit rester identique a celle-ci.
// var DASH_STUDENT_COLS="id,name,class_code,xp,weekly_xp,week_id,streak,last_active,stats,total_time,module_scores,mock_results,game_scores,unlocked_ach,weekly_daily_count,weekly_history";
// A "ghost student" is a registered student (non-visitor) who barely engaged with the app
export function isGhost(s){if(!s)return false;if(s.class_code==="visitor")return false;var tq=(s.stats&&s.stats.totalQ)||0;var cr=(s.stats&&s.stats.cardsRev)||0;return tq<=15&&cr<=10;}
