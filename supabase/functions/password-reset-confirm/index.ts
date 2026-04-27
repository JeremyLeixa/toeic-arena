// ═══════════════════════════════════════════════════════════
// supabase/functions/password-reset-confirm/index.ts
//
// Reçoit { token, new_password } depuis la page /?reset=<token>.
// 1. Vérifie le token : existe + expires_at > now() + used = false
// 2. Trouve l'auth user via email associé au token
// 3. Update password via supabase.auth.admin.updateUserById
// 4. Mark token used = true (one-shot)
// 5. Update students.password_set_at = now()
//
// Env vars : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const token: string = (body && body.token) || "";
    const newPassword: string = (body && body.new_password) || "";

    if (!token || token.length < 32) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({ error: "Mot de passe trop court (8 caractères minimum)" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Lookup token
    const { data: tok, error: tErr } = await supabase
      .from("password_reset_tokens")
      .select("token, email, expires_at, used")
      .eq("token", token)
      .maybeSingle();

    if (tErr) {
      console.error("[password-reset-confirm] token lookup error:", tErr.message);
      throw new Error("Erreur serveur");
    }

    if (!tok) {
      return new Response(JSON.stringify({ error: "Lien invalide ou déjà utilisé" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (tok.used) {
      return new Response(JSON.stringify({ error: "Lien déjà utilisé. Demande un nouveau mail." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (new Date(tok.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Lien expiré. Demande un nouveau mail." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 2. Trouve l'auth user par email — utilise admin.listUsers avec filter
    // Note: admin.listUsers() peut être paginé. Pour 200+ users on filtrera par email
    // côté client SDK via le 2nd argument (filter object). Si > 1000 users, paginer.
    const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (uErr) {
      console.error("[password-reset-confirm] listUsers error:", uErr.message);
      throw new Error("Erreur serveur");
    }
    const targetEmail = tok.email.toLowerCase();
    const authUser = usersData.users.find((u: any) => (u.email || "").toLowerCase() === targetEmail);

    if (!authUser) {
      console.warn(`[password-reset-confirm] no auth user for email ${targetEmail}`);
      return new Response(JSON.stringify({ error: "Compte introuvable. Contacte ton enseignant." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 3. Update password via admin
    const { error: pErr } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });
    if (pErr) {
      console.error("[password-reset-confirm] updateUserById error:", pErr.message);
      throw new Error("Impossible de mettre à jour le mot de passe");
    }

    // 4. Mark token used
    const { error: mErr } = await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token);
    if (mErr) {
      console.warn("[password-reset-confirm] mark used failed (non-fatal):", mErr.message);
    }

    // 5. Update students.password_set_at
    const { error: sErr } = await supabase
      .from("students")
      .update({ password_set_at: new Date().toISOString() })
      .ilike("email", targetEmail);
    if (sErr) {
      console.warn("[password-reset-confirm] password_set_at update failed (non-fatal):", sErr.message);
    }

    console.log(`[password-reset-confirm] password reset OK for ${targetEmail}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[password-reset-confirm] error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
