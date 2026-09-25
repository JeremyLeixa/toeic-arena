// Proto « monde événements » (2026-09-25) — moteur de prototypes/service-day/ (celui de Nine to Five, V3 :
// horloge + réputation). Un seul élément propre au monde, en deux variantes (paramètre e) :
//   e=1 Checklist + soirée : quatre lignes à cocher (lieu, traiteur, déco, invités), chacune liée à une tâche ; cochée si
//                            la tâche est rendue sans faute. À 16:00, l'événement ouvre ses portes (un direct P4) :
//                            +5 rep par ligne cochée. La journée a un point d'orgue. (Un peu de code moteur neuf.)
//   e=2 Prévu = paré       : le déroulé de la soirée, à lire le matin. Lu en entier, le pépin de dernière minute se règle
//                            en quelques minutes (+15 rep) ; sinon il coûte 45 min. Règle de Jet Lag et Front Desk,
//                            telle quelle : zéro code moteur neuf.
// Les questions sont celles du TOEIC, telles quelles : tout le jeu est autour, jamais à leur place.
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANY, DAY, DAY_LEN, DAY_START, GRADES, PEOPLE, REP_PER_CORRECT, REP_PER_TASK, CHECK_BONUS, PREP_BONUS, PREP_DELAY } from "./day.js";

var REP_START = 180;           // joueur simulé : Junior Associate, 70 points de la promotion
var REPLAY_COST = 15;          // minutes de jeu pour « Could you repeat that? »

function fmt(min) {
  var t = DAY_START + Math.max(0, Math.floor(min));
  var h = Math.floor(t / 60), m = t % 60;
  return h + ":" + (m < 10 ? "0" : "") + m;
}
function gradeOf(rep) {
  var g = GRADES[0];
  GRADES.forEach(function (x) { if (rep >= x.rep) g = x; });
  return g;
}
function nextGrade(rep) { return GRADES.find(function (x) { return x.rep > rep; }) || null; }
var KIND = {
  doc: { icon: "✉", label: "Email" },
  call: { icon: "☎", label: "Call" },
  chat: { icon: "☕", label: "Conversation" },
  voicemail: { icon: "◉", label: "Voicemail" },
  announce: { icon: "📢", label: "Announcement" },
  finale: { icon: "🎤", label: "The event" },
};
// Libellé du bouton quand ça sonne.
function pickLabel(t) { return t.kind === "call" ? "Pick up" : t.kind === "finale" ? "Go in" : "Listen"; }
// Variante E1 : état d'une ligne de la checklist. « ok » = tâche rendue sans faute ; « half » = rendue avec des erreurs ;
// « missed » = manquée ; null = pas encore traitée.
function checkOf(item, st) {
  var t = DAY.tasks.find(function (x) { return x.check === item.id; }), s = st[t.id];
  if (s.status === "missed") return "missed";
  if (s.status !== "done") return null;
  return t.qs.every(function (q, k) { return s.answers[k] === q.c; }) ? "ok" : "half";
}
function checkCount(st) { return DAY.checklist.filter(function (it) { return checkOf(it, st) === "ok"; }).length; }
var MARK = { ok: "✓", half: "~", missed: "✗" };
function kindLabel(t) { return t.kind === "doc" ? t.docType : KIND[t.kind].label; }
function isAudio(t) { return t.kind !== "doc"; }

// ── Audio : lecture séquentielle, interruptible ─────────────────────────────────────────────
var curAudio = null, audioToken = 0;
function stopAudio() { audioToken++; if (curAudio) { try { curAudio.pause(); } catch (e) { console.warn("[office] pause:", e && e.message); } curAudio = null; } }
function playOne(url, token) {
  return new Promise(function (res) {
    if (token !== audioToken) return res(true);
    var a = new Audio(url); curAudio = a;
    a.onended = function () { res(true); };
    a.onerror = function () { res(false); };
    a.play().catch(function (e) { console.warn("[office] play refused:", e && e.message); res(false); });
  });
}
async function playSeq(urls) {
  stopAudio(); var token = audioToken, ok = true;
  for (var i = 0; i < urls.length; i++) {
    if (token !== audioToken) return { aborted: true, ok: ok };
    var r = await playOne(urls[i], token);
    if (!r) { ok = false; await new Promise(function (res) { setTimeout(res, 1200); }); }
    if (i < urls.length - 1) await new Promise(function (res) { setTimeout(res, 350); });
  }
  return { aborted: token !== audioToken, ok: ok };
}

