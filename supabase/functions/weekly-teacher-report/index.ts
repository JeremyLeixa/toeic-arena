// ═══════════════════════════════════════════════════════════
// supabase/functions/weekly-teacher-report/index.ts
//
// Rapport pédagogique hebdomadaire par cohorte, envoyé au formateur.
// Cron cible : lundi ~07h30 CET (avant le push élève de 08h).
//
// Pour chaque formateur (groups.teacher_email, opt-in), agrège l'état
// de SES cohortes et envoie UN mail avec, par cohorte :
//   1. 🔴 Ce qui coince   — 3 modules à plus faible précision (gate volume)
//   2. 💤 Ce qui dort      — 3 modules les moins adoptés (part d'élèves)
//   3. 🎯 3 activités à proposer — synthèse actionnable (double-signal priorisé)
//
// Les stats précision/adoption sont CUMULATIVES (état de la cohorte, pas
// un delta hebdo) — port serveur de getClassModuleData() (App.jsx:12207).
// Un en-tête best-effort ajoute l'activité de la dernière semaine connue
// depuis weekly_snapshots.
//
// ── MODE TEST (invocation manuelle) ──────────────────────────
//   supabase functions invoke weekly-teacher-report \
//     --body '{"test":true,"email":"leixa.formation@gmail.com","classCode":"idrac2026"}'
//   - "classCode" optionnel : si absent → plus grande cohorte ; "ALL" → tout agrégé.
//   - N'écrit rien, ne lit pas groups : envoie UN mail au "email" fourni.
//
// ── Env vars (Supabase Dashboard → Edge Functions → Secrets) ──
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto)
//   RESEND_API_KEY                           (déjà set pour password-reset)
//   RESEND_FROM                              (déjà set → domaine vérifié Resend)
//   APP_URL          (optionnel, default https://app.verse-arena.fr)
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Univers des modules pris en compte (labels FR-friendly pour le mail) ──
// Miroir de MISSION_MODULES + extras d'EXPORT_MODULES (App.jsx), MOINS :
//   - csess (Flashcards : précision non-métrique, cf. CLAUDE.md)
//   - daily / endless (wrapper & endgame : pas des leviers de séance)
const MODULES: { id: string; name: string }[] = [
  { id: "drill", name: "Part 5 Drill" },
  { id: "wordfam", name: "Word Families" },
  { id: "connsort", name: "Connectors" },
  { id: "prepdrill", name: "Prepositions" },
  { id: "gerinf", name: "Gerund / Infinitive" },
  { id: "falsefr", name: "False Friends" },
  { id: "p6", name: "Part 6" },
  { id: "p7", name: "Part 7 Reading" },
  { id: "traps", name: "TOEIC Traps" },
  { id: "stratquiz", name: "Strategy Quiz" },
  { id: "timesim", name: "Exam Simulation" },
  { id: "pvdojo", name: "Phrasal Verb Dojo" },
  { id: "lisP1", name: "Listening Part 1" },
  { id: "lisP2", name: "Listening Part 2" },
  { id: "lisP3", name: "Listening Part 3" },
  { id: "lisP4", name: "Listening Part 4" },
  { id: "sbuild", name: "Sentence Builder" },
  { id: "ablitz", name: "Audio Blitz" },
  { id: "clue", name: "Clue Hunter" },
  { id: "tavern", name: "Word Tavern" },
  { id: "bforge", name: "Linking Bridge" },
  { id: "gauntlet_irregular", name: "Gauntlet — Irregular Crypt" },
  { id: "gauntlet_tense", name: "Gauntlet — Chronomancer" },
  { id: "gauntlet_passive", name: "Gauntlet — Passive Forge" },
  { id: "gauntlet_relative", name: "Gauntlet — Relative Weaver" },
  { id: "modals_match", name: "Modal Council — Oracle" },
  { id: "modals_sort", name: "Modal Council — Verdict" },
];
const MODULE_NAME: Record<string, string> = {};
MODULES.forEach((m) => (MODULE_NAME[m.id] = m.name));

const ACCURACY_GATE = 30; // volume cohorte minimum pour classer un module "faible"

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Agrégation d'une cohorte (liste de students) ────────────────────────
type ModAgg = {
  id: string;
  name: string;
  totalCorrect: number;
  totalQ: number;
  studentCount: number;
  acc: number | null; // % 0-100, null si volume < gate
  adoptionPct: number; // % d'élèves de la cohorte ayant touché le module
};

