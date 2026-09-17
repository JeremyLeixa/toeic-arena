// Proto « mémoire du Mentor » — les 8 moments d'une journée, avec les vrais composants et le CSS de
// l'appli (SessionResult, MentorMap, MentorSheet, Tabs, portes XP). Textes : voice.js ; chiffres :
// model.js sur les élèves simulés de personas.js. Rien ici n'est écrit à la main pour un élève.
import { useEffect, useMemo, useRef, useState } from "react";
import { GIcon, LeagueIcon } from "../../src/components/icons.jsx";
import { Bar } from "../../src/components/Bar.jsx";
import { renderAv } from "../../src/components/avatar.jsx";
import { SessionResult } from "../../src/components/SessionResult.jsx";
import { createChestFx, burstAt } from "../../src/components/particles.js";
import { MentorSheet } from "../../src/features/mentor/Mentor.jsx";
import { MentorMapV2 } from "./mentorHub.jsx";
import { getLevel } from "../../src/data/helpers.js";
import { getEffectiveLeague, getLeague } from "../../src/lib/league.js";
import { getTriggerLabel } from "../../src/lib/chestLabels.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { tone } from "../../src/lib/tone.js";
import * as V from "./voice.js";
import { NOW, fmtDay, MODULE_NAME, TIERS, TURN, catSeries } from "./model.js";

var noop = function () {};
var CHEST_TIER = { novice: 0, guerrier: 1, champion: 2, legendaire: 3 };

// ═══ 1. Lettre du lundi (push + parchemin) ═══
export function LetterMoment(p) {
  var L = V.letter(p.x);
  return (
    <div className="sr-root">
      <div className="sr-page">
        <div className="mm-push">
          <span className="mm-push-ic"><GIcon name="wizard-staff" size={22} color="var(--on-cx)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mm-push-app"><span>Verse Arena</span><span>08:30</span></div>
            <div className="mm-push-t out">{L.push.title}</div>
            <div className="mm-push-b">{L.push.body}</div>
          </div>
        </div>
        <div className="sr-scroll">
          <div className="sr-roll" />
          <div className="sr-parch mm-letter">
            <div className="sr-sigil"><GIcon name="wizard-staff" size={30} color={/*fond local*/"#6b3410"} /></div>
            <div className="sr-chron out">{"Aldric's Monday letter"}</div>
            <div className="sr-date">{L.date}</div>
            {L.paragraphs.map(function (t, i) { return <p key={i} className="mm-lp" style={{ animationDelay: (0.6 + i * 0.4) + "s" }}>{t}</p>; })}
            <div className="mm-sign" style={{ animationDelay: (0.6 + L.paragraphs.length * 0.4) + "s" }}>{"Aldric"}</div>
          </div>
          <div className="sr-roll" />
        </div>
      </div>
      <div className="sr-cta"><button className="btn2 out">Later</button><button className="btn1 out">{"See today's plan"}</button></div>
    </div>
  );
}

// ═══ 2. Home : une seule ligne change (le plan vit dans le Mentor, décision du 2026-09-17) ═══
export function HomeMoment(p) {
  var x = p.x, u = x.before, lv = getLevel(u.xp), lg = getEffectiveLeague(u.weeklyXp, u.moduleScores);
  var g = V.greeting(x);
  return (
    <div className="enter" style={{ padding: "20px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p className="mm-greet">{g.text}</p>
          <h1 className="out" style={{ fontWeight: 800, fontSize: 24, display: "flex", alignItems: "center", gap: 8 }}>{u.name} {renderAv(u.avatar, 28, u.equippedFrame)}</h1>
        </div>
        <div style={{ textAlign: "center" }}>
          <span className="fl" style={{ fontSize: 28, display: "inline-flex" }}><GIcon name="flame" size={28} color="var(--orange)" /></span>
          <div className="out" style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)" }}>{u.streak}</div>
        </div>
      </div>

      <div className="crd glo" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--cx-hex),var(--cx-dark))", color: "var(--on-cx)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }} className="out">{lv.level}</div>
            <div><div className="out" style={{ fontSize: 13, fontWeight: 700 }}>Level {lv.level}</div><div style={{ fontSize: 11, color: "var(--t2)" }}>{lv.cur} / {lv.next} XP</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "var(--bg3)", borderRadius: 99 }}>
            <LeagueIcon lg={lg} size={16} style={{ marginRight: 4, verticalAlign: "-2px" }} /><span className="out" style={{ fontSize: 12, fontWeight: 600, color: tone(lg.color) }}>{lg.name}</span>
          </div>
        </div>
        <Bar value={lv.cur} max={lv.next} h={6} />
      </div>

      <div className="crd" style={{ marginBottom: 16, padding: "14px 16px", background: "linear-gradient(135deg,rgba(var(--cx),.12),rgba(27,112,207,.12))", border: "1px solid rgba(var(--cx),.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GIcon name="lightning-bow" size={22} color="var(--cyan)" />
          <div style={{ flex: 1 }}>
            <div className="out" style={{ fontWeight: 800, fontSize: 15, color: "var(--t1)" }}>Daily Challenge</div>
            <div style={{ fontSize: 12, color: "var(--t2)" }}>5 grammar questions · 30s each</div>
          </div>
          <span style={{ fontSize: 18, color: "var(--cyan)" }}>{"›"}</span>
        </div>
      </div>
      <h2 className="out" style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "var(--t2)" }}>Quick Start</h2>
    </div>
  );
}

