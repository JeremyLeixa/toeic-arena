// ═══════════════════════════════════════════════════════════
// supabase/functions/inactive-reminder/index.ts
// Runs every 3 days at 17:00 CET via pg_cron
// Sends push to students inactive 7-30 days, excluding expired classes.
// Anti-spam: max 1 reminder per student per 14 days via inactivity_push_sent column.
// Rotating messages: 3 tiers x 3 variants = 9 templates, varied by name+date hash.
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Message templates: 3 tiers × 3 variants ──
const MESSAGES: Array<Array<(s: any) => { title: string; body: string }>> = [
  // Tier 0: 7-13 days (light, gentle nudge)
  [
    (s) => ({ title: "\u2694\uFE0F L'Ar\u00e8ne t'attend", body: `${s.name}, \u00e7a fait une semaine ! Tes comp\u00e9tences TOEIC rouillent...` }),
    (s) => ({ title: "\uD83C\uDFAF Reviens t'entra\u00eener", body: `Une semaine sans combat, ${s.name} ? Un Mock Test t'attend dans l'Ar\u00e8ne.` }),
    (s) => ({ title: "\uD83C\uDFF9 Tes classmates progressent", body: `Pendant que tu es absent, tes camarades grimpent la Ligue. Rattrape-les !` }),
  ],
  // Tier 1: 14-21 days (motivating, stakes rising)
  [
    (s) => ({ title: "\uD83D\uDD25 2 semaines sans pratique", body: `${s.name}, le TOEIC se pr\u00e9pare r\u00e9guli\u00e8rement. 15 minutes aujourd'hui ?` }),
    (s) => ({ title: "\uD83D\uDCAA Tu nous manques", body: `D\u00e9j\u00e0 2 semaines ! Tes ${s.xp || 0} XP attendent d'\u00eatre compl\u00e9t\u00e9s.` }),
    (s) => ({ title: "\uD83E\uDDD9 L'examen se rapproche", body: `${s.name}, chaque semaine d'absence, c'est du niveau qui baisse. Reviens !` }),
  ],
  // Tier 2: 22-30 days (firmer, last call)
  [
    (s) => ({ title: "\u26A0\uFE0F Derni\u00e8re chance", body: `${s.name}, \u00e7a fait 3 semaines. Ne laisse pas tomber ton score TOEIC !` }),
    (s) => ({ title: "\uD83D\uDC09 Le Boss ricane...", body: `Le Final Arena reste invaincu sans toi, ${s.name}. Rel\u00e8ve le d\u00e9fi !` }),
    (s) => ({ title: "\uD83D\uDCDC Ton aventure n'est pas finie", body: `${s.name}, 3 semaines d'absence. Un petit Drill pour te remettre ?` }),
  ],
];

serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Date boundaries ──
    const now = new Date();
    const cutoff7 = new Date(now); cutoff7.setDate(cutoff7.getDate() - 7);
    const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);
    const antiSpamCutoff = new Date(now); antiSpamCutoff.setDate(antiSpamCutoff.getDate() - 14);

    const cutoff7Str = cutoff7.toISOString().split("T")[0];
    const cutoff30Str = cutoff30.toISOString().split("T")[0];
    const antiSpamStr = antiSpamCutoff.toISOString();

    // ── 2. Fetch inactive students (7-30 days) not recently reminded ──
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, class_code, last_active, streak, xp, inactivity_push_sent")
      .neq("name", "Teacher")
      .gte("last_active", cutoff30Str)
      .lte("last_active", cutoff7Str)
      .or(`inactivity_push_sent.is.null,inactivity_push_sent.lt.${antiSpamStr}`);

    if (sErr) throw sErr;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "No inactive students to remind", count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 3. Filter out expired classes ──
    const classCodes = Array.from(new Set(students.map((s: any) => s.class_code).filter(Boolean)));
    const { data: groups, error: gErr } = await supabase
      .from("groups")
      .select("code, end_date")
      .in("code", classCodes);

    if (gErr) throw gErr;

    const groupMap: Record<string, string | null> = {};
    (groups || []).forEach((g: any) => { groupMap[g.code] = g.end_date; });

    const activeClasses = new Set<string>();
    for (const cc of classCodes) {
      // Class not in groups table → considered active (fallback)
      if (!(cc in groupMap)) { activeClasses.add(cc); continue; }
      const endDate = groupMap[cc];
      if (!endDate) { activeClasses.add(cc); continue; }
      const ed = new Date(endDate + "T23:59:59");
      if (ed >= now) activeClasses.add(cc);
    }

    const eligible = students.filter((s: any) => activeClasses.has(s.class_code));
    if (eligible.length === 0) {
      return new Response(JSON.stringify({ message: "All inactive students are in expired classes", excluded: students.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 4. Fetch push subscriptions (bulk) ──
    const names = eligible.map((s: any) => s.name);
    const { data: subs, error: pErr } = await supabase
      .from("push_subscriptions")
      .select("student_name, class_code, subscription")
      .in("student_name", names);

    if (pErr) throw pErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions for inactive students", eligibleCount: eligible.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 5. Group subscriptions by student_name|class_code ──
    const byKey: Record<string, any[]> = {};
    for (const sub of subs) {
      const key = sub.student_name + "|" + sub.class_code;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(sub.subscription);
    }

    // ── 6. Send personalized pushes ──
    const VERCEL_URL = Deno.env.get("VERCEL_APP_URL")!;
    const PUSH_SECRET = Deno.env.get("PUSH_SECRET")!;

    let totalSent = 0;
    const sentByTier = [0, 0, 0];
    const remindedNames: string[] = [];

    for (const s of eligible) {
      const key = s.name + "|" + s.class_code;
      const studentSubs = byKey[key];
      if (!studentSubs || studentSubs.length === 0) continue;

      const daysInactive = Math.floor((now.getTime() - new Date(s.last_active + "T00:00:00").getTime()) / 86400000);
      const tier = daysInactive <= 13 ? 0 : daysInactive <= 21 ? 1 : 2;
      const variantIdx = (s.name.length + now.getDate()) % 3;
      const msg = MESSAGES[tier][variantIdx](s);

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
            tag: "inactive-reminder",
            url: "/",
          }),
        });
        const result = await res.json();
        if (result.sent && result.sent > 0) {
          totalSent += result.sent;
          sentByTier[tier]++;
          remindedNames.push(s.name);
        }
      } catch (e) {
        console.error(`Push failed for ${s.name}:`, (e as Error).message);
      }
    }

    // ── 7. Mark reminded students (batch update by name + class_code) ──
    if (remindedNames.length > 0) {
      // Update one class_code at a time to avoid cross-class name collisions
      const byClass: Record<string, string[]> = {};
      for (const s of eligible) {
        if (remindedNames.indexOf(s.name) === -1) continue;
        if (!byClass[s.class_code]) byClass[s.class_code] = [];
        byClass[s.class_code].push(s.name);
      }
      const nowIso = now.toISOString();
      for (const cc of Object.keys(byClass)) {
        await supabase
          .from("students")
          .update({ inactivity_push_sent: nowIso })
          .eq("class_code", cc)
          .in("name", byClass[cc]);
      }
    }

    return new Response(JSON.stringify({
      message: "Inactive reminders sent",
      totalSent,
      eligibleCount: eligible.length,
      sentByTier: { tier1_7to13: sentByTier[0], tier2_14to21: sentByTier[1], tier3_22to30: sentByTier[2] },
      excludedExpired: students.length - eligible.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
