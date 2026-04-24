// ─────────────────────────────────────────────────────────────────────────────
// Stripe Webhook handler
// Phase 3 (2026-04-20): receives events from Stripe, processes them into
// our Supabase tables (subscriptions, passes, stripe_events for dedup).
//
// Events handled:
//   checkout.session.completed        — initial payment success (both modes)
//   customer.subscription.created     — new Monthly sub
//   customer.subscription.updated     — renewal, cancel-at-period-end toggle, status change
//   customer.subscription.deleted     — final cancellation
//   invoice.payment_succeeded         — recurring Monthly renewal
//   invoice.payment_failed            — recurring Monthly failure
//   charge.refunded                   — manual refund (pass or sub)
//
// Security:
//   - Stripe signature verification via STRIPE_WEBHOOK_SECRET
//   - Deduplication via stripe_events table (idempotent replays)
//   - Service role Supabase client (bypasses RLS)
//
// Vercel note: this endpoint needs the RAW request body for signature verification.
// We disable automatic body parsing via the config export below.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_MODE = process.env.STRIPE_MODE === "live" ? "live" : "test";
const stripeKey = STRIPE_MODE === "live"
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;
const webhookSecret = STRIPE_MODE === "live"
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;

const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

const supaAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel: disable body parser so we can verify the raw body signature
export const config = {
  api: { bodyParser: false },
};

// Read raw body from the request stream (required for Stripe signature)
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Deduplicate events — Stripe may retry up to 3x on failure
async function alreadyProcessed(eventId) {
  const { data } = await supaAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  return !!data;
}

async function markProcessed(event) {
  await supaAdmin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    payload: event,
  });
}

// ─── Event handlers ──────────────────────────────────────────────────────────

// Update students.access_level en priorisant la clé naturelle (name, class_code)
// si disponible dans les metadata — sinon retombe sur id match, puis email.
//
// Ordre des stratégies (du plus précis au plus fragile) :
//   1. (name, class_code) = clé naturelle app utilisée par save() — cible
//      toujours la row "intended" par l'utilisateur. Ajoutée 2026-04-24 après
//      le bug Teacher/Jaytest2 (id match legacy atterrissait sur la mauvaise
//      row parce que Teacher.id == auth_user_id pour raison historique).
//   2. id = auth.users.id — fonctionne pour les rows créées legacy (pré
//      2026-04-21) dont students.id = auth_user_id. Fragile pour les nouvelles
//      rows où id est une UUID auto-générée distincte de auth_user_id.
//   3. email — dernier recours, match possiblement ambigu si plusieurs rows
//      partagent un email (profils test avec alias). On loggue un warning
//      si ça arrive pour investigation.
//
// consent (optionnel) : { cgv_version, cgv_accepted_at, retractation_waived_at }
// Écrit dans la MÊME UPDATE que access_level (transaction atomique garantit
// que la trace légale et le statut premium sont toujours cohérents).
async function updateStudentAccess(userId, accessLevel, expiresAtIso, consent, naturalKey) {
  const payload = { access_level: accessLevel, access_expires_at: expiresAtIso };
  if (consent) {
    if (consent.cgv_version) payload.cgv_version = consent.cgv_version;
    if (consent.cgv_accepted_at) payload.cgv_accepted_at = consent.cgv_accepted_at;
    if (consent.retractation_waived_at) payload.retractation_waived_at = consent.retractation_waived_at;
  }

  // ── Stratégie 1 : clé naturelle (name, class_code) ──
  if (naturalKey && naturalKey.name && naturalKey.class_code) {
    const nkRes = await supaAdmin
      .from("students")
      .update(payload)
      .ilike("name", naturalKey.name)
      .eq("class_code", naturalKey.class_code)
      .select("id");
    if (nkRes.error) {
      console.error("[webhook] natural key update error:", nkRes.error.message);
    } else if (nkRes.data && nkRes.data.length > 0) {
      console.log("[webhook] updated by natural key (" + naturalKey.name + "," + naturalKey.class_code + ")");
      return;
    } else {
      console.warn("[webhook] no student matched natural key (" + naturalKey.name + "," + naturalKey.class_code + ") — falling back to id");
    }
  }

  // ── Stratégie 2 : id match (legacy) ──
  const idRes = await supaAdmin
    .from("students")
    .update(payload)
    .eq("id", userId)
    .select("id, name, class_code");
  if (idRes.data && idRes.data.length > 0) {
    const hit = idRes.data[0];
    console.log("[webhook] updated by id match: " + hit.name + "/" + hit.class_code + (naturalKey ? " (WARN: natural key preferred but not matched)" : ""));
    return;
  }

  // ── Stratégie 3 : email fallback (last resort) ──
  try {
    const { data: userData } = await supaAdmin.auth.admin.getUserById(userId);
    const email = userData && userData.user && userData.user.email;
    if (!email) {
      console.warn("[webhook] no email on auth user " + userId + ", cannot fallback");
      return;
    }
    const emailRes = await supaAdmin
      .from("students")
      .update(payload)
      .eq("email", email)
      .select("id, name, class_code");
    if (emailRes.data && emailRes.data.length > 0) {
      if (emailRes.data.length > 1) {
        console.warn("[webhook] AMBIGUOUS email match (" + emailRes.data.length + " rows): " + email + " — all rows got updated");
      }
      console.log("[webhook] updated students by email fallback: " + email);
    } else {
      console.warn("[webhook] no student matched id=" + userId + " or email=" + email + " or naturalKey");
    }
  } catch (e) {
    console.error("[webhook] email fallback error:", e && e.message);
  }
}

