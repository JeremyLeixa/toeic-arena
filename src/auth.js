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
export async function linkEmailToAnonymous(email) {
  const e = normEmail(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error('Adresse email invalide');
  }
  const { data, error } = await supabase.auth.updateUser({ email: e });
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
