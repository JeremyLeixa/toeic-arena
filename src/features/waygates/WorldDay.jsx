// Les mondes des Waygates (2026-09-24, multi-mondes le 2026-09-25) : UN écran, UN moteur, un décor par monde.
//   world="office" : Nine to Five, une journée chez Meridian Harbor Group (proto prototypes/office-day/, V3)
//   world="travel" : Jet Lag, un déplacement d'affaires, avec bulletin météo et règle « prévu = paré »
//                    (proto prototypes/travel-day/, variante W2 choisie par Jérémy)
//   world="service": Front Desk, un samedi au service client d'un grand magasin ; même règle, point du matin →
//                    client mécontent (proto prototypes/service-day/, variante S2)
//   world="opening": Opening Night, une journée d'agence d'événements ; checklist cochée tâche par tâche, les portes
//                    s'ouvrent à 16:00 (proto prototypes/event-day/, variante E1)
// Ce que chaque monde déclare : lib/worlds.js (décor, libellés, textes, règle « prévu = paré », réputation). Composition des journées, grades,
// réputation et XP : lib/officeDay.js (pur, testé). Ajouter un monde = une entrée dans WORLD_META, son vivier et son
// habillage dans officeDay.js, sa carte dans Waygates.jsx, sa route : jamais une copie de cet écran.
//
// Les questions sont celles du TOEIC, TELLES QUELLES (Parts 3, 4 et 7) : tout le jeu est autour, jamais
// à leur place. Chaque réponse compte dans le module de sa Part (lisP3, lisP4, p7 : estimateur et Mentor
// à plein poids, voir worldDone dans App.jsx) et ses erreurs gardent les refs de ces modules : la
// chasse les rejoue sans code neuf.
//
// Couleurs : UNIQUEMENT les jetons du thème (skins, fêtes et mode clair s'appliquent, question de
// Jérémy). Le « bureau moderne » passe par la forme (boîte de réception, appel, horloge), pas par une
// palette à part.
import { useEffect, useMemo, useRef, useState } from "react";
import { LISTENING_P3, LISTENING_P4 } from "../../data/listening.js";
import { PART7_PASSAGES } from "../../data/part7.js";
import { DAY_LEN, PEOPLE, REPLAY_COST, composeDay, dayStars, dayXp, fmtClock, gradeOf, nextGrade, repGain } from "../../lib/officeDay.js";
import { CHECK_BONUS, PREP_BONUS, PREP_DELAY, worldMeta, worldRep } from "../../lib/worlds.js";
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
import "./WorldDay.css";

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
var ICON = { mail: "envelope", doc: "scroll-unfurled", phone: "smartphone", file: "files", chat: "coffee-cup", call: "rotary-phone", meeting: "round-table", live: "megaphone", voicemail: "microphone",
  forecast: "raining", announce: "megaphone", huddle: "conversation", counter: "ringing-bell", finale: "party-popper" };
var LABEL = { mail: "Email", doc: "Document", phone: "Messages", file: "Case file", chat: "Conversation", call: "Call", meeting: "Meeting", voicemail: "Voicemail",
  forecast: "Weather forecast", announce: "Announcement", huddle: "Morning huddle", counter: "Counter", finale: "The event" };
function labelOf(t) { return t.kind === "live" ? t.from : t.kind === "mail" || t.kind === "doc" ? (t.docType || LABEL[t.kind]) : LABEL[t.kind] || "Task"; }
// Bouton d'un direct : on décroche un appel, on sert un client, on écoute une annonce ou un bulletin, on rejoint le reste.
function pickLabel(t) { return t.kind === "call" ? "Pick up" : t.kind === "counter" ? "Serve" : t.kind === "finale" ? "Go in" : t.kind === "forecast" || t.kind === "announce" ? "Listen" : "Join"; }
// Les règles de l'accueil (lib/worlds.js) : [texte, gras, texte].
function Rule(p) { return <li>{p.r[0]}{p.r[1] && <b>{p.r[1]}</b>}{p.r[2]}</li>; }
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

// Checklist (Opening Night) : une ligne est COCHÉE quand sa tâche est rendue sans faute.
function isReady(t, s) { return s.status === "done" && t.qs.every(function (q, k) { return s.answers[k] === q.c; }); }
function readyCount(tasks, st) { return tasks.filter(function (t) { return t.check && isReady(t, st[t.id]); }).length; }

function Avatar(p) { var who = PEOPLE[p.who] || PEOPLE.dana; return <span className={"nf-av" + (p.sm ? " sm" : "")}>{who.initials}</span>; }

