// Banc du VRAI Drill composé par le plan (lot 5, 2026-09-18) : briefing, mémoire dans la question,
// « Aldric remembers » avant les leçons, et la cérémonie « faiblesse devenue force ». Élève simulé du proto
// (personas.js), horloge figée au 21/09/2026 (clock.js), session de fin construite comme settleSession.
//   p=lea|karim|ines  mode=dark|light  turn=1 (force la cérémonie sur la 1re catégorie de la manche)
import "./clock.js";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { dayMission, celebrateTurn } from "../../src/lib/planner.js";
import { Drill } from "../../src/features/train/grammar.jsx";
import { buildPersona } from "./personas.js";

var q = new URLSearchParams(location.search);
var P = q.get("p") || "lea", MODE = q.get("mode") || "dark", TURN = q.get("turn") === "1";
var noop = function () {};

var U = JSON.parse(JSON.stringify(buildPersona(P).before));
// fold=1 : deux échéances de grammaire seulement (sous le seuil de la chasse) → glissées dans la manche,
// l'une ratée deux fois déjà (le 3e échec propose la fiche de grammaire).
if (q.get("fold") === "1") {
  U.review = { slain: 3, log: [], items: [
    { k: "drill:g4", cat: "Word Families", part: "p5", first: "2026-09-09", last: "2026-09-18", miss: 2, fails: 2, box: 0, due: "2026-09-20" },
    { k: "drill:g1", cat: "Passive Voice", part: "p5", first: "2026-09-12", last: "2026-09-18", miss: 1, fails: 1, box: 1, due: "2026-09-21" },
  ] };
}
U.mission = dayMission(U, new Date());

function Bench() {
  var [session, setSession] = useState(null);
  var [out, setOut] = useState(null);
  function done(sc, tot, xp, catStats, mistakes, hits) {
    var now = new Date();
    var g = gateSteps(xp, sc, tot, "drill", { u: U, now: now, events: [] });
    var st = settleXp(U, g.xp, { now: now, events: [], classMedianXp: 0, leagueOf: getLeague });
    var c = JSON.parse(JSON.stringify(U));
    var turn = celebrateTurn(c, now);
    // turn=1 : pas de retournement prouvable dans la simulation d'aujourd'hui → une cérémonie de démonstration.
    if (!turn && TURN) turn = { cat: Object.keys(catStats)[0] || "Conditionals", then: { c: 3, t: 11 }, now: { c: 11, t: 13 },
      spark: [0.2, 0.3, 0.25, 0.4, 0.5, 0.8, 0.9, 0.85].map(function (a, i) { return { acc: a, up: i >= 5 }; }) };
    setSession({
      id: 11, sp: "drill", modId: "drill", sc: sc, tot: tot, userName: U.name, turn: turn,
      steps: g.steps.concat(st.steps), total: st.amt, fromXp: U.xp, toXp: st.c.xp,
      levelUp: st.levelUp, leagueUp: st.leagueUp, weekly: { from: U.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak,
      chests: [], achievements: [], marks: [],
    });
    setOut({ catStats: catStats, mistakes: mistakes.map(function (m) { return m.ref && m.ref.k; }), hits: hits });
    return 11;
  }
  var lc = "app" + (MODE === "light" ? " light" : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <div className="pg-wrap">
        <Drill u={U} nav={noop} done={done} session={session} closeSession={noop} replaySession={noop} back={function () { alert("Back → Train"); }} />
      </div>
      {out && <pre id="drill-out" style={{ display: "none" }}>{JSON.stringify(out)}</pre>}
    </div>
  );
}

var el = document.getElementById("root");
(el.__drillRoot || (el.__drillRoot = createRoot(el))).render(<StrictMode><Bench /></StrictMode>);