// ═══ 2 bis. Le Mentor : cinq repères sur la carte ═══
function MentorScreen(p) {
  var x = p.x, badges = V.mapBadges(x);
  return (
    <>
      <div className="enter" style={{ padding: "20px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <GIcon name="wizard-staff" size={28} color="var(--cyan)" /><h1 className="out" style={{ fontWeight: 900, fontSize: 24 }}>Mentor</h1>
        </div>
        <p style={{ color: "var(--t2)", fontSize: 12, marginBottom: 14, lineHeight: 1.5, fontStyle: "italic" }}>Tap a sigil on the map to act on it.</p>
        <MentorMapV2 badges={badges} onHotspotTap={noop} onAldricTap={noop} />
      </div>
      {p.children}
    </>
  );
}
export function MentorMoment(p) { return <MentorScreen x={p.x} />; }

// ═══ 3. Le plan du jour : la feuille « Today's Path » ═══
export function PlanMoment(p) {
  var x = p.x;
  var [open, setOpen] = useState(false);
  return (
    <MentorScreen x={x}>
      <MentorSheet open={true} onClose={noop} title="Today's Path">
        <p style={{ color: "var(--t2)", fontSize: 12, margin: "0 2px 12px", lineHeight: 1.5, fontStyle: "italic" }}>{"Aldric's plan for Monday. The first one is today's mission."}</p>
        {x.plan.quests.map(function (q, i) {
          var v = V.questView(q, x, i);
          return (
            <button key={i} className={"mm-quest" + (i === 0 ? " first" : "")}>
              <span className="mm-q-ic"><GIcon name={v.icon} size={18} color={i === 0 ? "var(--cyan)" : "var(--t2)"} /></span>
              <span className="mm-q-body"><span className="mm-q-title out">{v.title}</span><span className="mm-q-why">{v.why}</span></span>
              <span className="mm-q-tag out">{v.tag}</span>
            </button>
          );
        })}
        <button className="mm-why-btn" onClick={function () { setOpen(!open); }}>{open ? "Hide" : "Why this order?"}</button>
        {open && <p className="mm-why">{V.planWhy(x)}</p>}
      </MentorSheet>
    </MentorScreen>
  );
}

// ═══ 4. Avant la session : Aldric dit comment il l'a composée ═══
export function BriefMoment(p) {
  var x = p.x, b = V.briefing(x), n = x.comp.questions.length;
  var [go, setGo] = useState(false);
  if (go) return <QuestionMoment x={x} qi={0} ans="none" />;
  return (
    <div style={{ padding: "20px 16px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="back-btn">{"←"} Back</button>
        <span className="out" style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{"0/" + n}</span>
      </div>
      <Bar value={0} max={n} h={4} />
      <div className="mm-brief">
        <div className="mm-brief-head"><GIcon name="wizard-staff" size={20} color={/*fond local*/"#6b3410"} /><b className="out">{x.comp.kind === "hunt" ? "Mistake Hunt" : "Aldric's drill"}</b></div>
        {b.lines.map(function (t, i) { return <p key={i}>{t}</p>; })}
        <div className="mm-chips">
          {b.chips.map(function (c, i) { return <span key={i} className="mm-chip"><GIcon name={c.icon} size={12} color={/*fond local*/"#6b3410"} />{c.text}</span>; })}
        </div>
      </div>
      <button className="btn1 out" onClick={function () { setGo(true); }}>{x.comp.kind === "hunt" ? "Start the hunt" : "Begin"}</button>
    </div>
  );
}

// ═══ 4. Pendant : la question porte sa mémoire ═══
export function QuestionMoment(p) {
  var x = p.x, qs = x.comp.questions, start = p.qi || 0;
  function initialSel(i) {
    var mode = p.ans || "auto";
    if (mode === "none") return -1;
    var q = qs[i], ok = mode === "auto" ? x.outcome.results[i].ok : mode === "right";
    return ok ? q.c : q.options.findIndex(function (o, j) { return j !== q.c; });
  }
  var [ci, setCi] = useState(start);
  var [sel, setSel] = useState(function () { return initialSel(start); });
  var q = qs[ci], fb = sel >= 0, ok = sel === q.c;
  var badge = V.questionBadge(q), feed = fb ? V.questionFeedback(x, q, ok) : null;
  function next() { if (ci < qs.length - 1) { setCi(ci + 1); setSel(-1); } }
  return (
    <div style={{ padding: "20px 16px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="back-btn">{"←"} Back</button>
        <span className="out" style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{(ci + 1) + "/" + qs.length}</span>
      </div>
      <Bar value={ci} max={qs.length} h={4} />
      <span className="out" style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, display: "block" }}>{q.mod === "drill" ? q.cat : q.label}</span>
      {badge && <div><span className="mm-badge"><GIcon name={TIERS[badge.tier].icon} size={14} color="var(--purple)" />{badge.text}</span></div>}
      {q.audio && <div><span className="mm-audio"><GIcon name="public-speaker" size={14} color="var(--cyan)" />Replay the audio</span></div>}
      <h2 className="qstem" style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.5, marginBottom: 24, marginTop: 10 }}>{q.prompt}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map(function (opt, i) {
          var iS = sel === i, iC = i === q.c, bg = "var(--bg2)", bd = "var(--bdr)";
          if (fb && iC) { bg = "rgba(0,230,118,.12)"; bd = "var(--green)"; } else if (fb && iS && !iC) { bg = "rgba(255,71,87,.12)"; bd = "var(--red)"; }
          return (
            <button key={i} onClick={function () { if (!fb) setSel(i); }} disabled={fb}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: bg, border: "1px solid " + bd, borderRadius: 12, cursor: fb ? "default" : "pointer", fontSize: 15, color: "var(--t1)", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid " + (fb && iC ? "var(--green)" : fb && iS ? "var(--red)" : "var(--t3)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: fb && iC ? "var(--green)" : fb && iS && !iC ? "var(--red)" : "transparent", color: fb && (iC || iS) ? "#fff" : "var(--t3)" }}>
                {fb && iC ? "✓" : fb && iS ? "✗" : String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {fb && <div style={{ marginTop: 20, animation: "fadeIn .3s" }}>
        {feed && <div className={"mm-fb " + feed.tone}><GIcon name={feed.icon} size={20} color={feed.tone === "win" ? "var(--green)" : feed.tone === "bite" ? "var(--red)" : "var(--t2)"} /><span>{feed.text}</span></div>}
        {q.why && <div className="crd" style={{ background: "rgba(var(--cx),.06)", borderColor: "rgba(var(--cx),.15)", padding: 16 }}><p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{q.why}</p></div>}
        <button className="btn1" onClick={next} style={{ marginTop: 16 }}>{ci < qs.length - 1 ? "Next" : "See Results"}</button>
      </div>}
    </div>
  );
}

// ═══ 5. L'écran de fin : le vrai SessionResult + « Aldric remembers » ═══
function buildSession(x) {
  var o = x.outcome, u = x.before, events = [];
  var g = gateSteps(o.base, o.sc, o.tot, o.modId, { u: u, now: NOW, events: events, spotlight: true });
  var st = settleXp(u, g.xp, { now: NOW, events: events, classMedianXp: 0, leagueOf: getLeague });
  return {
    id: 7, sp: o.modId, modId: o.modId, sc: o.sc, tot: o.tot, userName: u.name,
    steps: g.steps.concat(st.steps), total: st.amt, fromXp: u.xp, toXp: st.c.xp,
    levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: u.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
    chests: st.chests.map(function (ch) { return { trigger: ch.trigger, type: ch.type, tier: CHEST_TIER[ch.type] || 0, label: getTriggerLabel(ch.trigger) }; }),
    achievements: [],
    // Darics de la chasse : hors XP, donc hors classement de ligue (voir huntXpNote).
    marks: o.darics ? [{ amount: o.darics, label: "Creatures slain" }] : [],
  };
}
export function ResultMoment(p) {
  var x = p.x, R = V.remember(x);
  var session = useMemo(function () { return buildSession(x); }, [x]);
  useEffect(function () {
    if (!p.still) return;
    // Storyboard : sauter l'animation et amener la carte « Aldric remembers » dans le cadre.
    var t1 = setTimeout(function () { var r = document.querySelector(".sr-root"); if (r) r.click(); }, 300);
    var t2 = setTimeout(function () {
      var r = document.querySelector(".sr-root"), t = document.querySelector(".mm-remember");
      if (r && t) r.scrollTop = Math.max(0, t.getBoundingClientRect().top - r.getBoundingClientRect().top + r.scrollTop - 110);
    }, 1000);
    return function () { clearTimeout(t1); clearTimeout(t2); };
  }, [p.still]);
  return (
    <SessionResult session={session} sid={session.id} name={MODULE_NAME[x.outcome.modId]} mistakes={x.outcome.mistakes}
      onContinue={noop} onReplay={x.outcome.modId === "drill" ? noop : undefined}>
      <div className="crd mm-remember">
        <div className="mm-rem-head"><GIcon name="wizard-staff" size={16} color="var(--purple)" /><b className="out">Aldric remembers</b><small>{"Bestiary " + R.bestiary.from + " → " + R.bestiary.to}</small></div>
        {R.lines.map(function (l, i) {
          return (
            <div key={i} className="mm-rem-line">
              <GIcon name={l.icon} size={20} color={l.tone === "win" ? "var(--green)" : "var(--t2)"} />
              <div><b>{l.text}</b>{l.sub && <small>{l.sub}</small>}</div>
            </div>
          );
        })}
      </div>
    </SessionResult>
  );
}

// ═══ 6. Cérémonie : faiblesse devenue force ═══
export function CeremonyMoment(p) {
  var x = p.x, C = V.ceremony(x);
  var canvas = useRef(null), stage = useRef(null);
  useEffect(function () {
    if (C.none) return;
    var f = null;
    try { f = createChestFx(canvas.current); } catch (e) { console.warn("[mentor-memory] fx:", e && e.message); }
    var t = setTimeout(function () {
      try {
        burstAt(f, stage.current, [/*fond local*/"#ffe9a8", /*fond local*/"#f0c850", /*fond local*/"#ffffff"], true);
        if (f) f.rain({ count: 40, color: [/*fond local*/"#ffd65a", /*fond local*/"#ffe9a8"] });
      } catch (e) { console.warn("[mentor-memory] burst:", e && e.message); }
    }, 1300);
    return function () { clearTimeout(t); if (f) f.destroy(); };
  }, [C.none]);
  if (C.none) {
    var name = x.before.name, days = Math.round((NOW - new Date(x.before.joinedAt)) / 864e5) + 1, tr = C.best && C.best.turn;
    return (
      <div className="mm-note">
        <b>{"Pas de cérémonie pour " + name + " aujourd'hui."}</b>
        <p>{"La règle : une catégorie sous " + Math.round(TURN.thenMax * 100) + " % sur ses " + TURN.thenQ + " premières questions, au-dessus de " + Math.round(TURN.nowMin * 100) + " % sur ses " + TURN.nowQ + " dernières, avec au moins " + TURN.gapDays + " jours entre les deux fenêtres. Une fois par catégorie."}</p>
        <p>{days <= 7 ? "Trop tôt : " + days + " jours dans l'Arène. Rien de prouvé à célébrer, donc rien de célébré."
          : tr ? "Le plus proche : " + C.best.cat + " (" + tr.then.c + "/" + tr.then.t + " au début, " + tr.now.c + "/" + tr.now.t + " dernièrement, écart " + tr.gap + " j)."
          : "Aucune catégorie n'a encore deux fenêtres mesurables (" + TURN.thenQ + " Q au début et " + TURN.nowQ + " Q dernièrement, sans chevauchement)."}</p>
        <p>{"Karim la reçoit aujourd'hui (Conditionals)."}</p>
      </div>
    );
  }
  var tr2 = x.outcome.ceremony.turn, series = catSeries(x.after, x.outcome.ceremony.cat);
  return (
    <div className="cer-ov mm-cer">
      <div className="cer-rays" />
      <div className="mm-cer-stage" ref={stage}>
        <span className="mm-cer-disc" />
        <span className="mm-cer-wave" />
        <span className="mm-cer-old"><GIcon name="spider-web" size={70} color={/*fond local*/"#c0503a"} /></span>
        <span className="mm-cer-new"><GIcon name="laurel-crown" size={82} color={/*fond local*/"#f0c850"} /></span>
      </div>
      <div className="cer-kicker out">{C.kicker}</div>
      <div className="mm-cer-title out">{C.title}</div>
      <div className="mm-cer-sub">{C.sub}</div>
      <div className="mm-cer-line">{C.line}</div>
      <div className="mm-cer-spark" aria-hidden="true">
        {series.map(function (s, i) {
          return <i key={i} className={s.d >= tr2.now.start ? "up" : ""} style={{ height: Math.max(4, Math.round(40 * s.c / s.t)) + "px" }} />;
        })}
      </div>
      <button className="cer-cta out">Onward</button>
      <canvas ref={canvas} className="cer-fx" />
    </div>
  );
}

// ═══ 8. Bestiaire des erreurs (repère « The Lair » sur la carte du Mentor) ═══
export function BestiaryMoment(p) {
  var x = p.x, B = V.bestiaryView(x), isNew = B.slain === 0;
  return (
    <div className="enter" style={{ padding: "20px 16px 100px" }}>
      <button className="back-btn">{"←"} Mentor</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <GIcon name="dragon-head" size={28} color="var(--cyan)" /><h1 className="out" style={{ fontWeight: 900, fontSize: 24 }}>Bestiary</h1>
      </div>
      <p style={{ color: "var(--t2)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Every mistake becomes a creature. Beat it three times, a few days apart, and it falls for good.</p>
      <div className="mm-best-stats">
        <div className="crd mm-stat"><b className="out" style={{ color: "var(--t1)" }}>{B.lurking}</b><small>Lurking</small></div>
        <div className="crd mm-stat"><b className="out" style={{ color: "var(--orange)" }}>{B.due}</b><small>Due today</small></div>
        <div className="crd mm-stat"><b className="out" style={{ color: "var(--green)" }}>{B.slain}</b><small>Slain</small>{B.slainWeek > 0 && <em>{"+" + B.slainWeek + " this week"}</em>}</div>
      </div>
      {B.due > 0 && <button className="btn1 out" style={{ marginBottom: 14 }}>{"Hunt " + Math.min(10, B.due) + " due creature" + (B.due > 1 ? "s" : "")}</button>}
      {isNew && <div className="crd mm-rules">
        <div className="out" style={{ fontWeight: 800, fontSize: 13 }}>How the hunt works</div>
        <ol><li>Miss a question: it comes back tomorrow.</li><li>Beat it: it sleeps 3 days, then 7.</li><li>Beat it a third time: slain for good.</li></ol>
      </div>}
      {B.groups.map(function (g) {
        var rows = B.rows(g);
        return (
          <div key={g.key} className="crd mm-group">
            <div className="mm-group-head"><b className="out">{g.key}</b><small>{g.items.length}</small>{g.due > 0 && <span className="mm-due out">{g.due + " due"}</span>}</div>
            {rows.slice(0, 3).map(function (r) {
              return (
                <div key={r.k} className="mm-crea">
                  <span className="mm-crea-ic"><GIcon name={r.icon} size={17} color={r.tier === "wyrm" ? "var(--red)" : r.tier === "stalker" ? "var(--orange)" : "var(--t2)"} /></span>
                  <div className="mm-crea-body">
                    <div className="mm-crea-q">{r.prompt}</div>
                    <div className="mm-crea-meta">{r.tierName + " · " + (r.fails > 1 ? "missed " + r.fails + "× since " : "missed on ") + fmtDay(r.first) + " · " + (r.due ? "due today" : "back in " + r.inDays + " day" + (r.inDays > 1 ? "s" : ""))}</div>
                  </div>
                  <span className="mm-pips" title="Hits">{[0, 1, 2].map(function (i) { return <i key={i} className={i < r.box ? "on" : ""} />; })}</span>
                </div>
              );
            })}
            {rows.length > 3 && <div className="mm-more">{"and " + (rows.length - 3) + " more"}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ═══ 9. Mentor : la Chronique (repère Aldric sur la carte) ═══
export function ChronicleMoment(p) {
  var x = p.x, C = V.chronicleView(x);
  return (
    <MentorScreen x={x}>
      <MentorSheet open={true} onClose={noop} title="The Chronicle of your journey">
        <div className="mm-chron">
          {C.entries.map(function (e, i) {
            return (
              <div key={i} className={"mm-ch" + (e.now ? " now" : "") + (e.kind === "turn" ? " turn" : "")}>
                <span className="mm-ch-dot"><GIcon name={e.icon} size={16} color={e.kind === "turn" ? "var(--gold)" : e.now ? "var(--cyan)" : "var(--t2)"} /></span>
                <div className="mm-ch-body">
                  <div className="mm-ch-date out">{e.kind === "next" ? "Today" : fmtDay(e.d)}</div>
                  <div className="mm-ch-title out">{e.title}</div>
                  {e.text && <div className="mm-ch-text">{e.text}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn2 out" style={{ marginTop: 12 }}>{"Hear Aldric again"}</button>
      </MentorSheet>
    </MentorScreen>
  );
}
