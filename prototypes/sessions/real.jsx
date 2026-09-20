// Banc du HUD de session câblé (2026-09-17) : les VRAIS composants de src/components/SessionHud.jsx et
// useSessionTrack, dans un faux pg() (.app > .pg-wrap + vraie tab bar), pour vérifier le masquage de la
// tab bar, le fixe en haut et en bas, le bureau, le clair/sombre, les skins et le mouvement réduit.
// Paramètres : sc=drill (le VRAI module Drill de src/)|live|intro|q|ok|ko|combo|timeout|exam|tight|p3|listen
//              mode=dark|light  skin=<id>  fest=<id>  rm=1
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar, ListenDisc } from "../../src/components/SessionHud.jsx";
import { useSessionTrack } from "../../src/components/useSessionTrack.js";
import { QUESTIONS } from "../../src/data/grammar.js";
import { Drill as RealDrill, WordFam, ConnSort, LinkingBridge, PrepDrill, TrapsQuiz, FalseFriends } from "../../src/features/train/grammar.jsx";
import { StratQuizPage } from "../../src/features/train/strategy.jsx";
import { Daily } from "../../src/features/home/Daily.jsx";
import { ListenP1, ListenP2, ListenP3, ListenP4 } from "../../src/features/listening/Listening.jsx";
import { Part6Drill, Part7Read, TimeSim } from "../../src/features/train/reading.jsx";
import { WordTavern } from "../../src/features/games/WordTavern.jsx";
import { AudioBlitz } from "../../src/features/games/AudioBlitz.jsx";
import { ClueHunter } from "../../src/features/games/ClueHunter.jsx";
import { SentenceBuilder } from "../../src/features/games/SentenceBuilder.jsx";
import { IrregularCrypt, Chronomancer, PassiveForge, RelativeWeaver } from "../../src/features/gauntlet/Gauntlet.jsx";
import { ModalMatch, ModalSort } from "../../src/features/modals/ModalCouncil.jsx";
import { GerInf, PhrasalDojo } from "../../src/features/train/grammar.jsx";
import { fresh } from "../../src/lib/profileSchema.js";
import { playCorrect, playWrong } from "../../src/sounds.js";

var q = new URLSearchParams(location.search);
var SC = q.get("sc") || "live";
var MODE = q.get("mode") || "dark";
var SKIN = q.get("skin") || "";
var FEST = q.get("fest") || "";
var RM = q.get("rm") === "1";
var noop = function () {};
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";

var QS = QUESTIONS.slice(0, 10);
QS[5] = QUESTIONS.find(function (x) { return x.id === "g249"; }) || QS[5];

// Réponses déjà données selon le scénario (rejouées au montage, une seule fois malgré StrictMode).
var PRE = { q: [1, 0, 1], ok: [0, 1], ko: [1, 1, 1, 1, 1, 0], combo: [0, 1, 1, 1], timeout: [1, 1, 0], exam: Array(12).fill(null), tight: [1, 1, 0, 1, 1, 1, 0, 1], p3: [1, 1, 0, 1] };
var FB = { ok: "ok", ko: "ko", combo: "ok", timeout: "timeout" };