// Réputation gagnée : 4 par bonne réponse, 6 par tâche rendue (à l'heure, quand il y a une horloge).
function repGain(st, clock) {
  var g = 0;
  DAY.tasks.forEach(function (t) {
    var s = st[t.id];
    g += t.qs.filter(function (q, k) { return s.answers[k] === q.c; }).length * REP_PER_CORRECT;
    if (s.status === "done" && !(clock && t.due != null && s.doneAt > t.due)) g += REP_PER_TASK;
  });
  return g;
}

// ── État initial des tâches ────────────────────────────────────────────────────────────────
function initialState() {
  var s = {};
  DAY.tasks.forEach(function (t) { s[t.id] = { status: "hidden", qi: 0, answers: [], arrivedAt: null, doneAt: null, heard: false, replays: 0 }; });
  return s;
}
function simulatedEnd() {
  // start=end : 5 tâches sur 6, la conversation sur le traiteur manquée.
  var s = initialState();
  var picks = {};
  DAY.tasks.forEach(function (t) { if (t.id !== "t3") picks[t.id] = t.qs.map(function (q, k) { return k === 1 && (t.id === "t4" || t.id === "t5") ? (q.c + 1) % q.opts.length : q.c; }); });
  var done = { t1: 30, t2: 120, t4: 175, t5: 230, t6: 450 };
  DAY.tasks.forEach(function (t) {
    if (picks[t.id]) Object.assign(s[t.id], { status: "done", answers: picks[t.id], qi: t.qs.length, doneAt: done[t.id], arrivedAt: t.at });
    else Object.assign(s[t.id], { status: "missed", arrivedAt: t.at });
  });
  return s;
}

