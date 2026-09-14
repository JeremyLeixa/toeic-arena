import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Réinitialisation de l'accès d'un élève, déclenchée par son formateur.
//
// POURQUOI CE ENDPOINT EXISTE. Les comptes élèves sont des comptes Supabase Auth à
// email SYNTHÉTIQUE (`prenom.classcode@students.verse-arena.fr`) : il n'y a pas de
// boîte mail derrière, donc le « mot de passe oublié » par email ne peut pas
// fonctionner pour eux. Tant que la migration était souple, le filet était
// `recover()` legacy (nom + code promo, sans mot de passe). Ce filet disparaît avec
// l'activation de la RLS — sans ce bouton, le premier oubli de mot de passe
// n'aurait AUCUNE voie de récupération, et se réglerait en SQL à la main.
//
// CE QU'IL FAIT. Il ne fabrique ni ne transmet aucun mot de passe (le formateur ne
// doit jamais manipuler celui d'un élève) : il REMET LE COMPTE À L'ÉTAT « à
// sécuriser ». Concrètement, suppression du compte auth + `password_set_at` et
// `user_id` remis à NULL. À sa prochaine connexion, l'élève retombe sur l'écran
// « sécurise ton compte » et choisit lui-même un nouveau mot de passe. Sa
// progression (la ligne students) n'est pas touchée.
//
// ⚠️ FENÊTRE DE PRÉ-RÉCLAMATION. Entre le clic du formateur et la reconnexion de
// l'élève, le compte est « libre » : un camarade qui connaît son prénom et le code
// promo pourrait le réclamer à sa place. C'est inhérent au modèle « pas de secret
// pré-partagé ». D'où la consigne produit : on réinitialise pendant que l'élève est
// présent, et on le fait se reconnecter dans la foulée. Chaque reset est journalisé
// dans teacher_audit_log.
//
// AUTH. Même modèle que /api/push-send depuis H1, et que les RPC teacher_* depuis
// B4/B5 : le code formateur est validé ICI, côté service_role, contre teacher_codes
// et groups. Un formateur ne peut réinitialiser que les élèves de SES cohortes ;
// l'admin peut toutes les atteindre.
// ─────────────────────────────────────────────────────────────────────────────

var _rateMap = {};
var _rateMapSize = 0;
function rateLimit(key, maxReqs, windowMs) {
  var now = Date.now();
  if (_rateMapSize > 1000) { _rateMap = {}; _rateMapSize = 0; }
  if (!_rateMap[key]) { _rateMap[key] = []; _rateMapSize++; }
  _rateMap[key] = _rateMap[key].filter(function (t) { return t > now - windowMs; });
  if (_rateMap[key].length >= maxReqs) return false;
  _rateMap[key].push(now);
  return true;
}

// Service-role client — bypasse la RLS et l'API admin auth. Serveur uniquement.
var supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ⚠️ MIROIR EXACT de normNameForEmail/synthEmail (src/auth.js) — si les deux
// divergent, on supprimerait le mauvais compte auth, ou aucun.
var SYNTH_EMAIL_DOMAIN = "students.verse-arena.fr";
function normNameForEmail(name) {
  return (name || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function synthEmail(name, classCode) {
  var localName = normNameForEmail(name);
  var cc = (classCode || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!localName || !cc) return null;
  return localName + "." + cc + "@" + SYNTH_EMAIL_DOMAIN;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var ip = req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(ip, 10, 60000)) return res.status(429).json({ error: "Too many requests" });

  var body = req.body || {};
  var name = String(body.name || "").trim();
  var classCode = String(body.class_code || "").trim();
  var code = String(body.teacherCode || "").trim();
  if (!name || !classCode) return res.status(400).json({ error: "name and class_code required" });

  // ── Authentification de l'appelant ──
  var callerRole = null;
  var callerCohorts = [];
  if (code.length >= 4) {
    var admRes = await supaAdmin.from("teacher_codes").select("role").eq("code", code).maybeSingle();
    if (admRes.data && admRes.data.role === "admin") callerRole = "admin";
    var ownRes = await supaAdmin.from("groups").select("code").eq("teacher_code", code);
    callerCohorts = (ownRes.data || []).map(function (g) { return g.code; });
    if (!callerRole && callerCohorts.length > 0) callerRole = "teacher";
  }
  if (!callerRole) {
    console.warn("[teacher-reset] rejected: invalid teacher code");
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (callerRole !== "admin" && callerCohorts.indexOf(classCode) < 0) {
    console.warn("[teacher-reset] cohort refused:", classCode);
    return res.status(403).json({ error: "Forbidden" });
  }

  // ── La ligne élève ──
  var stuRes = await supaAdmin
    .from("students")
    .select("id, name, class_code, user_id")
    .eq("name", name)
    .eq("class_code", classCode)
    .maybeSingle();
  if (stuRes.error) {
    console.error("[teacher-reset] students read failed:", stuRes.error.message);
    return res.status(500).json({ error: "Lookup failed" });
  }
  if (!stuRes.data) return res.status(404).json({ error: "no_student" });
  var student = stuRes.data;

  // ── Suppression du compte auth ──
  // Deux cas. (1) La ligne porte un user_id : on supprime directement. (2) Elle n'en
  // porte pas (compte legacy jamais migré) mais un compte synthétique peut exister
  // quand même — un claim interrompu avant le binding. Sans ce second passage,
  // l'élève retomberait sur « compte déjà existant » et se retrouverait coincé.
  var deleted = null;
  if (student.user_id) {
    var delRes = await supaAdmin.auth.admin.deleteUser(student.user_id);
    if (delRes.error) console.warn("[teacher-reset] deleteUser(user_id) failed:", delRes.error.message);
    else deleted = "by_user_id";
  }
  if (!deleted) {
    var email = synthEmail(name, classCode);
    if (email) {
      // supabase-js n'expose pas de getUserByEmail : on pagine (≈160 comptes = 1 page).
      var page = 1;
      while (page <= 10 && !deleted) {
        var listRes = await supaAdmin.auth.admin.listUsers({ page: page, perPage: 200 });
        if (listRes.error) { console.warn("[teacher-reset] listUsers failed:", listRes.error.message); break; }
        var users = (listRes.data && listRes.data.users) || [];
        for (var i = 0; i < users.length; i++) {
          if ((users[i].email || "").toLowerCase() === email) {
            var d2 = await supaAdmin.auth.admin.deleteUser(users[i].id);
            if (d2.error) console.warn("[teacher-reset] deleteUser(email) failed:", d2.error.message);
            else deleted = "by_email";
            break;
          }
        }
        if (users.length < 200) break;
        page++;
      }
    }
  }

  // ── Remise à l'état « à sécuriser » ──
  // La progression n'est PAS touchée : on ne remet à NULL que le lien d'identité.
  var updRes = await supaAdmin
    .from("students")
    .update({ user_id: null, password_set_at: null })
    .eq("id", student.id);
  if (updRes.error) {
    console.error("[teacher-reset] students update failed:", updRes.error.message);
    return res.status(500).json({ error: "Reset failed" });
  }

  await supaAdmin.from("teacher_audit_log").insert({
    // Même empreinte que les RPC teacher_* : identifie qui a agi sans stocker
    // une seconde copie du code en clair.
    actor: crypto.createHash("md5").update(code).digest("hex").slice(0, 8),
    role: callerRole,
    action: "reset_student_access",
    target: classCode,
    details: { name: name, auth_deleted: deleted }
  });

  console.warn("[teacher-reset] OK —", name, classCode, "| auth:", deleted || "none");
  return res.status(200).json({ ok: true, auth_deleted: deleted });
}
