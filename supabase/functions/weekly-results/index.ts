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

    // Get all students with their weekly XP (all groups)
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, class_code, weekly_xp, week_id, weekly_history")
      .neq("name", "Teacher");

    if (sErr) throw sErr;
    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: "No students found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Group students by class_code, build per-group rankings
    const byGroup: Record<string, { name: string; class_code: string; xp: number }[]> = {};
    for (const s of students) {
      const hist = s.weekly_history || [];
      if (hist.length === 0) continue;
      const last = hist[hist.length - 1];
      const cc = s.class_code || "visitor";
      if (!byGroup[cc]) byGroup[cc] = [];
      byGroup[cc].push({ name: s.name, class_code: cc, xp: last.xp || 0 });
    }
    // Sort each group by XP descending
    for (const cc of Object.keys(byGroup)) {
      byGroup[cc].sort((a, b) => b.xp - a.xp);
    }

    // Get all push subscriptions
    const { data: subs, error: pErr } = await supabase
      .from("push_subscriptions")
      .select("student_name, class_code, subscription");

    if (pErr) throw pErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Group subscriptions by student_name+class_code
    const byKey: Record<string, any[]> = {};
    for (const sub of subs) {
      const key = sub.student_name + "|" + sub.class_code;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(sub.subscription);
    }

    const VERCEL_URL = Deno.env.get("VERCEL_APP_URL")!;
    const PUSH_SECRET = Deno.env.get("PUSH_SECRET")!;

    let totalSent = 0;
    let totalRanked = 0;
    const medals = ["🥇", "🥈", "🥉"];

    for (const cc of Object.keys(byGroup)) {
      const ranking = byGroup[cc];
      totalRanked += ranking.length;

      for (const student of ranking) {
        const key = student.name + "|" + student.class_code;
        const studentSubs = byKey[key];
        if (!studentSubs) continue;

        const rank = ranking.indexOf(student) + 1;
        const medal = rank <= 3 ? medals[rank - 1] + " " : "";
        const total = ranking.length;

        let body: string;
        if (rank === 1) {
          body = `${medal}1st place! You dominated the week with ${student.xp} XP. Keep it up!`;
        } else if (rank <= 3) {
          body = `${medal}${rank}${rank===2?"nd":"rd"} place with ${student.xp} XP! Podium finish — well done.`;
        } else if (rank <= 10) {
          body = `#${rank} of ${total} with ${student.xp} XP — Top 10! Aim for the podium this week?`;
        } else {
          body = `#${rank} of ${total} with ${student.xp} XP. Every week counts toward the Overall ranking!`;
        }

        const res = await fetch(`${VERCEL_URL}/api/push-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-push-secret": PUSH_SECRET,
          },
          body: JSON.stringify({
            subscriptions: studentSubs,
            title: "📊 Weekly results",
            body,
            tag: "weekly-results",
            url: "/",
          }),
        });

        const result = await res.json();
        totalSent += result.sent || 0;
      }
    }

    return new Response(JSON.stringify({ message: "Weekly results sent", totalSent, ranked: totalRanked }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
