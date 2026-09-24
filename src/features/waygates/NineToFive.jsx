// Nine to Five (hub The Waygates, 2026-09-24) — une journée de travail chez Meridian Harbor Group.
// Proto : prototypes/office-day/ (variante V3 choisie par Jérémy : horloge + réputation, horloge clémente
// aux grades bas). Composition de la journée, grades, réputation et XP : lib/officeDay.js (pur, testé).
//
// Les questions sont celles du TOEIC, TELLES QUELLES (Parts 3, 4 et 7) : tout le jeu est autour, jamais
// à leur place. Chaque réponse compte dans le module de sa Part (lisP3, lisP4, p7 : estimateur et Mentor
// à plein poids, voir officeDone dans App.jsx) et ses erreurs gardent les refs de ces modules : la
// chasse les rejoue sans code neuf.
//
// Couleurs : UNIQUEMENT les jetons du thème (skins, fêtes et mode clair s'appliquent, question de
// Jérémy). Le « bureau moderne » passe par la forme (boîte de réception, appel, horloge), pas par une
// palette à part.
import { useEffect, useMemo, useRef, useState } from "react";
import { LISTENING_P3, LISTENING_P4 } from "../../data/listening.js";
import { PART7_PASSAGES } from "../../data/part7.js";
import { COMPANY, DAY_LEN, PEOPLE, REPLAY_COST, composeDay, dayStars, dayXp, fmtClock, gradeOf, nextGrade, officeRep, repGain } from "../../lib/officeDay.js";
import { shufListeningItem } from "../../lib/listeningShuffle.js";
import { shufP7 } from "../../lib/optionShuffle.js";
import { playAudioFile, resumeAudioSession, stopCurrentListenAudio, stopListenAudio } from "../../lib/audio.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { AnswerCard, ComboBanner, ListenDisc, NextBar, SessionTop } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { SessionResult } from "../../components/SessionResult.jsx";
import { PassageDocs } from "../../components/PassageDocs.jsx";
import { ListeningGraphic } from "../../components/ListeningGraphic.jsx";
import { GIcon } from "../../components/icons.jsx";
import { arrivedByPortal } from "./portal.js";

