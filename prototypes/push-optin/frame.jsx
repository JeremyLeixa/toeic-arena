// Un téléphone du comparateur « Demande de notifications » (2026-09-24). Hors build, rien dans src/.
// Vraie Home (élèves simulés et horloge figée du proto mentor-memory) et vrai écran de fin (banc victory).
//   v=A|B|C  st=ask|ios|granted|denied  p=lea|karim|ines  mode=dark|light  skin=<id>  rm=1
import "../mentor-memory/clock.js";
import { StrictMode, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { CSS } from "../../src/styles/appCss.js";
import { Tabs } from "../../src/components/Tabs.jsx";
import { Home } from "../../src/features/home/Home.jsx";
import { SessionResult } from "../../src/components/SessionResult.jsx";
import { GIcon } from "../../src/components/icons.jsx";
import { dayMission, todayMission } from "../../src/lib/planner.js";
import { gateSteps, settleXp } from "../../src/lib/xp.js";
import { getLeague } from "../../src/lib/league.js";
import { today } from "../../src/lib/util.js";
import { buildPersona } from "../mentor-memory/personas.js";
import { SCENARIOS, NOW } from "../victory/scenarios.js";
import "./push-optin.css";

var q = new URLSearchParams(location.search);
var V = q.get("v") || "A", ST = q.get("st") || "ask", P = q.get("p") || "lea";
var MODE = q.get("mode") || "dark", SKIN = q.get("skin") || "", RM = q.get("rm") === "1";

// Les trois notifications qui existent vraiment (Edge Functions) : le texte n'en promet pas d'autre.
var WHAT = [
  { ic: "flame", t: "8 pm, only if your streak is about to break" },
  { ic: "scroll-unfurled", t: "Monday morning, when Aldric's letter is ready" },
  { ic: "castle", t: "If you've been away for a week" },
];

// Étape du navigateur, simulée : c'est elle qui décide, et un « Block » y est définitif.
function BrowserAsk(props) {
  return (
    <div className="po-os-back">
      <div className="po-os">
        <div className="po-os-h">app.verse-arena.fr wants to</div>
        <div className="po-os-row"><span className="po-os-bell">{"🔔"}</span>Show notifications</div>
        <div className="po-os-btns">
          <button onClick={props.onBlock}>Block</button>
          <button className="po-os-ok" onClick={props.onAllow}>Allow</button>
        </div>
        <div className="po-os-note">{"(simulé : la vraie boîte vient du navigateur)"}</div>
      </div>
    </div>
  );
}

// La même mécanique pour les trois variantes : proposer → boîte du navigateur → confirmé ou refus respecté.
function useOffer(nav) {
  var [st, setSt] = useState(ST); // ask | ios | asking | granted | denied | later
  var [toast, setToast] = useState(null);
  return {
    st: st, toast: toast,
    turnOn: function () { if (st === "ios") { nav("install guide (écran d'installation de l'onboarding)"); return; } setSt("asking"); },
    later: function () { setSt("later"); setToast("Not now → reproposé dans 5 jours, 3 fois au plus"); },
    allow: function () { setSt("granted"); setToast("Reminders on. Change it anytime in Profile."); },
    block: function () { setSt("denied"); setToast("Refus du navigateur : plus jamais redemandé (Profil explique comment le rouvrir)"); },
    clearToast: function () { setToast(null); },
  };
}

// A — une ligne sous la porte : ne coûte pas le budget d'interruptions, reste jusqu'à réponse.
function OfferLine(props) {
  var o = props.o, ios = o.st === "ios";
  if (o.st !== "ask" && o.st !== "ios") return null;
  return (
    <div className="po-line">
      <span className="po-line-ic"><GIcon name="ringing-bell" size={20} color="var(--cyan)" /></span>
      <div className="po-line-txt">
        <div className="po-line-t">{ios ? "Get reminders on iPhone" : "Don't lose your streak"}</div>
        <div className="po-line-s">{ios ? "Add Verse Arena to your home screen first: iPhone only sends reminders to installed apps." : "A nudge at 8 pm if you haven't played, and Aldric's Monday letter. Nothing else."}</div>
      </div>
      <div className="po-line-btns">
        <button className="po-go" onClick={o.turnOn}>{ios ? "Show me" : "Turn on"}</button>
        <button className="po-x" aria-label="Not now" onClick={o.later}>{"×"}</button>
      </div>
    </div>
  );
}

// B — la feuille d'Aldric à l'entrée sur Home : un plein écran « non demandé », donc l'emplacement du budget.
function OfferSheet(props) {
  var o = props.o, ios = o.st === "ios";
  if (o.st !== "ask" && o.st !== "ios") return null;
  return (
    <div className="po-sheet-back">
      <div className="po-sheet">
        <div className="po-sheet-grip" />
        <div className="po-sheet-eyebrow">Aldric</div>
        <div className="po-sheet-t">{"A word before you go, " + props.name + "."}</div>
        <div className="po-sheet-s">{ios ? "I can remind you, but iPhone only lets installed apps do it. Add Verse Arena to your home screen, then I'll ask again." : "I can send you a short reminder, only when it matters:"}</div>
        {!ios && <div className="po-what">{WHAT.map(function (w) { return (
          <div key={w.t} className="po-what-row"><GIcon name={w.ic} size={16} color="var(--cyan)" /><span>{w.t}</span></div>); })}</div>}
        <button className="btn1 po-sheet-go" onClick={o.turnOn}>{ios ? "Show me how" : "Turn on reminders"}</button>
        <button className="po-sheet-later" onClick={o.later}>Not now</button>
        <div className="po-sheet-foot">You can change this anytime in Profile.</div>
      </div>
    </div>
  );
}

// C — une ligne dans le parchemin de fin, au moment où l'élève vient de gagner.
function OfferInResult(props) {
  var o = props.o, ios = o.st === "ios";
  if (o.st === "granted") return <div className="po-res po-res-done"><GIcon name="ringing-bell" size={16} color="var(--green)" /><span>{"Reminder set for tomorrow, 8 pm, if you haven't played."}</span></div>;
  if (o.st !== "ask" && o.st !== "ios") return null;
  return (
    <div className="po-res">
      <GIcon name="ringing-bell" size={18} color="var(--cyan)" />
      <span className="po-res-t">{ios ? "Want a nudge tomorrow? On iPhone, add the app to your home screen first." : "Keep it going: a nudge tomorrow at 8 pm if you haven't played."}</span>
      <button className="po-go" onClick={o.turnOn}>{ios ? "Show me" : "Remind me"}</button>
    </div>
  );
}

// A : la ligne s'insère juste sous la porte de la VRAIE Home (portail après .hm-also, sinon en tête), sans la modifier.
function AfterDoor(props) {
  var [host, setHost] = useState(null);
  useLayoutEffect(function () {
    var anchor = document.querySelector(".hm-also") || document.querySelector(".hm-head");
    if (!anchor) return;
    var d = document.createElement("div");
    anchor.parentNode.insertBefore(d, anchor);
    setHost(d);
    return function () { d.remove(); };
  }, []);
  return host ? createPortal(props.children, host) : null;
}

function persona() {
  var u = JSON.parse(JSON.stringify(buildPersona(P).before));
  u.mission = dayMission(u, new Date());
  u.daily = { date: null, done: false };
  u.lastActive = today();
  return u;
}

function buildSession() {
  var sc = SCENARIOS.find(function (x) { return x.id === "solid"; }) || SCENARIOS[0];
  var u = sc.user;
  var g = gateSteps(sc.base, sc.sc, sc.tot, sc.mod.id, { u: u, now: NOW, events: [], spotlight: true });
  var st = settleXp(u, g.xp, { now: NOW, events: [], classMedianXp: 0, leagueOf: getLeague });
  return { sc: sc, s: { id: 7, sp: sc.mod.id, modId: sc.mod.id, sc: sc.sc, tot: sc.tot, userName: u.name,
    steps: g.steps.concat(st.steps), total: st.amt, fromXp: u.xp, toXp: st.c.xp, levelUp: st.levelUp, leagueUp: null,
    weekly: { from: u.weeklyXp, to: st.c.weeklyXp }, streak: st.c.streak, chests: [], achievements: [], marks: [] } };
}

function Frame() {
  var [u] = useState(persona);
  var [tab, setTab] = useState("home");
  var [went, setWent] = useState(null);
  var [run, setRun] = useState(0);
  function nav(id) { setWent("nav(\"" + id + "\")"); }
  var o = useOffer(nav);
  var res = useMemo(buildSession, []);
  var m = todayMission(u, new Date());
  var lc = "app" + (MODE === "light" ? " light" : "") + (SKIN ? " skin-" + SKIN : "") + (RM ? " rm" : "");
  var msg = went || o.toast;
  return (
    <div className={lc}>
      <style>{CSS + (RM ? "*,*::before,*::after{animation:none!important;transition:none!important}" : "")}</style>
      {V === "C"
        ? <SessionResult key={run} session={res.s} sid={res.s.id} name={res.sc.mod.name} mode="score" mistakes={res.sc.mistakes}
            onContinue={function () { setRun(function (n) { return n + 1; }); }} onReplay={function () { setRun(function (n) { return n + 1; }); }}>
            <OfferInResult o={o} />
          </SessionResult>
        : <div className="pg-wrap">
            {tab === "home"
              ? <Home u={u} nav={nav} tabGo={function (t) { setWent("tabGo(\"" + t + "\")"); }} festId={null}
                  onFestivalsOff={function () {}} events={[]} medianXp={0} pendingChests={0} pendingChestTier={0}
                  openPath={function () { setWent("openPath"); }} onOpenChest={function () {}} />
              : <div style={{ padding: 40, color: "var(--t2)", textAlign: "center" }}>{"Onglet " + tab + " (hors proto)"}</div>}
            {V === "A" && tab === "home" && <AfterDoor><OfferLine o={o} /></AfterDoor>}
          </div>}
      {V === "B" && tab === "home" && <OfferSheet o={o} name={u.name} />}
      {o.st === "asking" && <BrowserAsk onAllow={o.allow} onBlock={o.block} />}
      {msg && <div className="po-toast" onClick={function () { setWent(null); o.clearToast(); }}>{"→ " + msg + " — tap"}</div>}
      {V !== "C" && <Tabs cur={tab} go={setTab} badge={m && m.quests.length && !m.done ? "mentor" : null} />}
    </div>
  );
}

var el = document.getElementById("root");
(el.__appRoot || (el.__appRoot = createRoot(el))).render(<StrictMode><Frame /></StrictMode>);
