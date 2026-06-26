// ─────────────────────────────────────────────────────────────────────────────
// Stripe Customer Portal session creation
// Phase 3 (2026-04-20): lets a paying user manage their subscription
// (cancel, update payment method, download invoices) via the Stripe-hosted portal.
//
// Satisfies the "bouton résiliation" legal obligation (Code conso L. 215-1-1).
//
// Security: same auth pattern as checkout-create.js — Supabase JWT required.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_MODE = process.env.STRIPE_MODE === "live" ? "live" : "test";
const stripeKey = STRIPE_MODE === "live"
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

const supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

var _rateMap = {};
var _rateMapSize = 0;
function rateLimit(key, maxReqs, windowMs) {
  const now = Date.now();
  if (_rateMapSize > 1000) { _rateMap = {}; _rateMapSize = 0; }
  if (!_rateMap[key]) { _rateMap[key] = []; _rateMapSize++; }
  _rateMap[key] = _rateMap[key].filter((t) => t > now - windowMs);
  if (_rateMap[key].length >= maxReqs) return false;
  _rateMap[key].push(now);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(ip, 10, 60000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });

  const { data: userData, error: authErr } = await supaAdmin.auth.getUser(token);
  if (authErr || !userData || !userData.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  const user = userData.user;

  // Find the customer_id associated with this user
  // (Stored in subscriptions.stripe_customer_id after their first purchase)
  const { data: sub } = await supaAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let customerId = sub && sub.stripe_customer_id;

  if (!customerId) {
    // Fallback: check passes
    const { data: pass } = await supaAdmin
      .from("passes")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .maybeSingle();
    customerId = pass && pass.stripe_customer_id;
  }

  if (!customerId) {
    return res.status(400).json({
      error: "no_customer",
      message: "No Stripe customer found for this user. Purchase a plan first.",
    });
  }

  const origin = req.headers.origin || req.headers.referer || "https://app.verse-arena.fr";
  const returnUrl = origin.replace(/\/$/, "") + "/?portal=return";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      locale: "fr",
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe-portal-create] error:", err && err.message);
    return res.status(500).json({
      error: "Portal session creation failed",
      detail: err && err.message,
    });
  }
}