var NF_CSS = `
.nf{padding:4px 16px 120px}
.nf-intro{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:56px 20px 40px}
.nf-intro.landed{animation:nf-land .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes nf-land{from{transform:scale(1.06);filter:blur(4px);opacity:0}to{transform:none;filter:none;opacity:1}}
.nf-arrive{position:fixed;inset:0;z-index:300;pointer-events:none;background:radial-gradient(circle,rgba(var(--cx),.9),var(--bg) 72%);animation:nf-veil .55s ease-out forwards}
@keyframes nf-veil{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){.nf-intro.landed{animation:none}.nf-arrive{animation-duration:.25s}}
.nf-intro-back{position:absolute;top:10px;left:16px;margin-bottom:0}
.nf-time{font-size:54px;font-weight:300;text-align:center;line-height:1;color:var(--t1);font-variant-numeric:tabular-nums}
.nf-day{text-align:center;font-size:13px;color:var(--t2);margin-top:-4px}
.nf-notif{display:flex;gap:10px;padding:12px 14px!important;border-radius:16px!important}
.nf-notif p{margin:4px 0 0;font-size:14px;line-height:1.55;color:var(--t1)}
.nf-notif-h{display:flex;justify-content:space-between;font-size:12.5px;color:var(--t1)}
.nf-notif-h span{color:var(--t3)}
.nf-av{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none;background:rgba(var(--cx),.18);color:var(--cyan);border:1px solid rgba(var(--cx),.35)}
.nf-av.sm{width:18px;height:18px;font-size:8px}
.nf-badge{padding:12px 14px!important}
.nf-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t3)}
.nf-grade{font-size:18px;font-weight:800;color:var(--t1);margin-top:2px}
.nf-bar{display:block;height:7px;border-radius:4px;background:rgba(var(--cx),.12);overflow:hidden;margin:8px 0 6px}
.nf-bar i{display:block;height:100%;background:var(--cyan);border-radius:4px;transition:width .5s}
.nf-small{font-size:12px;color:var(--t2)}
.nf-rules{margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.6;color:var(--t2)}
.nf-rules b{color:var(--t1)}
.nf-sec{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t3);margin:14px 2px 8px}
.nf-row{display:flex;gap:11px;align-items:flex-start;width:100%;text-align:left;padding:12px!important;margin-bottom:8px;cursor:pointer;font-family:inherit;color:var(--t1)}
.nf-row.ring{border-color:var(--green)!important;animation:nf-ring 1.4s infinite}
@keyframes nf-ring{0%{box-shadow:0 0 0 0 rgba(var(--cx),.35)}70%{box-shadow:0 0 0 9px rgba(var(--cx),0)}100%{box-shadow:0 0 0 0 rgba(var(--cx),0)}}
.nf-ico{width:34px;height:34px;border-radius:10px;background:rgba(var(--cx),.12);color:var(--cyan);display:flex;align-items:center;justify-content:center;flex:none}
.nf-row-b{flex:1;min-width:0}
.nf-row-f{font-size:12px;color:var(--t2)}
.nf-row-s{font-size:14px;font-weight:700;color:var(--t1);line-height:1.35}
.nf-row-ask{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);margin-top:6px}
.nf-row-r{display:flex;flex-direction:column;gap:4px;align-items:flex-end}
.nf-row.done{opacity:.72;padding:9px 12px!important;align-items:center;cursor:default}
.nf-row.done .nf-ico{width:26px;height:26px}
.nf-row.missed .nf-row-s{text-decoration:line-through;color:var(--t3)}
.nf-chip{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:rgba(var(--cx),.1);color:var(--t2);white-space:nowrap}
.nf-chip.go{background:var(--green);color:var(--bg)}
.nf-chip.soon{color:var(--orange);background:rgba(var(--cx),.08);border:1px solid var(--orange)}
.nf-chip.late,.nf-chip.miss{color:var(--red);background:transparent;border:1px solid var(--red)}
.nf-empty{padding:18px!important;text-align:center;display:flex;flex-direction:column;gap:10px;color:var(--t2);font-size:14px}
.nf-empty p{margin:0}
.nf-clock{font-variant-numeric:tabular-nums;font-weight:800;font-size:15px;color:var(--t1)}
.nf-clock.late{color:var(--orange)}
.nf-head{display:flex;align-items:center;gap:10px;margin:2px 0 10px}
.nf-head .back-btn{margin-bottom:0}
.nf-head-k{flex:1;text-align:right;font-size:12px;color:var(--t2)}
.nf-live{font-size:12px;font-weight:800;color:var(--red)}
.nf-doc{padding:14px!important;margin-bottom:12px;max-height:46vh;overflow:auto}
.nf-doc-h{border-bottom:1px solid var(--bdr);padding-bottom:8px;margin-bottom:10px;font-size:12px;color:var(--t2);line-height:1.6}
.nf-doc-h span{display:inline-block;width:58px;color:var(--t3)}
.nf-doc-b{font-size:13.5px;line-height:1.7;color:var(--t2);white-space:pre-line;margin:0}
.nf-call{padding:14px!important;margin-bottom:12px;text-align:center}
.nf-call-who{font-size:16px;font-weight:800;color:var(--t1)}
.nf-call-sub{font-size:12.5px;color:var(--t2);margin-bottom:4px}
.nf-link{background:none;border:0;color:var(--cyan);font-size:13px;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:6px 0;font-family:inherit}
.nf-script{text-align:left;font-size:12.5px;line-height:1.6;color:var(--t2);margin-top:8px}
.nf-script p{margin:4px 0}
.nf-script b{color:var(--t1)}
.nf-lock{font-size:12px;font-weight:700;color:var(--orange);margin:2px 0 8px}
.nf-pre{padding:10px 12px!important;margin-bottom:8px}
.nf-pre-q{font-size:13.5px;font-weight:700;color:var(--t1);margin-bottom:6px}
.nf-pre-o{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;font-size:12px;color:var(--t2)}
.nf-pre-o b{color:var(--t3);margin-right:3px}
.nf-q{font-size:16px;font-weight:700;line-height:1.5;color:var(--t1);margin:4px 0 12px}
.nf-opts{display:flex;flex-direction:column;gap:8px}
.nf-opt{display:flex;align-items:center;gap:12px;padding:13px 14px;background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;font-size:14px;color:var(--t1);text-align:left;cursor:pointer;font-family:inherit}
.nf-opt:disabled{cursor:default}
.nf-opt.ok{border-color:var(--green)}
.nf-opt.ko{border-color:var(--red)}
.nf-opt.dim{opacity:.5}
.nf-opt-l{width:26px;height:26px;border-radius:50%;border:2px solid var(--t3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none;color:var(--t3)}
.nf-opt.ok .nf-opt-l{background:var(--green);border-color:var(--green);color:var(--bg)}
.nf-opt.ko .nf-opt-l{background:var(--red);border-color:var(--red);color:var(--bg)}
.nf-ringbar{position:fixed;left:50%;transform:translateX(-50%);top:calc(92px + env(safe-area-inset-top,0px));width:calc(100% - 24px);max-width:406px;z-index:91;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--bg2);border:1.5px solid var(--green);box-shadow:0 10px 28px rgba(0,0,0,.35);animation:nf-drop .3s ease-out}
.app:not(.onboard-shell) .nf-ringbar{left:calc(200px + 32px);right:32px;width:auto;max-width:none;transform:none}
@keyframes nf-drop{from{opacity:0;margin-top:-14px}}
.nf-ringbar-b{flex:1;min-width:0;display:flex;flex-direction:column;font-size:12.5px;color:var(--t2)}
.nf-ringbar-b b{color:var(--t1)}
.nf-ringbar .btn1{width:auto;padding:8px 14px;min-height:38px;font-size:13px}
.nf-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:92;padding:9px 16px;border-radius:999px;background:var(--bg3);border:1px solid var(--bdr);color:var(--t1);font-size:12.5px;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.app:not(.onboard-shell) .nf-toast{left:calc(50% + 100px)}
.nf-review{display:flex;gap:10px;padding:12px 14px!important;margin-bottom:10px}
.nf-review p{margin:0;font-size:14px;line-height:1.55;color:var(--t1)}
.nf-stars{font-size:30px;letter-spacing:6px;text-align:center;color:var(--t3);margin-bottom:6px}
.nf-stars .on{color:var(--gold)}
.nf-end-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--t1);margin-bottom:6px}
.nf-end-row .nf-ico{width:26px;height:26px}
.nf-end-s{flex:1;min-width:0}
.nf-promo{margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr);font-size:13.5px;color:var(--t1)}
.nf-promo .nf-lbl{color:var(--cyan)}
`;

