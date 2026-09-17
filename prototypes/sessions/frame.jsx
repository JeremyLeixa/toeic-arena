// Proto sessions (2026-09-17, audit visuel lot 4) — une manche de Drill jouable (vraies questions,
// vrais sons) et l'écran d'écoute de la Part 2, dans une variante. CSS de l'appli + sessions.css.
// Paramètres d'URL :
//   v=A|B|C|D  screen=drill|p2  st=live|q|ok|combo|ko (drill) · idle|playing|answer (p2)
//   mode=dark|light  skin=<id>  rm=1
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { Bar } from "../../src/components/Bar.jsx";
import { GIcon } from "../../src/components/icons.jsx";
import { QUESTIONS } from "../../src/data/grammar.js";
import { LISTENING_P2 } from "../../src/data/listening.js";
import { playCorrect, playWrong, playCombo, playStreak } from "../../src/sounds.js";
import SESS from "./sessions.css?raw";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "A";
var SCREEN = q.get("screen") === "p2" ? "p2" : "drill";
var ST = q.get("st") || (SCREEN === "p2" ? "idle" : "live");
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var RM = q.get("rm") === "1";
var noop = function () {};
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

// 10 vraies questions ; la 6e a l'explication la plus longue du pool (g249).
var QS = QUESTIONS.slice(0, 10);
QS[5] = QUESTIONS.find(function (x) { return x.id === "g249"; }) || QS[5];
var COMBO_AT = [3, 5, 7, 10];

function sfx(fn) { try { fn(); } catch (e) { console.warn("[proto] sfx:", e && e.message); } }
function streakOf(res) { var n = 0; for (var i = res.length - 1; i >= 0 && res[i]; i--) n++; return n; }

// État de départ selon le préréglage (captures fixes) ; « live » = manche jouable depuis le début.
function preset() {
  if (ST === "q") return { ci: 3, res: [1, 0, 1], sel: -1, ph: "q" };
  if (ST === "ok") return { ci: 1, res: [0, 1], sel: QS[1].c, ph: "fb" };
  if (ST === "combo") return { ci: 3, res: [0, 1, 1, 1], sel: QS[3].c, ph: "fb" };
  if (ST === "ko") return { ci: 5, res: [1, 1, 1, 1, 1, 0], sel: (QS[5].c + 1) % QS[5].o.length, ph: "fb" };
  return { ci: 0, res: [], sel: -1, ph: "q" };
}

function useSession() {
  var [s, setS] = useState(preset);
  var [burst, setBurst] = useState(0); // incrémenté à chaque palier de combo (animation)
  function answer(i) {
    if (s.ph !== "q") return;
    var qq = QS[s.ci], ok = i === qq.c, res = s.res.concat([ok ? 1 : 0]);
    if (ok) {
      sfx(playCorrect);
      var st = streakOf(res);
      if (COMBO_AT.indexOf(st) !== -1) { setTimeout(function () { sfx(st >= 7 ? playStreak : playCombo); }, 260); setBurst(function (b) { return b + 1; }); }
    } else sfx(playWrong);
    setS({ ci: s.ci, res: res, sel: i, ph: "fb" });
  }
  function next() {
    if (s.ci >= QS.length - 1) { setS({ ci: 0, res: [], sel: -1, ph: "q" }); return; }
    setS({ ci: s.ci + 1, res: s.res, sel: -1, ph: "q" });
  }
  return { s: s, answer: answer, next: next, burst: burst, streak: streakOf(s.res) };
}