function aggregateCohort(students: any[]) {
  const cohortSize = students.length;
  const agg: Record<string, ModAgg> = {};
  MODULES.forEach((m) => {
    agg[m.id] = {
      id: m.id, name: m.name, totalCorrect: 0, totalQ: 0,
      studentCount: 0, acc: null, adoptionPct: 0,
    };
  });

  students.forEach((s) => {
    const ms = s.module_scores || s.moduleScores || {};
    MODULES.forEach((m) => {
      const d = ms[m.id];
      if (d && d.total > 0) {
        agg[m.id].totalCorrect += d.correct || 0;
        agg[m.id].totalQ += d.total;
        agg[m.id].studentCount += 1;
      }
    });
  });

  const rows = MODULES.map((m) => {
    const a = agg[m.id];
    a.acc = a.totalQ >= ACCURACY_GATE ? Math.round((a.totalCorrect / a.totalQ) * 100) : null;
    a.adoptionPct = cohortSize > 0 ? Math.round((a.studentCount / cohortSize) * 100) : 0;
    return a;
  });

  const totalQAll = rows.reduce((s, r) => s + r.totalQ, 0);

  // Ce qui coince : précision la plus basse, gate volume
  const weak = rows
    .filter((r) => r.acc !== null)
    .sort((a, b) => (a.acc as number) - (b.acc as number))
    .slice(0, 3);

  // Ce qui dort : le moins d'élèves ont touché le module (tie-break: nom)
  const low = rows
    .slice()
    .sort((a, b) => a.studentCount - b.studentCount || a.name.localeCompare(b.name))
    .slice(0, 3);

  // 3 activités à proposer : BLEND explicite des deux signaux —
  // 2 modules les plus faibles + 1 le moins adopté (dé-dupliqué). Backfill si
  // l'un des deux viviers manque, pour toujours viser 3 activités.
  const weakIds = new Set(weak.map((r) => r.id));
  const lowIds = new Set(low.map((r) => r.id));
  const recoOrder: ModAgg[] = [];
  const seen = new Set<string>();
  const push = (r: ModAgg) => { if (r && !seen.has(r.id)) { seen.add(r.id); recoOrder.push(r); } };
  weak.slice(0, 2).forEach(push);              // 2 faibles
  const firstLow = low.find((r) => !seen.has(r.id));
  if (firstLow) push(firstLow);                // 1 peu adoptée (hors doublon)
  weak.forEach(push);                          // backfill faibles restants
  low.forEach(push);                           // backfill adoption restante
  const reco = recoOrder.slice(0, 3).map((r) => {
    const isWeak = weakIds.has(r.id) && r.acc !== null;
    const isLow = lowIds.has(r.id);
    let why: string;
    if (isWeak && isLow) why = `faible précision (${r.acc}%) ET peu travaillée (${r.adoptionPct}% de la classe)`;
    else if (isWeak) why = `précision cohorte à ${r.acc}% — à consolider en séance`;
    else why = `seulement ${r.adoptionPct}% de la classe l'a essayée — à lancer`;
    return { name: r.name, why };
  });

  return { cohortSize, rows, totalQAll, weak, low, reco };
}

// ── En-tête activité hebdo (best-effort, weekly_snapshots) ──────────────
async function weeklyHeader(supabase: any, classCode: string) {
  try {
    const { data, error } = await supabase
      .from("weekly_snapshots")
      .select("student_name, week_start, xp_this_week")
      .eq("class_code", classCode)
      .order("week_start", { ascending: false })
      .limit(400);
    if (error || !data || data.length === 0) return null;
    const topWeek = data[0].week_start;
    const rows = data.filter((r: any) => r.week_start === topWeek);
    const active = rows.filter((r: any) => (r.xp_this_week || 0) > 0).length;
    const xp = rows.reduce((s: number, r: any) => s + (r.xp_this_week || 0), 0);
    return { weekStart: topWeek, active, xp };
  } catch (e) {
    console.warn("[weekly-teacher-report] weeklyHeader caught:", (e as Error).message);
    return null;
  }
}