// ── Contenu d'une tâche : l'item de la banque, options permutées, questions à plat ──────────────
var PART = { p7: "p7", lisP3: "p3", lisP4: "p4" };
function flat(qs, key) {
  return qs.map(function (q, i) { return { q: q.q, opts: q[key.opts], c: q[key.c], x: q.x || "", graphic: q.graphic || null, qi: i }; });
}
function buildTask(t) {
  if (t.mod === "p7") {
    var ps = shufP7(PART7_PASSAGES.find(function (x) { return x.id === t.itemId; }));
    return Object.assign({}, t, { text: ps.text, docType: ps.type, qs: flat(ps.questions, { opts: "options", c: "correct" }) });
  }
  if (t.mod === "lisP3") {
    var cv = LISTENING_P3.find(function (x) { return x.id === t.itemId; });
    return Object.assign({}, t, { lines: cv.lines, qs: flat(cv.qs.map(shufListeningItem), { opts: "opts", c: "c" }),
      audio: cv.lines.map(function (l, i) { return "/audio/p3/" + cv.id + "_line" + i + ".mp3"; }) });
  }
  var tk = LISTENING_P4.find(function (x) { return x.id === t.itemId; });
  return Object.assign({}, t, { text: tk.text, qs: flat(tk.qs.map(shufListeningItem), { opts: "opts", c: "c" }), audio: ["/audio/p4/" + tk.id + ".mp3"] });
}
var ICON = { mail: "envelope", doc: "scroll-unfurled", phone: "smartphone", file: "files", chat: "coffee-cup", call: "rotary-phone", meeting: "round-table", live: "megaphone", voicemail: "microphone" };
var LABEL = { mail: "Email", doc: "Document", phone: "Messages", file: "Case file", chat: "Conversation", call: "Call", meeting: "Meeting", voicemail: "Voicemail" };
function labelOf(t) { return t.kind === "live" ? t.from : t.kind === "mail" || t.kind === "doc" ? (t.docType || LABEL[t.kind]) : LABEL[t.kind] || "Task"; }
function isAudio(t) { return t.mod !== "p7"; }
function initState(tasks) {
  var s = {};
  tasks.forEach(function (t) { s[t.id] = { status: "hidden", qi: 0, answers: [], arrivedAt: null, doneAt: null, heard: false, replays: 0 }; });
  return s;
}
// Bilan par tâche (lu par la fin de journée et par p.done).
function summarize(tasks, st) {
  return tasks.map(function (t) {
    var s = st[t.id], correct = 0;
    s.answers.forEach(function (a, k) { if (t.qs[k] && a === t.qs[k].c) correct++; });
    var done = s.status === "done";
    var onTime = done && (t.due == null || s.doneAt <= t.due);
    var status = done ? (onTime ? "done" : "late") : s.status === "missed" ? "missed" : s.status === "hidden" ? "never came" : "left on desk";
    return { t: t, correct: correct, answered: s.answers.length, done: done, onTime: onTime, status: status };
  });
}

function Avatar(p) { var who = PEOPLE[p.who] || PEOPLE.dana; return <span className={"nf-av" + (p.sm ? " sm" : "")}>{who.initials}</span>; }

