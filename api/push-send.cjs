// ═══════════════════════════════════════════════════════════
// api/push-send.js — Vercel Serverless Function
// Sends push notifications to specified subscriptions
//
// POST /api/push-send
// Headers: { "x-push-secret": "YOUR_PUSH_SECRET" }
// Body: {
//   "subscriptions": [{ endpoint, keys: { p256dh, auth } }, ...],
//   "title": "TOEIC Arena",
//   "body": "Your streak is in danger!",
//   "tag": "streak-reminder",
//   "url": "/"
// }
// ═══════════════════════════════════════════════════════════

const webpush = require("web-push");

webpush.setVapidDetails(
  "mailto:jeremy.leixa@mail-formateur.net",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  var secret = req.headers["x-push-secret"];
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  var { subscriptions, title, body, tag, url } = req.body;
  if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
    return res.status(400).json({ error: "No subscriptions provided" });
  }

  var payload = JSON.stringify({
    title: title || "TOEIC Arena",
    body: body || "Time to train!",
    icon: "/icon-192.png",
    tag: tag || "toeic-default",
    url: url || "/",
  });

  var results = { sent: 0, failed: 0, errors: [] };

  for (var i = 0; i < subscriptions.length; i++) {
    try {
      await webpush.sendNotification(subscriptions[i], payload);
      results.sent++;
    } catch (err) {
      results.failed++;
      // 410 Gone = subscription expired, should be cleaned up
      if (err.statusCode === 410 || err.statusCode === 404) {
        results.errors.push({ endpoint: subscriptions[i].endpoint, status: err.statusCode, expired: true });
      } else {
        results.errors.push({ endpoint: subscriptions[i].endpoint, status: err.statusCode, message: err.message });
      }
    }
  }

  return res.status(200).json(results);
};