// Helper : extrait le consent trace des metadata Stripe
function extractConsent(metadata) {
  if (!metadata) return null;
  const out = {};
  if (metadata.cgv_version) out.cgv_version = metadata.cgv_version;
  if (metadata.cgv_accepted_at) out.cgv_accepted_at = metadata.cgv_accepted_at;
  if (metadata.retractation_waived_at) out.retractation_waived_at = metadata.retractation_waived_at;
  return Object.keys(out).length > 0 ? out : null;
}

// Helper : extrait la clé naturelle students depuis les metadata Stripe
function extractNaturalKey(metadata) {
  if (!metadata || !metadata.student_name) return null;
  return {
    name: metadata.student_name,
    class_code: metadata.student_class_code || "visitor",
  };
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata && session.metadata.supabase_user_id;
  const plan = session.metadata && session.metadata.plan;
  console.log("[webhook] handleCheckoutCompleted start — userId=" + userId + " plan=" + plan + " session=" + session.id + " customer=" + session.customer + " amount=" + session.amount_total);
  if (!userId) {
    console.warn("[webhook] checkout.session.completed without supabase_user_id, skipping");
    return;
  }

  if (plan === "pass3m") {
    // One-time payment — create passes row
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    // Derive price_id from env var — session.line_items isn't included in
    // checkout.session.completed by default (requires expand), and our
    // passes.price_id is NOT NULL. The plan metadata tells us which price.
    const priceId = process.env.STRIPE_PRICE_PASS || "unknown";
    console.log("[webhook] passes upsert: id=" + session.id + " user_id=" + userId + " customer=" + session.customer + " pi=" + session.payment_intent + " priceId=" + priceId + " amount=" + (session.amount_total || 0));
    const res = await supaAdmin.from("passes").upsert({
      id: session.id,
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_payment_intent_id: session.payment_intent,
      price_id: priceId,
      amount_paid: session.amount_total || 0,
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "id" }).select("id");
    console.log("[webhook] passes upsert result:", JSON.stringify({ error: res.error, dataLen: (res.data && res.data.length) || 0 }));
    if (res.error) {
      console.error("[webhook] passes insert error:", res.error.message);
      throw res.error;
    }

    // Snapshot on students — priorité natural key > id > email
    console.log("[webhook] updating student access for " + userId);
    const consent = extractConsent(session.metadata);
    const naturalKey = extractNaturalKey(session.metadata);
    if (consent) console.log("[webhook] consent trace attached:", Object.keys(consent).join(","));
    if (naturalKey) console.log("[webhook] natural key attached:", naturalKey.name + "/" + naturalKey.class_code);
    await updateStudentAccess(userId, "premium_pass", expiresAt.toISOString(), consent, naturalKey);
    console.log("[webhook] handleCheckoutCompleted done for pass3m");
  } else if (plan === "monthly") {
    // Subscription flow — the subscription.created event handles DB writes separately
    console.log("[webhook] checkout for monthly — will be handled by subscription.created");
  } else {
    console.warn("[webhook] unknown plan: " + plan);
  }

  // For subscription mode, the subscription.created event will fire separately with full details.
  // We don't double-write here.
}

async function handleSubscriptionUpsert(subscription) {
  const userId = subscription.metadata && subscription.metadata.supabase_user_id;
  if (!userId) {
    console.warn("[webhook] subscription without supabase_user_id, skipping");
    return;
  }

  const payload = {
    id: subscription.id,
    user_id: userId,
    stripe_customer_id: subscription.customer,
    price_id: (subscription.items && subscription.items.data[0] && subscription.items.data[0].price && subscription.items.data[0].price.id) || null,
    status: subscription.status,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

  const { error } = await supaAdmin.from("subscriptions").upsert(payload, { onConflict: "id" });
  if (error) console.error("[webhook] subscriptions upsert error:", error.message);

  // Snapshot on students — priorité natural key > id > email
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  // Consent trace uniquement lors de la 1ère souscription (quand isActive).
  // Sur les renouvellements / cancel / suspend, le consentement initial
  // est conservé (on n'écrase pas).
  const consent = isActive ? extractConsent(subscription.metadata) : null;
  // Natural key est toujours attachée (utile aussi pour cancel/downgrade
  // : on veut remettre la BONNE row à free).
  const naturalKey = extractNaturalKey(subscription.metadata);
  if (consent) console.log("[webhook] consent trace attached to subscription:", Object.keys(consent).join(","));
  if (naturalKey) console.log("[webhook] natural key attached to subscription:", naturalKey.name + "/" + naturalKey.class_code);
  await updateStudentAccess(
    userId,
    isActive ? "premium_monthly" : "free",
    isActive ? payload.current_period_end : null,
    consent,
    naturalKey
  );
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata && subscription.metadata.supabase_user_id;

  // Mark the subscription canceled
  await supaAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  // Downgrade the student (id-first with email fallback)
  if (userId) {
    await updateStudentAccess(userId, "free", null);
  }
}

async function handleChargeRefunded(charge) {
  // Manual refund — find if this charge belongs to a pass and downgrade if so
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const { data: pass } = await supaAdmin
    .from("passes")
    .select("user_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (pass) {
    // Mark pass as expired immediately
    await supaAdmin
      .from("passes")
      .update({ expires_at: new Date().toISOString() })
      .eq("stripe_payment_intent_id", paymentIntentId);

    await updateStudentAccess(pass.user_id, "free", null);
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err && err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Idempotence — skip if already processed
  if (await alreadyProcessed(event.id)) {
    return res.status(200).json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        // These update subscription.status on Stripe's side, which fires
        // customer.subscription.updated — we process those instead. No-op here.
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      default:
        // Ignore unhandled event types but mark them processed to skip future retries
        break;
    }

    await markProcessed(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook] handler error for " + event.type + ":", err && err.message);
    // Don't mark as processed — let Stripe retry
    return res.status(500).json({ error: "Handler failed" });
  }
}
