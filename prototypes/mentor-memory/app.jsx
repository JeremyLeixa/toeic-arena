// Banc du VRAI Mentor du lot 4 (2026-09-18) : src/features/home/Home.jsx, src/features/mentor/Mentor.jsx
// et src/components/Tabs.jsx, sans base ni compte, sur un élève simulé du proto. La mission du jour est
// posée comme dans App() (lib/planner.js dayMission). Les onglets Home ↔ Mentor marchent ; un tap sur une
// quête ou « Hunt » affiche la destination au lieu de naviguer.
//   p=lea|karim|ines  v=home|mentor|path|camp  mode=dark|light  skin=<id>
//   done=1 (mission faite)  reroll=1 (mission déplacée sur la quête 2)
import "./clock.js";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { Home } from "../../src/features/home/Home.jsx";
import { Mentor } from "../../src/features/mentor/Mentor.jsx";
import { dayMission, rerollMission, todayMission } from "../../src/lib/planner.js";
import { today } from "../../src/lib/util.js";
import { buildPersona } from "./personas.js";

var q = new URLSearchParams(location.search);
var P = q.get("p") || "lea", V0 = q.get("v") || "home", MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "";

function makeUser() {
  var u = JSON.parse(JSON.stringify(buildPersona(P).before));
  u.mission = dayMission(u, new Date());
  if (q.get("reroll") === "1") u.mission = rerollMission(u.mission) || u.mission;
  if (q.get("done") === "1") {
    u.mission.done = true;
    u.dailyModSessions = Object.assign({}, u.dailyModSessions);
    u.dailyModSessions[u.mission.actId + "_" + today()] = 1;
  }
  return u;
}

function Bench() {
  var [u, setU] = useState(makeUser);
  var [tab, setTab] = useState(V0 === "home" ? "home" : "mentor");
  var [sheet, setSheet] = useState(V0 === "path" ? "path" : null);
  var [went, setWent] = useState(null);
  var m = todayMission(u, new Date());
  var badge = m && m.quests.length && !m.done ? "mentor" : null;
  function nav(id) { setWent(id); }
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "");
  return (
    <div className={lc}>
      <style>{CSS}</style>
      <div className="pg-wrap">
        {tab === "home" && <Home u={u} nav={nav} tabGo={setTab} festId={null} onFestivalsOff={function () {}} events={[]} medianXp={0}
          pendingChests={0} pendingChestTier={0} openPath={function () { setSheet("path"); setTab("mentor"); }} onOpenChest={function () {}}
          onMount={function () {}} onLeave={function () {}} />}
        {tab === "mentor" && <Mentor key={sheet || "none"} u={u} nav={nav} tabGo={setTab} initialSheet={sheet}
          setUser={setU} replayNarrator={function () {}} />}
      </div>
      {went && <div id="bench-went" style={{ position: "fixed", top: 8, left: 8, right: 8, zIndex: 99999, padding: "8px 12px", borderRadius: 10, background: "#111", color: "#fff", fontSize: 12 }}
        onClick={function () { setWent(null); }}>{"→ nav(\"" + went + "\") — tap to dismiss"}</div>}
      <Tabs cur={tab} go={function (t) { setSheet(null); setTab(t); }} badge={badge} />
    </div>
  );
}

var el = document.getElementById("root");
(el.__appRoot || (el.__appRoot = createRoot(el))).render(<StrictMode><Bench /></StrictMode>);
