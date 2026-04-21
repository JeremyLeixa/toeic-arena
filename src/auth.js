// ─────────────────────────────────────────────────────────────────────────────
// Supabase Auth helpers — Magic Link / Email confirmation flow
//
// Phase 1 (2026-04-20): Profile-first integration.
// These helpers let users upgrade an anonymous session to a permanent
// email-backed account without disturbing the legacy name+class_code flow.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js';

// Redirect URL Supabase uses when the user clicks the magic link.
// Falls back to empty string in SSR/edge contexts.
function getRedirectUrl() {
  try { return window.location.origin; } catch (e) { return ''; }
}

// Normalize email (trim + lowercase) to avoid dupes from "John@X.com" vs "john@x.com"
function normEmail(email) {
  return (email || '').trim().toLowerCase();
}

// ─── PUBLIC API ───

// Send a magic link to the provided email.
// Use case: full signup/login of a brand-new user (no prior session).
export async function requestMagicLink(email) {
  const e = normEmail(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error('Adresse email invalide');
  }
  const { data, error } = await supabase.auth.signInWithOtp({
    email: e,
    options: { emailRedirectTo: getRedirectUrl() }
  });
  if (error) throw error;
  return data;
}

// Upgrade the current anonymous auth user to a permanent email-backed user.
// Use case: user is already signed in anonymously and wants to "secure" their
// account by attaching an email. Supabase sends a confirmation email; when
// clicked, the same user_id is preserved — no data loss.
// Always passes emailRedirectTo to force the confirmation link to return to the
// app URL (not the Supabase Site URL default, which could point elsewhere).
export async function linkEmailToAnonymous(email) {
  const e = normEmail(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error('Adresse email invalide');
  }
  const { data, error } = await supabase.auth.updateUser(
    { email: e },
    { emailRedirectTo: getRedirectUrl() }
  );
  if (error) throw error;
  return data;
}

// Return the current Supabase auth user, or null if signed out.
// user.email is set once email has been confirmed by clicking the link.
export async function getAuthUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user || null;
  } catch (e) { return null; }
}

// Return the current Supabase session, or null.
export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session || null;
  } catch (e) { return null; }
}

// Sign the user out of Supabase and clear app-specific localStorage keys.
// Keeps user preferences (theme, skin) untouched.
export async function signOutCompletely() {
  try { await supabase.auth.signOut(); } catch (e) {}
  try {
    localStorage.removeItem('toeic-arena-class');
    localStorage.removeItem('toeic-arena-local');
    localStorage.removeItem('toeic-dash-group');
  } catch (e) {}
}

// Poll Supabase to detect when a pending email confirmation has completed.
// Use case: the user clicked the magic link in another browser (common on mobile where
// Gmail opens links in the system browser, not the PWA). The confirmation landed
// server-side but this browser's session doesn't know yet. Calling refreshSession()
// forces the JWT to be refetched, pulling the latest email_confirmed_at.
// Returns a cancel() function. onConfirmed(email) fires once, then polling stops.
export function pollEmailConfirmation(onConfirmed, opts) {
  opts = opts || {};
  const intervalMs = opts.intervalMs || 8000;
  const maxMs = opts.maxMs || 180000; // 3 min max
  let cancelled = false;
  const started = Date.now();
  let timer;
  async function tick() {
    if (cancelled) return;
    if (Date.now() - started > maxMs) return;
    try {
      const { data } = await supabase.auth.refreshSession();
      const user = data && data.user;
      if (user && user.email && user.email_confirmed_at) {
        cancelled = true;
        try { onConfirmed(user.email); } catch (e) {}
        return;
      }
    } catch (e) {}
    timer = setTimeout(tick, intervalMs);
  }
  timer = setTimeout(tick, intervalMs);
  return function cancel() {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

// Subscribe to auth state changes. Returns an unsubscribe function.
// Events: 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' |
//         'TOKEN_REFRESHED' | 'PASSWORD_RECOVERY'
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange(function (event, session) {
    try { cb(event, session); } catch (e) { console.warn('[auth] cb error:', e); }
  });
  return function () {
    try { data.subscription.unsubscribe(); } catch (e) {}
  };
}

// ─── STRIPE HELPERS (Phase 3) ───

// Create a Checkout Session via our serverless endpoint and redirect to Stripe.
// plan: "monthly" | "pass3m"
// Throws on error; on success, navigates the browser away.
export async function createCheckout(plan) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Tu dois être connecté pour souscrire.');
  }
  const res = await fetch('/api/stripe-checkout-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
    },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data && data.error === 'email_required') {
      throw new Error('email_required');
    }
    // Prefer detail (actual Stripe error) over generic error field
    throw new Error((data && (data.detail || data.message || data.error)) || 'Impossible de créer la session de paiement.');
  }
  if (!data.url) throw new Error('Réponse Stripe invalide.');
  window.location.href = data.url;
}

// Open the Stripe Customer Portal in a new tab (or same tab, defaults to same)
export async function openCustomerPortal() {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Tu dois être connecté pour gérer ton abonnement.');
  }
  const res = await fetch('/api/stripe-portal-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || 'Impossible d\'ouvrir le portail de gestion.');
  }
  if (!data.url) throw new Error('Réponse portail invalide.');
  window.location.href = data.url;
}
