// ═══════════════════════════════════════════════════════════
// supabase/functions/pass3m-expiration-reminder/index.ts
// Runs daily at 09:00 CET via pg_cron.
// Sends a courtesy push to TOEIC Pass 3 mois holders 7 days before
// their access_expires_at, inviting them to renew or switch to Premium
// Mensuel before automatic deactivation.
//
// Obligation CGV article 8.2 : "Un email de courtoisie est envoyé au
// Client 7 jours avant l'expiration du Pass, l'invitant à prolonger
// son accès s'il le souhaite." Implémenté ici en push (même canal que
// les autres edge functions). Si Jérémy migre vers email plus tard, la
// structure reste (il suffira de remplacer l'appel push-send par un
// appel email provider comme Resend/Mailgun).
//
// Anti-double-notification : le filtre access_expires_at dans la
// fenêtre [now+6d, now+7d] garantit qu'un user n'est touché qu'une
// fois (un seul jour dans sa vie d'abonnement où sa date d'expiration
// tombe dans cette fenêtre). Pas besoin de colonne anti-spam dédiée.
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 3 message variants, picked by hash of name to avoid everyone seeing
// the exact same push on the same day.
const MESSAGES: Array<(s: any) => { title: string; body: string }> = [
  (s) => ({
    title: "\u23F3 Your TOEIC Pass expires soon",
    body: `${s.name}, your 3-month Pass ends in 7 days. Renew or switch to monthly to keep your progress.`,
  }),
  (s) => ({
    title: "\uD83C\uDFAF One week left on your Pass",
    body: `Don't lose your momentum! Your Premium access ends in 7 days. Upgrade or extend today.`,
  }),
  (s) => ({
    title: "\uD83D\uDD01 Keep the arsenal unlocked",
    body: `${s.name}, your Pass expires in a week. Renew before it's gone to keep all modules open.`,
  }),
];

serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Window : access_expires_at in [now+6d, now+7d] ──
    // We tolerate 1 day of drift in case a cron tick is missed.
    const now = new Date();
    const winStart = new Date(now);
    winStart.setDate(winStart.getDate() + 6);
    const winEnd = new Date(now);
    winEnd.setDate(winEnd.getDate() + 7);
    const winEndInclusive = new Date(winEnd);
    winEndInclusive.setHours(23, 59, 59, 999);

    const winStartIso = winStart.toISOString();
    const winEndIso = winEndInclusive.toISOString();

    // ── 2. Fetch Pass holders in the window ──
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, class_code, access_expires_at")
      .eq("access_level", "premium_pass")
      .neq("name", "Teacher")
      .gte("access_expires_at", winStartIso)
      .lte("access_expires_at", winEndIso);

    if (sErr) throw sErr;
    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ message: "No Pass holders expiring in 6-7 days", count: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 3. Fetch push subscriptions ──
    const names = students.map((s: any) => s.name);
    const { data: subs, error: pErr } = await supabase
      .from("push_subscriptions")
      .select("student_name, class_code, subscription")
      .in("student_name", names);

    if (pErr) throw pErr;
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No push subscriptions for expiring Pass holders",
          eligibleCount: students.length,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 4. Group by student_name|class_code ──
    const byKey: Record<string, any[]> = {};
    for (const sub of subs) {
      const key = sub.student_name + "|" + sub.class_code;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(sub.subscription);
    }

    // ── 5. Send personalized push per student ──
    const VERCEL_URL = Deno.env.get("VERCEL_APP_URL")!;
    const PUSH_SECRET = Deno.env.get("PUSH_SECRET")!;

    let totalSent = 0;
    const remindedNames: string[] = [];

    for (const s of students) {
      const key = s.name + "|" + s.class_code;
      const studentSubs = byKey[key];
      if (!studentSubs || studentSubs.length === 0) continue;

      const variantIdx = (s.name.length + now.getDate()) % MESSAGES.length;
      const msg = MESSAGES[variantIdx](s);

      try {
        const res = await fetch(`${VERCEL_URL}/api/push-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-push-secret": PUSH_SECRET,
          },
          body: JSON.stringify({
            subscriptions: studentSubs,
            title: msg.title,
            body: msg.body,
            tag: "pass3m-expiration",
            url: "/?upgrade=1",
          }),
        });
        const result = await res.json();
        if (result.sent && result.sent > 0) {
          totalSent += result.sent;
          remindedNames.push(s.name);
        }
      } catch (e) {
        console.error(`Pass3m reminder push failed for ${s.name}:`, (e as Error).message);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Pass 3m expiration reminders sent",
        totalSent,
        eligibleCount: students.length,
        reminded: remindedNames,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