// ── Composant principal ────────────────────────────────────────────────────────────────────
export function OfficeDay(p) {
  var clock = p.v !== "2", career = p.v !== "1";
  var [phase, setPhase] = useState(p.start === "end" ? "end" : p.start === "desk" ? "desk" : "intro");
  var [min, setMin] = useState(p.start === "end" ? DAY_LEN : (p.at || 0));
  var [st, setSt] = useState(p.start === "end" ? simulatedEnd : initialState);
  var [active, setActive] = useState(null);
  var [toast, setToast] = useState(null);
  // Déroulé (E2) : lu une fois traité ; paré = compris en entier ; `hit` au pépin. Soirée (E1) : `finale` posé à l'ouverture
  // des portes, avec le nombre de lignes cochées à ce moment-là. `bonus` : la réputation gagnée par l'un ou l'autre.
  var [wx, setWx] = useState(function () {
    if (p.start !== "end") return { known: false, prepared: false, bonus: 0, hit: null, finale: null };
    var n = checkCount(simulatedEnd());
    return p.evt === "1" ? { known: true, prepared: false, bonus: n * CHECK_BONUS, hit: null, finale: n } : { known: true, prepared: false, bonus: 0, hit: "caught", finale: null };
  });
  var wxRef = useRef(wx); wxRef.current = wx;
  var minRef = useRef(min); minRef.current = min;

  var doneCount = DAY.tasks.filter(function (t) { return st[t.id].status === "done"; }).length;
  var resolved = DAY.tasks.every(function (t) { var s = st[t.id].status; return s === "done" || s === "missed"; });

  function patch(id, obj) { setSt(function (prev) { var n = Object.assign({}, prev); n[id] = Object.assign({}, prev[id], obj); return n; }); }
  function say(msg) { setToast({ msg: msg, k: Date.now() }); }
  useEffect(function () { if (!toast) return; var h = setTimeout(function () { setToast(null); }, 2600); return function () { clearTimeout(h); }; }, [toast]);

  // Horloge : 1 minute de jeu = 1/speed seconde réelle. Tourne pendant le bureau et les tâches.
  var running = clock && (phase === "desk" || phase === "task");
  useEffect(function () {
    if (!running) return;
    var h = setInterval(function () { setMin(function (m) { return Math.min(DAY_LEN, m + p.speed * 0.25); }); }, 250);
    return function () { clearInterval(h); };
  }, [running, p.speed]);

  // Arrivées et appels manqués.
  useEffect(function () {
    if (phase !== "desk" && phase !== "task") return;
    var changes = {}, arrivals = [], lost = [];
    DAY.tasks.forEach(function (t) {
      var s = st[t.id];
      if (s.status === "hidden" && (clock ? min >= t.at : doneCount >= t.afterDone)) {
        changes[t.id] = { status: t.ringFor ? "ringing" : "inbox", arrivedAt: min };
        arrivals.push(t);
      } else if (clock && s.status === "ringing" && t.ringFor && min >= s.arrivedAt + t.ringFor) {
        changes[t.id] = { status: "missed" };
        lost.push(t);
      }
    });
    if (!arrivals.length && !lost.length) return;
    setSt(function (prev) {
      var n = Object.assign({}, prev);
      Object.keys(changes).forEach(function (id) { n[id] = Object.assign({}, prev[id], changes[id]); });
      return n;
    });
    // E2 : le pépin de dernière minute. Déroulé lu en entier → réglé en quelques minutes, bonus ; sinon l'horloge saute.
    var hit = arrivals.find(function (x) { return x.prepHit; });
    if (hit && p.evt === "2" && !wxRef.current.hit) {
      if (wxRef.current.prepared) {
        setWx(function (w) { return Object.assign({}, w, { hit: "ready", bonus: PREP_BONUS }); });
        say("📋 A last-minute problem. You know the run of show: sorted · +" + PREP_BONUS + " rep");
      } else {
        setWx(function (w) { return Object.assign({}, w, { hit: "caught" }); });
        if (clock) setMin(function (m) { return Math.min(DAY_LEN, m + PREP_DELAY); });
        say("📋 A last-minute problem · +" + PREP_DELAY + " min to sort it out");
      }
      return;
    }
    // E1 : les portes s'ouvrent. Chaque ligne cochée à ce moment-là rapporte CHECK_BONUS. Une seule fois.
    var fin = arrivals.find(function (x) { return x.finale; });
    if (fin && p.evt === "1" && wxRef.current.finale == null) {
      var n = checkCount(st);
      setWx(function (w) { return Object.assign({}, w, { finale: n, bonus: n * CHECK_BONUS }); });
      say("🎤 Doors are open · " + n + "/" + DAY.checklist.length + " ready" + (n ? " · +" + n * CHECK_BONUS + " rep" : ""));
      return;
    }
    // Pas de toast pour le courrier déjà là à 9:00 : il est sur le bureau à l'ouverture.
    var t = arrivals.filter(function (x) { return x.ringFor || min > 0 || !clock; }).pop();
    if (t) say(t.kind === "doc" ? "New " + t.docType.toLowerCase() + " · " + t.subject : t.kind === "finale" ? "🎤 Doors are open" : t.kind === "chat" ? "💬 " + t.subject : "☎ " + t.from);
    else if (lost.length) say("Missed · " + lost[0].subject);
  }, [Math.floor(min), doneCount, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fin de journée : 17:00, ou tout traité.
  useEffect(function () {
    if (phase === "end" || phase === "intro") return;
    if ((clock && min >= DAY_LEN) || (resolved && phase === "desk")) { stopAudio(); setActive(null); setPhase("end"); }
  }, [min, resolved, phase, clock]);

  useEffect(function () { return stopAudio; }, []);

  function open(id) {
    var s = st[id];
    if (s.status === "ringing" || s.status === "inbox") patch(id, { status: "open" });
    setActive(id); setPhase("task");
  }
  function backToDesk() {
    var s = st[active];
    if (s && s.status === "open") patch(active, { status: "inbox" });
    stopAudio(); setActive(null); setPhase("desk");
  }
  function pickUp(id) {
    // Interruption : le document en cours reste sur le bureau, avec sa progression.
    if (active && st[active].status === "open") patch(active, { status: "inbox" });
    stopAudio(); open(id);
  }
  function answer(id, i) {
    patch(id, { answers: st[id].answers.concat([i]) });
  }
  function next(id) {
    var t = DAY.tasks.find(function (x) { return x.id === id; }), s = st[id];
    if (s.qi + 1 < t.qs.length) { patch(id, { qi: s.qi + 1 }); return; }
    var ok = t.qs.filter(function (q, k) { return s.answers[k] === q.c; }).length;
    var late = clock && t.due != null && minRef.current > t.due;
    patch(id, { qi: t.qs.length, status: "done", doneAt: minRef.current });
    stopAudio(); setActive(null); setPhase("desk");
    if (t.prep && p.evt === "2") {
      var prepared = ok === t.qs.length;
      setWx(function (w) { return Object.assign({}, w, { known: true, prepared: prepared }); });
      say("📋 Run of show read" + (prepared ? " · you know the evening" : " · some details slipped past you"));
      return;
    }
    if (t.check && p.evt === "1") {
      var item = DAY.checklist.find(function (x) { return x.id === t.check; });
      say(ok === t.qs.length ? "✓ " + item.label + " · ready" : "~ " + item.label + " · not quite (" + ok + "/" + t.qs.length + ")");
      return;
    }
    say("Done · " + ok + "/" + t.qs.length + (late ? " · late" : "") + (career ? " · +" + (ok * REP_PER_CORRECT + (late ? 0 : REP_PER_TASK)) + " rep" : ""));
  }
  function skipAhead() {
    var upcoming = DAY.tasks.filter(function (t) { return st[t.id].status === "hidden"; }).map(function (t) { return t.at; });
    setMin(upcoming.length ? Math.max(min, Math.min.apply(null, upcoming)) : DAY_LEN);
  }

  var ringing = DAY.tasks.filter(function (t) { return st[t.id].status === "ringing"; });
  var rep = REP_START + repGain(st, clock) + wx.bonus;

  return (
    <div className={"od od-v" + p.v}>
      {phase !== "intro" && phase !== "end" && <TopBar clock={clock} career={career} min={min} rep={rep} wx={wx} evt={p.evt} st={st} />}
      {phase === "intro" && <Intro clock={clock} career={career} speed={p.speed} evt={p.evt} onStart={function () { setPhase("desk"); }} />}
      {phase === "desk" && <Desk st={st} clock={clock} min={min} career={career} onOpen={open} onSkip={skipAhead}
        onEnd={function () { setPhase("end"); }} doneCount={doneCount} />}
      {phase === "task" && active && (
        <TaskView key={active} task={DAY.tasks.find(function (t) { return t.id === active; })} s={st[active]} clock={clock} min={min}
          onAnswer={function (i) { answer(active, i); }} onNext={function () { next(active); }} onBack={backToDesk}
          onHeard={function () { patch(active, { heard: true }); }}
          onReplay={function () { patch(active, { replays: st[active].replays + 1 }); if (clock) setMin(function (m) { return m + REPLAY_COST; }); }} />
      )}
      {phase === "task" && ringing.filter(function (t) { return t.id !== active; }).slice(0, 1).map(function (t) {
        var busy = active && isAudio(DAY.tasks.find(function (x) { return x.id === active; }));
        return <RingBanner key={t.id} t={t} s={st[t.id]} clock={clock} min={min} busy={busy} onPick={function () { pickUp(t.id); }} />;
      })}
      {phase === "end" && <EndOfDay st={st} clock={clock} career={career} min={min} wx={wx} evt={p.evt} onAgain={function () { location.reload(); }} />}
      {toast && <div className="od-toast" key={toast.k}>{toast.msg}</div>}
    </div>
  );
}

// ── Barre du haut ──────────────────────────────────────────────────────────────────────────
function TopBar(p) {
  var g = gradeOf(p.rep), nx = nextGrade(p.rep);
  var pct = nx ? (p.rep - g.rep) / (nx.rep - g.rep) : 1;
  var late = p.min >= DAY_LEN - 60;
  return (
    <div className="od-top">
      <div className="od-co"><span className="od-logo">🎤</span><span>{COMPANY}</span></div>
      {p.evt === "1"
        ? <div className="od-wx" title={DAY.checklist.map(function (it) { var c = checkOf(it, p.st); return (c ? MARK[c] : "○") + " " + it.label; }).join(" · ")}>{"✓ " + checkCount(p.st) + "/" + DAY.checklist.length + " ready"}</div>
        : <div className={"od-wx" + (p.wx.known ? "" : " od-wx-unk")} title="Run of show">{p.wx.known ? (p.wx.prepared ? "📋 Read" : "📋 Skimmed") : "📋 ?"}</div>}
      {p.clock && <div className={"od-clock" + (late ? " od-clock-late" : "")}>{fmt(p.min)}<span className="od-clock-bar"><i style={{ width: (100 * p.min / DAY_LEN) + "%" }} /></span></div>}
      {p.career && <div className="od-rep" title={p.rep + " rep"}><b>{g.name}</b><span className="od-rep-bar"><i style={{ width: (100 * pct) + "%" }} /></span></div>}
    </div>
  );
}

// ── Intro : le brief du matin ──────────────────────────────────────────────────────────────
function Intro(p) {
  var dana = PEOPLE.dana, g = gradeOf(REP_START), nx = nextGrade(REP_START);
  var realMin = Math.round(DAY_LEN / p.speed / 60);
  return (
    <div className="od-intro">
      <div className="od-lock-time">8:58</div>
      <div className="od-lock-day">{DAY.weekday} · {COMPANY}</div>
      <div className="od-notif">
        <Avatar who="dana" />
        <div>
          <div className="od-notif-h"><b>{dana.name}</b><span>now</span></div>
          <p>{DAY.brief}</p>
        </div>
      </div>
      {p.career && (
        <div className="od-badge">
          <div className="od-badge-l">Your badge</div>
          <div className="od-badge-n">{g.name}</div>
          <div className="od-rep-bar od-rep-bar-lg"><i style={{ width: (100 * (REP_START - g.rep) / (nx.rep - g.rep)) + "%" }} /></div>
          <div className="od-badge-s">{REP_START} / {nx.rep} rep · next: <b>{nx.name}</b></div>
        </div>
      )}
      <ul className="od-rules">
        {p.clock ? <>
          <li>Your day runs from <b>9:00 to 17:00</b> (about {realMin} minutes).</li>
          <li><b>Suppliers don't wait.</b> Neither do your clients.</li>
          {p.evt === "2"
            ? <li>Read the run of show carefully: <b>something always goes wrong on the day.</b></li>
            : <li>Clear your checklist <b>before the doors open at 16:00.</b></li>}
        </> : <>
          <li>Work arrives as you go. Take your time.</li>
          <li>Every task done well builds your reputation.</li>
        </>}
      </ul>
      <button className="od-btn od-btn-main" onClick={p.onStart}>Start the day</button>
    </div>
  );
}

function Avatar(p) {
  var who = PEOPLE[p.who];
  return <span className="od-av" style={{ background: "hsl(" + who.hue + " 45% 38%)" }}>{who.initials}</span>;
}

// ── Le bureau : la boîte de tâches ────────────────────────────────────────────────────────
function Desk(p) {
  var visible = DAY.tasks.filter(function (t) { var s = p.st[t.id].status; return s === "inbox" || s === "ringing" || s === "open"; });
  visible.sort(function (a, b) {
    var ra = p.st[a.id].status === "ringing" ? 0 : 1, rb = p.st[b.id].status === "ringing" ? 0 : 1;
    return ra - rb || (a.due == null ? 999 : a.due) - (b.due == null ? 999 : b.due);
  });
  var done = DAY.tasks.filter(function (t) { var s = p.st[t.id].status; return s === "done" || s === "missed"; });
  var pending = DAY.tasks.some(function (t) { return p.st[t.id].status === "hidden"; });
  return (
    <div className="od-desk">
      <div className="od-sec">Your list</div>
      {visible.length === 0 && (
        <div className="od-empty">
          <p>{pending ? "Nothing to handle right now." : "All clear."}</p>
          {p.clock && pending && <button className="od-btn" onClick={p.onSkip}>Double-check the seating plan · skip ahead</button>}
          {p.clock && !pending && <button className="od-btn od-btn-main" onClick={p.onEnd}>Call it a day</button>}
        </div>
      )}
      {visible.map(function (t) { return <TaskRow key={t.id} t={t} s={p.st[t.id]} clock={p.clock} min={p.min} onOpen={function () { p.onOpen(t.id); }} />; })}
      {done.length > 0 && <>
        <div className="od-sec">Done today · {done.filter(function (t) { return p.st[t.id].status === "done"; }).length}</div>
        {done.map(function (t) {
          var s = p.st[t.id], ok = t.qs.filter(function (q, k) { return s.answers[k] === q.c; }).length;
          var late = p.clock && s.status === "done" && t.due != null && s.doneAt > t.due;
          return (
            <div key={t.id} className={"od-row od-row-done" + (s.status === "missed" ? " od-row-missed" : "")}>
              <span className="od-ico">{KIND[t.kind].icon}</span>
              <div className="od-row-b"><div className="od-row-s">{t.subject}</div></div>
              <span className="od-chip">{s.status === "missed" ? "missed" : ok + "/" + t.qs.length + (late ? " · late" : "")}</span>
            </div>
          );
        })}
      </>}
    </div>
  );
}

function TaskRow(p) {
  var t = p.t, s = p.s, ring = s.status === "ringing";
  var left = ring && p.clock ? Math.max(0, Math.ceil(s.arrivedAt + t.ringFor - p.min)) : null;
  var overdue = p.clock && t.due != null && p.min > t.due;
  var soon = p.clock && t.due != null && !overdue && t.due - p.min <= 45;
  var started = s.answers.length > 0;
  return (
    <button className={"od-row" + (ring ? " od-row-ring" : "")} onClick={p.onOpen}>
      <span className="od-ico">{KIND[t.kind].icon}</span>
      <div className="od-row-b">
        <div className="od-row-f">{t.from}</div>
        <div className="od-row-s">{t.subject}</div>
        <div className="od-row-ask"><Avatar who={t.ask.who} />{t.ask.text}</div>
      </div>
      <div className="od-row-r">
        {ring && <span className="od-chip od-chip-ring">{pickLabel(t)}{left != null ? " · " + left + " min" : ""}</span>}
        {!ring && p.clock && t.due != null && <span className={"od-chip" + (overdue ? " od-chip-late" : soon ? " od-chip-soon" : "")}>{overdue ? "overdue" : "due " + fmt(t.due)}</span>}
        {started && <span className="od-chip">{s.answers.length}/{t.qs.length}</span>}
      </div>
    </button>
  );
}

// ── Bandeau d'appel pendant une autre tâche ────────────────────────────────────────────────
function RingBanner(p) {
  var left = p.clock ? Math.max(0, Math.ceil(p.s.arrivedAt + p.t.ringFor - p.min)) : null;
  return (
    <div className="od-ring">
      <span className="od-ring-ico">{KIND[p.t.kind].icon}</span>
      <div className="od-ring-b"><b>{p.t.from.split(" · ")[0]}</b><span>{p.t.subject}{left != null ? " · " + left + " min" : ""}</span></div>
      <button className="od-btn od-btn-ring" disabled={p.busy} onClick={p.onPick}>{p.busy ? "Busy" : pickLabel(p.t)}</button>
    </div>
  );
}

// ── Une tâche ──────────────────────────────────────────────────────────────────────────────
function TaskView(p) {
  var t = p.task, s = p.s, audio = isAudio(t);
  var [playing, setPlaying] = useState(false);
  var [audioFail, setAudioFail] = useState(false);
  var [showScript, setShowScript] = useState(false);
  var q = t.qs[Math.min(s.qi, t.qs.length - 1)];
  var picked = s.answers.length > s.qi ? s.answers[s.qi] : null;
  var locked = audio && (!s.heard || playing);

  function listen() {
    setPlaying(true);
    playSeq(t.audio).then(function (r) {
      if (r.aborted) return;
      setPlaying(false); if (!r.ok) setAudioFail(true); p.onHeard();
    });
  }
  // Appel et conversation : ça démarre quand on décroche (le tap sur « Pick up » est le geste utilisateur).
  useEffect(function () { if (audio && t.kind !== "voicemail" && !s.heard) listen(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  var canLeave = !audio || t.kind === "voicemail";
  return (
    <div className="od-task">
      <div className="od-task-h">
        {canLeave ? <button className="od-back" onClick={p.onBack}>← Desk</button> : <span className="od-live">● Live</span>}
        <span className="od-task-k">{KIND[t.kind].icon} {kindLabel(t)}</span>
        <span className="od-task-n">{Math.min(s.qi + 1, t.qs.length)}/{t.qs.length}</span>
      </div>

      {t.kind === "doc" ? <Document t={t} /> : (
        <div className={"od-call od-call-" + t.kind}>
          <div className="od-call-who">{t.from}</div>
          <div className="od-call-sub">{t.subject}</div>
          <div className={"od-wave" + (playing ? " od-wave-on" : "")}>{[0, 1, 2, 3, 4, 5, 6].map(function (i) { return <i key={i} style={{ animationDelay: (i * 0.11) + "s" }} />; })}</div>
          {t.kind === "voicemail" && !s.heard && !playing && <button className="od-btn od-btn-main" onClick={listen}>▶ Play message</button>}
          {playing && <div className="od-call-state">{t.kind === "voicemail" ? "Playing message…" : "Listening…"} <span>read the questions below</span></div>}
          {s.heard && !playing && s.replays < 1 && s.qi < t.qs.length && picked == null && (
            <button className="od-link" onClick={function () { p.onReplay(); listen(); }}>
              {t.kind === "voicemail" ? "Play it again" : "“Sorry, could you repeat that?”"}{p.clock ? " · costs " + REPLAY_COST + " min" : ""}
            </button>
          )}
          {audioFail && <div className="od-note">Audio unavailable in this preview. Read the transcript below.</div>}
          {(audioFail || (s.heard && picked != null)) && (
            <button className="od-link" onClick={function () { setShowScript(!showScript); }}>{showScript || audioFail ? "Transcript" : "Show transcript"}</button>
          )}
          {(showScript || audioFail) && <Transcript t={t} />}
        </div>
      )}

      {audio && locked ? (
        // Comme au TOEIC (Parts 3 et 4) : toutes les questions se lisent AVANT et PENDANT l'écoute,
        // on n'y répond qu'à la fin. C'est l'anticipation qu'on entraîne.
        <div className="od-q">
          <div className="od-q-lock">{playing ? "Read ahead: answers open when the audio ends" : "Read ahead, then listen"}</div>
          {t.qs.map(function (qq, k) {
            return (
              <div key={k} className="od-pre">
                <div className="od-q-t">{k + 1}. {qq.q}</div>
                <div className="od-pre-o">{qq.opts.map(function (o, i) { return <span key={i}><b>{"ABCD"[i]}</b> {o}</span>; })}</div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="od-q">
        {audio && <div className="od-q-t od-q-k">Question {s.qi + 1} of {t.qs.length}</div>}
        <div className="od-q-t">{q.q}</div>
        <div className="od-opts">
          {q.opts.map(function (o, i) {
            var cls = "od-opt";
            if (picked != null) { if (i === q.c) cls += " od-opt-ok"; else if (i === picked) cls += " od-opt-ko"; else cls += " od-opt-dim"; }
            return <button key={i} className={cls} disabled={locked || picked != null} onClick={function () { p.onAnswer(i); }}><span className="od-opt-l">{"ABCD"[i]}</span>{o}</button>;
          })}
        </div>
        {picked != null && (
          <div className={"od-fb " + (picked === q.c ? "od-fb-ok" : "od-fb-ko")}>
            <b>{picked === q.c ? "Right." : "Not quite."}</b> {q.x || (picked === q.c ? "" : "The answer: " + q.opts[q.c] + ".")}
            <button className="od-btn od-btn-main" onClick={p.onNext}>{s.qi + 1 < t.qs.length ? "Next" : t.kind === "doc" ? "File it" : "Done"}</button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

function Document(p) {
  var lines = p.t.text.split("\n"), head = [], i = 0;
  while (i < lines.length && /^(From|To|Subject|Date|Cc):/.test(lines[i])) { head.push(lines[i]); i++; }
  var body = lines.slice(i).join("\n").replace(/^\n+/, "");
  return (
    <div className={"od-doc od-doc-" + p.t.docType.toLowerCase()}>
      {head.length > 0 && <div className="od-doc-head">{head.map(function (h, k) { var j = h.indexOf(":"); return <div key={k}><span>{h.slice(0, j)}</span>{h.slice(j + 1)}</div>; })}</div>}
      <div className="od-doc-body">{body}</div>
    </div>
  );
}

function Transcript(p) {
  if (p.t.lines) return <div className="od-script">{p.t.lines.map(function (l, i) { return <p key={i}><b>{l.s === "W" ? "Woman" : "Man"}:</b> {l.t}</p>; })}</div>;
  return <div className="od-script"><p>{p.t.text}</p></div>;
}

// ── Fin de journée ─────────────────────────────────────────────────────────────────────────
function EndOfDay(p) {
  var rows = DAY.tasks.map(function (t) {
    var s = p.st[t.id], ok = t.qs.filter(function (q, k) { return s.answers[k] === q.c; }).length;
    var status = s.status === "done" ? (p.clock && t.due != null && s.doneAt > t.due ? "late" : "done")
      : s.status === "missed" ? "missed" : s.status === "hidden" ? "never came" : "left on desk";
    return { t: t, ok: ok, answered: s.answers.length, status: status };
  });
  var totalQ = rows.reduce(function (a, r) { return a + r.t.qs.length; }, 0);
  var correct = rows.reduce(function (a, r) { return a + r.ok; }, 0);
  var onTime = rows.filter(function (r) { return r.status === "done"; }).length;
  var acc = correct / totalQ;
  var stars = acc >= 0.85 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
  var gain = repGain(p.st, p.clock) + (p.wx ? p.wx.bonus : 0);
  var rep1 = REP_START + gain, g0 = gradeOf(REP_START), g1 = gradeOf(rep1), promoted = g1.rep > g0.rep;
  var missed = rows.filter(function (r) { return r.status === "missed" || r.status === "left on desk" || r.status === "never came"; });
  var review = acc >= 0.85 && !missed.length ? "Great day. Everything handled, and handled right. Keep that up."
    : acc >= 0.7 ? (missed.length ? "Solid work on what you picked up. " + missed[0].t.subject + " slipped through, though." : "Good day. A couple of details to watch, nothing serious.")
    : acc >= 0.5 ? "We got through it. Read the details more carefully tomorrow: that's where the mistakes were."
    : "Tough day. Let's go through it together tomorrow morning.";

  var [shown, setShown] = useState(REP_START);
  useEffect(function () {
    if (!p.career) return;
    // Minuteur plutôt que requestAnimationFrame : rAF est gelé dans un onglet ou un panneau masqué.
    var t0 = Date.now() + 500, h = setInterval(function () {
      var k = Math.max(0, Math.min(1, (Date.now() - t0) / 1400));
      setShown(Math.round(REP_START + gain * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(h);
    }, 30);
    return function () { clearInterval(h); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  var gs = gradeOf(shown), ns = nextGrade(shown);

  return (
    <div className="od-end">
      <div className="od-end-time">{p.clock && p.min >= DAY_LEN ? "17:00" : "End of day"}</div>
      <h2>{DAY.weekday} is done</h2>
      {p.evt === "2" && p.wx.hit && <div className="od-review od-wx-line"><p>{p.wx.hit === "ready" ? "📋 The last-minute problem took five minutes: you knew the run of show. +" + PREP_BONUS + " rep." : "📋 The last-minute problem cost you " + PREP_DELAY + " minutes. The run of show had the answer."}</p></div>}
      {p.evt === "1" && <div className="od-review od-wx-line"><p>{p.wx.finale != null ? "🎤 Doors opened with " + p.wx.finale + "/" + DAY.checklist.length + " ready" + (p.wx.finale ? ": +" + p.wx.finale * CHECK_BONUS + " rep." : ".") : "🎤 The day ended before the doors opened."}<br />{DAY.checklist.map(function (it) { var c = checkOf(it, p.st); return (c ? MARK[c] : "○") + " " + it.label; }).join("   ")}</p></div>}
      {!p.career && <div className="od-stars">{[0, 1, 2].map(function (i) { return <span key={i} className={i < stars ? "on" : ""}>★</span>; })}</div>}
      <div className="od-review"><Avatar who="dana" /><p>{review}</p></div>
      <div className="od-end-nums">
        <div><b>{correct}/{totalQ}</b><span>answers right</span></div>
        <div><b>{onTime}/{rows.length}</b><span>{p.clock ? "tasks on time" : "tasks done"}</span></div>
      </div>
      <div className="od-end-rows">
        {rows.map(function (r) {
          return (
            <div key={r.t.id} className={"od-end-row od-st-" + r.status.replace(/ /g, "-")}>
              <span className="od-ico">{KIND[r.t.kind].icon}</span>
              <span className="od-end-s">{r.t.subject}</span>
              <span className="od-chip">{r.answered ? r.ok + "/" + r.t.qs.length : ""}{r.status !== "done" ? (r.answered ? " · " : "") + r.status : ""}</span>
            </div>
          );
        })}
      </div>
      {p.career && (
        <div className={"od-badge od-badge-end" + (promoted && shown >= g1.rep ? " od-promoted" : "")}>
          <div className="od-badge-l">Reputation · +{gain}</div>
          <div className="od-badge-n">{gs.name}</div>
          <div className="od-rep-bar od-rep-bar-lg"><i style={{ width: (ns ? 100 * (shown - gs.rep) / (ns.rep - gs.rep) : 100) + "%" }} /></div>
          <div className="od-badge-s">{shown} / {ns ? ns.rep : "max"} rep</div>
          {promoted && shown >= g1.rep && (
            <div className="od-promo">
              <div className="od-promo-t">Promoted</div>
              <div>You are now <b>{g1.name}</b>.</div>
              <div className="od-promo-u">Unlocked: {g1.unlock}</div>
            </div>
          )}
        </div>
      )}
      <div className="od-note">Au câblage : XP, coffres et trophées passent par l'écran de fin commun (SessionResult) ; ce bilan en serait la carte du module.</div>
      <button className="od-btn od-btn-main" onClick={p.onAgain}>Play again</button>
    </div>
  );
}