function Drill() {
  var track = useSessionTrack();
  var pre = PRE[SC] || [];
  var [ci, setCi] = useState(pre.length ? Math.min(pre.length - (FB[SC] ? 1 : 0), 9) : 0);
  var [sel, setSel] = useState(FB[SC] === "ok" ? -2 : FB[SC] ? -3 : -1);
  var [ph, setPh] = useState(FB[SC] ? "fb" : "q");
  var done = useRef(false);
  useEffect(function () { if (done.current) return; done.current = true; pre.forEach(function (r) { track.record(r === null ? null : !!r); }); }, []);
  var qq = QS[ci % QS.length];
  var picked = sel === -2 ? qq.c : sel === -3 ? (qq.c + 1) % qq.o.length : sel;
  var ok = picked === qq.c;
  function answer(i) {
    if (ph !== "q") return;
    setSel(i); setPh("fb");
    if (i === qq.c) playCorrect(); else playWrong();
    track.record(i === qq.c);
  }
  function next() { setSel(-1); setPh("q"); setCi(ci + 1 >= QS.length ? 0 : ci + 1); if (ci + 1 >= QS.length) track.reset(); }
  var n = SC === "exam" ? 49 : SC === "tight" ? 30 : SC === "p3" ? 18 : QS.length;
  var sub = SC === "exam" ? "Part 5 · Incomplete sentences" : SC === "p3" ? "Conversation 2/6 · Question 1/3" : null;
  var aside = SC === "exam" ? <span className="out" style={{ fontSize: 15, fontWeight: 800, color: "var(--t2)" }}>32:10</span>
    : SC === "timeout" ? <span className="out" style={{ fontSize: 16, fontWeight: 800, color: "var(--red)" }}>0s</span> : null;
  var answerTxt = String.fromCharCode(65 + qq.c) + ". " + qq.o[qq.c];
  return (
    <>
      <SessionTop n={n} cur={Math.max(ci, track.results.length - (ph === "fb" ? 1 : 0))} results={track.results} streak={track.streak}
        groups={SC === "p3" ? [3, 3, 3, 3, 3, 3] : null} sub={sub} aside={aside} onQuit={function () { alert("Leave → back to the hub"); }} />
      <ComboBanner combo={track.combo} />
      <div className={ph === "fb" && !ok ? "sk" : ""} style={{ padding: "8px 16px 0" }}>
        <span className="out" style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, display: "block" }}>{qq.cat}</span>
        <h2 className="qstem" style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.5, marginBottom: 24, marginTop: 8 }}>{qq.s}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{qq.o.map(function (opt, i) {
          var sr = ph === "fb", iS = picked === i, iC = i === qq.c, bg = "var(--bg2)", bd = "var(--bdr)";
          if (sr && iC) { bg = "rgba(0,230,118,.12)"; bd = "var(--green)"; } else if (sr && iS && !iC && SC !== "timeout") { bg = "rgba(255,71,87,.12)"; bd = "var(--red)"; }
          return <button key={i} onClick={function () { answer(i); }} disabled={sr} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: bg, border: "1px solid " + bd, borderRadius: 12, fontSize: 15, color: "var(--t1)", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--t3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--t3)" }}>{String.fromCharCode(65 + i)}</span>{opt}</button>;
        })}</div>
      </div>
      {ph === "fb" && <div style={{ padding: "0 16px" }}>
        <AnswerCard ok={ok && SC !== "timeout"} timeout={SC === "timeout"} answer={answerTxt} why={SC === "p3" ? null : qq.x} />
      </div>}
      {ph === "fb" && <NextBar onNext={next} last={ci === QS.length - 1} />}
    </>
  );
}

function Listen() {
  var [playing, setPlaying] = useState(false);
  var track = useSessionTrack();
  return (
    <>
      <SessionTop n={10} cur={2} results={track.results} streak={track.streak} onQuit={noop} />
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        <div className="out" style={{ fontSize: 11, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 24 }}>Part 2 — Question-Response</div>
        <ListenDisc playing={playing} onPlay={function () { setPlaying(true); setTimeout(function () { setPlaying(false); }, 3200); }} hint="Tap to listen · plays once" />
      </div>
    </>
  );
}

function Intro() {
  return <div className="enter" style={{ padding: "40px 16px", textAlign: "center" }}>
    <h1 className="out" style={{ fontWeight: 900, fontSize: 26, marginBottom: 8 }}>Intro (no session bar)</h1>
    <p style={{ color: "var(--t2)", fontSize: 13 }}>The tab bar must be visible here.</p>
  </div>;
}

// Lots 2 à 6 (2026-09-19/20) : les vrais modules, montés avec des props de banc (?sc=wordfam, ?sc=lisP3…).
var LOT2 = { wordfam: WordFam, connsort: ConnSort, bforge: LinkingBridge, prepdrill: PrepDrill, traps: TrapsQuiz, falsefr: FalseFriends, stratquiz: StratQuizPage, daily: Daily,
  lisP1: ListenP1, lisP2: ListenP2, lisP3: ListenP3, lisP4: ListenP4,
  p6: Part6Drill, p7: Part7Read, timesim: TimeSim,
  tavern: WordTavern, ablitz: AudioBlitz, clue: ClueHunter, sbuild: SentenceBuilder,
  crypt: IrregularCrypt, chrono: Chronomancer, forge: PassiveForge, weaver: RelativeWeaver,
  mmatch: ModalMatch, msort: ModalSort, gerinf: GerInf, pvdojo: PhrasalDojo };

function Frame() {
  var lc = "app" + (MODE === "light" ? " light" : "") + (FEST ? " fest-" + FEST : SKIN ? " skin-" + SKIN : "");
  var common = { u: fresh("Camille", "visitor"), done: function () { return 1; }, back: function () { alert("Back → hub"); }, nav: noop, session: null, closeSession: noop, replaySession: noop, resetCard: noop, onContinue: noop, onReplay: noop };
  var Mod = LOT2[SC];
  var body = Mod ? <Mod {...common} /> : SC === "intro" ? <Intro /> : SC === "listen" ? <Listen /> : SC === "drill" ? <RealDrill {...common} /> : <Drill />;
  return <div className={lc}>
    <style>{CSS}</style>
    {RM && <style>{RM_CSS}</style>}
    <div className="pg-wrap">{body}</div>
    <Tabs cur="train" go={noop} />
  </div>;
}

var el = document.getElementById("root");
(el.__hudRoot || (el.__hudRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