// Options : rendu actuel de l'appli (pas l'objet du proto), commun aux variantes.
function Options(p) {
  var qq = QS[p.s.ci], sr = p.s.ph === "fb";
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{qq.o.map(function (opt, i) {
    var iS = p.s.sel === i, iC = i === qq.c, bg = "var(--bg2)", bd = "var(--bdr)";
    if (sr && iC) { bg = "rgba(0,230,118,.12)"; bd = "var(--green)"; } else if (sr && iS && !iC) { bg = "rgba(255,71,87,.12)"; bd = "var(--red)"; }
    return <button key={i} onClick={function () { p.answer(i); }} disabled={sr} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: bg, border: "1px solid " + bd, borderRadius: 12, cursor: sr ? "default" : "pointer", fontSize: 15, color: "var(--t1)", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid " + (sr && iC ? "var(--green)" : sr && iS ? "var(--red)" : "var(--t3)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, background: sr && iC ? "var(--green)" : sr && iS && !iC ? "var(--red)" : "transparent", color: sr && (iC || iS) ? "#fff" : "var(--t3)" }}>
        {sr && iC ? "✓" : sr && iS ? "✗" : String.fromCharCode(65 + i)}</div><span>{opt}</span></button>;
  })}</div>;
}
function Stem(p) {
  var qq = QS[p.s.ci];
  return <>
    <span className="out" style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, display: "block" }}>{qq.cat}</span>
    <h2 className="qstem" style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.5, marginBottom: 24, marginTop: 8 }}>{qq.s}</h2>
  </>;
}
function answerLetter(qq) { return String.fromCharCode(65 + qq.c) + ". " + qq.o[qq.c]; }

// Quitter une session (B, C, D : plus de tab bar, donc une sortie explicite avec confirmation).
function Quit(p) {
  if (!p.open) return null;
  return <div className="ss-quit" onClick={p.onClose}>
    <div className="crd ss-quit-card" onClick={function (e) { e.stopPropagation(); }}>
      <div className="out" style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Leave this round?</div>
      <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: 14 }}>Your answers in this round won't be saved.</p>
      <button className="btn1" onClick={p.onClose}>Keep going</button>
      <button className="btn2" onClick={p.onClose} style={{ marginTop: 8, width: "100%" }}>Leave</button>
    </div>
  </div>;
}

// Barre segmentée : une case par question, verte / rouge une fois répondue, la courante marquée.
function Segments(p) {
  var n = p.n, done = p.res.length;
  return <div className={"ss-seg " + (p.kind || "")}>{Array.from({ length: n }, function (_, i) {
    var cls = i < done ? (p.res[i] ? "ok" : "ko") : i === p.ci ? "cur" : "";
    return <i key={i} className={cls} />;
  })}</div>;
}

