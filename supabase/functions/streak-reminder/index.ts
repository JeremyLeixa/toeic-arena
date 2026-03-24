// ═══════════════════════════════════════════════════════════
// supabase/functions/streak-reminder/index.ts
// Runs daily at 20:00 CET via pg_cron
// Sends push to students who have a streak ≥ 2 and haven't
// been active today — "Your streak is in danger!"
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // Get all students with a streak ≥ 2 who haven't been active today
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, streak, last_active")
      .eq("class_code", "idrac2026")
      .gte("streak", 2)
      .neq("last_active", today);

    if (sErr) throw sErr;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "No at-risk streaks", count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get push subscriptions for those students
    const names = students.map((s: any) => s.name);
    const { data: subs, error: pErr } = await supabase
      .from("push_subscriptions")
      .select("student_name, subscription")
      .eq("class_code", "idrac2026")
      .in("student_name", names);

    if (pErr) throw pErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions for at-risk students", names }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build per-student messages
    const VERCEL_URL = Deno.env.get("VERCEL_APP_URL")!; // e.g. https://toeic-arena.vercel.app
    const PUSH_SECRET = Deno.env.get("PUSH_SECRET")!;

    // Group subscriptions by student for personalized messages
    const byStudent: Record<string, any[]> = {};
    for (const sub of subs) {
      if (!byStudent[sub.student_name]) byStudent[sub.student_name] = [];
      byStudent[sub.student_name].push(sub.subscription);
    }

    let totalSent = 0;
    for (const student of students) {
      const studentSubs = byStudent[student.name];
      if (!studentSubs) continue;

      const res = await fetch(`${VERCEL_URL}/api/push-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-push-secret": PUSH_SECRET,
        },
        body: JSON.stringify({
          subscriptions: studentSubs,
          title: "🔥 Streak en danger !",
          body: `Ta série de ${student.streak} jours est menacée ! Ouvre TOEIC Arena pour la sauver.`,
          tag: "streak-reminder",
          url: "/",
        }),
      });

      const result = await res.json();
      totalSent += result.sent || 0;
    }

    return new Response(JSON.stringify({ message: "Streak reminders sent", totalSent, atRisk: students.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
