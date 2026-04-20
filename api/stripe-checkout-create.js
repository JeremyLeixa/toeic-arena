// ─────────────────────────────────────────────────────────────────────────────
// Stripe Checkout Session creation
// Phase 3 (2026-04-20): creates a Checkout Session for Monthly (subscription)
// or TOEIC Pass 3 mois (one-time). Returns a redirect URL to Stripe Checkout.
// The caller (frontend) then window.location.href = returned URL.
//
// Security:
//   - Requires a valid Supabase JWT (from the current session) in Authorization header
//   - Validates the user exists and is authenticated
//   - Derives user_id and email server-side from the JWT — never trusts the body
//
// Env vars required:
//   STRIPE_SECRET_KEY_TEST   — Stripe test mode secret key (sk_test_...)
//   STRIPE_SECRET_KEY_LIVE   — Stripe live mode secret key (sk_live_...)
//   STRIPE_MODE              — "test" or "live" (defaults to "test")
//   STRIPE_PRICE_MONTHLY     — Price ID for Monthly (price_...)
//   STRIPE_PRICE_PASS        — Price ID for 3-month Pass (price_...)
//   VITE_SUPABASE_URL        — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — for server-side user lookup + Stripe customer link
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Select key based on STRIPE_MODE env var (defaults to test)
const STRIPE_MODE = process.env.STRIPE_MODE === "live" ? "live" : "test";
const stripeKey = STRIPE_MODE === "live"
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

// Service-role Supabase client (bypasses RLS, server-side only)
const supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory rate limiter per serverless instance
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

// Map plan id to Stripe price_id + checkout mode
function resolvePlan(plan) {
  if (plan === "monthly") {
    return {
      priceId: process.env.STRIPE_PRICE_MONTHLY,
      mode: "subscription",
      successSuffix: "?checkout=success&plan=monthly",
    };
  }
  if (plan === "pass3m") {
    return {
      priceId: process.env.STRIPE_PRICE_PASS,
      mode: "payment",
      successSuffix: "?checkout=success&plan=pass3m",
    };
  }
  return null;
}

// Find or create a Stripe customer for this user
// We cache the customer_id on auth.users metadata to avoid creating duplicates
async function findOrCreateCustomer(user) {
  // Look for an existing subscription row — the customer id is stored there
  const { data: existing } = await supaAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing && existing.stripe_customer_id) return existing.stripe_customer_id;

  // Also check passes
  const { data: existingPass } = await supaAdmin
    .from("passes")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (existingPass && existingPass.stripe_customer_id) return existingPass.stripe_customer_id;

  // No existing customer — create one
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id },
  });
  return customer.id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit: 5 checkout attempts per minute per IP (generous — users may retry)
  const ip = req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(ip, 5, 60000)) {
    return res.status(429).json({ error: "Too many checkout attempts, please wait." });
  }

  // Validate auth — require a Bearer token from Supabase session
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });

  // Verify token with Supabase and get the user
  const { data: userData, error: authErr } = await supaAdmin.auth.getUser(token);
  if (authErr || !userData || !userData.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  const user = userData.user;

  // Anonymous users must first link an email before they can purchase.
  // Stripe needs an email for receipts, subscription management, etc.
  if (!user.email) {
    return res.status(400).json({
      error: "email_required",
      message: "Please secure your account with an email before subscribing.",
    });
  }

  // Parse plan from request body
  const plan = req.body && req.body.plan;
  const planConfig = resolvePlan(plan);
  if (!planConfig) {
    return res.status(400).json({ error: "Invalid plan. Use 'monthly' or 'pass3m'." });
  }
  if (!planConfig.priceId) {
    return res.status(500).json({ error: "Server misconfiguration: price ID missing" });
  }

  // Success/cancel URLs — frontend will handle the query params on return
  const origin = req.headers.origin || req.headers.referer || "https://toeic-arena.vercel.app";
  const successUrl = origin.replace(/\/$/, "") + planConfig.successSuffix;
  const cancelUrl = origin.replace(/\/$/, "") + "?checkout=cancel";

  try {
    const customerId = await findOrCreateCustomer(user);

    const sessionConfig = {
      mode: planConfig.mode,
      customer: customerId,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "fr",
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
      // Accept TOS / withdrawal waiver — Stripe-native handling
      consent_collection: {
        terms_of_service: "required",
      },
      // Automatically collect tax according to Stripe Tax config
      automatic_tax: { enabled: true },
    };

    // For subscriptions, also set subscription_data metadata so webhooks can match
    if (planConfig.mode === "subscription") {
      sessionConfig.subscription_data = {
        metadata: {
          supabase_user_id: user.id,
          plan: plan,
        },
      };
    }

    // For one-time (pass3m), attach payment_intent metadata for the same reason
    if (planConfig.mode === "payment") {
      sessionConfig.payment_intent_data = {
        metadata: {
          supabase_user_id: user.id,
          plan: plan,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      mode: STRIPE_MODE,
    });
  } catch (err) {
    console.error("[stripe-checkout-create] error:", err && err.message);
    return res.status(500).json({
      error: "Checkout session creation failed",
      detail: err && err.message,
    });
  }
}