// ═══ A · Actuel ═══
function DrillA() {
  var x = useSession(), s = x.s, qq = QS[s.ci];
  return <div className={"pg-wrap"}>
    <div style={{ padding: "20px 16px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="back-btn">{"←"} Back</button>
        <span className="out" style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{s.ci + 1}/{QS.length}</span></div>
      <Bar value={s.ci} max={QS.length} h={4} />
      <Stem s={s} />
      <Options s={s} answer={x.answer} />
      {s.ph === "fb" && <div style={{ marginTop: 20, animation: "fadeIn .3s" }}><div className="crd" style={{ background: "rgba(var(--cx),.06)", borderColor: "rgba(var(--cx),.15)", padding: 16 }}><p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{qq.x}</p></div>
        <button className="btn1" onClick={x.next} style={{ marginTop: 16 }}>{s.ci < QS.length - 1 ? "Next" : "See Results"}</button></div>}
    </div>
    <Tabs cur="train" go={noop} />
  </div>;
}

// ═══ B · Focus ═══ tab bar masquée ; barre du haut : quitter, segments, compteur ou combo ;
// retour de réponse en panneau fixe en bas (verdict, bonne réponse, explication lisible, Next).
function DrillB() {
  var x = useSession(), s = x.s, qq = QS[s.ci], ok = s.ph === "fb" && s.sel === qq.c;
  var [quit, setQuit] = useState(false);
  return <div>
    <div className="ss-top">
      <button className="ss-x" onClick={function () { setQuit(true); }} aria-label="Leave">{"✕"}</button>
      <Segments n={QS.length} res={s.res} ci={s.ci} />
      {x.streak >= 3 ? <span key={x.burst} className="ss-combo"><GIcon name="flame" size={14} color="currentColor" />{"×" + x.streak}</span>
        : <span className="out ss-count">{s.ci + 1}/{QS.length}</span>}
    </div>
    <div style={{ padding: "8px 16px", paddingBottom: s.ph === "fb" ? 260 : 40 }}>
      <Stem s={s} />
      <Options s={s} answer={x.answer} />
    </div>
    {s.ph === "fb" && <div className={"ss-sheet " + (ok ? "ok" : "ko")}>
      <div className="ss-verdict">
        <span className="ss-vicon">{ok ? "✓" : "✗"}</span>
        <div><b className="out">{ok ? (x.streak >= 3 ? "Correct · " + x.streak + " in a row" : "Correct") : "Not quite"}</b>
          {!ok && <small>{"Answer: " + answerLetter(qq)}</small>}</div>
      </div>
      <p className="ss-why">{qq.x}</p>
      <button className="btn1" onClick={x.next}>{s.ci < QS.length - 1 ? "Next" : "See Results"}</button>
    </div>}
    <Quit open={quit} onClose={function () { setQuit(false); }} />
  </div>;
}

// ═══ C · Arène ═══ tab bar masquée ; pastilles de progression ; bannière COMBO au centre ;
// retour intégré sous les options (bandeau verdict + « Why ») ; Next toujours en bas de l'écran.
function DrillC() {
  var x = useSession(), s = x.s, qq = QS[s.ci], ok = s.ph === "fb" && s.sel === qq.c;
  var [quit, setQuit] = useState(false);
  var [showBurst, setShowBurst] = useState(false);
  // Bannière au préréglage « combo » (capture) et à chaque palier atteint en jouant.
  useEffect(function () {
    if (!x.burst && ST !== "combo") return;
    setShowBurst(true);
    var t = setTimeout(function () { setShowBurst(false); }, 1400);
    return function () { clearTimeout(t); };
  }, [x.burst]);
  return <div>
    <div className="ss-top c">
      <button className="back-btn" style={{ marginBottom: 0 }} onClick={function () { setQuit(true); }}>{"←"}</button>
      <Segments n={QS.length} res={s.res} ci={s.ci} kind="pips" />
      <span className="out ss-count">{s.ci + 1}/{QS.length}</span>
    </div>
    {x.streak >= 3 && <div className="ss-flame"><GIcon name="flame" size={13} color="currentColor" />{x.streak + " in a row"}</div>}
    <div style={{ padding: "4px 16px 110px" }}>
      <Stem s={s} />
      <Options s={s} answer={x.answer} />
      {s.ph === "fb" && <div className={"crd ss-card " + (ok ? "ok" : "ko")}>
        <div className="ss-band out">{ok ? "✓ Correct" : "✗ Wrong · " + answerLetter(qq)}</div>
        <div className="ss-whylabel out">Why</div>
        <p className="ss-why">{qq.x}</p>
      </div>}
    </div>
    {s.ph === "fb" && <div className="ss-foot"><button className="btn1" onClick={x.next}>{s.ci < QS.length - 1 ? "Next question" : "See Results"}</button></div>}
    {showBurst && x.streak >= 3 && <div key={x.burst} className="ss-burst out"><GIcon name="flame" size={30} color="currentColor" /><span>{"Combo ×" + x.streak}</span></div>}
    <Quit open={quit} onClose={function () { setQuit(false); }} />
  </div>;
}

// ═══ D · Aldric ═══ tab bar masquée ; fil d'encre segmenté ; le verdict est une note d'Aldric sur
// parchemin (cohérent avec l'écran de fin) ; combo en sceau de cire.
var WELL = ["Well struck.", "A clean blow.", "The Arena nods.", "Precisely so."];
function DrillD() {
  var x = useSession(), s = x.s, qq = QS[s.ci], ok = s.ph === "fb" && s.sel === qq.c;
  var [quit, setQuit] = useState(false);
  return <div>
    <div className="ss-top d">
      <button className="ss-x" onClick={function () { setQuit(true); }} aria-label="Leave">{"✕"}</button>
      <Segments n={QS.length} res={s.res} ci={s.ci} kind="ink" />
      {x.streak >= 3 ? <span key={x.burst} className="ss-wax out">{"×" + x.streak}</span> : <span className="out ss-count">{s.ci + 1}/{QS.length}</span>}
    </div>
    <div style={{ padding: "8px 16px", paddingBottom: s.ph === "fb" ? 280 : 40 }}>
      <Stem s={s} />
      <Options s={s} answer={x.answer} />
    </div>
    {s.ph === "fb" && <div className="ss-note">
      <div className="ss-note-roll" />
      <div className="ss-note-parch">
        <p className="ss-note-verdict">{ok ? WELL[s.ci % WELL.length] + (x.streak >= 3 ? " " + x.streak + " strikes in a row." : "") : "Not this time. The answer was " + answerLetter(qq) + "."}</p>
        <p className="ss-note-why">{qq.x}</p>
        <button className="btn1" onClick={x.next}>{s.ci < QS.length - 1 ? "Next" : "See Results"}</button>
      </div>
    </div>}
    <Quit open={quit} onClose={function () { setQuit(false); }} />
  </div>;
}

// ═══ Part 2 : écran d'écoute ═══
var P2 = LISTENING_P2[0];
function useListen() {
  var [ph, setPh] = useState(ST); // idle | playing | answer
  var [pick, setPick] = useState(-1);
  function play() {
    if (ph !== "idle") return;
    setPh("playing");
    setTimeout(function () { setPh("answer"); }, 3200);
  }
  return { ph: ph, play: play, pick: pick, setPick: setPick };
}
function P2Options(p) {
  if (p.l.ph !== "answer") return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28, textAlign: "left" }}>
    {["A", "B", "C"].map(function (L, i) {
      var on = p.l.pick === i;
      return <button key={L} onClick={function () { p.l.setPick(i); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: on ? "rgba(var(--cx),.12)" : "var(--bg2)", border: "1px solid " + (on ? "var(--cyan)" : "var(--bdr)"), borderRadius: 12, fontSize: 15, color: "var(--t1)", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--t3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--t3)" }}>{L}</div>
        <span>{"Response " + L}</span></button>;
    })}
  </div>;
}
function Wave() { return <span className="ss-wave">{[0, 1, 2, 3, 4].map(function (i) { return <i key={i} style={{ animationDelay: (i * 0.12) + "s" }} />; })}</span>; }
function PlayGlyph(p) { return <svg viewBox="0 0 24 24" width={p.size} height={p.size} style={{ display: "block", marginLeft: p.size * 0.12 }}><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>; }

function P2A() {
  var l = useListen(), playing = l.ph === "playing";
  return <div className="pg-wrap"><div style={{ padding: "20px 16px", minHeight: "100vh" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <button className="back-btn">{"←"} Back</button>
      <span className="out" style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>3/10</span></div>
    <Bar value={2} max={10} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)" />
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <div className="out" style={{ fontSize: 11, color: "var(--orange)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 24 }}>Part 2 — Question-Response</div>
      {l.ph !== "answer" ? <div>
        <button onClick={l.play} disabled={playing} style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: playing ? "rgba(255,140,66,.2)" : "linear-gradient(135deg,#f59e0b,#ef4444)", cursor: playing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: playing ? "pulse 1.5s infinite" : "none" }}>
          <span style={{ fontSize: 32 }}>{playing ? "🔊" : "▶️"}</span></button>
        <p className="out" style={{ color: playing ? "var(--orange)" : "var(--t2)", fontSize: 14, fontWeight: 600 }}>{playing ? "Listening..." : "Tap to play audio"}</p>
      </div> : <p className="out" style={{ color: "var(--green)", fontSize: 14, fontWeight: 600 }}>Audio complete — choose your answer</p>}
      <P2Options l={l} />
    </div>
  </div><Tabs cur="train" go={noop} /></div>;
}
function P2Top(p) {
  return <div className={"ss-top " + (p.kind || "")}>
    <button className="ss-x" aria-label="Leave">{"✕"}</button>
    <Segments n={10} res={[1, 1]} ci={2} kind={p.seg} />
    <span className="out ss-count">3/10</span>
  </div>;
}
// B : disque aux couleurs du skin, glyphe play net, égaliseur pendant la lecture.
function P2B() {
  var l = useListen(), playing = l.ph === "playing";
  return <div><P2Top />
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <div className="out" style={{ fontSize: 11, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 28 }}>Part 2 — Question-Response</div>
      {l.ph !== "answer" ? <>
        <button className={"ss-play b" + (playing ? " on" : "")} onClick={l.play} disabled={playing}>{playing ? <Wave /> : <PlayGlyph size={34} />}</button>
        <p className="out ss-playlbl">{playing ? "Listening…" : "Tap to listen · plays once"}</p>
      </> : <p className="out ss-playlbl done"><GIcon name="check-mark" size={14} color="currentColor" /> Choose the best response</p>}
      <P2Options l={l} />
    </div></div>;
}
// C : anneau runique qui tourne pendant la lecture, cloche au centre.
function P2C() {
  var l = useListen(), playing = l.ph === "playing";
  return <div><P2Top kind="c" seg="pips" />
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <div className="out" style={{ fontSize: 11, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 24 }}>Part 2 — Question-Response</div>
      {l.ph !== "answer" ? <>
        <button className={"ss-play c" + (playing ? " on" : "")} onClick={l.play} disabled={playing}>
          <span className="ss-rune" /><span className="ss-core">{playing ? <GIcon name="ringing-bell" size={40} color="currentColor" /> : <PlayGlyph size={38} />}</span>
        </button>
        {playing && <div style={{ marginTop: 14 }}><Wave /></div>}
        <p className="out ss-playlbl">{playing ? "Listening…" : "Tap to listen · plays once"}</p>
      </> : <p className="out ss-playlbl done">Choose the best response</p>}
      <P2Options l={l} />
    </div></div>;
}
// D : sceau de cire, ondes d'encre pendant la lecture.
function P2D() {
  var l = useListen(), playing = l.ph === "playing";
  return <div><P2Top kind="d" seg="ink" />
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <div className="out" style={{ fontSize: 11, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 28 }}>Part 2 — Question-Response</div>
      {l.ph !== "answer" ? <>
        <button className={"ss-play d" + (playing ? " on" : "")} onClick={l.play} disabled={playing}>
          {playing && <><i className="ss-ripple" /><i className="ss-ripple r2" /></>}<PlayGlyph size={32} />
        </button>
        <p className="out ss-playlbl">{playing ? "Listening…" : "Tap to listen · plays once"}</p>
      </> : <p className="out ss-playlbl done">Choose the best response</p>}
      <P2Options l={l} />
    </div></div>;
}

var SCREENS = { drill: { A: DrillA, B: DrillB, C: DrillC, D: DrillD }, p2: { A: P2A, B: P2B, C: P2C, D: P2D } };

function Frame() {
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "") + " ss-" + V;
  var S = SCREENS[SCREEN][V];
  return <div className={lc}>
    <style>{CSS}</style>
    <style>{SESS}</style>
    {RM && <style>{RM_CSS}</style>}
    <S />
  </div>;
}

var el = document.getElementById("root");
(el.__ssRoot || (el.__ssRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
