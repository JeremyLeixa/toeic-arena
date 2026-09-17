// Banc du VRAI écran de fin (src/components/SessionResult.jsx), sans base ni compte (2026-09-17).
// La session est construite comme settleSession dans App() : gateSteps puis settleXp de lib/xp.js.
//   sc=<scénario de scenarios.js>  mode=dark|light  skin=<id>  rm=1  seal=1 (sid ≠ id : parchemin d'attente)
//   honors=1 (trophée + Darics simulés)  points=1 (jeu noté en points)
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { getTriggerLabel } from "../../src/lib/chestLabels.js";
import { SessionResult } from "../../src/components/SessionResult.jsx";
import { NextStepReco } from "../../src/components/NextStepReco.jsx";
import { SCENARIOS, NOW } from "./scenarios.js";

var q = new URLSearchParams(location.search);
var SC = q.get("sc") || "promotion", MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";
var RM = q.get("rm") === "1", SEAL = q.get("seal") === "1", HONORS = q.get("honors") === "1", POINTS = q.get("points") === "1";
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";
var TIER = { novice: 0, guerrier: 1, champion: 2, legendaire: 3 };
var noop = function () {};

function buildSession(sc) {
  var u = sc.user, events = [];
  var g = gateSteps(sc.base, sc.sc, sc.tot, sc.mod.id, { u: u, now: NOW, events: events, spotlight: true });
  var st = settleXp(u, g.xp, { now: NOW, events: events, classMedianXp: 0, leagueOf: getLeague });
  return {
    id: 7, sp: sc.mod.id, modId: sc.mod.id, sc: sc.sc, tot: sc.tot, userName: u.name,
    steps: g.steps.concat(st.steps), total: st.amt, fromXp: u.xp, toXp: st.c.xp,
    levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: u.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
    chests: st.chests.map(function (ch) { return { trigger: ch.trigger, type: ch.type, tier: TIER[ch.type] || 0, label: getTriggerLabel(ch.trigger) }; }),
    achievements: HONORS ? [{ name: "Word Collector", desc: "Review 50 flashcards" }] : [],
    marks: HONORS || g.focusHit ? [{ amount: 30, label: g.focusHit ? "Today's Focus" : "Achievement" }] : [],
  };
}

function Bench() {
  var sc = SCENARIOS.find(function (x) { return x.id === SC; }) || SCENARIOS[0];
  var [run, setRun] = useState(0);
  var session = useMemo(function () { return buildSession(sc); }, [sc]);
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      {RM && <style>{RM_CSS}</style>}
      <div className="enter" style={{ padding: 20 }}><h2 className="out">Module underneath</h2><p>Hidden by the result screen.</p></div>
      <SessionResult key={run} session={session} sid={SEAL ? 99 : session.id} name={sc.mod.name}
        mode={POINTS ? "points" : "score"} points={POINTS ? 1240 : undefined} pointsLabel="points"
        mistakes={sc.mistakes} onContinue={function () { console.log("[bench] continue"); setRun(function (n) { return n + 1; }); }}
        onReplay={function () { console.log("[bench] replay"); setRun(function (n) { return n + 1; }); }}>
        <NextStepReco u={sc.user} fromMod={sc.mod.id} nav={noop} />
      </SessionResult>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Bench /></StrictMode>);