// ── Rendu HTML d'un bloc cohorte ────────────────────────────────────────
function renderCohortBlock(
  title: string,
  agg: ReturnType<typeof aggregateCohort>,
  header: { weekStart: string; active: number; xp: number } | null,
): string {
  const gold = "#f0c850";
  const bg2 = "#1a1610";
  const bg3 = "#28221a";
  const txt = "#ede4d4";
  const mut = "#8a7e6a";

  const li = (name: string, right: string) =>
    `<tr>
      <td style="padding:7px 0;color:${txt};font-size:13px;border-bottom:1px solid rgba(180,140,80,0.08);">${escapeHtml(name)}</td>
      <td style="padding:7px 0;color:${mut};font-size:13px;text-align:right;border-bottom:1px solid rgba(180,140,80,0.08);white-space:nowrap;">${right}</td>
    </tr>`;

  const weakRows = agg.weak.length
    ? agg.weak.map((r) => li(r.name, `<b style="color:#e07272;">${r.acc}%</b> · ${r.totalQ} Q`)).join("")
    : `<tr><td colspan="2" style="padding:7px 0;color:${mut};font-size:13px;">Pas assez de volume pour classer (min ${ACCURACY_GATE} questions/module).</td></tr>`;

  const lowRows = agg.low
    .map((r) => li(r.name, `<b style="color:${gold};">${r.adoptionPct}%</b> de la classe`))
    .join("");

  const recoRows = agg.reco.length
    ? agg.reco.map((r, i) =>
        `<div style="padding:10px 12px;background:${bg3};border-radius:8px;margin-bottom:8px;">
          <span style="color:${gold};font-weight:700;font-size:13px;">${i + 1}. ${escapeHtml(r.name)}</span>
          <div style="color:${mut};font-size:12px;margin-top:2px;">${escapeHtml(r.why)}</div>
        </div>`).join("")
    : `<div style="color:${mut};font-size:13px;">Cohorte sans activité suffisante pour recommander.</div>`;

  // Ligne hebdo : masquée si aucune donnée OU semaine vide (cohorte clôturée /
  // inactive) — évite le « 0 élève actif · 0 XP » qui fait "mort" à l'écran.
  const headerLine = (header && (header.active > 0 || header.xp > 0))
    ? `<div style="color:${mut};font-size:12px;margin:2px 0 14px;">Semaine du ${escapeHtml(header.weekStart)} · <b style="color:${txt};">${header.active}</b> élève(s) actif(s) · <b style="color:${txt};">${header.xp}</b> XP cette semaine</div>`
    : `<div style="margin:2px 0 14px;"></div>`;

  const sectionTitle = (emoji: string, label: string) =>
    `<div style="color:${txt};font-size:14px;font-weight:700;margin:18px 0 6px;">${emoji} ${label}</div>`;

  return `
  <div style="background:${bg2};border-radius:14px;border:1px solid rgba(180,140,80,0.15);padding:20px;margin-bottom:22px;">
    <h2 style="color:${gold};font-size:17px;font-weight:800;margin:0;">${escapeHtml(title)}</h2>
    ${headerLine}
    ${sectionTitle("🔴", "Ce qui coince (précision cohorte)")}
    <table style="width:100%;border-collapse:collapse;">${weakRows}</table>
    ${sectionTitle("💤", "Ce qui dort (adoption)")}
    <table style="width:100%;border-collapse:collapse;">${lowRows}</table>
    ${sectionTitle("🎯", "3 activités à proposer cette semaine")}
    ${recoRows}
  </div>`;
}

