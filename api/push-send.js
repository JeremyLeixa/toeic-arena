import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Best-effort in-memory rate limiter (per serverless instance).
// Resets on cold starts — blocks burst abuse within a warm instance only.
// For distributed rate limiting, use Vercel WAF (Pro plan) or an external store.
var _rateMap = {};
var _rateMapSize = 0;
function rateLimit(key, maxReqs, windowMs) {
  var now = Date.now();
  // Prevent memory bloat: flush if too many unique keys
  if (_rateMapSize > 1000) { _rateMap = {}; _rateMapSize = 0; }
  if (!_rateMap[key]) { _rateMap[key] = []; _rateMapSize++; }
  _rateMap[key] = _rateMap[key].filter(function(t) { return t > now - windowMs; });
  if (_rateMap[key].length >= maxReqs) return false;
  _rateMap[key].push(now);
  return true;
}

webpush.setVapidDetails(
  "mailto:jeremy.leixa@mail-formateur.net",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Service-role client — bypasses RLS, server-side only
var supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit: 10 requests per minute per IP
  var ip = req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(ip, 10, 60000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // AUTH (H1, 2026-09-14). Avant, ce endpoint n'etait garde que par un secret partage
  // `x-push-secret` compare a PUSH_SECRET... que le navigateur envoyait depuis le bundle
  // (VITE_PUSH_SECRET). Donc "secret" public : n'importe qui pouvait notifier toute une
  // promo, ou `class_code:"all"` = toute la plateforme, et faire fuir les endpoints push.
  //
  // Deux appelants legitimes, deux gardes distinctes :
  //  1. SERVEUR (les 4 Edge Functions cron) : gardent x-push-secret, qui redevient un vrai
  //     secret serveur une fois retire du bundle. Elles seules peuvent passer `subscriptions`
  //     en clair et viser class_code:"all".
  //  2. NAVIGATEUR (dashboard formateur) : fournit `teacherCode`, valide ici cote service_role
  //     contre teacher_codes / groups — meme modele qu'en B4/B5. Il ne peut viser que SES
  //     cohortes, ne peut PAS envoyer de liste de subscriptions (on les resout ici), et
  //     class_code:"all" lui est refuse sauf role admin.
  var isServerCall = !!process.env.PUSH_SECRET
    && req.headers["x-push-secret"] === process.env.PUSH_SECRET;

  var { subscriptions, title, body, tag, url, class_code, student_name, teacherCode } = req.body;

  var callerRole = null;
  var callerCohorts = [];
  if (!isServerCall) {
    var code = String(teacherCode || "").trim();
    if (code.length >= 4) {
      var admRes = await supaAdmin.from("teacher_codes").select("role").eq("code", code).maybeSingle();
      if (admRes.data && admRes.data.role === "admin") callerRole = "admin";
      var ownRes = await supaAdmin.from("groups").select("code").eq("teacher_code", code);
      callerCohorts = (ownRes.data || []).map(function (g) { return g.code; });
      if (!callerRole && callerCohorts.length > 0) callerRole = "teacher";
    }
    if (!callerRole) {
      console.warn("[push-send] rejected: no valid teacher code and no server secret");
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Un appelant navigateur ne choisit jamais les destinataires lui-meme.
    subscriptions = null;
    if (!class_code) {
      return res.status(400).json({ error: "class_code required" });
    }
    if (class_code === "all" && callerRole !== "admin") {
      console.warn("[push-send] 'all' refused for non-admin");
      return res.status(403).json({ error: "Forbidden" });
    }
    if (class_code !== "all" && callerCohorts.indexOf(class_code) < 0) {
      console.warn("[push-send] cohort refused:", class_code);
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  // Mode 1: class_code fourni -> on resout les subscriptions ici (appels navigateur).
  // Mode 2: subscriptions fournies directement (Edge Functions serveur uniquement).
  if (!subscriptions && class_code) {
    var query = supaAdmin.from("push_subscriptions").select("subscription, student_name, class_code");
    if (class_code !== "all") {
      query = query.eq("class_code", class_code);
    }
    // Cible un seul eleve (push "feedback traite") : evite que le navigateur ait a lire
    // push_subscriptions lui-meme, ce qu'il faisait avant.
    if (student_name) {
      query = query.eq("student_name", student_name);
    }
    var { data: subRows, error: fetchErr } = await query;
    if (fetchErr) {
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
    subscriptions = (subRows || []).map(function (s) { return s.subscription; }).filter(Boolean);
  }

  if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
    return res.status(200).json({ sent: 0, failed: 0, errors: [], total: 0 });
  }

  var payload = JSON.stringify({
    title: title || "Verse Arena",
    body: body || "Time to train!",
    icon: "/icon-192.png",
    tag: tag || "toeic-default",
    url: url || "/",
  });

  var results = { sent: 0, failed: 0, errors: [], total: subscriptions.length };

  for (var i = 0; i < subscriptions.length; i++) {
    try {
      await webpush.sendNotification(subscriptions[i], payload);
      results.sent++;
    } catch (err) {
      results.failed++;
      var expired = err.statusCode === 410 || err.statusCode === 404;
      if (expired && subscriptions[i] && subscriptions[i].endpoint) {
        // Clean stale subscriptions server-side
        await supaAdmin.from("push_subscriptions").delete().eq("endpoint", subscriptions[i].endpoint);
      }
      results.errors.push({ endpoint: subscriptions[i].endpoint, status: err.statusCode, expired: expired });
    }
  }

  return res.status(200).json(results);
}
