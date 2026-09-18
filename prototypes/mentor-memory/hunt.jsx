// Banc de la VRAIE chasse aux erreurs (src/features/hunt/MistakeHunt.jsx), sans base ni compte (2026-09-18).
// Un bestiaire fabriqué à partir des vraies banques : grammaire, Part 1, Part 2, Part 3 (sous-question),
// Part 6 (trou), et un passage Part 7 à deux questions (regroupées : le passage n'est lu qu'une fois).
// La session de fin est construite comme settleSession dans App() : gateSteps puis settleXp (lib/xp.js),
// avec `slain` en extra.
//   mode=dark|light  skin=<id>  empty=1 (rien d'échu)  box=1|2 (réussites espacées déjà acquises ; 2 = la prochaine tue)
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { fresh } from "../../src/lib/profileSchema.js";
import { addDays } from "../../src/lib/learnerModel.js";
import { today } from "../../src/lib/util.js";
import { QUESTIONS } from "../../src/data/grammar.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3 } from "../../src/data/listening.js";
import { MistakeHunt } from "../../src/features/hunt/MistakeHunt.jsx";

var q = new URLSearchParams(location.search);
var MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";
var EMPTY = q.get("empty") === "1", BOX = parseInt(q.get("box") || "0", 10);
var noop = function () {};

var D = today(new Date());
function item(k, extra) {
  // Ratée il y a 3 jours, échue aujourd'hui ; box=N : déjà réussie N fois (box=2 : la prochaine la tue).
  return Object.assign({ k: k, cat: null, part: null, first: addDays(D, -9), last: addDays(D, -3), miss: 1, fails: 1, box: BOX, due: EMPTY ? addDays(D, 2) : D }, extra || {});
}
var g1 = QUESTIONS[3], g2 = QUESTIONS.find(function (x) { return x.cat !== g1.cat; });
var ITEMS = [
  item("drill:" + g1.id, { cat: g1.cat, part: "p5", miss: 3, fails: 4, first: addDays(D, -20) }),
  item("drill:" + g2.id, { cat: g2.cat, part: "p5", miss: 2, fails: 2 }),
  item("lisP1:" + LISTENING_P1[0].id, { part: "p1" }),
  item("lisP2:" + LISTENING_P2[0].id, { part: "p2" }),
  item("lisP3:" + LISTENING_P3[0].id + ":1", { part: "p3" }),
  item("p6:p6t1:2", { part: "p6" }),
  item("p7:p7p1:0", { part: "p7" }),
  item("p7:p7p1:1", { part: "p7" }),
];
var U = Object.assign(fresh("Camille", "visitor"), { xp: 640, weeklyXp: 120, streak: 3, lastActive: addDays(D, -1),
  review: { items: ITEMS, slain: 4, log: [] } });

function Bench() {
  var [session, setSession] = useState(null);
  var [out, setOut] = useState(null);
  function done(sc, tot, xp, payload) {
    var now = new Date();
    var g = gateSteps(xp, sc, tot, "hunt", { u: U, now: now, events: [] });
    var st = settleXp(U, g.xp, { now: now, events: [], classMedianXp: 0, leagueOf: getLeague });
    setSession({
      id: 9, sp: "hunt", modId: "hunt", sc: sc, tot: tot, userName: U.name, slain: payload.slain,
      steps: g.steps.concat(st.steps), total: st.amt, fromXp: U.xp, toXp: st.c.xp,
      levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: U.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
      chests: [], achievements: [], marks: payload.darics ? [{ amount: payload.darics, label: "Creatures slain" }] : [],
    });
    setOut(payload);
    return 9;
  }
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <div className="pg-wrap">
        <MistakeHunt u={U} nav={noop} done={done} session={session} closeSession={noop}
          back={function () { alert("Back → Mentor"); }} />
      </div>
      {out && <pre id="hunt-out" style={{ display: "none" }}>{JSON.stringify(out)}</pre>}
    </div>
  );
}

var el = document.getElementById("root");
(el.__huntRoot || (el.__huntRoot = createRoot(el))).render(<StrictMode><Bench /></StrictMode>);