function renderEmail(teacherLabel: string, blocks: string, appUrl: string): string {
  const gold = "#f0c850";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f0c08;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:24px auto;padding:24px 18px;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:40px;line-height:1;">📊</div>
      <h1 style="font-family:'Cinzel',serif;color:${gold};font-weight:800;font-size:22px;margin:10px 0 2px;letter-spacing:1px;">VERSE ARENA</h1>
      <div style="color:#8a7e6a;font-size:13px;">Rapport pédagogique hebdomadaire${teacherLabel ? " · " + escapeHtml(teacherLabel) : ""}</div>
    </div>
    ${blocks}
    <div style="text-align:center;margin:8px 0 4px;">
      <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:11px 22px;background:linear-gradient(135deg,#f0c850,#d4943a);color:#1a1610;text-decoration:none;font-weight:700;border-radius:9px;font-size:13px;">Ouvrir le tableau de bord</a>
    </div>
    <p style="color:#5a5040;font-size:11px;line-height:1.5;text-align:center;margin:16px 0 0;">
      Précision & adoption = état cumulé de la cohorte. Généré automatiquement — réponds à ce mail pour te désabonner.
    </p>
  </div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string, apiKey: string, from: string, replyTo: string) {
  const payload: Record<string, unknown> = { from, to: [to], subject, html };
  // no-reply@verse-arena.fr n'a pas de mailbox → on route les réponses (ex.
  // "réponds pour te désabonner") vers une adresse relevée.
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") || "Verse Arena <onboarding@resend.dev>";
    const replyTo = Deno.env.get("REPORT_REPLY_TO") || "leixa.formation@gmail.com";
    const appUrl = Deno.env.get("APP_URL") || "https://app.verse-arena.fr";
    if (!apiKey) throw new Error("RESEND_API_KEY non configuré");

    // Parse body (optionnel — cron n'en envoie pas)
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const isTest = !!(body && body.test);

    // Tous les students (hors Teacher), avec leurs scores modules
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("name, class_code, module_scores")
      .neq("name", "Teacher");
    if (sErr) throw sErr;
    const all = students || [];

    // Regroupe par class_code
    const byCohort: Record<string, any[]> = {};
    for (const s of all) {
      const cc = s.class_code || "visitor";
      (byCohort[cc] = byCohort[cc] || []).push(s);
    }

    // ── MODE TEST : un seul mail au destinataire fourni ──────────────
    if (isTest) {
      const to = String(body.email || "").trim();
      if (!to) throw new Error("Mode test : champ 'email' requis");
      let cc = String(body.classCode || "").trim();
      let cohortStudents: any[];
      let title: string;

      if (cc === "ALL") {
        cohortStudents = all;
        title = "Toutes cohortes (agrégé)";
        cc = "";
      } else {
        if (!cc) {
          // plus grande cohorte
          cc = Object.keys(byCohort).sort((a, b) => byCohort[b].length - byCohort[a].length)[0] || "";
        }
        cohortStudents = byCohort[cc] || [];
        title = cc || "(cohorte inconnue)";
      }
      if (cohortStudents.length === 0) throw new Error(`Mode test : aucune donnée pour classCode='${cc || "ALL"}'`);

      const agg = aggregateCohort(cohortStudents);
      const header = cc ? await weeklyHeader(supabase, cc) : null;
      const block = renderCohortBlock(title, agg, header);
      const html = renderEmail("TEST", block, appUrl);
      await sendEmail(to, `📊 [TEST] Rapport cohorte ${title} — Verse Arena`, html, apiKey, from, replyTo);
      console.log(`[weekly-teacher-report] TEST sent to ${to} for '${title}' (${cohortStudents.length} students)`);
      return new Response(JSON.stringify({ ok: true, mode: "test", to, cohort: title, students: cohortStudents.length }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── MODE CRON : un mail par formateur opt-in ─────────────────────
    const { data: groups, error: gErr } = await supabase
      .from("groups")
      .select("code, name, teacher_email, weekly_report_optin")
      .neq("code", "teacher-internal")
      .not("teacher_email", "is", null);
    if (gErr) throw gErr;

    // teacher_email → [{code,name}]
    const byTeacher: Record<string, { code: string; name: string }[]> = {};
    for (const g of groups || []) {
      if (g.weekly_report_optin === false) continue;
      const email = String(g.teacher_email || "").trim().toLowerCase();
      if (!email) continue;
      (byTeacher[email] = byTeacher[email] || []).push({ code: g.code, name: g.name || g.code });
    }

    let sent = 0;
    const skipped: string[] = [];
    for (const email of Object.keys(byTeacher)) {
      const cohorts = byTeacher[email];
      const blocks: string[] = [];
      for (const c of cohorts) {
        const cohortStudents = byCohort[c.code] || [];
        if (cohortStudents.length === 0) continue;
        const agg = aggregateCohort(cohortStudents);
        if (agg.totalQAll === 0) continue; // cohorte sans activité → on n'envoie rien pour elle
        const header = await weeklyHeader(supabase, c.code);
        blocks.push(renderCohortBlock(c.name, agg, header));
      }
      if (blocks.length === 0) { skipped.push(email); continue; }
      const html = renderEmail("", blocks.join(""), appUrl);
      try {
        await sendEmail(email, "📊 Rapport hebdo de tes cohortes — Verse Arena", html, apiKey, from, replyTo);
        sent += 1;
        console.log(`[weekly-teacher-report] sent to ${email} (${blocks.length} cohort blocks)`);
      } catch (e) {
        console.error(`[weekly-teacher-report] send failed for ${email}:`, (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ ok: true, mode: "cron", sent, skipped }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[weekly-teacher-report] error:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
