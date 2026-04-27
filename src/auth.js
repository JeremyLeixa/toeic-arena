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
// IMPORTANT: les 3 clés profile/name/class doivent matcher celles utilisées par App.jsx save()
// et par le soft logout (App.jsx:13210). Avant le fix 2026-04-24, cette fonction effaçait
// 'toeic-arena-local' (inexistante) et oubliait profile+name, rendant le hard logout partiel.
export async function signOutCompletely() {
  try { await supabase.auth.signOut(); } catch (e) { console.warn("[auth] signOut caught:", e && e.message); }
  try {
    localStorage.removeItem('toeic-arena-profile');
    localStorage.removeItem('toeic-arena-name');
    localStorage.removeItem('toeic-arena-class');
    localStorage.removeItem('toeic-dash-group');
  } catch (e) { console.warn("[auth] localStorage purge caught:", e && e.message); }
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
// consent (optional): { cgvVersion, cgvAcceptedAt, retractationWaivedAt }
//   → envoyé en metadata Stripe puis persisté server-side par le webhook,
//   pour garantir que la trace légale atterrit sur la MÊME row students
//   que le access_level (évite les race conditions cross-row).
// Throws on error; on success, navigates the browser away.
export async function createCheckout(plan, consent) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Tu dois être connecté pour souscrire.');
  }
  const body = { plan };
  if (consent) {
    // Toutes les clés en snake_case pour que le webhook les écrive
    // directement en colonnes Supabase sans transformation.
    if (consent.cgvVersion) body.cgv_version = consent.cgvVersion;
    if (consent.cgvAcceptedAt) body.cgv_accepted_at = consent.cgvAcceptedAt;
    if (consent.retractationWaivedAt) body.retractation_waived_at = consent.retractationWaivedAt;
    // Clé naturelle students (name, class_code) : permet au webhook de cibler
    // la ROW intended par l'utilisateur plutôt que de matcher par auth.users.id
    // (qui peut pointer sur une row legacy — cas bug 2026-04-24 : webhook
    // updatait Teacher au lieu de Jaytest2 parce que les deux partageaient le
    // même auth session mais étaient des rows students distinctes).
    if (consent.studentName) body.student_name = consent.studentName;
    if (consent.studentClassCode) body.student_class_code = consent.studentClassCode;
  }
  const res = await fetch('/api/stripe-checkout-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
    },
    body: JSON.stringify(body),
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

// ─── PASSWORD AUTH (Phase 1 — refonte 2026-04-24) ───
// Ces helpers cohabitent avec les fonctions magic link ci-dessus pendant la
// transition. Ils seront le seul flow d'auth après suppression du magic link
// (Phase 4). Ne PAS supprimer les fonctions magic link tant que la migration
// (Phase 3) n'est pas terminée pour TOUS les profils existants.

// Crée un nouveau compte avec email + password. Utilisé à l'onboarding nouveau user.
// L'email doit être unique global (Supabase Auth refuse si déjà pris).
// metadata (optionnel) : { name, classCode } — stocké dans user_metadata, utile
// pour les triggers Supabase ou le debug. La row students est créée séparément
// par App.jsx save() avec la natural key.
export async function signUpWithPassword(email, password, metadata) {
  const e = normEmail(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error('Adresse email invalide');
  }
  if (!password || password.length < 8) {
    throw new Error('Mot de passe trop court (8 caractères minimum)');
  }
  const { data, error } = await supabase.auth.signUp({
    email: e,
    password: password,
    options: {
      data: metadata || {},
      // Pas de emailRedirectTo : on n'utilise PAS le flow de confirmation email
      // de Supabase. L'email est juste un garde-fou pour reset password (custom
      // flow via Edge Function). User est immédiatement loggé après signUp.
    },
  });
  if (error) throw error;
  return data;
}

// Connexion avec email + password. Utilisé au "Welcome back".
// Throws si credentials invalides.
export async function signInWithPassword(email, password) {
  const e = normEmail(email);
  if (!e) throw new Error('Email requis');
  if (!password) throw new Error('Mot de passe requis');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: e,
    password: password,
  });
  if (error) {
    // Mappe les codes Supabase en messages FR pour l'UI
    if (error.message && error.message.toLowerCase().includes('invalid')) {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw error;
  }
  return data;
}

// Change le password de l'auth user courant. Nécessite une session active.
// Utilisé : (1) au setup forcé Phase 3 quand password_set_at est NULL,
// (2) depuis Profile → "Changer mon mot de passe".
export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Mot de passe trop court (8 caractères minimum)');
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

// Demande un reset password : envoie un mail avec lien magique vers /?reset=<token>.
// Custom flow (Edge Function + Resend) — PAS le built-in Supabase
// (resetPasswordForEmail) car Jérémy veut un mail brandé TOEIC Arena.
// Toujours return success (même si email inexistant) pour éviter user
// enumeration — l'Edge Function décide silencieusement de envoyer ou pas.
export async function requestPasswordReset(email) {
  const e = normEmail(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error('Adresse email invalide');
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(supabaseUrl + '/functions/v1/password-reset-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + anonKey,
    },
    body: JSON.stringify({ email: e }),
  });
  if (!res.ok) {
    const data = await res.json().catch(function () { return {}; });
    throw new Error((data && (data.error || data.message)) || 'Impossible d\'envoyer le mail de réinitialisation.');
  }
  return true;
}

// Vérifie le token reçu par mail + applique le nouveau password.
// Backend (Edge Function) trouve le user par email associé au token, valide
// expires_at + used=false, puis update password via supabase.auth.admin.
export async function confirmPasswordReset(token, newPassword) {
  if (!token) throw new Error('Lien de réinitialisation invalide');
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Mot de passe trop court (8 caractères minimum)');
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(supabaseUrl + '/functions/v1/password-reset-confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + anonKey,
    },
    body: JSON.stringify({ token: token, new_password: newPassword }),
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || 'Lien invalide ou expiré.');
  }
  return data;
}

// Garantit qu'une session anonyme existe — création paresseuse, idempotente.
// REMPLACE les 6 appels directs à signInAnonymously() dispersés dans App.jsx
// (lignes 514, 1149, 11405, 11441 etc.) qui créaient à chaque fois un NEW
// auth user, polluant auth.users de centaines d'orphelins.
//
// Logique : si une session existe déjà (anon OU email-based), on la garde.
// Sinon seulement, on en crée une nouvelle anonyme. Pas de side-effect si
// déjà connecté.
//
// Cas d'usage : visitor mode, fallback save() si JWT expiré, init load().
export async function ensureAnonSession() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData && sessionData.session && sessionData.session.user) {
      return sessionData.session.user;
    }
  } catch (e) {
    console.warn('[auth] ensureAnonSession getSession caught:', e && e.message);
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[auth] ensureAnonSession signInAnonymously failed:', error.message);
    throw error;
  }
  return data.user;
}

// ─── STRIPE HELPERS (Phase 3 monétisation) ───

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
