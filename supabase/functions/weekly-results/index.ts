// ═══════════════════════════════════════════════════════════
// supabase/functions/weekly-results/index.ts
// Runs every Monday at 08:00 CET via pg_cron
// Sends each student their weekly ranking + season position
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all students with their weekly XP (last week's data is in weekly_history)
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, weekly_xp, week_id, weekly_history")
      .eq("class_code", "idrac2026")
      .neq("name", "Teacher");

    if (sErr) throw sErr;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "No students found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Last week's data: the most recent entry in weekly_history
    // (since it's Monday morning, the weekly reset may or may not have happened yet)
    // We look at the last entry in weekly_history for each student
    const lastWeekRanking: { name: string; xp: number }[] = [];
    for (const s of students) {
      const hist = s.weekly_history || [];
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        lastWeekRanking.push({ name: s.name, xp: last.xp || 0 });
      }
    }

    // Sort by XP descending
    lastWeekRanking.sort((a, b) => b.xp - a.xp);

    // Get all push subscriptions
    const { data: subs, error: pErr } = await supabase
      .from("push_subscriptions")
      .select("student_name, subscription")
      .eq("class_code", "idrac2026");

    if (pErr) throw pErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Group subscriptions by student
    const byStudent: Record<string, any[]> = {};
    for (const sub of subs) {
      if (!byStudent[sub.student_name]) byStudent[sub.student_name] = [];
      byStudent[sub.student_name].push(sub.subscription);
    }

    const VERCEL_URL = Deno.env.get("VERCEL_APP_URL")!;
    const PUSH_SECRET = Deno.env.get("PUSH_SECRET")!;

    let totalSent = 0;
    const medals = ["🥇", "🥈", "🥉"];

    for (const student of lastWeekRanking) {
      const studentSubs = byStudent[student.name];
      if (!studentSubs) continue;

      const rank = lastWeekRanking.indexOf(student) + 1;
      const medal = rank <= 3 ? medals[rank - 1] + " " : "";
      const total = lastWeekRanking.length;

      let body: string;
      if (rank === 1) {
        body = `${medal}1er ! Tu as dominé la semaine avec ${student.xp} XP. Continue comme ça !`;
      } else if (rank <= 3) {
        body = `${medal}${rank}e place avec ${student.xp} XP ! Le podium, beau travail.`;
      } else if (rank <= 10) {
        body = `#${rank} sur ${total} avec ${student.xp} XP — Top 10 ! Objectif podium cette semaine ?`;
      } else {
        body = `#${rank} sur ${total} avec ${student.xp} XP. Chaque semaine compte pour le classement Overall !`;
      }

      const res = await fetch(`${VERCEL_URL}/api/push-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-push-secret": PUSH_SECRET,
        },
        body: JSON.stringify({
          subscriptions: studentSubs,
          title: "📊 Résultat de la semaine",
          body,
          tag: "weekly-results",
          url: "/",
        }),
      });

      const result = await res.json();
      totalSent += result.sent || 0;
    }

    return new Response(JSON.stringify({ message: "Weekly results sent", totalSent, ranked: lastWeekRanking.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
