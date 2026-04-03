import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

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

  var secret = req.headers["x-push-secret"];
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  var { subscriptions, title, body, tag, url, class_code } = req.body;

  // Mode 1: class_code provided → fetch subscriptions server-side (for frontend calls)
  // Mode 2: subscriptions provided directly (for edge functions that already have them)
  if (!subscriptions && class_code) {
    var query = supaAdmin.from("push_subscriptions").select("subscription, student_name, class_code");
    if (class_code !== "all") {
      query = query.eq("class_code", class_code);
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
    title: title || "TOEIC Arena",
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