export function WorldDay(p) {
  var W = worldMeta(p.world);
  var rep0 = useRef(worldRep(p.u, W.id)).current;         // lu AVANT p.done : sv() écrit tout de suite
  var day = useMemo(function () { return composeDay(rep0, null, W.id); }, [rep0, W.id]);
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
  // « Prévu = paré » (mondes à W.prep) : connue une fois la tâche `prep` traitée (bulletin, point du matin) ; `prepared` =
  // comprise en entier ; `hit` posé quand la tâche `prepHit` arrive (« ready » : bonus, « caught » : retard). Une fois par journée.
  // Checklist (mondes à W.checklist) : `finale` = lignes cochées à l'ouverture des portes (posé une fois, à l'arrivée de
  // la tâche `finale`), et `bonus` la réputation qu'elles rapportent.
  var [wx, setWx] = useState({ known: false, label: null, prepared: false, bonus: 0, hit: null, finale: null });
  var wxRef = useRef(wx); wxRef.current = wx;
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
    // « Prévu = paré » : la tâche qui en dépend arrive (perturbation, client mécontent). Préparation comprise en entier
    // → bonus ; sinon l'horloge saute. Les textes sont ceux du monde (lib/worlds.js) : Jet Lag parle d'anticipation,
    // jamais d'orage (une seule perturbation du vivier est due à la météo).
    var hit = W.prep ? arrivals.find(function (t) { return t.prepHit; }) : null;
    if (hit && !wxRef.current.hit) {
      if (wxRef.current.prepared) {
        setWx(function (w) { return Object.assign({}, w, { hit: "ready", bonus: PREP_BONUS }); });
        say(W.prep.ready + " · +" + PREP_BONUS + " rep");
      } else {
        setWx(function (w) { return Object.assign({}, w, { hit: "caught" }); });
        setMin(function (m) { return Math.min(DAY_LEN, m + PREP_DELAY); });
        say(W.prep.caught + " · +" + PREP_DELAY + " min");
      }
      return;
    }
    // Checklist : les portes s'ouvrent. Chaque ligne cochée à ce moment-là rapporte CHECK_BONUS ; une seule fois.
    var fin = W.checklist ? arrivals.find(function (t) { return t.finale; }) : null;
    if (fin && wxRef.current.finale == null) {
      var n = readyCount(tasks, stRef.current), lines = tasks.filter(function (t) { return t.check; }).length;
      setWx(function (w) { return Object.assign({}, w, { finale: n, bonus: w.bonus + n * CHECK_BONUS }); });
      say(W.checklist.arrive + " · " + n + "/" + lines + " " + W.checklist.ok + (n ? " · +" + n * CHECK_BONUS + " rep" : ""));
      return;
    }
    var a = arrivals.filter(function (t) { return t.at > 0; }).pop();
    if (a) say(a.live ? (a.kind === "chat" ? (W.id === "office" ? "Colleagues at the coffee machine" : "People talking nearby")
      : a.kind === "call" ? "Incoming call" : a.kind === "counter" ? "A customer at the counter" : a.prep ? W.prep.arrive : a.kind === "announce" ? W.announce : a.from + " starting now")
      : a.kind === "voicemail" ? "New voicemail" : "New " + labelOf(a).toLowerCase() + (W.id === "office" ? " on your desk" : ""));
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
  var gain = repGain(rows) + wx.bonus;
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
      { modId: W.modId, world: W.id, parts: parts, repGain: gain, onTime: rows.filter(function (r) { return r.onTime; }).length, tasks: rows.length, stars: dayStars(sc, totalQs),
        prepared: W.prep ? wx.hit === "ready" : undefined,
        ready: W.checklist ? wx.finale : undefined, lines: W.checklist ? tasks.filter(function (t) { return t.check; }).length : undefined });
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
    if (!ok) mistakesRef.current.push({ tag: W.name + " · " + labelOf(t), prompt: q.q, yours: q.opts[i], correct: q.opts[q.c], why: q.x,
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
    if (t.prep && W.prep) {
      // La préparation (bulletin, point du matin) : son état s'affiche en haut ; comprise en entier = paré.
      var prepared = ok === t.qs.length;
      setWx(function (w) { return Object.assign({}, w, { known: true, label: t.prepLabel || null, prepared: prepared }); });
      say((t.prepLabel ? t.prepLabel + " today" : W.prep.doneLead) + " · " + (prepared ? W.prep.doneOk : W.prep.doneKo));
      return;
    }
    if (t.check && W.checklist) {
      // La ligne n'est nommée qu'ICI, une fois la tâche rendue : avant, elle soufflerait des réponses.
      say((ok === t.qs.length ? "✓ " : "~ ") + W.checklist.labels[t.check] + " · " + (ok === t.qs.length ? W.checklist.ok : W.checklist.ko + " (" + ok + "/" + t.qs.length + ")") + " · +" + (ok * 4 + (late ? 0 : 6)) + " rep");
      return;
    }
    say((W.id === "office" ? "Filed · " : "Done · ") + ok + "/" + t.qs.length + (late ? " · late" : "") + " · +" + (ok * 4 + (late ? 0 : 6)) + " rep");
  }
  function skipAhead() {
    var up = tasks.filter(function (t) { return st[t.id].status === "hidden"; }).map(function (t) { return t.at; });
    setMin(up.length ? Math.max(min, Math.min.apply(null, up)) : DAY_LEN);
  }

  // ── INTRO ──
  if (phase === "intro") {
    var nx0 = nextGrade(rep0);
    return (<>
      {landed && <div className="nf-arrive" />}
      <div className={landed ? "nf-intro landed" : "enter nf-intro"}>
        <button className="back-btn nf-intro-back" onClick={p.back}>{"← Back"}</button>
        <div className="nf-time out">8:58</div>
        <div className="nf-day">{W.company}</div>
        <div className="crd nf-notif">
          <Avatar who={W.person} />
          <div><div className="nf-notif-h"><b>{PEOPLE[W.person].name}</b><span>now</span></div><p>{day.brief}</p></div>
        </div>
        <div className="crd nf-badge">
          <div className="nf-lbl out">Your badge</div>
          <div className="nf-grade out">{grade.name}</div>
          {nx0 && <><span className="nf-bar"><i style={{ width: (100 * (rep0 - grade.rep) / (nx0.rep - grade.rep)) + "%" }} /></span>
            <div className="nf-small">{rep0 + " / " + nx0.rep + " rep · next: "}<b>{nx0.name}</b></div></>}
        </div>
        <ul className="nf-rules">{W.rules.map(function (r, i) { return <Rule key={i} r={r} />; })}</ul>
        <button className="btn1" onClick={function () { setPhase("day"); }}>Start the day</button>
      </div></>);
  }

  // ── FIN DE JOURNÉE ──
  if (phase === "end") {
    if (!answered) return (<>
      <div className="enter nf-intro">
        <div className="nf-time out">17:00</div>
        <div className="crd nf-review"><Avatar who={W.person} /><p>{W.empty}</p></div>
        <button className="btn1" onClick={p.back}>Back to the Waygates</button>
      </div></>);
    return (<>
      <SessionResult session={p.session} sid={sidRef.current} name={W.name} mistakes={mistakesRef.current}
        onContinue={function () { p.closeSession(); p.back(); }} onReplay={p.replaySession}>
        <DayReview rows={rows} sc={sc} totalQs={totalQs} rep0={rep0} gain={gain} person={W.person} hit={W.prep ? wx.hit : null} prep={W.prep} checklist={W.checklist} finale={wx.finale} />
      </SessionResult></>);
  }

  // ── LA JOURNÉE ──
  var answeredNow = answered, cur = view ? taskOf(view) : null, cs = cur ? st[cur.id] : null;
  var fb = cs && cs.answers.length > cs.qi;
  // Bandeau d'appel seulement PENDANT une autre tâche : au bureau, la ligne qui sonne est déjà en tête.
  var ringing = cur ? tasks.filter(function (t) { return st[t.id].status === "ringing" && t.id !== view; }) : [];
  var nx = nextGrade(rep0 + gain);
  return (<>
    <SessionTop n={totalQs} cur={fb ? Math.max(0, answeredNow - 1) : answeredNow} results={track.results} streak={track.streak} onQuit={p.back}
      onSheet={function (on) { pausedRef.current = on; }}
      aside={<span className={"nf-clock" + (min >= DAY_LEN - 60 ? " late" : "")}>{fmtClock(min)}</span>}
      sub={(W.checklist ? W.checklist.hud + ": " + readyCount(tasks, st) + "/" + tasks.filter(function (t) { return t.check; }).length + " · " : "") + (W.prep ? W.prep.hud + ": " + (wx.known ? wx.label || (wx.prepared ? W.prep.okWord : W.prep.koWord) : "?") + " · " : "") + grade.name + (nx ? " · " + (rep0 + gain) + " / " + nx.rep + " rep" : "")}
      quitCopy={W.quit} />
    <ComboBanner combo={track.combo} />
    {!cur && <Desk tasks={tasks} st={st} min={min} onOpen={open} onSkip={skipAhead} deskTitle={W.desk} waitLabel={W.wait} />}
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
          <button className="btn1" disabled={busy} onClick={function () { pickUp(t.id); }}>{busy ? "Busy" : pickLabel(t)}</button>
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
      <div className="nf-sec out">{p.deskTitle}</div>
      {!visible.length && (
        <div className="crd nf-empty">
          <p>{pending ? "Nothing on your desk right now." : "All clear."}</p>
          {pending && <button className="btn2" onClick={p.onSkip}>{p.waitLabel}</button>}
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
              {ring && <span className="nf-chip go">{pickLabel(t) + " · " + left + " min"}</span>}
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
      <div className="nf-review"><Avatar who={p.person} /><p>{review}</p></div>
      {p.hit && <div className="nf-review"><Avatar who={p.person} /><p>{p.hit === "ready" ? p.prep.reviewReady + " (+" + PREP_BONUS + " rep)." : p.prep.reviewCaught + ": " + PREP_DELAY + " minutes lost. " + p.prep.reviewCaughtTail}</p></div>}
      {p.checklist && <div className="nf-review"><Avatar who={p.person} /><p>{(p.finale != null
        ? p.checklist.opened + " " + p.finale + "/" + rows.filter(function (r) { return r.t.check; }).length + " " + p.checklist.ok + (p.finale ? " (+" + p.finale * CHECK_BONUS + " rep)." : ".")
        : p.checklist.none) + " " + rows.filter(function (r) { return r.t.check; }).map(function (r) {
          return (r.done && r.correct === r.t.qs.length ? "✓ " : r.done ? "~ " : "✗ ") + p.checklist.labels[r.t.check];
        }).join(" · ")}</p></div>}
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
