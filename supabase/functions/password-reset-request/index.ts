// ═══════════════════════════════════════════════════════════
// supabase/functions/password-reset-request/index.ts
//
// Reçoit { email } depuis le client. Si un profil students existe
// avec cet email :
//   1. Génère un token aléatoire (32 bytes hex)
//   2. INSERT dans password_reset_tokens (expires_at = now + 1h)
//   3. Envoie un mail brandé Verse Arena via Resend avec lien
//      https://<APP_URL>/?reset=<token>
//
// Toujours retourne 200 + { ok: true } — JAMAIS d'info sur l'existence
// de l'email (anti user-enumeration).
//
// Env vars requises (Supabase Dashboard → Edge Functions → Secrets) :
//   - SUPABASE_URL                (auto)
//   - SUPABASE_SERVICE_ROLE_KEY   (auto)
//   - RESEND_API_KEY              (à set : re_xxxxxxxxxxxx)
//   - APP_URL                     (à set : https://app.verse-arena.fr)
//   - RESEND_FROM                 (optionnel, default "Verse Arena <onboarding@resend.dev>")
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function randomToken(): string {
  // 32 bytes = 64 hex chars — assez d'entropie pour un reset token court-vie
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendResetEmail(email: string, resetUrl: string, apiKey: string, fromAddr: string): Promise<void> {
  const safeUrl = escapeHtml(resetUrl);
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f0c08;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;padding:32px 24px;background:#1a1610;border-radius:16px;border:1px solid rgba(180,140,80,0.15);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;line-height:1;">🏰</div>
      <h1 style="font-family:'Cinzel',serif;color:#f0c850;font-weight:800;font-size:24px;margin:12px 0 4px;letter-spacing:1px;">VERSE ARENA</h1>
    </div>
    <h2 style="color:#ede4d4;font-size:18px;font-weight:700;margin:0 0 12px;">Réinitialisation du mot de passe</h2>
    <p style="color:#8a7e6a;font-size:14px;line-height:1.6;margin:0 0 20px;">Tu as demandé à réinitialiser ton mot de passe Verse Arena. Clique sur le bouton ci-dessous (lien valide 1 heure).</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f0c850,#d4943a);color:#1a1610;text-decoration:none;font-weight:700;border-radius:10px;font-size:14px;">Choisir un nouveau mot de passe</a>
    </div>
    <p style="color:#5a5040;font-size:12px;line-height:1.5;margin:0 0 8px;">Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :</p>
    <p style="color:#8a7e6a;font-size:11px;word-break:break-all;margin:0 0 24px;background:#28221a;padding:10px;border-radius:6px;">${safeUrl}</p>
    <hr style="border:none;border-top:1px solid rgba(180,140,80,0.1);margin:24px 0;"/>
    <p style="color:#5a5040;font-size:11px;line-height:1.5;margin:0;">Tu n'as pas demandé ce mail ? Ignore-le — ton mot de passe ne sera pas modifié. Le lien expirera automatiquement.</p>
  </div>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [email],
      subject: "Réinitialisation de ton mot de passe Verse Arena",
      html: html,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${errBody}`);
  }
}

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
    const rawEmail: string = (body && body.email) || "";
    const email = rawEmail.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cherche un profil students avec cet email. Insensible à la casse.
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("name, class_code, email")
      .ilike("email", email)
      .maybeSingle();

    if (sErr) {
      console.warn("[password-reset-request] students lookup error:", sErr.message);
      // On retourne quand même success pour éviter user enumeration
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!student) {
      console.log("[password-reset-request] no student for email (silent)");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Génère token + INSERT
    const token = randomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h

    const { error: insErr } = await supabase
      .from("password_reset_tokens")
      .insert({ token, email: student.email.toLowerCase(), expires_at: expiresAt });

    if (insErr) {
      console.error("[password-reset-request] token insert error:", insErr.message);
      throw new Error("Impossible de créer le token");
    }

    // Send mail via Resend
    const appUrl = Deno.env.get("APP_URL") || "https://app.verse-arena.fr";
    const resetUrl = `${appUrl}/?reset=${encodeURIComponent(token)}`;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddr = Deno.env.get("RESEND_FROM") || "Verse Arena <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("[password-reset-request] RESEND_API_KEY not set");
      throw new Error("Service mail non configuré");
    }

    await sendResetEmail(student.email, resetUrl, resendKey, fromAddr);

    console.log(`[password-reset-request] sent reset mail to ${student.email} for ${student.name}/${student.class_code}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[password-reset-request] error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
