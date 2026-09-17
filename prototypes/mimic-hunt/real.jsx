// Banc du VRAI module Mimic Hunt (src/features/games/MimicHunt.jsx), sans base ni compte.
// La session de fin est construite comme settleSession dans App() : gateSteps puis settleXp.
//   mode=dark|light  skin=<id>  rm=1 (mouvement réduit)
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { MimicHunt } from "../../src/features/games/MimicHunt.jsx";

var q = new URLSearchParams(location.search);
var MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "", RM = q.get("rm") === "1";
var RM_CSS = "*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}";
var NOW = new Date(2026, 8, 17, 15, 0, 0);
var TD = NOW.toISOString().split("T")[0];

function player() {
  var u = fresh("Camille", "idrac2026");
  Object.assign(u, { tutorialPending: false, gdprConsent: true, joinedAt: "2026-09-01", lastActive: TD, streak: 4, xp: 5200, weeklyXp: 420 });
  return u;
}

function buildSession(sc, tot, xp, id) {
  var u = player();
  var g = gateSteps(xp, sc, tot, "mimic", { u: u, now: NOW, events: [], spotlight: true });
  var st = settleXp(u, g.xp, { now: NOW, events: [], classMedianXp: 0, leagueOf: getLeague });
  return {
    id: id, sp: "mimic", modId: "mimic", sc: sc, tot: tot, userName: u.name,
    steps: g.steps.concat(st.steps), total: st.amt, fromXp: u.xp, toXp: st.c.xp,
    levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: u.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
    chests: [], achievements: [], marks: [],
  };
}

function Bench() {
  var [run, setRun] = useState(0);
  var [session, setSession] = useState(null);
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      {RM && <style>{RM_CSS}</style>}
      <MimicHunt key={run}
        session={session}
        done={function (sc, tot, xp) { var s = buildSession(sc, tot, xp, run + 1); setSession(s); console.log("[bench] done", sc + "/" + tot, "base", xp, "→", s.total, "XP"); return s.id; }}
        closeSession={function () { setSession(null); }}
        replaySession={function () { setSession(null); setRun(function (n) { return n + 1; }); }}
        back={function () { setSession(null); setRun(function (n) { return n + 1; }); }} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Bench /></StrictMode>);
