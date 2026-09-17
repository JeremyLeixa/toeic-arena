// Proto « mémoire du Mentor » (2026-09-17) — un moment pour un élève simulé. Aucun appel réseau.
//   m=letter|home|brief|question|result|ceremony|bestiary|chronicle  p=lea|karim|ines
//   mode=dark|light  skin=<id>  rm=1  ans=auto|right|wrong|none (question)  still=1 (storyboard)
// Envoie ses preuves (français) au comparateur par postMessage.
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { buildPersona } from "./personas.js";
import * as Mo from "./moments.jsx";
import * as V from "./voice.js";
import { fmtDay } from "./model.js";
import MEMORY from "./memory.css?raw";

var q = new URLSearchParams(location.search);
var M = q.get("m") || "home", P = q.get("p") || "lea", MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";
var RM = q.get("rm") === "1", ANS = q.get("ans") || "auto", STILL = q.get("still") === "1";
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";
var noop = function () {};

var MOMENTS = {
  letter: { C: Mo.LetterMoment, tab: null },
  home: { C: Mo.HomeMoment, tab: "home" },
  brief: { C: Mo.BriefMoment, tab: null },
  question: { C: Mo.QuestionMoment, tab: null },
  result: { C: Mo.ResultMoment, tab: null },
  ceremony: { C: Mo.CeremonyMoment, tab: null },
  bestiary: { C: Mo.BestiaryMoment, tab: "mentor" },
  chronicle: { C: Mo.ChronicleMoment, tab: "mentor" },
};

function evidence(m, x) {
  if (m === "letter") return V.letter(x).ev;
  if (m === "home") {
    var e = V.greeting(x).ev.slice();
    x.plan.quests.forEach(function (qq, i) {
      var v = V.questView(qq, x);
      e.push("Quête " + (i + 1) + " « " + v.title + " » :");
      v.ev.forEach(function (l) { e.push("— " + l); });
    });
    e.push("Remplace Daily Mission et Today's Focus ; NextStepReco et l'Insight Token liraient le même plan.");
    return e;
  }
  if (m === "brief") return V.briefing(x).ev;
  if (m === "question") {
    var r = x.outcome.results[x.qIndex], ok = ANS === "auto" ? r.ok : ANS === "right";
    var f = ANS === "none" ? null : V.questionFeedback(x, r.q, ok), out = [];
    if (r.q.item) out.push("Créature " + r.q.k + " : ratée " + r.q.item.fails + " fois depuis le " + fmtDay(r.q.item.first) + ", " + r.q.item.box + " réussite(s) espacée(s), échéance " + fmtDay(r.q.item.due) + ".");
    else out.push("Question « " + r.q.role + " » (" + (r.q.cat || r.q.label) + ").");
    out.push("Simulation : " + (r.ok ? "réussie" : "ratée") + (ANS !== "auto" && ANS !== "none" ? " ; affichage forcé : " + (ok ? "réussie" : "ratée") : "") + ".");
    return f ? out.concat(f.ev) : out;
  }
  if (m === "result") return V.remember(x).ev.concat(["XP et étapes : vraies portes (gateSteps + settleXp de lib/xp.js), module « " + x.outcome.modId + " ».", "Au câblage, la carte irait juste sous le parchemin, avant « Lessons to keep »."]);
  if (m === "ceremony") { var c = V.ceremony(x); return c.none ? ["Aucune catégorie ne remplit la règle aujourd'hui : pas de cérémonie."] : c.ev; }
  if (m === "bestiary") return V.bestiaryView(x).ev;
  if (m === "chronicle") return V.chronicleView(x).ev;
  return [];
}

function Frame() {
  var x = buildPersona(P), mo = MOMENTS[M] || MOMENTS.home;
  useEffect(function () {
    try { window.parent.postMessage({ type: "mm-ev", m: M, p: P, lines: evidence(M, x) }, "*"); }
    catch (e) { console.warn("[mentor-memory] preuves:", e && e.message); }
  }, [x]);
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  var C = mo.C;
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <style>{MEMORY}</style>
      {RM && <style>{RM_CSS}</style>}
      <C x={x} qi={x.qIndex} ans={ANS} still={STILL} />
      {mo.tab && <Tabs cur={mo.tab} go={noop} />}
    </div>
  );
}

var el = document.getElementById("root");
(el.__mmRoot || (el.__mmRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