export function NineToFive(p) {
  var rep0 = useRef(officeRep(p.u)).current;              // lu AVANT p.done : sv() écrit tout de suite
  var day = useMemo(function () { return composeDay(rep0); }, [rep0]);
  var tasks = useMemo(function () { return day.tasks.map(buildTask); }, [day]);
  var grade = day.grade;
  var totalQs = tasks.reduce(function (a, t) { return a + t.qs.length; }, 0);

  var [phase, setPhase] = useState("intro");          // intro | day | end
  var landed = useState(arrivedByPortal)[0];          // arrivé par le portail du hub : voile qui se dissipe, accueil qui se pose
  var [min, setMin] = useState(0);
  var [st, setSt] = useState(function () { return initState(tasks); });
  var [view, setView] = useState(null);               // null = le bureau ; sinon l'id de la tâche ouverte
  var [playing, setPlaying] = useState(false);
  var [showScript, setShowScript] = useState(false);
  var [toast, setToast] = useState(null);
  var track = useSessionTrack();
  var mistakesRef = useRef([]), sidRef = useRef(0), sentRef = useRef(false), genRef = useRef(0);
  var pausedRef = useRef(false);                      // feuille « Leave this round? » ouverte : l'horloge s'arrête
  var minRef = useRef(0); minRef.current = min;
  var stRef = useRef(st); stRef.current = st;

  useEffect(function () { resumeAudioSession(); return stopListenAudio; }, []);
  useEffect(function () { if (!toast) return; var h = setTimeout(function () { setToast(null); }, 2600); return function () { clearTimeout(h); }; }, [toast]);

  function patch(id, obj) { setSt(function (prev) { var n = Object.assign({}, prev); n[id] = Object.assign({}, prev[id], obj); return n; }); }
  function say(msg) { setToast({ msg: msg, k: Date.now() }); }
  function taskOf(id) { return tasks.find(function (t) { return t.id === id; }); }

  // Horloge : tourne pendant toute la journée, sauf feuille « Leave » ouverte (lue dans le tick).
  useEffect(function () {
    if (phase !== "day") return;
    var h = setInterval(function () {
      if (pausedRef.current) return;
      setMin(function (m) { return Math.min(DAY_LEN, m + grade.speed * 0.25); });
    }, 250);
    return function () { clearInterval(h); };
  }, [phase, grade.speed]);

  // Arrivées et directs manqués.
  var minute = Math.floor(min);
  useEffect(function () {
    if (phase !== "day") return;
    var changes = {}, arrivals = [], lost = [];
    tasks.forEach(function (t) {
      var s = stRef.current[t.id];
      if (s.status === "hidden" && minute >= t.at) { changes[t.id] = { status: t.live ? "ringing" : "inbox", arrivedAt: minute }; arrivals.push(t); }
      else if (s.status === "ringing" && t.live && minute >= s.arrivedAt + t.ringFor) { changes[t.id] = { status: "missed" }; lost.push(t); }
    });
    if (!arrivals.length && !lost.length) return;
    setSt(function (prev) {
      var n = Object.assign({}, prev);
      Object.keys(changes).forEach(function (id) { n[id] = Object.assign({}, prev[id], changes[id]); });
      return n;
    });
    var a = arrivals.filter(function (t) { return t.at > 0; }).pop();
    if (a) say(a.live ? (a.kind === "chat" ? "Colleagues at the coffee machine" : a.kind === "call" ? "Incoming call" : a.from + " starting now") : a.kind === "voicemail" ? "New voicemail" : "New " + labelOf(a).toLowerCase() + " on your desk");
    else if (lost.length) say("Missed · " + labelOf(lost[0]));
  }, [minute, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fin de journée : 17:00, ou tout traité (de retour au bureau).
  var resolved = tasks.every(function (t) { var s = st[t.id].status; return s === "done" || s === "missed"; });
  useEffect(function () {
    if (phase !== "day") return;
    if (min >= DAY_LEN || (resolved && view == null)) { hush(); setView(null); setPhase("end"); }
  }, [min, resolved, view, phase]);

  // Enregistrement à la fin (persister au calcul, jamais derrière un bouton ; garde ref : StrictMode).
  var rows = summarize(tasks, st);
  var answered = rows.reduce(function (a, r) { return a + r.answered; }, 0);
  var sc = rows.reduce(function (a, r) { return a + r.correct; }, 0);
  var gain = repGain(rows);
  useEffect(function () {
    if (phase !== "end" || sentRef.current) return;
    sentRef.current = true;
    if (!answered) return;
    var parts = {};
    rows.forEach(function (r) {
      if (!r.answered) return;
      var m = parts[r.t.mod] || (parts[r.t.mod] = { c: 0, t: 0 });
      m.c += r.correct; m.t += r.answered;
    });
    var clean = rows.every(function (r) { return r.done && r.onTime; });
    sidRef.current = p.done(sc, answered, dayXp(sc, answered, clean), mistakesRef.current,
      { modId: "office", parts: parts, repGain: gain, onTime: rows.filter(function (r) { return r.onTime; }).length, tasks: rows.length, stars: dayStars(sc, totalQs) });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio ──
  function hush() { genRef.current++; try { stopCurrentListenAudio(); } catch (e) { console.warn("[office] stop audio:", e && e.message); } setPlaying(false); }
  async function listen(t) {
    hush(); resumeAudioSession();
    var gen = ++genRef.current;
    setPlaying(true);
    for (var i = 0; i < t.audio.length; i++) {
      await playAudioFile(t.audio[i]);
      if (genRef.current !== gen) return;
      if (i < t.audio.length - 1) await new Promise(function (r) { setTimeout(r, 300); });
      if (genRef.current !== gen) return;
    }
    setPlaying(false);
    patch(t.id, { heard: true });
  }

  // ── Actions ──
  function open(id) {
    var t = taskOf(id), s = st[id];
    if (s.status === "ringing" || s.status === "inbox") patch(id, { status: "open" });
    setShowScript(false); setView(id);
    try { window.scrollTo(0, 0); } catch (e) { console.warn("[office] scroll:", e && e.message); }
    // Un direct démarre au décroché (le tap est le geste qui autorise l'audio) ; un vocal attend Play.
    if (isAudio(t) && t.kind !== "voicemail" && !s.heard) listen(t);
  }
  function toDesk() {
    if (view && st[view].status === "open") patch(view, { status: "inbox" });
    hush(); setView(null);
  }
  function pickUp(id) {
    // Interruption : la tâche en cours reste sur le bureau, avec ses réponses.
    if (view && st[view].status === "open") patch(view, { status: "inbox" });
    hush(); open(id);
  }
  function answer(i) {
    var t = taskOf(view), s = st[view], q = t.qs[s.qi], ok = i === q.c;
    track.record(ok);
    try { if (ok) playCorrect(); else playWrong(); } catch (e) { console.warn("[office] sfx:", e && e.message); }
    if (!ok) mistakesRef.current.push({ tag: "Nine to Five · " + labelOf(t), prompt: q.q, yours: q.opts[i], correct: q.opts[q.c], why: q.x,
      ref: { k: t.mod + ":" + t.itemId + ":" + q.qi, part: PART[t.mod] } });
    patch(view, { answers: s.answers.concat([i]) });
  }
  function next() {
    var t = taskOf(view), s = st[view];
    if (s.qi + 1 < t.qs.length) { patch(view, { qi: s.qi + 1 }); return; }
    var ok = s.answers.filter(function (a, k) { return t.qs[k] && a === t.qs[k].c; }).length;
    var late = t.due != null && minRef.current > t.due;
    patch(view, { status: "done", doneAt: minRef.current });
    hush(); setView(null);
    say("Filed · " + ok + "/" + t.qs.length + (late ? " · late" : "") + " · +" + (ok * 4 + (late ? 0 : 6)) + " rep");
  }
  function skipAhead() {
    var up = tasks.filter(function (t) { return st[t.id].status === "hidden"; }).map(function (t) { return t.at; });
    setMin(up.length ? Math.max(min, Math.min.apply(null, up)) : DAY_LEN);
  }

  // ── INTRO ──
  if (phase === "intro") {
    var nx0 = nextGrade(rep0);
    return (<><style>{NF_CSS}</style>
      {landed && <div className="nf-arrive" />}
      <div className={landed ? "nf-intro landed" : "enter nf-intro"}>
        <button className="back-btn nf-intro-back" onClick={p.back}>{"← Back"}</button>
        <div className="nf-time out">8:58</div>
        <div className="nf-day">{COMPANY}</div>
        <div className="crd nf-notif">
          <Avatar who="dana" />
          <div><div className="nf-notif-h"><b>{PEOPLE.dana.name}</b><span>now</span></div><p>{day.brief}</p></div>
        </div>
        <div className="crd nf-badge">
          <div className="nf-lbl out">Your badge</div>
          <div className="nf-grade out">{grade.name}</div>
          {nx0 && <><span className="nf-bar"><i style={{ width: (100 * (rep0 - grade.rep) / (nx0.rep - grade.rep)) + "%" }} /></span>
            <div className="nf-small">{rep0 + " / " + nx0.rep + " rep · next: "}<b>{nx0.name}</b></div></>}
        </div>
        <ul className="nf-rules">
          <li>Your day runs from <b>9:00 to 17:00</b>. Work comes in all day.</li>
          <li><b>Calls and meetings don{"'"}t wait.</b> Read the questions while you listen.</li>
          <li>Whatever is still on your desk at 17:00 stays undone.</li>
        </ul>
        <button className="btn1" onClick={function () { setPhase("day"); }}>Start the day</button>
      </div></>);
  }

  // ── FIN DE JOURNÉE ──
  if (phase === "end") {
    if (!answered) return (<><style>{NF_CSS}</style>
      <div className="enter nf-intro">
        <div className="nf-time out">17:00</div>
        <div className="crd nf-review"><Avatar who="dana" /><p>Nothing got filed today. Tomorrow, start with the desk: the first email is right there at 9:00.</p></div>
        <button className="btn1" onClick={p.back}>Back to the Waygates</button>
      </div></>);
    return (<><style>{NF_CSS}</style>
      <SessionResult session={p.session} sid={sidRef.current} name="Nine to Five" mistakes={mistakesRef.current}
        onContinue={function () { p.closeSession(); p.back(); }} onReplay={p.replaySession}>
        <DayReview rows={rows} sc={sc} totalQs={totalQs} rep0={rep0} gain={gain} />
      </SessionResult></>);
  }

  // ── LA JOURNÉE ──
  var answeredNow = answered, cur = view ? taskOf(view) : null, cs = cur ? st[cur.id] : null;
  var fb = cs && cs.answers.length > cs.qi;
  // Bandeau d'appel seulement PENDANT une autre tâche : au bureau, la ligne qui sonne est déjà en tête.
  var ringing = cur ? tasks.filter(function (t) { return st[t.id].status === "ringing" && t.id !== view; }) : [];
  var nx = nextGrade(rep0 + gain);
  return (<><style>{NF_CSS}</style>
    <SessionTop n={totalQs} cur={fb ? Math.max(0, answeredNow - 1) : answeredNow} results={track.results} streak={track.streak} onQuit={p.back}
      onSheet={function (on) { pausedRef.current = on; }}
      aside={<span className={"nf-clock" + (min >= DAY_LEN - 60 ? " late" : "")}>{fmtClock(min)}</span>}
      sub={grade.name + (nx ? " · " + (rep0 + gain) + " / " + nx.rep + " rep" : "")}
      quitCopy={{ title: "Leave the office?", body: "Today's answers won't be saved.", stay: "Back to work", leave: "Leave" }} />
    <ComboBanner combo={track.combo} />
    {!cur && <Desk tasks={tasks} st={st} min={min} onOpen={open} onSkip={skipAhead} />}
    {cur && <Task t={cur} s={cs} fb={fb} playing={playing} showScript={showScript} min={min}
      onBack={toDesk} onAnswer={answer} onNext={next} onPlay={function () { listen(cur); }}
      onReplay={function () { patch(cur.id, { replays: cs.replays + 1 }); setMin(function (m) { return Math.min(DAY_LEN, m + REPLAY_COST); }); listen(cur); }}
      onScript={function () { setShowScript(!showScript); }} />}
    {ringing.slice(0, 1).map(function (t) {
      var left = Math.max(0, Math.ceil(st[t.id].arrivedAt + t.ringFor - min));
      var busy = cur && isAudio(cur) && playing;
      return (
        <div key={t.id} className="nf-ringbar">
          <span className="nf-ico"><GIcon name={ICON[t.kind]} size={18} color="var(--green)" /></span>
          <div className="nf-ringbar-b"><b>{t.kind === "live" ? t.from : t.subject}</b><span>{"Starts now · " + left + " min to join"}</span></div>
          <button className="btn1" disabled={busy} onClick={function () { pickUp(t.id); }}>{busy ? "Busy" : t.kind === "call" ? "Pick up" : "Join"}</button>
        </div>);
    })}
    {toast && <div className="nf-toast" key={toast.k}>{toast.msg}</div>}
  </>);
}

// ── Le bureau ──────────────────────────────────────────────────────────────────────────────
function Desk(p) {
  var visible = p.tasks.filter(function (t) { var s = p.st[t.id].status; return s === "inbox" || s === "ringing" || s === "open"; });
  visible.sort(function (a, b) {
    var ra = p.st[a.id].status === "ringing" ? 0 : 1, rb = p.st[b.id].status === "ringing" ? 0 : 1;
    return ra - rb || (a.due == null ? 999 : a.due) - (b.due == null ? 999 : b.due);
  });
  var past = p.tasks.filter(function (t) { var s = p.st[t.id].status; return s === "done" || s === "missed"; });
  var pending = p.tasks.some(function (t) { return p.st[t.id].status === "hidden"; });
  return (
    <div className="nf">
      <div className="nf-sec out">On your desk</div>
      {!visible.length && (
        <div className="crd nf-empty">
          <p>{pending ? "Nothing on your desk right now." : "All clear."}</p>
          {pending && <button className="btn2" onClick={p.onSkip}>Grab a coffee · wait for the next task</button>}
        </div>
      )}
      {visible.map(function (t) {
        var s = p.st[t.id], ring = s.status === "ringing";
        var left = ring ? Math.max(0, Math.ceil(s.arrivedAt + t.ringFor - p.min)) : null;
        var overdue = t.due != null && p.min > t.due, soon = t.due != null && !overdue && t.due - p.min <= 45;
        return (
          <button key={t.id} className={"crd nf-row" + (ring ? " ring" : "")} onClick={function () { p.onOpen(t.id); }}>
            <span className="nf-ico"><GIcon name={ICON[t.kind]} size={18} color="var(--cyan)" /></span>
            <div className="nf-row-b">
              <div className="nf-row-f">{t.from}</div>
              <div className="nf-row-s">{t.subject}</div>
              <div className="nf-row-ask"><Avatar who={t.ask.who} sm />{t.ask.text}</div>
            </div>
            <div className="nf-row-r">
              {ring && <span className="nf-chip go">{(t.kind === "call" ? "Pick up" : "Join") + " · " + left + " min"}</span>}
              {!ring && t.due != null && <span className={"nf-chip" + (overdue ? " late" : soon ? " soon" : "")}>{overdue ? "overdue" : "due " + fmtClock(t.due)}</span>}
              {s.answers.length > 0 && <span className="nf-chip">{s.answers.length + "/" + t.qs.length}</span>}
            </div>
          </button>);
      })}
      {past.length > 0 && <>
        <div className="nf-sec out">{"Done today · " + past.filter(function (t) { return p.st[t.id].status === "done"; }).length}</div>
        {past.map(function (t) {
          var s = p.st[t.id], ok = s.answers.filter(function (a, k) { return t.qs[k] && a === t.qs[k].c; }).length;
          var late = s.status === "done" && t.due != null && s.doneAt > t.due;
          return (
            <div key={t.id} className={"crd nf-row done" + (s.status === "missed" ? " missed" : "")}>
              <span className="nf-ico"><GIcon name={ICON[t.kind]} size={14} color="var(--cyan)" /></span>
              <div className="nf-row-b"><div className="nf-row-s">{t.subject}</div></div>
              <span className={"nf-chip" + (s.status === "missed" ? " miss" : late ? " late" : "")}>{s.status === "missed" ? "missed" : ok + "/" + t.qs.length + (late ? " · late" : "")}</span>
            </div>);
        })}
      </>}
    </div>
  );
}

// ── Une tâche ──────────────────────────────────────────────────────────────────────────────
function Task(p) {
  var t = p.t, s = p.s, audio = isAudio(t);
  var q = t.qs[Math.min(s.qi, t.qs.length - 1)];
  var picked = p.fb ? s.answers[s.qi] : null;
  var locked = audio && (!s.heard || p.playing);
  var canLeave = !audio || t.kind === "voicemail" || (s.heard && !p.playing);
  return (
    <div className="nf">
      <div className="nf-head">
        {canLeave ? <button className="back-btn" onClick={p.onBack}>{"← Desk"}</button> : <span className="nf-live out">{"● Live"}</span>}
        <span className="nf-head-k">{labelOf(t) + " · " + Math.min(s.qi + 1, t.qs.length) + "/" + t.qs.length}</span>
      </div>

      {!audio ? <Doc t={t} /> : (
        <div className="crd nf-call">
          <div className="nf-call-who out">{t.from}</div>
          <div className="nf-call-sub">{t.subject}</div>
          <ListenDisc playing={p.playing} onPlay={p.onPlay} disabled={s.heard}
            playingLabel={t.kind === "voicemail" ? "Playing the message…" : "Listening…"}
            hint={s.heard ? "Heard" : t.kind === "voicemail" ? "Tap to play the message" : "Connecting…"} />
          {s.heard && !p.playing && s.replays < 1 && !p.fb && (
            <button className="nf-link" onClick={p.onReplay}>{(t.kind === "voicemail" ? "Play it again" : "“Sorry, could you repeat that?”") + " · " + REPLAY_COST + " min"}</button>
          )}
          {s.heard && p.fb && <button className="nf-link" onClick={p.onScript}>{p.showScript ? "Hide transcript" : "Show transcript"}</button>}
          {p.showScript && s.heard && p.fb && (
            <div className="nf-script">{t.lines
              ? t.lines.map(function (l, i) { return <p key={i}><b>{(l.s.charAt(0) === "M" ? "Man" : "Woman") + ": "}</b>{l.t}</p>; })
              : <p>{t.text}</p>}</div>
          )}
        </div>
      )}

      {locked ? (
        // Comme au TOEIC (Parts 3 et 4) : toutes les questions se lisent AVANT et PENDANT l'écoute, on n'y
        // répond qu'à la fin. C'est l'anticipation qu'on entraîne, sans la nommer.
        <div>
          <div className="nf-lock out">{p.playing ? "Read ahead: answers open when the audio ends" : "Read ahead, then listen"}</div>
          {t.qs.map(function (qq, k) {
            return (
              <div key={k} className="crd nf-pre">
                <div className="nf-pre-q">{(k + 1) + ". " + qq.q}</div>
                {qq.graphic && <ListeningGraphic g={qq.graphic} />}
                <div className="nf-pre-o">{qq.opts.map(function (o, i) { return <span key={i}><b>{String.fromCharCode(65 + i)}</b>{o}</span>; })}</div>
              </div>);
          })}
        </div>
      ) : (
        <div>
          <div className="nf-q out">{q.q}</div>
          {q.graphic && <ListeningGraphic g={q.graphic} />}
          <div className="nf-opts">
            {q.opts.map(function (o, i) {
              var cls = "nf-opt";
              if (p.fb) cls += i === q.c ? " ok" : i === picked ? " ko" : " dim";
              return (
                <button key={i} className={cls} disabled={p.fb} onClick={function () { p.onAnswer(i); }}>
                  <span className="nf-opt-l">{p.fb && i === q.c ? "✓" : p.fb && i === picked ? "✗" : String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </button>);
            })}
          </div>
          {p.fb && <AnswerCard ok={picked === q.c} answer={String.fromCharCode(65 + q.c) + ". " + q.opts[q.c]} why={q.x || undefined} />}
        </div>
      )}
      {p.fb && <NextBar onNext={p.onNext} label={s.qi + 1 < t.qs.length ? "Next question" : t.mod === "p7" ? "File it" : "Done"} />}
    </div>
  );
}

// Courrier : en-têtes lus (From, To, Subject, Date) ; dossier à plusieurs pièces : onglets de PassageDocs.
function Doc(p) {
  var t = p.t;
  if (t.kind === "file") return <div className="crd nf-doc read-scroll"><PassageDocs key={t.itemId} text={t.text} fontSize={13} lineHeight={1.7} /></div>;
  var lines = t.text.split("\n"), head = [], i = 0;
  while (i < lines.length && /^(From|To|Subject|Date|Cc):/.test(lines[i])) { head.push(lines[i]); i++; }
  var body = lines.slice(i).join("\n").replace(/^\n+/, "");
  return (
    <div className="crd nf-doc read-scroll">
      {head.length > 0 && <div className="nf-doc-h">{head.map(function (h, k) { var j = h.indexOf(":"); return <div key={k}><span>{h.slice(0, j)}</span>{h.slice(j + 1)}</div>; })}</div>}
      <p className="nf-doc-b read-text">{body}</p>
    </div>
  );
}

// ── Bilan de la journée (enfant de SessionResult) ──────────────────────────────────────────────
function DayReview(p) {
  var rows = p.rows;
  var stars = dayStars(p.sc, p.totalQs);
  var acc = p.totalQs ? p.sc / p.totalQs : 0;
  var slipped = rows.filter(function (r) { return !r.done; });
  var review = acc >= 0.85 && !slipped.length ? "Great day. Everything handled, and handled right."
    : acc >= 0.7 ? (slipped.length ? "Solid work on what you picked up. One thing slipped through, though: " + labelOf(slipped[0].t).toLowerCase() + "." : "Good day. A couple of details to watch, nothing serious.")
    : acc >= 0.5 ? "We got through it. The mistakes were in the details: read them twice tomorrow."
    : "Tough day. Tomorrow, take the questions one at a time.";
  var [shown, setShown] = useState(p.rep0);
  useEffect(function () {
    // Minuteur plutôt que requestAnimationFrame : rAF est gelé dans un onglet masqué.
    var t0 = Date.now() + 600, h = setInterval(function () {
      var k = Math.max(0, Math.min(1, (Date.now() - t0) / 1400));
      setShown(Math.round(p.rep0 + p.gain * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(h);
    }, 30);
    return function () { clearInterval(h); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  var g0 = gradeOf(p.rep0), g1 = gradeOf(p.rep0 + p.gain), gs = gradeOf(shown), ns = nextGrade(shown);
  var promoted = g1.rep > g0.rep && shown >= g1.rep;
  return (
    <div className="crd" style={{ padding: 14 }}>
      <div className="nf-stars">{[0, 1, 2].map(function (i) { return <span key={i} className={i < stars ? "on" : ""}>★</span>; })}</div>
      <div className="nf-review"><Avatar who="dana" /><p>{review}</p></div>
      {rows.map(function (r) {
        return (
          <div key={r.t.id} className="nf-end-row">
            <span className="nf-ico"><GIcon name={ICON[r.t.kind]} size={14} color="var(--cyan)" /></span>
            <span className="nf-end-s">{r.t.subject}</span>
            <span className={"nf-chip" + (r.status === "done" ? "" : r.status === "late" ? " late" : " miss")}>
              {(r.answered ? r.correct + "/" + r.t.qs.length : "") + (r.status !== "done" ? (r.answered ? " · " : "") + r.status : "")}
            </span>
          </div>);
      })}
      <div className="nf-lbl out" style={{ marginTop: 12 }}>{"Reputation · +" + p.gain}</div>
      <div className="nf-grade out">{gs.name}</div>
      <span className="nf-bar"><i style={{ width: (ns ? 100 * (shown - gs.rep) / (ns.rep - gs.rep) : 100) + "%" }} /></span>
      <div className="nf-small">{shown + (ns ? " / " + ns.rep : "") + " rep"}</div>
      {promoted && (
        <div className="nf-promo">
          <div className="nf-lbl out">Promoted</div>
          <div>{"You are now "}<b>{g1.name}</b>{"."}</div>
          {g1.unlock && <div className="nf-small">{"Unlocked: " + g1.unlock}</div>}
        </div>
      )}
    </div>
  );
}
