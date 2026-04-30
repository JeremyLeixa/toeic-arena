import { createClient } from "@supabase/supabase-js";

// Best-effort in-memory rate limiter (per serverless instance).
// 5 reports per 5 min per IP — generous for legit use, blocks burst spam.
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

var supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

var TYPE_LABELS = {
  bug: "🐞 Bug",
  suggestion: "💡 Suggestion",
  question: "❓ Question pédagogique"
};

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var ip = req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(ip, 5, 5 * 60 * 1000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  var body = req.body || {};
  var user_name = (body.user_name || "").toString().trim().slice(0, 60);
  var class_code = (body.class_code || "visitor").toString().trim().slice(0, 60);
  var feedback_type = (body.feedback_type || "").toString().trim();
  var module_id = (body.module_id || "").toString().trim().slice(0, 60);
  var module_label = (body.module_label || "").toString().trim().slice(0, 100);
  var message = (body.message || "").toString().trim().slice(0, 4000);

  // Validation
  if (!user_name) return res.status(400).json({ error: "user_name required" });
  if (["bug", "suggestion", "question"].indexOf(feedback_type) === -1) {
    return res.status(400).json({ error: "feedback_type must be bug | suggestion | question" });
  }
  if (!module_id || !module_label) return res.status(400).json({ error: "module required" });
  if (message.length < 10) return res.status(400).json({ error: "message too short (min 10 chars)" });

  // ── Insert in Supabase ──
  var insertRes = await supaAdmin
    .from("feedback_reports")
    .insert({
      user_name: user_name,
      class_code: class_code,
      feedback_type: feedback_type,
      module_id: module_id,
      module_label: module_label,
      message: message
    })
    .select()
    .single();

  if (insertRes.error) {
    console.error("[feedback-send] insert error:", insertRes.error.message);
    return res.status(500).json({ error: "Failed to save report" });
  }

  // ── Send email alert via Resend (best-effort, doesn't block success) ──
  var emailStatus = "skipped";
  if (process.env.RESEND_API_KEY) {
    try {
      var subject = "[TOEIC Arena] " + (TYPE_LABELS[feedback_type] || feedback_type) + " — " + module_label;
      var html =
        "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f8f8;\">" +
        "<div style=\"background:#fff;padding:24px;border-radius:8px;border:1px solid #e0e0e0;\">" +
        "<h2 style=\"margin:0 0 16px;color:#333;font-size:18px;\">New feedback from TOEIC Arena</h2>" +
        "<table style=\"width:100%;border-collapse:collapse;font-size:14px;color:#333;\">" +
        "<tr><td style=\"padding:6px 8px;color:#888;width:120px;\">Student</td><td style=\"padding:6px 8px;font-weight:600;\">" + escapeHtml(user_name) + "</td></tr>" +
        "<tr><td style=\"padding:6px 8px;color:#888;\">Class</td><td style=\"padding:6px 8px;\">" + escapeHtml(class_code) + "</td></tr>" +
        "<tr><td style=\"padding:6px 8px;color:#888;\">Type</td><td style=\"padding:6px 8px;\">" + escapeHtml(TYPE_LABELS[feedback_type] || feedback_type) + "</td></tr>" +
        "<tr><td style=\"padding:6px 8px;color:#888;\">Module</td><td style=\"padding:6px 8px;\">" + escapeHtml(module_label) + "</td></tr>" +
        "</table>" +
        "<div style=\"margin-top:20px;padding:14px;background:#f4f4f4;border-left:3px solid #06b6d4;border-radius:4px;\">" +
        "<div style=\"font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;\">Message</div>" +
        "<div style=\"font-size:14px;line-height:1.6;color:#222;white-space:pre-wrap;\">" + escapeHtml(message) + "</div>" +
        "</div>" +
        "<div style=\"margin-top:20px;font-size:12px;color:#888;\">Manage in Teacher Dashboard → Feedback tab.</div>" +
        "</div></div>";

      var resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "TOEIC Arena <onboarding@resend.dev>",
          to: process.env.FEEDBACK_RECIPIENT || "leixa.formation@gmail.com",
          reply_to: process.env.FEEDBACK_REPLY_TO || undefined,
          subject: subject,
          html: html
        })
      });
      if (!resendRes.ok) {
        var errTxt = await resendRes.text();
        console.warn("[feedback-send] resend failed:", resendRes.status, errTxt);
        emailStatus = "failed";
      } else {
        emailStatus = "sent";
      }
    } catch (e) {
      console.warn("[feedback-send] resend exception:", e && e.message);
      emailStatus = "failed";
    }
  }

  return res.status(200).json({ ok: true, id: insertRes.data.id, email: emailStatus });
}
