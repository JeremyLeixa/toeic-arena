// Proto « mémoire du Mentor » (2026-09-17) — un moment pour un élève simulé. Aucun appel réseau.
//   m=letter|home|brief|question|result|ceremony|bestiary|chronicle  p=lea|karim|ines
//   mode=dark|light  skin=<id>  rm=1  ans=auto|right|wrong|none (question)  still=1 (storyboard)
// Envoie ses preuves (français) au comparateur par postMessage.
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { TabsBadge } from "./mentorHub.jsx";
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
  home: { C: Mo.HomeMoment, tab: "home", badge: "mentor" },
  mentor: { C: Mo.MentorMoment, tab: "mentor" },
  plan: { C: Mo.PlanMoment, tab: "mentor" },
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
    return V.homeStrip(x).ev.concat([
      "Home garde tout le reste : Daily Challenge, Quick Start (Review Cards, Grammar Drill), Tip of the day.",
      "Pastille sur l'onglet Mentor dès qu'une quête attend : l'onglet reste accessible en permanence, la pastille n'est jamais un verrou.",
    ]);
  }
  if (m === "mentor") return V.mapBadges(x).ev;
  if (m === "plan") {
    var e = [];
    x.plan.quests.forEach(function (qq, i) {
      var v = V.questView(qq, x, i);
      e.push("Quête " + (i + 1) + " « " + v.title + " » :");
      v.ev.forEach(function (l) { e.push("— " + l); });
    });
    e.push("La 1re quête EST la mission du jour (+15 XP, streak et coffre mission_streak conservés) ; la quête « enjeu » porte le +25 % de l'ancien Today's Focus.");
    e.push("NextStepReco et l'Insight Token liraient le même plan.");
    return e;
  }
  if (m === "brief") return V.briefing(x).ev;
  if (m === "question") {
    var r = x.outcome.results[x.qIndex], ok = ANS === "auto" ? r.ok : ANS === "right";
    var f = ANS === "none" ? null : V.questionFeedback(x, r.q, ok), out = [];
    if (r.q.item) out.push("Créature " + r.q.k + " : ratée " + r.q.item.fails + " fois depuis le " + fmtDay(r.q.item.first) + ", " + r.q.item.box + " réussite(s) espacée(s), échéance " + fmtDay(r.q.item.due) + ".");
    else out.push("Question « " + r.q.role + " » (" + (r.q.cat || r.q.label) + ").");
    out.push("Simulation : " + (r.ok ? "réussie" : "ratée") + (ANS !== "auto" && ANS !== "none" ? " ; affichage forcé : " + (ok ? "réussie" : "ratée") : "") + ".");
    out.push("Rendu sur le HUD de session livré aujourd'hui : pastille de mémoire dans le slot `sub` de SessionTop, phrase d'Aldric dans l'AnswerCard, NextBar en pied. Au câblage : demander un slot `note` à l'AnswerCard.");
    return f ? out.concat(f.ev) : out;
  }
  if (m === "result") {
    var lines = V.remember(x).ev.concat(["XP et étapes : vraies portes (gateSteps + settleXp de lib/xp.js), module « " + x.outcome.modId + " ».", "Au câblage, la carte irait juste sous le parchemin, avant « Lessons to keep »."]);
    if (x.outcome.modId === "review") lines = lines.concat(V.huntXpNote(x.outcome.slain.length).ev);
    return lines;
  }
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
      {mo.tab && (mo.badge ? <TabsBadge cur={mo.tab} badge={mo.badge} /> : <Tabs cur={mo.tab} go={noop} />)}
    </div>
  );
}

var el = document.getElementById("root");
(el.__mmRoot || (el.__mmRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
