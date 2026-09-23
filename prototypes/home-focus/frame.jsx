// Un téléphone du comparateur « Home à un seul bouton » (2026-09-23). Élèves simulés et horloge figée
// du proto mentor-memory (lundi 21/09/2026, 8 h 30), vraie CSS, vraie barre d'onglets.
//   v=A|B|C|D  sc=busy|typical|done|new  p=lea|karim|ines  mode=dark|light  skin=<id>  rm=1
import "../mentor-memory/clock.js";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { Home } from "../../src/features/home/Home.jsx";
import { dayMission, todayMission } from "../../src/lib/planner.js";
import { today } from "../../src/lib/util.js";
import { buildPersona } from "../mentor-memory/personas.js";
import { HomeOneDoor, HomePruned, HomeAgenda } from "./variants.jsx";
import "./home-focus.css";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "A", SC = q.get("sc") || "busy", P = q.get("p") || "lea";
var MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "", RM = q.get("rm") === "1";

function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

// Situations : ce qui s'empile réellement sur Home un jour donné.
function scenario() {
  var u = JSON.parse(JSON.stringify(buildPersona(P).before));
  u.mission = dayMission(u, new Date());
  u.daily = { date: null, done: false };
  u.lastActive = today();
  var s = { u: u, chests: 0, tier: 0, events: [], fest: null };
  if (SC === "busy") {
    u.lastActive = yesterday();
    s.chests = 2; s.tier = 2; s.fest = "halloween";
    s.events = [{ type: "flash_hour", title: "Flash Hour", config: { multiplier: 2 }, end_at: new Date(Date.now() + 2 * 36e5).toISOString() }];
  }
  if (SC === "done") {
    u.mission.done = true;
    u.dailyModSessions = Object.assign({}, u.dailyModSessions);
    u.mission.quests.forEach(function (x) { u.dailyModSessions[x.mod + "_" + today()] = 1; });
    u.daily = { date: today(), done: true, xpE: 112 };
  }
  if (SC === "new") {
    u.mockResults = {};
    u.joinedAt = new Date(Date.now() - 5 * 864e5).toISOString();
    u.streak = 2;
  }
  return s;
}

var VARIANT = { A: Home, B: HomeOneDoor, C: HomePruned, D: HomeAgenda };

function Frame() {
  var [s] = useState(scenario);
  var [tab, setTab] = useState("home");
  var [went, setWent] = useState(null);
  var H = VARIANT[V] || Home, u = s.u, m = todayMission(u, new Date());
  function nav(id) { setWent("nav(\"" + id + "\")"); }
  var lc = "app" + (MODE === "light" ? " light" : "") + (s.fest ? " fest-" + s.fest : SKIN ? " skin-" + SKIN : "") + (RM ? " rm" : "");
  return (
    <div className={lc}>
      <style>{CSS + (RM ? "*,*::before,*::after{animation:none!important;transition:none!important}" : "")}</style>
      <div className="pg-wrap">
        {tab === "home"
          ? <H u={u} nav={nav} tabGo={function (t) { setWent("tabGo(\"" + t + "\")"); }} festId={s.fest}
              onFestivalsOff={function () { setWent("Turn off festival"); }} events={s.events} medianXp={0}
              pendingChests={s.chests} pendingChestTier={s.tier}
              openPath={function () { setWent("openPath → Mentor, Today's Path"); }}
              onOpenChest={function () { setWent("open chest"); }} />
          : <div style={{ padding: 40, color: "var(--t2)", textAlign: "center" }}>{"Onglet " + tab + " (hors proto)"}</div>}
      </div>
      {went && <div onClick={function () { setWent(null); }} style={{ position: "fixed", top: 8, left: 8, right: 8, zIndex: 99999, padding: "8px 12px", borderRadius: 10, background: "#111", color: "#fff", fontSize: 12 }}>{"→ " + went + " — tap"}</div>}
      <Tabs cur={tab} go={setTab} badge={m && m.quests.length && !m.done ? "mentor" : null} />
    </div>
  );
}

var el = document.getElementById("root");
(el.__appRoot || (el.__appRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
